import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface BotActivityData {
  hour: string;
  executions: number;
  successful: number;
  failed: number;
  other?: number;
}

interface BotActivityChartProps {
  data: BotActivityData[];
  isLoading?: boolean;
}

export const BotActivityChart: React.FC<BotActivityChartProps> = ({
  data,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
        <p>No activity data available</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={data}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#374151"
          opacity={0.2}
        />
        <XAxis
          dataKey="hour"
          tick={{ fontSize: 12 }}
          stroke="#9CA3AF"
          interval={2}
        />
        <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1F2937',
            border: '1px solid #374151',
            borderRadius: '0.5rem',
            color: '#F9FAFB',
          }}
        />
        <Legend />
        <Bar
          dataKey="successful"
          name="Successful"
          fill="#10B981"
          radius={[4, 4, 0, 0]}
          stackId="a"
        />
        <Bar
          dataKey="failed"
          name="Failed"
          fill="#EF4444"
          radius={[4, 4, 0, 0]}
          stackId="a"
        />
        <Bar
          dataKey="other"
          name="Other"
          fill="#6B7280"
          radius={[4, 4, 0, 0]}
          stackId="a"
        />
      </BarChart>
    </ResponsiveContainer>
  );
};