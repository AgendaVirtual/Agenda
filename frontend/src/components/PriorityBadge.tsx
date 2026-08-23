import { TaskPriority } from "../types/enums";

const STYLES: Record<TaskPriority, string> = {
  [TaskPriority.ALTA]: "bg-red-100 text-red-700",
  [TaskPriority.MEDIA]: "bg-amber-100 text-amber-700",
  [TaskPriority.BAIXA]: "bg-emerald-100 text-emerald-700",
};

const LABELS: Record<TaskPriority, string> = {
  [TaskPriority.ALTA]: "Alta",
  [TaskPriority.MEDIA]: "Média",
  [TaskPriority.BAIXA]: "Baixa",
};

interface PriorityBadgeProps {
  priority: TaskPriority;
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STYLES[priority]}`}
    >
      {LABELS[priority]}
    </span>
  );
}
