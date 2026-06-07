export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedControlProps<T extends string> {
  /** Array of selectable options in display order. */
  options: SegmentedOption<T>[];
  /** Currently active option value. */
  value: T;
  /** Callback fired when the user selects a different option. */
  onChange: (value: T) => void;
}

/**
 * Pill-style segmented control used for category / role filtering.
 * The active option is highlighted with the accent colour; inactive
 * options use transparent backgrounds with muted text.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <div className="segmented-control">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`segmented-control-btn ${value === opt.value ? 'active' : ''}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
