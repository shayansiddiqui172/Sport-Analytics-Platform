import { NextRequest, NextResponse } from "next/server";
import { getGames } from "@/lib/db/games";
import { getNBASeason } from "@/lib/utils/nba-season";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const date = searchParams.get("date") || undefined;
    const season = searchParams.get("season")
      ? parseInt(searchParams.get("season")!)
      : getNBASeason();
    const teamId = searchParams.get("team_id")
      ? parseInt(searchParams.get("team_id")!)
      : undefined;
    const startDate = searchParams.get("start_date") || undefined;
    const endDate = searchParams.get("end_date") || undefined;
    const limit = searchParams.get("limit")
      ? parseInt(searchParams.get("limit")!)
      : 100;

    const games = await getGames({ date, season, teamId, startDate, endDate, limit });

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
        per_page: limit,
        next_page: null,
      },
    });
  } catch (error) {
    console.error("[api/db/games] Error:", error);
    return NextResponse.json({ error: "Failed to fetch games" }, { status: 500 });
  }
}
