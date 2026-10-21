import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  isLoading?: boolean;
}

const colorClasses: Record<string, { bg: string; icon: string; text: string }> = {
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    icon: 'text-blue-600 dark:text-blue-400',
    text: 'text-blue-700 dark:text-blue-300',
  },
  green: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    icon: 'text-green-600 dark:text-green-400',
    text: 'text-green-700 dark:text-green-300',
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    icon: 'text-purple-600 dark:text-purple-400',
    text: 'text-purple-700 dark:text-purple-300',
  },
  orange: {
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    icon: 'text-orange-600 dark:text-orange-400',
    text: 'text-orange-700 dark:text-orange-300',
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    icon: 'text-red-600 dark:text-red-400',
    text: 'text-red-700 dark:text-red-300',
  },
};

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  change,
  icon,
  color,
  isLoading = false,
}) => {
  const colors = colorClasses[color] || colorClasses.blue;

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
          <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        </div>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32" />
      </div>
    );
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 transition-shadow hover:shadow-md"
    >
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {title}
        </p>
        <div className={`p-2 rounded-lg ${colors.bg}`}>
          <div className={colors.icon}>{icon}</div>
        </div>
      </div>

      <div className="flex items-baseline space-x-2">
        <p className="text-2xl font-bold text-gray-900 dark:text-white">
          {value}
        </p>
        {change !== undefined && change !== 0 && (
          <span
            className={`inline-flex items-center text-sm font-medium ${
              change > 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {change > 0 ? (
              <TrendingUp className="w-4 h-4 mr-0.5" />
            ) : (
              <TrendingDown className="w-4 h-4 mr-0.5" />
            )}
            {Math.abs(change)}%
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          {subtitle}
        </p>
      )}
    </motion.div>
  );
};