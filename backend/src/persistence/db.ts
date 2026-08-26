import { Pool, types } from "pg";

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

export async function query<T = unknown>(
  texto: string,
  valores: unknown[] = []
): Promise<T[]> {
  const resultado = await getPool().query(texto, valores);
  return resultado.rows as T[];
}

export async function fecharPool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

const ESQUEMA = `
CREATE TABLE IF NOT EXISTS categories (
  id    UUID PRIMARY KEY,
  name  TEXT NOT NULL,
  color TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tasks (
  id               UUID PRIMARY KEY,
  description      TEXT NOT NULL,
  category_id      UUID NOT NULL REFERENCES categories(id),
  date             DATE NOT NULL,
  time_block_type  TEXT NOT NULL,
  time             TEXT,
  shift            TEXT,
  status           TEXT NOT NULL,
  priority         TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS goals (
  id          UUID PRIMARY KEY,
  description TEXT NOT NULL,
  category_id UUID NOT NULL REFERENCES categories(id),
  period      TEXT NOT NULL,
  start_date  DATE NOT NULL,
  end_date    DATE NOT NULL,
  status      TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reminders (
  id          UUID PRIMARY KEY,
  description TEXT NOT NULL,
  type        TEXT NOT NULL,
  recurrence  TEXT NOT NULL,
  day_of_week SMALLINT,
  date        DATE,
  time        TEXT
);

CREATE INDEX IF NOT EXISTS tasks_date_idx ON tasks (date);
CREATE INDEX IF NOT EXISTS goals_period_idx ON goals (period);
`;

export async function migrar(): Promise<void> {
  await query(ESQUEMA);
}
