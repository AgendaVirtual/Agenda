import type { Reminder } from "../types/entities";
import { NotificationsBell } from "./NotificationsBell";

interface TopBarProps {
  trilha: string[];

  lembretes: Reminder[];
}

export function TopBar({ trilha, lembretes }: TopBarProps) {
  return (
    <div className="mb-6 flex items-center justify-between gap-4">
      <nav aria-label="Trilha" className="flex min-w-0 items-center gap-1.5">
        {trilha.map((parte, index) => (
          <span key={parte} className="flex min-w-0 items-center gap-1.5">
            {index > 0 && (
              <span aria-hidden="true" className="text-ink-faint">
                /
              </span>
            )}
            <span
              className={
                "truncate text-sm " +
                (index === trilha.length - 1
                  ? "font-medium text-ink"
                  : "text-ink-muted")
              }
            >
              {parte}
            </span>
          </span>
        ))}
      </nav>

      <NotificationsBell lembretes={lembretes} />
    </div>
  );
}
