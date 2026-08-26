import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { TopBar } from "./TopBar";
import {
  aoMudarLembretes,
  getUpcomingReminders,
} from "../services/reminderApi";
import {
  aoMudarPreferencias,
  iniciaisDe,
  lerPreferencias,
} from "../services/preferencias";
import type { Reminder } from "../types/entities";
import marcaNexo from "../assets/nexo-symbol.svg";

const ICONS = {
  painel: (
    <>
      <rect x="3" y="3" width="7.5" height="7.5" rx="1.5" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" />
    </>
  ),
  dia: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2.5" />
      <path d="M3 10h18M8 3v4M16 3v4" />
      <path d="M8 15h5" />
    </>
  ),
  metas: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="0.5" />
    </>
  ),
  lembretes: (
    <>
      <path d="M18 9a6 6 0 1 0-12 0c0 5-2 6-2 6h16s-2-1-2-6" />
      <path d="M10.5 19a2 2 0 0 0 3 0" />
    </>
  ),
  relatorios: (
    <>
      <path d="M4 20h16" />
      <path d="M7 20v-6M12 20V6M17 20v-9" />
    </>
  ),
} as const;

const GRUPOS = [
  {
    titulo: "Hoje",
    itens: [
      { to: "/", label: "Painel", icon: ICONS.painel, end: true },
      { to: "/dia", label: "Meu dia", icon: ICONS.dia },
    ],
  },
  {
    titulo: "Acompanhamento",
    itens: [
      { to: "/metas", label: "Metas", icon: ICONS.metas },
      { to: "/lembretes", label: "Lembretes", icon: ICONS.lembretes },
      { to: "/relatorios", label: "Relatórios", icon: ICONS.relatorios },
    ],
  },
];

const TODOS_OS_ITENS = GRUPOS.flatMap((g) => g.itens);

function NavIcon({
  children,
  ativo,
}: {
  children: React.ReactNode;
  ativo: boolean;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"

      className={
        "h-[18px] w-[18px] shrink-0 transition-colors " +
        (ativo ? "text-ink" : "text-ink-faint group-hover:text-ink-muted")
      }
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

function itemClasses(isActive: boolean, recolhido: boolean) {
  return (
    "group flex h-11 items-center rounded-soft text-[15px] transition-colors lg:h-10 " +
    (recolhido ? "justify-center px-0 " : "gap-2.5 px-2.5 ") +
    (isActive
      ? "bg-surface font-medium text-ink shadow-[0_1px_2px_rgba(13,14,16,0.05)]"
      : "text-ink-soft hover:bg-white/60 hover:text-ink")
  );
}

const ARMAZENAMENTO = "planner:menu-recolhido";

export function AppShell() {
  const { pathname } = useLocation();
  const areaRef = useRef<HTMLDivElement>(null);

  const [lembretes, setLembretes] = useState<Reminder[]>([]);

  useEffect(() => {
    let ativo = true;
    const carregar = () => {
      getUpcomingReminders()
        .then((lista) => ativo && setLembretes(lista))
        .catch(() => {});
    };

    carregar();

    const parar = aoMudarLembretes(carregar);

    return () => {
      ativo = false;
      parar();
    };
  }, [pathname]);

  const trilha = (() => {
    for (const grupo of GRUPOS) {
      const item = grupo.itens.find((i) =>
        i.end ? pathname === i.to : pathname.startsWith(i.to),
      );
      if (item) return [grupo.titulo, item.label];
    }

    if (pathname.startsWith("/ajustes")) return ["Conta", "Ajustes"];
    return ["Nexo"];
  })();

  const [recolhido, setRecolhido] = useState(() => {
    try {
      return localStorage.getItem(ARMAZENAMENTO) === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(ARMAZENAMENTO, recolhido ? "1" : "0");
    } catch {}
  }, [recolhido]);

  useEffect(() => {
    window.scrollTo(0, 0);
    areaRef.current?.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-surface lg:h-screen lg:flex-row lg:overflow-hidden">
      <aside
        className={
          "m-3 hidden shrink-0 flex-col rounded-2xl bg-sidebar " +
          "transition-[width] duration-200 lg:flex " +
          (recolhido ? "w-[68px]" : "w-60")
        }
      >
        <span
          className={
            "flex h-[72px] shrink-0 items-center gap-[7px] text-[19px] font-semibold tracking-tight text-ink " +
            (recolhido ? "justify-center" : "px-4")
          }
        >
          <img
            src={marcaNexo}
            alt=""
            aria-hidden="true"
            className="h-9 w-9 shrink-0"
          />
          <span className={recolhido ? "sr-only" : ""}>Nexo</span>
        </span>

        <nav
          aria-label="Navegação principal"
          className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 pt-1"
        >
          {GRUPOS.map((grupo, index) => (
            <div key={grupo.titulo} className="flex flex-col gap-0.5">
              {recolhido ? (
                index > 0 && (
                  <span
                    aria-hidden="true"
                    className="mx-2 mb-1 h-px bg-hairline"
                  />
                )
              ) : (
                <span className="px-2.5 pb-1.5 text-[13px] font-medium text-ink-faint">
                  {grupo.titulo}
                </span>
              )}

              {grupo.itens.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}

                  title={recolhido ? item.label : undefined}
                  className={({ isActive }) => itemClasses(isActive, recolhido)}
                >
                  {({ isActive }) => (
                    <>
                      <NavIcon ativo={isActive}>{item.icon}</NavIcon>
                      <span className={recolhido ? "sr-only" : ""}>
                        {item.label}
                      </span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="shrink-0 p-3 pt-1">
          <button
            type="button"
            onClick={() => setRecolhido((v) => !v)}
            aria-label={recolhido ? "Expandir menu" : "Recolher menu"}
            title={recolhido ? "Expandir menu" : "Recolher menu"}
            aria-expanded={!recolhido}
            className={
              "flex h-11 w-full items-center rounded-soft text-[15px] lg:h-10 " +
              "text-ink-soft transition-colors hover:bg-white/60 hover:text-ink " +
              (recolhido ? "justify-center px-0" : "gap-2.5 px-2.5")
            }
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className={
                "h-[18px] w-[18px] shrink-0 transition-transform duration-200 " +
                (recolhido ? "rotate-180" : "")
              }
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 6l-6 6 6 6" />
            </svg>
            <span className={recolhido ? "sr-only" : ""}>Recolher</span>
          </button>

          <span
            aria-hidden="true"
            className="mx-3 my-[7px] block h-px bg-[#ede8df]"
          />

          <CartaoDePerfil recolhido={recolhido} />

          <BotaoSair recolhido={recolhido} />
        </div>
      </aside>

      <header className="sticky top-0 z-10 shrink-0 border-b border-hairline bg-sidebar lg:hidden">
        <div className="flex h-[68px] items-center gap-4 px-4">
          <span className="flex shrink-0 items-center gap-2 text-base font-semibold tracking-tight text-ink">
            <img
              src={marcaNexo}
              alt=""
              aria-hidden="true"
              className="h-8 w-8"
            />
            Nexo
          </span>

          <nav
            aria-label="Navegação principal"
            className="-mx-2 flex min-w-0 flex-1 items-center gap-1 overflow-x-auto px-2"
          >
            {TODOS_OS_ITENS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  "flex h-11 shrink-0 items-center rounded-pill px-4 text-base transition-colors " +
                  (isActive
                    ? "bg-surface font-medium text-ink"
                    : "text-ink-muted hover:text-ink")
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <div
        ref={areaRef}
        className="min-w-0 flex-1 bg-surface lg:overflow-y-auto"
      >
        <main
          key={pathname}
          className="anim-rise mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-8 lg:px-10"
        >
          <TopBar trilha={trilha} lembretes={lembretes} />
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function CartaoDePerfil({ recolhido }: { recolhido: boolean }) {
  const [perfil, setPerfil] = useState(() => lerPreferencias().perfil);
  useEffect(() => aoMudarPreferencias((p) => setPerfil(p.perfil)), []);

  const nome = perfil.nome.trim() || "Sua conta";

  return (
    <NavLink
      to="/ajustes"
      title={recolhido ? nome : undefined}
      className={
        "flex items-center rounded-soft transition-colors hover:bg-white/60 " +
        (recolhido ? "justify-center px-0 py-2" : "gap-2.5 px-2.5 py-2")
      }
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-pill bg-ink text-xs font-semibold text-white">
        {iniciaisDe(perfil.nome)}
      </span>

      {!recolhido && (
        <>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-medium text-ink">
              {nome}
            </span>
            <span className="text-xs text-ink-faint">Ajustes da conta</span>
          </span>
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="h-3.5 w-3.5 shrink-0 text-ink-faint"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 6l6 6-6 6" />
          </svg>
        </>
      )}
      {recolhido && <span className="sr-only">{nome} - ajustes da conta</span>}
    </NavLink>
  );
}

function BotaoSair({ recolhido }: { recolhido: boolean }) {
  const motivo = "Disponível quando o login existir no servidor";

  return (
    <button
      type="button"
      disabled
      title={motivo}
      className={
        "flex h-11 w-full items-center rounded-soft text-[15px] text-ink-faint lg:h-10 " +
        "transition-colors not-disabled:hover:bg-danger-soft not-disabled:hover:text-danger " +
        (recolhido ? "justify-center px-0" : "gap-2.5 px-2.5")
      }
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-[18px] w-[18px] shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M9 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3M16 17l5-5-5-5M21 12H9" />
      </svg>
      <span className={recolhido ? "sr-only" : ""}>Sair</span>
    </button>
  );
}

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;

  badge?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  action,
  badge,
}: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <h1 className="text-[40px] font-light leading-[1.1] tracking-[-0.02em] text-ink">
            {title}
          </h1>
          {badge}
        </div>
        {description && (
          <p className="max-w-[65ch] text-base font-light text-ink-muted">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
