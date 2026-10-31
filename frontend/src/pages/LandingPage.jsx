import React, { useState, useEffect, Suspense, lazy } from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';

// Lazy-load below-the-fold landing page sections
const Problem = lazy(() => import('../components/Problem'));
const HowItWorks = lazy(() => import('../components/HowItWorks'));
const InteractiveDemo = lazy(() => import('../components/InteractiveDemo'));
const FeaturesGrid = lazy(() => import('../components/FeaturesGrid'));
const GoalsImpact = lazy(() => import('../components/GoalsImpact'));
const WhoItsFor = lazy(() => import('../components/WhoItsFor'));
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
  const [activeDemoRole, setActiveDemoRole] = useState('student');
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink dark:bg-chalkboard dark:text-chalkboard-chalk transition-colors">
      {/* Keyboard Accessibility Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-highlighter-yellow focus:text-ink focus:font-bold focus:shadow-lg"
      >
        Skip to main notebook content
      </a>

      {/* Sticky Notebook Header with Login / Signup links */}
      <Navbar
        activeDemoRole={activeDemoRole}
        onSelectDemoRole={setActiveDemoRole}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode((prev) => !prev)}
      />

      {/* Main Page Sections */}
      <main id="main-content" className="flex-1">
        <Hero onSelectDemoRole={setActiveDemoRole} />

        <Suspense fallback={<SectionFallback />}>
          <Problem />
          <HowItWorks />
          <InteractiveDemo activeRole={activeDemoRole} onChangeRole={setActiveDemoRole} />
          <FeaturesGrid />
          <GoalsImpact />
          <WhoItsFor onSelectDemoRole={setActiveDemoRole} />
          <FinalCTA onSelectDemoRole={setActiveDemoRole} />
        </Suspense>
      </main>

      <Suspense fallback={null}>
        <Footer />
      </Suspense>
    </div>
  );
}

