export function TabSkeleton() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        animation: 'pulse 1.5s infinite ease-in-out',
        width: '100%',
      }}
    >
      {/* Header Skeleton */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div
          style={{
            height: '28px',
            width: '200px',
            backgroundColor: 'var(--border-color)',
            borderRadius: '6px',
          }}
        />
        <div
          style={{
            height: '16px',
            width: '350px',
            backgroundColor: 'var(--border-color)',
            borderRadius: '4px',
          }}
        />
      </div>

      {/* Main Card Skeleton */}
      <div
        className="glass-panel"
        style={{
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          minHeight: '200px',
        }}
      >
        <div
          style={{
            height: '20px',
            width: '150px',
            backgroundColor: 'var(--border-color)',
            borderRadius: '4px',
          }}
        />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div
            style={{ height: '40px', backgroundColor: 'var(--border-color)', borderRadius: '6px' }}
          />
          <div
            style={{ height: '40px', backgroundColor: 'var(--border-color)', borderRadius: '6px' }}
          />
        </div>
        <div
          style={{ height: '80px', backgroundColor: 'var(--border-color)', borderRadius: '8px' }}
        />
      </div>

      <style>{`
        @keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 1; }
          100% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
