export function todayISO(): string {
  return toISO(new Date());
}

export function toISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function fromISO(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function formatDateLabel(iso: string): string {
  const date = fromISO(iso);
  const weekday = date.toLocaleDateString("pt-BR", { weekday: "long" });
  return `${weekday}, ${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
}

export function formatShortDate(iso: string): string {
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
}

export function addDays(iso: string, days: number): string {
  const date = fromISO(iso);
  date.setDate(date.getDate() + days);
  return toISO(date);
}

export function startOfWeek(iso: string): string {
  const date = fromISO(iso);
  const daysSinceMonday = (date.getDay() + 6) % 7;
  return addDays(iso, -daysSinceMonday);
}

export function endOfMonth(iso: string): string {
  const date = fromISO(iso);
  return toISO(new Date(date.getFullYear(), date.getMonth() + 1, 0));
}

export function startOfMonth(iso: string): string {
  return `${iso.slice(0, 7)}-01`;
}

export function formatPeriodKey(key: string | null): string | null {
  if (!key) return null;

  const week = key.match(/^(\d{4})-W(\d{2})$/);
  if (week) return `Semana ${Number(week[2])} de ${week[1]}`;

  const month = key.match(/^(\d{4})-(\d{2})$/);
  if (month) {
    const name = new Date(
      Number(month[1]),
      Number(month[2]) - 1,
      1,
    ).toLocaleDateString("pt-BR", { month: "long" });
    return `${name[0].toUpperCase()}${name.slice(1)} de ${month[1]}`;
  }

  return key;
}

const SHIFT_START: Record<string, string> = {
  MANHA: "00:00",
  TARDE: "12:00",
  NOITE: "18:00",
};

export function taskTimeKey(task: {
  time?: string | null;
  shift?: string | null;
}): string {
  if (task.time) return task.time;
  if (task.shift) return SHIFT_START[task.shift] ?? "99:99";
  return "99:99";
}

export function reminderOccurrence(
  reminder: { recurrence: string; dayOfWeek?: number; date?: string },
  fromISO: string,
  windowDays = 7,
): string | null {
  if (reminder.recurrence === "UNICO") {
    if (!reminder.date) return null;
    const limit = addDays(fromISO, windowDays - 1);
    return reminder.date >= fromISO && reminder.date <= limit
      ? reminder.date
      : null;
  }

  if (reminder.dayOfWeek === undefined) return null;
  const fromDay = fromISO_dayOfWeek(fromISO);
  const delta = (reminder.dayOfWeek - fromDay + 7) % 7;
  return delta <= windowDays - 1 ? addDays(fromISO, delta) : null;
}

function fromISO_dayOfWeek(iso: string): number {
  return fromISO(iso).getDay();
}

export function upcomingDays(fromISO: string, windowDays = 7): string[] {
  return Array.from({ length: windowDays }, (_, i) => addDays(fromISO, i));
}

export function shortWeekday(iso: string): string {
  return fromISO(iso)
    .toLocaleDateString("pt-BR", { weekday: "short" })
    .replace(".", "");
}
