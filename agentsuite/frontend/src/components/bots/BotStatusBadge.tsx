import React from 'react';
import { BotStatus } from '../../types/bot';

interface BotStatusBadgeProps {
  status: BotStatus;
}

const statusConfig = {
  idle: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300', label: 'Idle' },
  running: { color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400', label: 'Running' },
  error: { color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400', label: 'Error' },
  offline: { color: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400', label: 'Offline' },
  maintenance: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400', label: 'Maintenance' },
};

export const BotStatusBadge: React.FC<BotStatusBadgeProps> = ({ status }) => {
  const config = statusConfig[status];
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
        status === 'running' ? 'bg-green-500 animate-pulse' :
        status === 'error' ? 'bg-red-500' :
        'bg-gray-400'
      }`} />
      {config.label}
    </span>
  );
};