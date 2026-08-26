import { useState } from "react";
import { Link } from "react-router-dom";
import marcaNexo from "../assets/nexo-symbol.svg";

const PERGUNTAS = [
  {
    pergunta: "O Nexo é grátis?",
    resposta:
      "Sim. Você cria a conta e usa tarefas, metas e lembretes sem pagar nada e sem cartão de crédito.",
  },
  {
    pergunta: "Funciona no celular?",
    resposta:
      "Funciona. O Nexo roda no navegador e se adapta à tela do celular, então dá para planejar o dia no ônibus.",
  },
  {
    pergunta: "Como o Nexo organiza meu dia?",
    resposta:
      "Você anota a tarefa com a hora em que ela começa e, se quiser, a hora em que termina. O turno e o tamanho do bloco saem daí sozinhos, e o Painel monta a linha do tempo do seu dia.",
  },
  {
    pergunta: "Preciso configurar muita coisa para começar?",
    resposta:
      "Não. Crie a conta, escreva a primeira tarefa e pronto. Metas e lembretes você adiciona quando fizer sentido.",
  },
];

export function LandingPage() {
  return (
    <div className="min-h-dvh overflow-x-clip bg-sidebar">
      <BarraDoTopo />
      <Abertura />
      <Vitrine />
      <Conector />
      <NoRitmo />
      <Funcionalidades />
      <Radar />
      <Perguntas />
      <Rodape />
    </div>
  );
}

function Acesse({
  tom = "accent",
  grande = false,
  children = "Acesse",
}: {
  tom?: "accent" | "ink";
  grande?: boolean;
  children?: string;
}) {
  return (
    <Link
      to="/entrar"
      className={
        "inline-flex items-center justify-center rounded-pill font-semibold " +
        "leading-none text-white transition-colors " +
        (grande
          ? "px-7 py-4 text-[17px] "
          : "h-11 px-5 text-[15px] lg:h-auto lg:py-3 ") +
        (tom === "accent"
          ? "bg-accent hover:bg-[#4a5890]"
          : "bg-ink hover:bg-[#2a2c30]")
      }
    >
      {children}
    </Link>
  );
}

function Marca({ tamanho = 34 }: { tamanho?: number }) {
  return (
    <span className="flex items-center gap-2 text-[20px] font-semibold tracking-[-0.01em] text-ink">
      <img src={marcaNexo} alt="" aria-hidden="true" width={tamanho} height={tamanho} />
      Nexo
    </span>
  );
}

function Etiqueta({ children }: { children: string }) {
  return (
    <span className="rounded-pill bg-warm px-4 py-2 text-sm font-medium text-ink-soft">
      {children}
    </span>
  );
}

function Titulo({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="m-0 max-w-[600px] text-[clamp(28px,5.6vw,38px)] leading-[1.2] font-medium tracking-[-0.02em] text-balance">
      {children}
    </h2>
  );
}

function BarraDoTopo() {
  return (
    <nav className="mx-auto flex h-[76px] max-w-[1200px] items-center justify-between px-5 sm:px-8">
      <Marca />

      <div className="flex items-center gap-1 sm:gap-2">
        <a
          href="#funcionalidades"
          className="hidden rounded-pill px-3.5 py-2 text-[15px] font-medium text-ink-soft transition-colors hover:text-ink sm:inline"
        >
          Funcionalidades
        </a>
        <a
          href="#faq"
          className="hidden rounded-pill px-3.5 py-2 text-[15px] font-medium text-ink-soft transition-colors hover:text-ink sm:inline"
        >
          FAQ
        </a>
        <span className="sm:ml-2">
          <Acesse tom="ink" />
        </span>
      </div>
    </nav>
  );
}

function Abertura() {
  return (
    <header className="relative mx-auto flex max-w-[1200px] flex-col items-center px-5 pt-12 text-center sm:px-8 sm:pt-[72px]">
      <Rabisco className="absolute top-[300px] left-[2%] hidden h-[178px] w-[200px] lg:block" />
      <Curva className="absolute top-[340px] right-[4%] hidden h-[118px] w-[104px] lg:block" />

      <h1 className="m-0 max-w-[900px] text-[clamp(34px,7.4vw,62px)] leading-[1.15] font-medium tracking-[-0.025em] text-balance text-ink">
        Um hub para organizar sua vida de{" "}
        <span className="relative inline-block whitespace-nowrap">
          tarefa
          <svg
            viewBox="0 0 240 92"
            fill="none"
            aria-hidden="true"
            className="pointer-events-none absolute top-[-0.42em] left-[-0.58em] h-[calc(100%+0.84em)] w-[calc(100%+1.16em)]"
          >
            <path
              d="M120 9 C192 7 231 27 229 47 C227 71 178 85 116 85 C52 85 11 69 11 45 C11 23 54 11 124 9 C186 8 218 18 224 32"
              pathLength={1}
              stroke="#55649E"
              strokeWidth="5"
              strokeLinecap="round"
              style={{
                strokeDasharray: 1,
                strokeDashoffset: 1,
                animation: "nx-draw 1.3s ease-out 0.4s forwards",
              }}
            />
            <path
              d="M108 12 C48 15 16 28 15 46 C14 66 54 82 118 83 C178 84 222 68 223 48 C224 32 196 16 148 12"
              pathLength={1}
              stroke="#55649E"
              strokeWidth="3"
              strokeLinecap="round"
              opacity="0.5"
              style={{
                strokeDasharray: 1,
                strokeDashoffset: 1,
                animation: "nx-draw 1s ease-out 1.5s forwards",
              }}
            />
          </svg>
        </span>{" "}
        em tarefa
      </h1>

      <p className="mt-6 mb-0 max-w-[620px] text-[clamp(16px,2.4vw,19px)] leading-[1.5] text-pretty text-ink-soft">
        O Nexo reúne tarefas, metas e lembretes num só lugar. Feito para o ritmo
        de quem estuda, estagia e ainda quer tempo livre.
      </p>

      <div className="mt-7 flex flex-wrap justify-center gap-2">
        <Etiqueta>Tarefas do dia</Etiqueta>
        <Etiqueta>Metas</Etiqueta>
        <Etiqueta>Lembretes</Etiqueta>
        <Etiqueta>Relatórios</Etiqueta>
      </div>

      <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
        <Acesse grande />
        <a
          href="#funcionalidades"
          className="rounded-pill px-5 py-3.5 text-base font-medium text-ink-soft transition-colors hover:text-ink"
        >
          Ver funcionalidades →
        </a>
      </div>

      <div className="mt-6 flex w-full items-end justify-between gap-4 lg:hidden">
        <Rabisco className="h-[110px] w-[124px] shrink-0" />
        <Curva className="h-[78px] w-[69px] shrink-0" />
      </div>
    </header>
  );
}

function Rabisco({ className }: { className: string }) {
  return (
    <svg
      viewBox="0 0 200 178"
      fill="none"
      aria-hidden="true"
      className={"-rotate-3 " + className}
    >
      <path
        d="M22 24 C52 18 92 19 104 24 C108 62 107 112 102 138 C72 144 38 143 24 138 C17 100 17 56 22 24 Z"
        stroke="rgba(13,14,16,0.3)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M22 40 C12 38 12 28 22 32 M23 68 C13 66 13 56 23 60 M23 96 C13 94 13 84 23 88 M23 124 C13 122 13 112 23 116"
        stroke="rgba(13,14,16,0.3)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M38 58 C60 54 84 55 96 58 M36 82 C60 78 82 79 94 82 M35 106 C58 102 78 103 90 106"
        stroke="rgba(13,14,16,0.22)"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M76 24 C78 36 78 46 76 54 C72 48 68 48 64 54 C64 42 65 32 66 24"
        stroke="rgba(85,100,158,0.6)"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M178 26 C162 46 145 76 128 106 M192 34 C176 54 158 84 142 114 M178 26 C183 27 188 30 192 34"
        stroke="rgba(13,14,16,0.32)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M185 30 C170 52 152 82 135 110"
        stroke="rgba(13,14,16,0.16)"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M128 106 C132 112 137 114 142 114 M128 106 C126 114 125 122 124 130 M142 114 C136 118 129 124 124 130"
        stroke="rgba(13,14,16,0.32)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M130 120 C128 123 126 127 124 130"
        stroke="rgba(85,100,158,0.75)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M172 36 C178 39 184 43 187 47"
        stroke="rgba(13,14,16,0.32)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M124 130 C112 146 124 154 112 166 C104 174 96 174 92 168"
        stroke="rgba(85,100,158,0.6)"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Curva({ className }: { className: string }) {
  return (
    <svg
      viewBox="0 0 104 118"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M16 8 C66 16 92 48 76 104"
        pathLength={1}
        stroke="rgba(13,14,16,0.35)"
        strokeWidth="2.5"
        strokeLinecap="round"
        style={{
          strokeDasharray: 1,
          strokeDashoffset: 1,
          animation: "nx-draw 1.4s ease-out 1.8s forwards",
        }}
      />
      <path
        d="M60 90 L76 106 L88 84"
        pathLength={1}
        stroke="rgba(13,14,16,0.35)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        style={{
          strokeDasharray: 1,
          strokeDashoffset: 1,
          animation: "nx-draw 0.4s ease-out 3.1s forwards",
        }}
      />
    </svg>
  );
}

function CartaoFlutuante({
  className,
  atraso,
  children,
}: {
  className: string;
  atraso: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={
        "z-2 flex items-center gap-[11px] rounded-[14px] bg-surface py-3 pr-[18px] pl-3 " +
        "shadow-[0_1px_3px_rgba(0,0,0,0.1),0_4px_14px_rgba(0,0,0,0.07)] " +
        className
      }
      style={{ animation: `nx-float ${atraso} ease-in-out infinite` }}
    >
      {children}
    </div>
  );
}

function Vitrine() {
  return (
    <div className="relative mx-auto mt-14 max-w-[1200px] px-5 sm:mt-[72px] sm:px-8">
      <CartaoFlutuante
        className="absolute -top-[30px] right-3 hidden md:flex"
        atraso="6s"
      >
        <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-pill bg-accent">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            style={{
              animation: "nx-bell 4s ease-in-out infinite",
              transformOrigin: "50% 15%",
            }}
          >
            <path d="M18 9a6 6 0 1 0-12 0c0 5-2 6-2 6h16s-2-1-2-6" />
            <path d="M10 19a2 2 0 0 0 4 0" />
          </svg>
        </span>
        <span className="flex flex-col gap-px">
          <span className="text-[13.5px] font-semibold">
            Reunião com o orientador
          </span>
          <span className="text-xs text-ink-faint">Hoje · 14:00</span>
        </span>
      </CartaoFlutuante>

      <CartaoFlutuante
        className="absolute bottom-11 left-2 hidden md:flex"
        atraso="7s"
      >
        <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-pill bg-warm">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#55649E"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            style={{ animation: "nx-check 4s ease-in-out infinite" }}
          >
            <path d="M4 12.5l5 5L20 6.5" />
          </svg>
        </span>
        <span className="flex flex-col gap-px">
          <span className="text-[13.5px] font-semibold text-ink-faint line-through">
            Revisar slides de PLP
          </span>
          <span className="text-xs text-ink-faint">Concluída às 08:12</span>
        </span>
      </CartaoFlutuante>

      <div className="flex overflow-hidden rounded-xl bg-surface shadow-[0_1px_3px_rgba(0,0,0,0.1),0_2px_6px_rgba(0,0,0,0.05)]">
        <LateralDaVitrine />
        <ConteudoDaVitrine />
      </div>
    </div>
  );
}

const ITENS_DA_VITRINE = [
  {
    grupo: "Hoje",
    itens: [
      {
        nome: "Painel",
        ativo: true,
        desenho: (
          <>
            <rect x="3" y="3" width="7.5" height="7.5" rx="1.5" />
            <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" />
            <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" />
            <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" />
          </>
        ),
      },
      {
        nome: "Meu dia",
        ativo: false,
        desenho: (
          <>
            <rect x="3" y="5" width="18" height="16" rx="2.5" />
            <path d="M8 3v4M16 3v4M3 10h18" />
          </>
        ),
      },
    ],
  },
  {
    grupo: "Acompanhamento",
    itens: [
      {
        nome: "Metas",
        ativo: false,
        desenho: (
          <>
            <circle cx="12" cy="12" r="8.5" />
            <circle cx="12" cy="12" r="3.5" />
          </>
        ),
      },
      {
        nome: "Lembretes",
        ativo: false,
        desenho: (
          <>
            <path d="M18 9a6 6 0 1 0-12 0c0 5-2 6-2 6h16s-2-1-2-6" />
            <path d="M10 19a2 2 0 0 0 4 0" />
          </>
        ),
      },
      {
        nome: "Relatórios",
        ativo: false,
        desenho: (
          <>
            <path d="M4 20h16" />
            <path d="M7 20v-6M12 20V6M17 20v-9" />
          </>
        ),
      },
    ],
  },
];

function LateralDaVitrine() {
  return (
    <aside className="m-2.5 hidden w-[216px] shrink-0 flex-col rounded-[14px] bg-sidebar pb-2.5 md:flex">
      <div className="flex h-[60px] items-center gap-[7px] px-4 text-[17px] font-semibold tracking-[-0.01em]">
        <img src={marcaNexo} alt="" aria-hidden="true" width={28} height={28} />
        Nexo
      </div>

      <div className="flex flex-col gap-px px-2">
        {ITENS_DA_VITRINE.map((bloco) => (
          <div key={bloco.grupo} className="flex flex-col gap-px">
            <span className="px-3 pt-3.5 pb-1.5 text-xs font-medium text-ink-faint">
              {bloco.grupo}
            </span>
            {bloco.itens.map((item) => (
              <span
                key={item.nome}
                className={
                  "flex h-[34px] items-center gap-2.5 rounded-[9px] px-3 text-[13.5px] " +
                  (item.ativo
                    ? "bg-surface font-medium text-ink shadow-[0_1px_2px_rgba(13,14,16,0.05)]"
                    : "text-ink-soft")
                }
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={item.ativo ? "#646F79" : "#8B939B"}
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  {item.desenho}
                </svg>
                {item.nome}
              </span>
            ))}
          </div>
        ))}
      </div>
    </aside>
  );
}

const TAREFAS_DA_VITRINE = [
  { texto: "Revisar slides de PLP", quando: "08:00", feita: true },
  { texto: "Responder e-mails do estágio", quando: "14:00", feita: false },
  { texto: "Estudar paradigma funcional", quando: "Tarde", feita: false },
];

const LEMBRETES_DA_VITRINE = [
  { texto: "Reunião com o orientador", quando: "14:00" },
  { texto: "Monitoria de Estruturas de Dados", quando: "16:00" },
  { texto: "Entregar relatório da disciplina", quando: "23:59" },
];

function ConteudoDaVitrine() {
  return (
    <div className="min-w-0 flex-1 px-5 pt-4 pb-5 sm:px-7 sm:pb-7">
      <div className="flex h-9 items-center justify-between">
        <span className="text-xs text-ink-faint">
          Hoje <span className="mx-1 text-hairline">/</span>{" "}
          <span className="text-ink-soft">Painel</span>
        </span>
        <span className="inline-flex h-[26px] w-[26px] items-center justify-center rounded-pill bg-ink text-[10px] font-semibold text-white">
          LF
        </span>
      </div>

      <div className="mt-2 text-[clamp(22px,4vw,30px)] font-light tracking-[-0.02em]">
        Bom dia, Lucas
      </div>

      <div className="mt-4 rounded-[16px] bg-sidebar px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <span className="text-[44px] leading-none font-semibold tracking-[-0.03em]">
              2
            </span>
            <span className="flex flex-col gap-0.5 pt-0.5">
              <span className="text-base font-semibold">
                tarefas para fechar o dia
              </span>
              <span className="text-[13px] text-ink-muted">
                5 de 7 concluídas · melhor que ontem
              </span>
            </span>
          </div>

          <div className="flex gap-6 text-xs text-ink-faint">
            <span className="flex flex-col gap-0.5">
              Metas em andamento
              <span className="text-lg font-semibold text-ink">5</span>
            </span>
            <span className="flex flex-col gap-0.5">
              Lembretes · 7 dias
              <span className="text-lg font-semibold text-ink">8</span>
            </span>
          </div>
        </div>

        <div className="relative mt-6 h-[34px]">
          <span className="absolute inset-x-0 top-2 h-0.5 rounded-sm bg-warm-line" />
          {[6, 18, 34].map((pos) => (
            <span
              key={pos}
              className="absolute top-[5px] h-2 w-2 rounded-pill bg-accent"
              style={{ left: `${pos}%` }}
            />
          ))}
          <span
            className="absolute top-[3px] left-[52%] h-2.5 w-2.5 rounded-pill border-2 border-danger bg-sidebar"
            style={{ animation: "nx-pulse 2.4s ease-out infinite" }}
          />
          <span className="absolute top-0 left-[57%] h-[18px] w-0.5 bg-ink" />
          <span className="absolute top-[3px] left-[70%] h-2.5 w-2.5 rounded-pill border-2 border-dotted border-accent bg-sidebar" />
          <span className="absolute top-[5px] left-[88%] h-2 w-2 rounded-pill bg-[#D8D2C6]" />

          <span className="absolute top-[22px] left-[5%] text-[10px] text-ink-faint">
            07h
          </span>
          <span className="absolute top-[22px] left-[33%] text-[10px] text-ink-faint">
            13h
          </span>
          <span className="absolute top-[22px] left-[55.5%] text-[10px] font-semibold text-ink">
            14:12
          </span>
          <span className="absolute top-[22px] left-[87%] text-[10px] text-ink-faint">
            22h
          </span>
        </div>
      </div>

      <div className="mt-3.5 grid gap-3.5 sm:grid-cols-2">
        <ListaDaVitrine titulo="Tarefas de hoje">
          {TAREFAS_DA_VITRINE.map((linha) => (
            <span key={linha.texto} className="flex justify-between gap-2">
              <span
                className={
                  "min-w-0 truncate " +
                  (linha.feita ? "text-ink-faint line-through" : "")
                }
              >
                {linha.texto}
              </span>
              <span className="shrink-0 text-ink-faint">{linha.quando}</span>
            </span>
          ))}
        </ListaDaVitrine>

        <ListaDaVitrine titulo="Próximos lembretes">
          {LEMBRETES_DA_VITRINE.map((linha) => (
            <span key={linha.texto} className="flex justify-between gap-2">
              <span className="min-w-0 truncate">{linha.texto}</span>
              <span className="shrink-0 text-ink-faint">{linha.quando}</span>
            </span>
          ))}
        </ListaDaVitrine>
      </div>
    </div>
  );
}

function ListaDaVitrine({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[14px] border border-warm-line px-[18px] py-4">
      <div className="mb-2.5 text-[13.5px] font-semibold">{titulo}</div>
      <div className="flex flex-col gap-[9px] text-[13px] text-ink-soft">
        {children}
      </div>
    </div>
  );
}

// O tracejado que liga a vitrine ao resto da pagina.
function Conector() {
  return (
    <div className="mt-12 flex justify-center">
      <svg
        width="120"
        height="92"
        viewBox="0 0 120 92"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M22 4 C92 22 28 52 80 88"
          stroke="#55649E"
          strokeWidth="2"
          strokeDasharray="6 8"
          strokeLinecap="round"
          opacity="0.5"
          style={{ animation: "nx-dash 1.8s linear infinite" }}
        />
      </svg>
    </div>
  );
}

function NoRitmo() {
  return (
    <section className="mx-auto max-w-[1200px] px-5 sm:px-8">
      <div className="flex flex-col items-center gap-4 text-center">
        <Etiqueta>No ritmo do seu dia</Etiqueta>
        <Titulo>Planeje de manhã, confira à noite</Titulo>
      </div>

      <div className="mt-12 grid gap-5 md:grid-cols-2">
        <div className="flex flex-col gap-3 rounded-[32px] bg-warm px-7 py-9 sm:px-8">
          <div className="text-[22px] font-semibold tracking-[-0.01em]">
            O dia avança, o Nexo acompanha
          </div>
          <p className="m-0 text-[15px] leading-[1.55] text-pretty text-ink-muted">
            O marcador de agora se move pela linha do tempo e mostra o que vem
            em seguida, sem você precisar recalcular o dia.
          </p>

          <div className="mt-3 rounded-[14px] bg-surface px-6 py-[22px] shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
            <div className="mb-3.5 flex justify-between text-xs text-ink-faint">
              <span className="font-semibold text-ink">Hoje</span>
              <span>7 tarefas</span>
            </div>
            <div className="relative h-[26px]">
              <span className="absolute inset-x-0 top-[9px] h-0.5 rounded-sm bg-warm-line" />
              {[8, 22, 46].map((pos) => (
                <span
                  key={pos}
                  className="absolute top-1.5 h-2 w-2 rounded-pill bg-accent"
                  style={{ left: `${pos}%` }}
                />
              ))}
              <span className="absolute top-1 left-[74%] h-2.5 w-2.5 rounded-pill border-2 border-dotted border-accent bg-surface" />
              <span className="absolute top-1.5 left-[90%] h-2 w-2 rounded-pill bg-[#D8D2C6]" />
              <span
                className="absolute top-0 h-5 w-0.5 bg-ink"
                style={{
                  animation: "nx-slide 7s ease-in-out infinite alternate",
                }}
              />
            </div>
            <div className="mt-2 flex justify-between text-[11px] text-ink-faint">
              <span>07h</span>
              <span>13h</span>
              <span>18h</span>
              <span>22h</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-[32px] bg-warm px-7 py-9 sm:px-8">
          <div className="text-[22px] font-semibold tracking-[-0.01em]">
            Metas com progresso visível
          </div>
          <p className="m-0 text-[15px] leading-[1.55] text-pretty text-ink-muted">
            Cada tarefa concluída empurra a barra da meta um pouco para a
            frente. Ver o avanço vira parte da rotina.
          </p>

          <div className="mt-3 flex flex-col gap-[18px] rounded-[14px] bg-surface px-6 py-[22px] shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
            <BarraDeMeta
              rotulo="Fechar o semestre com média 8"
              valor="72%"
              cor="var(--color-accent)"
              animacao="nx-fill 6s ease-in-out infinite"
            />
            <BarraDeMeta
              rotulo="Ler 12 artigos da disciplina"
              valor="45%"
              cor="var(--color-accent-2)"
              animacao="nx-fill2 6s ease-in-out 0.6s infinite"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function BarraDeMeta({
  rotulo,
  valor,
  cor,
  animacao,
}: {
  rotulo: string;
  valor: string;
  cor: string;
  animacao: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between gap-3 text-[13px]">
        <span className="font-semibold">{rotulo}</span>
        <span className="shrink-0 text-ink-faint">{valor}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-pill bg-warm">
        <span
          className="block h-full rounded-pill"
          style={{ background: cor, animation: animacao }}
        />
      </div>
    </div>
  );
}

function Funcionalidades() {
  return (
    <section
      id="funcionalidades"
      className="relative mx-auto max-w-[1200px] scroll-mt-6 px-5 pt-24 sm:px-8 sm:pt-[120px]"
    >
      <div className="relative flex flex-col items-center gap-4 text-center">
        <Etiqueta>Funcionalidades</Etiqueta>
        <Titulo>
          Menos abas abertas, mais dias{" "}
          <span className="relative inline-block">
            fechados
            <svg
              viewBox="0 0 200 40"
              preserveAspectRatio="none"
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 -left-1.5 h-6 w-[calc(100%+12px)] -translate-y-1/2"
            >
              <path
                d="M6 26 C50 16 122 24 194 12"
                pathLength={1}
                stroke="#55649E"
                strokeWidth="5"
                strokeLinecap="round"
                fill="none"
                style={{
                  strokeDasharray: 1,
                  strokeDashoffset: 1,
                  animation: "nx-strike 5.5s ease-in-out 0.5s infinite",
                }}
              />
            </svg>
          </span>
        </Titulo>
      </div>

      <div className="mt-12 grid gap-5 md:grid-cols-3">
        <CartaoDeFuncionalidade
          etiqueta="Planeje"
          cor="#55649E"
          titulo="Monte o dia em poucos toques"
          texto="Você diz a que horas a tarefa começa e, se quiser, quando termina. O turno e o tamanho do bloco saem daí sozinhos."
        >
          <div className="w-full max-w-[300px] rounded-t-[14px] bg-surface px-4 pt-4 pb-5 text-left shadow-[0_-2px_14px_rgba(13,14,16,0.08)]">
            <div className="mb-2 flex items-baseline justify-between">
              <span className="text-[13px] font-semibold">Tarefas de hoje</span>
              <span className="text-[11px] text-ink-faint">Planejar o dia</span>
            </div>
            {[
              { h: "07:00", t: "Academia", c: "#4C9E82", ok: true },
              { h: "10:30", t: "Reunião do grupo", c: "#55649E", ok: true },
              { h: "14:00", t: "E-mails do estágio", c: "#F06A6A", ok: false },
            ].map((l) => (
              <div
                key={l.h}
                className="flex items-center gap-2 border-t border-warm py-2"
              >
                <span className="tabular w-[34px] shrink-0 text-[11px] text-ink-faint">
                  {l.h}
                </span>
                <span
                  className={
                    "min-w-0 flex-1 truncate text-[12.5px] " +
                    (l.ok ? "text-ink-faint line-through" : "text-ink")
                  }
                >
                  {l.t}
                </span>
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-pill"
                  style={{ background: l.c }}
                />
                <span
                  className={
                    "shrink-0 rounded-pill px-2 py-[3px] text-[10px] font-semibold " +
                    (l.ok
                      ? "bg-mint-soft text-mint-ink"
                      : "bg-canvas text-ink-muted")
                  }
                >
                  {l.ok ? "Executada" : "Pendente"}
                </span>
              </div>
            ))}
          </div>
        </CartaoDeFuncionalidade>

        <CartaoDeFuncionalidade
          etiqueta="Acompanhe"
          cor="#4C9E82"
          titulo="Metas que avançam com você"
          texto="O Painel soma o que você executou e mostra quanto do dia já foi vencido, sem planilha nenhuma."
        >
          <div className="w-full max-w-[300px] rounded-t-[14px] bg-surface px-[18px] pt-[18px] pb-[22px] text-left shadow-[0_-2px_14px_rgba(13,14,16,0.08)]">
            <div className="mb-3 text-[13px] font-semibold">
              Produtividade de hoje
            </div>
            <div className="text-[34px] leading-none font-semibold tracking-[-0.02em]">
              5{" "}
              <span className="text-[15px] font-normal text-ink-muted">
                de 7
              </span>
            </div>
            <div className="mt-3.5 flex gap-1">
              {[0, 0.3, 0.6, 0.9, 1.2].map((atraso) => (
                <span
                  key={atraso}
                  className="h-6 flex-1 rounded-md bg-accent"
                  style={{
                    animation: `nx-seg 6s ease-in-out ${atraso}s infinite`,
                  }}
                />
              ))}
              <span className="h-6 flex-1 rounded-md bg-warm" />
              <span className="h-6 flex-1 rounded-md bg-warm" />
            </div>
            <div className="mt-2.5 text-[11.5px] text-ink-faint">
              tarefas executadas · 71% do dia
            </div>
          </div>
        </CartaoDeFuncionalidade>

        <CartaoDeFuncionalidade
          etiqueta="Lembre"
          cor="#E8A13C"
          titulo="Avisos antes do prazo, não depois"
          texto="Você escolhe com quanta antecedência quer ser avisado. O aviso chega na hora certa e some quando você resolve."
        >
          <div className="flex w-full max-w-[300px] flex-col gap-2 pb-[22px]">
            <div className="flex items-baseline justify-between px-0.5 pb-0.5">
              <span className="text-[13px] font-semibold">
                Próximos lembretes
              </span>
              <span className="text-[11px] text-ink-faint">Ver todos</span>
            </div>
            {[
              { t: "Entregar relatório da disciplina", c: "#F06A6A", d: "0s" },
              { t: "Monitoria de Estruturas", c: "#55649E", d: "0.5s" },
              { t: "Matrícula do próximo período", c: "#E8A13C", d: "1s" },
            ].map((l) => (
              <div
                key={l.t}
                className="flex items-center gap-2.5 rounded-xl bg-surface px-3.5 py-[11px] text-left shadow-[0_1px_3px_rgba(13,14,16,0.08)]"
                style={{
                  animation: `nx-slidein 6s ease-in-out ${l.d} infinite`,
                }}
              >
                <span
                  className="h-[7px] w-[7px] shrink-0 rounded-pill"
                  style={{ background: l.c }}
                />
                <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium">
                  {l.t}
                </span>
              </div>
            ))}
          </div>
        </CartaoDeFuncionalidade>
      </div>
    </section>
  );
}

function CartaoDeFuncionalidade({
  etiqueta,
  cor,
  titulo,
  texto,
  children,
}: {
  etiqueta: string;
  cor: string;
  titulo: string;
  texto: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[430px] flex-col items-center gap-3 overflow-hidden rounded-[32px] bg-warm px-7 pt-11 text-center">
      <span className="text-sm font-semibold" style={{ color: cor }}>
        {etiqueta}
      </span>
      <div className="max-w-[250px] text-[24px] leading-[1.25] font-semibold tracking-[-0.015em]">
        {titulo}
      </div>
      <p className="m-0 max-w-[250px] text-sm leading-[1.5] text-pretty text-ink-muted">
        {texto}
      </p>
      <div className="mt-auto flex w-full justify-center">{children}</div>
    </div>
  );
}

function Radar() {
  return (
    <section
      className="mt-24 px-5 py-20 sm:mt-[120px] sm:px-8 sm:py-24"
      style={{
        backgroundImage:
          "linear-gradient(rgba(85,100,158,0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(85,100,158,0.055) 1px, transparent 1px)",
        backgroundSize: "44px 44px",
      }}
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <Etiqueta>Rotina mapeada</Etiqueta>
        <Titulo>O Nexo rastreia sua rotina como um radar</Titulo>
        <p className="m-0 max-w-[560px] text-[17px] leading-[1.5] text-pretty text-ink-soft">
          Aulas, estágio, treino e descanso no mesmo mapa. Você enxerga o dia
          inteiro de uma vez e nada passa despercebido.
        </p>
      </div>

      <div className="relative mx-auto mt-16 aspect-square w-full max-w-[520px]">
        <span className="absolute inset-0 rounded-full border-[1.5px] border-dashed border-[rgba(85,100,158,0.38)]" />
        <span className="absolute inset-[14%] rounded-full border-[1.5px] border-dashed border-[rgba(85,100,158,0.28)]" />
        <span className="absolute inset-[28%] rounded-full border-[1.5px] border-dashed border-[rgba(85,100,158,0.2)]" />

        <span className="absolute inset-0 overflow-hidden rounded-full">
          <span
            className="absolute inset-0"
            style={{
              background:
                "conic-gradient(from 0deg, rgba(85,100,158,0.2), rgba(85,100,158,0) 85deg)",
              animation: "nx-spin 7s linear infinite",
            }}
          />
        </span>

        <span className="absolute top-1/2 left-1/2 flex h-[88px] w-[88px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[24px] bg-ink shadow-[0_10px_30px_rgba(13,14,16,0.25)]">
          <img
            src={marcaNexo}
            alt=""
            aria-hidden="true"
            width={46}
            height={46}
            className="invert"
          />
        </span>

        {[
          { left: "24%", top: "30%", tam: 10, cor: "#55649E", atraso: "0s" },
          { left: "72%", top: "64%", tam: 10, cor: "#55649E", atraso: "1.4s" },
          { left: "58%", top: "16%", tam: 8, cor: "#F06A6A", atraso: "2.4s" },
        ].map((b) => (
          <span
            key={b.atraso}
            className="absolute rounded-pill"
            style={{
              left: b.left,
              top: b.top,
              width: b.tam,
              height: b.tam,
              background: b.cor,
              animation: `nx-blip 4s ease-in-out ${b.atraso} infinite`,
            }}
          />
        ))}

        {PINOS.map((pino) => (
          <PinDoRadar
            key={pino.titulo}
            className={"absolute hidden lg:flex " + pino.posicao}
            {...pino}
          />
        ))}

        <Recado className="absolute -right-10 bottom-[13%] hidden max-w-[220px] lg:block" />
      </div>

      <div className="mx-auto mt-8 flex max-w-[380px] flex-col gap-2.5 lg:hidden">
        {PINOS.map((pino) => (
          <PinDoRadar key={pino.titulo} className="flex" {...pino} />
        ))}
        <Recado className="mt-1" />
      </div>

      <div className="mt-16 flex justify-center">
        <Acesse tom="ink" grande>
          Começar a mapear meu dia
        </Acesse>
      </div>
    </section>
  );
}

const PINOS = [
  {
    posicao: "top-[18%] -left-14",
    cor: "#4C9E82",
    titulo: "Academia",
    detalhe: "07:00 · Saúde",
    atraso: "6s",
  },
  {
    posicao: "top-[33%] -right-20",
    cor: "#F06A6A",
    titulo: "Prova de Cálculo II",
    detalhe: "sex · 10:00 · Faculdade",
    atraso: "7s",
  },
  {
    posicao: "bottom-[23%] -left-[72px]",
    cor: "#E8A13C",
    titulo: "Plantão do estágio",
    detalhe: "14:00 · Trabalho",
    atraso: "8s",
  },
];

function PinDoRadar({
  className,
  cor,
  titulo,
  detalhe,
  atraso,
}: {
  className: string;
  cor: string;
  titulo: string;
  detalhe: string;
  atraso: string;
  posicao?: string;
}) {
  return (
    <div
      className={
        "items-center gap-2.5 rounded-xl bg-surface py-2.5 pr-4 pl-3 " +
        "shadow-[0_1px_3px_rgba(0,0,0,0.1),0_4px_14px_rgba(0,0,0,0.07)] " +
        className
      }
      style={{ animation: `nx-float ${atraso} ease-in-out infinite` }}
    >
      <span
        className="h-2 w-2 shrink-0 rounded-pill"
        style={{ background: cor }}
      />
      <span className="flex flex-col gap-px">
        <span className="text-[13px] font-semibold">{titulo}</span>
        <span className="text-[11.5px] text-ink-faint">{detalhe}</span>
      </span>
    </div>
  );
}

function Recado({ className = "" }: { className?: string }) {
  return (
    <div
      className={
        "rounded-[11px] bg-ink px-4 py-2.5 text-[12.5px] leading-[1.4] text-white " +
        "shadow-[0_6px_18px_rgba(13,14,16,0.22)] " +
        className
      }
      style={{ animation: "nx-float 7s ease-in-out 2.2s infinite" }}
    >
      Reunião de alinhamento entrou na sua rotina de quinta.
    </div>
  );
}

function Perguntas() {
  const [aberta, setAberta] = useState(0);

  return (
    <section
      id="faq"
      className="mx-auto max-w-[760px] scroll-mt-6 px-5 pt-24 pb-20 sm:px-8 sm:pt-[120px]"
    >
      <h2 className="mt-0 mb-10 text-center text-[clamp(28px,5.6vw,38px)] font-medium tracking-[-0.02em]">
        Perguntas frequentes
      </h2>

      <div className="flex flex-col border-b border-warm-line">
        {PERGUNTAS.map((item, indice) => {
          const abertaAqui = aberta === indice;
          return (
            <div key={item.pergunta} className="border-t border-warm-line">
              <h3 className="m-0">
                <button
                  type="button"
                  aria-expanded={abertaAqui}
                  onClick={() => setAberta(abertaAqui ? -1 : indice)}
                  className="flex w-full items-center justify-between gap-4 px-1 py-[22px] text-left"
                >
                  <span className="text-[17px] font-semibold">
                    {item.pergunta}
                  </span>
                  <span
                    aria-hidden="true"
                    className="shrink-0 text-xl leading-none text-ink-faint"
                  >
                    {abertaAqui ? "−" : "+"}
                  </span>
                </button>
              </h3>

              {abertaAqui && (
                <p className="m-0 max-w-[600px] px-1 pb-[22px] text-[15px] leading-[1.55] text-ink-soft">
                  {item.resposta}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-14 flex justify-center">
        <Acesse grande />
      </div>
    </section>
  );
}

function Rodape() {
  return (
    <footer className="border-t border-warm-line">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-3 px-5 py-7 sm:px-8">
        <span className="flex items-center gap-[7px] text-[15px] font-semibold">
          <img src={marcaNexo} alt="" aria-hidden="true" width={22} height={22} />
          Nexo
        </span>
        <span className="text-[13px] text-ink-faint">
          © 2026 Nexo · feito para dias mais leves
        </span>
      </div>
    </footer>
  );
}
