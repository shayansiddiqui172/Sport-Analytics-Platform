import { notFound } from "next/navigation";
import PlayerPageClient from "./PlayerPageClient";
import { getPlayerById } from "@/lib/db/players";
import * as api from "@/lib/api/balldontlie";

interface PlayerPageProps {
  params: Promise<{ id: string }>;
}

export default async function PlayerPage({ params }: PlayerPageProps) {
  const { id } = await params;
  
  // Allow either numeric IDs or "bdl-123" format from search
  if (id.startsWith("bdl-")) {
    const numId = parseInt(id.replace(/^bdl-/, ""), 10);
    if (isNaN(numId) || numId <= 0) notFound();

    // Server-side fetch from Ball Don't Lie for immediate render
    try {
      const bdl = await api.getPlayer(numId);
      if (!bdl?.data) notFound();
      return <PlayerPageClient playerId={id} initialPlayer={bdl.data} />;
    } catch (e) {
      notFound();
    }
  }

  const playerId = Number(id);
  if (!Number.isInteger(playerId) || playerId <= 0) notFound();

  // Server-side fetch from DB first, then fall back to BDL
  try {
    const dbPlayer = await getPlayerById(playerId);
    if (dbPlayer) {
      // Map DB player to BDL-style shape expected by client hooks
      const currentStats = dbPlayer.stats && dbPlayer.stats[0] ? dbPlayer.stats[0] : null;
      const mapped = {
        id: dbPlayer.id,
        first_name: dbPlayer.firstName,
        last_name: dbPlayer.lastName,
        position: dbPlayer.position || "",
        height: dbPlayer.height,
        weight: dbPlayer.weight,
        jersey_number: dbPlayer.jerseyNumber || "",
        college: dbPlayer.college || "",
        country: dbPlayer.country || "",
        draft_year: dbPlayer.draftYear,
        draft_round: dbPlayer.draftRound,
        draft_number: dbPlayer.draftNumber,
        team: dbPlayer.team
          ? {
              id: dbPlayer.team.id,
              name: dbPlayer.team.name,
              city: dbPlayer.team.city,
              full_name: `${dbPlayer.team.city} ${dbPlayer.team.name}`,
              abbreviation: dbPlayer.team.abbreviation,
              conference: dbPlayer.team.conference,
              division: dbPlayer.team.division,
            }
          : null,
        season_averages: currentStats
          ? {
              id: currentStats.id,
              player_id: dbPlayer.id,
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

      return <PlayerPageClient playerId={playerId} initialPlayer={mapped} />;
    }
  } catch (e) {
    // DB lookup failed, continue to BDL fallback
  }

  // If not in DB, try BallDontLie
  try {
    const bdl = await api.getPlayer(playerId);
    if (bdl?.data) {
      return <PlayerPageClient playerId={playerId} initialPlayer={bdl.data} />;
    }
  } catch (e) {
    // BDL lookup also failed
  }

  notFound();
}
