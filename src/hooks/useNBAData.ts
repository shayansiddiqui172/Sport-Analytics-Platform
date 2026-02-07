"use client";

import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import * as api from "@/lib/api/balldontlie";
import type { PlayerStats, Player, Team, Game, GamePlayerStats, PaginatedResponse } from "@/types";
import { fetchNBAOdds, fetchNBAScores, parseGameOdds } from "@/lib/predictions";
import { getNBASeason, getNBASeasonString } from "@/lib/utils/nba-season";

// ---------- helpers ----------

async function fetchDB<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`DB API ${res.status}`);
  return res.json();
}

/** Search DB by name, return the first matching player's DB ID */
async function findDBPlayerByName(firstName: string, lastName: string): Promise<number | null> {
  try {
    const q = encodeURIComponent(`${firstName} ${lastName}`);
    const res = await fetchDB<{ data: Array<{ id: number; first_name: string; last_name: string }> }>(
      `/api/db/players/search?q=${q}&limit=3`
    );
    if (!res.data?.length) return null;
    // Prefer exact match
    const exact = res.data.find(
      (p) => p.first_name.toLowerCase() === firstName.toLowerCase() && p.last_name.toLowerCase() === lastName.toLowerCase()
    );
    return exact ? exact.id : res.data[0].id;
  } catch {
    return null;
  }
}

/** Fetch with a timeout — resolves to null on failure instead of throwing */
async function fetchWithTimeout<T>(url: string, timeoutMs: number): Promise<T | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    return res.json();
  } catch {
    clearTimeout(timer);
    return null;
  }
}

// ---------- Players ----------

export function usePlayers(params?: Parameters<typeof api.getPlayers>[0]) {
  return useQuery({
    queryKey: ["players", params],
    queryFn: async () => {
      // If searching, try DB first
      if (params?.search) {
        try {
          const db = await fetchDB<PaginatedResponse<Player>>(
            `/api/db/players/search?q=${encodeURIComponent(params.search)}&limit=${params.per_page || 10}`
          );
          if (db.data && db.data.length > 0) return db;
        } catch {}
      }
      return api.getPlayers(params);
    },
  });
}

export function usePlayersInfinite(params?: Omit<Parameters<typeof api.getPlayers>[0], "page">) {
  return useInfiniteQuery({
    queryKey: ["players", "infinite", params],
    queryFn: ({ pageParam }) => api.getPlayers({ ...params, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.meta.next_page,
  });
}

export function usePlayer(id: number | string, initialData?: any) {
  // Handle both number and string IDs (for "bdl-123" format from search)
  const numId = typeof id === "string" ? parseInt(id.replace(/^bdl-/, ""), 10) : id;
  const isBdlId = typeof id === "string" && id.startsWith("bdl-");

  return useQuery({
    queryKey: ["player", id],
    queryFn: async () => {
      // If it's a BDL player from search, go directly to BDL
      if (isBdlId) {
        return await api.getPlayer(numId);
      }

      // Try DB first — works for database IDs
      try {
        const db = await fetchDB<{ data: any }>(`/api/db/players/${numId}`);
        if (db.data && db.data.first_name) {
          return db;
        }
      } catch {}

      // Fall back to BDL with the same ID
      try {
        const bdl = await api.getPlayer(numId);
        if (bdl && bdl.data) {
          // Defensive: if BDL returns a player, try find a matching DB player by name
          // to avoid accidental numeric ID collisions across sources.
          try {
            const maybeDbId = await findDBPlayerByName(bdl.data.first_name, bdl.data.last_name);
            if (maybeDbId) {
              const db = await fetchDB<{ data: any }>(`/api/db/players/${maybeDbId}`);
              if (db.data && db.data.first_name) return db;
            }
          } catch {}
          return bdl;
        }
      } catch {}

      // If numeric ID fails entirely, throw error
      throw new Error(`Player with ID ${id} not found in either source`);
    },
    enabled: !!id,
    // If initialData provided (server-side fetch), seed the query cache for immediate render
    initialData: initialData ? { data: initialData } : undefined,
  });
}

// ---------- Teams ----------

export function useTeams() {
  return useQuery({
    queryKey: ["teams"],
    queryFn: async () => {
      try {
        const db = await fetchDB<{ data: Team[] }>("/api/db/teams");
        if (db.data && db.data.length > 0) return db;
      } catch {}
      return api.getTeams();
    },
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  });
}

export function useTeam(id: number) {
  return useQuery({
    queryKey: ["team", id],
    queryFn: async () => {
      try {
        const db = await fetchDB<{ data: Team }>(`/api/db/teams/${id}`);
        if (db.data) return db;
      } catch {}
      return api.getTeam(id);
    },
    enabled: !!id,
  });
}

// ---------- Games ----------

export function useGames(params?: Parameters<typeof api.getGames>[0]) {
  return useQuery({
    queryKey: ["games", params],
    queryFn: async () => {
      // Only use DB for date-specific queries (today, specific date).
      // For team+season queries (used for W-L record), the DB only has a few days
      // of data, so always go to BDL for completeness.
      const isDateQuery = params?.dates?.length || params?.start_date || params?.end_date;
      const isTeamSeasonQuery = params?.team_ids?.length && !isDateQuery;

      if (!isTeamSeasonQuery) {
        try {
          const searchParams = new URLSearchParams();
          if (params?.seasons?.[0]) searchParams.set("season", params.seasons[0].toString());
          if (params?.dates?.[0]) searchParams.set("date", params.dates[0]);
          if (params?.start_date) searchParams.set("start_date", params.start_date);
          if (params?.end_date) searchParams.set("end_date", params.end_date);
          const qs = searchParams.toString();
          const db = await fetchDB<PaginatedResponse<Game>>(
            `/api/db/games${qs ? `?${qs}` : ""}`
          );
          if (db.data && db.data.length > 0) return db;
        } catch {}
      }
      return api.getGames(params);
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnMount: false,
  });
}

export function useTodayGames() {
  const today = new Date().toISOString().split("T")[0];
  return useQuery({
    queryKey: ["games", "today", today],
    queryFn: async () => {
      try {
        const db = await fetchDB<PaginatedResponse<Game>>("/api/db/games/today");
        if (db.data && db.data.length > 0) return db;
      } catch {}
      return api.getGames({ dates: [today] });
    },
    refetchInterval: 30000,
  });
}

/**
 * Hook for live game scores.
 * Polls NBA.com scoreboard every 30s ONLY when games are in progress.
 * Stops polling when all games are final or none are scheduled.
 * Falls back to DB data on failure.
 */
export function useLiveScores() {
  const today = new Date().toISOString().split("T")[0];
  const fallback = useTodayGames();

  const liveQuery = useQuery({
    queryKey: ["live-scores", today],
    queryFn: async () => {
      const res = await fetch(`/api/live/scores?date=${today}`);
      if (!res.ok) throw new Error(`Live scores API ${res.status}`);
      return res.json() as Promise<{
        data: Game[];
        meta: { has_live_games: boolean; total_count: number };
      }>;
    },
    // Dynamic refetch: 30s when live games exist, stop when all done
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data?.data?.length) return 30_000; // Keep polling until we get data
      const hasLive = data.data.some(
        (g: Game) => g.status === "in_progress"
      );
      const hasScheduled = data.data.some(
        (g: Game) => g.status === "scheduled"
      );
      // Poll every 30s if games are live, every 5 min if games are scheduled but not started
      if (hasLive) return 30_000;
      if (hasScheduled) return 5 * 60_000;
      return false; // All games final — stop polling
    },
    refetchIntervalInBackground: false,
    staleTime: 10_000,
    gcTime: 60_000,
  });

  // Use live data if available, fall back to DB data
  const games = liveQuery.data?.data ?? fallback.data?.data ?? [];
  const isLoading = liveQuery.isLoading && fallback.isLoading;
  const hasLiveGames = games.some((g) => g.status === "in_progress");

  return {
    data: { data: games },
    isLoading,
    hasLiveGames,
    isLive: liveQuery.isSuccess, // true when using real-time data
  };
}

export function useGame(id: number) {
  return useQuery({
    queryKey: ["game", id],
    queryFn: () => api.getGame(id),
    enabled: !!id,
  });
}

// ---------- Stats ----------

export function useStats(params?: Parameters<typeof api.getStats>[0]) {
  return useQuery({
    queryKey: ["stats", params],
    queryFn: () => api.getStats(params),
  });
}

export function usePlayerGameStats(playerId: number, season?: number) {
  const currentSeason = season || getNBASeason();
  return useQuery({
    queryKey: ["stats", "player", playerId, currentSeason],
    queryFn: () =>
      api.getStats({
        player_ids: [playerId],
        seasons: [currentSeason],
        per_page: 100,
      }),
    enabled: !!playerId,
  });
}

// ---------- Season Averages ----------

export function useSeasonAverages(playerId: number, season?: number) {
  const currentSeason = season || getNBASeason();
  return useQuery({
    queryKey: ["season_averages", playerId, currentSeason],
    queryFn: () =>
      api.getSeasonAverages({
        season: currentSeason,
        player_ids: [playerId],
      }),
    enabled: !!playerId,
  });
}

// ---------- Career Stats ----------

export function usePlayerCareerStats(playerId: number | string, draftYear: number | null) {
  // Extract numeric ID from potential "bdl-123" format
  const numId = typeof playerId === "string" ? parseInt(playerId.replace(/^bdl-/, ""), 10) : playerId;
  
  return useQuery({
    queryKey: ["career_stats", playerId, draftYear],
    queryFn: async () => {
      // Try DB by ID
      try {
        const db = await fetchDB<{ data: PlayerStats[] }>(
          `/api/db/players/${numId}/career`
        );
        if (db.data && db.data.length > 0) return db.data;
      } catch {}
      // BDL career stats (fetches multiple seasons)
      return api.getPlayerCareerStats(numId, draftYear);
    },
    enabled: numId > 0,
    staleTime: 30 * 60 * 1000,
  });
}

// ---------- Team Season Averages ----------

export function useTeamSeasonAverages(playerIds: number[], season?: number) {
  const currentSeason = season || getNBASeason();
  return useQuery({
    queryKey: ["season_averages", "team", playerIds, currentSeason],
    queryFn: async () => {
      const res = await api.getSeasonAverages({
        season: currentSeason,
        player_ids: playerIds,
      });
      const map = new Map<number, PlayerStats>();
      for (const stat of res.data) {
        map.set(stat.player_id, stat);
      }
      return map;
    },
    enabled: playerIds.length > 0,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
}

// ---------- Player Recent Games ----------

export function usePlayerRecentGames(playerId: number, season?: number) {
  const currentSeason = season || getNBASeason();
  return useQuery({
    queryKey: ["stats", "recent", playerId, currentSeason],
    queryFn: () =>
      api.getStats({
        player_ids: [playerId],
        seasons: [currentSeason],
        per_page: 10,
      }),
    enabled: playerId > 0,
    staleTime: 5 * 60 * 1000,
  });
}

// ---------- Fallback hooks (DB → BDL → NBA.com) ----------

/**
 * Season averages with full fallback chain: DB → BDL → NBA.com
 */
export function useSeasonAveragesWithFallback(
  playerId: number | string,
  firstName: string,
  lastName: string,
  season?: number
) {
  const currentSeason = season || getNBASeason();
  const seasonString = getNBASeasonString(currentSeason);
  // Extract numeric ID from potential "bdl-123" format
  const numId = typeof playerId === "string" ? parseInt(playerId.replace(/^bdl-/, ""), 10) : playerId;

  return useQuery({
    queryKey: ["season_averages_fallback", playerId, firstName, lastName, currentSeason],
    queryFn: async () => {
      // 1. Try DB by ID
      try {
        const db = await fetchDB<{ data: { season_averages?: PlayerStats } }>(
          `/api/db/players/${numId}`
        );
        if (db.data?.season_averages) {
          return { source: "db", data: db.data.season_averages };
        }
      } catch {}

      // 1b. Try DB by name (handles BDL→NBA.com ID mismatch)
      if (firstName && lastName) {
        try {
          const dbId = await findDBPlayerByName(firstName, lastName);
          if (dbId) {
            const db = await fetchDB<{ data: { season_averages?: PlayerStats } }>(
              `/api/db/players/${dbId}`
            );
            if (db.data?.season_averages) {
              return { source: "db", data: db.data.season_averages };
            }
          }
        } catch {}
      }

      // 2. Try Ball Don't Lie
      try {
        const bdlResult = await api.getSeasonAverages({
          season: currentSeason,
          player_ids: [numId],
        });

        if (bdlResult.data && bdlResult.data.length > 0) {
          return { source: "bdl", data: bdlResult.data[0] };
        }
      } catch (error) {
        console.warn("Ball Don't Lie season averages failed:", error);
      }

      // 3. Fallback to NBA.com
      const { getPlayerSeasonAverages } = await import("@/lib/api/nba-stats");
      const nbaData = await getPlayerSeasonAverages(firstName, lastName, seasonString);

      if (nbaData) {
        const bdlFormat: PlayerStats = {
          id: nbaData.playerId,
          player_id: numId,
          season: currentSeason,
          games_played: nbaData.gp,
          min: nbaData.min.toString(),
          pts: nbaData.pts,
          reb: nbaData.reb,
          ast: nbaData.ast,
          stl: nbaData.stl,
          blk: nbaData.blk,
          turnover: nbaData.tov,
          fg_pct: nbaData.fg_pct,
          fg3_pct: nbaData.fg3_pct,
          ft_pct: nbaData.ft_pct,
          fgm: nbaData.fgm,
          fga: nbaData.fga,
          fg3m: nbaData.fg3m,
          fg3a: nbaData.fg3a,
          ftm: nbaData.ftm,
          fta: nbaData.fta,
          oreb: nbaData.oreb,
          dreb: nbaData.dreb,
          pf: nbaData.pf,
        };
        return { source: "nba", data: bdlFormat };
      }

      return null;
    },
    enabled: !!playerId && !!firstName && !!lastName,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
}

/**
 * Game log with full fallback chain: DB → BDL → NBA.com
 */
export function usePlayerGameStatsWithFallback(
  playerId: number | string,
  firstName: string,
  lastName: string,
  season?: number
) {
  const currentSeason = season || getNBASeason();
  const seasonString = getNBASeasonString(currentSeason);
  // Extract numeric ID from potential "bdl-123" format
  const numId = typeof playerId === "string" ? parseInt(playerId.replace(/^bdl-/, ""), 10) : playerId;

  return useQuery({
    queryKey: ["game_stats_fallback", playerId, firstName, lastName, currentSeason],
    queryFn: async () => {
      // 1. Try DB by ID
      try {
        const db = await fetchDB<{ data: any[] }>(
          `/api/db/players/${numId}/games?season=${currentSeason}`
        );
        if (db.data && db.data.length > 0) {
          return { source: "db", data: db.data };
        }
      } catch {}

      // 1b. Try DB by name (handles BDL→NBA.com ID mismatch)
      if (firstName && lastName) {
        try {
          const dbId = await findDBPlayerByName(firstName, lastName);
          if (dbId) {
            const db = await fetchDB<{ data: any[] }>(
              `/api/db/players/${dbId}/games?season=${currentSeason}`
            );
            if (db.data && db.data.length > 0) {
              return { source: "db", data: db.data };
            }
          }
        } catch {}
      }

      // 2. Try Ball Don't Lie
      try {
        const bdlResult = await api.getStats({
          player_ids: [numId],
          seasons: [currentSeason],
          per_page: 100,
        });

        if (bdlResult.data && bdlResult.data.length > 0) {
          return { source: "bdl", data: bdlResult.data };
        }
      } catch (error) {
        console.warn("Ball Don't Lie game stats failed:", error);
      }

      // 3. Fallback to NBA.com
      const { findNBAPlayerId, getPlayerGameLog } = await import("@/lib/api/nba-stats");
      const nbaPlayerId = await findNBAPlayerId(firstName, lastName, seasonString);

      if (nbaPlayerId) {
        const nbaGameLog = await getPlayerGameLog(nbaPlayerId, seasonString);

        if (nbaGameLog.length > 0) {
          const bdlFormat: any[] = nbaGameLog.map((game, index) => ({
            id: index,
            player_id: numId,
            game: {
              id: parseInt(game.gameId) || index,
              date: game.gameDate,
              season: currentSeason,
              home_team_id: 0,
              home_team_score: 0,
              visitor_team_id: 0,
              visitor_team_score: 0,
            },
            min: game.min.toString(),
            pts: game.pts,
            reb: game.reb,
            ast: game.ast,
            stl: game.stl,
            blk: game.blk,
            turnover: game.tov,
            fg_pct: game.fg_pct,
            fg3_pct: game.fg3_pct,
            ft_pct: game.ft_pct,
            fgm: game.fgm,
            fga: game.fga,
            fg3m: game.fg3m,
            fg3a: game.fg3a,
            ftm: game.ftm,
            fta: game.fta,
            oreb: game.oreb,
            dreb: game.dreb,
            pf: game.pf,
          }));
          return { source: "nba", data: bdlFormat };
        }
      }

      return null;
    },
    enabled: !!playerId && !!firstName && !!lastName,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

// ---------- Odds API (no DB caching — live data) ----------

export function useNBAOdds() {
  return useQuery({
    queryKey: ["odds", "nba"],
    queryFn: async () => {
      const events = await fetchNBAOdds();
      return events.map(parseGameOdds);
    },
    staleTime: 10 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  });
}

export function useNBAScores() {
  return useQuery({
    queryKey: ["scores", "nba"],
    queryFn: fetchNBAScores,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
}

// ---------- Search ----------

export function usePlayerSearch(query: string) {
  return useQuery({
    queryKey: ["players", "search", query],
    queryFn: async () => {
      try {
        const db = await fetchDB<PaginatedResponse<Player>>(
          `/api/db/players/search?q=${encodeURIComponent(query)}&limit=50`
        );
        if (db.data && db.data.length > 0) {
          // Deduplicate by full name, keeping best entry
          const deduped = new Map<string, Player>();
          
          for (const player of db.data) {
            const fullName = `${player.first_name} ${player.last_name}`.toLowerCase();
            const existing = deduped.get(fullName);
            
            // Always prefer the player with the higher ID
            // Higher IDs (>100000) are NBA.com API IDs from the sync which have stats data
            // Lower IDs (<100) are old internal DB IDs without stats
            if (!existing || player.id > existing.id) {
              deduped.set(fullName, player);
            }
          }
          
          db.data = Array.from(deduped.values()).slice(0, 10);
          db.meta.total_count = db.data.length;
          return db;
        }
      } catch {}
      return api.getPlayers({ search: query, per_page: 10 });
    },
    enabled: query.length >= 2,
  });
}
// Pre-load all players for instant filtering (like top search bar)
export function useAllPlayers() {
  return useQuery({
    queryKey: ["players", "all"],
    queryFn: async () => {
      try {
        // Try to get all players from DB first
        const db = await fetchDB<PaginatedResponse<Player>>(
          `/api/db/players/search?q=&limit=1000`
        );
        if (db.data && db.data.length > 0) return db;
      } catch {}
      // Fallback to BDL API
      return api.getPlayers({ per_page: 100 });
    },
    staleTime: 60 * 60 * 1000, // Cache for 1 hour
    gcTime: 2 * 60 * 60 * 1000, // Keep in memory for 2 hours
  });
}

// Filter pre-loaded players instantly (starts with 1 character)
export function useInstantPlayerSearch(query: string) {
  const { data: allPlayersData } = useAllPlayers();
  
  return useMemo(() => {
    if (query.length < 1 || !allPlayersData?.data) {
      return { data: { data: [] } };
    }
    
    const lowerQuery = query.toLowerCase();
    const filtered = allPlayersData.data.filter((player) =>
      `${player.first_name} ${player.last_name}`.toLowerCase().includes(lowerQuery) ||
      player.first_name.toLowerCase().includes(lowerQuery) ||
      player.last_name.toLowerCase().includes(lowerQuery)
    );
    
    // Deduplicate by full name, keeping the best entry for each player
    const deduped = new Map<string, Player>();
    
    for (const player of filtered) {
      const fullName = `${player.first_name} ${player.last_name}`.toLowerCase();
      const existing = deduped.get(fullName);
      
      // Always prefer the player with the higher ID
      // Higher IDs (>100000) are NBA.com API IDs from the sync which have stats data
      // Lower IDs (<100) are old internal DB IDs without stats
      if (!existing || player.id > existing.id) {
        deduped.set(fullName, player);
      }
    }
    
    const uniqueFiltered = Array.from(deduped.values());
    
    return {
      data: {
        data: uniqueFiltered.slice(0, 10),
        meta: {
          total_count: uniqueFiltered.length,
          current_page: 1,
          total_pages: 1,
          per_page: 10,
          next_page: null,
        },
      },
    };
  }, [query, allPlayersData]);
}