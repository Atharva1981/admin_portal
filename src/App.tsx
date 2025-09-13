import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import Sidebar from './components/Layout/Sidebar';
import Dashboard from './components/Pages/Dashboard';
import IssueManagement from './components/Pages/IssueManagement';
import DepartmentMapping from './components/Pages/DepartmentMapping';
import Analytics from './components/Pages/Analytics';
import AdminDashboard from './components/Admin/AdminDashboard';

const AppContent: React.FC = () => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const { user } = useAuth();

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard />;
      case 'issues':
        return <IssueManagement />;
      case 'departments':
        return (
          <ProtectedRoute requiredRole="Super Admin">
            <DepartmentMapping />
          </ProtectedRoute>
        );
      case 'analytics':
        return <Analytics />;
      case 'admin':
        return <AdminDashboard />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} />
      <main className="flex-1 p-8 overflow-auto">
        {renderContent()}
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <ProtectedRoute>
          <AppContent />
        </ProtectedRoute>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;