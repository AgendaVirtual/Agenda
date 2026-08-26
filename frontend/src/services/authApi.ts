import { request } from "./api";

export interface Conta {
  id: string;
  name: string;
  email: string;
}

export function registrar(dados: {
  name: string;
  email: string;
  password: string;
}): Promise<Conta> {
  return request<Conta>("/auth/registrar", {
    method: "POST",
    body: JSON.stringify(dados),
  });
}

export function entrar(dados: {
  email: string;
  password: string;
}): Promise<Conta> {
  return request<Conta>("/auth/entrar", {
    method: "POST",
    body: JSON.stringify(dados),
  });
}

export function sair(): Promise<void> {
  return request<void>("/auth/sair", { method: "POST" });
}

export function contaAtual(): Promise<Conta> {
  return request<Conta>("/auth/eu");
}

export function atualizarConta(dados: {
  name: string;
  email: string;
}): Promise<Conta> {
  return request<Conta>("/auth/eu", {
    method: "PUT",
    body: JSON.stringify(dados),
  });
}

export function trocarSenha(dados: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  return request<void>("/auth/eu/senha", {
    method: "PUT",
    body: JSON.stringify(dados),
  });
}
