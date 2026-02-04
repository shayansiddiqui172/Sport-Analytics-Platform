"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Card, CardContent, Badge, Skeleton, TeamLogo } from "@/components/ui";
import { useTeams, useGames } from "@/hooks/useNBAData";
import { cn } from "@/lib/utils/cn";
import { getTeamColor } from "@/lib/team-colors";
import { getNBASeasonString, getNBASeason } from "@/lib/utils/nba-season";
import { getFullTeamRosterStats } from "@/lib/api/nba-stats";
import { getNBATeamId } from "@/lib/team-logos";
import type { Team, Game } from "@/types";

export default function TeamsPage() {
  const queryClient = useQueryClient();
  const { data: teamsData, isLoading: teamsLoading } = useTeams();
  const currentSeason = useMemo(() => getNBASeason(), []);
  const gamesQueryParams = useMemo(
    () => ({
      seasons: [currentSeason],
      per_page: 100,
    }),
    [currentSeason]
  );
  const { data: gamesData, isLoading: gamesLoading } = useGames(gamesQueryParams);
  const seasonString = useMemo(
    () => getNBASeasonString(currentSeason),
    [currentSeason]
  );

  const teams = teamsData?.data || [];
  const games = gamesData?.data || [];

  // Compute W-L records from season games
  const records = useMemo(() => {
    const map = new Map<number, { wins: number; losses: number }>();
    for (const game of games) {
      if (game.status !== "final") continue;

      const homeWon = game.home_team_score > game.visitor_team_score;

      // Home team
      const hr = map.get(game.home_team.id) || { wins: 0, losses: 0 };
      if (homeWon) hr.wins++;
      else hr.losses++;
      map.set(game.home_team.id, hr);

      // Away team
      const ar = map.get(game.visitor_team.id) || { wins: 0, losses: 0 };
      if (!homeWon) ar.wins++;
      else ar.losses++;
      map.set(game.visitor_team.id, ar);
    }
    return map;
  }, [games]);

  const isLoading = teamsLoading || gamesLoading;

  // Group teams by conference
  const eastTeams = teams.filter((t) => t.conference === "East");
  const westTeams = teams.filter((t) => t.conference === "West");

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">NBA Teams</h1>
          <p className="text-text-secondary">
            Browse all 30 NBA teams by conference
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-8">
            <TeamsSkeleton />
            <TeamsSkeleton />
          </div>
        ) : (
          <div className="space-y-12">
            {/* Eastern Conference */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-2xl font-bold">Eastern Conference</h2>
                <Badge variant="primary">{eastTeams.length} Teams</Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {eastTeams.map((team, index) => (
                  <TeamCard
                    key={team.id}
                    team={team}
                    index={index}
                    record={records.get(team.id)}
                    seasonString={seasonString}
                    queryClient={queryClient}
                  />
                ))}
              </div>
            </section>

            {/* Western Conference */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-2xl font-bold">Western Conference</h2>
                <Badge variant="secondary">{westTeams.length} Teams</Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {westTeams.map((team, index) => (
                  <TeamCard
                    key={team.id}
                    team={team}
                    index={index}
                    record={records.get(team.id)}
                    seasonString={seasonString}
                    queryClient={queryClient}
                  />
                ))}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

function TeamCard({
  team,
  index,
  record,
  seasonString,
  queryClient,
}: {
  team: Team;
  index: number;
  record?: { wins: number; losses: number };
  seasonString: string;
  queryClient: ReturnType<typeof useQueryClient>;
}) {
  // PERF: Prefetch team roster on hover for instant navigation
  const handleMouseEnter = () => {
    const nbaTeamId = getNBATeamId(team.abbreviation);

    if (nbaTeamId) {
      queryClient.prefetchQuery({
        queryKey: ["nba-full-team-roster", team.abbreviation, nbaTeamId, seasonString],
        queryFn: () => getFullTeamRosterStats(team.abbreviation, nbaTeamId, seasonString),
        staleTime: 10 * 60 * 1000,
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02, duration: 0.2 }}
      onMouseEnter={handleMouseEnter}
    >
      <Link href={`/teams/${team.id}`}>
        <Card variant="interactive">
          <CardContent className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <TeamLogo
                teamId={team.id}
                teamName={team.full_name}
                abbreviation={team.abbreviation}
                size="lg"
              />

              <div>
                <h3 className="font-semibold text-text-primary">
                  {team.city} {team.name}
                </h3>
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                  <span>{team.division}</span>
                  {record && (
                    <>
                      <span className="text-text-muted">·</span>
                      <span className="font-medium tabular-nums">
                        {record.wins}-{record.losses}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <ChevronRight className="w-5 h-5 text-text-muted" />
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}

function TeamsSkeleton() {
  return (
    <div>
      <Skeleton className="h-8 w-48 mb-6" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
