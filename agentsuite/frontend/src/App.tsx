import React, { Suspense, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/auth.store';
import { useUIStore } from './stores/ui.store';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './pages/auth/ProtectedRoute';

// FIX: Correct lazy load paths
const LoginPage = React.lazy(() => import('./pages/auth/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = React.lazy(() => import('./pages/auth/RegisterPage').then(m => ({ default: m.RegisterPage })));
const DashboardPage = React.lazy(() => import('./pages/dashboard/DashboardPage').then(m => ({ default: m.DashboardPage })));
const BotListPage = React.lazy(() => import('./pages/bots/BotListPage').then(m => ({ default: m.BotListPage })));
const BotDetailPage = React.lazy(() => import('./pages/bots/BotDetailPage').then(m => ({ default: m.BotDetailPage })));
const WorkflowPage = React.lazy(() => import('./pages/workflows/WorkflowsPage').then(m => ({ default: m.WorkflowsPage })));
const IDEPage = React.lazy(() => import('./pages/ide/IDEPage').then(m => ({ default: m.IDEPage })));
const TaskInboxPage = React.lazy(() => import('./components/tasks/TaskInboxPage').then(m => ({ default: m.TaskInboxPage })));
const ProcessGraphPage = React.lazy(() => import('./components/observability/ProcessGraphPage').then(m => ({ default: m.ProcessGraphPage })));
const ObservabilityLayout = React.lazy(() => import('./pages/observability/ObservabilityLayout').then(m => ({ default: m.ObservabilityLayout })));
const LogsPage = React.lazy(() => import('./pages/observability/LogsPage').then(m => ({ default: m.LogsPage })));
const AnalyticsPage = React.lazy(() => import('./pages/observability/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })));
const AdminPage = React.lazy(() => import('./pages/admin/AdminPage').then(m => ({ default: m.AdminPage })));
// Add these imports:
const PrivacyPolicy = React.lazy(() => import('./pages/legal/PrivacyPolicy').then(m => ({ default: m.PrivacyPolicy })));
const TermsOfService = React.lazy(() => import('./pages/legal/TermsOfService').then(m => ({ default: m.TermsOfService })));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-gray-600 dark:text-gray-400">Loading...</p>
    </div>
  </div>
);

function App() {
  const { isAuthenticated, isLoading, setLoading } = useAuthStore();
  const { theme } = useUIStore();

  // FIX: Set loading to false after initial check
  useEffect(() => {
    // Check if user is already authenticated from persisted state
    const token = localStorage.getItem('auth-storage');
    if (token) {
      try {
        const parsed = JSON.parse(token);
        if (parsed.state?.accessToken) {
          // Already has token, stop loading
          setLoading(false);
        } else {
          setLoading(false);
        }
      } catch {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, [setLoading]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />}
        />
        <Route
          path="/register"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />}
        />

        {/* Legal routes */}
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />  

        {/* Protected routes */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/bots" element={<BotListPage />} />
          <Route path="/bots/:botId" element={<BotDetailPage />} />
          <Route path="/workflows" element={<WorkflowPage />} />
          <Route path="/ide" element={<IDEPage />} />
          <Route path="/ide/:workflowId" element={<IDEPage />} />
          <Route path="/tasks" element={<TaskInboxPage />} />
          
          // Replace the observability routes with:
          <Route path="/observability" element={<ObservabilityLayout />}>
            <Route index element={<Navigate to="/observability/logs" replace />} />
            <Route path="logs" element={<LogsPage />} />
            <Route path="process-graph" element={<ProcessGraphPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
          </Route>
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRoles={['admin']}>
                <AdminPage />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;