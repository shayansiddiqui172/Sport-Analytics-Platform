"use client";

import { useQuery } from "@tanstack/react-query";
import {
  findNBAPlayerId,
  getPlayerSeasonAverages,
  getPlayerGameLog,
  getTeamRosterStats,
  getFullTeamRosterStats,
  type PlayerSeasonAverages,
  type GameLogEntry,
  type TeamRosterPlayer,
} from "@/lib/api/nba-stats";
import { getNBATeamId } from "@/lib/team-logos";

/**
 * Hook to get season averages from cached leagueleaders data.
 * Instant after first load — no per-player API call needed.
 */
export function useNBASeasonAverages(
  firstName: string,
  lastName: string,
  season?: string
) {
  return useQuery<PlayerSeasonAverages | null>({
    queryKey: ["nba-season-averages", firstName, lastName, season],
    queryFn: () => getPlayerSeasonAverages(firstName, lastName, season),
    enabled: !!(firstName && lastName),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to get player game log.
 * Two steps: resolve name → NBA ID (from cache), then fetch game log.
 * Game log endpoint may timeout — UI handles this gracefully.
 */
export function useNBAGameLog(
  firstName: string,
  lastName: string,
  season?: string
) {
  const { data: nbaPlayerId, isLoading: idLoading } = useQuery({
    queryKey: ["nba-player-id", firstName, lastName, season],
    queryFn: () => findNBAPlayerId(firstName, lastName, season),
    enabled: !!(firstName && lastName),
    staleTime: 24 * 60 * 60 * 1000,
  });

  const gameLogQuery = useQuery<GameLogEntry[]>({
    queryKey: ["nba-game-log", nbaPlayerId, season],
    queryFn: () => getPlayerGameLog(nbaPlayerId!, season),
    enabled: !!nbaPlayerId,
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });

  return {
    ...gameLogQuery,
    isLoading: idLoading || gameLogQuery.isLoading,
    nbaPlayerId,
  };
}

/**
 * Hook to get team roster stats from cached leagueleaders data.
 * Takes team abbreviation (e.g., "TOR", "LAL").
 */
export function useNBATeamRoster(teamAbbreviation: string, season?: string) {
  return useQuery<TeamRosterPlayer[]>({
    queryKey: ["nba-team-roster", teamAbbreviation, season],
    queryFn: () => getTeamRosterStats(teamAbbreviation, season),
    enabled: !!teamAbbreviation,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to get full team roster stats via leaguedashplayerstats (all players).
 * Falls back to leagueleaders (qualified players only) on failure.
 */
export function useFullTeamRoster(teamAbbreviation: string, season?: string) {
  const nbaTeamId = teamAbbreviation ? getNBATeamId(teamAbbreviation) : null;

  return useQuery<TeamRosterPlayer[]>({
    queryKey: ["nba-full-team-roster", teamAbbreviation, nbaTeamId, season],
    queryFn: () => getFullTeamRosterStats(teamAbbreviation, nbaTeamId!, season),
    enabled: !!teamAbbreviation && !!nbaTeamId,
    staleTime: 10 * 60 * 1000,
    // PERF: Keep roster in cache for 30 minutes to make team navigation instant
    gcTime: 30 * 60 * 1000,
    retry: 1,
  });
}

/**
 * Hook to get NBA.com player ID for headshot URLs.
 * Resolves player name to official NBA player ID from cached leagueleaders data.
 * Used by PlayerHeadshot component to display official player photos.
 */
export function useNBAPlayerId(
  firstName: string,
  lastName: string,
  season?: string
) {
  return useQuery<number | null>({
    queryKey: ["nba-player-id", firstName, lastName, season],
    queryFn: () => findNBAPlayerId(firstName, lastName, season),
    enabled: !!(firstName && lastName),
    // Cache player IDs for 24 hours — they don't change
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 7 * 24 * 60 * 60 * 1000, // Keep in cache for 1 week
  });
}
