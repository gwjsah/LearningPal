import React, { useEffect, useRef, useState } from 'react';
import { Target, CheckCircle2 } from 'lucide-react';
import { goalsContent } from '../data/content';
import { HandDrawnCircle, StarDoodle } from './Doodles';

/**
 * Animated counter hook that counts up when the card enters the viewport
 * and respects prefers-reduced-motion.
 */
function AnimatedMetricValue({ value, suffix = '', decimals = 0 }) {
  const [displayVal, setDisplayVal] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setDisplayVal(value);
      setHasAnimated(true);
      return;
    }

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            setHasAnimated(true);
            const duration = 1100;
            const startTime = performance.now();

            const step = (now) => {
              const progress = Math.min((now - startTime) / duration, 1);
              const eased = 1 - Math.pow(1 - progress, 3);
              const current = value * eased;
              setDisplayVal(current);
              if (progress < 1) {
                requestAnimationFrame(step);
              } else {
                setDisplayVal(value);
              }
            };
            requestAnimationFrame(step);
          }
        });
      },
      { threshold: 0.25 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [value, hasAnimated]);

  const formatted = decimals > 0 ? displayVal.toFixed(decimals) : Math.round(displayVal);

  return (
    <span ref={ref}>
      {formatted}
      {suffix}
    </span>
  );
}

export default function GoalsImpact() {
  return (
    <section
      id="goals"
      aria-labelledby="goals-heading"
      className="relative py-20 lg:py-28 bg-graph-paper border-b-2 border-ink/15 dark:border-white/15"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header with Honest Benchmark Transparency Badge */}
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md bg-redpen-soft dark:bg-red-950/80 text-redpen-dark dark:text-red-300 border border-redpen/30 font-mono text-xs font-bold uppercase tracking-wider">
            <Target className="w-3.5 h-3.5" />
            <span>{goalsContent.sectionLabel}</span>
          </div>

          <h2
            id="goals-heading"
            className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-ink dark:text-chalkboard-chalk tracking-tight"
          >
            {goalsContent.headline}
          </h2>

          <p className="text-base sm:text-lg text-ink-muted dark:text-chalkboard-muted leading-relaxed">
            {goalsContent.subheadline}
          </p>

          {/* Explicit Honesty Banner */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-highlighter-yellowSoft dark:bg-yellow-950/60 border border-ink/20 dark:border-yellow-500/30 text-xs sm:text-sm font-semibold text-ink dark:text-yellow-100">
            <CheckCircle2 className="w-4 h-4 text-redpen shrink-0" />
            <span>{goalsContent.honestyBadge}</span>
          </div>
        </div>

        {/* 5 Red-Pen Graded Target Cards */}
        <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {goalsContent.metrics.map((metric, idx) => (
            <article
              key={metric.id}
              className={`relative rounded-2xl bg-paper-card dark:bg-chalkboard-card border-2 border-ink dark:border-white/30 p-5 shadow-paper flex flex-col justify-between ${
                idx % 2 === 0 ? 'tilt-card-left' : 'tilt-card-right'
              }`}
            >
              <div>
                {/* Top Category & Red-Pen Stamp */}
                <div className="flex items-center justify-between gap-1 pb-3 border-b border-dashed border-ink/20 dark:border-white/15">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-ink-muted dark:text-chalkboard-muted">
                    {metric.category}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-redpen-soft dark:bg-red-950/80 text-redpen-dark dark:text-red-300 font-hand text-sm font-bold -rotate-3">
                    {metric.gradeStamp}
                  </span>
                </div>

                {/* Red-Pen Circled Score */}
                <div className="my-5 flex items-center justify-center">
                  <div className="relative px-6 py-3 text-center">
                    <HandDrawnCircle className="absolute inset-0 w-full h-full" color="#D93829" />
                    <div className="font-hand text-5xl sm:text-[3.3rem] font-bold text-redpen dark:text-red-400 leading-none">
                      <AnimatedMetricValue
                        value={metric.value}
                        suffix={metric.suffix}
                        decimals={metric.decimals || 0}
                      />
                    </div>
                  </div>
                </div>

                <h3 className="text-base sm:text-lg font-extrabold text-ink dark:text-chalkboard-chalk text-center">
                  {metric.label}
                </h3>
                <p className="text-xs sm:text-sm text-ink-muted dark:text-chalkboard-muted leading-relaxed text-center mt-2">
                  {metric.detail}
                </p>
              </div>

              {/* Footer Goal Tag */}
              <div className="mt-5 pt-2.5 border-t border-ink/10 dark:border-white/10 flex items-center justify-between text-[11px] font-mono text-redpen dark:text-red-400 font-bold">
                <span>PROJECT TARGET</span>
                <StarDoodle className="w-4 h-4" />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

