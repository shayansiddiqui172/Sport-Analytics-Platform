import { NextRequest, NextResponse } from "next/server";
import { getPlayerCareerStats } from "@/lib/db/players";

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

    const stats = await getPlayerCareerStats(playerId);

    // Map to BDL-compatible PlayerStats format
    const data = stats.map((s) => ({
      id: s.id,
      player_id: s.playerId,
      season: parseInt(s.season.split("-")[0]) || 0,
      games_played: s.gamesPlayed,
      min: s.mpg.toString(),
      pts: s.ppg,
      reb: s.rpg,
      ast: s.apg,
      stl: s.spg,
      blk: s.bpg,
      turnover: s.topg,
      fg_pct: s.fgPct,
      fg3_pct: s.threePct,
      ft_pct: s.ftPct,
      fgm: s.fgm,
      fga: s.fga,
      fg3m: s.fg3m,
      fg3a: s.fg3a,
      ftm: s.ftm,
      fta: s.fta,
      oreb: s.oreb,
      dreb: s.dreb,
      pf: s.pf,
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error("[api/db/players/[id]/career] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch career stats" },
      { status: 500 }
    );
  }
}
