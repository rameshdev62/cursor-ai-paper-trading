import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { checkAuthStatus, login as apiLogin, logout as apiLogout, type AuthStatus } from '../utils/api';

type AuthContextValue = {
  logged_in: boolean;
  user_id: string | null;
  loading: boolean;
  login: (
    userid: string,
    password: string,
    totp: string,
    clientId?: string,
    secretCode?: string,
    oauthUrl?: string
  ) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<Pick<AuthContextValue, 'logged_in' | 'user_id'>>({
    logged_in: false,
    user_id: null,
  });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res: AuthStatus = await checkAuthStatus();
      setState({ logged_in: res.logged_in, user_id: res.user_id });
    } catch {
      setState({ logged_in: false, user_id: null });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(
    async (
      userid: string,
      password: string,
      totp: string,
      clientId?: string,
      secretCode?: string,
      oauthUrl?: string
    ): Promise<{ ok: boolean; error?: string }> => {
      try {
        await apiLogin(userid, password, totp, clientId, secretCode, oauthUrl);
        await refresh();
        return { ok: true };
      } catch (err: any) {
        return { ok: false, error: err?.detail || err?.message || 'Login failed' };
      }
    },
    [refresh]
  );

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } catch {
    } finally {
      setState({ logged_in: false, user_id: null });
    }
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, loading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
