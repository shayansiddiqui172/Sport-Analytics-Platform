import { NextResponse } from "next/server";
import { getNBASeason } from "@/lib/utils/nba-season";

const BDL_BASE = "https://api.balldontlie.io/v1";

async function fetchBDL<T>(endpoint: string): Promise<T> {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (process.env.NEXT_PUBLIC_BALLDONTLIE_API_KEY) {
    headers["Authorization"] = process.env.NEXT_PUBLIC_BALLDONTLIE_API_KEY;
  }
  const res = await fetch(`${BDL_BASE}${endpoint}`, { 
    headers,
    next: { revalidate: 300 } // Cache for 5 minutes
  });
  if (!res.ok) throw new Error(`BDL API error: ${res.status}`);
  return res.json();
}

export async function GET() {
  try {
    const season = getNBASeason();
    
    // Calculate season start and today
    const seasonStart = `${season - 1}-10-15`;
    const today = new Date().toISOString().split("T")[0];
    
    // Fetch all games for the season using pagination
    const records = new Map<number, { wins: number; losses: number }>();
    let cursor: number | null = null;
    let hasMore = true;
    let pageCount = 0;

    while (hasMore && pageCount < 20) { // Safety limit: max 20 pages (2000 games)
      const params = new URLSearchParams({
        "seasons[]": season.toString(),
        start_date: seasonStart,
        end_date: today,
        per_page: "100",
      });
      
      if (cursor) {
        params.set("cursor", cursor.toString());
      }

      const response = await fetchBDL<{ 
        data: Array<{
          id: number;
          status: string;
          home_team: { id: number };
          home_team_score: number;
          visitor_team: { id: number };
          visitor_team_score: number;
        }>;
        meta: { next_cursor?: number };
      }>(`/games?${params}`);

      pageCount++;

      // Process games
      for (const game of response.data) {
        const status = game.status?.toLowerCase() || "";
        const isFinal = status.includes("final") || status === "final";
        
        if (!isFinal || !game.home_team_score || !game.visitor_team_score) continue;

        const homeWon = game.home_team_score > game.visitor_team_score;

        // Home team
        const homeRecord = records.get(game.home_team.id) || { wins: 0, losses: 0 };
        if (homeWon) homeRecord.wins++;
        else homeRecord.losses++;
        records.set(game.home_team.id, homeRecord);

        // Away team
        const awayRecord = records.get(game.visitor_team.id) || { wins: 0, losses: 0 };
        if (!homeWon) awayRecord.wins++;
        else awayRecord.losses++;
        records.set(game.visitor_team.id, awayRecord);
      }

      // Check for more pages
      hasMore = response.meta.next_cursor !== undefined && response.meta.next_cursor !== null;
      cursor = response.meta.next_cursor !== undefined ? response.meta.next_cursor : null;
    }

    // Convert to array format
    const standings = Array.from(records.entries()).map(([teamId, record]) => ({
      teamId,
      wins: record.wins,
      losses: record.losses,
    }));

    return NextResponse.json({ data: standings });
  } catch (error) {
    console.error("[api/db/teams/standings] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch standings" },
      { status: 500 }
    );
  }
}
