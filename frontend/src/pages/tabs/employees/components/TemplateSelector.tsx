import { useState } from 'react';

interface TemplateSelectorProps {
  onApplyStandardWeek: () => void;
  onApplyAllOff: () => void;
}

export function TemplateSelector({ onApplyStandardWeek, onApplyAllOff }: TemplateSelectorProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setShowDropdown(!showDropdown)}
        style={{
          padding: '8px 16px',
          borderRadius: '6px',
          border: '1px solid var(--border-color)',
          backgroundColor: 'white',
          color: 'var(--text-primary)',
          fontSize: '13px',
          fontWeight: 500,
          cursor: 'pointer',
          height: '38px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}
      >
        <span>Schedule Templates</span>
        <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>▼</span>
      </button>
      {showDropdown && (
        <>
          <div
            onClick={() => setShowDropdown(false)}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 998 }}
          />
          <div
            style={{
              position: 'absolute',
              top: '44px',
              right: 0,
              backgroundColor: 'white',
              border: '1px solid rgba(190, 24, 93, 0.1)',
              borderRadius: '8px',
              boxShadow:
                '0 10px 25px -5px rgba(190, 24, 93, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
              width: '240px',
              zIndex: 999,
              padding: '4px',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
            }}
          >
            {[
              { label: 'Standard Week (Mon-Fri 9-5)', action: onApplyStandardWeek },
              { label: 'Set All Off-Duty', action: onApplyAllOff },
            ].map((item, idx) => (
              <button
                key={idx}
                type="button"
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => {
                  item.action();
                  setShowDropdown(false);
                }}
                style={{
                  padding: '10px 12px',
                  border: 'none',
                  backgroundColor: hoveredIndex === idx ? 'rgba(190, 24, 93, 0.06)' : 'transparent',
                  color: hoveredIndex === idx ? 'var(--accent)' : 'var(--text-primary)',
                  fontSize: '13px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  borderRadius: '6px',
                  transition: 'all 0.15s',
                  fontWeight: 500,
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
