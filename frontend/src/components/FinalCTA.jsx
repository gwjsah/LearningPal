import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, LogIn, Sparkles } from 'lucide-react';
import { finalCtaContent } from '../data/content';
import { BinderHoles, PushPin, SquigglyUnderline } from './Doodles';

export default function FinalCTA({ onSelectDemoRole }) {
  const handleJump = (role) => {
    if (onSelectDemoRole) onSelectDemoRole(role);
    const demoEl = document.getElementById('demo');
    if (demoEl) {
      demoEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      aria-labelledby="final-cta-heading"
      className="relative py-16 lg:py-24 bg-dot-paper overflow-hidden"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Torn Notebook Page Container */}
        <div className="relative rounded-2xl bg-paper-card dark:bg-chalkboard-card border-2 border-ink dark:border-chalkboard-border shadow-lifted torn-edge-bottom pb-10 overflow-hidden">
          <PushPin color="#D93829" />

          {/* Top Horizontal Binder Holes Strip */}
          <div className="border-b border-ink/15 dark:border-chalkboard-borderSubtle bg-paper-warm/70 dark:bg-chalkboard-surface">
            <BinderHoles vertical={false} />
          </div>

          <div className="p-6 sm:p-10 lg:p-12 text-center space-y-5 bg-ruled-paper">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-highlighter-yellow text-ink font-mono text-xs font-bold uppercase tracking-wider border border-ink/20">
              <Sparkles className="w-3.5 h-3.5 text-redpen" />
              <span>{finalCtaContent.eyebrow}</span>
            </div>

            <h2
              id="final-cta-heading"
              className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-ink dark:text-chalkboard-chalk tracking-tight max-w-xl mx-auto leading-tight"
            >
              {finalCtaContent.headline}
            </h2>

            <div className="flex justify-center">
              <SquigglyUnderline className="w-56 h-3" color="#D93829" />
            </div>

            <p className="text-base sm:text-lg text-ink-muted dark:text-chalkboard-muted max-w-xl mx-auto leading-relaxed">
              {finalCtaContent.subheadline}
            </p>

            {/* Direct Conversion Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <Link
                to="/signup"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl border-2 border-ink bg-redpen hover:bg-redpen-dark text-white font-bold text-base shadow-notebook-lg hover:translate-y-[-2px] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-redpen"
              >
                <span>{finalCtaContent.primaryCta}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                to="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border-2 border-ink dark:border-chalkboard-border bg-paper-card dark:bg-chalkboard-card hover:bg-highlighter-mintSoft dark:hover:bg-chalkboard-surface text-ink dark:text-chalkboard-chalk font-bold text-base shadow-notebook-lg hover:translate-y-[-2px] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-redpen"
              >
                <LogIn className="w-4 h-4 text-ink-blue dark:text-highlighter-mint" />
                <span>Log In</span>
              </Link>
            </div>

            <div className="pt-2 flex items-center justify-center gap-2 text-xs font-mono text-ink-muted dark:text-chalkboard-muted">
              <span>Want to explore first?</span>
              <button
                type="button"
                onClick={() => handleJump('student')}
                className="font-bold text-ink dark:text-chalkboard-chalk hover:text-redpen underline underline-offset-2 cursor-pointer"
              >
                Try the interactive demo ↑
              </button>
            </div>

            <p className="text-xs font-mono text-ink-muted dark:text-chalkboard-muted pt-1">
              {finalCtaContent.footnote}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
