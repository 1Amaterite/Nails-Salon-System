import React from 'react';

export interface LoadingSpinnerProps {
  /** Size preset for the spinner. Defaults to 'md'. */
  size?: 'sm' | 'md' | 'lg';
  /** Optional custom color for the spinner. Defaults to accent color. */
  color?: string;
  /** Style override for the spinner element. */
  style?: React.CSSProperties;
}

/**
 * A standard, high-performance loading spinner utilizing CSS animations.
 */
export function LoadingSpinner({
  size = 'md',
  color = 'var(--accent)',
  style,
}: LoadingSpinnerProps) {
  const dimensions = size === 'sm' ? '12px' : size === 'lg' ? '40px' : '24px';
  const stroke = size === 'sm' ? '2px' : '4px';

  return (
    <div
      style={{
        width: dimensions,
        height: dimensions,
        border: `${stroke} solid ${color}4d`, // 30% opacity overlay border
        borderRadius: '50%',
        borderTopColor: color,
        animation: 'spin 1s linear infinite',
        display: 'inline-block',
        boxSizing: 'border-box',
        ...style,
      }}
    />
  );
}
