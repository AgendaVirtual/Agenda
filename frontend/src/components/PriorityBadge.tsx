import { TaskPriority } from "../types/enums";
import { PRIORITY_LABELS, PRIORITY_TONES } from "../utils/labels";
import { Badge } from "./ui/Badge";

interface PriorityBadgeProps {
  priority: TaskPriority;
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  if (priority === TaskPriority.BAIXA) return null;

  return (
    <Badge tone={PRIORITY_TONES[priority]}>{PRIORITY_LABELS[priority]}</Badge>
  );
}
