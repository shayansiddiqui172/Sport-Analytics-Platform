import prisma from "@/lib/db/prisma";

const BDL_BASE = "https://api.balldontlie.io/v1";

async function fetchBDL<T>(endpoint: string): Promise<T> {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (process.env.NEXT_PUBLIC_BALLDONTLIE_API_KEY) {
    headers["Authorization"] = process.env.NEXT_PUBLIC_BALLDONTLIE_API_KEY;
  }
  const res = await fetch(`${BDL_BASE}${endpoint}`, { headers });
  if (!res.ok) throw new Error(`BDL API error: ${res.status}`);
  return res.json();
}

interface BDLStatEntry {
  id: number;
  player: { id: number };
  game: { id: number };
  min: string;
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  turnover: number;
  fg_pct: number;
  fg3_pct: number;
  ft_pct: number;
  fgm: number;
  fga: number;
  fg3m: number;
  fg3a: number;
  ftm: number;
  fta: number;
  oreb: number;
  dreb: number;
  pf: number;
}

/**
 * Sync box score stats for recently completed games.
 * Finds FINAL games without player stats and fetches their box scores.
 */
export async function syncGameStats(): Promise<{ synced: number }> {
  // Find completed games that don't have player stats yet
  const gamesNeedingStats = await prisma.game.findMany({
    where: {
      status: "FINAL",
      playerStats: { none: {} },
    },
    orderBy: { date: "desc" },
    take: 20, // Process up to 20 games at a time
  });

  let synced = 0;

  for (const game of gamesNeedingStats) {
    try {
      const params = new URLSearchParams({
        "game_ids[]": game.id.toString(),
        per_page: "100",
      });
      const { data: stats } = await fetchBDL<{ data: BDLStatEntry[] }>(
        `/stats?${params}`
      );

      for (const stat of stats) {
        const minutes = parseInt(stat.min) || 0;

        // Verify the player exists in DB
        const playerExists = await prisma.player.findUnique({
          where: { id: stat.player.id },
        });
        if (!playerExists) continue;

        await prisma.gamePlayerStats.upsert({
          where: {
            gameId_playerId: {
              gameId: game.id,
              playerId: stat.player.id,
            },
          },
          update: {
            minutes,
            points: stat.pts || 0,
            rebounds: stat.reb || 0,
            assists: stat.ast || 0,
            steals: stat.stl || 0,
            blocks: stat.blk || 0,
            turnovers: stat.turnover || 0,
            fgMade: stat.fgm || 0,
            fgAttempts: stat.fga || 0,
            threeMade: stat.fg3m || 0,
            threeAttempts: stat.fg3a || 0,
            ftMade: stat.ftm || 0,
            ftAttempts: stat.fta || 0,
            oreb: stat.oreb || 0,
            dreb: stat.dreb || 0,
            personalFouls: stat.pf || 0,
            plusMinus: 0,
          },
          create: {
            gameId: game.id,
            playerId: stat.player.id,
            minutes,
            points: stat.pts || 0,
            rebounds: stat.reb || 0,
            assists: stat.ast || 0,
            steals: stat.stl || 0,
            blocks: stat.blk || 0,
            turnovers: stat.turnover || 0,
            fgMade: stat.fgm || 0,
            fgAttempts: stat.fga || 0,
            threeMade: stat.fg3m || 0,
            threeAttempts: stat.fg3a || 0,
            ftMade: stat.ftm || 0,
            ftAttempts: stat.fta || 0,
            oreb: stat.oreb || 0,
            dreb: stat.dreb || 0,
            personalFouls: stat.pf || 0,
            plusMinus: 0,
          },
        });
        synced++;
      }

      // Rate limit between games
      await new Promise((r) => setTimeout(r, 500));
    } catch (e) {
      console.warn(`[sync-game-stats] Failed for game ${game.id}:`, e);
    }
  }

  console.log(`[sync-game-stats] Upserted ${synced} player game stats`);
  return { synced };
}
