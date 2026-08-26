import { createContext, useContext } from "react";
import type { Conta } from "./authApi";

export interface Sessao {
  conta: Conta | null;
  carregando: boolean;
  indisponivel: string | null;
  entrou: (conta: Conta) => void;
  atualizou: (conta: Conta) => void;
  sair: () => Promise<void>;
  reconferir: () => Promise<void>;
}

export const ContextoDeSessao = createContext<Sessao | null>(null);

export function useSessao(): Sessao {
  const valor = useContext(ContextoDeSessao);
  if (!valor) {
    throw new Error("useSessao precisa estar dentro de ProvedorDeSessao");
  }
  return valor;
}
