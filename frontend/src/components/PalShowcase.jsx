import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, CheckCircle2 } from 'lucide-react';
import { palShowcaseContent } from '../data/content';
import PalAvatar from './PalAvatar';
import { NotebookCard } from './NotebookPrimitives';
import { PAL_COLORS, PAL_STYLES } from '../utils/palEngine';

export default function PalShowcase() {
  const [styleId, setStyleId] = useState('sticky');
  const [colorId, setColorId] = useState('yellow');
  const [moodId, setMoodId] = useState('foggy');

  const activeMood =
    palShowcaseContent.moods.find((m) => m.id === moodId) || palShowcaseContent.moods[1];
  const activeStyle = PAL_STYLES.find((s) => s.id === styleId) || PAL_STYLES[0];

  return (
    <section
      id="study-pal"
      aria-labelledby="study-pal-heading"
      className="relative py-16 lg:py-24 bg-dot-paper border-b-2 border-ink/15 dark:border-chalkboard-borderSubtle overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl space-y-3">
          <h2
            id="study-pal-heading"
            className="text-3xl sm:text-4xl font-extrabold tracking-tight text-ink dark:text-chalkboard-chalk leading-tight"
          >
            {palShowcaseContent.headline}
          </h2>
          <p className="text-base sm:text-lg text-ink-muted dark:text-chalkboard-muted leading-relaxed">
            {palShowcaseContent.subheadline}
          </p>
        </div>

        <div className="mt-10 lg:mt-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left 7 cols: Live Interactive Notebook Pal Preview */}
          <div className="lg:col-span-7 flex flex-col">
            <NotebookCard
              pageLabel="Study Pal • Live Preview"
              ruled
              className="h-full flex flex-col"
              bodyClassName="flex-1 flex flex-col justify-between gap-5 p-5 sm:p-6"
            >
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-ink-muted dark:text-chalkboard-muted">
                    Diagnostic State
                  </span>
                  <span className="text-xs font-mono text-ink-muted dark:text-chalkboard-muted">
                    Trigger: <strong className="text-ink dark:text-chalkboard-chalk">{activeMood.trigger}</strong>
                  </span>
                </div>
                <div role="radiogroup" aria-label="Preview Pal diagnostic mood" className="flex flex-wrap gap-2">
                  {palShowcaseContent.moods.map((m) => {
                    const selected = m.id === moodId;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => setMoodId(m.id)}
                        className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-mono font-bold border-2 transition cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-redpen ${
                          selected
                            ? 'bg-ink text-paper dark:bg-highlighter-yellow dark:text-ink border-ink dark:border-highlighter-yellow shadow-notebook-sm'
                            : 'bg-paper-card dark:bg-chalkboard-card text-ink dark:text-chalkboard-chalk border-ink/25 dark:border-chalkboard-border hover:border-ink/60'
                        }`}
                      >
                        {m.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-5 min-h-[164px] flex-1 rounded-xl bg-paper-card/90 dark:bg-chalkboard-surface border-2 border-ink dark:border-chalkboard-border shadow-notebook-sm flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="shrink-0">
                  <PalAvatar style={styleId} color={colorId} mood={moodId} size={92} label={`${activeStyle.label} in ${moodId} mood`} />
                </div>
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-redpen dark:text-red-400">
                      Pip • {activeStyle.label}
                    </span>
                    <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-paper-warm dark:bg-chalkboard-card text-ink dark:text-chalkboard-chalk border border-ink/25 dark:border-chalkboard-border">
                      {activeMood.statusLabel}
                    </span>
                  </div>
                  <h3 className="font-hand text-2xl font-bold text-ink dark:text-chalkboard-chalk leading-snug">
                    {activeMood.headline}
                  </h3>
                  <p className="text-sm text-ink-muted dark:text-chalkboard-muted leading-relaxed">
                    {activeMood.message}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-ink/15 dark:border-chalkboard-borderSubtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div role="radiogroup" aria-label="Choose Pal companion style" className="grid grid-cols-2 sm:flex sm:flex-wrap gap-1.5">
                  {PAL_STYLES.map((s) => {
                    const active = s.id === styleId;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => setStyleId(s.id)}
                        className={`min-h-[36px] px-2.5 py-1 rounded-lg text-xs font-bold border-2 transition cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-redpen ${
                          active
                            ? 'border-ink dark:border-chalkboard-chalk bg-highlighter-yellowSoft dark:bg-chalkboard-card text-ink dark:text-chalkboard-chalk shadow-notebook-sm'
                            : 'border-ink/20 dark:border-chalkboard-border bg-paper-card/80 dark:bg-chalkboard-surface text-ink-muted dark:text-chalkboard-muted'
                        }`}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>
                <div role="radiogroup" aria-label="Choose Pal highlighter color" className="flex items-center gap-2">
                  {PAL_COLORS.map((c) => {
                    const active = c.id === colorId;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        aria-label={c.label}
                        title={c.label}
                        onClick={() => setColorId(c.id)}
                        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-redpen ${
                          active ? 'border-ink dark:border-chalkboard-chalk scale-110 shadow-notebook-sm' : 'border-ink/30 hover:scale-105'
                        }`}
                        style={{ backgroundColor: c.fill }}
                      >
                        {active && <Check className="w-4 h-4 text-ink" strokeWidth={3} aria-hidden="true" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </NotebookCard>
          </div>

          {/* Right 5 cols: Honest Product Facts + Signup CTA */}
          <div className="lg:col-span-5 space-y-5">
            <ul className="space-y-4">
              {palShowcaseContent.facts.map((fact) => (
                <li
                  key={fact.title}
                  className="p-4 sm:p-5 rounded-xl bg-paper-card dark:bg-chalkboard-card border-2 border-ink dark:border-chalkboard-border shadow-notebook-sm flex items-start gap-3"
                >
                  <CheckCircle2
                    className="w-5 h-5 text-ink-blue dark:text-highlighter-mint shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <div className="space-y-1">
                    <h3 className="text-base font-extrabold text-ink dark:text-chalkboard-chalk">
                      {fact.title}
                    </h3>
                    <p className="text-sm text-ink-muted dark:text-chalkboard-muted leading-relaxed">
                      {fact.detail}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="pt-1">
              <Link
                to="/signup"
                className="group flex items-center justify-between gap-3 w-full px-5 py-3.5 rounded-xl border-2 border-ink bg-redpen hover:bg-redpen-dark text-white font-bold text-sm sm:text-base shadow-notebook-sm hover:-translate-y-0.5 active:translate-y-0 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-redpen"
              >
                <span>Pick Your Pal on Signup</span>
                <ArrowRight className="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
