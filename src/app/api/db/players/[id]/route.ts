import { NextRequest, NextResponse } from "next/server";
import { getPlayerById } from "@/lib/db/players";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const playerId = parseInt(id, 10);
    if (isNaN(playerId)) {
      return NextResponse.json({ error: "Invalid player ID" }, { status: 400 });
    }

    const player = await getPlayerById(playerId);
    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    const currentStats = player.stats[0];

    // Map to BDL-compatible format
    const data = {
      id: player.id,
      first_name: player.firstName,
      last_name: player.lastName,
      position: player.position || "",
      height: player.height,
      weight: player.weight,
      jersey_number: player.jerseyNumber || "",
      college: player.college || "",
      country: player.country || "",
      draft_year: player.draftYear,
      draft_round: player.draftRound,
      draft_number: player.draftNumber,
      team: player.team
        ? {
            id: player.team.id,
            name: player.team.name,
            city: player.team.city,
            full_name: `${player.team.city} ${player.team.name}`,
            abbreviation: player.team.abbreviation,
            conference: player.team.conference,
            division: player.team.division,
          }
        : null,
      season_averages: currentStats
        ? {
            id: currentStats.id,
            player_id: player.id,
            season: parseInt(currentStats.season.split("-")[0]) || 0,
            games_played: currentStats.gamesPlayed,
            min: currentStats.mpg.toString(),
            pts: currentStats.ppg,
            reb: currentStats.rpg,
            ast: currentStats.apg,
            stl: currentStats.spg,
            blk: currentStats.bpg,
            turnover: currentStats.topg,
            fg_pct: currentStats.fgPct,
            fg3_pct: currentStats.threePct,
            ft_pct: currentStats.ftPct,
            fgm: currentStats.fgm,
            fga: currentStats.fga,
            fg3m: currentStats.fg3m,
            fg3a: currentStats.fg3a,
            ftm: currentStats.ftm,
            fta: currentStats.fta,
            oreb: currentStats.oreb,
            dreb: currentStats.dreb,
            pf: currentStats.pf,
          }
        : null,
    };

    return NextResponse.json({ data });
  } catch (error) {
    console.error("[api/db/players/[id]] Error:", error);
    return NextResponse.json({ error: "Failed to fetch player" }, { status: 500 });
  }
}
