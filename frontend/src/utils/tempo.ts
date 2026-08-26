import { Shift, TimeBlockType } from "../types/enums";

const INICIO_DA_TARDE = 12 * 60;
const INICIO_DA_NOITE = 18 * 60;

export function emMinutos(hora: string): number {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}

export function derivarTurno(time: string): Shift {
  const minutos = emMinutos(time);
  if (minutos < INICIO_DA_TARDE) return Shift.MANHA;
  if (minutos < INICIO_DA_NOITE) return Shift.TARDE;
  return Shift.NOITE;
}

export function derivarBloco(time: string, endTime?: string): TimeBlockType {
  if (!endTime) return TimeBlockType.MEIA_HORA;
  const duracao = emMinutos(endTime) - emMinutos(time);
  if (duracao <= 30) return TimeBlockType.MEIA_HORA;
  if (duracao <= 60) return TimeBlockType.UMA_HORA;
  return TimeBlockType.TURNO;
}

export function formatarDuracao(time: string, endTime: string): string {
  const total = emMinutos(endTime) - emMinutos(time);
  if (total <= 0) return "";
  const horas = Math.floor(total / 60);
  const minutos = total % 60;
  if (horas === 0) return `${minutos} min`;
  if (minutos === 0) return horas === 1 ? "1 hora" : `${horas} horas`;
  return `${horas}h${String(minutos).padStart(2, "0")}`;
}

export function janelaDaTarefa(task: {
  time?: string;
  endTime?: string;
}): string | null {
  if (!task.time) return null;
  return task.endTime ? `${task.time}-${task.endTime}` : task.time;
}

const ANTECEDENCIA_PADRAO = 30;

export function inicioDoAviso(task: {
  date: string;
  time?: string;
  alertLeadMinutes?: number;
}): Date | null {
  if (!task.time) return null;

  const [ano, mes, dia] = task.date.split("-").map(Number);
  const [hora, minuto] = task.time.split(":").map(Number);
  const inicio = new Date(ano, mes - 1, dia, hora, minuto, 0, 0);
  const antecedencia = task.alertLeadMinutes ?? ANTECEDENCIA_PADRAO;

  return new Date(inicio.getTime() - antecedencia * 60_000);
}
