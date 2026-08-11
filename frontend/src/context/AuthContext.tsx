import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@/types';
import { authService } from '@/services/authService';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, orderId: string) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('immverse_auth_token');
      const currentUser = await authService.getCurrentUser();

      if (storedToken && currentUser) {
        setToken(storedToken);
        setUser(currentUser);
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, orderId: string): Promise<User> => {
    setIsLoading(true);
    try {
      const response = await authService.login(email, orderId);
      setUser(response.user);
      setToken(response.token);
      localStorage.setItem('immverse_auth_token', response.token);
      localStorage.setItem('immverse_user', JSON.stringify(response.user));
      return response.user;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('immverse_auth_token');
    localStorage.removeItem('immverse_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
