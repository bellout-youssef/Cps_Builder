'use client';

import type { ReactNode } from 'react';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { JwtUser, Permission } from '@cps/shared';
import { tokenStorage } from '@/lib/token-storage';
import { decodeJwt, isTokenExpired } from '@/lib/jwt';
import { login as apiLogin, logout as apiLogout } from '@/lib/api/auth';
import { getUserPermissions } from '@/lib/permissions';

interface AuthState {
  user: JwtUser | null;
  permissions: Set<Permission>;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string, organizationId?: string) => Promise<void>;
  logout: () => Promise<void>;
  can: (permission: Permission) => boolean;
  canAny: (permissions: Permission[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    permissions: new Set(),
    isLoading: true,
    isAuthenticated: false,
  });

  const resolveFromStorage = useCallback(() => {
    const token = tokenStorage.getAccessToken();
    if (!token || isTokenExpired(token)) {
      setState({ user: null, permissions: new Set(), isLoading: false, isAuthenticated: false });
      return;
    }
    const user = decodeJwt(token);
    if (!user) {
      setState({ user: null, permissions: new Set(), isLoading: false, isAuthenticated: false });
      return;
    }
    setState({
      user,
      permissions: getUserPermissions(user),
      isLoading: false,
      isAuthenticated: true,
    });
  }, []);

  useEffect(() => {
    resolveFromStorage();
  }, [resolveFromStorage]);

  const login = useCallback(
    async (email: string, password: string, organizationId?: string) => {
      await apiLogin({ email, password, organizationId });
      resolveFromStorage();
    },
    [resolveFromStorage],
  );

  const logout = useCallback(async () => {
    const accessToken = tokenStorage.getAccessToken() ?? '';
    const refreshToken = tokenStorage.getRefreshToken() ?? '';
    await apiLogout(accessToken, refreshToken);
    setState({ user: null, permissions: new Set(), isLoading: false, isAuthenticated: false });
  }, []);

  const can = useCallback(
    (permission: Permission) => state.permissions.has(permission),
    [state.permissions],
  );

  const canAny = useCallback(
    (permissions: Permission[]) => permissions.some((p) => state.permissions.has(p)),
    [state.permissions],
  );

  const value = useMemo<AuthContextValue>(
    () => ({ ...state, login, logout, can, canAny }),
    [state, login, logout, can, canAny],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
