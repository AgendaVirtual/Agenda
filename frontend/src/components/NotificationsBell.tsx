import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { Reminder } from "../types/entities";
import { addDays, reminderOccurrence, todayISO } from "../utils/date";
import { formatShortDate } from "../utils/date";

const CHAVE_LIDAS = "planner:notificacoes-lidas";

function chaveDaOcorrencia(id: string, dia: string): string {
  return `${id}@${dia}`;
}

function podar(chaves: Iterable<string>, hoje: string): string[] {
  return [...chaves].filter((c) => (c.split("@")[1] ?? "") >= hoje);
}

function lerLidas(): Set<string> {
  try {
    const bruto = localStorage.getItem(CHAVE_LIDAS);
    const lista: unknown = bruto ? JSON.parse(bruto) : [];
    return new Set(
      Array.isArray(lista) ? lista.filter(Boolean).map(String) : [],
    );
  } catch {
    return new Set();
  }
}

interface NotificationsBellProps {
  lembretes: Reminder[];
}

export function NotificationsBell({ lembretes }: NotificationsBellProps) {
  const [aberto, setAberto] = useState(false);
  const [lidas, setLidas] = useState<Set<string>>(lerLidas);
  const caixaRef = useRef<HTMLDivElement>(null);
  const gatilhoRef = useRef<HTMLButtonElement>(null);

  const hoje = todayISO();
  const itens = lembretes
    .map((r) => ({ lembrete: r, dia: reminderOccurrence(r, hoje, 7) }))
    .filter((i): i is { lembrete: Reminder; dia: string } => i.dia !== null)
    .sort((a, b) =>
      a.dia === b.dia
        ? (a.lembrete.time ?? "").localeCompare(b.lembrete.time ?? "")
        : a.dia.localeCompare(b.dia),
    );

  const naoLidas = itens.filter(
    (i) => !lidas.has(chaveDaOcorrencia(i.lembrete.id, i.dia)),
  ).length;

  useEffect(() => {
    if (!aberto) return;

    const foraDaCaixa = (alvo: EventTarget | null) =>
      alvo instanceof Node &&
      !caixaRef.current?.contains(alvo) &&
      !gatilhoRef.current?.contains(alvo);

    const aoClicar = (e: MouseEvent) => {
      if (foraDaCaixa(e.target)) setAberto(false);
    };
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setAberto(false);
        gatilhoRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", aoClicar);
    document.addEventListener("keydown", aoTeclar);
    return () => {
      document.removeEventListener("mousedown", aoClicar);
      document.removeEventListener("keydown", aoTeclar);
    };
  }, [aberto]);

  function marcarTodasLidas() {
    const todas = new Set([
      ...lidas,
      ...itens.map((i) => chaveDaOcorrencia(i.lembrete.id, i.dia)),
    ]);
    setLidas(todas);
    try {
      localStorage.setItem(CHAVE_LIDAS, JSON.stringify(podar(todas, hoje)));
    } catch {
      void 0;
    }
  }

  return (
    <div className="relative flex items-center">
      <button
        ref={gatilhoRef}
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        aria-haspopup="dialog"
        aria-label={
          naoLidas > 0 ? `Notificações: ${naoLidas} não lidas` : "Notificações"
        }
        className="relative flex h-11 w-11 items-center justify-center rounded-soft text-ink transition-colors hover:bg-canvas lg:h-9 lg:w-9"
      >
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="h-[18px] w-[18px]"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 9a6 6 0 1 0-12 0c0 5-2 6-2 6h16s-2-1-2-6" />
          <path d="M10.5 19a2 2 0 0 0 3 0" />
        </svg>

        {naoLidas > 0 && (
          <span
            aria-hidden="true"
            className="tabular absolute top-1.5 right-1.5 flex h-[15px] min-w-[15px] items-center justify-center rounded-pill bg-accent px-1 text-[10px] font-semibold text-white lg:top-0.5 lg:right-0.5"
          >
            {naoLidas > 9 ? "9+" : naoLidas}
          </span>
        )}
      </button>

      {aberto && (
        <div
          ref={caixaRef}
          role="dialog"
          aria-label="Notificações"
          className="absolute top-11 right-0 z-20 w-[340px] rounded-[14px] border border-[#edeae4] bg-surface p-2 shadow-floating"
        >
          <div className="flex items-baseline justify-between px-3 pt-2 pb-1.5">
            <span className="text-[15px] font-semibold text-ink-strong">
              Notificações
            </span>
            <button
              type="button"
              onClick={marcarTodasLidas}
              disabled={naoLidas === 0}
              className="text-[13px] font-medium text-ink-muted transition-colors not-disabled:hover:text-ink disabled:opacity-50"
            >
              Marcar como lidas
            </button>
          </div>

          {itens.length === 0 ? (
            <p className="px-3 py-4 text-sm text-ink-muted">
              Nada nos próximos 7 dias.
            </p>
          ) : (
            <ul className="flex flex-col">
              {itens.slice(0, 6).map(({ lembrete, dia }) => {
                const lida = lidas.has(chaveDaOcorrencia(lembrete.id, dia));
                return (
                  <li key={chaveDaOcorrencia(lembrete.id, dia)}>
                    <Link
                      to="/lembretes"
                      onClick={() => setAberto(false)}
                      className="flex gap-2.5 rounded-soft px-3 py-2.5 transition-colors hover:bg-canvas"
                    >
                      <span
                        aria-hidden="true"
                        className={
                          "mt-1.5 h-[7px] w-[7px] shrink-0 rounded-pill " +
                          (lida ? "bg-transparent" : "bg-accent")
                        }
                      />
                      <span className="flex min-w-0 flex-col gap-px">
                        <span
                          className={
                            "text-sm leading-[1.4] " +
                            (lida ? "text-ink-muted" : "text-ink")
                          }
                        >
                          {lembrete.description}
                        </span>
                        <span className="text-xs text-ink-faint">
                          {rotuloDeQuando(dia, hoje)}
                          {lembrete.time ? ` · ${lembrete.time}` : ""}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}

          <span
            aria-hidden="true"
            className="mx-3 my-1.5 block h-px bg-sidebar"
          />

          <Link
            to="/lembretes"
            onClick={() => setAberto(false)}
            className="flex h-[38px] items-center justify-center rounded-soft text-[13px] font-medium text-ink-muted transition-colors hover:bg-canvas hover:text-ink"
          >
            Ver todos os lembretes
          </Link>
        </div>
      )}
    </div>
  );
}

function rotuloDeQuando(dia: string, hoje: string): string {
  if (dia === hoje) return "Hoje";
  if (dia === addDays(hoje, 1)) return "Amanhã";
  return formatShortDate(dia);
}
