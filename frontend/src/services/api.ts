import type { ApiResponse } from "../types/entities";

const BASE_URL = import.meta.env.VITE_API_URL ?? "/api";

export class ErroDeApi extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ErroDeApi";
    this.status = status;
  }
}

type AoPerderSessao = () => void;
const ouvintesDeSessao = new Set<AoPerderSessao>();

export function aoPerderSessao(ouvinte: AoPerderSessao): () => void {
  ouvintesDeSessao.add(ouvinte);
  return () => {
    ouvintesDeSessao.delete(ouvinte);
  };
}

function avisarPerdaDeSessao(path: string, status: number): void {
  if (status !== 401) return;
  if (path.startsWith("/auth/")) return;

  for (const ouvinte of ouvintesDeSessao) ouvinte();
}

export async function request<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  let res: Response;

  try {
    res = await fetch(`${BASE_URL}${path}`, {
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      ...options,
    });
  } catch {
    throw new ErroDeApi(
      "Não foi possível falar com o servidor. Verifique sua conexão.",
      0,
    );
  }

  const bruto = await res.text();

  let body: ApiResponse<T> | null = null;
  try {
    body = bruto ? (JSON.parse(bruto) as ApiResponse<T>) : null;
  } catch {
    body = null;
  }

  avisarPerdaDeSessao(path, res.status);

  if (body === null) {
    throw new ErroDeApi(mensagemDeRespostaCrua(res.status), res.status);
  }

  if (!res.ok || !body.success) {
    throw new ErroDeApi(
      body.error ?? "Erro ao comunicar com o servidor",
      res.status,
    );
  }

  return body.data as T;
}

function mensagemDeRespostaCrua(status: number): string {
  if (status === 502 || status === 503 || status === 504) {
    return "O servidor não está respondendo. Ele pode estar reiniciando ou fora do ar.";
  }
  if (status === 404) {
    return "Endereço não encontrado no servidor.";
  }
  if (status >= 500) {
    return "O servidor falhou ao responder.";
  }
  return "O servidor respondeu em um formato inesperado.";
}
