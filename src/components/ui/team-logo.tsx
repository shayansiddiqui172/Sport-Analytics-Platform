"use client";

import { useState } from "react";
import Image from "next/image";
import { getNBALogoUrl, getESPNLogoUrl } from "@/lib/team-logos";
import { getTeamColor } from "@/lib/team-colors";
import { cn } from "@/lib/utils/cn";

type LogoSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

const SIZE_MAP: Record<LogoSize, number> = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 64,
  xl: 96,
  "2xl": 128,
};

interface TeamLogoProps {
  teamId?: number;
  teamName: string;
  abbreviation: string;
  size?: LogoSize;
  className?: string;
  priority?: boolean;
}

export function TeamLogo({
  teamName,
  abbreviation,
  size = "md",
  className,
  priority = false,
}: TeamLogoProps) {
  const [src, setSrc] = useState<string | null>(
    () => getNBALogoUrl(abbreviation) ?? getESPNLogoUrl(abbreviation)
  );
  const [fallbackAttempted, setFallbackAttempted] = useState(false);

  const px = SIZE_MAP[size];
  const color = getTeamColor(abbreviation);

  const handleError = () => {
    if (!fallbackAttempted) {
      // Try ESPN fallback
      const espn = getESPNLogoUrl(abbreviation);
      if (espn && espn !== src) {
        setSrc(espn);
        setFallbackAttempted(true);
        return;
      }
    }
    // All CDNs failed — show abbreviation fallback
    setSrc(null);
  };

  if (!src) {
    return (
      <div
        className={cn(
          "rounded-lg flex items-center justify-center shrink-0",
          className
        )}
        style={{
          width: px,
          height: px,
          backgroundColor: color + "20",
        }}
        role="img"
        aria-label={`${teamName} logo`}
      >
        <span
          className="font-bold"
          style={{
            color,
            fontSize: px * 0.3,
          }}
        >
          {abbreviation}
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn("relative shrink-0", className)}
      style={{ width: px, height: px }}
    >
      <Image
        src={src}
        alt={`${teamName} logo`}
        width={px}
        height={px}
        priority={priority}
        unoptimized={src.endsWith(".svg")}
        onError={handleError}
        className="object-contain drop-shadow-md"
      />
    </div>
  );
}
