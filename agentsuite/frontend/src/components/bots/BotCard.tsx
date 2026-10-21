import React from 'react';
import { motion } from 'framer-motion';
import { Bot, Play, Pause, RefreshCw, Trash2, MoreVertical } from 'lucide-react';
import { Bot as BotType } from '../../types/bot';
import { BotStatusBadge } from './BotStatusBadge';
import { formatDuration } from '../../lib/utils';

interface BotCardProps {
  bot: BotType;
  onStart: (id: string) => void;
  onStop: (id: string) => void;
  onRestart: (id: string) => void;
  onDelete: (id: string) => void;
  onClick: (bot: BotType) => void;
}

export const BotCard: React.FC<BotCardProps> = ({
  bot,
  onStart,
  onStop,
  onRestart,
  onDelete,
  onClick,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 cursor-pointer transition-shadow hover:shadow-lg"
      onClick={() => onClick(bot)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            bot.type === 'ai_agent' ? 'bg-purple-100 dark:bg-purple-900/20' :
            bot.type === 'web' ? 'bg-blue-100 dark:bg-blue-900/20' :
            bot.type === 'desktop' ? 'bg-green-100 dark:bg-green-900/20' :
            'bg-orange-100 dark:bg-orange-900/20'
          }`}>
            <Bot className={`w-5 h-5 ${
              bot.type === 'ai_agent' ? 'text-purple-600' :
              bot.type === 'web' ? 'text-blue-600' :
              bot.type === 'desktop' ? 'text-green-600' :
              'text-orange-600'
            }`} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              {bot.name}
            </h3>
            <p className="text-xs text-gray-500 capitalize">{bot.type.replace('_', ' ')}</p>
          </div>
        </div>
        <BotStatusBadge status={bot.status} />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-2">
          <p className="text-xs text-gray-500">Success Rate</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {bot.metrics.successRate.toFixed(1)}%
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-2">
          <p className="text-xs text-gray-500">Tasks</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {bot.metrics.tasksCompleted.toLocaleString()}
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-2">
          <p className="text-xs text-gray-500">Avg Time</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {formatDuration(bot.metrics.averageExecutionTimeMs)}
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-2">
          <p className="text-xs text-gray-500">Uptime</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {bot.metrics.uptimePercentage}%
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        {bot.status === 'idle' || bot.status === 'offline' ? (
          <button
            onClick={(e) => { e.stopPropagation(); onStart(bot.id); }}
            className="flex-1 flex items-center justify-center px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors"
          >
            <Play size={14} className="mr-1" />
            Start
          </button>
        ) : bot.status === 'running' ? (
          <button
            onClick={(e) => { e.stopPropagation(); onStop(bot.id); }}
            className="flex-1 flex items-center justify-center px-3 py-1.5 bg-yellow-600 text-white text-xs rounded-lg hover:bg-yellow-700 transition-colors"
          >
            <Pause size={14} className="mr-1" />
            Stop
          </button>
        ) : null}
        
        <button
          onClick={(e) => { e.stopPropagation(); onRestart(bot.id); }}
          className="flex items-center justify-center px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          <RefreshCw size={14} />
        </button>
        
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(bot.id); }}
          className="flex items-center justify-center px-3 py-1.5 bg-red-100 dark:bg-red-900/20 text-red-600 text-xs rounded-lg hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </motion.div>
  );
};