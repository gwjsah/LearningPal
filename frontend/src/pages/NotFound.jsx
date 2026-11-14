import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Home, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ThemeToggleButton } from '../context/ThemeContext';
import { LearningPalLogo } from '../components/Doodles';
import { Button, NotebookBackButton, NotebookCard } from '../components/NotebookPrimitives';
import { getRoleHome } from '../utils/roleHome';

/**
 * Friendly 404 fallback page with role-aware navigation back to the user's workspace.
 */
export default function NotFound() {
  const { user, isAuthenticated } = useAuth();
  const homePath = isAuthenticated ? getRoleHome(user?.role) : '/';
  const homeLabel = isAuthenticated ? 'Back to My Dashboard' : 'Back to Cover Page';

  return (
    <div className="min-h-screen bg-paper dark:bg-chalkboard text-ink dark:text-chalkboard-chalk flex flex-col justify-center py-12 px-4 sm:px-6 transition-colors">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg mb-4 flex items-center justify-between">
        <Link
          to={homePath}
          className="inline-flex items-center gap-2 group focus:outline-none focus-visible:ring-2 focus-visible:ring-redpen rounded-lg p-1"
        >
          <LearningPalLogo className="w-8 h-8 transition-transform group-hover:-rotate-6" />
          <span className="font-bold text-xl tracking-tight">
            Learning<span className="font-hand text-2xl text-redpen -mt-0.5">Pal</span>
          </span>
        </Link>
        <ThemeToggleButton />
      </div>

      <main className="sm:mx-auto sm:w-full sm:max-w-lg">
        <NotebookCard
          pageLabel="Page 404 • Missing Index"
          ruled
          marginLine
          lifted
          bodyClassName="space-y-5 text-center"
        >
          <div className="w-14 h-14 mx-auto rounded-2xl bg-highlighter-yellowSoft border-2 border-ink dark:border-chalkboard-border flex items-center justify-center shadow-notebook-sm">
            <Compass className="w-7 h-7 text-ink" aria-hidden="true" />
          </div>

          <div className="space-y-2">
            <p className="text-xs font-mono font-bold uppercase tracking-wider text-redpen-dark dark:text-red-400">
              404 — Page Not Found
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-ink dark:text-chalkboard-chalk">
              This notebook page does not exist.
            </h1>
            <p className="text-sm text-ink-muted dark:text-chalkboard-muted leading-relaxed">
              The link may be outdated, or the class or topic URL may have been mistyped.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <NotebookBackButton to={homePath} label={homeLabel} />
            {!isAuthenticated && (
              <Button as={Link} to="/login" variant="primary" size="md">
                <LogIn className="w-4 h-4" aria-hidden="true" />
                <span>Log In</span>
              </Button>
            )}
            {isAuthenticated && (
              <Button as={Link} to={homePath} variant="primary" size="md">
                <Home className="w-4 h-4" aria-hidden="true" />
                <span>Go to Dashboard</span>
              </Button>
            )}
          </div>
        </NotebookCard>
      </main>
    </div>
  );
}
