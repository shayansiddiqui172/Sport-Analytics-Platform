#!/usr/bin/env node
/**
 * Player Sync Script for GitHub Actions
 *
 * Syncs all NBA players and season stats from NBA.com's leaguedashplayerstats endpoint.
 * Runs in GitHub Actions with direct DB connection (no pgbouncer, no timeout limits).
 *
 * Usage:
 *   DATABASE_URL="postgres://..." node scripts/sync-players.mjs [season]
 *
 * Environment:
 *   DATABASE_URL - Direct Supabase connection (port 5432, no pgbouncer)
 *   SEASON - Optional season string (e.g. "2024-25"), defaults to current
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const NBA_STATS_BASE = "https://stats.nba.com/stats";
const NBA_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Referer: "https://stats.nba.com/",
  Accept: "application/json, text/plain, */*",
  "x-nba-stats-token": "true",
  "x-nba-stats-origin": "stats",
  Origin: "https://stats.nba.com",
};

/** Get current NBA season string (e.g. "2024-25") */
function getNBASeasonString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  // NBA season starts in October (month 9)
  const startYear = month >= 9 ? year : year - 1;
  const endYear = startYear + 1;
  return `${startYear}-${endYear.toString().slice(-2)}`;
}

/** Fetch with timeout and error handling */
async function fetchNBAStats(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);
  try {
    const res = await fetch(url, {
      headers: NBA_HEADERS,
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`NBA Stats API error: ${res.status}`);
    return res.json();
  } catch (e) {
    clearTimeout(timeout);
    throw e;
  }
}

/** Convert NBA.com resultSet to objects */
function rowsToObjects(headers, rows) {
  return rows.map((row) => {
    const obj = {};
    headers.forEach((header, idx) => {
      obj[header] = row[idx];
    });
    return obj;
  });
}

async function syncPlayers(season) {
  const seasonStr = season || getNBASeasonString();
  console.log(`[sync-players] Starting sync for season ${seasonStr}`);

  // Fetch ALL players + stats in a single API call
  const params = new URLSearchParams({
    MeasureType: "Base",
    PerMode: "PerGame",
    Season: seasonStr,
    SeasonType: "Regular Season",
    LeagueID: "00",
    PlusMinus: "N",
    PaceAdjust: "N",
    Rank: "N",
    Outcome: "",
    Location: "",
    Month: "0",
    SeasonSegment: "",
    DateFrom: "",
    DateTo: "",
    OpponentTeamID: "0",
    VsConference: "",
    VsDivision: "",
    GameSegment: "",
    Period: "0",
    ShotClockRange: "",
    LastNGames: "0",
  });

  const dashUrl = `${NBA_STATS_BASE}/leaguedashplayerstats?${params}`;
  console.log(`[sync-players] Fetching from NBA.com...`);
  const dashData = await fetchNBAStats(dashUrl);
  const dashResultSet = dashData.resultSets?.[0] || dashData.resultSet;

  if (!dashResultSet) {
    throw new Error("No resultSet in leaguedashplayerstats response");
  }

  const allPlayers = rowsToObjects(dashResultSet.headers, dashResultSet.rowSet);
  console.log(`[sync-players] Fetched ${allPlayers.length} players from NBA.com`);

  // Get all teams and create mapping from NBA.com TEAM_ABBREVIATION to BDL team ID
  const teams = await prisma.team.findMany({ select: { id: true, abbreviation: true } });
  const teamAbbrToId = new Map(teams.map((t) => [t.abbreviation, t.id]));
  console.log(`[sync-players] Found ${teams.length} teams in DB`);

  // Use bulk upserts via raw SQL for maximum performance
  // Process in batches of 100
  const BATCH_SIZE = 100;
  let playerCount = 0;
  let statsCount = 0;

  for (let i = 0; i < allPlayers.length; i += BATCH_SIZE) {
    const batch = allPlayers.slice(i, i + BATCH_SIZE);

    // Bulk upsert players
    const playerValues = batch.map((p) => {
      const nameParts = p.PLAYER_NAME.split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";
      // Map NBA.com TEAM_ABBREVIATION to our BDL team ID
      const teamId = teamAbbrToId.get(p.TEAM_ABBREVIATION) || null;

      return `(${p.PLAYER_ID}, '${firstName.replace(/'/g, "''")}', '${lastName.replace(/'/g, "''")}', ${teamId || "NULL"}, '', '')`;
    });

    const playerSql = `
      INSERT INTO "Player" (id, "firstName", "lastName", "teamId", height, weight)
      VALUES ${playerValues.join(", ")}
      ON CONFLICT (id) DO UPDATE SET
        "firstName" = EXCLUDED."firstName",
        "lastName" = EXCLUDED."lastName",
        "teamId" = EXCLUDED."teamId"
    `;

    await prisma.$executeRawUnsafe(playerSql);
    playerCount += batch.length;

    // Bulk upsert player stats
    const statsValues = batch.map((p) => {
      return `(${p.PLAYER_ID}, '${seasonStr}', ${p.GP}, ${p.PTS}, ${p.REB}, ${p.AST}, ${p.STL}, ${p.BLK}, ${p.TOV}, ${p.FG_PCT || 0}, ${p.FG3_PCT || 0}, ${p.FT_PCT || 0}, ${p.MIN}, ${p.FGM}, ${p.FGA}, ${p.FG3M}, ${p.FG3A}, ${p.FTM}, ${p.FTA}, ${p.OREB}, ${p.DREB}, ${p.PF})`;
    });

    const statsSql = `
      INSERT INTO "PlayerStats" ("playerId", season, "gamesPlayed", ppg, rpg, apg, spg, bpg, topg, "fgPct", "threePct", "ftPct", mpg, fgm, fga, fg3m, fg3a, ftm, fta, oreb, dreb, pf)
      VALUES ${statsValues.join(", ")}
      ON CONFLICT ("playerId", season) DO UPDATE SET
        "gamesPlayed" = EXCLUDED."gamesPlayed",
        ppg = EXCLUDED.ppg,
        rpg = EXCLUDED.rpg,
        apg = EXCLUDED.apg,
        spg = EXCLUDED.spg,
        bpg = EXCLUDED.bpg,
        topg = EXCLUDED.topg,
        "fgPct" = EXCLUDED."fgPct",
        "threePct" = EXCLUDED."threePct",
        "ftPct" = EXCLUDED."ftPct",
        mpg = EXCLUDED.mpg,
        fgm = EXCLUDED.fgm,
        fga = EXCLUDED.fga,
        fg3m = EXCLUDED.fg3m,
        fg3a = EXCLUDED.fg3a,
        ftm = EXCLUDED.ftm,
        fta = EXCLUDED.fta,
        oreb = EXCLUDED.oreb,
        dreb = EXCLUDED.dreb,
        pf = EXCLUDED.pf
    `;

    await prisma.$executeRawUnsafe(statsSql);
    statsCount += batch.length;

    console.log(
      `[sync-players] Processed batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(allPlayers.length / BATCH_SIZE)} (${playerCount} players, ${statsCount} stats)`
    );
  }

  console.log(
    `[sync-players] ✅ Complete: ${playerCount} players, ${statsCount} season stats for ${seasonStr}`
  );

  return { players: playerCount, stats: statsCount, season: seasonStr };
}

// Main execution
const season = process.argv[2] || process.env.SEASON;

syncPlayers(season)
  .then((result) => {
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  })
  .catch((error) => {
    console.error("[sync-players] ❌ Error:", error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
