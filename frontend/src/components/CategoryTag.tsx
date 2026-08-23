import type { Category } from "../types/entities";

interface CategoryTagProps {
  category?: Category;
}

// Placeholder simples até a Pessoa 6 (Frontend) entregar a versão definitiva
// com ColorPicker e biblioteca de componentes compartilhada.
export function CategoryTag({ category }: CategoryTagProps) {
  if (!category) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
        Sem categoria
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ backgroundColor: `${category.color}1a`, color: category.color }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: category.color }}
      />
      {category.name}
    </span>
  );
}
