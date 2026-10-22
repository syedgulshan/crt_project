import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/index.js';
import { api, setAuthToken } from '../services/api.js';
import { loginWithGoogle as fbLoginGoogle, loginWithApple as fbLoginApple, logout as fbLogout } from '../services/firebase.js';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginGoogle: () => Promise<void>;
  loginApple: () => Promise<void>;
  loginDemo: (provider?: 'google' | 'apple') => Promise<void>;
  signOut: () => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if token exists
    const token = localStorage.getItem('auth_token');
    const savedUser = localStorage.getItem('auth_user');

    if (token && savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        setAuthToken(token);
      } catch (e) {
        localStorage.removeItem('auth_user');
        setAuthToken(null);
      }
    }

    // Listen for 401 unauthorized events
    const handleUnauthorized = () => {
      setUser(null);
      localStorage.removeItem('auth_user');
      setAuthToken(null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    setIsLoading(false);

    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  const loginGoogle = async () => {
    setIsLoading(true);
    setError(null);
    try {
      try {
        // Try live Firebase Google Login
        const result = await fbLoginGoogle();
        const session = await api.auth.syncSession(result.user, result.token);
        setUser(session.user);
        setAuthToken(session.token);
        localStorage.setItem('auth_user', JSON.stringify(session.user));
      } catch (fbErr: any) {
        console.warn('Firebase popup unavailable or domain not authorized. Activating demo Google sign-in fallback.', fbErr);
        // Fallback to simulated Google sign-in
        const res = await api.auth.demoLogin('google');
        setUser(res.user);
        setAuthToken(res.token);
        localStorage.setItem('auth_user', JSON.stringify(res.user));
      }
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed');
    } finally {
      setIsLoading(false);
    }
  };

  const loginApple = async () => {
    setIsLoading(true);
    setError(null);
    try {
      try {
        const result = await fbLoginApple();
        const session = await api.auth.syncSession(result.user, result.token);
        setUser(session.user);
        setAuthToken(session.token);
        localStorage.setItem('auth_user', JSON.stringify(session.user));
      } catch (fbErr: any) {
        console.warn('Firebase Apple login notice. Activating demo Apple sign-in fallback.', fbErr);
        const res = await api.auth.demoLogin('apple');
        setUser(res.user);
        setAuthToken(res.token);
        localStorage.setItem('auth_user', JSON.stringify(res.user));
      }
    } catch (err: any) {
      setError(err.message || 'Apple sign-in failed');
    } finally {
      setIsLoading(false);
    }
  };

  const loginDemo = async (provider: 'google' | 'apple' = 'google') => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.auth.demoLogin(provider);
      setUser(res.user);
      setAuthToken(res.token);
      localStorage.setItem('auth_user', JSON.stringify(res.user));
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      await fbLogout();
    } catch (e) {
      // Ignore
    }
    setUser(null);
    setAuthToken(null);
    localStorage.removeItem('auth_user');
    setIsLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        loginGoogle,
        loginApple,
        loginDemo,
        signOut,
        error,
        clearError: () => setError(null)
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
