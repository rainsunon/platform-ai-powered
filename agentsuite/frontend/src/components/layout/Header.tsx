import React from 'react';
import { Bell, Search, Moon, Sun, User } from 'lucide-react';
import { useUIStore } from '../../stores/ui.store';

interface HeaderProps {
  onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { theme, setTheme } = useUIStore();

  return (
    <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4">
      <div className="flex items-center space-x-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <Search size={20} />
        </button>
      </div>

      <div className="flex items-center space-x-3">
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 relative">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
          <User size={20} />
        </button>
      </div>
    </header>
  );
};