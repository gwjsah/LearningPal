import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ThemeToggleButton } from '../context/ThemeContext';
import { LearningPalLogo } from '../components/Doodles';
import { Button, Field, NotebookCard } from '../components/NotebookPrimitives';

export default function Login() {
  const { login, user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  // If already authenticated, redirect immediately to the user's role workspace
  useEffect(() => {
    if (isAuthenticated && user?.role) {
      const roleHomeMap = {
        STUDENT: '/student',
        TEACHER: '/teacher',
        ADMIN: '/admin',
      };
      const dest = roleHomeMap[user.role] || '/';
      navigate(dest, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (serverError) setServerError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!formData.email.trim() || !formData.password) {
      setServerError('Please enter both your email address and password.');
      return;
    }

    setSubmitting(true);

    try {
      const response = await login({
        email: formData.email.trim(),
        password: formData.password,
      });

      const roleHomeMap = {
        STUDENT: '/student',
        TEACHER: '/teacher',
        ADMIN: '/admin',
      };

      // Always redirect cleanly to role home: STUDENT -> /student, TEACHER -> /teacher, ADMIN -> /admin
      const destination = roleHomeMap[response.user?.role] || '/';
      navigate(destination, { replace: true });
    } catch (err) {
      setServerError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper dark:bg-chalkboard text-ink dark:text-chalkboard-chalk flex flex-col justify-center py-10 sm:px-6 lg:px-8 transition-colors overflow-x-hidden">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-highlighter-yellow focus:text-ink focus:font-bold focus:shadow-lg"
      >
        Skip to login form
      </a>

      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0 mb-4 flex items-center justify-between">
        <Link
          to="/"
          className="text-xs font-mono font-bold text-ink-muted dark:text-chalkboard-muted hover:text-redpen focus:outline-none focus-visible:ring-2 focus-visible:ring-redpen rounded px-1 py-0.5 transition-colors"
        >
          ← Back to Cover Page
        </Link>
        <ThemeToggleButton />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6 px-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 group focus:outline-none focus-visible:ring-2 focus-visible:ring-redpen rounded-lg p-1"
        >
          <LearningPalLogo className="w-10 h-10 transition-transform group-hover:-rotate-6" />
          <span className="font-bold text-2xl tracking-tight text-ink dark:text-chalkboard-chalk flex items-center">
            Learning<span className="font-hand text-3xl text-redpen -mt-1">Pal</span>
          </span>
        </Link>
        <h1 className="mt-3 text-2xl font-extrabold text-ink dark:text-chalkboard-chalk tracking-tight font-sans">
          Open Your Learning Notebook
        </h1>
        <p className="mt-1 text-sm text-ink-muted dark:text-chalkboard-muted">
          Log in with your student, teacher, or administrator account
        </p>
      </div>

      <main id="main-content" className="sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <NotebookCard
          pageLabel="Page 01 • User Authentication"
          ruled
          marginLine
          lifted
          bodyClassName="space-y-6"
        >
          {serverError && (
            <div
              id="login-server-error"
              role="alert"
              aria-live="polite"
              className="flex items-start gap-3 p-3.5 rounded-xl border-2 border-redpen bg-redpen-soft text-redpen-dark text-sm font-medium shadow-sm animate-fadeIn"
            >
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-redpen" aria-hidden="true" />
              <div className="leading-snug">{serverError}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <Field
              id="email"
              name="email"
              type="email"
              label="Email Address"
              autoComplete="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="e.g. maria.santos@school.edu"
              describedBy={serverError ? 'login-server-error' : undefined}
            />

            <Field
              id="password"
              name="password"
              type="password"
              label="Password"
              autoComplete="current-password"
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your account password"
              describedBy={serverError ? 'login-server-error' : undefined}
            />

            <div className="pt-2">
              <Button type="submit" variant="primary" size="md" disabled={submitting} className="w-full py-3.5">
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Opening Notebook…</span>
                  </>
                ) : (
                  <>
                    <span>Open Notebook</span>
                    <LogIn className="w-4 h-4" aria-hidden="true" />
                  </>
                )}
              </Button>
            </div>
          </form>

          <div className="pt-4 border-t border-ink/10 dark:border-chalkboard-borderSubtle flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-ink-muted dark:text-chalkboard-muted gap-2">
            <span>Don't have an account yet?</span>
            <Link
              to="/signup"
              className="font-bold text-ink-blue dark:text-highlighter-yellow hover:text-redpen underline decoration-redpen decoration-2 underline-offset-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-redpen rounded px-1"
            >
              Sign up here →
            </Link>
          </div>
        </NotebookCard>

        <p className="mt-4 text-center font-hand text-xl text-ink-muted dark:text-chalkboard-muted">
          “Every page is a fresh step toward mastery.”
        </p>
      </main>
    </div>
  );
}
