import { useState, useEffect, useRef } from 'react';
import { time24to12, time12to24, generateTimeOptions } from '../../utils/time';

interface TimeSelect12HourProps {
  label: string;
  value24: string;
  onChange: (newValue24: string) => void;
  relativeTo24?: string;
}

export function TimeSelect12Hour({
  label,
  value24,
  onChange,
  relativeTo24,
}: TimeSelect12HourProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const timeOptions = generateTimeOptions();
  const currentValue12 = time24to12(value24);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && listRef.current) {
      const activeItem = listRef.current.querySelector('[data-active="true"]');
      if (activeItem) activeItem.scrollIntoView({ block: 'nearest' });
    }
  }, [isOpen]);

  const handleSelect = (opt: string) => {
    onChange(time12to24(opt));
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} style={{ width: '100%', position: 'relative' }}>
      <span
        style={{
          fontSize: '10.5px',
          color: 'var(--text-secondary)',
          display: 'block',
          marginBottom: '4px',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.02em',
        }}
      >
        {label}
      </span>
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          height: '32px',
          fontSize: '11.5px',
          padding: '0 8px',
          borderRadius: '6px',
          border: '1px solid rgba(190, 24, 93, 0.15)',
          backgroundColor: 'white',
          color: 'var(--text-primary)',
          cursor: 'pointer',
          width: '100%',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
          userSelect: 'none',
          position: 'relative',
        }}
      >
        <span>{currentValue12}</span>
        <span
          style={{
            fontSize: '9px',
            color: 'var(--text-secondary)',
            transition: 'transform 0.2s',
            transform: isOpen ? 'rotate(180deg)' : 'none',
          }}
        >
          ▼
        </span>
      </div>

      {isOpen && (
        <div
          ref={listRef}
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '155px',
            maxHeight: '180px',
            overflowY: 'auto',
            backgroundColor: 'white',
            border: '1px solid rgba(190, 24, 93, 0.15)',
            borderRadius: '8px',
            boxShadow: '0 10px 25px rgba(190, 24, 93, 0.12)',
            zIndex: 1000,
            padding: '4px',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
          }}
        >
          {timeOptions.map((opt) => {
            const opt24 = time12to24(opt);
            const isSelected = opt24 === value24;

            let durationLabel = '';
            if (relativeTo24) {
              const startParts = relativeTo24.split(':').map(Number);
              const endParts = opt24.split(':').map(Number);
              const startTotal = startParts[0] * 60 + startParts[1];
              const endTotal = endParts[0] * 60 + endParts[1];
              const diff = endTotal - startTotal;
              if (diff > 0) {
                const h = Math.floor(diff / 60);
                const m = diff % 60;
                if (h > 0 && m > 0) durationLabel = `(${h}h ${m}m)`;
                else if (h > 0) durationLabel = `(${h}h)`;
                else durationLabel = `(${m}m)`;
              }
            }

            return (
              <div
                key={opt}
                data-active={isSelected}
                onClick={() => handleSelect(opt)}
                style={{
                  padding: '6px 8px',
                  borderRadius: '4px',
                  backgroundColor: isSelected ? 'rgba(190, 24, 93, 0.08)' : 'transparent',
                  color: isSelected ? 'var(--accent)' : 'var(--text-primary)',
                  fontSize: '11px',
                  fontWeight: isSelected ? 600 : 500,
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'background-color 0.1s',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected)
                    e.currentTarget.style.backgroundColor = 'rgba(190, 24, 93, 0.03)';
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <span>{opt}</span>
                {durationLabel && (
                  <span
                    style={{
                      fontSize: '9px',
                      color: 'var(--text-secondary)',
                      marginLeft: '4px',
                      fontWeight: 400,
                    }}
                  >
                    {durationLabel}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
