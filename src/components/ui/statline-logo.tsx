import { cn } from "@/lib/utils/cn";

type LogoSize = "sm" | "md" | "lg";

const SIZES: Record<LogoSize, string> = {
  sm: "text-lg",
  md: "text-xl",
  lg: "text-2xl",
};

interface StatLineLogoProps {
  size?: LogoSize;
  iconOnly?: boolean;
  className?: string;
}

export function StatLineLogo({
  size = "md",
  className,
}: StatLineLogoProps) {
  return (
    <div className={cn("flex items-center", className)}>
      <span className={cn("font-bold text-white", SIZES[size])}>StatLine</span>
    </div>
  );
}
