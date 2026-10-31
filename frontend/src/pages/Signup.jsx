import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  UserPlus,
  AlertCircle,
  CheckCircle2,
  GraduationCap,
  BookOpenCheck,
  Eye,
  EyeOff,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { LearningPalLogo } from '../components/Doodles';

// Password requirement regular expression (8 to 72 chars, >= 1 letter, >= 1 number)
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,72}$/;

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState('STUDENT');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
        password: formData.password,
        role,
      });

      if (role === 'TEACHER' && !response.token) {
        // Teacher registered as PENDING: display approval confirmation screen
        setTeacherPendingSuccess(true);
      } else {
        // Student registered and activated: navigate immediately to student dashboard
        navigate('/student', { replace: true });
      }
    } catch (err) {
      setServerError(err.message || 'Registration failed. Please check your information.');
    } finally {
      setSubmitting(false);
    }
  };

  // --------------------------------------------------------------------------
  // Teacher Awaiting Approval Confirmation Screen
  // --------------------------------------------------------------------------
  if (teacherPendingSuccess) {
    return (
      <div className="min-h-screen bg-paper flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
          <div className="bg-paper-card border-2 border-ink shadow-lifted rounded-2xl overflow-hidden notebook-margin-line p-8 pl-14 sm:pl-16 bg-ruled-paper text-center space-y-6">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-highlighter-yellowSoft border-2 border-ink flex items-center justify-center shadow-[3px_3px_0_#1B2534]">
              <Clock className="w-8 h-8 text-ink" />
            </div>

            <div className="space-y-2">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-redpen">
                Teacher Account Request
              </span>
              <h2 className="text-2xl font-extrabold text-ink tracking-tight font-sans">
                Request Sent!
              </h2>
              <p className="text-sm text-ink-muted leading-relaxed">
                An admin needs to approve your teacher account before you can log in.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-paper-warm border border-ink/20 text-xs text-ink-muted text-left space-y-1">
              <p className="font-bold text-ink">Registered Email: <span className="font-mono text-ink-blue">{formData.email}</span></p>
              <p>Once an administrator reviews and approves your credentials, you will be able to log in to access the Teacher Gradebook.</p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <Link
                to="/login"
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-ink bg-redpen hover:bg-redpen-dark text-white font-bold text-sm shadow-[3px_3px_0_#1B2534] transition-all"
              >
                <span>Go to Log In</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/"
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-ink bg-paper-card text-ink font-bold text-sm hover:bg-paper-warm transition-all"
              >
                <span>Back to Home</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // Standard Signup Form
  // --------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-paper flex flex-col justify-center py-10 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-5">
        <Link
          to="/"
          className="inline-flex items-center gap-2 group focus:outline-none focus-visible:ring-2 focus-visible:ring-redpen rounded-lg p-1"
        >
          <LearningPalLogo className="w-10 h-10 transition-transform group-hover:-rotate-6" />
          <span className="font-bold text-2xl tracking-tight text-ink flex items-center">
            Learning<span className="font-hand text-3xl text-redpen -mt-1">Pal</span>
          </span>
        </Link>
        <h1 className="mt-2 text-2xl font-extrabold text-ink tracking-tight font-sans">
          Create Your Notebook Account
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          Join LearningPal to master topics and track learning progress
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        {/* Notebook Page Sheet */}
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
              Page 02 • New Registration
            </span>
          </div>

          {/* Form Surface with Ruled Lines */}
          <div className="p-6 sm:p-8 pl-12 sm:pl-16 bg-ruled-paper space-y-5">
            {/* Role Toggle Selector */}
            <div>
              <span className="block text-xs font-mono font-bold uppercase tracking-wider text-ink mb-1.5">
                I am registering as a:
              </span>
              <div
                className="grid grid-cols-2 gap-2 p-1 rounded-xl border-2 border-ink bg-paper-warm shadow-[2px_2px_0_#1B2534]"
                role="radiogroup"
                aria-label="Account role selection"
              >
                <button
                  type="button"
                  role="radio"
                  aria-checked={role === 'STUDENT'}
                  onClick={() => setRole('STUDENT')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-redpen ${
                    role === 'STUDENT'
                      ? 'bg-highlighter-yellow text-ink border border-ink shadow-sm'
                      : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>Student (Instant)</span>
                </button>

                <button
                  type="button"
                  role="radio"
                  aria-checked={role === 'TEACHER'}
                  onClick={() => setRole('TEACHER')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-redpen ${
                    role === 'TEACHER'
                      ? 'bg-highlighter-mint text-ink border border-ink shadow-sm'
                      : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  <BookOpenCheck className="w-4 h-4" />
                  <span>Teacher (Approval)</span>
                </button>
              </div>

              {role === 'TEACHER' && (
                <p className="mt-1.5 text-[11px] text-ink-muted font-mono leading-tight">
                  ★ Teacher accounts require administrator verification prior to login.
                </p>
              )}
            </div>

            {/* Server Error Alert */}
            {serverError && (
              <div
                role="alert"
                aria-live="polite"
                className="flex items-start gap-2.5 p-3 rounded-xl border-2 border-redpen bg-redpen-soft text-redpen-dark text-xs sm:text-sm font-medium shadow-sm animate-fadeIn"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-redpen" />
                <div className="leading-snug">{serverError}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {/* Full Name */}
              <div>
                <label
                  htmlFor="fullName"
                  className="block text-xs font-mono font-bold uppercase tracking-wider text-ink mb-1"
                >
                  Full Name <span className="text-redpen">*</span>
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="e.g. Maria Santos"
                  className={`w-full px-3.5 py-2 rounded-xl border-2 bg-paper-card text-ink font-medium text-sm placeholder:text-ink-light focus:outline-none focus-visible:ring-2 focus-visible:ring-redpen transition-all ${
                    clientErrors.fullName ? 'border-redpen' : 'border-ink/30 focus:border-ink'
                  }`}
                />
                {clientErrors.fullName && (
                  <p className="mt-1 text-xs text-redpen font-medium">{clientErrors.fullName}</p>
                )}
              </div>

              {/* Email Address */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-mono font-bold uppercase tracking-wider text-ink mb-1"
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
                  placeholder="e.g. student@school.edu"
                  className={`w-full px-3.5 py-2 rounded-xl border-2 bg-paper-card text-ink font-medium text-sm placeholder:text-ink-light focus:outline-none focus-visible:ring-2 focus-visible:ring-redpen transition-all ${
                    clientErrors.email ? 'border-redpen' : 'border-ink/30 focus:border-ink'
                  }`}
                />
                {clientErrors.email && (
                  <p className="mt-1 text-xs text-redpen font-medium">{clientErrors.email}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-mono font-bold uppercase tracking-wider text-ink mb-1"
                >
                  Password <span className="text-redpen">*</span>
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Create a strong password"
                    className={`w-full px-3.5 py-2 pr-10 rounded-xl border-2 bg-paper-card text-ink font-medium text-sm placeholder:text-ink-light focus:outline-none focus-visible:ring-2 focus-visible:ring-redpen transition-all ${
                      clientErrors.password ? 'border-redpen' : 'border-ink/30 focus:border-ink'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink focus:outline-none p-1 rounded"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {/* Clear Password Rule UX Hint */}
                <p className="mt-1 text-[11px] font-mono text-ink-muted">
                  Rule: 8+ characters, with at least one letter and one number
                </p>
                {clientErrors.password && (
                  <p className="mt-1 text-xs text-redpen font-medium">{clientErrors.password}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-xs font-mono font-bold uppercase tracking-wider text-ink mb-1"
                >
                  Confirm Password <span className="text-redpen">*</span>
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your password"
                    className={`w-full px-3.5 py-2 pr-10 rounded-xl border-2 bg-paper-card text-ink font-medium text-sm placeholder:text-ink-light focus:outline-none focus-visible:ring-2 focus-visible:ring-redpen transition-all ${
                      clientErrors.confirmPassword ? 'border-redpen' : 'border-ink/30 focus:border-ink'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink focus:outline-none p-1 rounded"
                    aria-label={showConfirmPassword ? 'Hide confirmed password' : 'Show confirmed password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {clientErrors.confirmPassword && (
                  <p className="mt-1 text-xs text-redpen font-medium">{clientErrors.confirmPassword}</p>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-ink bg-redpen hover:bg-redpen-dark text-white font-bold text-sm shadow-[3px_3px_0_#1B2534] hover:translate-y-[-1px] hover:shadow-[4px_4px_0_#1B2534] active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-redpen"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Writing to Notebook…</span>
                    </>
                  ) : (
                    <>
                      <span>{role === 'STUDENT' ? 'Create Student Notebook' : 'Request Teacher Account'}</span>
                      <UserPlus className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Bottom Links */}
            <div className="pt-3 border-t border-ink/10 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-ink-muted gap-2">
              <span>Already have an account?</span>
              <Link
                to="/login"
                className="font-bold text-ink-blue hover:text-redpen underline decoration-redpen decoration-2 underline-offset-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-redpen rounded"
              >
                Log in here →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

