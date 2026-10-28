import React from 'react';
import { ArrowRight, BookOpenCheck, Sparkles } from 'lucide-react';
import { finalCtaContent } from '../data/content';
import { BinderHoles, PushPin, SquigglyUnderline } from './Doodles';

export default function FinalCTA({ onSelectDemoRole }) {
  const handleJump = (role) => {
    onSelectDemoRole(role);
    const demoEl = document.getElementById('demo');
    if (demoEl) {
      demoEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      aria-labelledby="final-cta-heading"
      className="relative py-20 lg:py-28 bg-dot-paper overflow-hidden"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Torn Notebook Page Container */}
        <div className="relative rounded-2xl bg-paper-card dark:bg-chalkboard-card border-2 border-ink dark:border-white/35 shadow-lifted torn-edge-bottom pb-12 overflow-hidden">
          <PushPin color="#D93829" />

          {/* Top Horizontal Binder Holes Strip */}
          <div className="border-b border-ink/15 dark:border-white/15 bg-paper-warm/70 dark:bg-chalkboard-surface">
            <BinderHoles vertical={false} />
          </div>

          <div className="p-6 sm:p-12 lg:p-14 text-center space-y-6 bg-ruled-paper">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-md bg-highlighter-yellow text-ink font-mono text-xs font-bold uppercase tracking-wider border border-ink/20">
              <Sparkles className="w-3.5 h-3.5 text-redpen" />
              <span>{finalCtaContent.eyebrow}</span>
            </div>

            <h2
              id="final-cta-heading"
              className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-ink dark:text-chalkboard-chalk tracking-tight max-w-2xl mx-auto leading-tight"
            >
              {finalCtaContent.headline}
            </h2>

            <div className="flex justify-center">
              <SquigglyUnderline className="w-64 h-3.5" color="#D93829" />
            </div>

            <p className="text-base sm:text-lg text-ink-muted dark:text-chalkboard-muted max-w-2xl mx-auto leading-relaxed">
              {finalCtaContent.subheadline}
            </p>

            {/* Dual Action Buttons */}
            <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => handleJump('student')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-xl border-2 border-ink bg-redpen hover:bg-redpen-dark text-white font-bold text-base shadow-[4px_4px_0_#1B2534] hover:translate-y-[-2px] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-redpen"
              >
                <span>{finalCtaContent.primaryCta}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => handleJump('teacher')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl border-2 border-ink dark:border-white/40 bg-highlighter-mint hover:bg-emerald-300 text-ink font-bold text-base shadow-[4px_4px_0_#1B2534] hover:translate-y-[-2px] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-redpen"
              >
                <BookOpenCheck className="w-4 h-4" />
                <span>{finalCtaContent.secondaryCta}</span>
              </button>
            </div>

            <p className="text-xs font-mono text-ink-muted dark:text-chalkboard-muted pt-2">
              {finalCtaContent.footnote}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

