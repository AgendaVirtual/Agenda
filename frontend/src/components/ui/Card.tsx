import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;

  padding?: "md" | "sm" | "none";
}

export function Card({ children, className = "", padding = "md" }: CardProps) {
  const pad = padding === "none" ? "" : padding === "sm" ? "p-4" : "p-5";

  return (
    <div
      className={`rounded-card border border-hairline bg-surface ${pad} ${className}`}
    >
      {children}
    </div>
  );
}

interface SectionTitleProps {
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function SectionTitle({
  children,
  action,
  className = "",
}: SectionTitleProps) {
  return (
    <div
      className={`mb-4 flex items-center justify-between gap-3 ${className}`}
    >
      <h2 className="text-base font-semibold text-ink-strong">{children}</h2>
      {action}
    </div>
  );
}
