import { randomUUID } from "crypto";
import { IRepository } from "./FileRepository";
import { query } from "./db";
import { exigirUsuarioAtual } from "./contexto";

type Mapa = Record<string, string>;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class PgRepository<T extends { id: string }> implements IRepository<T> {
  private readonly colunas: Mapa;
  private readonly campos: Mapa;

  constructor(
    private readonly tabela: string,
    mapa: Mapa,
    private readonly porUsuario = false
  ) {
    this.colunas = mapa;
    this.campos = Object.fromEntries(
      Object.entries(mapa).map(([campo, coluna]) => [coluna, campo])
    );
  }

  private filtroDeDono(posicao: number): { sql: string; valores: unknown[] } {
    if (!this.porUsuario) return { sql: "", valores: [] };
    return { sql: ` AND user_id = $${posicao}`, valores: [exigirUsuarioAtual()] };
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
      const campo = this.campos[coluna];
      if (campo === undefined || valor === null) continue;
      saida[campo] = valor;
    }
    return saida as T;
  }

  async findAll(): Promise<T[]> {
    const dono = this.filtroDeDono(1);
    const linhas = await query<Record<string, unknown>>(
      `SELECT * FROM ${this.tabela} WHERE TRUE${dono.sql} ORDER BY seq`,
      dono.valores
    );
    return linhas.map((l) => this.paraEntidade(l));
  }

  async findById(id: string): Promise<T | undefined> {
    if (!UUID.test(id)) return undefined;

    const dono = this.filtroDeDono(2);
    const linhas = await query<Record<string, unknown>>(
      `SELECT * FROM ${this.tabela} WHERE id = $1${dono.sql}`,
      [id, ...dono.valores]
    );
    return linhas[0] ? this.paraEntidade(linhas[0]) : undefined;
  }

  async create(dados: Omit<T, "id">): Promise<T> {
    const registro: Record<string, unknown> = {
      ...(dados as Record<string, unknown>),
      id: randomUUID(),
    };
    const [colunas, valores] = this.paraLinha(registro);
    if (this.porUsuario) {
      colunas.push("user_id");
      valores.push(exigirUsuarioAtual());
    }
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
    const dono = this.filtroDeDono(colunas.length + 2);
    const linhas = await query<Record<string, unknown>>(
      `UPDATE ${this.tabela} SET ${atribuicoes}
       WHERE id = $${colunas.length + 1}${dono.sql} RETURNING *`,
      [...valores, id, ...dono.valores]
    );
    return linhas[0] ? this.paraEntidade(linhas[0]) : undefined;
  }

  async delete(id: string): Promise<boolean> {
    if (!UUID.test(id)) return false;

    const dono = this.filtroDeDono(2);
    const linhas = await query<{ id: string }>(
      `DELETE FROM ${this.tabela} WHERE id = $1${dono.sql} RETURNING id`,
      [id, ...dono.valores]
    );
    return linhas.length > 0;
  }
}
