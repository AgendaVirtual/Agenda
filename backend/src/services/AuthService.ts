import {
  createHmac,
  randomBytes,
  randomUUID,
  scrypt,
  timingSafeEqual,
} from "crypto";
import { promisify } from "util";
import { query } from "../persistence/db";
import { AppError } from "../utils/errors";

const scryptAsync = promisify(scrypt) as (
  senha: string,
  sal: string,
  tamanho: number
) => Promise<Buffer>;

const CUSTO = 64;
const DURACAO_SESSAO_DIAS = 30;

export interface Usuario {
  id: string;
  name: string;
  email: string;
}

interface LinhaUsuario extends Usuario {
  password_hash: string;
}

function segredo(): string {
  const valor = process.env.AUTH_SECRET;
  if (!valor || valor.length < 16) {
    throw new Error(
      "AUTH_SECRET ausente ou curto demais; defina ao menos 16 caracteres"
    );
  }
  return valor;
}

async function derivar(senha: string, sal: string): Promise<string> {
  const derivada = await scryptAsync(senha, sal, CUSTO);
  return derivada.toString("hex");
}

async function criarHash(senha: string): Promise<string> {
  const sal = randomBytes(16).toString("hex");
  return `${sal}:${await derivar(senha, sal)}`;
}

async function conferirSenha(senha: string, guardado: string): Promise<boolean> {
  const [sal, esperado] = guardado.split(":");
  if (!sal || !esperado) return false;

  const obtido = await derivar(senha, sal);
  const a = Buffer.from(obtido, "hex");
  const b = Buffer.from(esperado, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

function assinar(carga: string): string {
  return createHmac("sha256", segredo()).update(carga).digest("base64url");
}

export function emitirToken(userId: string): string {
  const expiraEm = Date.now() + DURACAO_SESSAO_DIAS * 24 * 60 * 60 * 1000;
  const carga = `${userId}.${expiraEm}`;
  return `${carga}.${assinar(carga)}`;
}

export function validarToken(token: string): string | null {
  const partes = token.split(".");
  if (partes.length !== 3) return null;

  const [userId, expiraEm, assinatura] = partes;
  const esperada = assinar(`${userId}.${expiraEm}`);

  const a = Buffer.from(assinatura);
  const b = Buffer.from(esperada);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  if (Number(expiraEm) < Date.now()) return null;

  return userId;
}

function normalizarEmail(valor: unknown): string {
  if (typeof valor !== "string" || !valor.includes("@")) {
    throw new AppError("Informe um e-mail válido");
  }
  return valor.trim().toLowerCase();
}

function validarSenha(valor: unknown): string {
  if (typeof valor !== "string" || valor.length < 8) {
    throw new AppError("A senha precisa de ao menos 8 caracteres");
  }
  return valor;
}

function validarNome(valor: unknown): string {
  if (typeof valor !== "string" || valor.trim().length < 2) {
    throw new AppError("Informe seu nome");
  }
  return valor.trim();
}

export class AuthService {
  async registrar(dados: unknown): Promise<Usuario> {
    const corpo = (dados ?? {}) as Record<string, unknown>;
    const name = validarNome(corpo.name);
    const email = normalizarEmail(corpo.email);
    const senha = validarSenha(corpo.password);

    const existentes = await query<{ id: string }>(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );
    if (existentes.length > 0) {
      throw new AppError("Já existe uma conta com esse e-mail", 409);
    }

    const id = randomUUID();
    await query(
      `INSERT INTO users (id, name, email, password_hash)
       VALUES ($1, $2, $3, $4)`,
      [id, name, email, await criarHash(senha)]
    );

    return { id, name, email };
  }

  async entrar(dados: unknown): Promise<Usuario> {
    const corpo = (dados ?? {}) as Record<string, unknown>;
    const email = normalizarEmail(corpo.email);
    const senha = corpo.password;

    const linhas = await query<LinhaUsuario>(
      "SELECT id, name, email, password_hash FROM users WHERE email = $1",
      [email]
    );

    const usuario = linhas[0];
    const confere =
      usuario !== undefined &&
      typeof senha === "string" &&
      (await conferirSenha(senha, usuario.password_hash));

    if (!confere) {
      throw new AppError("E-mail ou senha incorretos", 401);
    }

    return { id: usuario.id, name: usuario.name, email: usuario.email };
  }

  async porId(id: string): Promise<Usuario | undefined> {
    const linhas = await query<Usuario>(
      "SELECT id, name, email FROM users WHERE id = $1",
      [id]
    );
    return linhas[0];
  }

  async atualizarPerfil(id: string, dados: unknown): Promise<Usuario> {
    const corpo = (dados ?? {}) as Record<string, unknown>;
    const name = validarNome(corpo.name);
    const email = normalizarEmail(corpo.email);

    const conflito = await query<{ id: string }>(
      "SELECT id FROM users WHERE email = $1 AND id <> $2",
      [email, id]
    );
    if (conflito.length > 0) {
      throw new AppError("Já existe uma conta com esse e-mail", 409);
    }

    const linhas = await query<Usuario>(
      `UPDATE users SET name = $1, email = $2 WHERE id = $3
       RETURNING id, name, email`,
      [name, email, id]
    );
    if (!linhas[0]) throw new AppError("Conta não encontrada", 404);

    return linhas[0];
  }

  async trocarSenha(id: string, dados: unknown): Promise<void> {
    const corpo = (dados ?? {}) as Record<string, unknown>;
    const nova = validarSenha(corpo.newPassword);

    const linhas = await query<LinhaUsuario>(
      "SELECT id, name, email, password_hash FROM users WHERE id = $1",
      [id]
    );
    const usuario = linhas[0];
    if (!usuario) throw new AppError("Conta não encontrada", 404);

    const atual = corpo.currentPassword;
    const confere =
      typeof atual === "string" &&
      (await conferirSenha(atual, usuario.password_hash));
    if (!confere) {
      throw new AppError("A senha atual não confere", 401);
    }

    await query("UPDATE users SET password_hash = $1 WHERE id = $2", [
      await criarHash(nova),
      id,
    ]);
  }

  async semearCategorias(userId: string, padroes: { name: string; color: string }[]): Promise<void> {
    for (const categoria of padroes) {
      await query(
        `INSERT INTO categories (id, user_id, name, color) VALUES ($1, $2, $3, $4)`,
        [randomUUID(), userId, categoria.name, categoria.color]
      );
    }
  }
}
