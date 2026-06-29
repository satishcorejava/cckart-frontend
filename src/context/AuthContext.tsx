import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { fetchMe, type AuthResponse } from '../api/auth';

interface AuthContextValue {
  user:    AuthResponse | null;
  loading: boolean;
  login:   (token: string, user: AuthResponse) => void;
  logout:  () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,    setUser]    = useState<AuthResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('zh-token');
    if (!token) { setLoading(false); return; }

    fetchMe()
      .then(setUser)
      .catch(() => localStorage.removeItem('zh-token'))
      .finally(() => setLoading(false));
  }, []);

  const login = (token: string, userData: AuthResponse) => {
    localStorage.setItem('zh-token', token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('zh-token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
