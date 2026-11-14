import React, { Suspense, lazy, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import { useTheme } from '../context/ThemeContext';

// Lazy-load below-the-fold landing page sections
const HowItWorks = lazy(() => import('../components/HowItWorks'));
const InteractiveDemo = lazy(() => import('../components/InteractiveDemo'));
const FinalCTA = lazy(() => import('../components/FinalCTA'));
const Footer = lazy(() => import('../components/Footer'));

function SectionFallback() {
  return (
    <div className="py-16 text-center font-mono text-xs text-ink-muted dark:text-chalkboard-muted">
      Turning the notebook page…
    </div>
  );
}

export default function LandingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  // Single source of truth: URL query param governs demo perspective
  const demoRole = searchParams.get('demo') === 'teacher' ? 'teacher' : 'student';
  const { darkMode, toggleDarkMode } = useTheme();

  const handleSelectDemoRole = useCallback(
    (role) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set('demo', role);
          next.set('demoTab', role === 'teacher' ? 'overview' : 'workspace');
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink dark:bg-chalkboard dark:text-chalkboard-chalk transition-colors overflow-x-hidden">
      {/* Keyboard Accessibility Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-highlighter-yellow focus:text-ink focus:font-bold focus:shadow-lg"
      >
        Skip to main notebook content
      </a>

      {/* Sticky Notebook Header with Login / Signup links */}
      <Navbar
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
      />

      {/* Main Page Sections */}
      <main id="main-content" className="flex-1">
        <Hero onSelectDemoRole={handleSelectDemoRole} />

        <Suspense fallback={<SectionFallback />}>
          <HowItWorks />
          <InteractiveDemo activeRole={demoRole} onChangeRole={handleSelectDemoRole} />
          <FinalCTA onSelectDemoRole={handleSelectDemoRole} />
        </Suspense>
      </main>

      <Suspense fallback={null}>
        <Footer />
      </Suspense>
    </div>
  );
}
