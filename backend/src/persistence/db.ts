import { Pool, types } from "pg";
import { AppError } from "../utils/errors";

types.setTypeParser(1082, (valor) => valor);

let pool: Pool | null = null;

export function usaPostgres(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL não definida");
    }
    pool = new Pool({
      connectionString,
      ssl: process.env.PGSSL === "require" ? { rejectUnauthorized: false } : undefined,
    });
  }
  return pool;
}

const ERROS_DE_ENTRADA: Record<string, { mensagem: string; status: number }> = {
  "23505": { mensagem: "Já existe um registro com esse valor", status: 409 },
  "23503": { mensagem: "Referência a um registro que não existe", status: 400 },
  "23514": { mensagem: "Valor fora do permitido para esse campo", status: 400 },
  "22001": { mensagem: "Valor longo demais para esse campo", status: 400 },
  "22003": { mensagem: "Valor numérico fora da faixa permitida", status: 400 },
};

export async function query<T = unknown>(
  texto: string,
  valores: unknown[] = []
): Promise<T[]> {
  try {
    const resultado = await getPool().query(texto, valores);
    return resultado.rows as T[];
  } catch (erro) {
    const codigo = (erro as { code?: string }).code;
    const conhecido = codigo ? ERROS_DE_ENTRADA[codigo] : undefined;

    if (conhecido) {
      throw new AppError(conhecido.mensagem, conhecido.status);
    }
    throw erro;
  }
}

export async function fecharPool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

const ESQUEMA = `
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS categories (
  seq     BIGSERIAL,
  id      UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name    TEXT NOT NULL,
  color   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tasks (
  seq     BIGSERIAL,
  id               UUID PRIMARY KEY,
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  description      TEXT NOT NULL,
  category_id      UUID NOT NULL REFERENCES categories(id),
  date             DATE NOT NULL,
  time_block_type  TEXT NOT NULL,
  time             TEXT,
  end_time         TEXT,
  shift            TEXT,
  status           TEXT NOT NULL,
  priority         TEXT NOT NULL,
  recurrence           TEXT NOT NULL DEFAULT 'UNICA',
  recurrence_group_id  UUID,
  alert_enabled        BOOLEAN NOT NULL DEFAULT FALSE,
  alert_lead_minutes   INTEGER NOT NULL DEFAULT 30
);

CREATE TABLE IF NOT EXISTS goals (
  seq     BIGSERIAL,
  id          UUID PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  category_id UUID NOT NULL REFERENCES categories(id),
  period      TEXT NOT NULL,
  start_date  DATE NOT NULL,
  end_date    DATE NOT NULL,
  status      TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reminders (
  seq     BIGSERIAL,
  id          UUID PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  type        TEXT NOT NULL,
  recurrence  TEXT NOT NULL,
  day_of_week SMALLINT,
  date        DATE,
  time        TEXT
);

`;

const MIGRACAO_DONO = `
DELETE FROM tasks;
DELETE FROM goals;
DELETE FROM reminders;
DELETE FROM categories;

ALTER TABLE categories ADD COLUMN user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE tasks      ADD COLUMN user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE goals      ADD COLUMN user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE reminders  ADD COLUMN user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE;
`;

const MIGRACAO_TEMPO = `
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS end_time TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence TEXT NOT NULL DEFAULT 'UNICA';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence_group_id UUID;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS alert_enabled BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS alert_lead_minutes INTEGER NOT NULL DEFAULT 30;
`;

const MIGRACAO_SEQ = `
ALTER TABLE categories ADD COLUMN IF NOT EXISTS seq BIGSERIAL;
ALTER TABLE tasks      ADD COLUMN IF NOT EXISTS seq BIGSERIAL;
ALTER TABLE goals      ADD COLUMN IF NOT EXISTS seq BIGSERIAL;
ALTER TABLE reminders  ADD COLUMN IF NOT EXISTS seq BIGSERIAL;
`;

async function precisaDeDono(): Promise<boolean> {
  const linhas = await query<{ existe: boolean }>(
    `SELECT EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_name = 'categories' AND column_name = 'user_id'
     ) AS existe`
  );
  return !linhas[0]?.existe;
}

async function contarLegado(): Promise<number> {
  const linhas = await query<{ total: string }>(
    `SELECT (SELECT count(*) FROM categories)
          + (SELECT count(*) FROM tasks)
          + (SELECT count(*) FROM goals)
          + (SELECT count(*) FROM reminders) AS total`
  );
  return Number(linhas[0]?.total ?? 0);
}

const INDICES = `
DROP INDEX IF EXISTS tasks_date_idx;
DROP INDEX IF EXISTS goals_period_idx;

CREATE INDEX IF NOT EXISTS tasks_user_date_idx ON tasks (user_id, date);
CREATE INDEX IF NOT EXISTS goals_user_period_idx ON goals (user_id, period);
CREATE INDEX IF NOT EXISTS categories_user_idx ON categories (user_id);
CREATE INDEX IF NOT EXISTS reminders_user_idx ON reminders (user_id);
`;

export async function migrar(): Promise<void> {
  await query(ESQUEMA);

  if (await precisaDeDono()) {
    const legado = await contarLegado();

    if (legado > 0 && process.env.NEXO_DESCARTAR_DADOS !== "confirmo") {
      throw new Error(
        `O banco tem ${legado} registros anteriores às contas de usuário. ` +
          "Não existe dono para atribuir a eles, então a migração os apagaria. " +
          "Se esses dados são descartáveis, suba novamente com " +
          "NEXO_DESCARTAR_DADOS=confirmo. Caso contrário, faça a cópia antes."
      );
    }

    await query(MIGRACAO_DONO);
  }

  await query(MIGRACAO_SEQ);
  await query(MIGRACAO_TEMPO);
  await query(INDICES);
}
