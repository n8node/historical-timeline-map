import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import * as api from '../services/api';

interface AuthContextType {
  isLoggedIn: boolean;
  loginUser: (email: string, password: string) => Promise<void>;
  logoutUser: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(api.isAuthenticated());

  const loginUser = useCallback(async (email: string, password: string) => {
    await api.login(email, password);
    setIsLoggedIn(true);
  }, []);

  const logoutUser = useCallback(() => {
    api.logout();
    setIsLoggedIn(false);
  }, []);

  return (
    <AuthContext.Provider value={{ isLoggedIn, loginUser, logoutUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
