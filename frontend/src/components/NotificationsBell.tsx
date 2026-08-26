import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { Reminder, Task } from "../types/entities";
import { TaskStatus } from "../types/enums";
import {
  addDays,
  formatShortDate,
  reminderOccurrence,
  todayISO,
} from "../utils/date";
import { inicioDoAviso, janelaDaTarefa } from "../utils/tempo";

interface Aviso {
  chave: string;
  dia: string;
  descricao: string;
  hora: string | null;
  origem: "lembrete" | "tarefa";
}

// Uma tarefa so entra no sino depois que a antecedencia escolhida chega.
function avisosDeTarefas(tarefas: Task[], hoje: string, agora: Date): Aviso[] {
  const limite = addDays(hoje, 7);

  return tarefas
    .filter(
      (t) =>
        t.alertEnabled === true &&
        t.status === TaskStatus.PENDENTE &&
        t.date >= hoje &&
        t.date <= limite,
    )
    .filter((t) => {
      const abertura = inicioDoAviso(t);
      return abertura !== null && agora >= abertura;
    })
    .map((t) => ({
      chave: chaveDaOcorrencia(t.id, t.date),
      dia: t.date,
      descricao: t.description,
      hora: janelaDaTarefa(t),
      origem: "tarefa" as const,
    }));
}

function avisosDeLembretes(lembretes: Reminder[], hoje: string): Aviso[] {
  return lembretes
    .map((r) => ({ lembrete: r, dia: reminderOccurrence(r, hoje, 7) }))
    .filter((i): i is { lembrete: Reminder; dia: string } => i.dia !== null)
    .map(({ lembrete, dia }) => ({
      chave: chaveDaOcorrencia(lembrete.id, dia),
      dia,
      descricao: lembrete.description,
      hora: lembrete.time ?? null,
      origem: "lembrete" as const,
    }));
}

const CHAVE_LIDAS = "nexo:notificacoes-lidas";
const CHAVE_DISPENSADAS = "nexo:notificacoes-dispensadas";

function chaveDaOcorrencia(id: string, dia: string): string {
  return `${id}@${dia}`;
}

function podar(chaves: Iterable<string>, hoje: string): string[] {
  return [...chaves].filter((c) => (c.split("@")[1] ?? "") >= hoje);
}

function ler(chave: string): Set<string> {
  try {
    const bruto = localStorage.getItem(chave);
    const lista: unknown = bruto ? JSON.parse(bruto) : [];
    return new Set(
      Array.isArray(lista) ? lista.filter(Boolean).map(String) : [],
    );
  } catch {
    return new Set();
  }
}

function gravar(chave: string, valores: Set<string>, hoje: string): void {
  try {
    localStorage.setItem(chave, JSON.stringify(podar(valores, hoje)));
  } catch {
    void 0;
  }
}

interface NotificationsBellProps {
  lembretes: Reminder[];
  tarefas: Task[];
}

export function NotificationsBell({
  lembretes,
  tarefas,
}: NotificationsBellProps) {
  const [aberto, setAberto] = useState(false);
  const [lidas, setLidas] = useState<Set<string>>(() => ler(CHAVE_LIDAS));
  const [dispensadas, setDispensadas] = useState<Set<string>>(() =>
    ler(CHAVE_DISPENSADAS),
  );
  const [agora, setAgora] = useState(() => new Date());
  const caixaRef = useRef<HTMLDivElement>(null);
  const gatilhoRef = useRef<HTMLButtonElement>(null);

  const hoje = todayISO();

  const itens = [
    ...avisosDeTarefas(tarefas, hoje, agora),
    ...avisosDeLembretes(lembretes, hoje),
  ]
    .filter((i) => !dispensadas.has(i.chave))
    .sort((a, b) =>
      a.dia === b.dia
        ? (a.hora ?? "").localeCompare(b.hora ?? "")
        : a.dia.localeCompare(b.dia),
    );

  const naoLidas = itens.filter((i) => !lidas.has(i.chave)).length;

  useEffect(() => {
    const relogio = setInterval(() => setAgora(new Date()), 60_000);
    return () => clearInterval(relogio);
  }, []);

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

  function alternarLida(chave: string) {
    const proximas = new Set(lidas);
    if (proximas.has(chave)) proximas.delete(chave);
    else proximas.add(chave);

    setLidas(proximas);
    gravar(CHAVE_LIDAS, proximas, hoje);
  }

  function marcarTodasLidas() {
    const proximas = new Set([...lidas, ...itens.map((i) => i.chave)]);
    setLidas(proximas);
    gravar(CHAVE_LIDAS, proximas, hoje);
  }

  function dispensar(chave: string) {
    const proximas = new Set(dispensadas).add(chave);
    setDispensadas(proximas);
    gravar(CHAVE_DISPENSADAS, proximas, hoje);
  }

  function limparTudo() {
    const proximas = new Set([...dispensadas, ...itens.map((i) => i.chave)]);
    setDispensadas(proximas);
    gravar(CHAVE_DISPENSADAS, proximas, hoje);
  }

  function trazerDeVolta() {
    setDispensadas(new Set());
    gravar(CHAVE_DISPENSADAS, new Set(), hoje);
  }

  const escondidas = dispensadas.size > 0;

  return (
    <div className="relative flex items-center">
      <button
        ref={gatilhoRef}
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        aria-haspopup="dialog"
        aria-label={
          naoLidas > 0 ? `Notificações: ${naoLidas} sem ler` : "Notificações"
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
          className="absolute top-11 right-0 z-20 w-[360px] rounded-[14px] border border-[#edeae4] bg-surface p-2 shadow-floating"
        >
          <div className="flex items-baseline justify-between gap-3 px-3 pt-2 pb-1.5">
            <span className="text-[15px] font-semibold text-ink-strong">
              Notificações
            </span>
            {naoLidas > 0 && (
              <button
                type="button"
                onClick={marcarTodasLidas}
                className="-my-2 py-2 text-[13px] font-medium text-ink-muted transition-colors hover:text-ink"
              >
                Marcar todas como lidas
              </button>
            )}
          </div>

          {itens.length === 0 ? (
            <div className="px-3 py-5 text-center">
              <p className="text-sm text-ink-muted">
                {escondidas
                  ? "Você limpou tudo por aqui."
                  : "Nada nos próximos 7 dias."}
              </p>
              {escondidas && (
                <button
                  type="button"
                  onClick={trazerDeVolta}
                  className="-my-1 py-3 text-[13px] font-medium text-accent underline underline-offset-4"
                >
                  Trazer de volta
                </button>
              )}
            </div>
          ) : (
            <ul className="flex max-h-[340px] flex-col overflow-y-auto">
              {itens.map(({ descricao, hora, dia, chave, origem }) => {
                const lida = lidas.has(chave);
                return (
                  <li key={chave} className="group flex items-start gap-1">
                    <button
                      type="button"
                      onClick={() => alternarLida(chave)}
                      aria-pressed={lida}
                      title={
                        lida ? "Marcar como não lida" : "Marcar como lida"
                      }
                      className="flex min-w-0 flex-1 gap-2.5 rounded-soft px-3 py-2.5 text-left transition-colors hover:bg-canvas"
                    >
                      <span
                        aria-hidden="true"
                        className={
                          "mt-1.5 h-[7px] w-[7px] shrink-0 rounded-pill " +
                          (lida
                            ? "border border-hairline-strong bg-transparent"
                            : "bg-accent")
                        }
                      />
                      <span className="flex min-w-0 flex-col gap-px">
                        <span
                          className={
                            "text-sm leading-[1.4] " +
                            (lida ? "text-ink-muted" : "text-ink")
                          }
                        >
                          {descricao}
                        </span>
                        <span className="text-xs text-ink-faint">
                          {origem === "tarefa" ? "Tarefa · " : ""}
                          {rotuloDeQuando(dia, hoje)}
                          {hora ? ` · ${hora}` : ""}
                          {lida ? " · lida" : ""}
                        </span>
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => dispensar(chave)}
                      aria-label={`Dispensar: ${descricao}`}
                      title="Dispensar"
                      className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-soft text-ink-faint transition-colors hover:bg-canvas hover:text-ink lg:h-9 lg:w-9 lg:opacity-0 lg:group-hover:opacity-100 lg:focus:opacity-100"
                    >
                      <svg
                        viewBox="0 0 20 20"
                        aria-hidden="true"
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                      >
                        <path d="M5 5l10 10M15 5L5 15" />
                      </svg>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <span
            aria-hidden="true"
            className="mx-3 my-1.5 block h-px bg-sidebar"
          />

          <div className="flex items-center justify-between gap-2 px-1">
            <Link
              to="/lembretes"
              onClick={() => setAberto(false)}
              className="flex h-[38px] flex-1 items-center justify-center rounded-soft text-[13px] font-medium text-ink-muted transition-colors hover:bg-canvas hover:text-ink"
            >
              Ver todos os lembretes
            </Link>

            {itens.length > 0 && (
              <button
                type="button"
                onClick={limparTudo}
                className="flex h-[38px] items-center rounded-soft px-3 text-[13px] font-medium text-ink-muted transition-colors hover:bg-danger-soft hover:text-danger"
              >
                Limpar
              </button>
            )}
          </div>

          <p className="px-3 pt-1 pb-1 text-[11px] leading-snug text-ink-faint">
            Limpar esconde o aviso, mas não apaga a tarefa nem o lembrete.
          </p>
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
