import type { ReactNode } from "react";

export type BadgeTone = "neutral" | "accent" | "success" | "danger" | "warning";

const TONES: Record<BadgeTone, string> = {
  neutral: "bg-canvas text-ink-muted",
  accent: "bg-accent-soft text-accent",
  success: "bg-success-soft text-success",
  danger: "bg-danger-soft text-danger",
  warning: "bg-warning-soft text-warning",
};

interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}

export function Badge({
  tone = "neutral",
  children,
  className = "",
}: BadgeProps) {
  return (
    <span
      className={
        `inline-flex items-center gap-2 rounded-sm px-3 py-1 text-xs ` +
        `font-medium whitespace-nowrap ${TONES[tone]} ${className}`
      }
    >
      {children}
    </span>
  );
}

interface DotBadgeProps {
  color: string;
  children: ReactNode;
  className?: string;
}

export function DotBadge({ color, children, className = "" }: DotBadgeProps) {
  return (
    <span
      className={
        `inline-flex items-center gap-2 rounded-sm bg-canvas px-3 py-1 ` +
        `text-xs font-medium whitespace-nowrap text-ink-strong ${className}`
      }
    >
      <span
        aria-hidden="true"
        className="h-2 w-2 shrink-0 rounded-pill"
        style={{ backgroundColor: color }}
      />
      {children}
    </span>
  );
}
