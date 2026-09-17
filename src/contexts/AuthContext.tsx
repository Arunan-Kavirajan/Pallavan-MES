import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types/domain';
import { SEEDED_USERS } from '../constants/seededData';

interface AuthContextType {
  currentUser: User | null;
  login: (userId: string, pin: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load session from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('apex_session');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // SECURITY FIX: Do not trust the role inside localStorage!
          // We only use the ID, and re-fetch their true role from the master list.
          // This prevents someone from editing localStorage to become a "Manager".
          const realUser = SEEDED_USERS.find(u => u.id === parsed.id);
          if (realUser) {
            setCurrentUser(realUser);
          }
        } catch (e) {
          console.error("Failed to parse session", e);
        }
    }
    setIsLoaded(true);
  }, []);

  const login = (userId: string, pin: string): boolean => {
    // For this assignment, we use a universal secure PIN for demo purposes
    // In a real app, this would hit an authentication API / Firebase Auth
    if (pin !== 'apex123') {
      return false;
    }

    const user = SEEDED_USERS.find(u => u.id.toUpperCase() === userId.toUpperCase());
    if (user) {
      setCurrentUser(user);
      localStorage.setItem('apex_session', JSON.stringify(user));
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('apex_session');
  };

  if (!isLoaded) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading session...</div>;

  return (
    <AuthContext.Provider value={{ currentUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  // If we are outside App.tsx auth guard, it might be null, but inside it's safe.
  // We'll cast currentUser to User to satisfy TS in components rendered inside App.tsx
  return context as AuthContextType & { currentUser: User };
};
