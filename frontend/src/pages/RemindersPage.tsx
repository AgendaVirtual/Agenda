import { useCallback, useEffect, useState, type FormEvent } from "react";
import { PageHeader } from "../components/AppShell";
import { Button } from "../components/ui/Button";
import { Card, SectionTitle } from "../components/ui/Card";
import { Modal } from "../components/ui/Modal";
import { Badge } from "../components/ui/Badge";
import { Field, SelectInput, TextInput } from "../components/ui/Field";
import {
  EmptyState,
  ErrorBanner,
  LoadingState,
} from "../components/ui/Feedback";
import {
  createReminder,
  deleteReminder,
  getUpcomingReminders,
} from "../services/reminderApi";
import type { CreateReminderDTO, Reminder } from "../types/entities";
import { ReminderRecurrence, ReminderType } from "../types/enums";
import {
  formatShortDate,
  reminderOccurrence,
  shortWeekday,
  todayISO,
  upcomingDays,
} from "../utils/date";
import {
  RECURRENCE_LABELS,
  REMINDER_TYPE_LABELS,
  WEEKDAY_LABELS,
} from "../utils/labels";

export function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    getUpcomingReminders()
      .then(setReminders)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(data: CreateReminderDTO) {
    try {
      await createReminder(data);
      setFormOpen(false);
      setError(null);

      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não deu para criar o lembrete.");
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteReminder(id);
      setReminders((prev) => prev.filter((r) => r.id !== id));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não deu para remover o lembrete.");
    }
  }

  const recurring = reminders.filter(
    (r) => r.recurrence === ReminderRecurrence.RECORRENTE_SEMANAL,
  );
  const single = reminders.filter(
    (r) => r.recurrence === ReminderRecurrence.UNICO,
  );

  return (
    <>
      <PageHeader
        title="Lembretes"
        description="Reuniões, ligações, compras, estudos, exercícios e entregas - uma vez ou toda semana."
        action={
          <Button onClick={() => setFormOpen(true)}>Novo lembrete</Button>
        }
      />

      {!formOpen && error && (
        <div className="mb-6">
          <ErrorBanner message={error} onDismiss={() => setError(null)} />
        </div>
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        error={error}
        onDismissError={() => setError(null)}
        title="Novo lembrete"
        description="Uma vez, numa data marcada, ou toda semana no mesmo dia."
      >
        <ReminderForm
          onSubmit={handleCreate}
          onCancel={() => setFormOpen(false)}
        />
      </Modal>

      {loading ? (
        <LoadingState label="Carregando lembretes..." />
      ) : reminders.length === 0 ? (
        <Card>
          <EmptyState
            title="Nenhum lembrete nos próximos 7 dias"
            description="Lembretes recorrentes aparecem toda semana no dia escolhido. Os únicos aparecem só na data marcada."
            action={
              <Button onClick={() => setFormOpen(true)}>Novo lembrete</Button>
            }
          />
        </Card>
      ) : (
        <div className="anim-rise-late flex flex-col gap-3">
          <WeekStrip reminders={reminders} />

          <div className="grid gap-3 lg:grid-cols-2">
            <Card padding="sm">
              <SectionTitle>Toda semana</SectionTitle>
              {recurring.length === 0 ? (
                <p className="py-4 text-sm font-light text-ink-muted">
                  Nenhum lembrete recorrente.
                </p>
              ) : (
                <ReminderList
                  reminders={recurring}
                  onDelete={handleDelete}
                  describe={(r) =>
                    r.dayOfWeek !== undefined
                      ? WEEKDAY_LABELS[r.dayOfWeek]
                      : "Dia não definido"
                  }
                />
              )}
            </Card>

            <Card padding="sm">
              <SectionTitle>Data marcada</SectionTitle>
              {single.length === 0 ? (
                <p className="py-4 text-sm font-light text-ink-muted">
                  Nenhum lembrete único nos próximos dias.
                </p>
              ) : (
                <ReminderList
                  reminders={single}
                  onDelete={handleDelete}
                  describe={(r) =>
                    r.date ? formatShortDate(r.date) : "Sem data"
                  }
                />
              )}
            </Card>
          </div>
        </div>
      )}
    </>
  );
}

function WeekStrip({ reminders }: { reminders: Reminder[] }) {
  const today = todayISO();
  const days = upcomingDays(today);

  const byDay = new Map<string, Reminder[]>();
  for (const day of days) byDay.set(day, []);
  for (const reminder of reminders) {
    const day = reminderOccurrence(reminder, today);
    if (day) byDay.get(day)?.push(reminder);
  }
  for (const list of byDay.values()) {
    list.sort((a, b) => (a.time ?? "99:99").localeCompare(b.time ?? "99:99"));
  }

  return (
    <Card padding="sm">
      <SectionTitle>Próximos 7 dias</SectionTitle>
      <div className="grid grid-cols-[repeat(7,minmax(0,1fr))] gap-2 overflow-x-auto">
        {days.map((day, index) => {
          const isToday = index === 0;
          const list = byDay.get(day) ?? [];

          return (
            <div key={day} className="flex min-w-0 flex-col gap-1.5">
              <div
                className={
                  "flex items-baseline gap-1.5 border-b pb-1.5 " +
                  (isToday ? "border-accent" : "border-hairline")
                }
              >
                <span
                  className={
                    "text-[13px] font-medium capitalize " +
                    (isToday ? "text-accent" : "text-ink-muted")
                  }
                >
                  {isToday ? "hoje" : shortWeekday(day)}
                </span>
                <span className="tabular text-[13px] font-light text-ink-faint">
                  {day.slice(8, 10)}
                </span>
              </div>

              <div className="flex min-h-16 flex-col gap-1">
                {list.map((reminder) => (
                  <div
                    key={reminder.id}
                    title={`${reminder.description}${reminder.time ? ` · ${reminder.time}` : ""}`}
                    className="flex flex-col gap-0.5 rounded-sm bg-accent-soft px-2 py-1"
                  >
                    <span className="truncate text-[13px] leading-tight text-ink-strong">
                      {reminder.description}
                    </span>
                    {reminder.time && (
                      <span className="tabular text-[11px] font-light text-ink-muted">
                        {reminder.time}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function ReminderList({
  reminders,
  onDelete,
  describe,
}: {
  reminders: Reminder[];
  onDelete: (id: string) => void;
  describe: (reminder: Reminder) => string;
}) {
  return (
    <ul className="flex flex-col divide-y divide-hairline">
      {reminders.map((reminder) => (
        <li
          key={reminder.id}
          className="flex min-h-14 flex-wrap items-center gap-x-3 gap-y-1 py-1.5"
        >
          <span className="min-w-0 flex-1 basis-40 truncate text-base text-ink">
            {reminder.description}
          </span>
          <Badge tone="accent">{REMINDER_TYPE_LABELS[reminder.type]}</Badge>
          <span className="tabular shrink-0 text-[13px] font-light text-ink-muted">
            {describe(reminder)}
            {reminder.time && ` · ${reminder.time}`}
          </span>
          <Button
            variant="ghost-danger"
            size="sm"
            onClick={() => onDelete(reminder.id)}
          >
            Remover
          </Button>
        </li>
      ))}
    </ul>
  );
}

function ReminderForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: CreateReminderDTO) => void;
  onCancel: () => void;
}) {
  const [description, setDescription] = useState("");
  const [type, setType] = useState<ReminderType>(ReminderType.REUNIAO);
  const [recurrence, setRecurrence] = useState<ReminderRecurrence>(
    ReminderRecurrence.RECORRENTE_SEMANAL,
  );
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [date, setDate] = useState(todayISO());
  const [time, setTime] = useState("09:00");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isRecurring = recurrence === ReminderRecurrence.RECORRENTE_SEMANAL;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const found: Record<string, string> = {};

    if (!description.trim()) {
      found.description = "Descreva o lembrete.";
    }
    if (!isRecurring && !date) {
      found.date = "Lembretes únicos precisam de uma data.";
    }

    setErrors(found);
    if (Object.keys(found).length > 0) return;

    onSubmit({
      description: description.trim(),
      type,
      recurrence,

      ...(isRecurring ? { dayOfWeek } : { date }),
      time: time || undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Field label="Lembrar de quê?" error={errors.description}>
        {(id, invalid) => (
          <TextInput
            id={id}
            invalid={invalid}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex: Reunião de acompanhamento do projeto"
          />
        )}
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Tipo">
          {(id) => (
            <SelectInput
              id={id}
              value={type}
              onChange={(e) => setType(e.target.value as ReminderType)}
            >
              {Object.values(ReminderType).map((value) => (
                <option key={value} value={value}>
                  {REMINDER_TYPE_LABELS[value]}
                </option>
              ))}
            </SelectInput>
          )}
        </Field>

        <Field label="Repetição">
          {(id) => (
            <SelectInput
              id={id}
              value={recurrence}
              onChange={(e) =>
                setRecurrence(e.target.value as ReminderRecurrence)
              }
            >
              {Object.values(ReminderRecurrence).map((value) => (
                <option key={value} value={value}>
                  {RECURRENCE_LABELS[value]}
                </option>
              ))}
            </SelectInput>
          )}
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {isRecurring ? (
          <Field label="Dia da semana">
            {(id) => (
              <SelectInput
                id={id}
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(Number(e.target.value))}
              >
                {WEEKDAY_LABELS.map((label, index) => (
                  <option key={label} value={index}>
                    {label}
                  </option>
                ))}
              </SelectInput>
            )}
          </Field>
        ) : (
          <Field label="Data" error={errors.date}>
            {(id, invalid) => (
              <TextInput
                id={id}
                invalid={invalid}
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            )}
          </Field>
        )}

        <Field label="Horário" hint="Opcional">
          {(id) => (
            <TextInput
              id={id}
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          )}
        </Field>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">Criar lembrete</Button>
      </div>
    </form>
  );
}
