"use client";

import { useState } from "react";
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
  const [src, setSrc] = useState<string | null>(
    () => getNBAHeadshotUrl(nbaPlayerId ?? null) ?? getNBAHeadshotUrlSmall(nbaPlayerId ?? null)
  );
  const [fallbackAttempted, setFallbackAttempted] = useState(false);

  const px = SIZE_MAP[size];
  const teamColor = teamAbbreviation ? getTeamColor(teamAbbreviation) : "#6366f1";

  const handleError = () => {
    if (!fallbackAttempted) {
      // Try smaller headshot variant
      const smallUrl = getNBAHeadshotUrlSmall(nbaPlayerId ?? null);
      if (smallUrl && smallUrl !== src) {
        setSrc(smallUrl);
        setFallbackAttempted(true);
        return;
      }
    }
    // All CDN attempts failed — show initials fallback
    setSrc(null);
  };

  // Render initials fallback
  if (!src) {
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
        src={src}
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
