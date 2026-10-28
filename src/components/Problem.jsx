import React from 'react';
import { AlertTriangle, Clock, FileQuestion } from 'lucide-react';
import { problemContent } from '../data/content';
import { PushPin, PaperClip, WashiTape, SquigglyUnderline } from './Doodles';

export default function Problem() {
  const icons = {
    'student-struggle': FileQuestion,
    'teacher-crunch': Clock,
    'generic-fallback': AlertTriangle,
  };

  const cardSurfaceStyles = {
    'sticky-yellow':
      'bg-highlighter-yellowSoft dark:bg-yellow-950/45 border-2 border-ink/25 dark:border-yellow-500/30 shadow-sticky',
    'torn-notebook':
      'bg-paper-card dark:bg-chalkboard-card border-2 border-ink/30 dark:border-white/25 shadow-paper torn-edge-bottom pb-9',
    'index-pink':
      'bg-highlighter-pinkSoft/75 dark:bg-pink-950/40 border-2 border-ink/25 dark:border-pink-400/30 shadow-sticky',
  };

  return (
    <section
      id="problem"
      aria-labelledby="problem-heading"
      className="relative py-20 lg:py-28 bg-dot-paper border-b-2 border-ink/15 dark:border-white/15"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <span className="inline-block px-3 py-1 rounded-md font-mono text-xs font-bold uppercase tracking-wider bg-redpen-soft text-redpen-dark dark:bg-red-950/80 dark:text-red-300 border border-redpen/30">
            {problemContent.sectionLabel}
          </span>
          <h2
            id="problem-heading"
            className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-ink dark:text-chalkboard-chalk tracking-tight"
          >
            {problemContent.headline}
          </h2>
          <div className="flex justify-center">
            <SquigglyUnderline className="w-56 h-3" color="#D93829" />
          </div>
          <p className="text-base sm:text-lg text-ink-muted dark:text-chalkboard-muted leading-relaxed">
            {problemContent.subheadline}
          </p>
        </div>

        {/* 3 Relatable Scenario Sticky Notes / Torn Notebook Pages */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-9 items-stretch">
          {problemContent.scenarios.map((scenario) => {
            const IconComponent = icons[scenario.id] || AlertTriangle;
            const surfaceClass = cardSurfaceStyles[scenario.cardStyle] || cardSurfaceStyles['sticky-yellow'];

            return (
              <article
                key={scenario.id}
                className={`relative rounded-2xl p-6 sm:p-7 flex flex-col justify-between ${surfaceClass} ${scenario.rotation}`}
              >
                {/* Stationery Fastener at the top */}
                {scenario.pinType === 'red-pin' && <PushPin color="#D93829" />}
                {scenario.pinType === 'paper-clip' && (
                  <PaperClip className="absolute -top-4 right-7" />
                )}
                {scenario.pinType === 'washi-tape' && (
                  <WashiTape colorClass="bg-highlighter-mint/80 dark:bg-emerald-400/40" rotate="-rotate-2" />
                )}

                <div className="space-y-4">
                  {/* Top Role Tag & Icon */}
                  <div className="flex items-center justify-between gap-2 pt-1 border-b border-ink/15 dark:border-white/15 pb-3">
                    <div>
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-redpen dark:text-red-300 block">
                        {scenario.role}
                      </span>
                      <h3 className="text-lg font-extrabold text-ink dark:text-chalkboard-chalk">
                        {scenario.persona}
                      </h3>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-paper dark:bg-chalkboard border border-ink/20 dark:border-white/20 flex items-center justify-center shrink-0">
                      <IconComponent className="w-5 h-5 text-ink dark:text-chalkboard-chalk" />
                    </div>
                  </div>

                  {/* Relatable First-Person Quote */}
                  <blockquote className="font-note text-xl sm:text-[1.3rem] leading-snug text-ink dark:text-chalkboard-chalk bg-paper/65 dark:bg-chalkboard/50 p-3.5 rounded-xl border-l-4 border-redpen">
                    {scenario.quote}
                  </blockquote>

                  {/* Underlying Pain Explanation */}
                  <p className="text-sm sm:text-base text-ink-muted dark:text-chalkboard-muted leading-relaxed">
                    {scenario.painSummary}
                  </p>
                </div>

                {/* Red-Pen Margin Scribble Footer */}
                <div className="mt-6 pt-3 border-t border-dashed border-ink/20 dark:border-white/15 flex items-center justify-between">
                  <span className="font-hand text-xl font-bold text-redpen dark:text-red-400">
                    ✎ {scenario.doodleTag}
                  </span>
                  <span className="text-[11px] font-mono uppercase text-ink-light dark:text-chalkboard-muted">
                    Field Note
                  </span>
                </div>
              </article>
            );
          })}
        </div>

        {/* Bottom Summary Banner on a Torn Strip */}
        <div className="mt-12 max-w-4xl mx-auto rounded-2xl bg-paper-card dark:bg-chalkboard-card border-2 border-ink dark:border-white/30 p-5 sm:p-6 shadow-paper flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <p className="font-mono text-xs font-bold uppercase tracking-wider text-redpen dark:text-red-400">
              The Root Cause
            </p>
            <p className="text-base sm:text-lg font-bold text-ink dark:text-chalkboard-chalk">
              Students don’t lack effort—they lack <span className="marker-highlight-mint">topic-level visibility</span> into what to practice next.
            </p>
          </div>
          <a
            href="#how-it-works"
            className="shrink-0 px-4 py-2.5 rounded-xl border-2 border-ink bg-highlighter-yellow text-ink font-bold text-sm shadow-[2px_2px_0_#1B2534] hover:translate-y-[-1px] transition-transform"
          >
            See the 3-Step Fix ↓
          </a>
        </div>
      </div>
    </section>
  );
}

