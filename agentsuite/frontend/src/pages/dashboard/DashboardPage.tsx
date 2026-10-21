import React from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Activity,
  Bot,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  XCircle,
  Zap,
  ArrowRight,
} from 'lucide-react';
import { MetricCard } from './MetricCard';
import { BotActivityChart } from './BotActivityChart';
import { RecentWorkflows } from './RecentWorkflows';
import { dashboardService, Alert } from '../../services/dashboard.service';

const alertIcons: Record<string, React.ReactNode> = {
  error: <XCircle className="w-5 h-5 text-red-500" />,
  warning: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
  info: <TrendingUp className="w-5 h-5 text-blue-500" />,
  success: <CheckCircle2 className="w-5 h-5 text-green-500" />,
};

const alertBgColors: Record<string, string> = {
  error: 'bg-red-50 dark:bg-red-900/20',
  warning: 'bg-yellow-50 dark:bg-yellow-900/20',
  info: 'bg-blue-50 dark:bg-blue-900/20',
  success: 'bg-green-50 dark:bg-green-900/20',
};

export const DashboardPage: React.FC = () => {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: () => dashboardService.getMetrics(),
    refetchInterval: 30000,
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Dashboard
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Real-time overview of your automation fleet
              </p>
            </div>
            {metrics && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Last updated: {new Date(metrics.timestamp).toLocaleTimeString()}
              </p>
            )}
          </div>
        </motion.div>

        {/* Metric Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <motion.div variants={itemVariants}>
            <MetricCard
              title="Active Bots"
              value={metrics?.activeBots ?? 0}
              subtitle={`of ${metrics?.totalBots ?? 0} total`}
              change={metrics?.botUtilization}
              icon={<Bot className="w-6 h-6" />}
              color="blue"
              isLoading={isLoading}
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <MetricCard
              title="Workflows Today"
              value={metrics?.workflowsToday ?? 0}
              subtitle={
                metrics?.workflowsChange !== undefined
                  ? `${metrics.workflowsChange > 0 ? '+' : ''}${metrics.workflowsChange}% vs yesterday`
                  : undefined
              }
              change={metrics?.workflowsChange}
              icon={<Activity className="w-6 h-6" />}
              color="green"
              isLoading={isLoading}
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <MetricCard
              title="Success Rate"
              value={`${metrics?.successRate ?? 100}%`}
              subtitle={
                metrics?.completedToday !== undefined
                  ? `${metrics.completedToday} completed, ${metrics.failedToday} failed`
                  : undefined
              }
              change={metrics?.successRateChange}
              icon={<CheckCircle2 className="w-6 h-6" />}
              color="purple"
              isLoading={isLoading}
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <MetricCard
              title="Avg. Response Time"
              value={metrics?.avgResponseTime ? `${metrics.avgResponseTime}ms` : '0ms'}
              subtitle={
                metrics?.responseTimeChange !== undefined
                  ? `${metrics.responseTimeChange > 0 ? '+' : ''}${metrics.responseTimeChange}% vs yesterday`
                  : undefined
              }
              change={metrics?.responseTimeChange ? -metrics.responseTimeChange : undefined}
              icon={<Clock className="w-6 h-6" />}
              color="orange"
              isLoading={isLoading}
            />
          </motion.div>
        </motion.div>

        {/* Charts and Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Bot Activity (Last 24 Hours)
              </h2>
              <BotActivityChart data={metrics?.botActivity || []} />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Alerts
                </h2>
                {metrics?.alerts && metrics.alerts.length > 0 && (
                  <span className="text-xs text-gray-500">
                    {metrics.alerts.length} alert{metrics.alerts.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="animate-pulse p-3 bg-gray-100 dark:bg-gray-700 rounded-lg h-16" />
                  ))
                ) : metrics?.alerts && metrics.alerts.length > 0 ? (
                  metrics.alerts.map((alert, index) => (
                    <div
                      key={index}
                      className={`flex items-start space-x-3 p-3 rounded-lg ${alertBgColors[alert.type] || 'bg-gray-50 dark:bg-gray-700'}`}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        {alertIcons[alert.type] || <Zap className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {alert.title}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                          {alert.message}
                        </p>
                        {alert.action && alert.actionUrl && (
                          <Link
                            to={alert.actionUrl}
                            className="inline-flex items-center mt-2 text-xs font-medium text-blue-600 hover:text-blue-500"
                          >
                            {alert.action}
                            <ArrowRight className="w-3 h-3 ml-1" />
                          </Link>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                    No alerts at this time
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Quick Stats Row */}
        {metrics && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8"
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.runningExecutions}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Running</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{metrics.completedToday}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Completed</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 text-center">
              <p className="text-2xl font-bold text-red-600">{metrics.failedToday}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Failed</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 text-center">
              <p className="text-2xl font-bold text-yellow-600">{metrics.pendingTasks}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Pending Tasks</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 text-center">
              <p className="text-2xl font-bold text-orange-600">{metrics.highPriorityTasks}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">High Priority</p>
            </div>
          </motion.div>
        )}

        {/* Recent Workflows */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Recent Workflows
            </h2>
            <RecentWorkflows workflows={metrics?.recentWorkflows || []} />
          </div>
        </motion.div>
      </div>
    </div>
  );
};