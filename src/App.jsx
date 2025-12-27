/**
 * GearGuard - Main Application Component
 * 
 * Root component with React Router configuration.
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import MainLayout from './components/layout/MainLayout';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import EquipmentListPage from './pages/equipment/EquipmentListPage';
import EquipmentDetailPage from './pages/equipment/EquipmentDetailPage';
import EquipmentFormPage from './pages/equipment/EquipmentFormPage';
import TeamsPage from './pages/teams/TeamsPage';
import RequestsListPage from './pages/requests/RequestsListPage';
import RequestDetailPage from './pages/requests/RequestDetailPage';
import RequestFormPage from './pages/requests/RequestFormPage';
import KanbanPage from './pages/kanban/KanbanPage';
import CalendarPage from './pages/calendar/CalendarPage';

// Protected Route Component
function ProtectedRoute({ children, requiredPermission }) {
  const { user, can, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredPermission && !can(requiredPermission)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <MainLayout>{children}</MainLayout>;
}

// Public Route Component (redirect if logged in)
function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
}

// App Routes
function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      
      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      
      {/* Equipment Routes */}
      <Route
        path="/equipment"
        element={
          <ProtectedRoute>
            <EquipmentListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/equipment/new"
        element={
          <ProtectedRoute requiredPermission="canManageEquipment">
            <EquipmentFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/equipment/:id"
        element={
          <ProtectedRoute>
            <EquipmentDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/equipment/:id/edit"
        element={
          <ProtectedRoute requiredPermission="canManageEquipment">
            <EquipmentFormPage />
          </ProtectedRoute>
        }
      />
      
      {/* Team Routes */}
      <Route
        path="/teams"
        element={
          <ProtectedRoute>
            <TeamsPage />
          </ProtectedRoute>
        }
      />
      
      {/* Request Routes */}
      <Route
        path="/requests"
        element={
          <ProtectedRoute>
            <RequestsListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/requests/new"
        element={
          <ProtectedRoute requiredPermission="canCreateRequests">
            <RequestFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/requests/:id"
        element={
          <ProtectedRoute>
            <RequestDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/requests/:id/edit"
        element={
          <ProtectedRoute requiredPermission="canManageAllRequests">
            <RequestFormPage />
          </ProtectedRoute>
        }
      />
      
      {/* Kanban Board */}
      <Route
        path="/kanban"
        element={
          <ProtectedRoute>
            <KanbanPage />
          </ProtectedRoute>
        }
      />
      
      {/* Calendar */}
      <Route
        path="/calendar"
        element={
          <ProtectedRoute>
            <CalendarPage />
          </ProtectedRoute>
        }
      />
      
      {/* Default & Fallback Routes */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

// Main App Component
function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
