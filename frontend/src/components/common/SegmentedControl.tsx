

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
    <div
      style={{
        display: 'flex',
        backgroundColor: 'rgba(190, 24, 93, 0.04)',
        padding: '4px',
        borderRadius: '8px',
        border: '1px solid var(--border-color)',
      }}
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          style={{
            padding: '6px 16px',
            borderRadius: '6px',
            border: 'none',
            background: value === opt.value ? 'var(--accent)' : 'transparent',
            color: value === opt.value ? '#FFFFFF' : 'var(--text-secondary)',
            fontWeight: 600,
            fontSize: '13px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            fontFamily: 'var(--font-sans)',
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
