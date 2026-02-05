import { NextRequest, NextResponse } from "next/server";
import { searchPlayers } from "@/lib/db/players";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";

    // Allow searches with even 1 character for instant filtering
    if (query.length < 1) {
      // If no query, return all players (limited)
      const allPlayers = await searchPlayers("", 1000);
      const data = allPlayers.map((p) => ({
        id: p.id,
        first_name: p.firstName,
        last_name: p.lastName,
        position: p.position || "",
        height: p.height,
        weight: p.weight,
        jersey_number: p.jerseyNumber || "",
        college: p.college || "",
        country: p.country || "",
        draft_year: p.draftYear,
        draft_round: p.draftRound,
        draft_number: p.draftNumber,
        _source: "db",
        team: p.team
          ? {
              id: p.team.id,
              name: p.team.name,
              city: p.team.city,
              full_name: `${p.team.city} ${p.team.name}`,
              abbreviation: p.team.abbreviation,
              conference: p.team.conference,
              division: p.team.division,
            }
          : null,
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
    }

    const limit = searchParams.get("limit")
      ? parseInt(searchParams.get("limit")!)
      : 10;

    const players = await searchPlayers(query, limit);

    // Map to BDL-compatible format from database only
    const data = players.map((p) => ({
      id: p.id,
      first_name: p.firstName,
      last_name: p.lastName,
      position: p.position || "",
      height: p.height,
      weight: p.weight,
      jersey_number: p.jerseyNumber || "",
      college: p.college || "",
      country: p.country || "",
      draft_year: p.draftYear,
      draft_round: p.draftRound,
      draft_number: p.draftNumber,
      _source: "db", // Mark as database player
      team: p.team
        ? {
            id: p.team.id,
            name: p.team.name,
            city: p.team.city,
            full_name: `${p.team.city} ${p.team.name}`,
            abbreviation: p.team.abbreviation,
            conference: p.team.conference,
            division: p.team.division,
          }
        : null,
    }));

    return NextResponse.json({
      data: data.slice(0, limit),
      meta: {
        total_count: data.length,
        current_page: 1,
        total_pages: 1,
        per_page: limit,
        next_page: null,
      },
    });
  } catch (error) {
    console.error("[api/db/players/search] Error:", error);
    return NextResponse.json(
      { error: "Failed to search players" },
      { status: 500 }
    );
  }
}
