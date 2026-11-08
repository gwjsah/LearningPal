import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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
      <div className="min-h-screen flex items-center justify-center bg-paper dark:bg-chalkboard text-ink dark:text-chalkboard-chalk transition-colors">
        <div className="flex flex-col items-center gap-3 p-8 rounded-2xl border-2 border-ink dark:border-chalkboard-border bg-paper-card dark:bg-chalkboard-card shadow-lifted">
          <div className="w-8 h-8 border-4 border-ink-blue dark:border-highlighter-yellow border-t-transparent rounded-full animate-spin" />
          <p className="font-hand text-xl font-bold text-ink dark:text-chalkboard-chalk">
            Checking student notebook index…
          </p>
        </div>
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
      const roleHomeMap = {
        STUDENT: '/student',
        TEACHER: '/teacher',
        ADMIN: '/admin',
      };
      const destination = roleHomeMap[user.role] || '/';
      return <Navigate to={destination} replace />;
    }
  }

  return children;
}

