import { TaskStatus } from "../types/enums";
import { TASK_STATUS_LABELS } from "../utils/labels";
import { SelectInput } from "./ui/Field";

interface StatusSelectorProps {
  value: TaskStatus;
  onChange: (status: TaskStatus) => void;

  taskDescription?: string;
}

export function StatusSelector({
  value,
  onChange,
  taskDescription,
}: StatusSelectorProps) {
  return (
    <SelectInput
      aria-label={
        taskDescription ? `Status da tarefa: ${taskDescription}` : "Status"
      }
      fullWidth={false}
      controlSize="sm"
      variant="subtle"
      value={value}
      onChange={(e) => onChange(e.target.value as TaskStatus)}
      className="min-w-0 flex-1 sm:flex-none"
    >
      {Object.values(TaskStatus).map((status) => (
        <option key={status} value={status}>
          {TASK_STATUS_LABELS[status]}
        </option>
      ))}
    </SelectInput>
  );
}
