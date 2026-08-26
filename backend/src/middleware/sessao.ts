import { NextFunction, Request, Response } from "express";
import { validarToken } from "../services/AuthService";
import { comUsuario } from "../persistence/contexto";
import { usaPostgres } from "../persistence/db";
import { AppError } from "../utils/errors";

const COOKIE = "nexo_sessao";

export function lerCookieDeSessao(req: Request): string | undefined {
  const bruto = req.headers.cookie;
  if (!bruto) return undefined;

  for (const parte of bruto.split(";")) {
    const [nome, ...resto] = parte.trim().split("=");
    if (nome === COOKIE) return decodeURIComponent(resto.join("="));
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
  res.setHeader(
    "Set-Cookie",
    `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
  );
}

export function usuarioDaRequisicao(req: Request): string | undefined {
  const token = lerCookieDeSessao(req);
  return token ? (validarToken(token) ?? undefined) : undefined;
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

  const userId = usuarioDaRequisicao(req);
  if (!userId) {
    next(new AppError("Faça login para continuar", 401));
    return;
  }

  comUsuario(userId, next);
}
