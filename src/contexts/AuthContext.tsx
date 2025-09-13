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
    name: 'John Smith',
    email: 'john@roads.gov',
    role: 'Department Head',
    department: 'Roads & Infrastructure'
  },
  {
    id: 'USER-003',
    name: 'Sarah Johnson',
    email: 'sarah@electrical.gov',
    role: 'Department Head',
    department: 'Electrical Department'
  },
  {
    id: 'USER-004',
    name: 'Mike Wilson',
    email: 'mike@water.gov',
    role: 'Staff',
    department: 'Water Department'
  },
  {
    id: 'USER-005',
    name: 'Lisa Brown',
    email: 'lisa@sanitation.gov',
    role: 'Staff',
    department: 'Sanitation Department'
  }
];

// Admin credentials (in a real app, these would be hashed and stored in a database)
const adminCredentials: Record<string, { password: string; user: User }> = {
  'admin@cityportal.gov': {
    password: 'Admin@2024!',
    user: adminUsers[0]
  },
  'john@roads.gov': {
    password: 'Roads@2024!',
    user: adminUsers[1]
  },
  'sarah@electrical.gov': {
    password: 'Electrical@2024!',
    user: adminUsers[2]
  },
  'mike@water.gov': {
    password: 'Water@2024!',
    user: adminUsers[3]
  },
  'lisa@sanitation.gov': {
    password: 'Sanitation@2024!',
    user: adminUsers[4]
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