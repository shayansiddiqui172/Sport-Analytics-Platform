"use client";

import { useEffect, useRef, useCallback } from "react";
import { useSpring } from "framer-motion";
import { cn } from "@/lib/utils/cn";

interface AnimatedNumberProps {
  value: number;
  decimals?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function AnimatedNumber({
  value,
  decimals = 0,
  className,
  style,
}: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const spring = useSpring(value, { stiffness: 100, damping: 20 });

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  // PERF: Memoize change handler to prevent effect subscription churn
  const handleChange = useCallback((v: number) => {
    if (ref.current) {
      ref.current.textContent = v.toFixed(decimals);
    }
  }, [decimals]);

  useEffect(() => {
    const unsubscribe = spring.on("change", handleChange);
    return unsubscribe;
  }, [spring, handleChange]);

  return (
    <span
      ref={ref}
      className={cn("tabular-nums", className)}
      style={style}
    >
      {value.toFixed(decimals)}
    </span>
  );
}
