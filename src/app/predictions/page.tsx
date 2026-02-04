"use client";

import { useMemo, memo, lazy, Suspense } from "react";
import { motion } from "framer-motion";
import {
  Trophy,
  TrendingUp,
  Target,
  BarChart3,
  ArrowUpDown,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Skeleton,
  Button,
  AnimatedNumber,
  TeamLogo,
} from "@/components/ui";
import { useNBAOdds, useNBAScores } from "@/hooks/useNBAData";
import type { GameOdds } from "@/lib/predictions";
import { getTeamColor, getTeamAbbreviation, getTeamPairColors } from "@/lib/team-colors";
const SpreadChart = lazy(() => import("@/components/predictions/spread-chart"));

export default function PredictionsPage() {
  const { data: oddsData, isLoading: oddsLoading, error: oddsError, refetch } = useNBAOdds();
  const { data: scoresData } = useNBAScores();

  const odds = oddsData || [];
  const scores = scoresData || [];

  // Split into upcoming and completed
  const { upcoming } = useMemo(() => {
    const completedIds = new Set(
      scores.filter((s) => s.completed).map((s) => s.id)
    );

    const upcomingGames: GameOdds[] = [];
    const completedGames: GameOdds[] = [];

    for (const game of odds) {
      if (completedIds.has(game.eventId)) {
        completedGames.push(game);
      } else {
        upcomingGames.push(game);
      }
    }

    // Sort upcoming by commence time
    upcomingGames.sort(
      (a, b) =>
        new Date(a.commenceTime).getTime() - new Date(b.commenceTime).getTime()
    );

    return { upcoming: upcomingGames, completed: completedGames };
  }, [odds, scores]);

  // Biggest favorites (highest win prob differential)
  const biggestFavorites = useMemo(() => {
    return [...upcoming]
      .map((g) => ({
        ...g,
        diff: Math.abs(g.homeWinProb - g.awayWinProb),
        favorite: g.homeWinProb > g.awayWinProb ? g.homeTeam : g.awayTeam,
        underdog: g.homeWinProb > g.awayWinProb ? g.awayTeam : g.homeTeam,
        favProb: Math.max(g.homeWinProb, g.awayWinProb),
      }))
      .sort((a, b) => b.diff - a.diff)
      .slice(0, 5);
  }, [upcoming]);

  // Chart data: upcoming games sorted by spread (closest games first)
  const spreadChartData = useMemo(() => {
    return upcoming
      .filter((g) => g.spread)
      .map((g) => ({
        label: `${getTeamAbbreviation(g.awayTeam)} @ ${getTeamAbbreviation(g.homeTeam)}`,
        spread: g.spread!.homePoint,
        homeTeam: g.homeTeam,
        awayTeam: g.awayTeam,
      }))
      .sort((a, b) => Math.abs(a.spread) - Math.abs(b.spread))
      .slice(0, 10);
  }, [upcoming]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Predictions & Odds</h1>
          <p className="text-text-secondary">
            Real-time betting odds and win probabilities powered by sportsbook data
          </p>
        </div>

        {/* Error State */}
        {oddsError && (
          <div className="bg-danger/10 border border-danger/30 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-danger font-semibold mb-2">Error Loading Odds</h3>
                <p className="text-text-secondary text-sm mb-4">
                  Failed to load odds data. This might be due to API rate limiting.
                </p>
                <Button variant="ghost" size="sm" onClick={() => refetch()} className="gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Retry
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upcoming Games with Odds */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Upcoming Games
              </CardTitle>
            </CardHeader>
            <CardContent>
              {oddsLoading ? (
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-36 rounded-xl" />
                  ))}
                </div>
              ) : upcoming.length === 0 ? (
                <div className="text-center py-8">
                  <Target className="w-12 h-12 text-text-muted mx-auto mb-3" />
                  <p className="text-text-secondary">
                    No upcoming games with odds available
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcoming.map((game, index) => (
                    <OddsCard key={game.eventId} game={game} index={index} />
                  ))}
                </div>
              )}

              <div className="mt-6 p-4 bg-surface rounded-lg border border-border">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  About These Odds
                </h4>
                <p className="text-sm text-text-secondary">
                  Win probabilities are derived from real moneyline odds sourced
                  from US sportsbooks. Spreads, totals, and moneylines are live
                  and update as lines move.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Biggest Favorites */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-warning" />
                Biggest Favorites
              </CardTitle>
            </CardHeader>
            <CardContent>
              {oddsLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 rounded-xl" />
                  ))}
                </div>
              ) : biggestFavorites.length === 0 ? (
                <div className="text-center py-8">
                  <Trophy className="w-10 h-10 text-text-muted mx-auto mb-3" />
                  <p className="text-sm text-text-secondary">
                    No upcoming games
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {biggestFavorites.map((game, index) => (
                    <motion.div
                      key={game.eventId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-3 bg-surface-elevated rounded-xl"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                          <TeamLogo
                            teamName={game.favorite}
                            abbreviation={getTeamAbbreviation(game.favorite)}
                            size="sm"
                          />
                          <div className="min-w-0">
                            <p className="font-semibold text-sm truncate">
                              {game.favorite}
                            </p>
                            <p className="text-xs text-text-muted truncate">
                              vs {game.underdog}
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-3 percentage-container">
                          <AnimatedNumber
                            value={game.favProb}
                            decimals={0}
                            className="text-lg font-bold"
                            style={{ color: getTeamColor(game.favorite) }}
                          />
                          <span className="text-lg font-bold" style={{ color: getTeamColor(game.favorite) }}>%</span>
                        </div>
                      </div>
                      <div className="flex h-1.5 rounded-full overflow-hidden bg-surface">
                        <div
                          className="transition-all duration-500"
                          style={{
                            width: `${game.favProb}%`,
                            backgroundColor: getTeamColor(game.favorite),
                          }}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Spreads Chart */}
        {spreadChartData.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowUpDown className="w-5 h-5 text-primary" />
                Point Spreads — Closest Matchups
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<Skeleton className="h-72 rounded-xl" />}>
                <SpreadChart data={spreadChartData} />
              </Suspense>
            </CardContent>
          </Card>
        )}

        {/* All Upcoming — Summary Table */}
        {upcoming.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                All Upcoming
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-text-muted text-left">
                      <th className="pb-3 font-medium">Matchup</th>
                      <th className="pb-3 font-medium text-center">Time</th>
                      <th className="pb-3 font-medium text-right">
                        Win Probability
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {upcoming.map((game) => {
                      const [ac, hc] = getTeamPairColors(game.awayTeam, game.homeTeam);
                      return (
                        <tr
                          key={game.eventId}
                          className="border-b border-border/50 hover:bg-surface-elevated/50 transition-colors"
                        >
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex flex-col items-center gap-0.5">
                                <TeamLogo
                                  teamName={game.awayTeam}
                                  abbreviation={getTeamAbbreviation(game.awayTeam)}
                                  size="xs"
                                />
                                <TeamLogo
                                  teamName={game.homeTeam}
                                  abbreviation={getTeamAbbreviation(game.homeTeam)}
                                  size="xs"
                                />
                              </div>
                              <div>
                                <p className="font-medium text-xs">
                                  {getTeamAbbreviation(game.awayTeam)}
                                </p>
                                <p className="font-medium text-xs text-text-muted">
                                  @ {getTeamAbbreviation(game.homeTeam)}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 text-center text-xs text-text-muted tabular-nums">
                            {new Date(game.commenceTime).toLocaleTimeString(
                              "en-US",
                              { hour: "numeric", minute: "2-digit" }
                            )}
                          </td>
                          <td className="py-3 text-right">
                            <div className="flex items-center justify-end gap-2 tabular-nums text-xs">
                              <span style={{ color: ac }}>
                                {getTeamAbbreviation(game.awayTeam)} {game.awayWinProb}%
                              </span>
                              <span className="text-text-muted">/</span>
                              <span style={{ color: hc }}>
                                {getTeamAbbreviation(game.homeTeam)} {game.homeWinProb}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

const OddsCard = memo(function OddsCard({
  game,
  index,
}: {
  game: GameOdds;
  index: number;
}) {
  const homeFavored = game.homeWinProb > game.awayWinProb;
  const awayAbbrev = getTeamAbbreviation(game.awayTeam);
  const homeAbbrev = getTeamAbbreviation(game.homeTeam);
  const [awayColor, homeColor] = getTeamPairColors(game.awayTeam, game.homeTeam);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="p-4 bg-surface-elevated rounded-xl contain-layout"
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs text-text-muted tabular-nums">
          {new Date(game.commenceTime).toLocaleString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
        </span>
        <Badge variant="primary" size="sm">
          <Target className="w-3 h-3 mr-1" />
          Prediction
        </Badge>
      </div>

      {/* Teams */}
      <div className="grid grid-cols-3 gap-2 items-center mb-3">
        <div className="flex items-center gap-2">
          <TeamLogo
            teamName={game.awayTeam}
            abbreviation={awayAbbrev}
            size="sm"
          />
          <p className="font-semibold text-sm truncate">{awayAbbrev}</p>
        </div>
        <div className="text-center">
          <p className="text-text-muted text-sm">@</p>
        </div>
        <div className="flex items-center gap-2 justify-end">
          <p className="font-semibold text-sm truncate">{homeAbbrev}</p>
          <TeamLogo
            teamName={game.homeTeam}
            abbreviation={homeAbbrev}
            size="sm"
          />
        </div>
      </div>

      {/* Win probability bar */}
      <div>
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="percentage-container font-semibold" style={{ color: awayColor }}>
            {awayAbbrev} <AnimatedNumber value={game.awayWinProb} decimals={0} />%
          </span>
          <span className="percentage-container font-semibold" style={{ color: homeColor }}>
            {homeAbbrev} <AnimatedNumber value={game.homeWinProb} decimals={0} />%
          </span>
        </div>
        <div className="flex h-2.5 rounded-full overflow-hidden bg-surface">
          <motion.div
            className="smooth-data-transition"
            initial={{ width: 0 }}
            animate={{ width: `${game.awayWinProb}%` }}
            style={{
              backgroundColor: awayColor,
              opacity: !homeFavored ? 1 : 0.5,
            }}
          />
          <motion.div
            className="smooth-data-transition"
            initial={{ width: 0 }}
            animate={{ width: `${game.homeWinProb}%` }}
            style={{
              backgroundColor: homeColor,
              opacity: homeFavored ? 1 : 0.5,
            }}
          />
        </div>
      </div>

      {/* Moneyline details */}
      {game.moneyline && (
        <div className="mt-3 pt-3 border-t border-border/50 flex justify-between text-xs">
          <div>
            <span className="text-text-muted">Moneyline: </span>
            <span className="tabular-nums font-medium">
              {game.moneyline.away > 0 ? "+" : ""}
              {game.moneyline.away}
            </span>
          </div>
          <div>
            <span className="text-text-muted">Moneyline: </span>
            <span className="tabular-nums font-medium">
              {game.moneyline.home > 0 ? "+" : ""}
              {game.moneyline.home}
            </span>
          </div>
        </div>
      )}
    </motion.div>
  );
});
