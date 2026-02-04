import { NextRequest, NextResponse } from "next/server";
import { getPlayerGameStats } from "@/lib/db/players";
import { getNBASeason } from "@/lib/utils/nba-season";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const playerId = parseInt(id, 10);
    if (isNaN(playerId)) {
      return NextResponse.json({ error: "Invalid player ID" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const season = searchParams.get("season")
      ? parseInt(searchParams.get("season")!)
      : getNBASeason();
    const limit = searchParams.get("limit")
      ? parseInt(searchParams.get("limit")!)
      : 82;

    const gameStats = await getPlayerGameStats(playerId, season, limit);

    // Map to BDL-compatible GamePlayerStats format
    const data = gameStats.map((gs) => ({
      id: gs.id,
      player_id: gs.playerId,
      game: {
        id: gs.game.id,
        date: gs.game.date.toISOString().split("T")[0],
        season: gs.game.season,
        home_team_id: gs.game.homeTeamId,
        home_team_score: gs.game.homeScore || 0,
        visitor_team_id: gs.game.awayTeamId,
        visitor_team_score: gs.game.awayScore || 0,
        home_team: {
          id: gs.game.homeTeam.id,
          abbreviation: gs.game.homeTeam.abbreviation,
          name: gs.game.homeTeam.name,
          city: gs.game.homeTeam.city,
        },
        visitor_team: {
          id: gs.game.awayTeam.id,
          abbreviation: gs.game.awayTeam.abbreviation,
          name: gs.game.awayTeam.name,
          city: gs.game.awayTeam.city,
        },
      },
      min: gs.minutes.toString(),
      pts: gs.points,
      reb: gs.rebounds,
      ast: gs.assists,
      stl: gs.steals,
      blk: gs.blocks,
      turnover: gs.turnovers,
      fg_pct: gs.fgAttempts > 0 ? gs.fgMade / gs.fgAttempts : 0,
      fg3_pct: gs.threeAttempts > 0 ? gs.threeMade / gs.threeAttempts : 0,
      ft_pct: gs.ftAttempts > 0 ? gs.ftMade / gs.ftAttempts : 0,
      fgm: gs.fgMade,
      fga: gs.fgAttempts,
      fg3m: gs.threeMade,
      fg3a: gs.threeAttempts,
      ftm: gs.ftMade,
      fta: gs.ftAttempts,
      oreb: gs.oreb,
      dreb: gs.dreb,
      pf: gs.personalFouls,
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error("[api/db/players/[id]/games] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch game stats" },
      { status: 500 }
    );
  }
}
