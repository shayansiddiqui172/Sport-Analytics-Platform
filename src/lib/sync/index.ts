import prisma from "@/lib/db/prisma";
import { syncTeams } from "./sync-teams";
import { syncPlayers } from "./sync-players";
import { syncGames, syncSeasonGames } from "./sync-games";
import { syncGameStats } from "./sync-game-stats";

async function updateSyncTimestamp(key: string) {
  await prisma.cacheEntry.upsert({
    where: { key },
    update: {
      data: { lastSync: new Date().toISOString() },
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
    create: {
      key,
      data: { lastSync: new Date().toISOString() },
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  });
}

async function getLastSyncTime(key: string): Promise<Date | null> {
  const entry = await prisma.cacheEntry.findUnique({ where: { key } });
  if (!entry) return null;
  const data = entry.data as { lastSync?: string };
  return data.lastSync ? new Date(data.lastSync) : null;
}

export interface SyncResult {
  type: "quick" | "full";
  duration: number;
  results: Record<string, any>;
  errors: string[];
}

/**
 * Quick sync — games + game stats.
 * Runs frequently (every 30 min or during games).
 */
export async function runQuickSync(): Promise<SyncResult> {
  const start = Date.now();
  const results: Record<string, any> = {};
  const errors: string[] = [];

  // Sync recent games
  try {
    results.games = await syncGames();
    await updateSyncTimestamp("sync:games");
  } catch (e: any) {
    errors.push(`games: ${e.message}`);
    console.error("[quick-sync] Games sync failed:", e);
  }

  // Sync box scores for completed games
  try {
    results.gameStats = await syncGameStats();
    await updateSyncTimestamp("sync:game-stats");
  } catch (e: any) {
    errors.push(`gameStats: ${e.message}`);
    console.error("[quick-sync] Game stats sync failed:", e);
  }

  return {
    type: "quick",
    duration: Date.now() - start,
    results,
    errors,
  };
}

/**
 * Full sync — everything including teams and players.
 * Runs daily or on first seed.
 */
export async function runFullSync(): Promise<SyncResult> {
  const start = Date.now();
  const results: Record<string, any> = {};
  const errors: string[] = [];

  // 1. Sync teams first (players reference teams)
  try {
    results.teams = await syncTeams();
    await updateSyncTimestamp("sync:teams");
  } catch (e: any) {
    errors.push(`teams: ${e.message}`);
    console.error("[full-sync] Teams sync failed:", e);
  }

  // 2. Sync players + season stats
  try {
    results.players = await syncPlayers();
    await updateSyncTimestamp("sync:players");
  } catch (e: any) {
    errors.push(`players: ${e.message}`);
    console.error("[full-sync] Players sync failed:", e);
  }

  // 3. Sync games (wider date range)
  try {
    results.games = await syncSeasonGames();
    await updateSyncTimestamp("sync:games");
  } catch (e: any) {
    errors.push(`games: ${e.message}`);
    console.error("[full-sync] Games sync failed:", e);
  }

  // 4. Sync box scores for completed games
  try {
    results.gameStats = await syncGameStats();
    await updateSyncTimestamp("sync:game-stats");
  } catch (e: any) {
    errors.push(`gameStats: ${e.message}`);
    console.error("[full-sync] Game stats sync failed:", e);
  }

  return {
    type: "full",
    duration: Date.now() - start,
    results,
    errors,
  };
}

/**
 * Get sync status — last sync times for each data type.
 */
export async function getSyncStatus() {
  const keys = ["sync:teams", "sync:players", "sync:games", "sync:game-stats"];
  const status: Record<string, string | null> = {};

  for (const key of keys) {
    const lastSync = await getLastSyncTime(key);
    status[key] = lastSync?.toISOString() || null;
  }

  return status;
}
