"use client";

import { useState, useMemo, useCallback, memo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Calendar, TrendingUp } from "lucide-react";
import { format, addDays, subDays } from "date-fns";
import { Header } from "@/components/layout/header";
import { Button, Card, CardContent, Badge, Skeleton, TeamLogo } from "@/components/ui";
import { useGames, useNBAOdds, useLiveScores } from "@/hooks/useNBAData";
import { cn } from "@/lib/utils/cn";
import { getTeamPairColors } from "@/lib/team-colors";
import type { Game } from "@/types";
import type { GameOdds } from "@/lib/predictions";

export default function GamesPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const dateString = format(selectedDate, "yyyy-MM-dd");
  const todayString = format(new Date(), "yyyy-MM-dd");
  const isToday = dateString === todayString;

  // Use live scores for today, DB/BDL for other dates
  const liveScores = useLiveScores();
  const historicalGames = useGames({
    dates: [dateString],
  });

  const { data: oddsData } = useNBAOdds();

  // When viewing today, prefer live data
  const games = isToday
    ? (liveScores.data?.data || [])
    : (historicalGames.data?.data || []);
  const isLoading = isToday ? liveScores.isLoading : historicalGames.isLoading;
  const allOdds = oddsData || [];
  const hasLiveGames = isToday && liveScores.hasLiveGames;

  // Build a lookup from team names → odds for quick matching
  const oddsMap = useMemo(() => {
    const map = new Map<string, GameOdds>();
    for (const odds of allOdds) {
      // Key by "away @ home" for matching
      map.set(`${odds.awayTeam}@${odds.homeTeam}`, odds);
    }
    return map;
  }, [allOdds]);

  const navigateDate = useCallback((direction: "prev" | "next") => {
    setSelectedDate((current) =>
      direction === "prev" ? subDays(current, 1) : addDays(current, 1)
    );
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">NBA Games</h1>
            {hasLiveGames && (
              <Badge variant="live" size="sm">
                <span className="relative flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                  </span>
                  LIVE
                </span>
              </Badge>
            )}
          </div>
          <p className="text-text-secondary">
            Live scores, box scores, and game schedules
          </p>
        </div>

        {/* Date Navigation */}
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" onClick={() => navigateDate("prev")}>
            <ChevronLeft className="w-5 h-5 mr-2" />
            Previous
          </Button>

          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-primary" />
            <span className="text-lg font-semibold">
              {format(selectedDate, "EEEE, MMMM d, yyyy")}
            </span>
          </div>

          <Button variant="ghost" onClick={() => navigateDate("next")}>
            Next
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </div>

        {/* Games List */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        ) : games.length === 0 ? (
          <div className="text-center py-16">
            <Calendar className="w-16 h-16 text-text-muted mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Games Scheduled</h2>
            <p className="text-text-secondary">
              There are no NBA games scheduled for this date.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {games.map((game, index) => (
              <GameCard
                key={game.id}
                game={game}
                index={index}
                odds={oddsMap.get(
                  `${game.visitor_team.full_name}@${game.home_team.full_name}`
                )}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

const GameCard = memo(function GameCard({
  game,
  index,
  odds,
}: {
  game: Game;
  index: number;
  odds?: GameOdds;
}) {
  const isLive = game.status === "in_progress";
  const isFinal = game.status === "final";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link href={`/games/${game.id}`}>
        <Card
          variant="interactive"
          className={cn(isLive && "border-primary/50 live-indicator")}
        >
          <CardContent className="py-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {isLive && (
                  <Badge variant="live" size="sm">
                    <span className="relative flex items-center gap-1.5">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                      </span>
                      LIVE
                    </span>
                  </Badge>
                )}
                {isLive && (
                  <span className="text-xs text-text-muted font-medium tabular-nums">
                    {game.period <= 4 ? `Q${game.period}` : game.period === 5 ? "OT" : `${game.period - 4}OT`}
                    {game.time ? ` ${game.time}` : ""}
                  </span>
                )}
                {isFinal && <Badge variant="default">Final</Badge>}
                {!isLive && !isFinal && (
                  <Badge variant="primary">
                    {new Date(game.date).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </Badge>
                )}
              </div>
              {game.postseason && (
                <Badge variant="warning" size="sm">
                  Playoffs
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4 items-center">
              {/* Away Team */}
              <TeamDisplay
                team={game.visitor_team}
                score={game.visitor_team_score}
                isWinner={isFinal && game.visitor_team_score > game.home_team_score}
              />

              {/* VS / Score */}
              <div className="text-center">
                {isFinal || isLive ? (
                  <div className="flex items-center justify-center gap-3">
                    <span
                      className={cn(
                        "text-3xl font-bold tabular-nums",
                        isFinal &&
                          game.visitor_team_score > game.home_team_score
                          ? "text-text-primary"
                          : "text-text-secondary"
                      )}
                    >
                      {game.visitor_team_score}
                    </span>
                    <span className="text-text-muted">-</span>
                    <span
                      className={cn(
                        "text-3xl font-bold tabular-nums",
                        isFinal &&
                          game.home_team_score > game.visitor_team_score
                          ? "text-text-primary"
                          : "text-text-secondary"
                      )}
                    >
                      {game.home_team_score}
                    </span>
                  </div>
                ) : (
                  <span className="text-xl text-text-muted">VS</span>
                )}
              </div>

              {/* Home Team */}
              <TeamDisplay
                team={game.home_team}
                score={game.home_team_score}
                isWinner={isFinal && game.home_team_score > game.visitor_team_score}
                isHome
              />
            </div>

            {/* Win Probability Bar */}
            {!isFinal && odds && (() => {
              const [awayColor, homeColor] = getTeamPairColors(
                game.visitor_team.full_name,
                game.home_team.full_name
              );
              return (
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-center justify-between text-xs text-text-muted mb-1.5">
                    <span>
                      {game.visitor_team.abbreviation} {odds.awayWinProb}%
                    </span>
                    <span className="flex items-center gap-1 text-text-muted">
                      <TrendingUp className="w-3 h-3" />
                      Win Probability
                    </span>
                    <span>
                      {game.home_team.abbreviation} {odds.homeWinProb}%
                    </span>
                  </div>
                  <div className="flex h-2 rounded-full overflow-hidden bg-surface-elevated">
                    <div
                      className="transition-all duration-500"
                      style={{
                        width: `${odds.awayWinProb}%`,
                        backgroundColor: awayColor,
                      }}
                    />
                    <div
                      className="transition-all duration-500"
                      style={{
                        width: `${odds.homeWinProb}%`,
                        backgroundColor: homeColor,
                      }}
                    />
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
});

const TeamDisplay = memo(function TeamDisplay({
  team,
  score,
  isWinner,
  isHome,
}: {
  team: Game["home_team"];
  score: number;
  isWinner: boolean;
  isHome?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-3", isHome && "justify-end")}>
      {isHome && (
        <div className="text-right">
          <p
            className={cn(
              "font-semibold",
              isWinner ? "text-text-primary" : "text-text-secondary"
            )}
          >
            {team.city}
          </p>
          <p
            className={cn(
              "text-lg font-bold",
              isWinner ? "text-text-primary" : "text-text-secondary"
            )}
          >
            {team.name}
          </p>
        </div>
      )}

      <TeamLogo
        teamId={team.id}
        teamName={`${team.city} ${team.name}`}
        abbreviation={team.abbreviation}
        size="lg"
      />

      {!isHome && (
        <div>
          <p
            className={cn(
              "font-semibold",
              isWinner ? "text-text-primary" : "text-text-secondary"
            )}
          >
            {team.city}
          </p>
          <p
            className={cn(
              "text-lg font-bold",
              isWinner ? "text-text-primary" : "text-text-secondary"
            )}
          >
            {team.name}
          </p>
        </div>
      )}
    </div>
  );
});
