import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Settings, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import PalAvatar from './PalAvatar';
import { getPalProfile } from '../utils/palEngine';

const PalContext = createContext(null);
const AUTO_DISMISS_MS = 6000;

function hasShownOnce(onceKey) {
  if (!onceKey) return false;
  try {
    return sessionStorage.getItem(`learningpal_pal_seen_${onceKey}`) === '1';
  } catch {
    return false;
  }
}

function markShownOnce(onceKey) {
  if (!onceKey) return;
  try {
    sessionStorage.setItem(`learningpal_pal_seen_${onceKey}`, '1');
  } catch {
    // Ignore storage errors in restricted browser contexts
  }
}

export function PalProvider({ children }) {
  const [moment, setMoment] = useState(null);
  return <PalContext.Provider value={{ moment, setMoment }}>{children}</PalContext.Provider>;
}

/**
 * Registers the current student page's Pal mood and contextual speech bubble.
 * Automatically clears when the page unmounts.
 */
export function usePalMoment(moment) {
  const ctx = useContext(PalContext);
  const setMoment = ctx?.setMoment;
  const serialized = moment ? JSON.stringify(moment) : '';

  useEffect(() => {
    if (!setMoment) return undefined;
    if (!serialized) {
      setMoment(null);
      return undefined;
    }
    setMoment(JSON.parse(serialized));
    return () => setMoment(null);
  }, [setMoment, serialized]);
}

/**
 * Unbounded floating Study Pal docked in the bottom-right corner with a notebook speech bubble.
 */
export function FloatingPal() {
  const { user, isAuthenticated } = useAuth();
  const ctx = useContext(PalContext);
  const location = useLocation();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [pinned, setPinned] = useState(false);
  const timerRef = useRef(null);

  const moment = ctx?.moment || null;
  const pal = getPalProfile(user);

  const isPublicRoute = ['/', '/login', '/signup'].includes(location.pathname);
  const isQuizRoute = location.pathname.includes('/take');
  const isSettingsRoute = location.pathname === '/settings';

  const clearDismissTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const scheduleAutoDismiss = useCallback(() => {
    clearDismissTimer();
    timerRef.current = setTimeout(() => {
      setOpen(false);
    }, AUTO_DISMISS_MS);
  }, [clearDismissTimer]);

  // Decide whether to auto-pop the speech bubble when a new page moment arrives
  useEffect(() => {
    clearDismissTimer();
    setPinned(false);

    if (!moment || isQuizRoute || isSettingsRoute) {
      setOpen(false);
      setHasUnread(false);
      return;
    }

    const isDesktop = typeof window !== 'undefined' ? window.innerWidth >= 640 : true;
    const shouldPop = Boolean(moment.autoPop) && isDesktop && !hasShownOnce(moment.onceKey);

    if (shouldPop) {
      markShownOnce(moment.onceKey);
      setOpen(true);
      setHasUnread(false);
      scheduleAutoDismiss();
    } else {
      setOpen(false);
      setHasUnread(Boolean(moment.autoPop));
    }

    return clearDismissTimer;
  }, [moment?.key, isQuizRoute, isSettingsRoute, clearDismissTimer, scheduleAutoDismiss]);

  // Only render for authenticated students who have Study Pal enabled
  if (!isAuthenticated || user?.role !== 'STUDENT' || !pal.enabled || isPublicRoute) {
    return null;
  }

  // Respect user's Quiet Companion setting during active quizzes
  if (isQuizRoute && !pal.quietInQuiz) {
    return null;
  }

  const effectiveMood = isQuizRoute ? 'focused' : moment?.mood || 'fresh';
  const headline = isQuizRoute
    ? `Quiet mode is on`
    : moment?.headline || `Hey there — ${pal.name} is here!`;
  const message = isQuizRoute
    ? `You got this! ${pal.name} will stay quiet while you answer. You can toggle this anytime in Settings.`
    : moment?.message || `Open any class or assessment and ${pal.name} will keep track of your topic mastery with you.`;

  const handleToggle = () => {
    clearDismissTimer();
    setOpen((prev) => {
      const next = !prev;
      setPinned(next);
      if (next) setHasUnread(false);
      return next;
    });
  };

  const handleDismiss = () => {
    clearDismissTimer();
    setOpen(false);
    setPinned(false);
  };

  const handleCta = () => {
    handleDismiss();
    if (moment?.ctaTo) {
      navigate(moment.ctaTo);
    }
  };

  return (
    <div
      className="fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-40 flex flex-col items-end gap-2 pointer-events-none"
      aria-live="polite"
    >
      {/* Speech Bubble */}
      {open && (
        <div
          className="pointer-events-auto relative w-[270px] sm:w-[300px] rounded-2xl border-2 border-ink dark:border-chalkboard-chalk bg-paper-card dark:bg-chalkboard-card text-ink dark:text-chalkboard-chalk shadow-notebook px-4 py-3 animate-fadeIn"
          onMouseEnter={clearDismissTimer}
          onMouseLeave={() => {
            if (!pinned) scheduleAutoDismiss();
          }}
        >
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-hand text-xl font-bold leading-snug text-ink dark:text-chalkboard-chalk">
              {headline}
            </h3>
            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Dismiss dialogue"
              className="p-0.5 rounded text-ink-muted hover:text-ink dark:text-chalkboard-muted dark:hover:text-chalkboard-chalk focus:outline-none focus-visible:ring-2 focus-visible:ring-redpen"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          <p className="mt-1 text-xs leading-relaxed text-ink-muted dark:text-chalkboard-muted">
            {message}
          </p>

          <div className="mt-2.5 flex items-center justify-between gap-2 pt-1.5 border-t border-ink/10 dark:border-chalkboard-borderSubtle">
            {moment?.ctaLabel && moment?.ctaTo && !isQuizRoute ? (
              <button
                type="button"
                onClick={handleCta}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-highlighter-yellow text-ink border border-ink hover:opacity-90 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-redpen"
              >
                <span>{moment.ctaLabel}</span>
                <ArrowRight className="w-3 h-3" aria-hidden="true" />
              </button>
            ) : (
              <span className="text-[11px] font-mono text-ink-light dark:text-chalkboard-muted">
                {pal.name}
              </span>
            )}

            <button
              type="button"
              onClick={() => {
                handleDismiss();
                navigate('/settings');
              }}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-ink-muted dark:text-chalkboard-muted hover:text-ink dark:hover:text-chalkboard-chalk transition focus:outline-none focus-visible:ring-2 focus-visible:ring-redpen rounded px-1 py-0.5"
              title="Study Pal Settings"
            >
              <Settings className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Settings</span>
            </button>
          </div>

          {/* Speech bubble pointed tail */}
          <span
            aria-hidden="true"
            className="absolute -bottom-[9px] right-8 sm:right-11 lg:right-12 w-4 h-4 rotate-45 bg-paper-card dark:bg-chalkboard-card border-r-2 border-b-2 border-ink dark:border-chalkboard-chalk"
          />
        </div>
      )}

      {/* Unbounded Floating Mascot Button (zero box/card behind it) */}
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={open}
        aria-label={`${pal.name} study companion — click to ${open ? 'hide' : 'open'} message`}
        className="pointer-events-auto relative group focus:outline-none focus-visible:ring-2 focus-visible:ring-redpen rounded-full transition-transform hover:scale-105 active:scale-95"
      >
        {hasUnread && !open && (
          <span
            aria-hidden="true"
            className="absolute top-0 right-1 z-10 w-5 h-5 rounded-full bg-redpen text-paper-card text-[11px] font-mono font-bold flex items-center justify-center border-2 border-paper-card dark:border-chalkboard"
          >
            !
          </span>
        )}
        <PalAvatar
          style={pal.style}
          color={pal.color}
          mood={effectiveMood}
          accessory={pal.accessory}
          size={112}
          className="w-16 h-16 sm:w-24 sm:h-24 lg:w-28 lg:h-28 drop-shadow-sm dark:drop-shadow-[0_0_10px_rgba(255,253,249,0.22)]"
          label={`${pal.name} (${effectiveMood})`}
        />
      </button>
    </div>
  );
}
