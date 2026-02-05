"use client";

import { AnimatedNumber } from "@/components/ui/animated-number";
import { cn } from "@/lib/utils/cn";

interface CompareStatRowProps {
  label: string;
  value1: number;
  value2: number;
  format?: (v: number) => string;
}

export default function CompareStatRow({ label, value1, value2, format }: CompareStatRowProps) {
  const formatFn = format || ((v: number) => String(v));
  const winner = value1 === value2 ? "tie" : value1 > value2 ? "left" : "right";

  // Compute proportional widths so bars sit adjacent and sum to 100%
  const total = Math.abs(value1) + Math.abs(value2);
  const leftPct = total === 0 ? 50 : (Math.abs(value1) / total) * 100;
  const rightPct = total === 0 ? 50 : (Math.abs(value2) / total) * 100;

  return (
    <div className="grid grid-cols-3 items-center gap-4">
      <div className="text-right">
        <span className={cn("text-xl font-bold tabular-nums", winner === "left" && "golden-highlight")}>
          {formatFn(value1)}
        </span>
      </div>

      <div className="text-center">
        <p className="text-sm text-text-secondary">{label}</p>
        <div className="flex h-2 bg-surface-elevated rounded-full overflow-hidden mt-1" aria-hidden>
          <div className="transition-all duration-500" style={{ width: `${leftPct}%`, background: "linear-gradient(90deg, rgba(59,130,246,0.9), rgba(59,130,246,0.7))" }} />
          <div className="transition-all duration-500" style={{ width: `${rightPct}%`, background: "linear-gradient(90deg, rgba(168,85,247,0.9), rgba(168,85,247,0.7))" }} />
        </div>
      </div>

      <div className="text-left">
        <span className={cn("text-xl font-bold tabular-nums", winner === "right" && "golden-highlight")}>
          {formatFn(value2)}
        </span>
      </div>
    </div>
  );
}
