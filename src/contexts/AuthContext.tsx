import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User } from '../types/domain';
import { SEEDED_USERS } from '../constants/seededData';

interface AuthContextType {
  currentUser: User;
  switchUser: (userId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Default to Operator 1
  const [currentUser, setCurrentUser] = useState<User>(SEEDED_USERS[0]);

  const switchUser = (userId: string) => {
    const user = SEEDED_USERS.find(u => u.id === userId);
    if (user) {
      setCurrentUser(user);
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, switchUser }}>
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
