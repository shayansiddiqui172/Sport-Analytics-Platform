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
  const timeout = setTimeout(() => controller.abort(), 15000);
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
 * Sync players and their season stats from NBA.com league leaders + dash stats.
 * This is the main player data source — it gives us IDs, names, teams, and stats.
 */
export async function syncPlayers(
  season?: string
): Promise<{ players: number; stats: number }> {
  const seasonStr = season || getNBASeasonString();

  // Step 1: Fetch league leaders (all qualified players ~230+)
  const leagueLeadersUrl = `${NBA_STATS_BASE}/leagueleaders?LeagueID=00&PerMode=PerGame&Scope=S&Season=${seasonStr}&SeasonType=Regular%20Season&StatCategory=PTS`;
  const leagueData = await fetchNBAStats(leagueLeadersUrl);

  const resultSet = leagueData.resultSet || leagueData.resultSets?.[0];
  if (!resultSet) throw new Error("No resultSet in league leaders response");

  const leaders = rowsToObjects<LeagueLeaderRow>(
    resultSet.headers,
    resultSet.rowSet
  );

  // Step 2: Get unique team IDs and fetch dash stats for each (complete rosters)
  const teamIds = [...new Set(leaders.map((p) => p.TEAM_ID))];
  const allDashPlayers: DashPlayerRow[] = [];

  for (const teamId of teamIds) {
    try {
      const params = new URLSearchParams({
        MeasureType: "Base",
        PerMode: "PerGame",
        Season: seasonStr,
        SeasonType: "Regular Season",
        TeamID: teamId.toString(),
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
      if (dashResultSet) {
        const players = rowsToObjects<DashPlayerRow>(
          dashResultSet.headers,
          dashResultSet.rowSet
        );
        allDashPlayers.push(...players);
      }
      // Small delay to avoid rate limiting
      await new Promise((r) => setTimeout(r, 600));
    } catch (e) {
      console.warn(`[sync-players] Failed to fetch dash stats for team ${teamId}:`, e);
    }
  }

  // Step 3: Merge — dash players are the complete roster, leaders supplement
  const playerMap = new Map<
    number,
    { name: string; teamId: number; teamAbbr: string; stats: DashPlayerRow | LeagueLeaderRow }
  >();

  // Add all dash players first (complete roster)
  for (const p of allDashPlayers) {
    playerMap.set(p.PLAYER_ID, {
      name: p.PLAYER_NAME,
      teamId: p.TEAM_ID,
      teamAbbr: p.TEAM_ABBREVIATION,
      stats: p,
    });
  }

  // Fill in any leaders not captured by dash (edge case)
  for (const p of leaders) {
    if (!playerMap.has(p.PLAYER_ID)) {
      playerMap.set(p.PLAYER_ID, {
        name: p.PLAYER,
        teamId: p.TEAM_ID,
        teamAbbr: p.TEAM,
        stats: p,
      });
    }
  }

  // Step 4: Upsert into DB
  let playerCount = 0;
  let statsCount = 0;
  let profileCount = 0;

  for (const [nbaId, entry] of playerMap) {
    const nameParts = entry.name.split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";
    const s = entry.stats;

    // Check if team exists in DB
    const teamExists = await prisma.team.findUnique({
      where: { id: entry.teamId },
    });

    // Fetch detailed player info for profile data
    const playerInfo = await fetchPlayerInfo(nbaId);
    await new Promise((r) => setTimeout(r, 150)); // Rate limit
    
    if (playerInfo) {
      profileCount++;
    }

    // Upsert player — use NBA.com PLAYER_ID as the DB id
    await prisma.player.upsert({
      where: { id: nbaId },
      update: {
        firstName: playerInfo?.FIRST_NAME || firstName,
        lastName: playerInfo?.LAST_NAME || lastName,
        teamId: teamExists ? entry.teamId : null,
        position: playerInfo?.POSITION || null,
        height: playerInfo?.HEIGHT || "",
        weight: playerInfo?.WEIGHT || "",
        jerseyNumber: playerInfo?.JERSEY || "",
        college: playerInfo?.SCHOOL || "",
        country: playerInfo?.COUNTRY || "",
        draftYear: playerInfo?.DRAFT_YEAR ? parseInt(playerInfo.DRAFT_YEAR) : null,
        draftRound: playerInfo?.DRAFT_ROUND ? parseInt(playerInfo.DRAFT_ROUND) : null,
        draftNumber: playerInfo?.DRAFT_NUMBER ? parseInt(playerInfo.DRAFT_NUMBER) : null,
      },
      create: {
        id: nbaId,
        firstName: playerInfo?.FIRST_NAME || firstName,
        lastName: playerInfo?.LAST_NAME || lastName,
        teamId: teamExists ? entry.teamId : null,
        position: playerInfo?.POSITION || null,
        height: playerInfo?.HEIGHT || "",
        weight: playerInfo?.WEIGHT || "",
        jerseyNumber: playerInfo?.JERSEY || "",
        college: playerInfo?.SCHOOL || "",
        country: playerInfo?.COUNTRY || "",
        draftYear: playerInfo?.DRAFT_YEAR ? parseInt(playerInfo.DRAFT_YEAR) : null,
        draftRound: playerInfo?.DRAFT_ROUND ? parseInt(playerInfo.DRAFT_ROUND) : null,
        draftNumber: playerInfo?.DRAFT_NUMBER ? parseInt(playerInfo.DRAFT_NUMBER) : null,
      },
    });
    playerCount++;

    // Upsert season stats
    await prisma.playerStats.upsert({
      where: {
        playerId_season: { playerId: nbaId, season: seasonStr },
      },
      update: {
        gamesPlayed: s.GP,
        ppg: s.PTS,
        rpg: "REB" in s ? s.REB : (s as any).OREB + (s as any).DREB,
        apg: s.AST,
        spg: s.STL,
        bpg: s.BLK,
        topg: s.TOV,
        fgPct: s.FG_PCT,
        threePct: s.FG3_PCT,
        ftPct: s.FT_PCT,
        mpg: s.MIN,
        fgm: s.FGM,
        fga: s.FGA,
        fg3m: s.FG3M,
        fg3a: s.FG3A,
        ftm: s.FTM,
        fta: s.FTA,
        oreb: s.OREB,
        dreb: s.DREB,
        pf: s.PF,
      },
      create: {
        playerId: nbaId,
        season: seasonStr,
        gamesPlayed: s.GP,
        ppg: s.PTS,
        rpg: "REB" in s ? s.REB : (s as any).OREB + (s as any).DREB,
        apg: s.AST,
        spg: s.STL,
        bpg: s.BLK,
        topg: s.TOV,
        fgPct: s.FG_PCT,
        threePct: s.FG3_PCT,
        ftPct: s.FT_PCT,
        mpg: s.MIN,
        fgm: s.FGM,
        fga: s.FGA,
        fg3m: s.FG3M,
        fg3a: s.FG3A,
        ftm: s.FTM,
        fta: s.FTA,
        oreb: s.OREB,
        dreb: s.DREB,
        pf: s.PF,
      },
    });
    statsCount++;
  }

  console.log(
    `[sync-players] Upserted ${playerCount} players (${profileCount} with profiles), ${statsCount} season stats`
  );
  return { players: playerCount, stats: statsCount };
}
