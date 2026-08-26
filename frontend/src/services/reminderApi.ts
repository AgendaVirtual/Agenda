import { request } from "./api";
import type { CreateReminderDTO, Reminder } from "../types/entities";

export const REMINDER_FULL_LIST_SUPPORTED = false;

export function getUpcomingReminders(): Promise<Reminder[]> {
  return request<Reminder[]>("/reminders?upcoming=true");
}

type Ouvinte = () => void;
const ouvintes = new Set<Ouvinte>();

export function aoMudarLembretes(ouvinte: Ouvinte): () => void {
  ouvintes.add(ouvinte);
  return () => {
    ouvintes.delete(ouvinte);
  };
}

function avisarMudanca() {
  for (const ouvinte of ouvintes) ouvinte();
}

export async function createReminder(
  data: CreateReminderDTO,
): Promise<Reminder> {
  const criado = await request<Reminder>("/reminders", {
    method: "POST",
    body: JSON.stringify(data),
  });
  avisarMudanca();
  return criado;
}

export async function deleteReminder(id: string): Promise<void> {
  await request<void>(`/reminders/${id}`, { method: "DELETE" });
  avisarMudanca();
}
