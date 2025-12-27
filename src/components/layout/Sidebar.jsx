/**
 * GearGuard - Sidebar Navigation Component
 * 
 * Main navigation sidebar with role-based menu items.
 */

import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Server,
  Users,
  ClipboardList,
  Kanban,
  Calendar,
  Settings,
  Shield,
  ChevronLeft,
  ChevronRight,
  Wrench
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

function Sidebar({ collapsed, onToggle }) {
  const { user, can } = useAuth();

  // Navigation items with role-based visibility
  const navItems = [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      path: '/dashboard',
      show: can('canViewDashboard') || user?.role === 'user'
    },
    {
      label: 'Equipment',
      icon: Server,
      path: '/equipment',
      show: true
    },
    {
      label: 'Teams',
      icon: Users,
      path: '/teams',
      show: can('canManageTeams') || user?.role === 'technician'
    },
    {
      label: 'Requests',
      icon: ClipboardList,
      path: '/requests',
      show: true
    },
    {
      label: 'Kanban Board',
      icon: Kanban,
      path: '/kanban',
      show: user?.role !== 'user'
    },
    {
      label: 'Calendar',
      icon: Calendar,
      path: '/calendar',
      show: user?.role !== 'user'
    },
    {
      label: 'Settings',
      icon: Settings,
      path: '/settings',
      show: can('canManageUsers')
    }
  ];

  const filteredItems = navItems.filter(item => item.show);

  return (
    <aside
      className={`
        fixed left-0 top-0 h-screen bg-gray-900 text-white
        transition-all duration-300 z-30
        ${collapsed ? 'w-16' : 'w-64'}
        flex flex-col
      `}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-800">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg">GearGuard</span>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mx-auto">
            <Shield className="w-5 h-5" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {filteredItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) => `
                  flex items-center gap-3 px-3 py-2.5 rounded-lg
                  transition-colors duration-200
                  ${isActive 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }
                  ${collapsed ? 'justify-center' : ''}
                `}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && (
                  <span className="font-medium">{item.label}</span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Collapse Toggle */}
      <button
        onClick={onToggle}
        className="h-12 flex items-center justify-center border-t border-gray-800 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
      >
        {collapsed ? (
          <ChevronRight className="w-5 h-5" />
        ) : (
          <ChevronLeft className="w-5 h-5" />
        )}
      </button>
    </aside>
  );
}

export default Sidebar;
