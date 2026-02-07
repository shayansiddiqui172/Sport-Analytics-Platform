"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import { formatOdds, type AwardCategory, type AwardCandidate } from "@/lib/predictions";

interface AwardCardProps {
  award: AwardCategory;
  index: number;
}

export const AwardCard = memo(function AwardCard({ award, index }: AwardCardProps) {
  const hasData = award.candidates.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card variant="elevated" className="h-full">
        <CardContent className="py-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div>
              <h3 className="text-lg font-bold text-text-primary">{award.title}</h3>
              <p className="text-xs text-text-muted">{award.description}</p>
            </div>
          </div>

          {/* Candidates */}
          {hasData ? (
            <div className="space-y-4">
              {award.candidates.map((candidate, i) => (
                <CandidateRow
                  key={candidate.name}
                  candidate={candidate}
                  isLeader={i === 0}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-text-muted text-sm">No odds available</p>
              <p className="text-text-muted text-xs mt-1">Check back later</p>
            </div>
          )}

          {/* Footer - Bookmaker info */}
          {hasData && award.bookmaker && (
            <div className="mt-6 pt-4 border-t border-border">
              <p className="text-xs text-text-muted text-center">
                {award.bookmaker === "Stats-Based" ? (
                  <span className="flex items-center justify-center gap-1">
                    <span className="inline-block w-2 h-2 rounded-full bg-accent-purple/50" />
                    Based on performance stats
                  </span>
                ) : (
                  <>Odds via {award.bookmaker}</>
                )}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
});

const CandidateRow = memo(function CandidateRow({
  candidate,
  isLeader,
}: {
  candidate: AwardCandidate;
  isLeader: boolean;
}) {
  // Color based on rank
  const barColor = isLeader
    ? "bg-gradient-to-r from-yellow-500 to-amber-400"
    : candidate.rank === 2
    ? "bg-gradient-to-r from-gray-300 to-gray-400"
    : candidate.rank === 3
    ? "bg-gradient-to-r from-amber-600 to-amber-700"
    : "bg-primary/40";

  return (
    <div className={cn("group", isLeader && "")}>
      {/* Name and odds row */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={cn(
              "text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full shrink-0",
              isLeader
                ? "bg-yellow-500/20 text-yellow-500"
                : "bg-surface text-text-muted"
            )}
          >
            {candidate.rank}
          </span>
          <span
            className={cn(
              "font-medium truncate",
              isLeader ? "text-text-primary" : "text-text-secondary"
            )}
          >
            {candidate.name}
          </span>
        </div>
        <span className="text-xs text-text-muted tabular-nums shrink-0 ml-2">
          {formatOdds(candidate.odds)}
        </span>
      </div>

      {/* Probability bar */}
      <div className="relative h-6 bg-surface rounded-lg overflow-hidden">
        <motion.div
          className={cn("absolute inset-y-0 left-0 rounded-lg", barColor)}
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(candidate.probability, 3)}%` }}
          transition={{ duration: 0.8, delay: candidate.rank * 0.1, ease: "easeOut" }}
        />
        <div className="absolute inset-0 flex items-center justify-end pr-2">
          <span className="text-xs font-bold tabular-nums text-white">
            {candidate.probability.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
});
