interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;

  label: string;
  disabled?: boolean;
}

export function Checkbox({
  checked,
  onChange,
  label,
  disabled = false,
}: CheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="group -m-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-pill disabled:cursor-not-allowed disabled:opacity-30"
    >
      <span
        className={
          "flex h-[18px] w-[18px] items-center justify-center rounded-pill border-[1.5px] transition-colors " +
          (checked
            ? "border-ink bg-ink"
            : "border-hairline-strong bg-surface group-hover:border-ink-muted")
        }
      >
        <svg
          viewBox="0 0 16 16"
          aria-hidden="true"
          className={
            "h-2.5 w-2.5 transition-transform duration-150 " +
            (checked ? "scale-100" : "scale-0")
          }
        >
          <path
            d="M3.5 8.5l3 3 6-6.5"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </button>
  );
}
