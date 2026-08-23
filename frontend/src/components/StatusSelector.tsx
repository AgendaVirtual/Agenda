import { TaskStatus } from "../types/enums";

const LABELS: Record<TaskStatus, string> = {
  [TaskStatus.PENDENTE]: "Pendente",
  [TaskStatus.EXECUTADA]: "Executada",
  [TaskStatus.PARCIALMENTE_EXECUTADA]: "Parcialmente executada",
  [TaskStatus.CANCELADA]: "Cancelada",
  [TaskStatus.ADIADA]: "Adiada",
};

interface StatusSelectorProps {
  value: TaskStatus;
  onChange: (status: TaskStatus) => void;
}

export function StatusSelector({ value, onChange }: StatusSelectorProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as TaskStatus)}
      className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 focus:border-indigo-500 focus:outline-none"
    >
      {Object.values(TaskStatus).map((status) => (
        <option key={status} value={status}>
          {LABELS[status]}
        </option>
      ))}
    </select>
  );
}
