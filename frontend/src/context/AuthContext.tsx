import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { fetchWithTimeout } from '../utils/api';
import { getApiUrl } from '../utils/getApiUrl';

interface AuthContextType {
  isAdminAuth: boolean;
  isOwnerAuth: boolean;
  employeeRole: string;
  token: string | null;
  currentPath: string;
  navigateTo: (path: string) => void;
  login: (username: string, passcode: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [isAdminAuth, setIsAdminAuth] = useState(
    () => sessionStorage.getItem('isAdminAuth') === 'true'
  );
  const [isOwnerAuth, setIsOwnerAuth] = useState(
    () => sessionStorage.getItem('isOwnerAuth') === 'true'
  );
  const [employeeRole, setEmployeeRoleState] = useState(
    () => sessionStorage.getItem('employeeRole') || ''
  );
  const [token, setToken] = useState<string | null>(() => {
    return sessionStorage.getItem('ownerToken') || sessionStorage.getItem('adminToken');
  });
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = useCallback((path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  }, []);

  const login = useCallback(
    async (username: string, passcode: string) => {
      const API_URL = getApiUrl();
      try {
        const response = await fetchWithTimeout(`${API_URL}/api/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password: passcode }),
        });

        const data = await response.json();
        if (!response.ok) {
          return { success: false, error: data.error || 'Invalid credentials. Please try again.' };
        }

        const empRole = data.employee.role;
        if (empRole === 'OWNER') {
          setIsOwnerAuth(true);
          setIsAdminAuth(true);
          setEmployeeRoleState(empRole);
          setToken(data.token);

          sessionStorage.setItem('isOwnerAuth', 'true');
          sessionStorage.setItem('isAdminAuth', 'true');
          sessionStorage.setItem('ownerToken', data.token);
          sessionStorage.setItem('adminToken', data.token);
          sessionStorage.setItem('employeeRole', empRole);

          queryClient.clear(); // Purge cache on new login
          return { success: true };
        } else if (empRole === 'ADMIN') {
          setIsAdminAuth(true);
          setIsOwnerAuth(false);
          setEmployeeRoleState(empRole);
          setToken(data.token);

          sessionStorage.setItem('isAdminAuth', 'true');
          sessionStorage.removeItem('isOwnerAuth');
          sessionStorage.setItem('adminToken', data.token);
          sessionStorage.removeItem('ownerToken');
          sessionStorage.setItem('employeeRole', empRole);

          queryClient.clear(); // Purge cache on new login
          return { success: true };
        } else {
          return {
            success: false,
            error: 'Unauthorized. You do not have permission to access the management portals.',
          };
        }
      } catch {
        return { success: false, error: 'Connection error. Is the backend server running?' };
      }
    },
    [queryClient]
  );

  const logout = useCallback(() => {
    setIsAdminAuth(false);
    setIsOwnerAuth(false);
    setEmployeeRoleState('');
    setToken(null);

    sessionStorage.removeItem('isAdminAuth');
    sessionStorage.removeItem('isOwnerAuth');
    sessionStorage.removeItem('adminToken');
    sessionStorage.removeItem('ownerToken');
    sessionStorage.removeItem('employeeRole');
    sessionStorage.removeItem('activeTab_/admin');
    sessionStorage.removeItem('activeTab_/owner');

    queryClient.clear(); // Purge cache on logout
  }, [queryClient]);

  return (
    <AuthContext.Provider
      value={{
        isAdminAuth,
        isOwnerAuth,
        employeeRole,
        token,
        currentPath,
        navigateTo,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
