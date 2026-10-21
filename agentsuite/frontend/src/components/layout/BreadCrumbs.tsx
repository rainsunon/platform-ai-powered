import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const paths = location.pathname.split('/').filter(Boolean);

  const breadcrumbs = paths.map((path, index) => {
    const href = `/${paths.slice(0, index + 1).join('/')}`;
    const label = path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' ');
    return { href, label };
  });

  return (
    <nav className="flex items-center space-x-2 px-6 py-3 text-sm">
      <Link
        to="/dashboard"
        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
      >
        <Home size={16} />
      </Link>
      
      {breadcrumbs.map((crumb, index) => (
        <React.Fragment key={crumb.href}>
          <ChevronRight size={14} className="text-gray-400" />
          {index === breadcrumbs.length - 1 ? (
            <span className="text-gray-900 dark:text-white font-medium">
              {crumb.label}
            </span>
          ) : (
            <Link
              to={crumb.href}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              {crumb.label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};