import React from 'react';
import { Database, Cpu, Compass } from 'lucide-react';
import { howItWorksContent } from '../data/content';
import { HandDrawnCircle } from './Doodles';
import { SectionHeading } from './NotebookPrimitives';

export default function HowItWorks() {
  const stepIcons = [Database, Cpu, Compass];

  return (
    <section
      id="how-it-works"
      aria-labelledby="how-heading"
      className="relative py-16 lg:py-24 bg-ruled-paper notebook-margin-line border-b-2 border-ink/15 dark:border-chalkboard-borderSubtle overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pl-10 sm:pl-14 lg:pl-16">
        <SectionHeading
          id="how-heading"
          label={howItWorksContent.sectionLabel}
          headline={howItWorksContent.headline}
          subheadline={howItWorksContent.subheadline}
          underline={false}
        />

        {/* 3-Step Flow with Hand-Drawn Connecting Dashed Doodle Path */}
        <div className="relative mt-12 sm:mt-16">
          <svg
            viewBox="0 0 1000 120"
            fill="none"
            className="hidden lg:block absolute top-14 left-0 w-full h-28 pointer-events-none z-0"
            aria-hidden="true"
          >
            <path
              d="M 275 45 C 340 10, 405 85, 475 42"
              stroke="#D93829"
              strokeWidth="3"
              strokeDasharray="8 7"
              strokeLinecap="round"
            />
            <path
              d="M 463 34 L 478 41 L 467 53"
              stroke="#D93829"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M 615 45 C 680 85, 745 10, 815 45"
              stroke="#D93829"
              strokeWidth="3"
              strokeDasharray="8 7"
              strokeLinecap="round"
            />
            <path
              d="M 803 36 L 818 45 L 805 55"
              stroke="#D93829"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          <ol className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {howItWorksContent.steps.map((step, idx) => {
              const Icon = stepIcons[idx] || Compass;

              return (
                <li
                  key={step.number}
                  className={`rounded-2xl bg-paper-card dark:bg-chalkboard-card border-2 border-ink dark:border-chalkboard-border p-6 sm:p-7 shadow-paper flex flex-col justify-between transition-transform duration-200 hover:-translate-y-1 ${
                    idx === 1 ? 'lg:-translate-y-2' : ''
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-5">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 flex items-center justify-center">
                          <HandDrawnCircle className="absolute inset-0 w-full h-full" />
                          <span className="font-hand text-2xl font-bold text-redpen">
                            #{step.number}
                          </span>
                        </div>
                        <div>
                          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-redpen block">
                            Step {step.number}
                          </span>
                          <span className="font-hand text-2xl font-bold text-ink dark:text-chalkboard-chalk">
                            {step.verb}
                          </span>
                        </div>
                      </div>

                      <div className="w-10 h-10 rounded-xl bg-highlighter-yellowSoft dark:bg-chalkboard-surface border border-ink/20 dark:border-chalkboard-borderSubtle flex items-center justify-center">
                        <Icon className="w-5 h-5 text-ink dark:text-highlighter-yellow" />
                      </div>
                    </div>

                    <div className="mb-2">
                      <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold bg-paper-warm dark:bg-chalkboard-surface text-ink-muted dark:text-chalkboard-muted border border-ink/15 dark:border-chalkboard-borderSubtle mb-2">
                        {step.badge}
                      </span>
                      <h3 className="text-xl font-extrabold text-ink dark:text-chalkboard-chalk">
                        {step.title}
                      </h3>
                    </div>

                    <p className="text-sm text-ink-muted dark:text-chalkboard-muted leading-relaxed">
                      {step.description}
                    </p>
                  </div>

                  <div className="pt-5 mt-5 border-t border-ink/10 dark:border-chalkboard-borderSubtle flex items-center justify-between">
                    <span className="text-xs font-mono text-ink-muted dark:text-chalkboard-muted">Key benefit</span>
                    <span className="font-hand text-base font-bold text-redpen dark:text-red-400">
                      ↳ {step.handNote}
                    </span>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
