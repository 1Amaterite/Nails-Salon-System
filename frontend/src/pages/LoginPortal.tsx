import { User, Lock } from 'lucide-react';

interface LoginPortalProps {
  currentPath: string;
  username: string;
  setUsername: (u: string) => void;
  passcode: string;
  setPasscode: (p: string) => void;
  errorMsg: string;
  handleLogin: (role: 'admin' | 'owner') => void;
  navigateTo: (path: string) => void;
}

export function LoginPortal({
  currentPath,
  username,
  setUsername,
  passcode,
  setPasscode,
  errorMsg,
  handleLogin,
  navigateTo
}: LoginPortalProps) {
  const isOwner = currentPath === '/owner';
  const role: 'admin' | 'owner' = isOwner ? 'owner' : 'admin';

  return (
    <div className="login-container">
      <div className="outer-bezel login-card" style={{ maxWidth: '440px', width: '100%', margin: '40px auto' }}>
        <div className="inner-core">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <span className="micro-badge">Secure Gateway</span>
          </div>
          
          <h2 style={{ fontFamily: 'var(--font-serif)', color: 'var(--accent)', textAlign: 'center', fontSize: '28px', fontWeight: 700, margin: '0 0 8px 0', letterSpacing: '-0.3px' }}>
            {isOwner ? 'Owner Headquarters' : 'Admin Workspace'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', textAlign: 'center', margin: '0 0 28px 0', lineHeight: 1.5 }}>
            {isOwner 
              ? 'Access requires verified business owner credentials.' 
              : 'Verify administrative credentials to open the salon panel.'}
          </p>

          <form onSubmit={(e) => { e.preventDefault(); handleLogin(role); }} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px', fontWeight: 600, color: 'var(--text-secondary)' }}>Username</label>
              <div className="input-with-icon-wrapper">
                <User size={16} className="input-icon" />
                <input 
                  type="text" 
                  placeholder={isOwner ? "e.g. owner" : "e.g. admin"} 
                  value={username} 
                  onChange={e => setUsername(e.target.value)} 
                  required 
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px', fontWeight: 600, color: 'var(--text-secondary)' }}>Passcode</label>
              <div className="input-with-icon-wrapper">
                <Lock size={16} className="input-icon" />
                <input 
                  type="password" 
                  placeholder="••••" 
                  value={passcode} 
                  onChange={e => setPasscode(e.target.value)} 
                  required 
                  style={{ letterSpacing: '4px' }}
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

            <button type="button" onClick={() => navigateTo('/')} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '13.5px', textDecoration: 'underline', marginTop: '4px', textAlign: 'center', display: 'block', margin: '0 auto' }}>
              ← Back to Public Website
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
