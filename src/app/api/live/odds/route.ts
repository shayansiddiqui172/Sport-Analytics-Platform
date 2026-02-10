import { NextResponse } from "next/server";
import { fetchNBAOdds, parseGameOdds } from "@/lib/predictions";

/**
 * NBA Odds API
 * 
 * Fetches current betting odds for NBA games from The Odds API.
 * Includes moneylines, spreads, totals, and win probabilities.
 * 
 * Cache: 10 minutes (odds don't change that frequently)
 */
export async function GET() {
  try {
    const events = await fetchNBAOdds();
    const odds = events.map(parseGameOdds);

    return NextResponse.json(odds, {
      headers: {
        "Cache-Control": "public, max-age=600, s-maxage=600", // 10 minutes
      },
    });
  } catch (error) {
    console.error("[api/live/odds] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch odds" },
      { status: 500 }
    );
  }
}
