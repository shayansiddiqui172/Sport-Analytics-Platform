/**
 * NBA.com Scoreboard API
 *
 * Fetches live/today's game scores from NBA.com CDN endpoint (primary)
 * with fallback to stats.nba.com API. The CDN endpoint is accessible from
 * cloud servers like Vercel, while stats.nba.com blocks cloud IPs.
 *
 * Used by the /api/live/scores route to serve live game data.
 */

import type { Game, GameStatus } from "@/types";

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

/** Map NBA.com scoreboard games to our Game type */
function mapGames(games: ScoreboardGame[], gameDate: string): Game[] {
  return games.map(
    (g: ScoreboardGame): Game => ({
      id: parseInt(g.gameId, 10),
      date: g.gameTimeUTC || gameDate,
      season:
        new Date(gameDate).getMonth() >= 9
          ? new Date(gameDate).getFullYear()
          : new Date(gameDate).getFullYear() - 1,
      status: mapGameStatus(g.gameStatus),
      period: g.period,
      time:
        g.gameStatus === 2
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
}

/**
 * Fetch today's scoreboard from NBA.com CDN (primary) or stats API (fallback).
 * Returns games mapped to our Game type.
 *
 * CDN endpoint works from cloud servers (Vercel) while stats.nba.com blocks them.
 * CDN only serves today's games, so historical dates fall back to stats API or cache.
 */
export async function fetchScoreboard(date?: string): Promise<Game[]> {
  const gameDate = date || new Date().toISOString().split("T")[0];
  const isToday = gameDate === new Date().toISOString().split("T")[0];

  // Check cache
  if (
    scoreboardCache &&
    scoreboardCache.date === gameDate &&
    Date.now() - scoreboardCache.time < CACHE_TTL
  ) {
    return scoreboardCache.data;
  }

  // Try CDN endpoint first (only works for today's games)
  if (isToday) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

      const cdnUrl = `https://cdn.nba.com/static/json/liveData/scoreboard/todaysScoreboard_00.json`;
      const response = await fetch(cdnUrl, {
        signal: controller.signal,
        headers: {
          Accept: "application/json",
        },
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const scoreboard = data.scoreboard;

        if (scoreboard?.games) {
          const games = mapGames(scoreboard.games, scoreboard.gameDate || gameDate);
          scoreboardCache = { data: games, time: Date.now(), date: gameDate };
          return games;
        }
      }
    } catch (cdnError) {
      console.warn("[nba-scoreboard] CDN fetch failed, trying stats API:", cdnError);
    }
  }

  // Fallback to stats.nba.com API (may be blocked on cloud servers)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const url = `https://stats.nba.com/stats/scoreboardv3?GameDate=${gameDate}&LeagueID=00`;
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: "https://www.nba.com/",
        Accept: "application/json, text/plain, */*",
        Origin: "https://www.nba.com",
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`NBA stats API error: ${response.status}`);
    }

    const data = await response.json();
    const scoreboard = data.scoreboard;

    if (!scoreboard?.games) {
      return [];
    }

    const games = mapGames(scoreboard.games, gameDate);
    scoreboardCache = { data: games, time: Date.now(), date: gameDate };
    return games;
  } catch (error: any) {
    clearTimeout(timeoutId);
    // Return stale cache if available
    if (scoreboardCache && scoreboardCache.date === gameDate) {
      console.warn("[nba-scoreboard] All sources failed, using stale cache");
      return scoreboardCache.data;
    }
    throw new Error(`Failed to fetch scoreboard: ${error.message}`);
  }
}
