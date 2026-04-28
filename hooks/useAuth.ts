/**
 * hooks/useAuth.ts — Authentification via API REST + JWT
 * Remplace le mock hardcodé (USERS constants).
 */
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { api, tokenStore, ApiError } from '../services/apiClient';
import type { User } from '../types';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface Session { user: User; }

interface AuthContextType {
  session: Session | null;
  status:  AuthStatus;
  signIn:  (credentials: { email: string; pass: string }) => Promise<boolean>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [status,  setStatus]  = useState<AuthStatus>('loading');

  // Restaurer la session depuis le token JWT stocké
  useEffect(() => {
    const restore = async () => {
      const token = tokenStore.getAccess();
      if (!token) { setStatus('unauthenticated'); return; }
      try {
        const user = await api.get<User>('/auth/me');
        setSession({ user });
        setStatus('authenticated');
      } catch {
        tokenStore.clear();
        setStatus('unauthenticated');
      }
    };
    restore();
  }, []);

  // Écouter les déconnexions forcées (token expiré dans apiClient)
  useEffect(() => {
    const handleLogout = () => { setSession(null); setStatus('unauthenticated'); };
    window.addEventListener('kasuku:logout', handleLogout);
    return () => window.removeEventListener('kasuku:logout', handleLogout);
  }, []);

  const signIn = useCallback(async (
    credentials: { email: string; pass: string },
  ): Promise<boolean> => {
    try {
      const res = await api.post<{ accessToken: string; refreshToken: string; user: User }>(
        '/auth/login',
        { email: credentials.email, password: credentials.pass },
      );
      tokenStore.setTokens(res.accessToken, res.refreshToken);
      setSession({ user: res.user });
      setStatus('authenticated');
      return true;
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return false;
      throw err;
    }
  }, []);

  const signOut = useCallback(() => {
    tokenStore.clear();
    setSession(null);
    setStatus('unauthenticated');
  }, []);

  return React.createElement(AuthContext.Provider, { value: { session, status, signIn, signOut } }, children);
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans un AuthProvider');
  return ctx;
};