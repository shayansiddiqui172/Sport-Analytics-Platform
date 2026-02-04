import { NextRequest, NextResponse } from "next/server";
import { getTeamById } from "@/lib/db/teams";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const teamId = parseInt(id, 10);
    if (isNaN(teamId)) {
      return NextResponse.json({ error: "Invalid team ID" }, { status: 400 });
    }

    const team = await getTeamById(teamId);
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Map to BDL-compatible format
    const data = {
      id: team.id,
      name: team.name,
      city: team.city,
      full_name: `${team.city} ${team.name}`,
      abbreviation: team.abbreviation,
      conference: team.conference,
      division: team.division,
      players: team.players.map((p) => ({
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
        stats: p.stats[0]
          ? {
              games_played: p.stats[0].gamesPlayed,
              ppg: p.stats[0].ppg,
              rpg: p.stats[0].rpg,
              apg: p.stats[0].apg,
              spg: p.stats[0].spg,
              bpg: p.stats[0].bpg,
              topg: p.stats[0].topg,
              fg_pct: p.stats[0].fgPct,
              three_pct: p.stats[0].threePct,
              ft_pct: p.stats[0].ftPct,
              mpg: p.stats[0].mpg,
            }
          : null,
      })),
    };

    return NextResponse.json({ data });
  } catch (error) {
    console.error("[api/db/teams/[id]] Error:", error);
    return NextResponse.json({ error: "Failed to fetch team" }, { status: 500 });
  }
}
