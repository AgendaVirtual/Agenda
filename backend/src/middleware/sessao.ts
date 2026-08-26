import { NextFunction, Request, Response } from "express";
import { AuthService, lerToken } from "../services/AuthService";
import { comUsuario } from "../persistence/contexto";
import { usaPostgres } from "../persistence/db";
import { AppError } from "../utils/errors";

const COOKIE = "nexo_sessao";

export function lerCookieDeSessao(req: Request): string | undefined {
  const bruto = req.headers.cookie;
  if (!bruto) return undefined;

  for (const parte of bruto.split(";")) {
    const [nome, ...resto] = parte.trim().split("=");
    if (nome !== COOKIE) continue;

    try {
      return decodeURIComponent(resto.join("="));
    } catch {
      return undefined;
    }
  }
  return undefined;
}

export function gravarCookieDeSessao(res: Response, token: string): void {
  const seguro = process.env.NODE_ENV === "production";
  res.setHeader("Set-Cookie", [
    `${COOKIE}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=2592000",
    ...(seguro ? ["Secure"] : []),
  ].join("; "));
}

export function limparCookieDeSessao(res: Response): void {
  const seguro = process.env.NODE_ENV === "production";
  res.setHeader(
    "Set-Cookie",
    `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0` +
      (seguro ? "; Secure" : "")
  );
}

const autenticacao = new AuthService();

export async function usuarioDaRequisicao(
  req: Request
): Promise<string | undefined> {
  const token = lerCookieDeSessao(req);
  if (!token) return undefined;

  const conteudo = lerToken(token);
  if (!conteudo) return undefined;

  const usuario = await autenticacao.sessaoValida(
    conteudo.userId,
    conteudo.marca
  );
  return usuario?.id;
}

export function exigirSessao(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  if (!usaPostgres()) {
    next();
    return;
  }

  usuarioDaRequisicao(req)
    .then((userId) => {
      if (!userId) {
        next(new AppError("Faça login para continuar", 401));
        return;
      }
      comUsuario(userId, next);
    })
    .catch(next);
}
