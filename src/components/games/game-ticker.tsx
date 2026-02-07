"use client";

import { useRef, useCallback, memo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button, Badge, SkeletonGameCard, TeamLogo } from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import type { Game } from "@/types";

interface GameTickerProps {
  games: Game[];
  isLoading?: boolean;
  isLive?: boolean; // Whether data is from live scoreboard
}

export function GameTicker({ games, isLoading, isLive }: GameTickerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // PERF: Memoize scroll handler to prevent recreation on every render
  const scroll = useCallback((direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  }, []);

  if (isLoading) {
    return (
      <div className="relative">
        <div className="flex gap-4 overflow-x-auto hide-scrollbar py-2 px-1">
          {[...Array(5)].map((_, i) => (
            <SkeletonGameCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-xl p-8 text-center">
        <p className="text-text-secondary">No games scheduled for today</p>
      </div>
    );
  }

  return (
    <div className="relative group">
      {/* Left Scroll Button */}
      <Button
        variant="ghost"
        size="sm"
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-surface-elevated/80 backdrop-blur-sm"
        onClick={() => scroll("left")}
      >
        <ChevronLeft className="w-5 h-5" />
      </Button>

      {/* Games Container */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto hide-scrollbar py-2 px-1"
      >
        {games.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>

      {/* Right Scroll Button */}
      <Button
        variant="ghost"
        size="sm"
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-surface-elevated/80 backdrop-blur-sm"
        onClick={() => scroll("right")}
      >
        <ChevronRight className="w-5 h-5" />
      </Button>

      {/* Gradient Overlays */}
      <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-background to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background to-transparent pointer-events-none" />
    </div>
  );
}

// PERF: Memoize GameCard to prevent re-renders when parent updates
const GameCard = memo(function GameCard({ game }: { game: Game }) {
  const isLive = game.status === "in_progress";
  const isFinal = game.status === "final";

  /** Format period + clock for live games */
  const getLiveStatusText = () => {
    if (!isLive) return "";
    const period = game.period <= 4 ? `Q${game.period}` : game.period === 5 ? "OT" : `${game.period - 4}OT`;
    if (game.time) return `${period} ${game.time}`;
    return period;
  };

  return (
    <motion.a
      href={`/games/${game.id}`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "min-w-[280px] bg-surface border border-border rounded-xl p-4",
        "hover:border-border-light transition-all cursor-pointer",
        isLive && "border-primary/50 live-indicator"
      )}
    >
      {/* Status */}
      <div className="flex justify-between items-center mb-4">
        <span className="text-xs text-text-muted">
          {isFinal ? "Final" : isLive ? getLiveStatusText() : game.time}
        </span>
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
        {isFinal && <Badge variant="default" size="sm">Final</Badge>}
      </div>

      {/* Teams */}
      <div className="space-y-3">
        <TeamRow
          team={game.visitor_team}
          score={game.visitor_team_score}
          isWinner={game.visitor_team_score > game.home_team_score}
          isFinal={isFinal}
        />
        <TeamRow
          team={game.home_team}
          score={game.home_team_score}
          isWinner={game.home_team_score > game.visitor_team_score}
          isFinal={isFinal}
        />
      </div>
    </motion.a>
  );
});

// PERF: Memoize TeamRow to prevent re-renders when sibling components update
const TeamRow = memo(function TeamRow({
  team,
  score,
  isWinner,
  isFinal,
}: {
  team: Game["home_team"];
  score: number;
  isWinner: boolean;
  isFinal?: boolean;
}) {
  
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <TeamLogo
          teamName={`${team.city} ${team.name}`}
          abbreviation={team.abbreviation}
          size="sm"
        />
        <span
          className={cn(
            "font-medium",
            isWinner ? "text-text-primary font-bold" : "text-text-secondary"
          )}
        >
          {team.city} {team.name}
        </span>
        {isFinal && (
          <span
            className={cn(
              "text-xs font-bold px-1.5 py-0.5 rounded",
              isWinner
                ? "bg-green-500/20 text-green-400"
                : "bg-red-500/20 text-red-400"
            )}
          >
            {isWinner ? "W" : "L"}
          </span>
        )}
      </div>
      <motion.span
        key={score}
        initial={!isFinal && score > 0 ? { scale: 1.3, color: "rgb(34, 197, 94)" } : false}
        animate={{ scale: 1, color: isWinner ? "rgb(255,255,255)" : "rgb(156,163,175)" }}
        transition={{ duration: 0.5 }}
        className={cn(
          "text-xl font-bold tabular-nums",
          isWinner ? "text-text-primary" : "text-text-secondary"
        )}
      >
        {score || "-"}
      </motion.span>
    </div>
  );
});
