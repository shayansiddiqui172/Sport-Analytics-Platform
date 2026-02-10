"use client";

import { useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Users, Calendar, Heart, ChevronDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
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
import { useTeams, useTeam, useGames, usePlayers, useTeamSeasonAverages } from "@/hooks/useNBAData";
import { useFullTeamRoster } from "@/hooks/useNBAStats";
import type { TeamRosterPlayer } from "@/lib/api/nba-stats";
import { getTeamColor } from "@/lib/team-colors";
import { getNBASeason, getNBASeasonString } from "@/lib/utils/nba-season";
import { getPlayerGameLog, type GameLogEntry } from "@/lib/api/nba-stats";

interface TeamPageClientProps {
  teamId: number;
}

export default function TeamPageClient({ teamId }: TeamPageClientProps) {
  const router = useRouter();
  const currentSeason = useMemo(() => getNBASeason(), []);
  const seasonString = useMemo(
    () => getNBASeasonString(currentSeason),
    [currentSeason]
  );
  const [expandedPlayers, setExpandedPlayers] = useState<Set<string | number>>(new Set());

  const gamesQueryParams = useMemo(
    () => ({
      team_ids: [teamId],
      per_page: 25,
      seasons: [currentSeason],
    }),
    [teamId, currentSeason]
  );

  // Fetch team with full roster from DB (primary source)
  const { data: teamData, isLoading: teamLoading } = useTeam(teamId);
  const team = teamData?.data;
  const dbRoster = (team as any)?.players || [];

  // NBA.com roster (fallback)
  const { data: nbaRoster, isLoading: nbaRosterLoading } = useFullTeamRoster(
    team?.abbreviation || "",
    seasonString
  );

  // BDL roster as final fallback
  const { data: bdlPlayersData, isLoading: bdlPlayersLoading } = usePlayers(
    team ? { team_ids: [teamId], per_page: 20 } : undefined
  );
  const bdlPlayers = bdlPlayersData?.data || [];
  const bdlPlayerIds = useMemo(() => bdlPlayers.map((p) => p.id), [bdlPlayers]);
  const { data: bdlStatsMap } = useTeamSeasonAverages(
    team && bdlPlayerIds.length > 0 ? bdlPlayerIds : [],
    currentSeason
  );

  // Merge strategy — DB first, then NBA.com, then BDL
  const roster: any[] = useMemo(() => {
    // 1. Try DB roster (synced by GitHub Actions)
    if (dbRoster.length > 0) {
      return dbRoster.map((p: any) => ({
        playerId: p.id,
        playerName: `${p.first_name} ${p.last_name}`,
        gp: p.stats?.games_played || 0,
        min: p.stats?.mpg || 0,
        pts: p.stats?.ppg || 0,
        reb: p.stats?.rpg || 0,
        ast: p.stats?.apg || 0,
        stl: p.stats?.spg || 0,
        blk: p.stats?.bpg || 0,
        tov: p.stats?.topg || 0,
        fg_pct: p.stats?.fg_pct || 0,
        fg3_pct: p.stats?.three_pct || 0,
        ft_pct: p.stats?.ft_pct || 0,
        source: "db",
      }));
    }

    // 2. Fall back to NBA.com
    if (nbaRoster && nbaRoster.length > 0) {
      return nbaRoster.map((p) => ({
        playerId: p.playerId,
        playerName: p.playerName,
        gp: p.gp || 0,
        min: p.min || 0,
        pts: p.pts || 0,
        reb: p.reb || 0,
        ast: p.ast || 0,
        stl: p.stl || 0,
        blk: p.blk || 0,
        tov: p.tov || 0,
        fg_pct: p.fg_pct || 0,
        fg3_pct: p.fg3_pct || 0,
        ft_pct: p.ft_pct || 0,
        source: "nba",
      }));
    }

    // 3. Final fallback to BDL
    if (bdlPlayers.length > 0) {
      return bdlPlayers.map((p) => {
        const stats = bdlStatsMap?.get(p.id);
        return {
          playerId: `bdl-${p.id}`,
          bdlId: p.id,
          playerName: `${p.first_name} ${p.last_name}`,
          gp: stats?.games_played || 0,
          min: stats ? parseFloat(stats.min) || 0 : 0,
          pts: stats?.pts || 0,
          reb: stats?.reb || 0,
          ast: stats?.ast || 0,
          stl: stats?.stl || 0,
          blk: stats?.blk || 0,
          tov: stats?.turnover || 0,
          fg_pct: stats?.fg_pct || 0,
          fg3_pct: stats?.fg3_pct || 0,
          ft_pct: stats?.ft_pct || 0,
          source: "bdl",
        };
      });
    }

    return [];
  }, [dbRoster, nbaRoster, bdlPlayers, bdlStatsMap]);

  const rosterLoading =
    teamLoading ||
    (dbRoster.length === 0 && nbaRosterLoading && bdlPlayersLoading) ||
    (dbRoster.length === 0 && nbaRosterLoading && bdlPlayers.length === 0);

  // Games from Ball Don't Lie
  const { data: gamesData, isLoading: gamesLoading } = useGames(gamesQueryParams);
  const games = gamesData?.data || [];

  // Compute team record from games
  const record = useMemo(() => {
    let wins = 0;
    let losses = 0;
    for (const game of games) {
      if (game.status !== "final") continue;
      const isHome = game.home_team.id === teamId;
      const teamScore = isHome
        ? game.home_team_score
        : game.visitor_team_score;
      const oppScore = isHome
        ? game.visitor_team_score
        : game.home_team_score;
      if (teamScore > oppScore) wins++;
      else losses++;
    }
    return { wins, losses };
  }, [games, teamId]);

  // Sort players by minutes DESC — top 5 = starters
  const sortedRoster = useMemo(() => {
    if (!roster) return [];
    return [...roster].sort((a, b) => b.min - a.min);
  }, [roster]);

  const recentGames = useMemo(() => {
    return games.filter((g) => g.status === "final").slice(0, 10);
  }, [games]);

  const toggleExpand = (playerId: string | number) => {
    setExpandedPlayers((prev) => {
      const next = new Set(prev);
      if (next.has(playerId)) next.delete(playerId as any);
      else next.add(playerId as any);
      return next;
    });
  };

  const handlePlayerClick = useCallback(
    (playerId: string | number) => {
      // If playerId is already a prefixed string (bdl-...), push as-is.
      if (typeof playerId === "string") router.push(`/players/${playerId}`);
      else router.push(`/players/${playerId}`);
    },
    [router]
  );

  if (teamLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <TeamSkeleton />
        </main>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-2">Team Not Found</h1>
            <p className="text-text-secondary mb-4">
              The team you&apos;re looking for doesn&apos;t exist.
            </p>
            <Link href="/teams">
              <Button>Back to Teams</Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const teamColor = getTeamColor(team.abbreviation);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/teams"
          className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Teams
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-6 sm:p-8 mb-8"
          style={{
            background: `linear-gradient(135deg, ${teamColor}15, transparent, ${teamColor}08)`,
          }}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <TeamLogo
              teamId={team.id}
              teamName={team.full_name}
              abbreviation={team.abbreviation}
              size="2xl"
              priority
            />

            <div className="flex-1">
              <h1 className="text-3xl sm:text-4xl font-bold mb-2">
                {team.city} {team.name}
              </h1>

              <div className="flex flex-wrap items-center gap-3 text-text-secondary mb-4">
                <Badge
                  variant={team.conference === "East" ? "primary" : "secondary"}
                >
                  {team.conference}ern Conference
                </Badge>
                <span className="text-text-muted">&middot;</span>
                <span>{team.division} Division</span>
                {(record.wins > 0 || record.losses > 0) && (
                  <>
                    <span className="text-text-muted">&middot;</span>
                    <span className="font-semibold tabular-nums">
                      {record.wins}-{record.losses}
                    </span>
                  </>
                )}
              </div>

              <div className="flex gap-3">
                <Button variant="outline" size="sm">
                  <Heart className="w-4 h-4 mr-2" />
                  Favorite
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" style={{ color: teamColor }} />
                Roster ({sortedRoster.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {rosterLoading ? (
                <div className="space-y-3">
                  {[...Array(8)].map((_, i) => (
                    <Skeleton key={i} className="h-14" />
                  ))}
                </div>
              ) : sortedRoster.length > 0 ? (
                <>
                  <div className="flex items-center gap-3 px-3 pb-2 border-b border-border text-xs text-text-muted font-medium">
                    <div className="flex-1">Player</div>
                    <div className="w-10 text-center">GP</div>
                    <div className="w-12 text-center">PPG</div>
                    <div className="w-12 text-center">RPG</div>
                    <div className="w-12 text-center">APG</div>
                    <div className="w-12 text-center">MPG</div>
                    <div className="w-8" />
                  </div>

                  <div className="space-y-1 mt-1">
                    {sortedRoster.map((player, index) => {
                      const isExpanded = expandedPlayers.has(player.playerId);
                      const showBenchDivider = index === 5;

                      return (
                        <div key={player.playerId}>
                          {showBenchDivider && (
                            <div className="flex items-center gap-3 px-3 py-2 mt-2">
                              <div className="flex-1 border-t border-border" />
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                                Bench
                              </span>
                              <div className="flex-1 border-t border-border" />
                            </div>
                          )}
                          {index === 0 && (
                            <div className="flex items-center gap-3 px-3 pb-1">
                              <span
                                className="text-[10px] font-semibold uppercase tracking-wider"
                                style={{ color: teamColor }}
                              >
                                Starters
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-hover transition-colors">
                            <button
                              onClick={() => handlePlayerClick(player.playerId)}
                              className="flex items-center gap-3 flex-1 min-w-0 text-left group"
                            >
                              <PlayerHeadshot
                                nbaPlayerId={player.source === "nba" ? player.playerId as number : null}
                                firstName={player.playerName.split(" ")[0] || ""}
                                lastName={player.playerName.split(" ").slice(1).join(" ") || ""}
                                teamAbbreviation={team.abbreviation}
                                size="sm"
                              />
                              <div className="min-w-0">
                                <p className="font-medium text-sm truncate group-hover:underline">
                                  {player.playerName}
                                </p>
                              </div>
                            </button>

                            <div className="w-10 text-center text-xs text-text-muted tabular-nums">
                              {player.gp}
                            </div>
                            <div className="w-12 text-center text-xs font-semibold tabular-nums">
                              {player.pts.toFixed(1)}
                            </div>
                            <div className="w-12 text-center text-xs text-text-secondary tabular-nums">
                              {player.reb.toFixed(1)}
                            </div>
                            <div className="w-12 text-center text-xs text-text-secondary tabular-nums">
                              {player.ast.toFixed(1)}
                            </div>
                            <div className="w-12 text-center text-xs text-text-muted tabular-nums">
                              {player.min.toFixed(1)}
                            </div>

                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                toggleExpand(player.playerId);
                              }}
                              className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-surface-hover transition-colors"
                              aria-label={
                                isExpanded
                                  ? "Collapse recent games"
                                  : "Expand recent games"
                              }
                            >
                              <ChevronDown
                                className={`w-4 h-4 text-text-muted transition-transform ${
                                  isExpanded ? "rotate-180" : ""
                                }`}
                              />
                            </button>
                          </div>

                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                {player.source === "nba" ? (
                                  <PlayerRecentGames
                                    nbaPlayerId={player.playerId as number}
                                    seasonString={seasonString}
                                    teamColor={teamColor}
                                  />
                                ) : (
                                  <div className="ml-16 mr-3 mb-3 p-3 rounded-lg bg-surface-hover/50 border border-border/50">
                                    <p className="text-xs text-text-muted">Recent games not available for this roster source.</p>
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <p className="text-text-secondary text-center py-8">
                  No roster information available
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" style={{ color: teamColor }} />
                Recent Games
              </CardTitle>
            </CardHeader>
            <CardContent>
              {gamesLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16" />
                  ))}
                </div>
              ) : recentGames.length > 0 ? (
                <div className="space-y-3">
                  {recentGames.map((game) => {
                    const isHome = game.home_team.id === teamId;
                    const opponent = isHome
                      ? game.visitor_team
                      : game.home_team;
                    const teamScore = isHome
                      ? game.home_team_score
                      : game.visitor_team_score;
                    const opponentScore = isHome
                      ? game.visitor_team_score
                      : game.home_team_score;
                    const won = teamScore > opponentScore;

                    return (
                      <Link
                        key={game.id}
                        href={`/games/${game.id}`}
                        className="block p-3 rounded-lg hover:bg-surface-hover transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <TeamLogo
                              teamId={opponent.id}
                              teamName={opponent.full_name}
                              abbreviation={opponent.abbreviation}
                              size="xs"
                            />
                            <span className="text-xs text-text-muted">
                              {isHome ? "vs" : "@"} {opponent.abbreviation}
                            </span>
                          </div>
                          <Badge variant={won ? "secondary" : "danger"} size="sm">
                            {won ? "W" : "L"}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">
                            {opponent.city} {opponent.name}
                          </span>
                          <span className="font-bold tabular-nums text-sm">
                            {teamScore} - {opponentScore}
                          </span>
                        </div>
                        <span className="text-xs text-text-muted">
                          {new Date(game.date).toLocaleDateString()}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <p className="text-text-secondary text-center py-8">
                  No recent games
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

function PlayerRecentGames({
  nbaPlayerId,
  seasonString,
  teamColor,
}: {
  nbaPlayerId: number;
  seasonString: string;
  teamColor: string;
}) {
  const { data: gameLog, isLoading } = useQuery({
    queryKey: ["nba-game-log-expand", nbaPlayerId, seasonString],
    queryFn: () => getPlayerGameLog(nbaPlayerId, seasonString),
    enabled: nbaPlayerId > 0,
    staleTime: 5 * 60 * 1000,
  });

  const games = gameLog?.slice(0, 5) || [];

  return (
    <div className="ml-16 mr-3 mb-3 p-3 rounded-lg bg-surface-hover/50 border border-border/50">
      <p className="text-xs font-medium text-text-muted mb-2">Recent Games</p>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-6" />
          ))}
        </div>
      ) : games.length > 0 ? (
        <div className="space-y-0">
          <div className="flex items-center text-[10px] text-text-muted font-medium pb-1 border-b border-border/30">
            <div className="w-14">Date</div>
            <div className="flex-1">MIN</div>
            <div className="w-10 text-center">PTS</div>
            <div className="w-10 text-center">REB</div>
            <div className="w-10 text-center">AST</div>
            <div className="w-14 text-center">FG</div>
          </div>
          {games.map((game: GameLogEntry, idx: number) => (
            <div
              key={idx}
              className="flex items-center text-xs py-1.5 border-b border-border/20 last:border-0"
            >
              <div className="w-14 text-text-muted tabular-nums">
                {formatGameDate(game.gameDate)}
              </div>
              <div className="flex-1 text-text-muted tabular-nums">
                {game.min || 0}
              </div>
              <div className="w-10 text-center font-semibold tabular-nums">
                {game.pts}
              </div>
              <div className="w-10 text-center text-text-secondary tabular-nums">
                {game.reb}
              </div>
              <div className="w-10 text-center text-text-secondary tabular-nums">
                {game.ast}
              </div>
              <div className="w-14 text-center text-text-muted tabular-nums">
                {game.fgm}/{game.fga}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-text-muted">No recent games</p>
      )}
    </div>
  );
}

function formatGameDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "numeric", day: "numeric" });
  } catch {
    return dateStr.slice(0, 5);
  }
}

function TeamSkeleton() {
  return (
    <>
      <Skeleton className="h-8 w-32 mb-6" />
      <Skeleton className="h-48 w-full rounded-2xl mb-8" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="h-96 lg:col-span-2 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    </>
  );
}
