/**
 * NBA Stats API Client
 *
 * Uses the leagueleaders endpoint as the single reliable data source.
 * stats.nba.com rate-limits most endpoints, but leagueleaders is fast and returns
 * all qualified players (~230) with IDs + full per-game stats.
 *
 * Data flow:
 * - Season averages: extracted from leagueleaders cache (instant)
 * - Team roster stats: filtered from leagueleaders cache by team (instant)
 * - Player ID lookup: from leagueleaders cache (instant)
 * - Game log: per-player API call (may timeout, handled gracefully)
 */

// Module-level cache for league leaders data
let leagueLeadersCache: LeagueLeaderEntry[] | null = null;
let leagueLeadersCacheTime: number | null = null;
let leagueLeadersCacheSeason: string | null = null;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes
// PERF: Reduced from 10s to 5s - faster fallback to BDL API when NBA.com is slow
const CLIENT_FETCH_TIMEOUT = 5000; // 5s client-side timeout for NBA.com proxy calls

// Per-team dash player stats cache (keyed by "teamId-season")
const teamDashCache = new Map<string, { data: DashPlayerEntry[]; time: number }>();
const DASH_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

export interface LeagueLeaderEntry {
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
  EFF: number;
}

export interface DashPlayerEntry {
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

export interface PlayerSeasonAverages {
  playerId: number;
  playerName: string;
  team: string;
  gp: number;
  min: number;
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  tov: number;
  fg_pct: number;
  fg3_pct: number;
  ft_pct: number;
  fgm: number;
  fga: number;
  fg3m: number;
  fg3a: number;
  ftm: number;
  fta: number;
  oreb: number;
  dreb: number;
  pf: number;
}

export interface GameLogEntry {
  gameId: string;
  gameDate: string;
  matchup: string;
  wl: string;
  min: number;
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  fgm: number;
  fga: number;
  fg_pct: number;
  fg3m: number;
  fg3a: number;
  fg3_pct: number;
  ftm: number;
  fta: number;
  ft_pct: number;
  oreb: number;
  dreb: number;
  pf: number;
  tov: number;
  plus_minus: number;
}

export interface TeamRosterPlayer {
  playerId: number;
  playerName: string;
  gp: number;
  min: number;
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  tov: number;
  fg_pct: number;
  fg3_pct: number;
  ft_pct: number;
}

/**
 * Convert NBA.com tabular data to objects
 */
function rowsToObjects<T>(headers: string[], rows: any[][]): T[] {
  return rows.map((row) => {
    const obj: any = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return obj as T;
  });
}

/**
 * Fetch all active NBA players with IDs and per-game stats via leagueleaders.
 * This is the only reliably fast stats.nba.com endpoint.
 */
async function fetchLeagueLeaders(season = "2024-25"): Promise<LeagueLeaderEntry[]> {
  const now = Date.now();
  if (
    leagueLeadersCache &&
    leagueLeadersCacheTime &&
    leagueLeadersCacheSeason === season &&
    now - leagueLeadersCacheTime < CACHE_TTL
  ) {
    return leagueLeadersCache;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CLIENT_FETCH_TIMEOUT);

  try {
    const response = await fetch(
      `/api/nba-stats?type=leagueleaders&season=${season}`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to fetch league leaders: ${response.status}`);
    }

    const data: NBAStatsResponse = await response.json();
    const resultSet = data.resultSet || data.resultSets?.[0];

    if (!resultSet) {
      throw new Error("No resultSet found in league leaders response");
    }

    const players = rowsToObjects<LeagueLeaderEntry>(
      resultSet.headers,
      resultSet.rowSet
    );

    leagueLeadersCache = players;
    leagueLeadersCacheTime = now;
    leagueLeadersCacheSeason = season;

    return players;
  } catch (error) {
    clearTimeout(timeoutId);
    // Return stale cache if available — don't let a timeout break everything
    if (leagueLeadersCache) {
      return leagueLeadersCache;
    }
    throw error;
  }
}

/**
 * Find a player by name in the leagueleaders data.
 */
function findPlayerInLeaders(
  players: LeagueLeaderEntry[],
  firstName: string,
  lastName: string
): LeagueLeaderEntry | undefined {
  const fullName = `${firstName} ${lastName}`.toLowerCase().trim();

  // Exact match
  let match = players.find(
    (p) => p.PLAYER.toLowerCase() === fullName
  );

  // Partial match fallback
  if (!match) {
    const normalizedFirst = firstName.toLowerCase().trim();
    const normalizedLast = lastName.toLowerCase().trim();
    match = players.find((p) => {
      const name = p.PLAYER.toLowerCase();
      return name.includes(normalizedFirst) && name.includes(normalizedLast);
    });
  }

  return match;
}

/**
 * Find a player's NBA.com ID by name from cached leagueleaders.
 */
export async function findNBAPlayerId(
  firstName: string,
  lastName: string,
  season?: string
): Promise<number | null> {
  try {
    const players = await fetchLeagueLeaders(season);
    const match = findPlayerInLeaders(players, firstName, lastName);
    return match ? match.PLAYER_ID : null;
  } catch (error) {
    console.error("Error finding NBA player ID:", error);
    return null;
  }
}

/**
 * Get player season averages from cached leagueleaders data.
 * Instant — no additional API call needed.
 */
export async function getPlayerSeasonAverages(
  firstName: string,
  lastName: string,
  season?: string
): Promise<PlayerSeasonAverages | null> {
  try {
    const players = await fetchLeagueLeaders(season);
    const match = findPlayerInLeaders(players, firstName, lastName);

    if (!match) return null;

    return {
      playerId: match.PLAYER_ID,
      playerName: match.PLAYER,
      team: match.TEAM,
      gp: match.GP,
      min: match.MIN,
      pts: match.PTS,
      reb: match.REB,
      ast: match.AST,
      stl: match.STL,
      blk: match.BLK,
      tov: match.TOV,
      fg_pct: match.FG_PCT,
      fg3_pct: match.FG3_PCT,
      ft_pct: match.FT_PCT,
      fgm: match.FGM,
      fga: match.FGA,
      fg3m: match.FG3M,
      fg3a: match.FG3A,
      ftm: match.FTM,
      fta: match.FTA,
      oreb: match.OREB,
      dreb: match.DREB,
      pf: match.PF,
    };
  } catch (error) {
    console.error("Error getting player season averages:", error);
    return null;
  }
}

/**
 * Fetch player game log (per-game breakdown).
 * This calls a per-player endpoint which may timeout on some networks.
 * Returns empty array on failure (handled gracefully by UI).
 */
export async function getPlayerGameLog(
  nbaPlayerId: number,
  season = "2024-25"
): Promise<GameLogEntry[]> {
  try {
    const response = await fetch(
      `/api/nba-stats?type=gamelog&playerId=${nbaPlayerId}&season=${season}`
    );

    if (!response.ok) {
      return [];
    }

    const data: NBAStatsResponse = await response.json();
    const resultSet = data.resultSets?.find((r) => r.name === "PlayerGameLog");

    if (!resultSet || resultSet.rowSet.length === 0) {
      return [];
    }

    const rows = rowsToObjects<any>(resultSet.headers, resultSet.rowSet);

    return rows.map((row) => ({
      gameId: row.GAME_ID || row.Game_ID || "",
      gameDate: row.GAME_DATE || "",
      matchup: row.MATCHUP || "",
      wl: row.WL || "",
      min: parseFloat(row.MIN) || 0,
      pts: row.PTS || 0,
      reb: row.REB || 0,
      ast: row.AST || 0,
      stl: row.STL || 0,
      blk: row.BLK || 0,
      fgm: row.FGM || 0,
      fga: row.FGA || 0,
      fg_pct: row.FG_PCT || 0,
      fg3m: row.FG3M || 0,
      fg3a: row.FG3A || 0,
      fg3_pct: row.FG3_PCT || 0,
      ftm: row.FTM || 0,
      fta: row.FTA || 0,
      ft_pct: row.FT_PCT || 0,
      oreb: row.OREB || 0,
      dreb: row.DREB || 0,
      pf: row.PF || 0,
      tov: row.TOV || 0,
      plus_minus: row.PLUS_MINUS || 0,
    }));
  } catch (error) {
    console.error("Error fetching player game log:", error);
    return [];
  }
}

/**
 * Get team roster stats from cached leagueleaders data.
 * Filters by team abbreviation — instant, no additional API call.
 */
export async function getTeamRosterStats(
  teamAbbreviation: string,
  season = "2024-25"
): Promise<TeamRosterPlayer[]> {
  try {
    const players = await fetchLeagueLeaders(season);
    const teamPlayers = players.filter(
      (p) => p.TEAM.toUpperCase() === teamAbbreviation.toUpperCase()
    );

    return teamPlayers.map((p) => ({
      playerId: p.PLAYER_ID,
      playerName: p.PLAYER,
      gp: p.GP,
      min: p.MIN,
      pts: p.PTS,
      reb: p.REB,
      ast: p.AST,
      stl: p.STL,
      blk: p.BLK,
      tov: p.TOV,
      fg_pct: p.FG_PCT,
      fg3_pct: p.FG3_PCT,
      ft_pct: p.FT_PCT,
    }));
  } catch (error) {
    console.error("Error getting team roster stats:", error);
    return [];
  }
}

/**
 * Fetch all players on a specific team via leaguedashplayerstats.
 * Returns every player with at least 1 game played (not just "qualified" leaders).
 * Cached per team for 30 minutes.
 * Has a 10s client-side timeout to avoid long hangs.
 */
async function fetchTeamDashPlayerStats(
  nbaTeamId: number,
  season = "2024-25"
): Promise<DashPlayerEntry[]> {
  const cacheKey = `${nbaTeamId}-${season}`;
  const cached = teamDashCache.get(cacheKey);
  if (cached && Date.now() - cached.time < DASH_CACHE_TTL) {
    return cached.data;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CLIENT_FETCH_TIMEOUT);

  try {
    const response = await fetch(
      `/api/nba-stats?type=teamplayerstats&teamId=${nbaTeamId}&season=${season}`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to fetch team dash stats: ${response.status}`);
    }

    const data: NBAStatsResponse = await response.json();
    const resultSet = data.resultSets?.[0] || data.resultSet;

    if (!resultSet) {
      throw new Error("No resultSet in team dash response");
    }

    const players = rowsToObjects<DashPlayerEntry>(
      resultSet.headers,
      resultSet.rowSet
    );

    teamDashCache.set(cacheKey, { data: players, time: Date.now() });
    return players;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Get full team roster stats.
 * Strategy: try leagueleaders first (fast, cached) then enhance with dash if possible.
 * If NBA.com is completely down, returns empty array gracefully.
 */
export async function getFullTeamRosterStats(
  teamAbbreviation: string,
  nbaTeamId: number,
  season = "2024-25"
): Promise<TeamRosterPlayer[]> {
  // Step 1: Try leagueleaders (fast, often cached)
  let leaderPlayers: TeamRosterPlayer[] = [];
  try {
    leaderPlayers = await getTeamRosterStats(teamAbbreviation, season);
  } catch {
    // leagueleaders failed — continue to try dash
  }

  // Step 2: Try leaguedashplayerstats (complete roster, but slower)
  try {
    const dashPlayers = await fetchTeamDashPlayerStats(nbaTeamId, season);
    return dashPlayers.map((p) => ({
      playerId: p.PLAYER_ID,
      playerName: p.PLAYER_NAME,
      gp: p.GP,
      min: p.MIN,
      pts: p.PTS,
      reb: p.REB,
      ast: p.AST,
      stl: p.STL,
      blk: p.BLK,
      tov: p.TOV,
      fg_pct: p.FG_PCT,
      fg3_pct: p.FG3_PCT,
      ft_pct: p.FT_PCT,
    }));
  } catch {
    // Dash also failed — return whatever leagueleaders had (may be empty)
  }

  return leaderPlayers;
}
