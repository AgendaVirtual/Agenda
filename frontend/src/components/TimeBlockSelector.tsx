import { Shift, TimeBlockType } from "../types/enums";

export interface TimeBlockValue {
  timeBlockType: TimeBlockType;
  time?: string;
  shift?: Shift;
}

interface TimeBlockSelectorProps {
  value: TimeBlockValue;
  onChange: (value: TimeBlockValue) => void;
}

const TYPE_LABELS: Record<TimeBlockType, string> = {
  [TimeBlockType.MEIA_HORA]: "Meia hora",
  [TimeBlockType.UMA_HORA]: "Uma hora",
  [TimeBlockType.TURNO]: "Turno",
};

const SHIFT_LABELS: Record<Shift, string> = {
  [Shift.MANHA]: "Manhã",
  [Shift.TARDE]: "Tarde",
  [Shift.NOITE]: "Noite",
};

export function TimeBlockSelector({ value, onChange }: TimeBlockSelectorProps) {
  function handleTypeChange(timeBlockType: TimeBlockType) {
    if (timeBlockType === TimeBlockType.TURNO) {
      onChange({ timeBlockType, shift: value.shift ?? Shift.MANHA, time: undefined });
    } else {
      onChange({ timeBlockType, time: value.time, shift: undefined });
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1 rounded-md bg-slate-100 p-1">
        {Object.values(TimeBlockType).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => handleTypeChange(type)}
            className={`flex-1 rounded px-2 py-1 text-xs font-medium transition ${
              value.timeBlockType === type
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {TYPE_LABELS[type]}
          </button>
        ))}
      </div>

      {value.timeBlockType === TimeBlockType.TURNO ? (
        <select
          value={value.shift ?? Shift.MANHA}
          onChange={(e) =>
            onChange({ ...value, shift: e.target.value as Shift })
          }
          className="rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
        >
          {Object.values(Shift).map((shift) => (
            <option key={shift} value={shift}>
              {SHIFT_LABELS[shift]}
            </option>
          ))}
        </select>
      ) : (
        <input
          type="time"
          value={value.time ?? ""}
          onChange={(e) => onChange({ ...value, time: e.target.value })}
          className="rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
        />
      )}
    </div>
  );
}
