import { useState, useCallback, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BranchProvider, useBranch } from './context/BranchContext';
import { LoginPortal } from './pages/LoginPortal';
import { PublicPortal } from './pages/PublicPortal';
import { DashboardLayout } from './pages/DashboardLayout';

function AppContent() {
  const { currentPath, navigateTo, isAdminAuth, isOwnerAuth, login } = useAuth();
  const { branches, onWalkinSubmit, onBookingSubmit } = useBranch();

  // Redirect and route guards
  useEffect(() => {
    if (currentPath === '/admin') {
      navigateTo('/admin/dashboard');
    } else if (currentPath === '/owner') {
      navigateTo('/owner/dashboard');
    } else if (currentPath.startsWith('/admin') && !isAdminAuth) {
      Promise.resolve().then(() => navigateTo('/login'));
    } else if (currentPath.startsWith('/owner') && !isOwnerAuth) {
      Promise.resolve().then(() => navigateTo('/login'));
    } else if (currentPath === '/login') {
      if (isOwnerAuth) {
        Promise.resolve().then(() => navigateTo('/owner/dashboard'));
      } else if (isAdminAuth) {
        Promise.resolve().then(() => navigateTo('/admin/dashboard'));
      }
    }
  }, [currentPath, isAdminAuth, isOwnerAuth, navigateTo]);

  // Login local state (encapsulated locally instead of polluting global state)
  const [username, setUsername] = useState('');
  const [passcode, setPasscode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLoginSubmit = useCallback(async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    setErrorMsg('');
    const result = await login(username, passcode);
    setIsLoggingIn(false);
    if (!result.success) {
      setErrorMsg(result.error || 'Invalid credentials.');
    } else {
      setUsername('');
      setPasscode('');
    }
  }, [login, username, passcode, isLoggingIn]);

  // Public portal active tab state
  const [publicActiveTab, setPublicActiveTab] = useState(() => {
    const saved = sessionStorage.getItem('activeTab_public');
    return saved || 'public-home';
  });

  const setPublicTab = useCallback((tab: string) => {
    setPublicActiveTab(tab);
    sessionStorage.setItem('activeTab_public', tab);
  }, []);

  if (currentPath === '/login') {
    return (
      <LoginPortal
        currentPath={currentPath}
        username={username}
        setUsername={setUsername}
        passcode={passcode}
        setPasscode={setPasscode}
        errorMsg={errorMsg}
        handleLogin={handleLoginSubmit}
        isLoggingIn={isLoggingIn}
        navigateTo={navigateTo}
      />
    );
  }

  if (currentPath.startsWith('/admin') && !isAdminAuth) {
    return null;
  }

  if (currentPath.startsWith('/owner') && !isOwnerAuth) {
    return null;
  }

  const roleMode = currentPath.startsWith('/owner')
    ? 'owner'
    : currentPath.startsWith('/admin')
      ? 'admin'
      : 'public';

  if (roleMode === 'public') {
    return (
      <PublicPortal
        activeTab={publicActiveTab}
        setActiveTab={setPublicTab}
        branches={branches}
        navigateTo={navigateTo}
        onPublicWalkinSubmit={onWalkinSubmit}
        onPublicBookingSubmit={onBookingSubmit}
      />
    );
  }

  return <DashboardLayout />;
}

function App() {
  return (
    <AuthProvider>
      <BranchProvider>
        <AppContent />
      </BranchProvider>
    </AuthProvider>
  );
}

export default App;
