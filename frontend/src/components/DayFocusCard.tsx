import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Category, Task } from "../types/entities";
import { Shift, TaskStatus } from "../types/enums";
import type { FaixasDeTurno } from "../services/preferencias";
import { plural } from "../utils/labels";
import { janelaDaTarefa } from "../utils/tempo";

const INICIO = 6.5;
const FIM = 23.5;
const HORAS_DA_REGUA = [7, 10, 13, 16, 19, 22];

const LARGURA_ROTULO = 150;

interface DayFocusCardProps {
  tasks: Task[];
  categoriesById: Map<string, Category>;
  turnos: FaixasDeTurno;
  metasEmAndamento: number;
  lembretes: number;

  concluidasOntem: number | null;
}

export function DayFocusCard({
  tasks,
  categoriesById,
  turnos,
  metasEmAndamento,
  lembretes,
  concluidasOntem,
}: DayFocusCardProps) {
  const agora = useAgora();

  const concluidas = tasks.filter(
    (t) => t.status === TaskStatus.EXECUTADA,
  ).length;
  const pendentes = tasks.filter((t) => t.status === TaskStatus.PENDENTE);

  const marcadores = tasks
    .map((t) => ({ task: t, hora: horaDaTarefa(t, turnos) }))
    .filter((m): m is { task: Task; hora: number } => m.hora !== null)
    .sort((a, b) => a.hora - b.hora);

  const proxima =
    marcadores.find(
      (m) => m.task.status === TaskStatus.PENDENTE && m.hora >= agora,
    ) ?? null;

  return (
    <section className="mb-9 rounded-[20px] bg-sidebar px-10 pt-8 pb-[26px]">
      <div className="flex flex-wrap items-start justify-between gap-x-10 gap-y-6">
        <div className="flex items-start gap-5">
          <span className="tabular text-[76px] leading-[0.82] font-semibold tracking-[-0.045em] text-ink">
            {pendentes.length}
          </span>
          <div className="flex flex-col gap-[5px] pt-1">
            <span className="text-xl leading-tight font-semibold tracking-[-0.015em] text-ink">
              {plural(
                pendentes.length,
                "tarefa para fechar o dia",
                "tarefas para fechar o dia",
              )}
            </span>
            <span className="text-sm text-ink-muted">
              {concluidas} de {tasks.length} concluídas
              {comparativoComOntem(concluidas, concluidasOntem)}
            </span>
            <span className="text-sm text-ink-muted">
              {proxima ? (
                <>
                  A próxima é{" "}
                  <span className="font-medium text-ink-soft">
                    {proxima.task.description}
                  </span>
                  {proxima.task.time ? `, às ${proxima.task.time}.` : "."}
                </>
              ) : pendentes.length > 0 ? (
                "As pendentes não têm horário à frente de agora."
              ) : (
                "Nada mais na agenda de hoje."
              )}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
          <MiniNumero rotulo="Metas em andamento" valor={metasEmAndamento} />
          <MiniNumero rotulo="Lembretes · 7 dias" valor={lembretes} />
          <Link
            to="/metas"
            className="flex h-11 items-center gap-1.5 rounded-soft px-3 text-sm font-medium text-ink-soft transition-colors hover:bg-white/70 hover:text-ink lg:h-10"
          >
            Retomar metas
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="h-[15px] w-[15px]"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
        </div>
      </div>

      <DayLine
        marcadores={marcadores}
        categoriesById={categoriesById}
        agora={agora}
      />
    </section>
  );
}

function MiniNumero({ rotulo, valor }: { rotulo: string; valor: number }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[12.5px] text-ink-faint">{rotulo}</span>
      <span className="tabular text-[17px] font-semibold text-ink-soft">
        {valor}
      </span>
    </div>
  );
}

interface DayLineProps {
  marcadores: { task: Task; hora: number }[];
  categoriesById: Map<string, Category>;
  agora: number;
}

function DayLine({ marcadores, categoriesById, agora }: DayLineProps) {
  if (marcadores.length === 0) return null;

  const pct = (hora: number) =>
    ((Math.min(Math.max(hora, INICIO), FIM) - INICIO) / (FIM - INICIO)) * 100;

  const agoraVisivel = agora >= INICIO && agora <= FIM;
  const agoraPct = pct(agora);

  const pendentes = marcadores.filter(
    (m) => m.task.status === TaskStatus.PENDENTE,
  );
  const alinhamentos = resolverColisoes(pendentes.map((m) => pct(m.hora)));

  return (
    <div className="mt-[26px]">
      <div className="relative hidden h-9 overflow-hidden lg:block">
        {pendentes.map((m, i) => {
          const alinhamento = alinhamentos[i];
          return (
            <div
              key={m.task.id}
              className={
                "absolute bottom-0 w-[150px] " +
                (alinhamento === "esquerda"
                  ? "translate-x-[calc(-100%+8px)] text-right"
                  : alinhamento === "direita"
                    ? "-translate-x-2 text-left"
                    : "-translate-x-1/2 text-center")
              }
              style={{ left: `${pct(m.hora)}%` }}
            >
              <p className="truncate text-[13px] leading-[1.3] font-medium text-ink-strong">
                {m.task.description}
              </p>
              <p className="text-xs leading-[1.4] text-ink-faint">
                {janelaDaTarefa(m.task) ??
                  `${rotuloDeTurno(m.task.shift)} · sem hora`}
              </p>
            </div>
          );
        })}
      </div>

      <div className="relative mt-2.5 h-4 overflow-hidden">
        <div className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 rounded-pill bg-[#ebe5da]" />
        <div
          className="anim-grow absolute left-0 top-1/2 h-[3px] -translate-y-1/2 rounded-pill bg-[#d5cec0]"
          style={{
            width: `${agoraVisivel ? agoraPct : agora > FIM ? 100 : 0}%`,
          }}
        />

        {marcadores.map((m) => {
          const concluida = m.task.status === TaskStatus.EXECUTADA;
          const cor = categoriesById.get(m.task.categoryId)?.color;

          if (concluida) {
            return (
              <span
                key={m.task.id}
                title={`Concluída: ${m.task.description}`}
                className="absolute top-1/2 h-[9px] w-[9px] -translate-x-1/2 -translate-y-1/2 rounded-pill bg-accent"
                style={{ left: `${pct(m.hora)}%` }}
              />
            );
          }

          return (
            <span
              key={m.task.id}
              title={m.task.description}
              className="absolute top-1/2 flex h-[15px] w-[15px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-pill bg-sidebar"
              style={{ left: `${pct(m.hora)}%` }}
            >
              <span
                className={
                  "box-border h-[13px] w-[13px] rounded-pill border-2 bg-sidebar " +
                  (m.task.time ? "border-solid" : "border-dotted")
                }
                style={{ borderColor: cor ?? "var(--color-hairline-strong)" }}
              />
            </span>
          );
        })}

        {agoraVisivel && (
          <span
            aria-hidden="true"
            className="absolute top-1/2 h-[26px] w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-pill bg-accent"
            style={{ left: `${agoraPct}%` }}
          />
        )}
      </div>

      <div className="relative mt-2.5 h-4 overflow-hidden">
        {HORAS_DA_REGUA.filter(
          // A hora cheia sai de cena quando o marcador de agora cai em cima
          // dela: em telas estreitas os dois se sobrepunham.
          (h) => !agoraVisivel || Math.abs(h - agora) > 1.6,
        ).map((h) => (
          <span
            key={h}
            className="tabular absolute -translate-x-1/2 text-[11px] text-ink-faint"
            style={{ left: `${pct(h)}%` }}
          >
            {String(h).padStart(2, "0")}h
          </span>
        ))}
        {agoraVisivel && (
          <span
            className="tabular absolute -translate-x-1/2 bg-sidebar px-1 text-[11px] font-semibold text-accent"
            style={{ left: `${agoraPct}%` }}
          >
            {formatarHora(agora)}
          </span>
        )}
      </div>
    </div>
  );
}

function useAgora(): number {
  const ler = () => {
    const d = new Date();
    return d.getHours() + d.getMinutes() / 60;
  };
  const [agora, setAgora] = useState(ler);

  useEffect(() => {
    const id = setInterval(() => setAgora(ler()), 30_000);
    return () => clearInterval(id);
  }, []);

  return agora;
}

function horaDaTarefa(task: Task, turnos: FaixasDeTurno): number | null {
  if (task.time) {
    const [h, m] = task.time.split(":").map(Number);
    return h + (m || 0) / 60;
  }

  switch (task.shift) {
    case Shift.MANHA:
      return (INICIO + turnos.tarde) / 2;
    case Shift.TARDE:
      return (turnos.tarde + turnos.noite) / 2;
    case Shift.NOITE:
      return (turnos.noite + FIM) / 2;
    default:
      return null;
  }
}

function comparativoComOntem(hoje: number, ontem: number | null): string {
  if (ontem === null) return "";
  if (hoje > ontem) return " · melhor que ontem";
  if (hoje < ontem) return ` · ontem foram ${ontem}`;
  return " · mesmo ritmo de ontem";
}

function rotuloDeTurno(shift?: Shift): string {
  if (shift === Shift.MANHA) return "Manhã";
  if (shift === Shift.TARDE) return "Tarde";
  if (shift === Shift.NOITE) return "Noite";
  return "Sem turno";
}

function formatarHora(hora: number): string {
  const h = Math.floor(hora);
  const m = Math.round((hora - h) * 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

type Alinhamento = "centro" | "esquerda" | "direita";

function resolverColisoes(posicoes: number[]): Alinhamento[] {
  const LIMIAR = (LARGURA_ROTULO / 1000) * 100;
  const saida: Alinhamento[] = posicoes.map(() => "centro");

  for (let i = 0; i < posicoes.length - 1; i++) {
    if (posicoes[i + 1] - posicoes[i] < LIMIAR) {
      if (saida[i] === "centro") saida[i] = "esquerda";
      saida[i + 1] = "direita";
    }
  }

  return saida;
}
