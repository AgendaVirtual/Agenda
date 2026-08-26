import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "ghost-danger" | "danger";
type Size = "md" | "sm";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  children: ReactNode;
}

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-soft font-medium " +
  "transition-colors disabled:cursor-not-allowed disabled:opacity-30";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-ink text-white hover:bg-ink-strong active:opacity-90",

  secondary: "bg-sidebar text-ink hover:bg-[#e9e6e1] active:bg-[#e2ded8]",
  ghost: "text-ink-muted hover:bg-canvas hover:text-ink active:bg-canvas",

  "ghost-danger":
    "text-ink-muted hover:bg-danger-soft hover:text-danger active:bg-[#fbd8d8]",
  danger: "bg-danger-soft text-danger hover:bg-[#fbd8d8] active:bg-[#f7c9c9]",
};

const SIZES: Record<Size, string> = {
  md: "h-11 px-5 text-sm lg:h-10",
  sm: "h-11 px-3.5 text-sm lg:h-10",
};

export function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${fullWidth ? "w-full" : ""} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  children: ReactNode;
}

export function IconButton({
  label,
  className = "",
  children,
  ...rest
}: IconButtonProps) {
  return (
    <button
      aria-label={label}
      title={label}
      className={
        "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-soft " +
        "text-ink-muted transition-colors hover:bg-ink/5 hover:text-ink " +
        "active:bg-ink/10 disabled:cursor-not-allowed disabled:opacity-30 " +
        className
      }
      {...rest}
    >
      {children}
    </button>
  );
}
