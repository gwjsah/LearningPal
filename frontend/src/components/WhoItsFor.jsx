import React from 'react';
import { GraduationCap, BookOpenCheck, Check, ArrowUpRight } from 'lucide-react';
import { whoItsForContent } from '../data/content';
import { BinderHoles, WashiTape } from './Doodles';
import { Button, SectionHeading } from './NotebookPrimitives';

export default function WhoItsFor({ onSelectDemoRole }) {
  const handleSelectRole = (mode) => {
    onSelectDemoRole(mode);
    const demoEl = document.getElementById('demo');
    if (demoEl) {
      demoEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      id="who-its-for"
      aria-labelledby="who-heading"
      className="relative py-20 lg:py-28 bg-ruled-paper notebook-margin-line border-b-2 border-ink/15 dark:border-white/15"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pl-10 sm:pl-14 lg:pl-16">
        <SectionHeading
          id="who-heading"
          label={whoItsForContent.sectionLabel}
          headline={whoItsForContent.headline}
          subheadline={whoItsForContent.subheadline}
        />

        {/* Two Side-by-Side Persona Spreads: Student Notebook Page vs. Teacher Gradebook Page */}
        <div className="mt-14 grid grid-cols-1 lg:grid-cols-2 gap-9 items-stretch">
          {whoItsForContent.personas.map((persona, idx) => {
            const isStudent = persona.targetMode === 'student';
            const Icon = isStudent ? GraduationCap : BookOpenCheck;

            return (
              <article
                key={persona.id}
                className={`relative rounded-2xl border-2 border-ink dark:border-white/30 shadow-lifted overflow-hidden flex flex-col justify-between ${
                  isStudent
                    ? 'bg-paper-card dark:bg-chalkboard-card tilt-card-left'
                    : 'bg-paper-warm/90 dark:bg-chalkboard-surface tilt-card-right'
                }`}
              >
                <div className="pt-2">
                  <WashiTape
                    colorClass={
                      isStudent
                        ? 'bg-highlighter-yellow/80 dark:bg-highlighter-yellow/40'
                        : 'bg-highlighter-mint/80 dark:bg-highlighter-mint/40'
                    }
                    rotate={idx === 0 ? '-rotate-2' : 'rotate-2'}
                  />
                </div>

                <div className="flex flex-1">
                  <div className="hidden sm:flex">
                    <BinderHoles vertical={true} />
                  </div>

                  <div className="flex-1 p-6 sm:p-7 border-l-0 sm:border-l-2 border-redpen/30 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 pb-4 border-b border-ink/15 dark:border-white/15">
                        <div>
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded text-xs font-mono font-bold ${
                              isStudent
                                ? 'bg-highlighter-yellow text-ink'
                                : 'bg-highlighter-mint text-ink'
                            }`}
                          >
                            {persona.tabLabel}
                          </span>
                          <span className="block text-xs font-mono text-ink-muted dark:text-chalkboard-muted mt-1">
                            {persona.pageStyle}
                          </span>
                        </div>
                        <div className="w-11 h-11 rounded-xl bg-paper dark:bg-chalkboard border border-ink/20 dark:border-white/20 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-ink dark:text-chalkboard-chalk" />
                        </div>
                      </div>

                      <h3 className="text-2xl sm:text-3xl font-extrabold text-ink dark:text-chalkboard-chalk mt-4">
                        {persona.role}
                      </h3>
                      <p className="font-hand text-2xl text-redpen font-bold mt-1">
                        {persona.headline}
                      </p>
                      <p className="text-sm sm:text-base text-ink-muted dark:text-chalkboard-muted leading-relaxed mt-3">
                        {persona.description}
                      </p>

                      <ul className="mt-5 space-y-2.5">
                        {persona.benefits.map((benefit) => (
                          <li
                            key={benefit}
                            className="flex items-start gap-2.5 text-sm font-medium text-ink dark:text-chalkboard-chalk"
                          >
                            <span
                              className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center shrink-0 border border-ink/20 ${
                                isStudent ? 'bg-highlighter-yellowSoft text-ink' : 'bg-highlighter-mintSoft text-ink'
                              }`}
                            >
                              <Check className="w-3.5 h-3.5" />
                            </span>
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-6 pt-5 border-t border-ink/15 dark:border-white/15 space-y-4">
                      <div className="rounded-xl bg-paper dark:bg-chalkboard border border-ink/15 dark:border-white/15 p-3.5 space-y-2">
                        <span className="text-[11px] font-mono font-bold uppercase text-ink-muted dark:text-chalkboard-muted block">
                          {persona.previewHeader}
                        </span>
                        {persona.previewItems.map((item) => (
                          <div
                            key={item.text}
                            className="flex items-center justify-between gap-2 text-xs py-1 border-b last:border-b-0 border-dashed border-ink/10 dark:border-white/10"
                          >
                            <span className="text-ink dark:text-chalkboard-chalk font-medium truncate">
                              {item.done ? '☑ ' : '☐ '}
                              {item.text}
                            </span>
                            <span className="shrink-0 px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-highlighter-yellowSoft text-ink">
                              {item.tag}
                            </span>
                          </div>
                        ))}
                      </div>

                      <Button
                        variant={isStudent ? 'yellow' : 'mint'}
                        size="md"
                        onClick={() => handleSelectRole(persona.targetMode)}
                        className="w-full"
                      >
                        <span>{persona.ctaText}</span>
                        <ArrowUpRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
