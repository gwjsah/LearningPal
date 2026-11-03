import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  UserPlus,
  AlertCircle,
  GraduationCap,
  BookOpenCheck,
  Clock,
  ArrowRight,
  Home,
  Building2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ThemeToggleButton } from '../context/ThemeContext';
import { LearningPalLogo } from '../components/Doodles';
import { Button, Field, NotebookCard } from '../components/NotebookPrimitives';

// Password requirement regular expression (8 to 72 chars, >= 1 letter, >= 1 number)
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,72}$/;

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState('STUDENT');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    institutionCode: '',
    password: '',
    confirmPassword: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [clientErrors, setClientErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [teacherPendingSuccess, setTeacherPendingSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (clientErrors[name]) {
      setClientErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (serverError) setServerError('');
  };

  const validate = () => {
    const errors = {};

    if (!formData.fullName.trim()) {
      errors.fullName = 'Full name is required';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Please provide a valid email address';
    }

    if (!formData.institutionCode.trim()) {
      errors.institutionCode = 'Institution code is required';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (!PASSWORD_REGEX.test(formData.password)) {
      errors.password = 'Password needs at least one letter and one number, and must be 8+ characters';
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setClientErrors(errors);
      return;
    }

    setSubmitting(true);

    try {
      const response = await signup({
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        institutionCode: formData.institutionCode.trim().toUpperCase(),
        password: formData.password,
        role,
      });

      if (role === 'TEACHER' && !response.token) {
        setTeacherPendingSuccess(true);
      } else {
        navigate('/student', { replace: true });
      }
    } catch (err) {
      setServerError(err.message || 'Registration failed. Please check your information.');
    } finally {
      setSubmitting(false);
    }
  };

  // Teacher Awaiting Approval Confirmation Screen
  if (teacherPendingSuccess) {
    return (
      <div className="min-h-screen bg-paper dark:bg-chalkboard text-ink dark:text-chalkboard-chalk flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors overflow-x-hidden">
        <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 mb-4 flex items-center justify-end">
          <ThemeToggleButton />
        </div>
        <main id="main-content" className="sm:mx-auto sm:w-full sm:max-w-md px-4">
          <NotebookCard
            pageLabel="Page 02 • Registration Pending"
            ruled
            marginLine
            lifted
            bodyClassName="space-y-6 text-center"
          >
            <div className="w-16 h-16 mx-auto rounded-full bg-highlighter-yellow/30 border-2 border-dashed border-ink dark:border-white/40 flex items-center justify-center text-ink dark:text-chalkboard-chalk shadow-notebook-sm">
              <Clock className="w-8 h-8 text-ink dark:text-chalkboard-chalk animate-pulse" aria-hidden="true" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-bold font-sans text-ink dark:text-chalkboard-chalk">
                Request Sent to Administrator
              </h1>
              <p className="text-xs sm:text-sm text-ink-muted dark:text-chalkboard-muted leading-relaxed font-sans">
                Thank you for registering,{' '}
                <strong className="text-ink dark:text-chalkboard-chalk">{formData.fullName}</strong>.
              </p>
              <div className="p-3 rounded-xl bg-paper-warm dark:bg-chalkboard-surface border border-ink/15 dark:border-white/20 text-xs font-mono text-left space-y-1">
                <div><span className="text-ink-muted dark:text-chalkboard-muted">Email:</span> {formData.email}</div>
                <div><span className="text-ink-muted dark:text-chalkboard-muted">Institution:</span> {formData.institutionCode.toUpperCase()}</div>
                <div><span className="text-ink-muted dark:text-chalkboard-muted">Status:</span> <span className="text-ink-blue dark:text-highlighter-mint font-bold uppercase">PENDING APPROVAL</span></div>
              </div>
              <p className="text-xs text-ink-muted dark:text-chalkboard-muted leading-relaxed pt-2">
                An administrator for your institution must approve your instructor account before you can log in.
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <Link to="/login" className="w-full">
                <Button variant="primary" size="md" className="w-full justify-center">
                  <span>Back to Login</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Button>
              </Link>
              <Link to="/" className="w-full">
                <Button variant="ghost" size="sm" className="w-full justify-center font-mono text-xs">
                  <Home className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
                  <span>Return to Homepage</span>
                </Button>
              </Link>
            </div>
          </NotebookCard>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper dark:bg-chalkboard text-ink dark:text-chalkboard-chalk flex flex-col justify-center py-10 sm:px-6 lg:px-8 transition-colors overflow-x-hidden">
      {/* Skip to Main Content Link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 px-4 py-2 bg-highlighter-yellow text-ink font-bold border-2 border-ink rounded-lg shadow-notebook"
      >
        Skip to registration form
      </a>

      {/* Top utility bar */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 mb-2 flex items-center justify-between">
        <Link
          to="/"
          className="text-xs font-mono text-ink-muted dark:text-chalkboard-muted hover:text-ink dark:hover:text-chalkboard-chalk flex items-center gap-1 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-redpen rounded px-1"
        >
          <span>← Back to home</span>
        </Link>
        <ThemeToggleButton />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 text-center mb-6">
        <Link to="/" className="inline-flex items-center gap-2 group mb-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-redpen rounded">
          <LearningPalLogo className="w-9 h-9 transition-transform group-hover:scale-105" />
          <span className="font-heading text-2xl font-bold tracking-tight text-ink dark:text-chalkboard-chalk">
            Learning<span className="text-redpen italic">Pal</span>
          </span>
        </Link>
        <h1 className="mt-2 text-2xl font-extrabold text-ink dark:text-chalkboard-chalk tracking-tight font-sans">
          Create Your Notebook Account
        </h1>
        <p className="mt-1 text-sm text-ink-muted dark:text-chalkboard-muted">
          Join your institution to master topics and track learning progress
        </p>
      </div>

      <main id="main-content" className="sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <NotebookCard
          pageLabel="Page 02 • New Registration"
          ruled
          marginLine
          lifted
          bodyClassName="space-y-5"
        >
          {/* Role Toggle Selector */}
          <div>
            <span className="block text-xs font-mono font-bold uppercase tracking-wider text-ink dark:text-chalkboard-chalk mb-1.5">
              I am registering as a:
            </span>
            <div
              className="grid grid-cols-2 gap-2 p-1 rounded-xl border-2 border-ink dark:border-white/40 bg-paper-warm dark:bg-chalkboard-surface shadow-notebook-sm"
              role="radiogroup"
              aria-label="Account role selection"
            >
              <button
                type="button"
                role="radio"
                aria-checked={role === 'STUDENT'}
                onClick={() => setRole('STUDENT')}
                className={`min-h-[40px] flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-redpen ${
                  role === 'STUDENT'
                    ? 'bg-highlighter-yellow text-ink border border-ink shadow-sm'
                    : 'text-ink-muted dark:text-chalkboard-muted hover:text-ink dark:hover:text-chalkboard-chalk'
                }`}
              >
                <GraduationCap className="w-4 h-4" aria-hidden="true" />
                <span>Student (Instant)</span>
              </button>

              <button
                type="button"
                role="radio"
                aria-checked={role === 'TEACHER'}
                onClick={() => setRole('TEACHER')}
                className={`min-h-[40px] flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-redpen ${
                  role === 'TEACHER'
                    ? 'bg-highlighter-mint text-ink border border-ink shadow-sm'
                    : 'text-ink-muted dark:text-chalkboard-muted hover:text-ink dark:hover:text-chalkboard-chalk'
                }`}
              >
                <BookOpenCheck className="w-4 h-4" aria-hidden="true" />
                <span>Teacher (Approval)</span>
              </button>
            </div>

            {role === 'TEACHER' && (
              <p className="mt-1.5 text-[11px] text-ink-muted dark:text-chalkboard-muted font-mono leading-tight">
                ★ Teacher accounts require administrator verification prior to login.
              </p>
            )}
          </div>

          {serverError && (
            <div
              id="signup-server-error"
              role="alert"
              aria-live="polite"
              className="flex items-start gap-2.5 p-3 rounded-xl border-2 border-redpen bg-redpen-soft text-redpen-dark text-xs sm:text-sm font-medium shadow-sm animate-fadeIn"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-redpen" aria-hidden="true" />
              <div className="leading-snug">{serverError}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <Field
              id="fullName"
              name="fullName"
              type="text"
              label="Full Name"
              autoComplete="name"
              required
              value={formData.fullName}
              onChange={handleChange}
              placeholder="e.g. Maria Santos"
              error={clientErrors.fullName}
            />

            <Field
              id="email"
              name="email"
              type="email"
              label="Email Address"
              autoComplete="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="e.g. student@school.edu"
              error={clientErrors.email}
            />

            <Field
              id="institutionCode"
              name="institutionCode"
              type="text"
              label="Institution Code"
              required
              value={formData.institutionCode}
              onChange={handleChange}
              placeholder="e.g. PILOT-2026"
              hint="Ask your school for this code"
              error={clientErrors.institutionCode}
            />

            <Field
              id="password"
              name="password"
              type="password"
              label="Password"
              autoComplete="new-password"
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a strong password"
              hint="Rule: 8+ characters, with at least one letter and one number"
              error={clientErrors.password}
            />

            <Field
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              label="Confirm Password"
              autoComplete="new-password"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              error={clientErrors.confirmPassword}
            />

            <div className="pt-2">
              <Button type="submit" variant="primary" size="md" disabled={submitting} className="w-full py-3">
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Writing to Notebook…</span>
                  </>
                ) : (
                  <>
                    <span>{role === 'STUDENT' ? 'Create Student Notebook' : 'Request Teacher Account'}</span>
                    <UserPlus className="w-4 h-4" aria-hidden="true" />
                  </>
                )}
              </Button>
            </div>
          </form>

          <div className="pt-3 border-t border-ink/10 dark:border-white/15 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-ink-muted dark:text-chalkboard-muted gap-2">
            <span>Already have an account?</span>
            <Link
              to="/login"
              className="font-bold text-ink-blue dark:text-highlighter-yellow hover:text-redpen underline decoration-redpen decoration-2 underline-offset-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-redpen rounded px-1"
            >
              Log in here →
            </Link>
          </div>
        </NotebookCard>
      </main>
    </div>
  );
}
