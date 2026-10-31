import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Route protection guard:
 * 1. Shows a warm notebook loading state while restoring session from JWT.
 * 2. Redirects unauthenticated users to /login (preserving intended destination).
 * 3. Enforces role-based access: if a user opens another role's page,
 *    redirects them smoothly to their own role's home view.
 */
export default function ProtectedRoute({ allowedRole, children }) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper text-ink">
        <div className="flex flex-col items-center gap-3 p-8 rounded-2xl border-2 border-ink bg-paper-card shadow-lifted">
          <div className="w-8 h-8 border-4 border-ink-blue border-t-transparent rounded-full animate-spin" />
          <p className="font-hand text-xl font-bold text-ink">Checking student notebook index…</p>
        </div>
      </div>
    );
  }

  // Not logged in -> send to login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Logged in, but wrong role -> send to own role home
  if (allowedRole && user.role !== allowedRole) {
    const roleHomeMap = {
      STUDENT: '/student',
      TEACHER: '/teacher',
      ADMIN: '/admin',
    };
    const destination = roleHomeMap[user.role] || '/';
    return <Navigate to={destination} replace />;
  }

  return children;
}

