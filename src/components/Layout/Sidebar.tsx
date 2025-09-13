import React from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Building, 
  BarChart3, 
  Settings,
  LogOut,
  Shield
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import NotificationPanel from '../UI/NotificationPanel';

interface SidebarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeSection, setActiveSection }) => {
  const { user, logout } = useAuth();

  const getMenuItems = () => {
    const baseItems = [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'issues', label: 'Issue Management', icon: FileText },
    ];

    // Only Super Admin can access Department Mapping and Admin Dashboard
    if (user?.role === 'Super Admin') {
      baseItems.push({ id: 'departments', label: 'Department Mapping', icon: Building });
      baseItems.push({ id: 'admin', label: 'Admin Dashboard', icon: Shield });
    }

    // All roles can access Analytics
    baseItems.push({ id: 'analytics', label: 'Analytics', icon: BarChart3 });

    return baseItems;
  };

  const menuItems = getMenuItems();

  return (
    <div className="bg-slate-900 text-white w-64 min-h-screen flex flex-col">
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-xl font-bold text-blue-400">Civic Portal</h1>
        <p className="text-sm text-slate-400 mt-1">Admin Dashboard</p>
      </div>
      
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <button
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    activeSection === item.id
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center space-x-3 px-4 py-3">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">{user?.name || 'User'}</p>
            <p className="text-xs text-slate-400">{user?.role || 'Unknown Role'}</p>
            {user?.department && (
              <p className="text-xs text-slate-500">{user.department}</p>
            )}
          </div>
        </div>
        
        <div className="flex space-x-2 px-4 py-2">
          <NotificationPanel />
          <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
            <Settings size={16} />
          </button>
          <button 
            onClick={logout}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;