import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';
import { apiFetch, setAuthToken, removeAuthToken, getAuthToken } from '../services/api';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    const token = getAuthToken();
    if (token) {
      try {
        const res = await apiFetch<{ user: User }>('/users/me');
        setUser(res.user);
      } catch (err) {
        // Fallback to /auth/me
        try {
          const res = await apiFetch<{ user: User }>('/auth/me');
          setUser(res.user);
        } catch {
          removeAuthToken();
          setUser(null);
        }
      }
    }
  };

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
    };

    window.addEventListener('auth_unauthorized', handleUnauthorized);

    const initAuth = async () => {
      await refreshUser();
      setLoading(false);
    };

    initAuth();

    return () => {
      window.removeEventListener('auth_unauthorized', handleUnauthorized);
    };
  }, []);

  const login = (token: string, userData: User) => {
    setAuthToken(token);
    setUser(userData);
  };

  const logout = () => {
    removeAuthToken();
    setUser(null);
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
