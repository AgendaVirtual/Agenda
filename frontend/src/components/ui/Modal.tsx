import { useEffect, useRef, type ReactNode } from "react";
import { IconButton } from "./Button";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
}: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    ref.current?.querySelector<HTMLElement>("input, select, textarea")?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const previous = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = previous;
    };
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="modal-title"

      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}

      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}

      className="m-auto w-[calc(100%-2rem)] max-w-2xl rounded-card border border-hairline bg-surface p-0 text-ink shadow-[0_16px_48px_rgba(0,0,0,0.2)]"
    >
      <div className="flex max-h-[calc(100vh-6rem)] flex-col">
        <div className="flex items-start justify-between gap-4 border-b border-hairline px-5 py-4">
          <div className="flex flex-col gap-0.5">
            <h2
              id="modal-title"
              className="text-xl font-normal leading-tight text-ink-strong"
            >
              {title}
            </h2>
            {description && (
              <p className="text-[13px] font-light text-ink-muted">
                {description}
              </p>
            )}
          </div>

          <IconButton label="Fechar" onClick={onClose} className="-mr-2">
            <svg
              viewBox="0 0 20 20"
              aria-hidden="true"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            >
              <path d="M5 5l10 10M15 5L5 15" />
            </svg>
          </IconButton>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          {open && children}
        </div>
      </div>
    </dialog>
  );
}
