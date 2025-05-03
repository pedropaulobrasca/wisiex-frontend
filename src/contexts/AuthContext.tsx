
import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { useToast } from '../hooks/use-toast';

type AuthContextType = {
  user: { username: string | null; token: string | null } | null;
  loading: boolean;
  login: (username: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<{ username: string | null; token: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const userData = authService.getUser();
      if (userData.token) {
        setUser(userData);
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (username: string) => {
    try {
      setLoading(true);
      const data = await authService.login(username);
      setUser({ username, token: data.token });
      navigate('/trade');
      toast({
        title: 'Login successful',
        description: `Welcome, ${username}!`,
      });
    } catch (error) {
      console.error('Login failed:', error);
      toast({
        variant: 'destructive',
        title: 'Login failed',
        description: 'Could not log in with the provided username.',
      });
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    navigate('/');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user?.token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
