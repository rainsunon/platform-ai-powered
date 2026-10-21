import React from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  XCircle,
  Activity,
  Bot,
  Workflow,
  Zap,
  Loader2,
} from 'lucide-react';
import { dashboardService } from '../../services/dashboard.service';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#6366f1', '#8b5cf6'];

export const AnalyticsPage: React.FC = () => {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: () => dashboardService.getMetrics(),
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // Bot status distribution for pie chart
  const botStatusData = [
    { name: 'Active', value: metrics?.activeBots || 0 },
    { name: 'Idle', value: metrics?.idleBots || 0 },
    { name: 'Error', value: metrics?.errorBots || 0 },
    { name: 'Offline', value: metrics?.offlineBots || 0 },
  ].filter((d) => d.value > 0);

  // Workflow status distribution
  const workflowStatusData = [
    { name: 'Active', value: metrics?.activeWorkflows || 0 },
    { name: 'Draft', value: metrics?.draftWorkflows || 0 },
    { name: 'Paused', value: metrics?.pausedWorkflows || 0 },
  ].filter((d) => d.value > 0);

  // Task distribution
  const taskData = [
    { name: 'Pending', value: metrics?.pendingTasks || 0 },
    { name: 'Claimed', value: metrics?.claimedTasks || 0 },
    { name: 'Completed', value: metrics?.completedTasks || 0 },
  ].filter((d) => d.value > 0);

  // Execution trend (from bot activity)
  const executionTrend = (metrics?.botActivity || []).slice(-12).map((item: any) => ({
    hour: item.hour,
    Successful: item.successful || 0,
    Failed: item.failed || 0,
  }));

  return (
    <div className="h-full overflow-y-auto p-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Performance metrics and insights</p>
      </motion.div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Executions Today"
          value={metrics?.workflowsToday ?? 0}
          change={metrics?.workflowsChange}
          icon={<Activity className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          title="Success Rate"
          value={`${metrics?.successRate ?? 100}%`}
          change={metrics?.successRateChange}
          icon={<CheckCircle2 className="w-5 h-5" />}
          color="green"
        />
        <StatCard
          title="Avg Response Time"
          value={`${metrics?.avgResponseTime ?? 0}ms`}
          change={metrics?.responseTimeChange ? -metrics.responseTimeChange : 0}
          icon={<Clock className="w-5 h-5" />}
          color="orange"
        />
        <StatCard
          title="Failed Today"
          value={metrics?.failedToday ?? 0}
          icon={<XCircle className="w-5 h-5" />}
          color="red"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Execution Trend */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Execution Trend (Last 12 Hours)
          </h3>
          {executionTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={executionTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="hour" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '0.5rem',
                    color: '#f9fafb',
                  }}
                />
                <Legend />
                <Bar dataKey="Successful" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Failed" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart message="No execution data yet" />
          )}
        </div>

        {/* Bot Status Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Bot Status Distribution
          </h3>
          {botStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={botStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {botStatusData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart message="No bots created yet" />
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Workflow Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Workflow Distribution
          </h3>
          {workflowStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={workflowStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {workflowStatusData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart message="No workflows created yet" />
          )}
        </div>

        {/* Task Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Task Distribution
          </h3>
          {taskData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={taskData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {taskData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart message="No tasks created yet" />
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SummaryCard
          title="Bots"
          total={metrics?.totalBots || 0}
          active={metrics?.activeBots || 0}
          icon={<Bot className="w-6 h-6" />}
          color="blue"
        />
        <SummaryCard
          title="Workflows"
          total={metrics?.totalWorkflows || 0}
          active={metrics?.activeWorkflows || 0}
          icon={<Workflow className="w-6 h-6" />}
          color="purple"
        />
        <SummaryCard
          title="Tasks"
          total={(metrics?.pendingTasks || 0) + (metrics?.completedTasks || 0)}
          active={metrics?.pendingTasks || 0}
          icon={<Zap className="w-6 h-6" />}
          color="orange"
        />
      </div>
    </div>
  );
};

// Sub-components
const StatCard: React.FC<{
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  color: string;
}> = ({ title, value, change, icon, color }) => {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    green: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400',
    orange: 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400',
    red: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-gray-500">{title}</p>
        <div className={`p-2 rounded-lg ${colorMap[color] || colorMap.blue}`}>{icon}</div>
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      {change !== undefined && change !== 0 && (
        <p className={`text-xs mt-1 flex items-center ${change > 0 ? 'text-green-500' : 'text-red-500'}`}>
          {change > 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
          {Math.abs(change)}% vs yesterday
        </p>
      )}
    </div>
  );
};

const EmptyChart: React.FC<{ message: string }> = ({ message }) => (
  <div className="h-[300px] flex items-center justify-center text-gray-500">
    <div className="text-center">
      <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
      <p className="text-sm">{message}</p>
    </div>
  </div>
);

const SummaryCard: React.FC<{
  title: string;
  total: number;
  active: number;
  icon: React.ReactNode;
  color: string;
}> = ({ title, total, active, icon, color }) => {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
  };

  const pct = total > 0 ? Math.round((active / total) * 100) : 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
        <div className="text-gray-400">{icon}</div>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{total}</p>
          <p className="text-sm text-gray-500">Total</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{active}</p>
          <p className="text-sm text-gray-500">Active ({pct}%)</p>
        </div>
      </div>
      <div className="mt-4 h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
        <div
          className={`h-2 rounded-full ${colorMap[color] || 'bg-blue-500'} transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};