import prisma from "@/lib/db/prisma";
import { getNBASeasonString } from "@/lib/utils/nba-season";

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

interface NBAStatsResponse {
  resultSets?: Array<{
    name: string;
    headers: string[];
    rowSet: any[][];
  }>;
  resultSet?: {
    name: string;
    headers: string[];
    rowSet: any[][];
  };
}

function rowsToObjects<T>(headers: string[], rows: any[][]): T[] {
  return rows.map((row) => {
    const obj: any = {};
    headers.forEach((header, idx) => {
      obj[header] = row[idx];
    });
    return obj as T;
  });
}

interface LeagueLeaderRow {
  PLAYER_ID: number;
  PLAYER: string;
  TEAM_ID: number;
  TEAM: string;
  GP: number;
  MIN: number;
  FGM: number;
  FGA: number;
  FG_PCT: number;
  FG3M: number;
  FG3A: number;
  FG3_PCT: number;
  FTM: number;
  FTA: number;
  FT_PCT: number;
  OREB: number;
  DREB: number;
  REB: number;
  AST: number;
  STL: number;
  BLK: number;
  TOV: number;
  PF: number;
  PTS: number;
}

interface DashPlayerRow {
  PLAYER_ID: number;
  PLAYER_NAME: string;
  TEAM_ID: number;
  TEAM_ABBREVIATION: string;
  GP: number;
  MIN: number;
  FGM: number;
  FGA: number;
  FG_PCT: number;
  FG3M: number;
  FG3A: number;
  FG3_PCT: number;
  FTM: number;
  FTA: number;
  FT_PCT: number;
  OREB: number;
  DREB: number;
  REB: number;
  AST: number;
  STL: number;
  BLK: number;
  TOV: number;
  PF: number;
  PTS: number;
}

interface PlayerInfoRow {
  PERSON_ID: number;
  FIRST_NAME: string;
  LAST_NAME: string;
  DISPLAY_FIRST_LAST: string;
  BIRTHDATE: string;
  SCHOOL: string;
  COUNTRY: string;
  LAST_AFFILIATION: string;
  HEIGHT: string;
  WEIGHT: string;
  SEASON_EXP: number;
  JERSEY: string;
  POSITION: string;
  ROSTERSTATUS: string;
  TEAM_ID: number;
  TEAM_NAME: string;
  TEAM_ABBREVIATION: string;
  TEAM_CODE: string;
  TEAM_CITY: string;
  PLAYERCODE: string;
  FROM_YEAR: number;
  TO_YEAR: number;
  DLEAGUE_FLAG: string;
  GAMES_PLAYED_FLAG: string;
  DRAFT_YEAR: string;
  DRAFT_ROUND: string;
  DRAFT_NUMBER: string;
}

async function fetchNBAStats(url: string): Promise<NBAStatsResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000); // 45s for large player data
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

/**
 * Fetch detailed player info/bio from NBA.com
 */
async function fetchPlayerInfo(playerId: number): Promise<PlayerInfoRow | null> {
  try {
    const url = `${NBA_STATS_BASE}/commonplayerinfo?PlayerID=${playerId}`;
    const data = await fetchNBAStats(url);
    const resultSet = data.resultSets?.find((rs) => rs.name === "CommonPlayerInfo");
    if (!resultSet || resultSet.rowSet.length === 0) return null;
    
    const players = rowsToObjects<PlayerInfoRow>(resultSet.headers, resultSet.rowSet);
    return players[0] || null;
  } catch (e) {
    console.warn(`[sync-players] Failed to fetch info for player ${playerId}:`, e);
    return null;
  }
}

/**
 * Sync players and their season stats from NBA.com.
 * Uses a single API call to leaguedashplayerstats to get ALL active players.
 */
export async function syncPlayers(
  season?: string
): Promise<{ players: number; stats: number }> {
  const seasonStr = season || getNBASeasonString();

  // Single API call to get ALL players + stats (no TeamID filter = all players)
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
  const dashData = await fetchNBAStats(dashUrl);
  const dashResultSet = dashData.resultSets?.[0] || dashData.resultSet;

  if (!dashResultSet) throw new Error("No resultSet in leaguedashplayerstats response");

  const allPlayers = rowsToObjects<DashPlayerRow>(
    dashResultSet.headers,
    dashResultSet.rowSet
  );

  console.log(`[sync-players] Fetched ${allPlayers.length} players from leaguedashplayerstats`);

  // Get all valid team IDs in one query
  const teams = await prisma.team.findMany({ select: { id: true } });
  const validTeamIds = new Set(teams.map(t => t.id));

  // Process players in batches of 50 to avoid timeout
  const BATCH_SIZE = 50;
  let playerCount = 0;
  let statsCount = 0;

  for (let i = 0; i < allPlayers.length; i += BATCH_SIZE) {
    const batch = allPlayers.slice(i, i + BATCH_SIZE);
    
    await prisma.$transaction(async (tx) => {
      for (const p of batch) {
        const nameParts = p.PLAYER_NAME.split(" ");
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || "";
        const teamId = validTeamIds.has(p.TEAM_ID) ? p.TEAM_ID : null;

        await tx.player.upsert({
          where: { id: p.PLAYER_ID },
          update: {
            firstName,
            lastName,
            teamId,
          },
          create: {
            id: p.PLAYER_ID,
            firstName,
            lastName,
            teamId,
            height: "",
            weight: "",
          },
        });

        await tx.playerStats.upsert({
          where: {
            playerId_season: { playerId: p.PLAYER_ID, season: seasonStr },
          },
          update: {
            gamesPlayed: p.GP,
            ppg: p.PTS,
            rpg: p.REB,
            apg: p.AST,
            spg: p.STL,
            bpg: p.BLK,
            topg: p.TOV,
            fgPct: p.FG_PCT,
            threePct: p.FG3_PCT,
            ftPct: p.FT_PCT,
            mpg: p.MIN,
            fgm: p.FGM,
            fga: p.FGA,
            fg3m: p.FG3M,
            fg3a: p.FG3A,
            ftm: p.FTM,
            fta: p.FTA,
            oreb: p.OREB,
            dreb: p.DREB,
            pf: p.PF,
          },
          create: {
            playerId: p.PLAYER_ID,
            season: seasonStr,
            gamesPlayed: p.GP,
            ppg: p.PTS,
            rpg: p.REB,
            apg: p.AST,
            spg: p.STL,
            bpg: p.BLK,
            topg: p.TOV,
            fgPct: p.FG_PCT,
            threePct: p.FG3_PCT,
            ftPct: p.FT_PCT,
            mpg: p.MIN,
            fgm: p.FGM,
            fga: p.FGA,
            fg3m: p.FG3M,
            fg3a: p.FG3A,
            ftm: p.FTM,
            fta: p.FTA,
            oreb: p.OREB,
            dreb: p.DREB,
            pf: p.PF,
          },
        });
      }
    });

    playerCount += batch.length;
    statsCount += batch.length;
    console.log(`[sync-players] Processed batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(allPlayers.length / BATCH_SIZE)}`);
  }

  console.log(
    `[sync-players] Upserted ${playerCount} players, ${statsCount} season stats`
  );
  return { players: playerCount, stats: statsCount };
}
