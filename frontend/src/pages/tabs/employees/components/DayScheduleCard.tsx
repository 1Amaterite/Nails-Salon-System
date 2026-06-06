import { X } from 'lucide-react';
import { TimeSelect12Hour } from '../../../../components/common/TimeSelect12Hour';

interface LocalSchedule {
  dayOfWeek: number;
  startTime: string | null;
  endTime: string | null;
  isOff: boolean;
}

interface DayScheduleCardProps {
  idx: number;
  dayName: string;
  daySched: LocalSchedule;
  onChange: (idx: number, updated: LocalSchedule) => void;
  onClear: (idx: number) => void;
}

const PRESETS = [
  { key: 'morning', label: 'Morning (9-1)', start: '09:00', end: '13:00' },
  { key: 'afternoon', label: 'Afternoon (1-5)', start: '13:00', end: '17:00' },
  { key: 'full', label: 'Full Day (9-5)', start: '09:00', end: '17:00' },
];

export function DayScheduleCard({
  idx,
  dayName,
  daySched,
  onChange,
  onClear,
}: DayScheduleCardProps) {
  return (
    <div
      style={{
        padding: '14px 10px',
        borderRadius: '10px',
        backgroundColor: 'var(--bg-secondary)',
        border: `1px solid ${daySched.isOff ? 'var(--border-color)' : 'rgba(190, 24, 93, 0.15)'}`,
        boxShadow: daySched.isOff ? 'none' : '0 4px 12px rgba(190, 24, 93, 0.03)',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        alignItems: 'stretch',
        minWidth: '100px',
      }}
    >
      {/* Day header */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '8px',
          paddingLeft: '16px',
          paddingRight: '16px',
          width: '100%',
        }}
      >
        <span
          title={dayName}
          style={{
            fontWeight: 600,
            fontSize: '13.5px',
            color: 'var(--text-primary)',
            maxWidth: 'calc(100% - 20px)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: 'inline-block',
          }}
        >
          {dayName}
        </span>

        {!daySched.isOff && (
          <button
            type="button"
            onClick={() => onClear(idx)}
            title="Remove hours"
            style={{
              position: 'absolute',
              right: '0px',
              top: '50%',
              transform: 'translateY(-50%)',
              marginTop: '-4px',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#b91c1c';
              e.currentTarget.style.backgroundColor = 'rgba(185, 28, 28, 0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-secondary)';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Day content */}
      {daySched.isOff ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flexGrow: 1 }}>
          <div
            onClick={() => {
              onChange(idx, {
                dayOfWeek: idx,
                startTime: '09:00',
                endTime: '17:00',
                isOff: false,
              });
            }}
            style={{
              border: '1.5px dashed rgba(190, 24, 93, 0.25)',
              borderRadius: '8px',
              padding: '24px 8px',
              textAlign: 'center',
              cursor: 'pointer',
              backgroundColor: 'transparent',
              transition: 'all 0.2s ease-in-out',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              flexGrow: 1,
              minHeight: '100px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(190, 24, 93, 0.04)';
              e.currentTarget.style.borderColor = 'rgba(190, 24, 93, 0.45)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = 'rgba(190, 24, 93, 0.25)';
            }}
          >
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent)' }}>
              + Add Hours
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              marginTop: 'auto',
            }}
          >
            {PRESETS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => {
                  onChange(idx, {
                    dayOfWeek: idx,
                    startTime: p.start,
                    endTime: p.end,
                    isOff: false,
                  });
                }}
                style={{
                  padding: '5px 2px',
                  width: '100%',
                  borderRadius: '4px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'transparent',
                  color: 'var(--text-secondary)',
                  fontSize: '9px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(190, 24, 93, 0.03)';
                  e.currentTarget.style.borderColor = 'rgba(190, 24, 93, 0.2)';
                  e.currentTarget.style.color = 'var(--accent)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                {p.label.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            flexGrow: 1,
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <TimeSelect12Hour
              label="Start"
              value24={daySched.startTime || '09:00'}
              onChange={(val) => {
                onChange(idx, { ...daySched, startTime: val });
              }}
            />
            <TimeSelect12Hour
              label="End"
              value24={daySched.endTime || '17:00'}
              relativeTo24={daySched.startTime || undefined}
              onChange={(val) => {
                onChange(idx, { ...daySched, endTime: val });
              }}
            />
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              marginTop: '10px',
            }}
          >
            {PRESETS.map((p) => {
              const isPresetSelected = daySched.startTime === p.start && daySched.endTime === p.end;
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => {
                    onChange(idx, { ...daySched, startTime: p.start, endTime: p.end });
                  }}
                  style={{
                    padding: '5px 2px',
                    width: '100%',
                    borderRadius: '4px',
                    border:
                      '1px solid ' +
                      (isPresetSelected ? 'rgba(190, 24, 93, 0.4)' : 'var(--border-color)'),
                    backgroundColor: isPresetSelected ? 'rgba(190, 24, 93, 0.08)' : 'transparent',
                    color: isPresetSelected ? 'var(--accent)' : 'var(--text-secondary)',
                    fontSize: '9px',
                    fontWeight: isPresetSelected ? 600 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {p.label.split(' ')[0]}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
