import { randomUUID } from "crypto";
import { IRepository } from "./FileRepository";
import { query } from "./db";

type Mapa = Record<string, string>;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class PgRepository<T extends { id: string }> implements IRepository<T> {
  private readonly colunas: Mapa;
  private readonly campos: Mapa;

  constructor(
    private readonly tabela: string,
    mapa: Mapa
  ) {
    this.colunas = mapa;
    this.campos = Object.fromEntries(
      Object.entries(mapa).map(([campo, coluna]) => [coluna, campo])
    );
  }

  private paraLinha(dados: Record<string, unknown>): [string[], unknown[]] {
    const colunas: string[] = [];
    const valores: unknown[] = [];
    for (const [campo, coluna] of Object.entries(this.colunas)) {
      if (!(campo in dados)) continue;
      colunas.push(coluna);
      valores.push(dados[campo] === undefined ? null : dados[campo]);
    }
    return [colunas, valores];
  }

  private paraEntidade(linha: Record<string, unknown>): T {
    const saida: Record<string, unknown> = {};
    for (const [coluna, valor] of Object.entries(linha)) {
      if (valor === null) continue;
      saida[this.campos[coluna] ?? coluna] = valor;
    }
    return saida as T;
  }

  async findAll(): Promise<T[]> {
    const linhas = await query<Record<string, unknown>>(
      `SELECT * FROM ${this.tabela}`
    );
    return linhas.map((l) => this.paraEntidade(l));
  }

  async findById(id: string): Promise<T | undefined> {
    if (!UUID.test(id)) return undefined;

    const linhas = await query<Record<string, unknown>>(
      `SELECT * FROM ${this.tabela} WHERE id = $1`,
      [id]
    );
    return linhas[0] ? this.paraEntidade(linhas[0]) : undefined;
  }

  async create(dados: Omit<T, "id">): Promise<T> {
    const registro = { ...(dados as Record<string, unknown>), id: randomUUID() };
    const [colunas, valores] = this.paraLinha(registro);
    const marcadores = colunas.map((_, i) => `$${i + 1}`).join(", ");
    const linhas = await query<Record<string, unknown>>(
      `INSERT INTO ${this.tabela} (${colunas.join(", ")})
       VALUES (${marcadores}) RETURNING *`,
      valores
    );
    return this.paraEntidade(linhas[0]);
  }

  async update(id: string, dados: Partial<T>): Promise<T | undefined> {
    if (!UUID.test(id)) return undefined;

    const { id: _ignorado, ...resto } = dados as Record<string, unknown>;
    const [colunas, valores] = this.paraLinha(resto);
    if (colunas.length === 0) return this.findById(id);

    const atribuicoes = colunas.map((c, i) => `${c} = $${i + 1}`).join(", ");
    const linhas = await query<Record<string, unknown>>(
      `UPDATE ${this.tabela} SET ${atribuicoes}
       WHERE id = $${colunas.length + 1} RETURNING *`,
      [...valores, id]
    );
    return linhas[0] ? this.paraEntidade(linhas[0]) : undefined;
  }

  async delete(id: string): Promise<boolean> {
    if (!UUID.test(id)) return false;

    const linhas = await query<{ id: string }>(
      `DELETE FROM ${this.tabela} WHERE id = $1 RETURNING id`,
      [id]
    );
    return linhas.length > 0;
  }
}
