import { TaskRecurrence } from "../types/enums";
import {
  SHIFT_LABELS,
  TASK_RECURRENCE_LABELS,
  TIME_BLOCK_LABELS,
} from "../utils/labels";
import { derivarBloco, derivarTurno, formatarDuracao } from "../utils/tempo";
import { Checkbox } from "./ui/Checkbox";
import { Field, SelectInput, TextInput } from "./ui/Field";

export interface AgendaDaTarefa {
  date: string;
  time: string;
  endTime: string;
  recurrence: TaskRecurrence;
  alertEnabled: boolean;
  alertLeadMinutes: number;
}

const ANTECEDENCIAS = [
  { valor: 0, rotulo: "Na hora" },
  { valor: 10, rotulo: "10 minutos antes" },
  { valor: 30, rotulo: "30 minutos antes" },
  { valor: 60, rotulo: "1 hora antes" },
  { valor: 180, rotulo: "3 horas antes" },
  { valor: 1440, rotulo: "1 dia antes" },
];

interface TaskScheduleFieldsProps {
  value: AgendaDaTarefa;
  onChange: (value: AgendaDaTarefa) => void;
}

export function TaskScheduleFields({
  value,
  onChange,
}: TaskScheduleFieldsProps) {
  const alterar = (parte: Partial<AgendaDaTarefa>) =>
    onChange({ ...value, ...parte });

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="Data">
          {(id, invalid) => (
            <TextInput
              id={id}
              invalid={invalid}
              type="date"
              value={value.date}
              onChange={(e) => alterar({ date: e.target.value })}
            />
          )}
        </Field>

        <Field label="Começa às">
          {(id, invalid) => (
            <TextInput
              id={id}
              invalid={invalid}
              type="time"
              value={value.time}
              onChange={(e) => alterar({ time: e.target.value })}
            />
          )}
        </Field>

        <Field label="Termina às" hint="opcional">
          {(id, invalid) => (
            <TextInput
              id={id}
              invalid={invalid}
              type="time"
              value={value.endTime}
              onChange={(e) => alterar({ endTime: e.target.value })}
            />
          )}
        </Field>
      </div>

      <ResumoDoBloco time={value.time} endTime={value.endTime} />

      <Field label="Se repete">
        {(id, invalid) => (
          <SelectInput
            id={id}
            invalid={invalid}
            value={value.recurrence}
            onChange={(e) =>
              alterar({ recurrence: e.target.value as TaskRecurrence })
            }
          >
            {Object.values(TaskRecurrence).map((opcao) => (
              <option key={opcao} value={opcao}>
                {TASK_RECURRENCE_LABELS[opcao]}
              </option>
            ))}
          </SelectInput>
        )}
      </Field>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2.5">
          <Checkbox
            checked={value.alertEnabled}
            label="Quero ser avisado desta tarefa"
            onChange={(marcado) => alterar({ alertEnabled: marcado })}
          />
          <span className="text-sm text-ink">Quero ser avisado</span>
        </div>

        {value.alertEnabled && (
          <Field label="Avisar a partir de">
            {(id, invalid) => (
              <SelectInput
                id={id}
                invalid={invalid}
                value={String(value.alertLeadMinutes)}
                onChange={(e) =>
                  alterar({ alertLeadMinutes: Number(e.target.value) })
                }
              >
                {ANTECEDENCIAS.map((opcao) => (
                  <option key={opcao.valor} value={opcao.valor}>
                    {opcao.rotulo}
                  </option>
                ))}
              </SelectInput>
            )}
          </Field>
        )}
      </div>
    </div>
  );
}

function ResumoDoBloco({
  time,
  endTime,
}: {
  time: string;
  endTime: string;
}) {
  if (!time) {
    return (
      <p className="text-[13px] font-light text-ink-faint">
        Informe o horário de início e o resto sai daí.
      </p>
    );
  }

  const bloco = derivarBloco(time, endTime || undefined);
  const turno = derivarTurno(time);
  const duracao = endTime ? formatarDuracao(time, endTime) : "";

  const partes = [
    SHIFT_LABELS[turno],
    duracao,
    `bloco de ${TIME_BLOCK_LABELS[bloco].toLowerCase()}`,
  ].filter(Boolean);

  return (
    <p className="text-[13px] font-light text-ink-faint">
      Entra como{" "}
      <span className="font-medium text-ink-muted">{partes.join(" · ")}</span>.
    </p>
  );
}
