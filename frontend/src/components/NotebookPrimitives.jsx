import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, LogOut, ShieldCheck, CheckCircle, AlertCircle, RefreshCw, Moon, Sun, MessageSquare } from 'lucide-react';
import { LearningPalLogo, SquigglyUnderline } from './Doodles';
import { ThemeToggleButton, useTheme } from '../context/ThemeContext';

const BUTTON_VARIANTS = {
  primary:
    'border-2 border-ink dark:border-chalkboard-borderStrong bg-redpen hover:bg-redpen-dark text-white shadow-notebook hover:-translate-y-0.5 active:translate-y-0',
  secondary:
    'border-2 border-ink dark:border-chalkboard-border bg-paper-card dark:bg-chalkboard-card hover:bg-paper-warm dark:hover:bg-chalkboard-surface text-ink dark:text-chalkboard-chalk shadow-notebook-sm hover:-translate-y-0.5 active:translate-y-0',
  mint:
    'border-2 border-ink dark:border-chalkboard-border bg-highlighter-mint hover:bg-highlighter-mintSoft text-ink shadow-notebook-sm hover:-translate-y-0.5 active:translate-y-0',
  yellow:
    'border-2 border-ink dark:border-chalkboard-border bg-highlighter-yellow hover:bg-highlighter-yellowSoft text-ink shadow-notebook-sm hover:-translate-y-0.5 active:translate-y-0',
  danger:
    'border-2 border-ink dark:border-chalkboard-border bg-redpen-soft hover:bg-redpen hover:text-white text-redpen-dark shadow-notebook-sm hover:-translate-y-0.5 active:translate-y-0',
  ghost:
    'border border-ink/25 dark:border-chalkboard-borderSubtle bg-paper-warm dark:bg-chalkboard-surface hover:bg-highlighter-yellow/35 dark:hover:bg-chalkboard-highlight text-ink dark:text-chalkboard-chalk',
};

const BUTTON_SIZES = {
  sm: 'min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-bold gap-1.5',
  md: 'min-h-[42px] px-4 py-2.5 rounded-xl text-sm font-bold gap-2',
  lg: 'min-h-[48px] px-6 py-3.5 rounded-xl text-base font-bold gap-2.5',
};

/**
 * Shared notebook Button / Link primitive with consistent focus states & tap targets.
 */
export function Button({
  to,
  href,
  type = 'button',
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  children,
  ...rest
}) {
  const classes = `inline-flex items-center justify-center transition-all cursor-pointer disabled:opacity-60 disabled:pointer-events-none focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-redpen ${
    BUTTON_VARIANTS[variant] || BUTTON_VARIANTS.primary
  } ${BUTTON_SIZES[size] || BUTTON_SIZES.md} ${className}`;

  if (to) {
    return (
      <Link to={to} className={classes} {...rest}>
        {children}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} className={classes} {...rest}>
        {children}
      </a>
    );
  }

  return (
    <button type={type} disabled={disabled} className={classes} {...rest}>
      {children}
    </button>
  );
}

/**
 * Shared labeled form Field with accessible hint, inline validation error, and password visibility toggle.
 */
export function Field({
  id,
  name,
  label,
  type = 'text',
  required = false,
  value,
  onChange,
  placeholder,
  autoComplete,
  hint,
  error,
  describedBy,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const resolvedType = isPassword ? (showPassword ? 'text' : 'password') : type;

  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const ariaDescribedBy = [describedBy, hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div>
      <label
        htmlFor={id}
        className="block text-xs font-mono font-bold uppercase tracking-wider text-ink dark:text-chalkboard-chalk mb-1.5"
      >
        {label} {required && <span className="text-redpen">*</span>}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name || id}
          type={resolvedType}
          autoComplete={autoComplete}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={ariaDescribedBy}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full min-h-[42px] px-3.5 py-2.5 ${
            isPassword ? 'pr-11' : ''
          } rounded-xl border-2 bg-paper-card dark:bg-chalkboard-surface text-ink dark:text-chalkboard-chalk font-medium text-sm placeholder:text-ink-light dark:placeholder:text-chalkboard-muted/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-redpen transition-colors ${
            error
              ? 'border-redpen'
              : 'border-ink/30 dark:border-chalkboard-border focus:border-ink dark:focus:border-chalkboard-borderStrong'
          }`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 inline-flex items-center justify-center text-ink-muted dark:text-chalkboard-muted hover:text-ink dark:hover:text-chalkboard-chalk focus:outline-none focus-visible:ring-2 focus-visible:ring-redpen rounded-lg"
            aria-label={showPassword ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      {hint && (
        <p id={hintId} className="mt-1 text-[11px] font-mono text-ink-muted dark:text-chalkboard-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="mt-1 text-xs text-redpen font-medium">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * Shared Notebook Page / Card container with optional spiral punch strip & red vertical margin line.
 */
export function NotebookCard({
  pageLabel,
  ruled = false,
  marginLine = false,
  lifted = false,
  className = '',
  bodyClassName = '',
  children,
}) {
  return (
    <div
      className={`relative bg-paper-card dark:bg-chalkboard-card border-2 border-ink dark:border-chalkboard-border ${
        lifted ? 'shadow-lifted' : 'shadow-paper'
      } rounded-2xl overflow-hidden ${marginLine ? 'notebook-margin-line' : ''} ${className}`}
    >
      {pageLabel && (
        <div
          className="flex items-center justify-between px-6 py-2 bg-paper-warm dark:bg-chalkboard-surface border-b border-ink/15 dark:border-chalkboard-borderSubtle text-xs font-mono text-ink-muted dark:text-chalkboard-muted"
          aria-hidden="true"
        >
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-paper dark:bg-chalkboard border border-ink/40 dark:border-chalkboard-borderSubtle shadow-inner inline-block" />
            <span className="w-3 h-3 rounded-full bg-paper dark:bg-chalkboard border border-ink/40 dark:border-chalkboard-borderSubtle shadow-inner inline-block" />
            <span className="w-3 h-3 rounded-full bg-paper dark:bg-chalkboard border border-ink/40 dark:border-chalkboard-borderSubtle shadow-inner inline-block" />
          </div>
          <span className="text-[11px] font-semibold text-redpen tracking-wider uppercase">
            {pageLabel}
          </span>
        </div>
      )}
      <div
        className={`${ruled ? 'bg-ruled-paper' : ''} ${
          marginLine ? 'p-6 sm:p-8 pl-12 sm:pl-16' : 'p-6'
        } ${bodyClassName}`}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * Shared Section Heading for Landing Page sections.
 */
export function SectionHeading({
  id,
  label,
  badgeClassName = 'bg-highlighter-yellowSoft dark:bg-chalkboard-surface text-ink dark:text-chalkboard-chalk border-ink/20 dark:border-chalkboard-borderSubtle',
  icon: Icon,
  headline,
  subheadline,
  underline = true,
  children,
}) {
  return (
    <div className="max-w-3xl mx-auto text-center space-y-4">
      {label && (
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md font-mono text-xs font-bold uppercase tracking-wider border ${badgeClassName}`}
        >
          {Icon && <Icon className="w-3.5 h-3.5" aria-hidden="true" />}
          <span>{label}</span>
        </span>
      )}
      <h2
        id={id}
        className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-ink dark:text-chalkboard-chalk tracking-tight"
      >
        {headline}
      </h2>
      {underline && (
        <div className="flex justify-center">
          <SquigglyUnderline className="w-52 h-3" />
        </div>
      )}
      {subheadline && (
        <p className="text-base sm:text-lg text-ink-muted dark:text-chalkboard-muted leading-relaxed">
          {subheadline}
        </p>
      )}
      {children}
    </div>
  );
}

/**
 * Shared Product-Surface Portal Shell + Page Heading Banner for Student, Teacher, and Admin portals.
 */
export function PortalShell({
  portalSubtitle,
  skipLabel = 'Skip to main workspace',
  user,
  onLogout,
  badgeIcon: BadgeIcon,
  badgeLabel,
  badgeColorClass = 'bg-highlighter-yellow text-ink',
  title,
  subtitle,
  headerRight,
  children,
}) {
  const { darkMode, toggleDarkMode } = useTheme();

  return (
    <div className="min-h-screen bg-paper dark:bg-chalkboard flex flex-col text-ink dark:text-chalkboard-chalk font-sans transition-colors overflow-x-hidden">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-highlighter-yellow focus:text-ink focus:font-bold focus:shadow-lg"
      >
        {skipLabel}
      </a>

      <header className="sticky top-0 z-50 w-full border-b-2 border-ink/15 dark:border-chalkboard-borderSubtle bg-paper/95 dark:bg-chalkboard/95 backdrop-blur-md shadow-sm transition-colors">
        <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 h-16 flex items-center justify-between gap-4">
          <Link
            to={
              user?.role === 'STUDENT'
                ? '/student'
                : user?.role === 'TEACHER'
                  ? '/teacher'
                  : user?.role === 'SUPER_ADMIN'
                    ? '/super'
                    : '/admin'
            }
            className="group flex items-center gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-redpen rounded-lg p-1 shrink-0"
            title="Go to dashboard"
          >
            <LearningPalLogo className="w-9 h-9 transition-transform duration-200 group-hover:-rotate-6 shrink-0" />
            <div className="flex flex-col">
              <span className="font-bold text-xl tracking-tight text-ink dark:text-chalkboard-chalk flex items-center gap-1 leading-tight whitespace-nowrap">
                Learning<span className="font-hand text-2xl text-redpen dark:text-red-400 -mt-0.5">Pal</span>
              </span>
              <span className="text-[10px] font-mono uppercase tracking-wider text-ink-muted dark:text-chalkboard-muted -mt-0.5 whitespace-nowrap">
                {portalSubtitle || 'Study Smart Notebook'}
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {user?.role && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-mono font-bold uppercase tracking-wider border border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-card dark:bg-chalkboard-card text-ink dark:text-chalkboard-chalk shadow-xs">
                {user.role}
              </span>
            )}

            <div className="hidden md:flex flex-col text-right">
              <span className="text-xs font-bold text-ink dark:text-chalkboard-chalk truncate max-w-[160px]">
                {user?.fullName || 'Notebook User'}
              </span>
              <span className="text-[10px] font-mono text-ink-muted dark:text-chalkboard-muted truncate max-w-[160px]">
                {user?.email}
              </span>
            </div>

            <div className="hidden sm:block w-px h-6 bg-ink/15 dark:bg-chalkboard-borderSubtle my-auto" aria-hidden="true" />

            {/* In-app Usability Survey shortcut for Students and Teachers */}
            {(user?.role === 'STUDENT' || user?.role === 'TEACHER') && (
              <Link
                to="/feedback/survey"
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-card dark:bg-chalkboard-card text-ink dark:text-chalkboard-chalk hover:bg-highlighter-yellowSoft dark:hover:bg-chalkboard-surface transition-colors shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-redpen"
                title="Share your experience in our 2-minute usability survey"
              >
                <MessageSquare className="w-3.5 h-3.5 text-redpen dark:text-highlighter-yellow" aria-hidden="true" />
                <span>Give Feedback</span>
              </Link>
            )}

            {/* Chalkboard / Night Study Toggle matching Navbar */}
            <button
              type="button"
              onClick={toggleDarkMode}
              className="p-2 rounded-xl border border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-card dark:bg-chalkboard-card text-ink dark:text-chalkboard-chalk hover:bg-highlighter-yellowSoft dark:hover:bg-chalkboard-surface transition-colors shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-redpen cursor-pointer"
              aria-label={darkMode ? 'Switch to Paper Light Mode' : 'Switch to Chalkboard Night Study Mode'}
              title={darkMode ? 'Paper Mode (Light)' : 'Chalkboard Mode (Night Study)'}
            >
              {darkMode ? <Sun className="w-4 h-4 text-highlighter-yellow" /> : <Moon className="w-4 h-4 text-ink" />}
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold border border-ink/25 dark:border-chalkboard-borderSubtle text-ink dark:text-chalkboard-chalk bg-paper-card dark:bg-chalkboard-card hover:bg-redpen hover:text-white hover:border-redpen dark:hover:bg-redpen shadow-sm hover:translate-y-[-1px] transition-all whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-redpen cursor-pointer"
              title="Sign out of your notebook account"
            >
              <LogOut className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span className="hidden sm:inline">Log Out</span>
            </button>
          </div>
        </div>
      </header>

      <main id="main-content" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <NotebookCard ruled marginLine lifted>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              {badgeLabel && (
                <div
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md font-mono text-xs font-bold uppercase tracking-wider border border-ink/20 mb-2 ${badgeColorClass}`}
                >
                  {BadgeIcon && <BadgeIcon className="w-4 h-4 text-ink-blue" aria-hidden="true" />}
                  <span>{badgeLabel}</span>
                </div>
              )}
              <h1 className="text-2xl sm:text-3xl font-extrabold text-ink dark:text-chalkboard-chalk tracking-tight">
                {title}
              </h1>
              {subtitle && (
                <p className="text-sm text-ink-muted dark:text-chalkboard-muted mt-1 max-w-2xl leading-relaxed">
                  {subtitle}
                </p>
              )}
            </div>
            {headerRight}
          </div>
        </NotebookCard>

        {children}
      </main>
    </div>
  );
}

/**
 * Shared Notebook Session Verification Bar for /api/student/ping and /api/teacher/ping.
 */
export function SessionVerificationBar({
  endpointLabel,
  pingData,
  pingLoading,
  pingError,
  onRecheck,
  accentClass = 'bg-highlighter-yellow/70',
}) {
  return (
    <section
      aria-label="Notebook Session Verification"
      className="bg-paper-card dark:bg-chalkboard-card border-2 border-ink dark:border-chalkboard-border rounded-2xl p-4 sm:p-5 shadow-paper"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl ${accentClass} border border-ink flex items-center justify-center shrink-0`}
          >
            <ShieldCheck className="w-5 h-5 text-ink" aria-hidden="true" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-bold text-ink dark:text-chalkboard-chalk font-sans">
                Notebook Session Verified
              </h2>
              <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-paper-warm dark:bg-chalkboard-surface border border-ink/20 dark:border-chalkboard-borderSubtle text-ink-muted dark:text-chalkboard-muted">
                {endpointLabel}
              </span>
            </div>

            {pingLoading ? (
              <div className="flex items-center gap-2 mt-1 text-xs font-mono text-ink-muted dark:text-chalkboard-muted">
                <div className="w-3.5 h-3.5 border-2 border-ink-blue dark:border-highlighter-yellow border-t-transparent rounded-full animate-spin" />
                <span>Verifying active notebook session…</span>
              </div>
            ) : pingError ? (
              <div role="alert" className="flex items-center gap-1.5 mt-1 text-xs font-mono text-redpen">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>Unable to verify session: {pingError}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 mt-1 text-xs font-mono text-ink dark:text-highlighter-mint">
                <CheckCircle className="w-3.5 h-3.5 shrink-0 text-ink-blue dark:text-highlighter-mint" aria-hidden="true" />
                <span className="font-semibold">{pingData}</span>
              </div>
            )}
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onRecheck}
          disabled={pingLoading}
          className="self-start sm:self-center"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${pingLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
          <span>Re-check</span>
        </Button>
      </div>
    </section>
  );
}

// Re-export table and tab primitives for notebook UI
export {
  NotebookTabs,
  NotebookTabPanel,
  SearchInput,
  PaginationControls,
  NotebookTable,
  NotebookTableHead,
  NotebookTableRow,
  NotebookTableHeaderCell,
  NotebookTableCell,
  EmptyState,
} from './NotebookTablePrimitives';


