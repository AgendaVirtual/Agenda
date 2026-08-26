import { useId } from "react";
import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

const CONTROL =
  "rounded-soft border px-3.5 text-base text-ink lg:text-[15px] " +
  "transition-[background-color,border-color,box-shadow] " +
  "placeholder:text-ink-muted " +
  "focus:outline-none focus:ring-[3px] focus:ring-accent/10 " +
  "disabled:cursor-not-allowed disabled:bg-canvas disabled:opacity-50";

type ControlSize = "md" | "sm";

const SIZES: Record<ControlSize, string> = {
  md: "h-11",
  sm: "h-11 px-3 text-base lg:h-10 lg:text-sm",
};

type ControlVariant = "bordered" | "subtle";

function borderFor(invalid?: boolean, variant: ControlVariant = "bordered") {
  if (invalid) {
    return "border-danger focus:border-danger focus:ring-danger/10";
  }

  return variant === "subtle"
    ? "border-transparent bg-transparent hover:border-hairline hover:bg-surface focus:border-accent focus:bg-surface"
    : "border-transparent bg-canvas focus:border-accent focus:bg-surface";
}

interface FieldProps {
  label: string;
  hint?: string;
  error?: string;
  children: (id: string, invalid: boolean) => ReactNode;
  className?: string;
}

export function Field({
  label,
  hint,
  error,
  children,
  className = "",
}: FieldProps) {
  const id = useId();
  const invalid = Boolean(error);

  return (
    <div className={`flex flex-col ${className}`}>
      <label
        htmlFor={id}
        className="mb-1.5 text-[13px] font-medium text-ink-muted"
      >
        {label}
      </label>
      {children(id, invalid)}
      {error ? (
        <p className="mt-1.5 text-[13px] font-light text-danger">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-[13px] font-light text-ink-muted">{hint}</p>
      ) : null}
    </div>
  );
}

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;

  fullWidth?: boolean;

  controlSize?: ControlSize;

  variant?: ControlVariant;
}

export function TextInput({
  invalid,
  fullWidth = true,
  controlSize = "md",
  variant = "bordered",
  className = "",
  ...rest
}: TextInputProps) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={`${CONTROL} ${SIZES[controlSize]} ${borderFor(invalid, variant)} ${
        fullWidth ? "w-full" : ""
      } ${className}`}
      {...rest}
    />
  );
}

interface SelectInputProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
  fullWidth?: boolean;

  controlSize?: ControlSize;

  variant?: ControlVariant;
}

export function SelectInput({
  invalid,
  fullWidth = true,
  controlSize = "md",
  variant = "bordered",
  className = "",
  children,
  ...rest
}: SelectInputProps) {
  return (
    <select
      aria-invalid={invalid || undefined}
      className={`${CONTROL} ${SIZES[controlSize]} ${borderFor(invalid, variant)} ${
        fullWidth ? "w-full" : ""
      } cursor-pointer ${className}`}
      {...rest}
    >
      {children}
    </select>
  );
}

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export function TextArea({ invalid, className = "", ...rest }: TextAreaProps) {
  return (
    <textarea
      aria-invalid={invalid || undefined}
      className={
        `min-h-[96px] w-full rounded-sm border bg-surface p-4 text-base font-light ` +
        `text-ink transition-shadow placeholder:text-ink-muted ` +
        `focus:outline-none focus:ring-[3px] focus:ring-accent/10 ` +
        `${borderFor(invalid)} ${className}`
      }
      {...rest}
    />
  );
}
