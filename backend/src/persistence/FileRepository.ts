import fs from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export interface IRepository<T extends { id: string }> {
  findAll(): Promise<T[]>;
  findById(id: string): Promise<T | undefined>;
  create(data: Omit<T, "id">): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T | undefined>;
  delete(id: string): Promise<boolean>;
}

const DATA_DIR = process.env.PLANNER_DATA_DIR
  ? path.resolve(process.env.PLANNER_DATA_DIR)
  : path.join(__dirname, "..", "..", "data");

async function readJsonFile<T>(filePath: string): Promise<T[]> {
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw) as T[];
  } catch (err: any) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
}

async function writeJsonFile<T>(filePath: string, data: T[]): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}

// Repositório genérico baseado em arquivo JSON.
// Cada módulo (Goal, Task, Category, Reminder) estende esta classe
// passando o nome do arquivo, ex: new FileRepository<Task>("tasks.json")
export class FileRepository<T extends { id: string }>
  implements IRepository<T>
{
  private filePath: string;

  constructor(fileName: string) {
    this.filePath = path.join(DATA_DIR, fileName);
  }

  async findAll(): Promise<T[]> {
    return readJsonFile<T>(this.filePath);
  }

  async findById(id: string): Promise<T | undefined> {
    const all = await this.findAll();
    return all.find((item) => item.id === id);
  }

  async create(data: Omit<T, "id">): Promise<T> {
    const all = await this.findAll();
    const newItem = { ...data, id: uuidv4() } as T;
    all.push(newItem);
    await writeJsonFile(this.filePath, all);
    return newItem;
  }

  async update(id: string, data: Partial<T>): Promise<T | undefined> {
    const all = await this.findAll();
    const index = all.findIndex((item) => item.id === id);
    if (index === -1) return undefined;
    all[index] = { ...all[index], ...data };
    await writeJsonFile(this.filePath, all);
    return all[index];
  }

  async delete(id: string): Promise<boolean> {
    const all = await this.findAll();
    const filtered = all.filter((item) => item.id !== id);
    if (filtered.length === all.length) return false;
    await writeJsonFile(this.filePath, filtered);
    return true;
  }
}
