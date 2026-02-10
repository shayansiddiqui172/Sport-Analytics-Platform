const ODDS_API_KEY_PRIMARY = "8d44ebe102a2dd515dae520d700ec12d";
const ODDS_API_KEY_SECONDARY = "fa9dc506b815c4565a3ed81a681c567a";
const ODDS_API_KEY = ODDS_API_KEY_PRIMARY;
const ODDS_BASE_URL = "https://api.the-odds-api.com/v4";
const SPORT = "basketball_nba";

// --- Award Category Constants ---

export const AWARD_MARKETS = {
  mvp: "basketball_nba_mvp",
  champion: "basketball_nba_championship_winner",
  roty: "basketball_nba_rookie_of_the_year",
} as const;

export type AwardKey = keyof typeof AWARD_MARKETS;

export const AWARD_INFO: Record<AwardKey, { title: string; icon: string; description: string }> = {
  mvp: { title: "MVP", icon: "", description: "Most Valuable Player" },
  champion: { title: "NBA Champion", icon: "", description: "Championship Winner" },
  roty: { title: "Rookie of the Year", icon: "", description: "Best First-Year Player" },
};

// --- Hardcoded ROTY Data (from current betting lines) ---
const ROTY_CANDIDATES: AwardCandidate[] = [
  { name: "Cooper Flagg", probability: 91.7, odds: -1099, rank: 1 },
  { name: "Kon Knueppel", probability: 6.5, odds: 600, rank: 2 },
  { name: "VJ Edgecombe", probability: 1.0, odds: 7500, rank: 3 },
  { name: "Jeremiah Fears", probability: 0.4, odds: 50000, rank: 4 },
  { name: "Ace Bailey", probability: 0.4, odds: 50000, rank: 5 },
];

// --- Types ---

export interface OddsEvent {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: Bookmaker[];
}

export interface Bookmaker {
  key: string;
  title: string;
  last_update: string;
  markets: Market[];
}

export interface Market {
  key: string;
  last_update: string;
  outcomes: Outcome[];
}

export interface Outcome {
  name: string;
  price: number;
  point?: number;
}

export interface ScoreEvent {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  completed: boolean;
  home_team: string;
  away_team: string;
  scores: { name: string; score: string }[] | null;
  last_update: string;
}

/** Parsed odds for a single game */
export interface GameOdds {
  eventId: string;
  homeTeam: string;
  awayTeam: string;
  commenceTime: string;
  moneyline: { home: number; away: number } | null;
  spread: { home: number; away: number; homePoint: number; awayPoint: number } | null;
  total: { over: number; under: number; point: number } | null;
  homeWinProb: number;
  awayWinProb: number;
  bookmaker: string;
}

// --- API Functions ---

export async function fetchNBAOdds(): Promise<OddsEvent[]> {
  const url = `${ODDS_BASE_URL}/sports/${SPORT}/odds?apiKey=${ODDS_API_KEY}&regions=us&markets=h2h,spreads,totals&oddsFormat=american`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Odds API error: ${res.status}`);
  return res.json();
}

export async function fetchNBAScores(): Promise<ScoreEvent[]> {
  const url = `${ODDS_BASE_URL}/sports/${SPORT}/scores?apiKey=${ODDS_API_KEY}&daysFrom=1`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Odds API error: ${res.status}`);
  return res.json();
}

// --- Odds Parsing ---

/**
 * Parse raw OddsEvent data into a cleaner GameOdds structure.
 * Uses the first available bookmaker's data.
 */
export function parseGameOdds(event: OddsEvent): GameOdds {
  let moneyline: GameOdds["moneyline"] = null;
  let spread: GameOdds["spread"] = null;
  let total: GameOdds["total"] = null;
  let bookmakerName = "";

  // Iterate bookmakers to fill all markets
  for (const bm of event.bookmakers) {
    if (!bookmakerName && bm.markets.length > 0) bookmakerName = bm.title;

    for (const market of bm.markets) {
      if (market.key === "h2h" && !moneyline) {
        const homeOutcome = market.outcomes.find((o) => o.name === event.home_team);
        const awayOutcome = market.outcomes.find((o) => o.name === event.away_team);
        if (homeOutcome && awayOutcome) {
          moneyline = { home: homeOutcome.price, away: awayOutcome.price };
          if (!bookmakerName) bookmakerName = bm.title;
        }
      }
      if (market.key === "spreads" && !spread) {
        const homeOutcome = market.outcomes.find((o) => o.name === event.home_team);
        const awayOutcome = market.outcomes.find((o) => o.name === event.away_team);
        if (homeOutcome && awayOutcome && homeOutcome.point != null && awayOutcome.point != null) {
          spread = {
            home: homeOutcome.price,
            away: awayOutcome.price,
            homePoint: homeOutcome.point,
            awayPoint: awayOutcome.point,
          };
        }
      }
      if (market.key === "totals" && !total) {
        const over = market.outcomes.find((o) => o.name === "Over");
        const under = market.outcomes.find((o) => o.name === "Under");
        if (over && under && over.point != null) {
          total = { over: over.price, under: under.price, point: over.point };
        }
      }
    }

    // Stop once we have all three markets
    if (moneyline && spread && total) break;
  }

  // Compute implied win probabilities from moneyline
  let homeWinProb = 50;
  let awayWinProb = 50;
  if (moneyline) {
    const rawHome = americanToProb(moneyline.home);
    const rawAway = americanToProb(moneyline.away);
    // Normalize to remove the vig (overround)
    const totalProb = rawHome + rawAway;
    homeWinProb = Math.round((rawHome / totalProb) * 100 * 10) / 10;
    awayWinProb = Math.round((rawAway / totalProb) * 100 * 10) / 10;
  }

  return {
    eventId: event.id,
    homeTeam: event.home_team,
    awayTeam: event.away_team,
    commenceTime: event.commence_time,
    moneyline,
    spread,
    total,
    homeWinProb,
    awayWinProb,
    bookmaker: bookmakerName,
  };
}

/**
 * Format American odds with +/- prefix.
 */
export function formatOdds(odds: number): string {
  return odds > 0 ? `+${odds}` : `${odds}`;
}

/**
 * Format spread point with +/- prefix.
 */
export function formatSpread(point: number): string {
  return point > 0 ? `+${point}` : `${point}`;
}

// --- Award Types ---

export interface AwardCandidate {
  name: string;
  probability: number; // 0-100
  odds: number; // American odds
  rank: number;
}

export interface AwardCategory {
  key: AwardKey;
  title: string;
  icon: string;
  description: string;
  candidates: AwardCandidate[];
  lastUpdate: string | null;
  bookmaker: string | null;
}

export interface OutrightEvent {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  bookmakers: Bookmaker[];
}

// --- Award Fetching Functions ---

/**
 * Convert American odds to implied probability (0-100 scale).
 */
export function americanToProb(odds: number): number {
  if (odds < 0) {
    return (Math.abs(odds) / (Math.abs(odds) + 100)) * 100;
  }
  return (100 / (odds + 100)) * 100;
}

/**
 * Fetch futures/outrights odds for a specific award market.
 * Tries primary key first, then secondary key if quota exceeded.
 */
export async function fetchAwardOdds(sportKey: string): Promise<OutrightEvent[]> {
  // Try primary key first
  const primaryUrl = `${ODDS_BASE_URL}/sports/${sportKey}/odds?apiKey=${ODDS_API_KEY_PRIMARY}&regions=us&markets=outrights&oddsFormat=american`;
  const primaryRes = await fetch(primaryUrl);
  
  if (primaryRes.ok) {
    return primaryRes.json();
  }
  
  // If 404, market not available
  if (primaryRes.status === 404) return [];
  
  // If quota exceeded (401 or 429), try secondary key
  if (primaryRes.status === 401 || primaryRes.status === 429) {
    console.log(`Primary API key quota exceeded for ${sportKey}, trying secondary key...`);
    const secondaryUrl = `${ODDS_BASE_URL}/sports/${sportKey}/odds?apiKey=${ODDS_API_KEY_SECONDARY}&regions=us&markets=outrights&oddsFormat=american`;
    const secondaryRes = await fetch(secondaryUrl);
    
    if (secondaryRes.ok) {
      return secondaryRes.json();
    }
    
    // If 404, market not available
    if (secondaryRes.status === 404) return [];
  }
  
  // Both keys failed
  throw new Error(`Odds API error for ${sportKey}: ${primaryRes.status}`);
}

/**
 * Parse outright odds into ranked candidates with probabilities.
 * Returns top N candidates sorted by probability (highest first).
 */
export function parseAwardCandidates(
  events: OutrightEvent[],
  limit: number = 5
): { candidates: AwardCandidate[]; lastUpdate: string | null; bookmaker: string | null } {
  if (!events.length || !events[0]?.bookmakers?.length) {
    return { candidates: [], lastUpdate: null, bookmaker: null };
  }

  // Use first event and first bookmaker with outright market
  const event = events[0];
  let outcomes: Outcome[] = [];
  let bookmakerName: string | null = null;
  let lastUpdate: string | null = null;

  for (const bm of event.bookmakers) {
    const outrightMarket = bm.markets.find((m) => m.key === "outrights");
    if (outrightMarket && outrightMarket.outcomes.length > 0) {
      outcomes = outrightMarket.outcomes;
      bookmakerName = bm.title;
      lastUpdate = bm.last_update;
      break;
    }
  }

  if (!outcomes.length) {
    return { candidates: [], lastUpdate: null, bookmaker: null };
  }

  // Convert odds to probabilities and sort
  const rawCandidates = outcomes.map((o) => ({
    name: o.name,
    odds: o.price,
    rawProb: americanToProb(o.price),
  }));

  // Normalize probabilities to remove vig (they should sum to ~100)
  const totalProb = rawCandidates.reduce((sum, c) => sum + c.rawProb, 0);
  const normalizedCandidates = rawCandidates
    .map((c) => ({
      name: c.name,
      odds: c.odds,
      probability: Math.round((c.rawProb / totalProb) * 1000) / 10, // One decimal place
    }))
    .sort((a, b) => b.probability - a.probability)
    .slice(0, limit)
    .map((c, i) => ({
      ...c,
      rank: i + 1,
    }));

  return { candidates: normalizedCandidates, lastUpdate, bookmaker: bookmakerName };
}

/**
 * Fetch all award categories with candidates.
 */
export async function fetchAllAwardPredictions(): Promise<AwardCategory[]> {
  const results: AwardCategory[] = [];

  // Fetch all markets in parallel
  const marketEntries = Object.entries(AWARD_MARKETS) as [AwardKey, string][];
  const fetchPromises = marketEntries.map(async ([key, sportKey]) => {
    try {
      const events = await fetchAwardOdds(sportKey);
      const { candidates, lastUpdate, bookmaker } = parseAwardCandidates(events, 5);
      const info = AWARD_INFO[key];
      return {
        key,
        title: info.title,
        icon: info.icon,
        description: info.description,
        candidates,
        lastUpdate,
        bookmaker,
      };
    } catch (error) {
      console.error(`Failed to fetch ${key} odds:`, error);
      const info = AWARD_INFO[key];
      return {
        key,
        title: info.title,
        icon: info.icon,
        description: info.description,
        candidates: [],
        lastUpdate: null,
        bookmaker: null,
      };
    }
  });

  const categories = await Promise.all(fetchPromises);
  return categories;
}

// --- Stat-Based Predictions (when betting odds unavailable) ---

const NBA_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Referer: "https://stats.nba.com/",
  Accept: "application/json, text/plain, */*",
  "x-nba-stats-token": "true",
  "x-nba-stats-origin": "stats",
  Origin: "https://stats.nba.com",
};

interface LeagueLeader {
  PLAYER_ID: number;
  PLAYER: string;
  TEAM: string;
  GP: number;
  MIN: number;
  PTS: number;
  REB: number;
  AST: number;
  STL: number;
  BLK: number;
  FG_PCT: number;
  FG3_PCT: number;
  FT_PCT: number;
  EFF: number;
  // Additional fields for 6MOY detection
  GS?: number; // Games Started (may not be in leagueleaders)
}

/**
 * Fetch league leaders from NBA.com
 */
async function fetchLeagueLeaders(season: string = "2024-25", statCategory: string = "PTS"): Promise<LeagueLeader[]> {
  const url = `https://stats.nba.com/stats/leagueleaders?LeagueID=00&PerMode=PerGame&Scope=S&Season=${season}&SeasonType=Regular%20Season&StatCategory=${statCategory}`;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  
  try {
    const res = await fetch(url, {
      headers: NBA_HEADERS as any,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    
    if (!res.ok) throw new Error(`NBA API error: ${res.status}`);
    
    const data = await res.json();
    const headers = data.resultSet.headers as string[];
    const rows = data.resultSet.rowSet as any[][];
    
    // Map rows to objects
    return rows.map((row) => {
      const player: any = {};
      headers.forEach((h, i) => {
        player[h] = row[i];
      });
      return player as LeagueLeader;
    });
  } catch (error) {
    clearTimeout(timeoutId);
    console.error("Failed to fetch league leaders:", error);
    return [];
  }
}

/**
 * Calculate MVP score based on weighted stats.
 * MVP = 40% PTS + 20% AST + 15% REB + 15% EFF + 10% Team Success
 */
function calculateMVPScore(player: LeagueLeader): number {
  const ptsScore = Math.min(player.PTS / 35, 1) * 40; // Max ~35 PPG
  const astScore = Math.min(player.AST / 12, 1) * 20; // Max ~12 APG
  const rebScore = Math.min(player.REB / 15, 1) * 15; // Max ~15 RPG
  const effScore = Math.min(player.EFF / 35, 1) * 15; // Max ~35 EFF
  const minScore = player.MIN >= 30 ? 10 : (player.MIN / 30) * 10; // Playing time bonus
  
  return ptsScore + astScore + rebScore + effScore + minScore;
}

/**
 * Convert raw scores to probabilities (softmax-like normalization).
 */
function scoresToProbabilities(
  players: { name: string; score: number }[],
  limit: number = 5
): AwardCandidate[] {
  const sorted = [...players].sort((a, b) => b.score - a.score).slice(0, limit);
  const totalScore = sorted.reduce((sum, p) => sum + p.score, 0);
  
  return sorted.map((p, i) => ({
    name: p.name,
    probability: Math.round((p.score / totalScore) * 1000) / 10,
    odds: 0, // No real odds for stat-based predictions
    rank: i + 1,
  }));
}

/**
 * Generate stat-based predictions for MVP award.
 */
export async function generateStatBasedPredictions(): Promise<{
  mvp: AwardCandidate[];
}> {
  // Fetch scoring leaders
  const ptsLeaders = await fetchLeagueLeaders("2024-25", "PTS");
  
  if (!ptsLeaders.length) {
    return { mvp: [] };
  }
  
  // Filter for qualified players (minimum games/minutes)
  const qualifiedPts = ptsLeaders.filter((p) => p.GP >= 20 && p.MIN >= 20);
  
  // MVP - from scoring leaders
  const mvpScores = qualifiedPts
    .slice(0, 50) // Top 50 scorers are MVP candidates
    .map((p) => ({
      name: p.PLAYER,
      score: calculateMVPScore(p),
    }));
  
  return {
    mvp: scoresToProbabilities(mvpScores, 5),
  };
}

/**
 * Generate championship predictions based on current season standings.
 */
export async function generateChampionshipPredictions(): Promise<AwardCandidate[]> {
  try {
    // Skip during build time (no server running)
    if (typeof window === "undefined" && !process.env.VERCEL_URL) {
      return [];
    }
    
    // Determine base URL
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    
    // Fetch current standings from our database
    const standingsRes = await fetch(`${baseUrl}/api/db/teams/standings`);
    if (!standingsRes.ok) {
      console.error("Failed to fetch standings");
      return [];
    }
    const standingsData = await standingsRes.json();
    const standings = standingsData.data || [];
    
    // Fetch team names
    const teamsRes = await fetch(`${baseUrl}/api/db/teams`);
    if (!teamsRes.ok) {
      console.error("Failed to fetch teams");
      return [];
    }
    const teamsData = await teamsRes.json();
    const teams = teamsData.data || [];
    
    // Create team ID to name mapping
    const teamMap = new Map(
      teams.map((t: any) => [t.id, `${t.city} ${t.name}`])
    );
    
    // Calculate championship scores based on win percentage and total wins
    const teamScores = standings
      .map((standing: any) => {
        const totalGames = standing.wins + standing.losses;
        if (totalGames === 0) return null;
        
        const winPct = standing.wins / totalGames;
        // Score formula: win % heavily weighted + bonus for total wins
        // Teams with better records and more total wins get higher scores
        const score = (winPct * 100) + (standing.wins * 0.8);
        
        return {
          name: teamMap.get(standing.teamId) || `Team ${standing.teamId}`,
          score,
        };
      })
      .filter((t: any) => t !== null && t.score > 0);
    
    return scoresToProbabilities(teamScores, 5);
  } catch (error) {
    console.error("Failed to generate championship predictions:", error);
    return [];
  }
}

/**
 * Fetch all award predictions, using stat-based as fallback.
 */
export async function fetchAllAwardPredictionsWithFallback(): Promise<AwardCategory[]> {
  // First try betting odds
  const oddsCategories = await fetchAllAwardPredictions();
  
  // Generate stat-based predictions for MVP fallback
  const statBased = await generateStatBasedPredictions();
  
  // Generate championship predictions from current standings
  const championshipCandidates = await generateChampionshipPredictions();
  
  // Build final categories with fallbacks
  const result: AwardCategory[] = [];
  
  for (const category of oddsCategories) {
    if (category.key === "roty") {
      // Always use hardcoded ROTY data
      result.push({
        ...category,
        candidates: ROTY_CANDIDATES,
        bookmaker: "DraftKings",
        lastUpdate: new Date().toISOString(),
      });
    } else if (category.candidates.length > 0) {
      // Has real odds from API (primary or secondary key worked)
      result.push(category);
    } else if (category.key === "champion" && championshipCandidates.length > 0) {
      // Fallback: Use standings-based championship predictions
      result.push({
        ...category,
        candidates: championshipCandidates,
        bookmaker: "Based on current season standings",
        lastUpdate: new Date().toISOString(),
      });
    } else if (category.key === "mvp" && statBased.mvp.length > 0) {
      // Fallback: Use stats-based MVP predictions
      result.push({
        ...category,
        candidates: statBased.mvp,
        bookmaker: "Stats-Based",
        lastUpdate: new Date().toISOString(),
      });
    } else {
      result.push(category);
    }
  }
  
  return result;
}
