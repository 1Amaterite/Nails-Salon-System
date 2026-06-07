import { Search } from 'lucide-react';

export interface SearchBarProps {
  /** Current search string value (controlled). */
  value: string;
  /** Callback fired on every keystroke. */
  onChange: (value: string) => void;
  /** Placeholder text shown when the input is empty. */
  placeholder?: string;
  /** CSS max-width for the wrapper element. Default: '400px'. */
  maxWidth?: string | number;
}

/**
 * Search input with a leading magnifier icon.
 * Uses the existing `input-with-icon-wrapper` / `input-icon` CSS classes
 * so it integrates seamlessly with the design system.
 */
export function SearchBar({
  value,
  onChange,
  placeholder = 'Search...',
  maxWidth = '400px',
}: SearchBarProps) {
  return (
    <div className="input-with-icon-wrapper" style={{ maxWidth }}>
      <Search size={18} className="input-icon" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
