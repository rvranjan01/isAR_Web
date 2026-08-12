import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from '@/pages/LoginPage';
import { ClientDashboardPage } from '@/pages/ClientDashboardPage';
import { ProjectDetailPage } from '@/pages/ProjectDetailPage';
import { AdminDashboardPage } from '@/pages/AdminDashboardPage';
import { AdminOrdersPage } from '@/pages/AdminOrdersPage';
import { AdminNewOrderPage } from '@/pages/AdminNewOrderPage';
import { AdminOrderDetailPage } from '@/pages/AdminOrderDetailPage';
import { AdminSubscriptionsPage } from '@/pages/AdminSubscriptionsPage';
import { AdminClientsPage } from '@/pages/AdminClientsPage';
import { AdminClientDetailPage } from '@/pages/AdminClientDetailPage';
import { UnauthorizedPage } from '@/pages/UnauthorizedPage';
import { ARViewerPage } from '@/pages/ARViewerPage';
import { ProtectedRoute } from './ProtectedRoute';
import { useAuth } from '@/context/AuthContext';

export const AppRoutes: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public Route */}
      <Route path="/view/:id" element={<ARViewerPage />} />
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to={user?.role === 'admin' ? '/admin' : '/dashboard'} replace />
          ) : (
            <LoginPage />
          )
        }
      />

      {/* Client Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRole="client">
            <ClientDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/projects/:id"
        element={
          <ProtectedRoute allowedRole="client">
            <ProjectDetailPage />
          </ProtectedRoute>
        }
      />

      {/* Admin Protected Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRole="admin">
            <AdminDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/orders"
        element={
          <ProtectedRoute allowedRole="admin">
            <AdminOrdersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/orders/new"
        element={
          <ProtectedRoute allowedRole="admin">
            <AdminNewOrderPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/orders/:id"
        element={
          <ProtectedRoute allowedRole="admin">
            <AdminOrderDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/subscriptions"
        element={
          <ProtectedRoute allowedRole="admin">
            <AdminSubscriptionsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/clients"
        element={
          <ProtectedRoute allowedRole="admin">
            <AdminClientsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/clients/:email"
        element={
          <ProtectedRoute allowedRole="admin">
            <AdminClientDetailPage />
          </ProtectedRoute>
        }
      />

      {/* Shared Error / Boundary Routes */}
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Fallback wildcard */}
      <Route
        path="*"
        element={
          <Navigate
            to={
              !isAuthenticated
                ? '/login'
                : user?.role === 'admin'
                ? '/admin'
                : '/dashboard'
            }
            replace
          />
        }
      />
    </Routes>
  );
};
