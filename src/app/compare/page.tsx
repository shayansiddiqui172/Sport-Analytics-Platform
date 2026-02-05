"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Skeleton,
  PlayerHeadshot,
} from "@/components/ui";
import { useInstantPlayerSearch } from "@/hooks/useNBAData";
import { useNBAPlayerId } from "@/hooks/useNBAStats";
import { cn } from "@/lib/utils/cn";
import type { Player, PlayerStats } from "@/types";

export default function ComparePage() {
  const [player1, setPlayer1] = useState<Player | null>(null);
  const [player2, setPlayer2] = useState<Player | null>(null);
  const [search1, setSearch1] = useState("");
  const [search2, setSearch2] = useState("");
  const [showSearch1, setShowSearch1] = useState(false);
  const [showSearch2, setShowSearch2] = useState(false);

  const { data: searchData1 } = useInstantPlayerSearch(search1);
  const { data: searchData2 } = useInstantPlayerSearch(search2);

  // Fetch player data from database which includes season_averages
  const { data: player1Data, isLoading: stats1Loading } = useQuery({
    queryKey: ["player", player1?.id],
    queryFn: async () => {
      const res = await fetch(`/api/db/players/${player1?.id}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!player1?.id,
  });

  const { data: player2Data, isLoading: stats2Loading } = useQuery({
    queryKey: ["player", player2?.id],
    queryFn: async () => {
      const res = await fetch(`/api/db/players/${player2?.id}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!player2?.id,
  });

  const playerStats1 = player1Data?.data?.season_averages;
  const playerStats2 = player2Data?.data?.season_averages;

  // Calculate overall winner based on weighted stats
  const overallWinner = useMemo(() => {
    if (!playerStats1 || !playerStats2) return null;
    const score1 =
      (playerStats1.pts || 0) +
      (playerStats1.reb || 0) +
      (playerStats1.ast || 0) +
      (playerStats1.stl || 0) +
      (playerStats1.blk || 0);
    const score2 =
      (playerStats2.pts || 0) +
      (playerStats2.reb || 0) +
      (playerStats2.ast || 0) +
      (playerStats2.stl || 0) +
      (playerStats2.blk || 0);
    if (score1 > score2) return 1;
    if (score2 > score1) return 2;
    return 0;
  }, [playerStats1, playerStats2]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-2">Player Comparison</h1>
          <p className="text-text-secondary text-lg">
            Compare stats side-by-side between any two NBA players
          </p>
        </div>

        {/* Search Bar Section - Side by Side */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8 items-end">
          {/* Player 1 Search */}
          <div className="md:col-span-2">
            <p className="text-sm text-text-muted mb-2 font-semibold">Player 1</p>
            <div className="relative">
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <Input
                    placeholder="Search player..."
                    value={search1}
                    onChange={(e) => {
                      setSearch1(e.target.value);
                      setShowSearch1(true);
                    }}
                    onFocus={() => setShowSearch1(true)}
                    leftIcon={<Search className="w-4 h-4" />}
                    className={cn(
                      player1 && "border-primary/50"
                    )}
                  />
                  {player1 && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <div className="text-xs text-primary font-medium bg-primary/10 px-2 py-1 rounded">
                        {player1.first_name} {player1.last_name}
                      </div>
                    </div>
                  )}
                  {showSearch1 && searchData1?.data && searchData1.data.length > 0 && (
                    <div className="absolute z-20 w-full mt-2 bg-surface border border-border rounded-lg shadow-lg max-h-64 overflow-y-auto">
                      {searchData1.data.map((p: Player) => (
                        <PlayerSearchItem
                          key={p.id}
                          player={p}
                          onClick={() => {
                            setPlayer1(p);
                            setSearch1("");
                            setShowSearch1(false);
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
                {player1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setPlayer1(null);
                      setSearch1("");
                    }}
                    className="h-10 w-10 p-0 flex-shrink-0 hover:bg-red-500/20"
                    title="Clear player"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* VS Badge */}
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="w-12 h-12 rounded-full bg-surface-elevated border-2 border-primary flex items-center justify-center">
              <span className="text-sm font-bold">VS</span>
            </div>
          </div>

          {/* Player 2 Search */}
          <div className="md:col-span-2">
            <p className="text-sm text-text-muted mb-2 font-semibold">Player 2</p>
            <div className="relative">
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <Input
                    placeholder="Search player..."
                    value={search2}
                    onChange={(e) => {
                      setSearch2(e.target.value);
                      setShowSearch2(true);
                    }}
                    onFocus={() => setShowSearch2(true)}
                    leftIcon={<Search className="w-4 h-4" />}
                    className={cn(
                      player2 && "border-primary/50"
                    )}
                  />
                  {player2 && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <div className="text-xs text-primary font-medium bg-primary/10 px-2 py-1 rounded">
                        {player2.first_name} {player2.last_name}
                      </div>
                    </div>
                  )}
                  {showSearch2 && searchData2?.data && searchData2.data.length > 0 && (
                    <div className="absolute z-20 w-full mt-2 bg-surface border border-border rounded-lg shadow-lg max-h-64 overflow-y-auto">
                      {searchData2.data.map((p: Player) => (
                        <PlayerSearchItem
                          key={p.id}
                          player={p}
                          onClick={() => {
                            setPlayer2(p);
                            setSearch2("");
                            setShowSearch2(false);
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
                {player2 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setPlayer2(null);
                      setSearch2("");
                    }}
                    className="h-10 w-10 p-0 flex-shrink-0 hover:bg-red-500/20"
                    title="Clear player"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Player Profiles Section */}
        {player1 && player2 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-12"
          >
            {/* Player 1 Profile */}
            <div className="md:col-span-2">
              <Card className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setPlayer1(null);
                    setSearch1("");
                  }}
                  className="absolute top-2 right-2 z-10 h-8 w-8 p-0 hover:bg-red-500/20"
                  title="Remove player"
                >
                  <X className="w-4 h-4" />
                </Button>
                <CardContent className="pt-6">
                  <PlayerProfile player={player1} />
                </CardContent>
              </Card>
            </div>

            {/* Comparison Indicator */}
            <div className="flex items-center justify-center">
              {overallWinner !== null && (
                <div className="text-6xl font-bold text-yellow-500">
                  {overallWinner === 1 ? ">" : overallWinner === 2 ? "<" : "="}
                </div>
              )}
            </div>

            {/* Player 2 Profile */}
            <div className="md:col-span-2">
              <Card className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setPlayer2(null);
                    setSearch2("");
                  }}
                  className="absolute top-2 right-2 z-10 h-8 w-8 p-0 hover:bg-red-500/20"
                  title="Remove player"
                >
                  <X className="w-4 h-4" />
                </Button>
                <CardContent className="pt-6">
                  <PlayerProfile player={player2} />
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}

        {/* Stats Comparison Section */}
        {player1 && player2 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-center">Season Stats Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                {stats1Loading || stats2Loading ? (
                  <div className="space-y-4">
                    {[...Array(11)].map((_, i) => (
                      <Skeleton key={i} className="h-12" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <ComparisonRow
                      label="Games"
                      player1Name={player1.first_name}
                      player2Name={player2.first_name}
                      value1={playerStats1?.games_played || 0}
                      value2={playerStats2?.games_played || 0}
                      format={(v) => Math.round(v).toString()}
                    />
                    <ComparisonRow
                      label="Points Per Game"
                      player1Name={player1.first_name}
                      player2Name={player2.first_name}
                      value1={playerStats1?.pts || 0}
                      value2={playerStats2?.pts || 0}
                      format={(v) => v.toFixed(1)}
                    />
                    <ComparisonRow
                      label="Rebounds Per Game"
                      player1Name={player1.first_name}
                      player2Name={player2.first_name}
                      value1={playerStats1?.reb || 0}
                      value2={playerStats2?.reb || 0}
                      format={(v) => v.toFixed(1)}
                    />
                    <ComparisonRow
                      label="Assists Per Game"
                      player1Name={player1.first_name}
                      player2Name={player2.first_name}
                      value1={playerStats1?.ast || 0}
                      value2={playerStats2?.ast || 0}
                      format={(v) => v.toFixed(1)}
                    />
                    <ComparisonRow
                      label="Steals Per Game"
                      player1Name={player1.first_name}
                      player2Name={player2.first_name}
                      value1={playerStats1?.stl || 0}
                      value2={playerStats2?.stl || 0}
                      format={(v) => v.toFixed(1)}
                    />
                    <ComparisonRow
                      label="Blocks Per Game"
                      player1Name={player1.first_name}
                      player2Name={player2.first_name}
                      value1={playerStats1?.blk || 0}
                      value2={playerStats2?.blk || 0}
                      format={(v) => v.toFixed(1)}
                    />
                    <ComparisonRow
                      label="Field Goal %"
                      player1Name={player1.first_name}
                      player2Name={player2.first_name}
                      value1={(playerStats1?.fg_pct || 0) * 100}
                      value2={(playerStats2?.fg_pct || 0) * 100}
                      format={(v) => v.toFixed(1) + "%"}
                    />
                    <ComparisonRow
                      label="3-Point %"
                      player1Name={player1.first_name}
                      player2Name={player2.first_name}
                      value1={(playerStats1?.fg3_pct || 0) * 100}
                      value2={(playerStats2?.fg3_pct || 0) * 100}
                      format={(v) => v.toFixed(1) + "%"}
                    />
                    <ComparisonRow
                      label="Free Throw %"
                      player1Name={player1.first_name}
                      player2Name={player2.first_name}
                      value1={(playerStats1?.ft_pct || 0) * 100}
                      value2={(playerStats2?.ft_pct || 0) * 100}
                      format={(v) => v.toFixed(1) + "%"}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Empty State */}
        {(!player1 || !player2) && (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto bg-surface-elevated rounded-full flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-text-muted" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">Select Two Players</h2>
            <p className="text-text-secondary text-lg max-w-md mx-auto">
              Search and select two players above to compare their stats side-by-side
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

function PlayerProfile({ player }: { player: Player }) {
  const { data: nbaPlayerId } = useNBAPlayerId(
    player.first_name || "",
    player.last_name || ""
  );

  return (
    <div className="flex flex-col items-center text-center gap-4">
      <PlayerHeadshot
        nbaPlayerId={nbaPlayerId}
        firstName={player.first_name}
        lastName={player.last_name}
        teamAbbreviation={player.team?.abbreviation}
        size="xl"
      />
      <div>
        <h3 className="font-bold text-xl">
          {player.first_name} {player.last_name}
        </h3>
        <p className="text-sm text-text-secondary">
          {player.team?.full_name || "Free Agent"}
        </p>
        {player.position && (
          <p className="text-xs text-text-muted mt-1">
            {player.position}
          </p>
        )}
      </div>
    </div>
  );
}

function PlayerSearchItem({ player, onClick }: { player: Player; onClick: () => void }) {
  const { data: nbaPlayerId } = useNBAPlayerId(
    player.first_name || "",
    player.last_name || ""
  );

  // Determine subtitle based on available data
  const subtitle = player.team?.full_name 
    ? `${player.team.full_name}${player.position ? ` · ${player.position}` : ''}`
    : player.position || 'Free Agent';

  return (
    <button
      className="w-full px-4 py-3 text-left hover:bg-surface-hover transition-colors flex items-center gap-3"
      onClick={onClick}
    >
      <PlayerHeadshot
        nbaPlayerId={nbaPlayerId}
        firstName={player.first_name}
        lastName={player.last_name}
        teamAbbreviation={player.team?.abbreviation}
        size="sm"
      />
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">
          {player.first_name} {player.last_name}
        </p>
        <p className="text-sm text-text-secondary truncate">
          {subtitle}
        </p>
      </div>
    </button>
  );
}

function ComparisonRow({
  label,
  player1Name,
  player2Name,
  value1,
  value2,
  format,
}: {
  label: string;
  player1Name: string;
  player2Name: string;
  value1: number;
  value2: number;
  format: (v: number) => string;
}) {
  const isPlayer1Better = value1 > value2;
  const isPlayer2Better = value2 > value1;
  const isTied = value1 === value2;

  return (
    <div className="space-y-2">
      {/* Label */}
      <p className="text-sm text-text-secondary font-medium">{label}</p>

      {/* Values Side by Side */}
      <div className="grid grid-cols-2 gap-4">
        {/* Player 1 Value */}
        <div
          className={cn(
            "p-4 rounded-lg border-2 text-center transition-all",
            isPlayer1Better
              ? "bg-yellow-500/20 border-yellow-500 shadow-lg"
              : "bg-surface-elevated border-border"
          )}
        >
          <p className="text-2xl font-bold">
            {format(value1)}
          </p>
          <p className="text-xs text-text-secondary mt-1">{player1Name}</p>
        </div>

        {/* Player 2 Value */}
        <div
          className={cn(
            "p-4 rounded-lg border-2 text-center transition-all",
            isPlayer2Better
              ? "bg-yellow-500/20 border-yellow-500 shadow-lg"
              : "bg-surface-elevated border-border"
          )}
        >
          <p className="text-2xl font-bold">
            {format(value2)}
          </p>
          <p className="text-xs text-text-secondary mt-1">{player2Name}</p>
        </div>
      </div>
    </div>
  );
}
