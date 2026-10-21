import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Activity, FileText, BarChart3 } from 'lucide-react';

const subNav = [
  { name: 'Logs', href: '/observability/logs', icon: FileText },
  { name: 'Process Graph', href: '/observability/process-graph', icon: Activity },
  { name: 'Analytics', href: '/observability/analytics', icon: BarChart3 },
];

export const ObservabilityLayout: React.FC = () => {
  const location = useLocation();

  return (
    <div className="h-full flex flex-col">
      {/* Sub-navigation */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6">
        <nav className="flex space-x-1">
          {subNav.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={`flex items-center px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <Icon size={16} className="mr-2" />
                {item.name}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Page content */}
      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
};