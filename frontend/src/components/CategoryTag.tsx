import type { Category } from "../types/entities";

interface CategoryTagProps {
  category?: Category;
}

export function CategoryTag({ category }: CategoryTagProps) {
  if (!category) {
    return (
      <span className="text-[13px] font-medium text-ink-faint">
        Sem categoria
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1.5 text-[13px] font-medium text-ink-muted">
      <span
        aria-hidden="true"
        className="h-[7px] w-[7px] shrink-0 rounded-pill"
        style={{ backgroundColor: category.color }}
      />
      {category.name}
    </span>
  );
}
