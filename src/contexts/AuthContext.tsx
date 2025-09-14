import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Admin users with proper authentication
const adminUsers: User[] = [
  {
    id: 'USER-001',
    name: 'Super Admin',
    email: 'admin@cityportal.gov',
    role: 'Super Admin'
  },
  {
    id: 'USER-002',
    name: 'Savalade Admin',
    email: 'admin@savalade.gov',
    role: 'Savalade Admin',
    department: 'Municipal Corporation',
    city: 'Savalade'
  },
  {
    id: 'USER-003',
    name: 'Ranchi Admin',
    email: 'admin@ranchi.gov',
    role: 'Ranchi Admin',
    department: 'Municipal Corporation',
    city: 'Ranchi'
  },
  {
    id: 'USER-004',
    name: 'Jamshedpur Admin',
    email: 'admin@jamshedpur.gov',
    role: 'Jamshedpur Admin',
    department: 'Municipal Corporation',
    city: 'Jamshedpur'
  },
  {
    id: 'USER-005',
    name: 'Dhanbad Admin',
    email: 'admin@dhanbad.gov',
    role: 'Dhanbad Admin',
    department: 'Municipal Corporation',
    city: 'Dhanbad'
  },
  {
    id: 'USER-006',
    name: 'Bokaro Admin',
    email: 'admin@bokaro.gov',
    role: 'Bokaro Admin',
    department: 'Municipal Corporation',
    city: 'Bokaro'
  }
];

// Admin credentials (in a real app, these would be hashed and stored in a database)
const adminCredentials: Record<string, { password: string; user: User }> = {
  'admin@cityportal.gov': {
    password: 'Admin@2024!',
    user: adminUsers[0]
  },
  'admin@savalade.gov': {
    password: 'Savalade@2024!',
    user: adminUsers[1]
  },
  'admin@ranchi.gov': {
    password: 'Ranchi@2024!',
    user: adminUsers[2]
  },
  'admin@jamshedpur.gov': {
    password: 'Jamshedpur@2024!',
    user: adminUsers[3]
  },
  'admin@dhanbad.gov': {
    password: 'Dhanbad@2024!',
    user: adminUsers[4]
  },
  'admin@bokaro.gov': {
    password: 'Bokaro@2024!',
    user: adminUsers[5]
  }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem('civic_portal_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string, role: string): Promise<boolean> => {
    setIsLoading(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check if user exists and credentials match
    const credentials = adminCredentials[email];
    
    if (credentials && credentials.user.role === role && credentials.password === password) {
      setUser(credentials.user);
      localStorage.setItem('civic_portal_user', JSON.stringify(credentials.user));
      setIsLoading(false);
      return true;
    }
    
    setIsLoading(false);
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('civic_portal_user');
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    isLoading,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
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