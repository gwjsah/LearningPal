import React from 'react';
import { Database, Cpu, Compass, Check } from 'lucide-react';
import { howItWorksContent } from '../data/content';
import { HandDrawnCircle, StarDoodle } from './Doodles';

export default function HowItWorks() {
  const stepIcons = [Database, Cpu, Compass];

  return (
    <section
      id="how-it-works"
      aria-labelledby="how-heading"
      className="relative py-20 lg:py-28 bg-ruled-paper notebook-margin-line border-b-2 border-ink/15 dark:border-white/15 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pl-10 sm:pl-14 lg:pl-16">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <span className="inline-block px-3 py-1 rounded-md font-mono text-xs font-bold uppercase tracking-wider bg-highlighter-yellowSoft dark:bg-yellow-950/70 text-ink dark:text-yellow-200 border border-ink/20 dark:border-yellow-500/30">
            {howItWorksContent.sectionLabel}
          </span>
          <h2
            id="how-heading"
            className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-ink dark:text-chalkboard-chalk tracking-tight"
          >
            {howItWorksContent.headline}
          </h2>
          <p className="text-base sm:text-lg text-ink-muted dark:text-chalkboard-muted leading-relaxed">
            {howItWorksContent.subheadline}
          </p>
        </div>

        {/* 3-Step Flow with Hand-Drawn Connecting Dashed Doodle Path */}
        <div className="relative mt-16">
          {/* Desktop Hand-Drawn Dashed Connector Arrow Path behind cards */}
          <svg
            viewBox="0 0 1000 120"
            fill="none"
            className="hidden lg:block absolute top-14 left-0 w-full h-28 pointer-events-none z-0"
            aria-hidden="true"
          >
            {/* Step 1 to Step 2 curved dashed doodle */}
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

            {/* Step 2 to Step 3 curved dashed doodle */}
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

          <ol className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-9">
            {howItWorksContent.steps.map((step, idx) => {
              const Icon = stepIcons[idx] || Compass;

              return (
                <li
                  key={step.number}
                  className={`rounded-2xl bg-paper-card dark:bg-chalkboard-card border-2 border-ink dark:border-white/30 p-6 sm:p-7 shadow-paper flex flex-col justify-between ${
                    idx === 1 ? 'lg:-translate-y-2' : ''
                  }`}
                >
                  <div>
                    {/* Hand-Numbered Step Header */}
                    <div className="flex items-center justify-between gap-3 mb-5">
                      <div className="flex items-center gap-3">
                        <div className="relative w-14 h-14 flex items-center justify-center">
                          <HandDrawnCircle className="absolute inset-0 w-full h-full" color="#D93829" />
                          <span className="font-hand text-3xl font-bold text-redpen dark:text-red-400">
                            #{step.number}
                          </span>
                        </div>
                        <div>
                          <span className="text-xs font-mono font-bold uppercase tracking-widest text-redpen dark:text-red-400 block">
                            Step {step.number}
                          </span>
                          <span className="font-hand text-3xl font-bold text-ink dark:text-chalkboard-chalk">
                            {step.verb}
                          </span>
                        </div>
                      </div>

                      <div className="w-11 h-11 rounded-xl bg-highlighter-yellowSoft dark:bg-chalkboard-surface border border-ink/20 dark:border-white/20 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-ink dark:text-highlighter-yellow" />
                      </div>
                    </div>

                    {/* Step Title & Badge */}
                    <div className="mb-3">
                      <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold bg-paper-warm dark:bg-chalkboard-surface text-ink-muted dark:text-chalkboard-muted border border-ink/15 dark:border-white/15 mb-2">
                        {step.badge}
                      </span>
                      <h3 className="text-xl font-extrabold text-ink dark:text-chalkboard-chalk">
                        {step.title}
                      </h3>
                    </div>

                    <p className="text-sm sm:text-base text-ink-muted dark:text-chalkboard-muted leading-relaxed mb-6">
                      {step.description}
                    </p>
                  </div>

                  {/* Mini Notebook Artifact Preview inside the card */}
                  <div className="rounded-xl bg-paper-warm/75 dark:bg-chalkboard/60 border border-ink/15 dark:border-white/15 p-3.5 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-mono font-bold uppercase text-ink-muted dark:text-chalkboard-muted">
                      <span>{step.artifactTitle}</span>
                      <StarDoodle className="w-4 h-4" />
                    </div>

                    <div className="space-y-1.5">
                      {step.artifactItems.map((item) => (
                        <div
                          key={item.label}
                          className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-paper-card dark:bg-chalkboard-card border border-ink/10 dark:border-white/10 text-xs"
                        >
                          <span className="font-medium text-ink dark:text-chalkboard-chalk flex items-center gap-1.5 truncate">
                            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="truncate">{item.label}</span>
                          </span>
                          <span
                            className={`shrink-0 px-2 py-0.5 rounded font-mono text-[10px] font-bold text-ink ${item.color}`}
                          >
                            {item.meta}
                          </span>
                        </div>
                      ))}
                    </div>

                    <p className="pt-1 text-right font-hand text-lg font-bold text-redpen dark:text-red-400">
                      ↳ {step.handNote}
                    </p>
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

