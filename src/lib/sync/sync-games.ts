import prisma from "@/lib/db/prisma";
import { getNBASeason } from "@/lib/utils/nba-season";

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

function mapBDLStatus(status: string): "SCHEDULED" | "IN_PROGRESS" | "FINAL" {
  const s = status?.toLowerCase() || "";
  if (s.includes("final") || s === "final") return "FINAL";
  if (
    s.includes("progress") ||
    s.includes("1st") ||
    s.includes("2nd") ||
    s.includes("3rd") ||
    s.includes("4th") ||
    s.includes("ot") ||
    s.includes("half")
  )
    return "IN_PROGRESS";
  return "SCHEDULED";
}

interface BDLGame {
  id: number;
  date: string;
  season: number;
  status: string;
  period: number;
  time: string;
  postseason: boolean;
  home_team: { id: number };
  home_team_score: number;
  visitor_team: { id: number };
  visitor_team_score: number;
}

export async function syncGames(options?: {
  dates?: string[];
  season?: number;
}): Promise<{ synced: number }> {
  const season = options?.season || getNBASeason();

  // If specific dates provided, fetch those; otherwise fetch today + yesterday
  let datesToFetch: string[];
  if (options?.dates?.length) {
    datesToFetch = options.dates;
  } else {
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    datesToFetch = [
      today.toISOString().split("T")[0],
      yesterday.toISOString().split("T")[0],
    ];
  }

  let synced = 0;

  for (const date of datesToFetch) {
    try {
      const params = new URLSearchParams({
        "dates[]": date,
        "seasons[]": season.toString(),
        per_page: "100",
      });
      const { data: games } = await fetchBDL<{ data: BDLGame[] }>(
        `/games?${params}`
      );

      for (const game of games) {
        // Verify both teams exist in DB
        const homeTeam = await prisma.team.findUnique({
          where: { id: game.home_team.id },
        });
        const awayTeam = await prisma.team.findUnique({
          where: { id: game.visitor_team.id },
        });

        if (!homeTeam || !awayTeam) {
          console.warn(
            `[sync-games] Skipping game ${game.id}: missing team(s) (home=${game.home_team.id}, away=${game.visitor_team.id})`
          );
          continue;
        }

        await prisma.game.upsert({
          where: { id: game.id },
          update: {
            homeScore: game.home_team_score || null,
            awayScore: game.visitor_team_score || null,
            status: mapBDLStatus(game.status),
            period: game.period || 0,
            timeRemaining: game.time || null,
          },
          create: {
            id: game.id,
            date: new Date(game.date),
            season: game.season,
            homeTeamId: game.home_team.id,
            awayTeamId: game.visitor_team.id,
            homeScore: game.home_team_score || null,
            awayScore: game.visitor_team_score || null,
            status: mapBDLStatus(game.status),
            period: game.period || 0,
            timeRemaining: game.time || null,
            postseason: game.postseason || false,
          },
        });
        synced++;
      }

      // Small delay between date fetches
      await new Promise((r) => setTimeout(r, 300));
    } catch (e) {
      console.warn(`[sync-games] Failed to sync games for ${date}:`, e);
    }
  }

  console.log(`[sync-games] Upserted ${synced} games`);
  return { synced };
}

/**
 * Sync a wider range of games for the current season.
 * Used during full sync to backfill historical games.
 */
export async function syncSeasonGames(
  season?: number
): Promise<{ synced: number }> {
  const s = season || getNBASeason();
  
  // Use start and end date for efficient range querying
  const seasonStart = `${s - 1}-10-15`; // October 15, 2024 for 2025 season
  const today = new Date().toISOString().split("T")[0];
  
  console.log(`[sync-season-games] Syncing games from ${seasonStart} to ${today} for season ${s}`);
  
  let synced = 0;
  let cursor: number | null = null;
  let hasMore = true;
  let pageCount = 0;

  while (hasMore) {
    try {
      const params = new URLSearchParams({
        "seasons[]": s.toString(),
        start_date: seasonStart,
        end_date: today,
        per_page: "100",
      });
      
      if (cursor) {
        params.set("cursor", cursor.toString());
      }

      const response = await fetchBDL<{ data: BDLGame[]; meta: { next_cursor?: number } }>(
        `/games?${params}`
      );

      const games = response.data;
      pageCount++;
      console.log(`[sync-season-games] Processing page ${pageCount} (${games.length} games)`);

      for (const game of games) {
        // Verify both teams exist in DB
        const homeTeam = await prisma.team.findUnique({
          where: { id: game.home_team.id },
        });
        const awayTeam = await prisma.team.findUnique({
          where: { id: game.visitor_team.id },
        });

        if (!homeTeam || !awayTeam) {
          console.warn(
            `[sync-games] Skipping game ${game.id}: missing team(s) (home=${game.home_team.id}, away=${game.visitor_team.id})`
          );
          continue;
        }

        await prisma.game.upsert({
          where: { id: game.id },
          update: {
            homeScore: game.home_team_score || null,
            awayScore: game.visitor_team_score || null,
            status: mapBDLStatus(game.status),
            period: game.period || 0,
            timeRemaining: game.time || null,
          },
          create: {
            id: game.id,
            date: new Date(game.date),
            season: game.season,
            homeTeamId: game.home_team.id,
            awayTeamId: game.visitor_team.id,
            homeScore: game.home_team_score || null,
            awayScore: game.visitor_team_score || null,
            status: mapBDLStatus(game.status),
            period: game.period || 0,
            timeRemaining: game.time || null,
            postseason: game.postseason || false,
          },
        });
        synced++;
      }

      // Check if there are more pages
      hasMore = response.meta.next_cursor !== undefined && response.meta.next_cursor !== null;
      cursor = response.meta.next_cursor !== undefined ? response.meta.next_cursor : null;

      if (hasMore) {
        console.log(`[sync-season-games] More pages available, continuing...`);
        await new Promise((r) => setTimeout(r, 500)); // Rate limit protection
      }
    } catch (e) {
      console.error(`[sync-season-games] Failed to sync games:`, e);
      hasMore = false;
    }
  }

  console.log(`[sync-season-games] Completed: Upserted ${synced} games across ${pageCount} pages`);
  return { synced };
}
