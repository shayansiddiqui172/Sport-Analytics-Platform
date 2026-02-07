import { NextRequest, NextResponse } from "next/server";
import { fetchScoreboard } from "@/lib/api/nba-scoreboard";

/**
 * Live Scores API
 *
 * Fetches real-time game scores from NBA.com's scoreboard endpoint.
 * Includes a 15s server-side cache so multiple clients polling every 30s
 * only result in ~2-4 actual NBA.com requests per minute.
 *
 * Query params:
 *   date (optional) - YYYY-MM-DD format, defaults to today
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date") || undefined;

    const games = await fetchScoreboard(date);
    const hasLiveGames = games.some((g) => g.status === "in_progress");

    return NextResponse.json(
      {
        data: games,
        meta: {
          total_count: games.length,
          has_live_games: hasLiveGames,
          current_page: 1,
          total_pages: 1,
          per_page: games.length,
          next_page: null,
        },
      },
      {
        headers: {
          // Short browser cache — clients poll every 30s anyway
          "Cache-Control": "public, max-age=10, s-maxage=15",
        },
      }
    );
  } catch (error) {
    console.error("[api/live/scores] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch live scores" },
      { status: 500 }
    );
  }
}
