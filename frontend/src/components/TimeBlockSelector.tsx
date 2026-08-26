import { Shift, TimeBlockType } from "../types/enums";
import { SHIFT_LABELS, TIME_BLOCK_LABELS } from "../utils/labels";
import { SelectInput, TextInput } from "./ui/Field";

export interface TimeBlockValue {
  timeBlockType: TimeBlockType;
  time?: string;
  shift?: Shift;
}

interface TimeBlockSelectorProps {
  value: TimeBlockValue;
  onChange: (value: TimeBlockValue) => void;
}

export function TimeBlockSelector({ value, onChange }: TimeBlockSelectorProps) {
  function handleTypeChange(timeBlockType: TimeBlockType) {
    if (timeBlockType === TimeBlockType.TURNO) {
      onChange({
        timeBlockType,
        shift: value.shift ?? Shift.MANHA,
        time: undefined,
      });
    } else {
      onChange({ timeBlockType, time: value.time, shift: undefined });
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1 rounded-md bg-canvas p-1">
        {Object.values(TimeBlockType).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => handleTypeChange(type)}
            className={`h-11 flex-1 rounded-sm px-2 text-sm font-medium transition ${
              value.timeBlockType === type
                ? "bg-surface text-ink shadow-sm"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            {TIME_BLOCK_LABELS[type]}
          </button>
        ))}
      </div>

      {value.timeBlockType === TimeBlockType.TURNO ? (
        <SelectInput
          value={value.shift ?? Shift.MANHA}
          onChange={(e) =>
            onChange({ ...value, shift: e.target.value as Shift })
          }
          className="h-11 text-sm"
        >
          {Object.values(Shift).map((shift) => (
            <option key={shift} value={shift}>
              {SHIFT_LABELS[shift]}
            </option>
          ))}
        </SelectInput>
      ) : (
        <TextInput
          type="time"
          value={value.time ?? ""}
          onChange={(e) => onChange({ ...value, time: e.target.value })}
          className="h-11 text-sm"
        />
      )}
    </div>
  );
}
