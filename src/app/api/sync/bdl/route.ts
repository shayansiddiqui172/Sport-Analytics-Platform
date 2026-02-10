import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import * as api from "@/lib/api/balldontlie";
import { getNBASeasonString } from "@/lib/utils/nba-season";

/**
 * Fast sync from BallDon'tLie API
 * Populates players and their current season stats
 */
export async function POST(request: NextRequest) {
  // Verify sync secret
  const secret = process.env.SYNC_SECRET;
  if (secret) {
    const authHeader = request.headers.get("authorization");
    const querySecret = new URL(request.url).searchParams.get("secret");
    const provided = authHeader?.replace("Bearer ", "") || querySecret;

    if (provided !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const start = Date.now();
  let playersAdded = 0;
  let statsAdded = 0;
  const errors: string[] = [];

  try {
    // Get all teams first
    const teamsRes = await api.getTeams();
    const teams = teamsRes.data || [];

    if (!teams.length) {
      return NextResponse.json({ error: "No teams found from BDL" }, { status: 500 });
    }

    // Sync teams
    for (const team of teams) {
      await prisma.team.upsert({
        where: { id: team.id },
        update: {
          name: team.name,
          city: team.city,
          abbreviation: team.abbreviation,
          conference: team.conference,
          division: team.division,
        },
        create: {
          id: team.id,
          name: team.name,
          city: team.city,
          abbreviation: team.abbreviation,
          conference: team.conference,
          division: team.division,
        },
      });
    }

    // Fetch all players from BDL (paginated, per_page=100)
    let page = 1;
    let hasMore = true;
    const allPlayers = [];

    while (hasMore) {
      try {
        const res = await api.getPlayers({ page, per_page: 100 });
        const players = res.data || [];
        
        if (!players.length) {
          hasMore = false;
          break;
        }

        allPlayers.push(...players);

        // Check if there are more pages
        if (res.meta && res.meta.current_page >= res.meta.total_pages) {
          hasMore = false;
        } else {
          page++;
        }
      } catch (e) {
        console.error(`[sync-bdl] Error fetching players page ${page}:`, e);
        hasMore = false;
      }
    }

    console.log(`[sync-bdl] Fetched ${allPlayers.length} players from BDL`);

    // Sync players
    for (const player of allPlayers) {
      const teamId = player.team?.id || null;
      const existing = await prisma.player.findUnique({
        where: { id: player.id },
      });

      if (existing) {
        // Update existing player
        await prisma.player.update({
          where: { id: player.id },
          data: {
            firstName: player.first_name,
            lastName: player.last_name,
            position: player.position,
            height: player.height,
            weight: player.weight,
            jerseyNumber: player.jersey_number,
            college: player.college,
            country: player.country,
            draftYear: player.draft_year,
            draftRound: player.draft_round,
            draftNumber: player.draft_number,
            teamId,
          },
        });
      } else {
        // Create new player
        await prisma.player.create({
          data: {
            id: player.id,
            firstName: player.first_name,
            lastName: player.last_name,
            position: player.position,
            height: player.height,
            weight: player.weight,
            jerseyNumber: player.jersey_number,
            college: player.college,
            country: player.country,
            draftYear: player.draft_year,
            draftRound: player.draft_round,
            draftNumber: player.draft_number,
            teamId,
          },
        });
        playersAdded++;
      }
    }

    // Sync season stats for all players
    const seasonStr = getNBASeasonString();
    const currentSeason = parseInt(seasonStr.split("-")[0]);

    for (let i = 0; i < allPlayers.length; i += 25) {
      const batch = allPlayers.slice(i, i + 25);
      const playerIds = batch.map((p) => p.id);

      try {
        const statsRes = await api.getSeasonAverages({
          season: currentSeason,
          player_ids: playerIds,
        });

        const stats = statsRes.data || [];

        for (const stat of stats) {
          await prisma.playerStats.upsert({
            where: {
              playerId_season: {
                playerId: stat.player_id,
                season: seasonStr,
              },
            },
            update: {
              gamesPlayed: stat.games_played,
              mpg: parseFloat(stat.min?.toString() || "0"),
              ppg: stat.pts,
              rpg: stat.reb,
              apg: stat.ast,
              spg: stat.stl,
              bpg: stat.blk,
              topg: stat.turnover,
              fgPct: stat.fg_pct,
              threePct: stat.fg3_pct,
              ftPct: stat.ft_pct,
            },
            create: {
              playerId: stat.player_id,
              season: seasonStr,
              gamesPlayed: stat.games_played,
              mpg: parseFloat(stat.min?.toString() || "0"),
              ppg: stat.pts,
              rpg: stat.reb,
              apg: stat.ast,
              spg: stat.stl,
              bpg: stat.blk,
              topg: stat.turnover,
              fgPct: stat.fg_pct,
              threePct: stat.fg3_pct,
              ftPct: stat.ft_pct,
            },
          });
          statsAdded++;
        }
      } catch (e) {
        console.warn(`[sync-bdl] Error fetching stats for player batch ${i}:`, e);
      }
    }

    const duration = Date.now() - start;

    return NextResponse.json({
      success: true,
      type: "bdl",
      duration,
      results: {
        playersAdded,
        statsAdded,
      },
      errors,
      message: `Synced ${playersAdded} players and ${statsAdded} stat records in ${(duration / 1000).toFixed(1)}s`,
    });
  } catch (error: any) {
    console.error("[api/sync/bdl] BDL sync failed:", error);
    return NextResponse.json(
      { error: `Sync failed: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({ message: "POST to /api/sync/bdl?secret=YOUR_SECRET to run BDL sync" });
}
