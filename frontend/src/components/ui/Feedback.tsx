import type { ReactNode } from "react";

export function LoadingState({ label = "Carregando..." }: { label?: string }) {
  return (
    <div
      role="status"
      className="flex items-center justify-center gap-3 py-12 text-sm text-ink-muted"
    >
      <span
        aria-hidden="true"
        className="h-4 w-4 animate-spin rounded-pill border-2 border-hairline border-t-ink-muted"
      />
      {label}
    </div>
  );
}

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
      <p className="text-base font-medium text-ink">{title}</p>
      {description && (
        <p className="max-w-[46ch] text-sm font-light text-ink-muted">
          {description}
        </p>
      )}
      {action}
    </div>
  );
}

interface ErrorBannerProps {
  message: string;
  onDismiss?: () => void;
}

export function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  return (
    <div
      role="alert"
      className="flex items-start justify-between gap-3 rounded-sm border border-danger bg-danger-soft px-4 py-3"
    >
      <p className="text-sm text-danger">{message}</p>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Fechar aviso"
          className="shrink-0 text-sm font-medium text-danger hover:opacity-70"
        >
          ×
        </button>
      )}
    </div>
  );
}
