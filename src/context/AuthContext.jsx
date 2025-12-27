/**
 * GearGuard - Authentication Context
 * 
 * Provides authentication state and methods throughout the application.
 * Handles login, logout, and role-based access control.
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/api';

// Create the auth context
const AuthContext = createContext(null);

/**
 * Authentication Provider Component
 * Wraps the application and provides auth state/methods to all children
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check for existing session on mount
  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
    setLoading(false);
  }, []);

  /**
   * Login with email and password
   */
  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const loggedInUser = await authService.login(email, password);
      setUser(loggedInUser);
      return loggedInUser;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Logout the current user
   */
  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
  }, []);

  /**
   * Check if user has one of the required roles
   */
  const hasRole = useCallback((requiredRoles) => {
    return authService.hasRole(user, requiredRoles);
  }, [user]);

  /**
   * Get user's permissions based on role
   */
  const getPermissions = useCallback(() => {
    if (!user) return {};
    return authService.getRolePermissions(user.role);
  }, [user]);

  /**
   * Check if user can perform a specific action
   */
  const can = useCallback((permission) => {
    const permissions = getPermissions();
    return permissions[permission] === true;
  }, [getPermissions]);

  // Context value
  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    logout,
    hasRole,
    getPermissions,
    can
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Custom hook to use auth context
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * Higher-order component for role-based access
 */
export function withAuth(Component, requiredRoles = null) {
  return function ProtectedComponent(props) {
    const { user, hasRole, loading } = useAuth();

    if (loading) {
      return <div>Loading...</div>;
    }

    if (!user) {
      return null; // Will be handled by route protection
    }

    if (requiredRoles && !hasRole(requiredRoles)) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
            <p className="text-gray-600">You don't have permission to view this page.</p>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
}

export default AuthContext;
