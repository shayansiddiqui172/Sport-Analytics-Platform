const ODDS_API_KEY = "8d44ebe102a2dd515dae520d700ec12d";
const ODDS_BASE_URL = "https://api.the-odds-api.com/v4";
const SPORT = "basketball_nba";

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
 * Convert American moneyline odds to implied probability (0-1).
 */
function americanToProb(odds: number): number {
  if (odds < 0) {
    return Math.abs(odds) / (Math.abs(odds) + 100);
  }
  return 100 / (odds + 100);
}

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
    homeWinProb = Math.round((rawHome / totalProb) * 1000) / 10;
    awayWinProb = Math.round((rawAway / totalProb) * 1000) / 10;
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
