import { cn } from "@/lib/utils/cn";
import type { HTMLAttributes } from "react";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "primary" | "secondary" | "danger" | "warning" | "live";
  size?: "sm" | "md";
}

export function Badge({
  className,
  variant = "default",
  size = "md",
  ...props
}: BadgeProps) {
  const variants = {
    default: "bg-surface-elevated text-text-secondary",
    primary: "bg-primary/20 text-primary",
    secondary: "bg-secondary/20 text-secondary",
    danger: "bg-danger/20 text-danger",
    warning: "bg-warning/20 text-warning",
    live: "bg-danger text-white animate-pulse",
  };

  const sizes = {
    sm: "px-1.5 py-0.5 text-xs",
    md: "px-2 py-1 text-xs",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
}
