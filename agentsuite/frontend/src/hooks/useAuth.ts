import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';
import { authService } from '../services/auth.service';
import { UserRole } from '../types/common';
import toast from 'react-hot-toast';

export function useAuth() {
  const navigate = useNavigate();
  const { user, isAuthenticated, login, logout, setUser, setLoading } = useAuthStore();

  const handleLogin = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true);
      const response = await authService.login({ email, password });
      login(response.user, response.access_token, response.refresh_token);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Login failed';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [login, navigate, setLoading]);

  const handleRegister = useCallback(async (data: { email: string; password: string; full_name: string; tenant_name?: string }) => {
    try {
      setLoading(true);
      const response = await authService.register(data);
      login(response.user, response.access_token, response.refresh_token);
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Registration failed';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [login, navigate, setLoading]);

  const handleLogout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      logout();
      toast.success('Logged out successfully');
      navigate('/login');
    }
  }, [logout, navigate]);

  const hasPermission = useCallback((requiredRoles: UserRole[]) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return requiredRoles.includes(user.role);
  }, [user]);

  const refreshUser = useCallback(async () => {
    try {
      const userData = await authService.getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  }, [setUser]);

  return {
    user,
    isAuthenticated,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    hasPermission,
    refreshUser,
  };
}