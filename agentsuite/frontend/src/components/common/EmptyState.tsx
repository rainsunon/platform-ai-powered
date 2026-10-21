import React from 'react';
import { motion } from 'framer-motion';
import { Bot, Workflow, ClipboardList, Activity } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: 'bot' | 'workflow' | 'task' | 'activity';
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

const icons = {
  bot: Bot,
  workflow: Workflow,
  task: ClipboardList,
  activity: Activity,
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon = 'bot',
  action,
  secondaryAction,
}) => {
  const Icon = icons[icon];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-16 px-4"
    >
      <motion.div
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.2 }}
        className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl flex items-center justify-center mb-6"
      >
        <Icon className="w-10 h-10 text-blue-600 dark:text-blue-400" />
      </motion.div>

      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-xl font-semibold text-gray-900 dark:text-white mb-2"
      >
        {title}
      </motion.h3>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-gray-600 dark:text-gray-400 text-center max-w-sm mb-8"
      >
        {description}
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex items-center space-x-3"
      >
        {action && (
          <button
            onClick={action.onClick}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            {action.label}
          </button>
        )}
        {secondaryAction && (
          <button
            onClick={secondaryAction.onClick}
            className="px-6 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-medium"
          >
            {secondaryAction.label}
          </button>
        )}
      </motion.div>
    </motion.div>
  );
};