import React from 'react';
import {
  LayoutDashboard,
  ScanSearch,
  Sparkles,
  LineChart,
  CalendarClock,
  CheckCircle2,
  BellRing,
  Star,
} from 'lucide-react';
import { featuresContent } from '../data/content';
import { PaperClip, WashiTape, SquigglyUnderline } from './Doodles';

export default function FeaturesGrid() {
  const cardIcons = {
    'feat-dashboard': LayoutDashboard,
    'feat-gap-analysis': ScanSearch,
    'feat-recommendations': Sparkles,
    'feat-teacher-view': LineChart,
    'feat-coming-soon': CalendarClock,
  };

  const tapeColors = {
    yellow: 'bg-highlighter-yellow/80 dark:bg-yellow-500/40',
    mint: 'bg-highlighter-mint/80 dark:bg-emerald-500/40',
    pink: 'bg-highlighter-pink/80 dark:bg-pink-500/40',
    sky: 'bg-highlighter-sky/80 dark:bg-sky-500/40',
    red: 'bg-redpen/30 dark:bg-red-500/35',
  };

  const coreFeatures = featuresContent.features.filter((f) => !f.isComingSoon);
  const comingSoonCard = featuresContent.features.find((f) => f.isComingSoon);

  return (
    <section
      id="features"
      aria-labelledby="features-heading"
      className="relative py-20 lg:py-28 bg-dot-paper border-b-2 border-ink/15 dark:border-white/15"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <span className="inline-block px-3 py-1 rounded-md font-mono text-xs font-bold uppercase tracking-wider bg-blue-100 dark:bg-blue-950/70 text-ink dark:text-blue-200 border border-ink/20 dark:border-blue-500/30">
            {featuresContent.sectionLabel}
          </span>
          <h2
            id="features-heading"
            className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-ink dark:text-chalkboard-chalk tracking-tight"
          >
            {featuresContent.headline}
          </h2>
          <div className="flex justify-center">
            <SquigglyUnderline className="w-52 h-3" color="#D93829" />
          </div>
          <p className="text-base sm:text-lg text-ink-muted dark:text-chalkboard-muted leading-relaxed">
            {featuresContent.subheadline}
          </p>
        </div>

        {/* 4 Core Index Cards Grid */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-9">
          {coreFeatures.map((feat, idx) => {
            const Icon = cardIcons[feat.id] || Sparkles;
            const tapeClass = tapeColors[feat.accent] || tapeColors.yellow;

            return (
              <article
                key={feat.id}
                className={`relative rounded-2xl bg-index-card border-2 border-ink dark:border-white/30 p-6 sm:p-7 shadow-paper flex flex-col justify-between ${feat.rotation}`}
              >
                {/* Alternating Washi Tape or Paper Clip */}
                {idx % 2 === 0 ? (
                  <WashiTape colorClass={tapeClass} rotate={idx === 0 ? '-rotate-2' : 'rotate-2'} />
                ) : (
                  <PaperClip className="absolute -top-4 right-8" />
                )}

                <div>
                  {/* Index Card Top Header above the red index line */}
                  <div className="flex items-center justify-between gap-2 pb-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold uppercase tracking-wider text-redpen dark:text-red-400">
                        {feat.number}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-highlighter-mintSoft text-emerald-950">
                        {feat.status}
                      </span>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-paper-warm dark:bg-chalkboard border border-ink/20 dark:border-white/20 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-ink dark:text-chalkboard-chalk" />
                    </div>
                  </div>

                  {/* Card Title & Description */}
                  <h3 className="text-xl sm:text-2xl font-extrabold text-ink dark:text-chalkboard-chalk mt-2">
                    {feat.title}
                  </h3>
                  <p className="text-sm sm:text-base text-ink-muted dark:text-chalkboard-muted leading-relaxed mt-2.5">
                    {feat.description}
                  </p>
                </div>

                {/* Bullet Highlights */}
                <ul className="mt-6 pt-4 border-t border-ink/15 dark:border-white/15 space-y-2">
                  {feat.highlights.map((bullet) => (
                    <li
                      key={bullet}
                      className="flex items-start gap-2 text-xs sm:text-sm font-medium text-ink dark:text-chalkboard-chalk"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>

        {/* 5th Feature Card: "Coming Soon" Clippings with Rubber Stamps & Tape Labels */}
        {comingSoonCard && (
          <article className="relative mt-10 rounded-2xl bg-paper-card dark:bg-chalkboard-card border-2 border-dashed border-ink/50 dark:border-white/35 p-6 sm:p-8 shadow-paper">
            <WashiTape colorClass="bg-highlighter-pink/80 dark:bg-pink-500/40" rotate="rotate-1" />

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-ink/15 dark:border-white/15">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-redpen dark:text-red-400">
                    {comingSoonCard.number} • Next in the Notebook
                  </span>
                  <span className="rubber-stamp px-2.5 py-0.5 text-xs font-mono text-redpen dark:text-red-400 -rotate-2">
                    COMING SOON
                  </span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-ink dark:text-chalkboard-chalk">
                  {comingSoonCard.title}
                </h3>
                <p className="text-sm sm:text-base text-ink-muted dark:text-chalkboard-muted max-w-2xl">
                  {comingSoonCard.description}
                </p>
              </div>

              <div className="font-hand text-2xl font-bold text-redpen dark:text-red-400 lg:text-right">
                ✎ Scheduled for Phase 2 Release
              </div>
            </div>

            {/* 3 Paper Clippings for Study Plans, Reminders, and Resource Ratings */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              {comingSoonCard.comingSoonItems.map((item, idx) => {
                const subIcons = [CalendarClock, BellRing, Star];
                const SubIcon = subIcons[idx] || Star;
                const badgeRotations = ['-rotate-3', 'rotate-2', '-rotate-2'];

                return (
                  <div
                    key={item.name}
                    className="relative rounded-xl bg-paper-warm/80 dark:bg-chalkboard-surface border border-ink/20 dark:border-white/15 p-5 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="w-9 h-9 rounded-lg bg-paper-card dark:bg-chalkboard-card border border-ink/15 flex items-center justify-center">
                          <SubIcon className="w-4 h-4 text-redpen dark:text-red-400" />
                        </div>
                        {/* Rubber Stamp / Tape Label */}
                        <span
                          className={`rubber-stamp px-2 py-0.5 text-[10px] font-mono text-redpen dark:text-red-400 bg-redpen-soft/60 dark:bg-red-950/60 ${badgeRotations[idx]}`}
                        >
                          {item.badge}
                        </span>
                      </div>

                      <h4 className="text-base sm:text-lg font-extrabold text-ink dark:text-chalkboard-chalk">
                        {item.name}
                      </h4>
                      <p className="text-xs sm:text-sm text-ink-muted dark:text-chalkboard-muted mt-1.5 leading-relaxed">
                        {item.detail}
                      </p>
                    </div>

                    <div className="mt-4 pt-2.5 border-t border-dashed border-ink/15 dark:border-white/10 flex items-center justify-between text-[11px] font-mono text-ink-light dark:text-chalkboard-muted">
                      <span>Roadmap Item #{idx + 1}</span>
                      <span className="font-bold text-ink dark:text-yellow-200">In Prototyping</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </article>
        )}
      </div>
    </section>
  );
}

