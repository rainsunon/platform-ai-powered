import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  Building2,
  Shield,
  BarChart3,
  Settings,
  Activity,
  Database,
  Bot,
  Workflow,
  ClipboardList,
  Loader2,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { apiClient } from '../../lib/axios';
import toast from 'react-hot-toast';

interface AdminStats {
  total_users: number;
  total_tenants: number;
  total_bots: number;
  total_workflows: number;
  total_tasks: number;
  active_bots: number;
  completed_tasks: number;
}

interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

interface AdminTenant {
  id: string;
  name: string;
  slug: string;
  plan: string;
  is_active: boolean;
  user_count: number;
}

export const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const queryClient = useQueryClient();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const { data } = await apiClient.get<AdminStats>('/admin/stats');
      return data;
    },
  });

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data } = await apiClient.get<AdminUser[]>('/admin/users');
      return data;
    },
    enabled: activeTab === 'users',
  });

  const { data: tenants, isLoading: tenantsLoading } = useQuery({
    queryKey: ['admin-tenants'],
    queryFn: async () => {
      const { data } = await apiClient.get<AdminTenant[]>('/admin/tenants');
      return data;
    },
    enabled: activeTab === 'tenants',
  });

  const toggleUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data } = await apiClient.put(`/admin/users/${userId}/toggle-active`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User status toggled');
    },
    onError: () => toast.error('Failed to toggle user'),
  });

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'tenants', label: 'Tenants', icon: Building2 },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const overviewStats = [
    { label: 'Total Users', value: stats?.total_users ?? 0, icon: Users, color: 'text-blue-500' },
    { label: 'Active Tenants', value: stats?.total_tenants ?? 0, icon: Building2, color: 'text-green-500' },
    { label: 'Total Bots', value: stats?.total_bots ?? 0, icon: Bot, color: 'text-purple-500' },
    { label: 'Total Workflows', value: stats?.total_workflows ?? 0, icon: Workflow, color: 'text-orange-500' },
    { label: 'Active Bots', value: stats?.active_bots ?? 0, icon: Activity, color: 'text-emerald-500' },
    { label: 'Pending Tasks', value: (stats?.total_tasks ?? 0) - (stats?.completed_tasks ?? 0), icon: ClipboardList, color: 'text-yellow-500' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Panel</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage your platform settings and monitor system health
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-white dark:bg-gray-800 rounded-lg p-1 mb-8 shadow-sm overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          {activeTab === 'overview' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {overviewStats.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
                        <Icon className={`w-5 h-5 ${stat.color}`} />
                      </div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {statsLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : stat.value}
                      </p>
                    </motion.div>
                  );
                })}
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">System Health</h3>
                <div className="space-y-4">
                  {[
                    { name: 'API Server', status: 'healthy' },
                    { name: 'Database', status: 'healthy' },
                    { name: 'Redis Cache', status: stats ? 'healthy' : 'offline' },
                  ].map((service) => (
                    <div key={service.name} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                      <div className="flex items-center space-x-3">
                        <div className={`w-2 h-2 rounded-full ${service.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className="text-sm text-gray-900 dark:text-white">{service.name}</span>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        service.status === 'healthy' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>{service.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'users' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">User Management</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Name</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Email</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Role</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersLoading ? (
                      <tr><td colSpan={5} className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></td></tr>
                    ) : users && users.length > 0 ? (
                      users.map((user) => (
                        <tr key={user.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">{user.full_name}</td>
                          <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{user.email}</td>
                          <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400 capitalize">{user.role}</td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex px-2 py-0.5 text-xs rounded-full ${
                              user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {user.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <button
                              onClick={() => toggleUserMutation.mutate(user.id)}
                              disabled={toggleUserMutation.isPending}
                              className="text-xs px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                            >
                              {user.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={5} className="text-center py-8 text-gray-500">No users found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'tenants' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Tenant Management</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Name</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Slug</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Plan</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Users</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tenantsLoading ? (
                      <tr><td colSpan={5} className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></td></tr>
                    ) : tenants && tenants.length > 0 ? (
                      tenants.map((tenant) => (
                        <tr key={tenant.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">{tenant.name}</td>
                          <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{tenant.slug}</td>
                          <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400 capitalize">{tenant.plan}</td>
                          <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{tenant.user_count}</td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex px-2 py-0.5 text-xs rounded-full ${
                              tenant.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {tenant.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={5} className="text-center py-8 text-gray-500">No tenants found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Security Policies</h3>
              <p className="text-gray-500">Security policy management coming soon.</p>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Platform Settings</h3>
              <p className="text-gray-500">Platform settings management coming soon.</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};