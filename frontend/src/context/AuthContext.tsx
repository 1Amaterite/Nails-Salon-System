import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../utils/apiClient';

interface AuthContextType {
  isAdminAuth: boolean;
  isOwnerAuth: boolean;
  employeeRole: string;
  employeeBranchId: string;
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
  const [employeeBranchId, setEmployeeBranchIdState] = useState(
    () => sessionStorage.getItem('employeeBranchId') || ''
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
      try {
        const data = await apiClient.post<{
          token: string;
          employee: { role: string; branchId: string };
        }>('/api/login', { username, password: passcode }, { skipAuth: true });

        const empRole = data.employee.role;
        const empBranchId = data.employee.branchId;
        if (empRole === 'OWNER') {
          setIsOwnerAuth(true);
          setIsAdminAuth(true);
          setEmployeeRoleState(empRole);
          setEmployeeBranchIdState(empBranchId);
          setToken(data.token);

          sessionStorage.setItem('isOwnerAuth', 'true');
          sessionStorage.setItem('isAdminAuth', 'true');
          sessionStorage.setItem('ownerToken', data.token);
          sessionStorage.setItem('adminToken', data.token);
          sessionStorage.setItem('employeeRole', empRole);
          sessionStorage.setItem('employeeBranchId', empBranchId);

          queryClient.clear(); // Purge cache on new login
          return { success: true };
        } else if (empRole === 'ADMIN') {
          setIsAdminAuth(true);
          setIsOwnerAuth(false);
          setEmployeeRoleState(empRole);
          setEmployeeBranchIdState(empBranchId);
          setToken(data.token);

          sessionStorage.setItem('isAdminAuth', 'true');
          sessionStorage.removeItem('isOwnerAuth');
          sessionStorage.setItem('adminToken', data.token);
          sessionStorage.removeItem('ownerToken');
          sessionStorage.setItem('employeeRole', empRole);
          sessionStorage.setItem('employeeBranchId', empBranchId);

          queryClient.clear(); // Purge cache on new login
          return { success: true };
        } else {
          return {
            success: false,
            error: 'Unauthorized. You do not have permission to access the management portals.',
          };
        }
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : 'Connection error. Is the backend server running?';
        return { success: false, error: msg };
      }
    },
    [queryClient]
  );

  const logout = useCallback(() => {
    setIsAdminAuth(false);
    setIsOwnerAuth(false);
    setEmployeeRoleState('');
    setEmployeeBranchIdState('');
    setToken(null);

    sessionStorage.removeItem('isAdminAuth');
    sessionStorage.removeItem('isOwnerAuth');
    sessionStorage.removeItem('adminToken');
    sessionStorage.removeItem('ownerToken');
    sessionStorage.removeItem('employeeRole');
    sessionStorage.removeItem('employeeBranchId');

    queryClient.clear(); // Purge cache on logout
  }, [queryClient]);

  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
      navigateTo('/login');
    };
    window.addEventListener('unauthorized-api-call', handleUnauthorized);
    return () => {
      window.removeEventListener('unauthorized-api-call', handleUnauthorized);
    };
  }, [logout, navigateTo]);

  return (
    <AuthContext.Provider
      value={{
        isAdminAuth,
        isOwnerAuth,
        employeeRole,
        employeeBranchId,
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
