import { AsyncLocalStorage } from "async_hooks";

interface Contexto {
  userId: string;
}

const armazenamento = new AsyncLocalStorage<Contexto>();

export function comUsuario<T>(userId: string, acao: () => T): T {
  return armazenamento.run({ userId }, acao);
}

export function usuarioAtual(): string | undefined {
  return armazenamento.getStore()?.userId;
}

export function exigirUsuarioAtual(): string {
  const userId = usuarioAtual();
  if (!userId) {
    throw new Error(
      "Consulta a dado de usuário sem sessão no contexto da requisição"
    );
  }
  return userId;
}
