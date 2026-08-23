import type { ApiResponse } from "../types/entities";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";

export async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  const body: ApiResponse<T> = await res.json();

  if (!res.ok || !body.success) {
    throw new Error(body.error ?? "Erro ao comunicar com o servidor");
  }

  return body.data as T;
}
