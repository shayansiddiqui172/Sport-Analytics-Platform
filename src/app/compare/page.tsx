"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search, X, ArrowRight } from "lucide-react";
import { Header } from "@/components/layout/header";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Badge,
  Skeleton,
  PlayerHeadshot,
} from "@/components/ui";
import { usePlayerSearch, useSeasonAverages } from "@/hooks/useNBAData";
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

  const { data: searchData1 } = usePlayerSearch(search1);
  const { data: searchData2 } = usePlayerSearch(search2);

  const { data: stats1, isLoading: stats1Loading } = useSeasonAverages(
    player1?.id || 0
  );
  const { data: stats2, isLoading: stats2Loading } = useSeasonAverages(
    player2?.id || 0
  );

  const playerStats1 = stats1?.data?.[0];
  const playerStats2 = stats2?.data?.[0];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Player Comparison</h1>
          <p className="text-text-secondary">
            Compare stats side-by-side between any two NBA players
          </p>
        </div>

        {/* Player Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <PlayerSelector
            player={player1}
            setPlayer={setPlayer1}
            search={search1}
            setSearch={setSearch1}
            showSearch={showSearch1}
            setShowSearch={setShowSearch1}
            searchResults={searchData1?.data || []}
            label="Player 1"
          />

          <div className="hidden md:flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-surface-elevated flex items-center justify-center">
              <span className="text-text-muted font-bold">VS</span>
            </div>
          </div>

          <PlayerSelector
            player={player2}
            setPlayer={setPlayer2}
            search={search2}
            setSearch={setSearch2}
            showSearch={showSearch2}
            setShowSearch={setShowSearch2}
            searchResults={searchData2?.data || []}
            label="Player 2"
          />
        </div>

        {/* Comparison */}
        {player1 && player2 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Season Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                {stats1Loading || stats2Loading ? (
                  <div className="space-y-4">
                    {[...Array(8)].map((_, i) => (
                      <Skeleton key={i} className="h-12" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <ComparisonRow
                      label="Points Per Game"
                      value1={playerStats1?.pts || 0}
                      value2={playerStats2?.pts || 0}
                      format={(v) => v.toFixed(1)}
                    />
                    <ComparisonRow
                      label="Rebounds Per Game"
                      value1={playerStats1?.reb || 0}
                      value2={playerStats2?.reb || 0}
                      format={(v) => v.toFixed(1)}
                    />
                    <ComparisonRow
                      label="Assists Per Game"
                      value1={playerStats1?.ast || 0}
                      value2={playerStats2?.ast || 0}
                      format={(v) => v.toFixed(1)}
                    />
                    <ComparisonRow
                      label="Steals Per Game"
                      value1={playerStats1?.stl || 0}
                      value2={playerStats2?.stl || 0}
                      format={(v) => v.toFixed(1)}
                    />
                    <ComparisonRow
                      label="Blocks Per Game"
                      value1={playerStats1?.blk || 0}
                      value2={playerStats2?.blk || 0}
                      format={(v) => v.toFixed(1)}
                    />
                    <ComparisonRow
                      label="Field Goal %"
                      value1={(playerStats1?.fg_pct || 0) * 100}
                      value2={(playerStats2?.fg_pct || 0) * 100}
                      format={(v) => v.toFixed(1) + "%"}
                    />
                    <ComparisonRow
                      label="3-Point %"
                      value1={(playerStats1?.fg3_pct || 0) * 100}
                      value2={(playerStats2?.fg3_pct || 0) * 100}
                      format={(v) => v.toFixed(1) + "%"}
                    />
                    <ComparisonRow
                      label="Free Throw %"
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
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto bg-surface-elevated rounded-full flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-text-muted" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Select Two Players</h2>
            <p className="text-text-secondary max-w-md mx-auto">
              Search and select two players above to compare their stats
              side-by-side.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

function PlayerSelector({
  player,
  setPlayer,
  search,
  setSearch,
  showSearch,
  setShowSearch,
  searchResults,
  label,
}: {
  player: Player | null;
  setPlayer: (p: Player | null) => void;
  search: string;
  setSearch: (s: string) => void;
  showSearch: boolean;
  setShowSearch: (s: boolean) => void;
  searchResults: Player[];
  label: string;
}) {
  const { data: nbaPlayerId } = useNBAPlayerId(
    player?.first_name || "",
    player?.last_name || ""
  );

  return (
    <div className="relative">
      {player ? (
        <Card>
          <CardContent className="flex items-center justify-between py-6">
            <div className="flex items-center gap-4">
              <PlayerHeadshot
                nbaPlayerId={nbaPlayerId}
                firstName={player.first_name}
                lastName={player.last_name}
                teamAbbreviation={player.team?.abbreviation}
                size="xl"
              />
              <div>
                <h3 className="font-semibold text-lg">
                  {player.first_name} {player.last_name}
                </h3>
                <p className="text-text-secondary">
                  {player.team?.full_name || "Free Agent"}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setPlayer(null);
                setSearch("");
              }}
            >
              <X className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="relative">
          <p className="text-sm text-text-muted mb-2">{label}</p>
          <Input
            placeholder="Search for a player..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setShowSearch(true);
            }}
            onFocus={() => setShowSearch(true)}
            leftIcon={<Search className="w-4 h-4" />}
          />
          {showSearch && searchResults.length > 0 && (
            <div className="absolute z-10 w-full mt-2 bg-surface border border-border rounded-lg shadow-lg max-h-64 overflow-y-auto">
              {searchResults.map((p) => (
                <PlayerSearchItem
                  key={p.id}
                  player={p}
                  onClick={() => {
                    setPlayer(p);
                    setSearch("");
                    setShowSearch(false);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PlayerSearchItem({ player, onClick }: { player: Player; onClick: () => void }) {
  const { data: nbaPlayerId } = useNBAPlayerId(
    player.first_name || "",
    player.last_name || ""
  );

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
      <div>
        <p className="font-medium">
          {player.first_name} {player.last_name}
        </p>
        <p className="text-sm text-text-secondary">
          {player.team?.full_name || "Free Agent"}
        </p>
      </div>
    </button>
  );
}

function ComparisonRow({
  label,
  value1,
  value2,
  format,
}: {
  label: string;
  value1: number;
  value2: number;
  format: (v: number) => string;
}) {
  const diff = value1 - value2;
  const maxValue = Math.max(value1, value2) || 1;

  return (
    <div className="grid grid-cols-3 items-center gap-4">
      <div className="text-right">
        <span
          className={cn(
            "text-xl font-bold",
            diff > 0 ? "text-secondary" : diff < 0 ? "text-text-secondary" : ""
          )}
        >
          {format(value1)}
        </span>
        {diff > 0 && (
          <span className="text-xs text-secondary ml-2">
            +{format(Math.abs(diff))}
          </span>
        )}
      </div>

      <div className="text-center">
        <p className="text-sm text-text-secondary">{label}</p>
        <div className="flex h-2 bg-surface-elevated rounded-full overflow-hidden mt-1">
          <div
            className="bg-primary/70 transition-all duration-500"
            style={{ width: `${(value1 / maxValue) * 50}%` }}
          />
          <div
            className="bg-accent-purple/70 transition-all duration-500 ml-auto"
            style={{ width: `${(value2 / maxValue) * 50}%` }}
          />
        </div>
      </div>

      <div className="text-left">
        <span
          className={cn(
            "text-xl font-bold",
            diff < 0 ? "text-secondary" : diff > 0 ? "text-text-secondary" : ""
          )}
        >
          {format(value2)}
        </span>
        {diff < 0 && (
          <span className="text-xs text-secondary ml-2">
            +{format(Math.abs(diff))}
          </span>
        )}
      </div>
    </div>
  );
}
