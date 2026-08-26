export interface FaixasDeTurno {
  tarde: number;

  noite: number;
}

export interface Preferencias {
  turnos: FaixasDeTurno;
  menuRecolhido: boolean;
}

const CHAVE = "nexo:preferencias";

export const PADRAO: Preferencias = {
  turnos: { tarde: 12, noite: 18 },
  menuRecolhido: false,
};

type Ouvinte = (p: Preferencias) => void;
const ouvintes = new Set<Ouvinte>();

let cache: Preferencias | null = null;

function normalizar(bruto: unknown): Preferencias {
  const obj = (bruto ?? {}) as Partial<Preferencias>;
  const turnos = obj.turnos ?? PADRAO.turnos;

  const tarde = limitarHora(turnos.tarde, PADRAO.turnos.tarde);
  const noite = limitarHora(turnos.noite, PADRAO.turnos.noite);

  return {
    turnos: noite > tarde ? { tarde, noite } : PADRAO.turnos,
    menuRecolhido: obj.menuRecolhido === true,
  };
}

function limitarHora(valor: unknown, padrao: number): number {
  const n = Number(valor);
  if (!Number.isInteger(n) || n < 1 || n > 23) return padrao;
  return n;
}

export function lerPreferencias(): Preferencias {
  if (cache) return cache;
  try {
    const bruto = localStorage.getItem(CHAVE);
    cache = normalizar(bruto ? JSON.parse(bruto) : null);
  } catch {
    cache = PADRAO;
  }
  return cache;
}

export function salvarPreferencias(
  parcial: Partial<Preferencias>,
): Preferencias {
  const atual = lerPreferencias();
  const novo = normalizar({ ...atual, ...parcial });
  cache = novo;

  try {
    localStorage.setItem(CHAVE, JSON.stringify(novo));
  } catch {}

  for (const ouvinte of ouvintes) ouvinte(novo);
  return novo;
}

export function aoMudarPreferencias(ouvinte: Ouvinte): () => void {
  ouvintes.add(ouvinte);
  return () => {
    ouvintes.delete(ouvinte);
  };
}

export function iniciaisDe(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  if (partes.length === 1) return partes[0].slice(0, 1).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}
