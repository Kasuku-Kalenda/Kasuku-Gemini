import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { User } from '../types';
import { USERS } from '../constants';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface Session {
  user: User | null;
}

interface AuthContextType {
  session: Session | null;
  status: AuthStatus;
  signIn: (provider: 'credentials' | 'google', credentials?: { email: string; pass: string }) => Promise<boolean>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  useEffect(() => {
    try {
      // Prioritize admin session (sessionStorage)
      const adminSessionData = window.sessionStorage.getItem('kasuku_session');
      if (adminSessionData) {
        const parsedSession = JSON.parse(adminSessionData);
        setSession(parsedSession);
        setStatus('authenticated');
        return;
      }

      // Fallback to user session (localStorage)
      const userSessionData = window.localStorage.getItem('kasuku_session');
      if (userSessionData) {
        const parsedSession = JSON.parse(userSessionData);
        setSession(parsedSession);
        setStatus('authenticated');
        return;
      }
      
      setStatus('unauthenticated');

    } catch (error) {
      console.error('Failed to parse stored session', error);
      window.localStorage.removeItem('kasuku_session');
      window.sessionStorage.removeItem('kasuku_session');
      setStatus('unauthenticated');
    }
  }, []);

  const signIn = useCallback(async (provider: 'credentials' | 'google', credentials?: { email: string; pass: string }): Promise<boolean> => {
    if (provider === 'credentials') {
      if (!credentials) return false;
      const { email, pass } = credentials;
      const user = USERS.find(u => u.email === email);

      // Mock password check - DO NOT USE IN PRODUCTION
      if (user && user.passwordHash === pass) {
        const newSession: Session = { user };
        setSession(newSession);
        setStatus('authenticated');
        // Admin/Credentials sessions are stored in sessionStorage for security
        window.sessionStorage.setItem('kasuku_session', JSON.stringify(newSession));
        return true;
      }
      return false;

    } else if (provider === 'google') {
      // Mock Google Sign-In
      const googleUser = USERS.find(u => u.id === 'user_google_mock');
      if (googleUser) {
          const newSession: Session = { user: googleUser };
          setSession(newSession);
          setStatus('authenticated');
          // Regular user sessions are stored in localStorage for persistence
          window.localStorage.setItem('kasuku_session', JSON.stringify(newSession));
          return true;
      }
      return false;
    }
    return false;
  }, []);

  const signOut = useCallback(() => {
    setSession(null);
    setStatus('unauthenticated');
    window.localStorage.removeItem('kasuku_session');
    window.sessionStorage.removeItem('kasuku_session');
  }, []);

  const value = {
    session,
    status,
    signIn,
    signOut,
  };

  return React.createElement(AuthContext.Provider, { value: value }, children);
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};