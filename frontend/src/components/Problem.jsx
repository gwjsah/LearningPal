import React from 'react';
import { AlertTriangle, Clock, FileQuestion } from 'lucide-react';
import { problemContent } from '../data/content';
import { PushPin, PaperClip, WashiTape } from './Doodles';
import { Button, SectionHeading } from './NotebookPrimitives';

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
        <SectionHeading
          id="problem-heading"
          label={problemContent.sectionLabel}
          badgeClassName="bg-redpen-soft text-redpen-dark border-redpen/30"
          headline={problemContent.headline}
          subheadline={problemContent.subheadline}
        />

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

                  {/* Relatable First-Person Quote (Readable sans body text) */}
                  <blockquote className="font-sans font-semibold italic text-base sm:text-lg leading-relaxed text-ink dark:text-chalkboard-chalk bg-paper/75 dark:bg-chalkboard/50 p-3.5 rounded-xl border border-ink/20 dark:border-white/20">
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
          <Button href="#how-it-works" variant="yellow" size="md" className="shrink-0">
            See the 3-Step Fix ↓
          </Button>
        </div>
      </div>
    </section>
  );
}
