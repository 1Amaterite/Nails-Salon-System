import { User, Lock } from 'lucide-react';

interface LoginPortalProps {
  currentPath?: string;
  username: string;
  setUsername: (u: string) => void;
  passcode: string;
  setPasscode: (p: string) => void;
  errorMsg: string;
  handleLogin: () => void;
  navigateTo: (path: string) => void;
}

export function LoginPortal({
  username,
  setUsername,
  passcode,
  setPasscode,
  errorMsg,
  handleLogin,
  navigateTo
}: LoginPortalProps) {
  return (
    <div className="login-container">
      <div style={{
        maxWidth: '440px',
        width: '100%',
        position: 'relative',
        zIndex: 10,
      }}>
        <div className="outer-bezel">
          <div className="inner-core">
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
              <span className="micro-badge">Secure Gateway</span>
            </div>

            <h2 style={{ fontFamily: 'var(--font-serif)', color: 'var(--accent)', textAlign: 'center', fontSize: '28px', fontWeight: 700, margin: '0 0 8px 0', letterSpacing: '-0.3px' }}>
              Management Portal
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', textAlign: 'center', margin: '0 0 28px 0', lineHeight: 1.5 }}>
              Verify administrative or owner credentials to open the salon dashboard.
            </p>

            <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label htmlFor="username-input" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Username
                </label>
                <div className="input-with-icon-wrapper">
                  <User size={16} className="input-icon" />
                  <input
                    id="username-input"
                    name="username"
                    type="text"
                    placeholder="e.g. admin or owner"
                    value={username}
                    onChange={e => setUsername(e.target.value.replace(/@/g, ''))}
                    autoComplete="username"
                    required
                    style={{ position: 'relative', zIndex: 1 }}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="current-password" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Passcode
                </label>
                <div className="input-with-icon-wrapper">
                  <Lock size={16} className="input-icon" />
                  <input
                    id="current-password"
                    name="password"
                    type="password"
                    placeholder="••••"
                    value={passcode}
                    onChange={e => setPasscode(e.target.value)}
                    autoComplete="current-password"
                    required
                    style={{ letterSpacing: '4px', position: 'relative', zIndex: 1 }}
                  />
                </div>
              </div>

              {errorMsg && (
                <div style={{ color: '#b91c1c', fontSize: '13px', textAlign: 'center', backgroundColor: '#fee2e2', padding: '10px', borderRadius: '6px', border: '1px solid #fecaca' }}>
                  {errorMsg}
                </div>
              )}

              <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '8px' }}>
                Authenticate
              </button>

              <button
                type="button"
                onClick={() => navigateTo('/')}
                style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '13.5px', textDecoration: 'underline', textAlign: 'center', display: 'block', margin: '0 auto' }}
              >
                ← Back to Public Website
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
