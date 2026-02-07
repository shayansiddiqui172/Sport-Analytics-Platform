import { NextResponse } from "next/server";
import { fetchAllAwardPredictionsWithFallback, type AwardCategory } from "@/lib/predictions";

/**
 * Award Predictions API
 *
 * Fetches futures/outrights odds for NBA awards (MVP, Champion, ROTY, etc.)
 * from The Odds API and returns top 5 candidates per category with
 * implied win probabilities.
 *
 * Falls back to stat-based predictions when betting odds are unavailable.
 *
 * Cache: 30 minutes (futures odds don't change rapidly)
 */
export async function GET() {
  try {
    const awards = await fetchAllAwardPredictionsWithFallback();

    // Count how many awards have data
    const withData = awards.filter((a) => a.candidates.length > 0);

    return NextResponse.json(
      {
        data: awards,
        meta: {
          total_categories: awards.length,
          categories_with_data: withData.length,
          fetched_at: new Date().toISOString(),
        },
      },
      {
        headers: {
          // 30 minute browser cache, 1 hour CDN cache
          "Cache-Control": "public, max-age=1800, s-maxage=3600",
        },
      }
    );
  } catch (error) {
    console.error("[api/predictions/awards] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch award predictions" },
      { status: 500 }
    );
  }
}
