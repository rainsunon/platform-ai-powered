import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { motion } from 'framer-motion';

interface BotActivityData {
  timestamp: string;
  running: number;
  idle: number;
  error: number;
}

interface BotActivityChartProps {
  data: BotActivityData[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4">
        <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
          {new Date(label).toLocaleString()}
        </p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center space-x-2 text-sm">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-600 dark:text-gray-400">{entry.name}:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const BotActivityChart: React.FC<BotActivityChartProps> = ({ data }) => {
  const [timeRange, setTimeRange] = useState('24h');

  if (!data || data.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-gray-500">
        No activity data available
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-end space-x-2">
        {['1h', '6h', '24h', '7d'].map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              timeRange === range
                ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {range}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorRunning" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorIdle" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6b7280" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6b7280" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorError" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#e5e7eb"
            vertical={false}
          />
          
          <XAxis
            dataKey="timestamp"
            tickFormatter={(timestamp) => new Date(timestamp).toLocaleTimeString()}
            stroke="#9ca3af"
            fontSize={12}
            tickLine={false}
          />
          
          <YAxis
            stroke="#9ca3af"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          
          <Tooltip content={<CustomTooltip />} />
          
          <Legend
            verticalAlign="top"
            height={36}
            iconType="circle"
          />
          
          <Area
            type="monotone"
            dataKey="running"
            stackId="1"
            stroke="#10b981"
            fill="url(#colorRunning)"
            strokeWidth={2}
            name="Running"
          />
          
          <Area
            type="monotone"
            dataKey="idle"
            stackId="1"
            stroke="#6b7280"
            fill="url(#colorIdle)"
            strokeWidth={2}
            name="Idle"
          />
          
          <Area
            type="monotone"
            dataKey="error"
            stackId="1"
            stroke="#ef4444"
            fill="url(#colorError)"
            strokeWidth={2}
            name="Error"
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
};