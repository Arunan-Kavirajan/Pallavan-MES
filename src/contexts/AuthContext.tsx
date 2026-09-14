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
        const user = JSON.parse(saved);
        // Verify user still exists in seeded data
        if (SEEDED_USERS.find(u => u.id === user.id)) {
          setCurrentUser(user);
        }
      } catch (e) {
        // ignore bad session
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
