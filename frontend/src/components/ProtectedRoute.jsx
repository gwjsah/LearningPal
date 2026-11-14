import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { NotebookLoader } from './NotebookPrimitives';
import { getRoleHome } from '../utils/roleHome';

/**
 * Route protection guard:
 * 1. Shows a warm notebook loading state while restoring session from JWT.
 * 2. Redirects unauthenticated users to /login cleanly without lingering redirect state.
 * 3. Enforces role-based access: if a user opens another role's page,
 *    redirects them smoothly to their own role's home view.
 */
export default function ProtectedRoute({ allowedRole, children }) {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper dark:bg-chalkboard text-ink dark:text-chalkboard-chalk transition-colors p-4">
        <NotebookLoader message="Checking your notebook index…" />
      </div>
    );
  }

  // Not logged in -> send cleanly to login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Logged in, but wrong role -> send to own role home
  if (allowedRole) {
    const allowedList = Array.isArray(allowedRole) ? allowedRole : [allowedRole];
    if (!allowedList.includes(user.role)) {
      return <Navigate to={getRoleHome(user.role)} replace />;
    }
  }

  return children;
}

