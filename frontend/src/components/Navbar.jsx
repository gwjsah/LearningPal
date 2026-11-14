import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Moon, Sun, LogIn, UserPlus } from 'lucide-react';
import { siteMetadata, navLinks } from '../data/content';
import { LearningPalLogo } from './Doodles';

export default function Navbar({ darkMode, onToggleDarkMode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (e, href) => {
    e.preventDefault();
    setMobileMenuOpen(false);

    const targetId = href.replace('#', '');
    const targetEl = document.getElementById(targetId);
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth' });
      window.history.pushState(null, '', href);
    }
  };

  return (
    <header
      id="top"
      className="sticky top-0 z-30 w-full border-b-2 border-ink/15 dark:border-chalkboard-borderSubtle bg-paper/95 dark:bg-chalkboard/95 backdrop-blur-md shadow-sm transition-colors"
    >
      {/* Top spiral-punch strip */}
      <div
        className="hidden sm:flex items-center justify-between w-full px-6 sm:px-10 lg:px-16 py-1 bg-paper-warm/90 dark:bg-chalkboard-surface border-b border-ink/10 dark:border-chalkboard-borderSubtle text-xs font-mono text-ink-muted dark:text-chalkboard-muted"
        aria-hidden="true"
      >
        <div className="flex items-center gap-3">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-paper dark:bg-chalkboard border border-ink/30 dark:border-chalkboard-borderSubtle" />
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-paper dark:bg-chalkboard border border-ink/30 dark:border-chalkboard-borderSubtle" />
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-paper dark:bg-chalkboard border border-ink/30 dark:border-chalkboard-borderSubtle" />
          <span className="ml-1 tracking-tight">{siteMetadata.pilotBadge}</span>
        </div>
        <div className="flex items-center gap-6">
          <span className="text-redpen dark:text-red-400 font-semibold">Subject Ref: BIO-204 / MTH-301</span>
          <span>Page Index • 01–02</span>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <nav
        className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 h-16 flex items-center justify-between gap-4"
        aria-label="Primary Notebook Navigation"
      >
        {/* Brand Wordmark (Left) */}
        <Link
          to="/"
          className="group flex items-center gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-redpen rounded-lg p-1 shrink-0"
        >
          <LearningPalLogo className="w-9 h-9 transition-transform duration-200 group-hover:-rotate-6 shrink-0" />
          <div className="flex flex-col">
            <span className="font-bold text-xl tracking-tight text-ink dark:text-chalkboard-chalk flex items-center gap-1 leading-tight whitespace-nowrap">
              Learning<span className="font-hand text-2xl text-redpen dark:text-red-400 -mt-0.5">Pal</span>
            </span>
            <span className="text-[10px] font-mono uppercase tracking-wider text-ink-muted dark:text-chalkboard-muted -mt-0.5 whitespace-nowrap">
              Study Smart Notebook
            </span>
          </div>
        </Link>

        {/* Right Section: Nav Buttons + Auth Links + Theme Toggle */}
        <div className="hidden md:flex items-center gap-3 lg:gap-4 shrink-0">
          {/* Plain Text Nav Buttons: "How It Works" & "Interactive Demo" */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="px-3.5 py-1.5 rounded-lg text-sm font-semibold text-ink dark:text-chalkboard-chalk bg-transparent border-0 hover:bg-paper-hover active:bg-paper-pressed dark:hover:bg-chalkboard-hover dark:active:bg-chalkboard-pressed transition-colors duration-150 motion-reduce:transition-none cursor-pointer whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-redpen focus-visible:ring-offset-paper dark:focus-visible:ring-offset-chalkboard"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Subtle Vertical Divider */}
          <div className="w-px h-6 bg-ink/15 dark:bg-chalkboard-borderSubtle my-auto" aria-hidden="true" />

          {/* Direct Auth Links */}
          <Link
            to="/login"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold border border-ink/25 dark:border-chalkboard-borderSubtle text-ink dark:text-chalkboard-chalk bg-paper-card dark:bg-chalkboard-card hover:bg-paper-warm dark:hover:bg-chalkboard-surface shadow-sm hover:translate-y-[-1px] transition-all whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-redpen"
          >
            <LogIn className="w-4 h-4 text-ink-blue dark:text-chalkboard-chalk shrink-0" />
            <span>Log In</span>
          </Link>

          <Link
            to="/signup"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold bg-redpen hover:bg-redpen-dark text-white border border-ink dark:border-chalkboard-borderStrong shadow-notebook-sm hover:translate-y-[-1px] transition-all whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-redpen"
          >
            <UserPlus className="w-4 h-4 shrink-0" />
            <span>Sign Up</span>
          </Link>

          {/* Chalkboard / Night Study Toggle */}
          <button
            type="button"
            onClick={onToggleDarkMode}
            className="p-2 rounded-xl border border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-card dark:bg-chalkboard-card text-ink dark:text-chalkboard-chalk hover:bg-highlighter-yellowSoft dark:hover:bg-chalkboard-surface transition-colors shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-redpen cursor-pointer"
            aria-label={darkMode ? 'Switch to Paper Light Mode' : 'Switch to Chalkboard Night Study Mode'}
            title={darkMode ? 'Paper Mode (Light)' : 'Chalkboard Mode (Night Study)'}
          >
            {darkMode ? <Sun className="w-4 h-4 text-highlighter-yellow" /> : <Moon className="w-4 h-4 text-ink" />}
          </button>
        </div>

        {/* Mobile Header Controls (< 768px) */}
        <div className="flex items-center gap-2 md:hidden shrink-0">
          <Link
            to="/login"
            className="px-3 py-1.5 text-xs font-bold rounded-lg border border-ink/20 dark:border-chalkboard-borderSubtle text-ink dark:text-chalkboard-chalk whitespace-nowrap"
          >
            Log In
          </Link>
          <button
            type="button"
            onClick={onToggleDarkMode}
            className="p-2 rounded-lg border border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-card dark:bg-chalkboard-card text-ink dark:text-chalkboard-chalk"
            aria-label={darkMode ? 'Switch to Paper Light Mode' : 'Switch to Chalkboard Night Study Mode'}
          >
            {darkMode ? <Sun className="w-4 h-4 text-highlighter-yellow" /> : <Moon className="w-4 h-4 text-ink" />}
          </button>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg border-2 border-ink dark:border-chalkboard-border bg-paper-card dark:bg-chalkboard-card text-ink dark:text-chalkboard-chalk focus:outline-none focus-visible:ring-2 focus-visible:ring-redpen"
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Responsive Mobile Drawer (< 768px) */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t-2 border-ink/15 dark:border-chalkboard-borderSubtle bg-paper dark:bg-chalkboard-surface px-4 pt-3 pb-5 space-y-3 shadow-lg">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="px-3.5 py-2.5 rounded-lg text-sm font-semibold text-ink dark:text-chalkboard-chalk bg-transparent border-0 hover:bg-paper-hover active:bg-paper-pressed dark:hover:bg-chalkboard-hover dark:active:bg-chalkboard-pressed transition-colors duration-150 motion-reduce:transition-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-redpen focus-visible:ring-offset-paper dark:focus-visible:ring-offset-chalkboard"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="pt-2 border-t border-ink/10 dark:border-chalkboard-borderSubtle flex gap-2">
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-ink/20 dark:border-chalkboard-borderSubtle text-xs font-bold text-ink dark:text-chalkboard-chalk"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Log In</span>
            </Link>
            <Link
              to="/signup"
              onClick={() => setMobileMenuOpen(false)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-redpen text-white text-xs font-bold shadow-sm"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Sign Up</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
