"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, BarChart3, Calendar, User } from "lucide-react";
import { Header } from "@/components/layout/header";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Skeleton,
  TeamLogo,
  PlayerHeadshot,
} from "@/components/ui";
import {
  usePlayer,
  usePlayerCareerStats,
  useSeasonAveragesWithFallback,
  usePlayerGameStatsWithFallback,
} from "@/hooks/useNBAData";
import { useNBAPlayerId } from "@/hooks/useNBAStats";
import { getTeamColor } from "@/lib/team-colors";
import { getNBASeason, getNBASeasonString } from "@/lib/utils/nba-season";
import { computeCareerTotals } from "@/lib/utils/career-stats";
import type { GamePlayerStats } from "@/types";

interface PlayerPageClientProps {
  playerId: number | string;
  initialPlayer?: any;
}

export default function PlayerPageClient({ playerId, initialPlayer }: PlayerPageClientProps) {
  const currentSeason = useMemo(() => getNBASeason(), []);

  const {
    data: playerData,
    isLoading: playerLoading,
    error: playerError,
  } = usePlayer(playerId, (typeof playerId === "string" && typeof initialPlayer !== 'undefined') ? initialPlayer : undefined);
  const player = playerData?.data;

  const { data: avgDataWithFallback, isLoading: averagesLoading } =
    useSeasonAveragesWithFallback(
      playerId,
      player?.first_name || "",
      player?.last_name || "",
      currentSeason
    );
  const averages = avgDataWithFallback?.data || null;

  const {
    data: gameStatsDataWithFallback,
    isLoading: gameStatsLoading,
  } = usePlayerGameStatsWithFallback(
    playerId,
    player?.first_name || "",
    player?.last_name || "",
    currentSeason
  );

  const { data: careerData, isLoading: careerLoading } = usePlayerCareerStats(
    playerId,
    player?.draft_year || null
  );
  const careerStats = careerData || [];

  // Fetch NBA player ID for headshot
  const { data: nbaPlayerId } = useNBAPlayerId(
    player?.first_name || "",
    player?.last_name || "",
    currentSeason.toString()
  );

  const displayAverages = useMemo(() => {
    if (averages) return averages;
    if (careerStats.length > 0) {
      return careerStats[careerStats.length - 1];
    }
    return null;
  }, [averages, careerStats]);

  const careerTotals = useMemo(() => computeCareerTotals(careerStats), [careerStats]);

  const recentGames = useMemo(() => {
    const data = gameStatsDataWithFallback?.data;
    if (!data) return [];
    return [...data]
      .filter((g: GamePlayerStats) => g.min && parseFloat(g.min) > 0)
      .sort(
        (a: GamePlayerStats, b: GamePlayerStats) =>
          new Date(b.game.date).getTime() - new Date(a.game.date).getTime()
      )
      .slice(0, 20);
  }, [gameStatsDataWithFallback]);

  if (playerLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <PlayerSkeleton />
        </main>
      </div>
    );
  }

  if (playerError || !player) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-2">Player Not Found</h1>
            <p className="text-text-secondary mb-4">
              The player you&apos;re looking for doesn&apos;t exist.
            </p>
            <Link href="/teams">
              <Button>Back to Teams</Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const teamColor = player.team
    ? getTeamColor(player.team.abbreviation)
    : "#6366f1";

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {player.team && (
          <Link
            href={`/teams/${player.team.id}`}
            className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to {player.team.city} {player.team.name}
          </Link>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-6 sm:p-8 mb-8"
          style={{
            background: `linear-gradient(135deg, ${teamColor}15, transparent, ${teamColor}08)`,
          }}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <PlayerHeadshot
              nbaPlayerId={nbaPlayerId}
              firstName={player.first_name}
              lastName={player.last_name}
              teamAbbreviation={player.team?.abbreviation}
              size="2xl"
              priority
            />

            <div className="flex-1">
              <h1 className="text-3xl sm:text-4xl font-bold mb-2">
                {player.first_name} {player.last_name}
              </h1>

              <div className="flex flex-wrap items-center gap-3 text-text-secondary mb-4">
                {player.team && (
                  <Link
                    href={`/teams/${player.team.id}`}
                    className="flex items-center gap-2"
                  >
                    <TeamLogo
                      teamId={player.team.id}
                      teamName={player.team.full_name}
                      abbreviation={player.team.abbreviation}
                      size="xs"
                    />
                    <Badge variant="primary">{player.team.full_name}</Badge>
                  </Link>
                )}
                {player.position && (
                  <>
                    <span className="text-text-muted">·</span>
                    <span>{player.position}</span>
                  </>
                )}
                {player.jersey_number && (
                  <>
                    <span className="text-text-muted">·</span>
                    <span>#{player.jersey_number}</span>
                  </>
                )}
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-text-secondary">
                {player.height && <span>{player.height}</span>}
                {player.weight && (
                  <>
                    <span className="text-text-muted">·</span>
                    <span>{player.weight} lbs</span>
                  </>
                )}
                {player.college && (
                  <>
                    <span className="text-text-muted">·</span>
                    <span>{player.college}</span>
                  </>
                )}
                {player.country && player.country !== "USA" && (
                  <>
                    <span className="text-text-muted">·</span>
                    <span>{player.country}</span>
                  </>
                )}
                {player.draft_year && (
                  <>
                    <span className="text-text-muted">·</span>
                    <span>
                      {player.draft_year} Draft R{player.draft_round} Pick{" "}
                      {player.draft_number}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" style={{ color: teamColor }} />
                {displayAverages && displayAverages.season !== currentSeason
                  ? `${getNBASeasonString(displayAverages.season)} Season Averages (Most Recent)`
                  : `${getNBASeasonString(currentSeason)} Season Averages`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {averagesLoading && careerLoading ? (
                <Skeleton className="h-24" />
              ) : displayAverages ? (
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
                  <StatBox
                    label="PPG"
                    value={displayAverages.pts.toFixed(1)}
                    color={teamColor}
                    highlight
                  />
                  <StatBox label="RPG" value={displayAverages.reb.toFixed(1)} />
                  <StatBox label="APG" value={displayAverages.ast.toFixed(1)} />
                  <StatBox
                    label="FG%"
                    value={(displayAverages.fg_pct * 100).toFixed(1)}
                  />
                  <StatBox
                    label="3P%"
                    value={(displayAverages.fg3_pct * 100).toFixed(1)}
                  />
                  <StatBox
                    label="FT%"
                    value={(displayAverages.ft_pct * 100).toFixed(1)}
                  />
                </div>
              ) : (
                <p className="text-text-secondary text-center py-6">
                  No season averages available
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" style={{ color: teamColor }} />
                Regular Season Career
              </CardTitle>
            </CardHeader>
            <CardContent>
              {careerLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-10" />
                  ))}
                </div>
              ) : careerStats.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-text-muted border-b border-border">
                        <th className="pb-2 pr-4 sticky left-0 bg-surface z-10">
                          Season
                        </th>
                        <th className="pb-2 px-2 text-center">GP</th>
                        <th className="pb-2 px-2 text-center">MIN</th>
                        <th className="pb-2 px-2 text-center">PTS</th>
                        <th className="pb-2 px-2 text-center">REB</th>
                        <th className="pb-2 px-2 text-center">AST</th>
                        <th className="pb-2 px-2 text-center">STL</th>
                        <th className="pb-2 px-2 text-center">BLK</th>
                        <th className="pb-2 px-2 text-center">FGM</th>
                        <th className="pb-2 px-2 text-center">FGA</th>
                        <th className="pb-2 px-2 text-center">FG%</th>
                        <th className="pb-2 px-2 text-center">3PM</th>
                        <th className="pb-2 px-2 text-center">3PA</th>
                        <th className="pb-2 px-2 text-center">3P%</th>
                        <th className="pb-2 px-2 text-center">FTM</th>
                        <th className="pb-2 px-2 text-center">FTA</th>
                        <th className="pb-2 px-2 text-center">FT%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {careerStats.map((season) => (
                        <tr
                          key={season.id}
                          className="border-t border-border/50 hover:bg-surface-hover transition-colors"
                        >
                          <td className="py-2 pr-4 font-medium sticky left-0 bg-surface hover:bg-surface-hover z-10 tabular-nums">
                            {getNBASeasonString(season.season)}
                          </td>
                          <td className="py-2 px-2 text-center text-text-muted tabular-nums">
                            {season.games_played}
                          </td>
                          <td className="py-2 px-2 text-center text-text-muted tabular-nums">
                            {(parseFloat(season.min) || 0).toFixed(1)}
                          </td>
                          <td className="py-2 px-2 text-center font-semibold tabular-nums">
                            {season.pts.toFixed(1)}
                          </td>
                          <td className="py-2 px-2 text-center tabular-nums">
                            {season.reb.toFixed(1)}
                          </td>
                          <td className="py-2 px-2 text-center tabular-nums">
                            {season.ast.toFixed(1)}
                          </td>
                          <td className="py-2 px-2 text-center text-text-secondary tabular-nums">
                            {season.stl.toFixed(1)}
                          </td>
                          <td className="py-2 px-2 text-center text-text-secondary tabular-nums">
                            {season.blk.toFixed(1)}
                          </td>
                          <td className="py-2 px-2 text-center text-text-secondary tabular-nums">
                            {season.fgm.toFixed(1)}
                          </td>
                          <td className="py-2 px-2 text-center text-text-secondary tabular-nums">
                            {season.fga.toFixed(1)}
                          </td>
                          <td className="py-2 px-2 text-center text-text-secondary tabular-nums">
                            {(season.fg_pct * 100).toFixed(1)}
                          </td>
                          <td className="py-2 px-2 text-center text-text-secondary tabular-nums">
                            {season.fg3m.toFixed(1)}
                          </td>
                          <td className="py-2 px-2 text-center text-text-secondary tabular-nums">
                            {season.fg3a.toFixed(1)}
                          </td>
                          <td className="py-2 px-2 text-center text-text-secondary tabular-nums">
                            {(season.fg3_pct * 100).toFixed(1)}
                          </td>
                          <td className="py-2 px-2 text-center text-text-secondary tabular-nums">
                            {season.ftm.toFixed(1)}
                          </td>
                          <td className="py-2 px-2 text-center text-text-secondary tabular-nums">
                            {season.fta.toFixed(1)}
                          </td>
                          <td className="py-2 px-2 text-center text-text-secondary tabular-nums">
                            {(season.ft_pct * 100).toFixed(1)}
                          </td>
                        </tr>
                      ))}
                      <tr className="border-t-2 border-border bg-surface-elevated font-semibold">
                        <td className="py-3 pr-4 sticky left-0 bg-surface-elevated z-10">
                          Career
                        </td>
                        <td className="py-3 px-2 text-center tabular-nums">
                          {careerTotals.games_played}
                        </td>
                        <td className="py-3 px-2 text-center tabular-nums">
                          {careerTotals.min}
                        </td>
                        <td
                          className="py-3 px-2 text-center tabular-nums"
                          style={{ color: teamColor }}
                        >
                          {careerTotals.pts.toFixed(1)}
                        </td>
                        <td className="py-3 px-2 text-center tabular-nums">
                          {careerTotals.reb.toFixed(1)}
                        </td>
                        <td className="py-3 px-2 text-center tabular-nums">
                          {careerTotals.ast.toFixed(1)}
                        </td>
                        <td className="py-3 px-2 text-center text-text-secondary tabular-nums">
                          {careerTotals.stl.toFixed(1)}
                        </td>
                        <td className="py-3 px-2 text-center text-text-secondary tabular-nums">
                          {careerTotals.blk.toFixed(1)}
                        </td>
                        <td className="py-3 px-2 text-center text-text-secondary tabular-nums">
                          {careerTotals.fgm.toFixed(1)}
                        </td>
                        <td className="py-3 px-2 text-center text-text-secondary tabular-nums">
                          {careerTotals.fga.toFixed(1)}
                        </td>
                        <td className="py-3 px-2 text-center text-text-secondary tabular-nums">
                          {(careerTotals.fg_pct * 100).toFixed(1)}
                        </td>
                        <td className="py-3 px-2 text-center text-text-secondary tabular-nums">
                          {careerTotals.fg3m.toFixed(1)}
                        </td>
                        <td className="py-3 px-2 text-center text-text-secondary tabular-nums">
                          {careerTotals.fg3a.toFixed(1)}
                        </td>
                        <td className="py-3 px-2 text-center text-text-secondary tabular-nums">
                          {(careerTotals.fg3_pct * 100).toFixed(1)}
                        </td>
                        <td className="py-3 px-2 text-center text-text-secondary tabular-nums">
                          {careerTotals.ftm.toFixed(1)}
                        </td>
                        <td className="py-3 px-2 text-center text-text-secondary tabular-nums">
                          {careerTotals.fta.toFixed(1)}
                        </td>
                        <td className="py-3 px-2 text-center text-text-secondary tabular-nums">
                          {(careerTotals.ft_pct * 100).toFixed(1)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-text-secondary text-center py-8">
                  No career data available
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" style={{ color: teamColor }} />
                Detailed Averages
              </CardTitle>
            </CardHeader>
            <CardContent>
              {averagesLoading && careerLoading ? (
                <div className="space-y-3">
                  {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-8" />
                  ))}
                </div>
              ) : displayAverages ? (
                <div className="space-y-3">
                  <DetailRow
                    label="Minutes"
                    value={(parseFloat(displayAverages.min) || 0).toFixed(1)}
                  />
                  <DetailRow label="Steals" value={(displayAverages.stl || 0).toFixed(1)} />
                  <DetailRow label="Blocks" value={(displayAverages.blk || 0).toFixed(1)} />
                  <DetailRow
                    label="Turnovers"
                    value={(displayAverages.turnover || 0).toFixed(1)}
                  />
                  <DetailRow label="Off Reb" value={(displayAverages.oreb || 0).toFixed(1)} />
                  <DetailRow label="Def Reb" value={(displayAverages.dreb || 0).toFixed(1)} />
                  <DetailRow label="Personal Fouls" value={(displayAverages.pf || 0).toFixed(1)} />
                  <DetailRow
                    label="FGM / FGA"
                    value={`${(displayAverages.fgm || 0).toFixed(1)} / ${(displayAverages.fga || 0).toFixed(1)}`}
                  />
                  <DetailRow
                    label="3PM / 3PA"
                    value={`${(displayAverages.fg3m || 0).toFixed(1)} / ${(displayAverages.fg3a || 0).toFixed(1)}`}
                  />
                  <DetailRow
                    label="FTM / FTA"
                    value={`${(displayAverages.ftm || 0).toFixed(1)} / ${(displayAverages.fta || 0).toFixed(1)}`}
                  />
                </div>
              ) : (
                <p className="text-text-secondary text-center py-8">
                  No stats available
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-warning" />
                Recent Game Log
              </CardTitle>
            </CardHeader>
            <CardContent>
              {gameStatsLoading ? (
                <div className="space-y-3">
                  {[...Array(8)].map((_, i) => (
                    <Skeleton key={i} className="h-10" />
                  ))}
                </div>
              ) : recentGames.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-text-muted border-b border-border">
                        <th className="pb-2 pr-4">Date</th>
                        <th className="pb-2 px-2 text-center">MIN</th>
                        <th className="pb-2 px-2 text-center">PTS</th>
                        <th className="pb-2 px-2 text-center">REB</th>
                        <th className="pb-2 px-2 text-center">AST</th>
                        <th className="pb-2 px-2 text-center">STL</th>
                        <th className="pb-2 px-2 text-center">BLK</th>
                        <th className="pb-2 px-2 text-center">FG</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentGames.map((game: GamePlayerStats) => (
                        <tr
                          key={game.id}
                          className="border-t border-border/50 hover:bg-surface-hover transition-colors"
                        >
                          <td className="py-2 pr-4 text-xs text-text-muted tabular-nums">
                            {new Date(game.game.date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </td>
                          <td className="py-2 px-2 text-center text-text-muted tabular-nums">
                            {Math.round(parseFloat(game.min) || 0)}
                          </td>
                          <td className="py-2 px-2 text-center font-semibold tabular-nums">
                            {game.pts}
                          </td>
                          <td className="py-2 px-2 text-center tabular-nums">
                            {game.reb}
                          </td>
                          <td className="py-2 px-2 text-center tabular-nums">
                            {game.ast}
                          </td>
                          <td className="py-2 px-2 text-center text-text-secondary tabular-nums">
                            {game.stl}
                          </td>
                          <td className="py-2 px-2 text-center text-text-secondary tabular-nums">
                            {game.blk}
                          </td>
                          <td className="py-2 px-2 text-center text-text-secondary tabular-nums">
                            {game.fgm}/{game.fga}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-text-secondary text-center py-8">
                  No recent game data
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

function StatBox({
  label,
  value,
  color,
  highlight,
}: {
  label: string;
  value: string | number;
  color?: string;
  highlight?: boolean;
}) {
  return (
    <div className="text-center p-3 rounded-xl bg-surface-elevated">
      <p className="text-xs text-text-muted mb-1">{label}</p>
      <p
        className={highlight ? "text-2xl font-bold" : "text-xl font-semibold"}
        style={highlight && color ? { color } : undefined}
      >
        {value}
      </p>
    </div>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/50">
      <span className="text-sm text-text-secondary">{label}</span>
      <span className="text-sm font-medium tabular-nums">{value}</span>
    </div>
  );
}

function PlayerSkeleton() {
  return (
    <>
      <Skeleton className="h-8 w-48 mb-6" />
      <Skeleton className="h-48 w-full rounded-2xl mb-8" />
      <Skeleton className="h-32 w-full rounded-xl mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="h-96 rounded-xl" />
        <Skeleton className="h-96 lg:col-span-2 rounded-xl" />
      </div>
    </>
  );
}
