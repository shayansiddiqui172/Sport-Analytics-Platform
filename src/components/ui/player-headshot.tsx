"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { getNBAHeadshotUrl, getNBAHeadshotUrlSmall } from "@/lib/player-headshots";
import { getTeamColor } from "@/lib/team-colors";
import { cn } from "@/lib/utils/cn";

type HeadshotSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

const SIZE_MAP: Record<HeadshotSize, number> = {
  xs: 32,
  sm: 40,
  md: 48,
  lg: 64,
  xl: 96,
  "2xl": 128,
};

interface PlayerHeadshotProps {
  nbaPlayerId?: number | null;
  firstName: string;
  lastName: string;
  teamAbbreviation?: string;
  size?: HeadshotSize;
  className?: string;
  priority?: boolean;
}

/**
 * PlayerHeadshot component — displays NBA player headshots with automatic fallback.
 *
 * Strategy (mirrors TeamLogo architecture):
 * 1. Try high-res NBA.com headshot (1040x760)
 * 2. On error, try smaller variant (260x190)
 * 3. On final error, show styled initials fallback
 *
 * Usage:
 * ```tsx
 * <PlayerHeadshot
 *   nbaPlayerId={2544}
 *   firstName="LeBron"
 *   lastName="James"
 *   teamAbbreviation="LAL"
 *   size="xl"
 * />
 * ```
 */
export function PlayerHeadshot({
  nbaPlayerId,
  firstName,
  lastName,
  teamAbbreviation,
  size = "md",
  className,
  priority = false,
}: PlayerHeadshotProps) {
  const [imgError, setImgError] = useState(false);
  const [fallbackAttempted, setFallbackAttempted] = useState(false);

  // Reset error state when player changes
  useEffect(() => {
    setImgError(false);
    setFallbackAttempted(false);
  }, [nbaPlayerId]);

  const px = SIZE_MAP[size];
  const teamColor = teamAbbreviation ? getTeamColor(teamAbbreviation) : "#6366f1";

  // Determine which source to use
  const headshotUrl = nbaPlayerId 
    ? (fallbackAttempted ? getNBAHeadshotUrlSmall(nbaPlayerId) : getNBAHeadshotUrl(nbaPlayerId))
    : null;

  const handleError = () => {
    if (!fallbackAttempted && nbaPlayerId) {
      // Try smaller headshot variant
      setFallbackAttempted(true);
      setImgError(false);
    } else {
      // All CDN attempts failed — show initials fallback
      setImgError(true);
    }
  };

  // Render initials fallback
  if (!headshotUrl || imgError) {
    return (
      <div
        className={cn(
          "rounded-full flex items-center justify-center shrink-0 border-2",
          className
        )}
        style={{
          width: px,
          height: px,
          backgroundColor: teamColor + "20",
          borderColor: teamColor + "40",
        }}
        role="img"
        aria-label={`${firstName} ${lastName} profile picture`}
      >
        <span
          className="font-bold"
          style={{
            color: teamColor,
            fontSize: px * 0.35,
          }}
        >
          {firstName[0]}
          {lastName[0]}
        </span>
      </div>
    );
  }

  // Render headshot image
  return (
    <div
      className={cn("relative shrink-0 rounded-full overflow-hidden", className)}
      style={{ width: px, height: px }}
    >
      <Image
        src={headshotUrl}
        alt={`${firstName} ${lastName} headshot`}
        width={px}
        height={px}
        priority={priority}
        onError={handleError}
        className="object-cover object-top"
        style={{
          // Ensure the image fills the circle and crops from top (face-focused)
          objectPosition: "center 20%",
        }}
      />
    </div>
  );
}
