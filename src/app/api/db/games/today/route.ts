import { NextResponse } from "next/server";
import { getTodayGames } from "@/lib/db/games";

export async function GET() {
  try {
    const games = await getTodayGames();

    // Map to BDL-compatible format
    const data = games.map((g) => ({
      id: g.id,
      date: g.date.toISOString().split("T")[0],
      season: g.season,
      status: g.status.toLowerCase().replace(" ", "_"),
      period: g.period,
      time: g.timeRemaining || "",
      postseason: g.postseason,
      home_team: {
        id: g.homeTeam.id,
        name: g.homeTeam.name,
        city: g.homeTeam.city,
        full_name: `${g.homeTeam.city} ${g.homeTeam.name}`,
        abbreviation: g.homeTeam.abbreviation,
        conference: g.homeTeam.conference,
        division: g.homeTeam.division,
      },
      home_team_score: g.homeScore || 0,
      visitor_team: {
        id: g.awayTeam.id,
        name: g.awayTeam.name,
        city: g.awayTeam.city,
        full_name: `${g.awayTeam.city} ${g.awayTeam.name}`,
        abbreviation: g.awayTeam.abbreviation,
        conference: g.awayTeam.conference,
        division: g.awayTeam.division,
      },
      visitor_team_score: g.awayScore || 0,
    }));

    return NextResponse.json({
      data,
      meta: {
        total_count: data.length,
        current_page: 1,
        total_pages: 1,
        per_page: data.length,
        next_page: null,
      },
    });
  } catch (error) {
    console.error("[api/db/games/today] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch today's games" },
      { status: 500 }
    );
  }
}
