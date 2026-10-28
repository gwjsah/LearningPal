import React, { useState } from 'react';
import { Menu, X, GraduationCap, BookOpenCheck, Moon, Sun } from 'lucide-react';
import { siteMetadata, navLinks } from '../data/content';
import { LearningPalLogo } from './Doodles';

export default function Navbar({ activeDemoRole, onSelectDemoRole, darkMode, onToggleDarkMode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleRoleJump = (role) => {
    onSelectDemoRole(role);
    setMobileMenuOpen(false);
    const demoEl = document.getElementById('demo');
    if (demoEl) {
      demoEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      id="top"
      className="sticky top-0 z-50 border-b-2 border-ink/15 dark:border-white/15 bg-paper/95 dark:bg-chalkboard/95 backdrop-blur-md shadow-sm transition-colors"
    >
      {/* Top spiral-punch decorative strip */}
      <div
        className="hidden sm:flex items-center justify-between px-6 py-1 bg-paper-warm/90 dark:bg-chalkboard-surface border-b border-ink/10 dark:border-white/10 text-xs font-mono text-ink-muted dark:text-chalkboard-muted"
        aria-hidden="true"
      >
        <div className="flex items-center gap-3">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-paper dark:bg-chalkboard border border-ink/30 dark:border-white/30" />
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-paper dark:bg-chalkboard border border-ink/30 dark:border-white/30" />
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-paper dark:bg-chalkboard border border-ink/30 dark:border-white/30" />
          <span className="ml-1 tracking-tight">{siteMetadata.pilotBadge}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-redpen dark:text-red-400 font-semibold">Subject Ref: BIO-204 / MTH-301</span>
          <span>Page Index • 01–06</span>
        </div>
      </div>

      <nav
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3"
        aria-label="Primary Notebook Navigation"
      >
        {/* Brand Wordmark */}
        <a
          href="#"
          className="group flex items-center gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-redpen rounded-lg p-1"
        >
          <LearningPalLogo className="w-9 h-9 transition-transform duration-200 group-hover:-rotate-6" />
          <div className="flex flex-col">
            <span className="font-bold text-xl tracking-tight text-ink dark:text-chalkboard-chalk flex items-center gap-1">
              Learning<span className="font-hand text-2xl text-redpen dark:text-red-400 -mt-0.5">Pal</span>
            </span>
            <span className="text-[10px] font-mono uppercase tracking-wider text-ink-muted dark:text-chalkboard-muted -mt-1">
              Study Smart Notebook
            </span>
          </div>
        </a>

        {/* Notebook Divider Tab Links (Desktop) */}
        <div className="hidden lg:flex items-end self-end gap-1 pt-2">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`px-3.5 py-2 text-sm font-medium text-ink dark:text-chalkboard-chalk rounded-t-lg border-t border-x border-ink/15 dark:border-white/15 ${link.tabColor} hover:-translate-y-0.5 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-redpen`}
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Right Controls: Dark Mode ("Chalkboard") & Student / Teacher Role Switcher CTA */}
        <div className="hidden md:flex items-center gap-2.5">
          {/* Chalkboard / Night Study Toggle */}
          <button
            type="button"
            onClick={onToggleDarkMode}
            className="p-2 rounded-lg border border-ink/20 dark:border-white/20 bg-paper-card dark:bg-chalkboard-card text-ink dark:text-chalkboard-chalk hover:bg-highlighter-yellowSoft dark:hover:bg-chalkboard-surface transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-redpen"
            aria-label={darkMode ? 'Switch to Paper Light Mode' : 'Switch to Chalkboard Night Study Mode'}
            title={darkMode ? 'Paper Mode (Light)' : 'Chalkboard Mode (Night Study)'}
          >
            {darkMode ? <Sun className="w-4 h-4 text-highlighter-yellow" /> : <Moon className="w-4 h-4 text-ink" />}
          </button>

          {/* Student / Teacher Segmented Notebook Tab CTA */}
          <div
            className="inline-flex items-center p-1 rounded-xl border-2 border-ink dark:border-white/40 bg-paper-warm dark:bg-chalkboard-surface shadow-[2px_2px_0_rgba(27,37,52,0.85)]"
            role="group"
            aria-label="Jump to interactive demo by role"
          >
            <button
              type="button"
              onClick={() => handleRoleJump('student')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-redpen ${
                activeDemoRole === 'student'
                  ? 'bg-highlighter-yellow text-ink shadow-sm border border-ink/30'
                  : 'text-ink-muted dark:text-chalkboard-muted hover:text-ink dark:hover:text-white'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Student</span>
            </button>
            <button
              type="button"
              onClick={() => handleRoleJump('teacher')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-redpen ${
                activeDemoRole === 'teacher'
                  ? 'bg-highlighter-mint text-ink shadow-sm border border-ink/30'
                  : 'text-ink-muted dark:text-chalkboard-muted hover:text-ink dark:hover:text-white'
              }`}
            >
              <BookOpenCheck className="w-3.5 h-3.5" />
              <span>Teacher</span>
            </button>
          </div>
        </div>

        {/* Mobile Menu & Dark Mode Trigger */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            type="button"
            onClick={onToggleDarkMode}
            className="p-2 rounded-lg border border-ink/20 dark:border-white/20 bg-paper-card dark:bg-chalkboard-card text-ink dark:text-chalkboard-chalk"
            aria-label={darkMode ? 'Switch to Paper Light Mode' : 'Switch to Chalkboard Night Study Mode'}
          >
            {darkMode ? <Sun className="w-4 h-4 text-highlighter-yellow" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg border-2 border-ink dark:border-white/40 bg-paper-card dark:bg-chalkboard-card text-ink dark:text-chalkboard-chalk focus:outline-none focus-visible:ring-2 focus-visible:ring-redpen"
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Dropdown Notebook Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t-2 border-ink/15 dark:border-white/15 bg-paper dark:bg-chalkboard-surface px-4 pt-3 pb-5 space-y-3 shadow-lg">
          <div className="grid grid-cols-2 gap-2">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2 rounded-lg text-sm font-semibold text-ink dark:text-chalkboard-chalk border border-ink/15 dark:border-white/15 ${link.tabColor}`}
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="pt-2 border-t border-ink/10 dark:border-white/10 flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={() => handleRoleJump('student')}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border-2 border-ink bg-highlighter-yellow text-ink font-bold text-sm shadow-[2px_2px_0_#1B2534]"
            >
              <GraduationCap className="w-4 h-4" />
              <span>Student Notebook View</span>
            </button>
            <button
              type="button"
              onClick={() => handleRoleJump('teacher')}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border-2 border-ink bg-highlighter-mint text-ink font-bold text-sm shadow-[2px_2px_0_#1B2534]"
            >
              <BookOpenCheck className="w-4 h-4" />
              <span>Teacher Gradebook View</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

