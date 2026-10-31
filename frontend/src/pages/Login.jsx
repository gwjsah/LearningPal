import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogIn, AlertCircle, ArrowRight, Eye, EyeOff, BookOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { LearningPalLogo } from '../components/Doodles';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (serverError) setServerError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!formData.email.trim() || !formData.password) {
      setServerError('Please enter both your email and password.');
      return;
    }

    setSubmitting(true);

    try {
      const response = await login({
        email: formData.email.trim(),
        password: formData.password,
      });

      // Role-based destination redirect
      const roleHomeMap = {
        STUDENT: '/student',
        TEACHER: '/teacher',
        ADMIN: '/admin',
      };

      const from = location.state?.from?.pathname;
      const defaultDest = roleHomeMap[response.user?.role] || '/';
      const destination = from && !from.includes('/login') ? from : defaultDest;

      navigate(destination, { replace: true });
    } catch (err) {
      // Server error message (e.g., 401 Incorrect email or password, 403 awaiting approval)
      setServerError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 group focus:outline-none focus-visible:ring-2 focus-visible:ring-redpen rounded-lg p-1"
        >
          <LearningPalLogo className="w-10 h-10 transition-transform group-hover:-rotate-6" />
          <span className="font-bold text-2xl tracking-tight text-ink flex items-center">
            Learning<span className="font-hand text-3xl text-redpen -mt-1">Pal</span>
          </span>
        </Link>
        <h1 className="mt-3 text-2xl font-extrabold text-ink tracking-tight font-sans">
          Open Your Learning Notebook
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          Log in with your student, teacher, or administrator account
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        {/* Notebook Page Sheet (Pure CSS Notebook Look) */}
        <div className="relative bg-paper-card border-2 border-ink shadow-lifted rounded-2xl overflow-hidden notebook-margin-line">
          {/* Top Spiral Binder Holes */}
          <div
            className="flex items-center justify-between px-6 py-2 bg-paper-warm border-b border-ink/15 text-xs font-mono text-ink-muted"
            aria-hidden="true"
          >
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-paper border border-ink/40 shadow-inner inline-block" />
              <span className="w-3 h-3 rounded-full bg-paper border border-ink/40 shadow-inner inline-block" />
              <span className="w-3 h-3 rounded-full bg-paper border border-ink/40 shadow-inner inline-block" />
            </div>
            <span className="text-[11px] font-semibold text-redpen tracking-wider uppercase">
              Page 01 • User Authentication
            </span>
          </div>

          {/* Form Surface with Classic Ruled Lines */}
          <div className="p-6 sm:p-8 pl-12 sm:pl-16 bg-ruled-paper space-y-6">
            {/* Server Error Alert */}
            {serverError && (
              <div
                role="alert"
                aria-live="polite"
                className="flex items-start gap-3 p-3.5 rounded-xl border-2 border-redpen bg-redpen-soft/90 text-redpen-dark text-sm font-medium shadow-sm animate-fadeIn"
              >
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-redpen" />
                <div className="leading-snug">{serverError}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              {/* Email Address */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-mono font-bold uppercase tracking-wider text-ink mb-1.5"
                >
                  Email Address <span className="text-redpen">*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="e.g. maria.santos@school.edu"
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-ink/30 bg-paper-card text-ink font-medium text-sm placeholder:text-ink-light focus:outline-none focus:border-ink focus-visible:ring-2 focus-visible:ring-redpen transition-all"
                />
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="password"
                    className="block text-xs font-mono font-bold uppercase tracking-wider text-ink"
                  >
                    Password <span className="text-redpen">*</span>
                  </label>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your account password"
                    className="w-full px-3.5 py-2.5 pr-11 rounded-xl border-2 border-ink/30 bg-paper-card text-ink font-medium text-sm placeholder:text-ink-light focus:outline-none focus:border-ink focus-visible:ring-2 focus-visible:ring-redpen transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-redpen p-1 rounded"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl border-2 border-ink bg-redpen hover:bg-redpen-dark text-white font-bold text-sm shadow-[3px_3px_0_#1B2534] hover:translate-y-[-1px] hover:shadow-[4px_4px_0_#1B2534] active:translate-y-0 active:shadow-[1px_1px_0_#1B2534] disabled:opacity-60 disabled:cursor-not-allowed transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-redpen"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Opening Notebook…</span>
                    </>
                  ) : (
                    <>
                      <span>Open Notebook</span>
                      <LogIn className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Bottom Notebook Links */}
            <div className="pt-4 border-t border-ink/10 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-ink-muted gap-2">
              <span>Don't have an account yet?</span>
              <Link
                to="/signup"
                className="font-bold text-ink-blue hover:text-redpen underline decoration-redpen decoration-2 underline-offset-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-redpen rounded"
              >
                Sign up here →
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Note */}
        <p className="mt-4 text-center font-hand text-lg text-ink-muted">
          “Every page is a fresh step toward mastery.”
        </p>
      </div>
    </div>
  );
}

