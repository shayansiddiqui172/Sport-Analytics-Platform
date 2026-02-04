"use client";

import { useMemo, memo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Clock } from "lucide-react";
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
} from "@/components/ui";
import { useGame, useStats, useNBAOdds } from "@/hooks/useNBAData";
import { cn } from "@/lib/utils/cn";
import { getTeamPairColors } from "@/lib/team-colors";

interface GamePageClientProps {
  gameId: number;
}

export default function GamePageClient({ gameId }: GamePageClientProps) {
  const statsQueryParams = useMemo(
    () => ({
      game_ids: [gameId],
      per_page: 50,
    }),
    [gameId]
  );

  const { data: gameData, isLoading: gameLoading } = useGame(gameId);
  const { data: statsData, isLoading: statsLoading } = useStats(statsQueryParams);
  const { data: oddsData } = useNBAOdds();

  const game = gameData?.data;
  const stats = statsData?.data || [];

  const gameOdds = useMemo(() => {
    if (!game || !oddsData) return null;

    const homeTeamName = `${game.home_team.city} ${game.home_team.name}`;
    const visitorTeamName = `${game.visitor_team.city} ${game.visitor_team.name}`;

    return oddsData.find(
      (o) =>
        (o.homeTeam === homeTeamName && o.awayTeam === visitorTeamName) ||
        (o.homeTeam === visitorTeamName && o.awayTeam === homeTeamName)
    );
  }, [game, oddsData]);

  if (gameLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <GameSkeleton />
        </main>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-2">Game Not Found</h1>
            <p className="text-text-secondary mb-4">
              The game you&apos;re looking for doesn&apos;t exist.
            </p>
            <Link href="/games">
              <Button>Back to Games</Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const isLive = game.status === "in_progress";
  const isFinal = game.status === "final";
  const homeWon = game.home_team_score > game.visitor_team_score;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/games"
          className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Games
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "bg-gradient-to-br from-primary/10 via-surface to-accent-purple/10 rounded-2xl p-6 sm:p-8 mb-8",
            isLive && "border border-primary/50 live-indicator"
          )}
        >
          <div className="flex items-center justify-center gap-4 mb-6">
            {isLive && (
              <Badge variant="live">LIVE - Q{game.period}</Badge>
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
            {game.postseason && <Badge variant="warning">Playoffs</Badge>}
          </div>

          <div className="grid grid-cols-3 gap-4 items-center">
            <div className="text-center">
              <Link href={`/teams/${game.visitor_team.id}`}>
                <TeamLogo
                  teamId={game.visitor_team.id}
                  teamName={game.visitor_team.full_name}
                  abbreviation={game.visitor_team.abbreviation}
                  size="xl"
                  priority
                  className="mx-auto mb-3"
                />
                <p className="font-semibold text-lg">{game.visitor_team.city}</p>
                <p className="text-text-secondary">{game.visitor_team.name}</p>
              </Link>
            </div>

            <div className="text-center">
              {isFinal || isLive ? (
                <div className="flex items-center justify-center gap-4">
                  <span
                    className={cn(
                      "text-5xl font-bold tabular-nums",
                      isFinal && !homeWon
                        ? "text-text-primary"
                        : "text-text-secondary"
                    )}
                  >
                    {game.visitor_team_score || 0}
                  </span>
                  <span className="text-2xl text-text-muted">-</span>
                  <span
                    className={cn(
                      "text-5xl font-bold tabular-nums",
                      isFinal && homeWon
                        ? "text-text-primary"
                        : "text-text-secondary"
                    )}
                  >
                    {game.home_team_score || 0}
                  </span>
                </div>
              ) : (
                <span className="text-3xl font-bold text-text-muted">VS</span>
              )}
              <p className="text-sm text-text-muted mt-2">
                {new Date(game.date).toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>

            <div className="text-center">
              <Link href={`/teams/${game.home_team.id}`}>
                <TeamLogo
                  teamId={game.home_team.id}
                  teamName={game.home_team.full_name}
                  abbreviation={game.home_team.abbreviation}
                  size="xl"
                  priority
                  className="mx-auto mb-3"
                />
                <p className="font-semibold text-lg">{game.home_team.city}</p>
                <p className="text-text-secondary">{game.home_team.name}</p>
              </Link>
            </div>
          </div>
        </motion.div>

        {!isFinal && !isLive && gameOdds && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-text-secondary">
                    Win Probability
                  </p>
                  {gameOdds.spread && (
                    <p className="text-xs text-text-muted">
                      Spread: {gameOdds.spread.homePoint > 0 ? "+" : ""}
                      {gameOdds.spread.homePoint}
                    </p>
                  )}
                </div>
                <PredictionBar
                  homeTeam={game.home_team}
                  awayTeam={game.visitor_team}
                  homeWinProb={gameOdds.homeWinProb}
                  awayWinProb={gameOdds.awayWinProb}
                />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {isFinal || isLive ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TeamLogo
                    teamId={game.visitor_team.id}
                    teamName={game.visitor_team.full_name}
                    abbreviation={game.visitor_team.abbreviation}
                    size="sm"
                  />
                  {game.visitor_team.city} {game.visitor_team.name}
                  {isFinal && !homeWon && (
                    <Badge variant="secondary" size="sm">
                      W
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <BoxScoreTable
                  stats={stats}
                  teamId={game.visitor_team.id}
                  isLoading={statsLoading}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TeamLogo
                    teamId={game.home_team.id}
                    teamName={game.home_team.full_name}
                    abbreviation={game.home_team.abbreviation}
                    size="sm"
                  />
                  {game.home_team.city} {game.home_team.name}
                  {isFinal && homeWon && (
                    <Badge variant="secondary" size="sm">
                      W
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <BoxScoreTable
                  stats={stats}
                  teamId={game.home_team.id}
                  isLoading={statsLoading}
                />
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Clock className="w-12 h-12 mx-auto mb-4 text-text-muted" />
              <h3 className="text-xl font-semibold mb-2">Game Scheduled</h3>
              <p className="text-text-secondary mb-1">
                {new Date(game.date).toLocaleString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
              <p className="text-sm text-text-muted">
                Box score will be available once the game starts
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

const BoxScoreTable = memo(function BoxScoreTable({
  stats,
  teamId,
  isLoading,
}: {
  stats: any[];
  teamId: number;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-10" />
        ))}
      </div>
    );
  }

  const teamStats = stats.filter((s) => s.team?.id === teamId);

  if (teamStats.length === 0) {
    return (
      <p className="text-text-secondary text-center py-8">
        Box score not available
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-text-muted uppercase">
            <th className="pb-3 pr-4">Player</th>
            <th className="pb-3 px-2 text-center">MIN</th>
            <th className="pb-3 px-2 text-center">PTS</th>
            <th className="pb-3 px-2 text-center">REB</th>
            <th className="pb-3 px-2 text-center">AST</th>
            <th className="pb-3 px-2 text-center">FG</th>
          </tr>
        </thead>
        <tbody>
          {teamStats
            .filter((s) => s.min && s.min !== "00" && s.min !== "0")
            .map((stat, index) => {
              // Stats are returned from Ball Don't Lie; prefix their numeric IDs
              const rawId = stat.player?.id;
              const playerHref = rawId ? `/players/bdl-${rawId}` : `/players/0`;
              return (
                <tr
                  key={index}
                  className="border-t border-border hover:bg-surface-hover transition-colors"
                >
                  <td className="py-2 pr-4">
                    <Link
                      href={playerHref}
                      className="hover:text-primary transition-colors"
                    >
                      {stat.player?.first_name} {stat.player?.last_name}
                    </Link>
                  </td>
                  <td className="py-2 px-2 text-center text-text-secondary">
                    {stat.min || 0}
                  </td>
                  <td className="py-2 px-2 text-center font-semibold">
                    {stat.pts || 0}
                  </td>
                  <td className="py-2 px-2 text-center">{stat.reb || 0}</td>
                  <td className="py-2 px-2 text-center">{stat.ast || 0}</td>
                  <td className="py-2 px-2 text-center text-text-secondary">
                    {stat.fgm || 0}/{stat.fga || 0}
                  </td>
                </tr>
              );
            })}
        </tbody>
      </table>
    </div>
  );
});

const PredictionBar = memo(function PredictionBar({
  homeTeam,
  awayTeam,
  homeWinProb,
  awayWinProb,
}: {
  homeTeam: any;
  awayTeam: any;
  homeWinProb: number;
  awayWinProb: number;
}) {
  const homeTeamName = `${homeTeam.city} ${homeTeam.name}`;
  const awayTeamName = `${awayTeam.city} ${awayTeam.name}`;
  const [awayColor, homeColor] = getTeamPairColors(awayTeamName, homeTeamName);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <TeamLogo
            teamId={awayTeam.id}
            teamName={`${awayTeam.city} ${awayTeam.name}`}
            abbreviation={awayTeam.abbreviation}
            size="xs"
          />
          <span className="font-medium">{awayTeam.abbreviation}</span>
          <span className="text-text-muted">{awayWinProb}%</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-text-muted">{homeWinProb}%</span>
          <span className="font-medium">{homeTeam.abbreviation}</span>
          <TeamLogo
            teamId={homeTeam.id}
            teamName={`${homeTeam.city} ${homeTeam.name}`}
            abbreviation={homeTeam.abbreviation}
            size="xs"
          />
        </div>
      </div>
      <div className="h-3 bg-surface-elevated rounded-full overflow-hidden flex">
        <div
          className="h-full transition-all duration-500"
          style={{
            width: `${awayWinProb}%`,
            backgroundColor: awayColor,
          }}
        />
        <div
          className="h-full transition-all duration-500"
          style={{
            width: `${homeWinProb}%`,
            backgroundColor: homeColor,
          }}
        />
      </div>
    </div>
  );
});

function GameSkeleton() {
  return (
    <>
      <Skeleton className="h-8 w-32 mb-6" />
      <Skeleton className="h-64 w-full rounded-2xl mb-8" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-96 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    </>
  );
}
