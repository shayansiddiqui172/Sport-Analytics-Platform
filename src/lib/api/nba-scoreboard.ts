/**
 * NBA.com Scoreboard API
 *
 * Fetches live/today's game scores from the NBA.com scoreboardv3 endpoint.
 * This provides real-time scores, period, game clock, and game status.
 *
 * Used by the /api/live/scores route to serve live game data.
 */

import type { Game, GameStatus } from "@/types";

const NBA_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Referer: "https://www.nba.com/",
  Accept: "application/json, text/plain, */*",
  Origin: "https://www.nba.com",
};

const FETCH_TIMEOUT_MS = 10000;

// Server-side in-memory cache to avoid hammering NBA.com when multiple clients poll
let scoreboardCache: { data: Game[]; time: number; date: string } | null = null;
const CACHE_TTL = 15_000; // 15 seconds

/** NBA.com game status codes → our GameStatus enum */
function mapGameStatus(statusNum: number): GameStatus {
  switch (statusNum) {
    case 2:
      return "in_progress";
    case 3:
      return "final";
    default:
      return "scheduled";
  }
}

/** Format period number to display string (Q1, OT, 2OT, etc.) */
export function formatPeriod(period: number): string {
  if (period <= 4) return `Q${period}`;
  if (period === 5) return "OT";
  return `${period - 4}OT`;
}

/**
 * Map NBA.com team abbreviation to our DB team ID.
 * Returns the abbreviation for client-side matching.
 */
interface ScoreboardTeam {
  teamId: number;
  teamTricode: string;
  teamCity: string;
  teamName: string;
  score: number;
}

interface ScoreboardGame {
  gameId: string;
  gameStatus: number; // 1=scheduled, 2=live, 3=final
  gameStatusText: string; // e.g. "7:00 pm ET", "Q3 5:42", "Final"
  period: number;
  gameClock: string; // e.g. "PT05M42.00S" or ""
  gameTimeUTC: string;
  homeTeam: ScoreboardTeam;
  awayTeam: ScoreboardTeam;
}

/** Parse ISO 8601 duration "PT05M42.00S" → "5:42" */
function parseGameClock(clock: string): string {
  if (!clock) return "";
  const match = clock.match(/PT(\d+)M([\d.]+)S/);
  if (!match) return clock;
  const minutes = parseInt(match[1], 10);
  const seconds = Math.floor(parseFloat(match[2]));
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Fetch today's scoreboard from NBA.com.
 * Returns games mapped to our Game type.
 */
export async function fetchScoreboard(date?: string): Promise<Game[]> {
  const gameDate = date || new Date().toISOString().split("T")[0];

  // Check cache
  if (
    scoreboardCache &&
    scoreboardCache.date === gameDate &&
    Date.now() - scoreboardCache.time < CACHE_TTL
  ) {
    return scoreboardCache.data;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const url = `https://stats.nba.com/stats/scoreboardv3?GameDate=${gameDate}&LeagueID=00`;
    const response = await fetch(url, {
      headers: NBA_HEADERS,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`NBA scoreboard API error: ${response.status}`);
    }

    const data = await response.json();
    const scoreboard = data.scoreboard;

    if (!scoreboard?.games) {
      return [];
    }

    const games: Game[] = scoreboard.games.map(
      (g: ScoreboardGame): Game => ({
        id: parseInt(g.gameId, 10),
        date: g.gameTimeUTC || gameDate,
        season: new Date(gameDate).getMonth() >= 9
          ? new Date(gameDate).getFullYear()
          : new Date(gameDate).getFullYear() - 1,
        status: mapGameStatus(g.gameStatus),
        period: g.period,
        time: g.gameStatus === 2
          ? parseGameClock(g.gameClock)
          : g.gameStatusText || "",
        postseason: false,
        home_team: {
          id: g.homeTeam.teamId,
          name: g.homeTeam.teamName,
          city: g.homeTeam.teamCity,
          full_name: `${g.homeTeam.teamCity} ${g.homeTeam.teamName}`,
          abbreviation: g.homeTeam.teamTricode,
          conference: "",
          division: "",
        },
        home_team_score: g.homeTeam.score,
        visitor_team: {
          id: g.awayTeam.teamId,
          name: g.awayTeam.teamName,
          city: g.awayTeam.teamCity,
          full_name: `${g.awayTeam.teamCity} ${g.awayTeam.teamName}`,
          abbreviation: g.awayTeam.teamTricode,
          conference: "",
          division: "",
        },
        visitor_team_score: g.awayTeam.score,
      })
    );

    // Update cache
    scoreboardCache = { data: games, time: Date.now(), date: gameDate };
    return games;
  } catch (error: any) {
    clearTimeout(timeoutId);
    // Return stale cache if available
    if (scoreboardCache && scoreboardCache.date === gameDate) {
      return scoreboardCache.data;
    }
    throw error;
  }
}
