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
 * Cache: 1 week (futures odds update slowly, conserves API quota)
 */

// Revalidate every week to save API quota
export const revalidate = 604800; // 7 days in seconds

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
          // 1 week cache (matches revalidate interval)
          "Cache-Control": "public, max-age=604800, s-maxage=604800",
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
