import { Scissors } from 'lucide-react';
import type { Branch } from '../../types';

interface ServicesTabProps {
  branches: Branch[];
}

export function ServicesTab({ branches }: ServicesTabProps) {
  const services = branches[0]?.services || [];

  return (
    <div className="glass-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h3 style={{ color: 'var(--accent)', marginTop: 0, fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 600 }}>Service Pricing & Catalog Setup</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>Configure nail treatments, buffer durations, and custom technician categories.</p>
        </div>
      </div>

      {services.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px', marginTop: '20px' }}>
          {services.map((s: any) => (
            <div key={s.id} className="data-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <h4 style={{ fontWeight: 600, fontSize: '16px', color: 'var(--text-primary)', margin: 0 }}>{s.name}</h4>
                <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--font-serif)' }}>
                  ${parseFloat(s.price).toFixed(2)}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span className="micro-badge" style={{ fontSize: '9px', padding: '4px 10px' }}>{s.category || 'Nails'}</span>
                <span className="micro-badge" style={{ fontSize: '9px', padding: '4px 10px', backgroundColor: 'rgba(190, 24, 93, 0.04)', color: 'var(--text-secondary)' }}>
                  {s.durationMinutes} mins
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state-card">
          <div style={{ backgroundColor: 'var(--accent-glow)', padding: '16px', borderRadius: '50%', color: 'var(--accent)', marginBottom: '8px' }}>
            <Scissors size={32} />
          </div>
          <div className="empty-state-title">No service catalogs initialized</div>
          <div className="empty-state-desc">Services configure pricing models and display correctly in our guest portal templates.</div>
        </div>
      )}
    </div>
  );
}
