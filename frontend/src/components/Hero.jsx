import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  PenTool,
  TrendingUp,
} from 'lucide-react';
import { heroContent } from '../data/content';
import {
  SquigglyUnderline,
  HandDrawnCircle,
  ScribbledArrow,
  WashiTape,
  BinderHoles,
} from './Doodles';

export default function Hero({ onSelectDemoRole }) {
  const [selectedTopicId, setSelectedTopicId] = useState('meiosis');
  const { heroCard } = heroContent;

  const handleOpenDemo = (role) => {
    onSelectDemoRole(role);
    const demoEl = document.getElementById('demo');
    if (demoEl) {
      demoEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      aria-labelledby="hero-heading"
      className="relative overflow-hidden bg-ruled-paper notebook-margin-line border-b-2 border-ink/15 dark:border-white/15 pt-10 pb-20 lg:pt-16 lg:pb-24"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pl-10 sm:pl-14 lg:pl-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
          {/* Left Column: Copy, Hand-Drawn Annotations & CTAs */}
          <div className="lg:col-span-6 space-y-6">
            {/* Washi-tape style eyebrow badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md bg-highlighter-yellowSoft dark:bg-yellow-950/70 border border-ink/20 dark:border-yellow-500/30 shadow-sm -rotate-1">
              <PenTool className="w-3.5 h-3.5 text-redpen dark:text-red-400" />
              <span className="font-mono text-xs font-semibold tracking-tight text-ink dark:text-chalkboard-chalk">
                {heroContent.eyebrow}
              </span>
            </div>

            {/* Main Headline */}
            <h1
              id="hero-heading"
              className="text-4xl sm:text-5xl lg:text-[3.35rem] font-extrabold tracking-tight text-ink dark:text-chalkboard-chalk leading-[1.12]"
            >
              {heroContent.headlinePrefix}
              <span className="relative inline-block">
                <span className="marker-highlight-yellow">{heroContent.headlineHighlight}</span>
                <SquigglyUnderline color="#D93829" className="w-full h-3.5 -mt-1" />
              </span>
              {heroContent.headlineSuffix}
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl text-ink-muted dark:text-chalkboard-muted leading-relaxed max-w-2xl">
              {heroContent.subheadline}
            </p>

            {/* Two Primary CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
              <Link
                to="/signup"
                className="group inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl border-2 border-ink bg-redpen hover:bg-redpen-dark text-white font-bold text-base shadow-[4px_4px_0_#1B2534] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#1B2534] active:translate-y-0 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-redpen"
              >
                <span>{heroContent.primaryCta}</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>

              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl border-2 border-ink dark:border-white/40 bg-paper-card dark:bg-chalkboard-card hover:bg-highlighter-mintSoft dark:hover:bg-emerald-950/50 text-ink dark:text-chalkboard-chalk font-bold text-base shadow-[4px_4px_0_#1B2534] dark:shadow-[4px_4px_0_rgba(255,255,255,0.2)] hover:translate-y-[-2px] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-redpen"
              >
                <BookOpen className="w-4 h-4 text-ink-blue dark:text-emerald-300" />
                <span>Log In</span>
              </Link>
            </div>

            {/* Handwritten Margin Callout */}
            <div className="pt-2 flex items-center gap-3 text-redpen dark:text-red-400">
              <ScribbledArrow className="w-10 h-8 shrink-0 -mt-3" />
              <p className="font-hand text-2xl sm:text-3xl font-bold tracking-wide">
                “{heroContent.marginNote}”
              </p>
            </div>

            {/* Quick Trust Pills */}
            <dl className="grid grid-cols-3 gap-3 pt-3 border-t border-ink/10 dark:border-white/10 max-w-lg">
              <div>
                <dt className="text-xs font-mono uppercase text-ink-muted dark:text-chalkboard-muted">
                  Granularity
                </dt>
                <dd className="text-sm sm:text-base font-bold text-ink dark:text-chalkboard-chalk">
                  Topic-by-Topic
                </dd>
              </div>
              <div>
                <dt className="text-xs font-mono uppercase text-ink-muted dark:text-chalkboard-muted">
                  Actionability
                </dt>
                <dd className="text-sm sm:text-base font-bold text-ink dark:text-chalkboard-chalk">
                  Matched Activities
                </dd>
              </div>
              <div>
                <dt className="text-xs font-mono uppercase text-ink-muted dark:text-chalkboard-muted">
                  Dual Perspectives
                </dt>
                <dd className="text-sm sm:text-base font-bold text-ink dark:text-chalkboard-chalk">
                  Student + Teacher
                </dd>
              </div>
            </dl>
          </div>

          {/* Right Column: Interactive Notebook Page Dashboard Visual with Animated Drawing Chart */}
          <div className="lg:col-span-6 relative">
            {/* Decorative background graph sheet tilted behind */}
            <div
              className="hidden sm:block absolute inset-0 translate-x-3 translate-y-3 rotate-2 rounded-2xl bg-graph-paper border-2 border-ink/25 dark:border-white/20 shadow-paper pointer-events-none"
              aria-hidden="true"
            />

            {/* Main Notebook Sheet Card */}
            <motion.div
              initial={{ opacity: 0, y: 18, rotate: -1 }}
              animate={{ opacity: 1, y: 0, rotate: -0.75 }}
              transition={{ duration: 0.55, ease: 'easeOut' }}
              whileHover={{ rotate: 0, y: -3 }}
              className="relative rounded-2xl bg-paper-card dark:bg-chalkboard-card border-2 border-ink dark:border-white/35 shadow-lifted overflow-hidden"
            >
              {/* Washi tape on top */}
              <div className="pt-2">
                <WashiTape colorClass="bg-highlighter-mint/75 dark:bg-emerald-500/40" rotate="rotate-1" />
              </div>

              <div className="flex">
                {/* Left Binder Holes Strip */}
                <BinderHoles vertical={true} />

                {/* Notebook Sheet Inner Content */}
                <div className="flex-1 p-4 sm:p-6 border-l-2 border-redpen/35">
                  {/* Top Notebook Page Header */}
                  <div className="flex flex-wrap items-start justify-between gap-2 pb-4 border-b border-ink/15 dark:border-white/15">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 text-[11px] font-mono font-bold uppercase rounded bg-highlighter-yellow text-ink">
                          Diagnostic Sheet
                        </span>
                        <span className="text-xs font-mono text-ink-muted dark:text-chalkboard-muted">
                          {heroCard.dateLabel}
                        </span>
                      </div>
                      <h2 className="text-lg sm:text-xl font-bold text-ink dark:text-chalkboard-chalk mt-1">
                        {heroCard.subject}
                      </h2>
                      <p className="text-xs font-mono text-ink-muted dark:text-chalkboard-muted">
                        Learner: <strong className="text-ink dark:text-white">{heroCard.studentName}</strong>
                      </p>
                    </div>

                    {/* Red-Pen Graded Score Stamp */}
                    <div className="relative px-3.5 py-1.5 text-center">
                      <HandDrawnCircle className="absolute inset-0 w-full h-full" />
                      <div className="font-hand text-3xl font-bold text-redpen dark:text-red-400 leading-none">
                        {heroCard.overallScore}%
                      </div>
                      <div className="text-[11px] font-mono font-semibold text-emerald-700 dark:text-emerald-400 flex items-center justify-center gap-0.5">
                        <TrendingUp className="w-3 h-3" />
                        <span>{heroCard.scoreDelta}</span>
                      </div>
                    </div>
                  </div>

                  {/* SVG Hand-Drawn Mastery Curve that "gets drawn" on load */}
                  <div className="mt-4 p-3 rounded-xl bg-graph-paper border border-ink/15 dark:border-white/15">
                    <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                      <span className="font-semibold text-ink dark:text-chalkboard-chalk flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-redpen" />
                        Topic Mastery Profile (Drawn Live from 4 Quizzes)
                      </span>
                      <span className="text-redpen dark:text-red-400 font-hand text-base font-bold">
                        Target: 80% line
                      </span>
                    </div>

                    <svg
                      viewBox="0 0 420 110"
                      className="w-full h-24 sm:h-28 overflow-visible"
                      role="img"
                      aria-label="Line chart showing high mastery in Cell Organelles at 94% and a priority learning gap in Meiosis at 52%"
                    >
                      {/* Target 80% dashed line */}
                      <line
                        x1="20"
                        y1="30"
                        x2="400"
                        y2="30"
                        stroke="#D93829"
                        strokeWidth="1.5"
                        strokeDasharray="5 5"
                        opacity="0.7"
                      />
                      <text x="330" y="24" fill="#D93829" className="text-[10px] font-mono font-bold">
                        80% Mastery Goal
                      </text>

                      {/* Area fill under the curve */}
                      <motion.path
                        d="M 45 16 C 115 20, 145 26, 175 28 C 215 31, 255 58, 290 64 C 325 70, 355 76, 380 78 L 380 96 L 45 96 Z"
                        fill="rgba(253, 224, 71, 0.25)"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5, duration: 0.6 }}
                      />

                      {/* Animated Pen-Drawn Mastery Curve */}
                      <motion.path
                        d="M 45 16 C 115 20, 145 26, 175 28 C 215 31, 255 58, 290 64 C 325 70, 355 76, 380 78"
                        fill="none"
                        stroke="#1E3A5F"
                        className="dark:stroke-sky-300"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.4, ease: 'easeInOut' }}
                      />

                      {/* Data nodes along the curve */}
                      {[
                        { cx: 45, cy: 16, label: 'Organelles', val: '94%', gap: false },
                        { cx: 175, cy: 28, label: 'ATP Resp.', val: '82%', gap: false },
                        { cx: 290, cy: 64, label: 'Enzymes', val: '61%', gap: true },
                        { cx: 380, cy: 78, label: 'Meiosis', val: '52%', gap: true },
                      ].map((pt, idx) => (
                        <g key={pt.label}>
                          <motion.circle
                            cx={pt.cx}
                            cy={pt.cy}
                            r={pt.gap ? 6 : 5}
                            fill={pt.gap ? '#D93829' : '#10B981'}
                            stroke="#FDFBF7"
                            strokeWidth="2"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.3 + idx * 0.25, type: 'spring' }}
                          />
                          <text
                            x={pt.cx}
                            y="104"
                            textAnchor="middle"
                            className="fill-ink dark:fill-chalkboard-chalk text-[10px] font-mono font-medium"
                          >
                            {pt.label}
                          </text>
                        </g>
                      ))}

                      {/* Red-pen circle around the Meiosis gap point */}
                      <motion.ellipse
                        cx="380"
                        cy="78"
                        rx="22"
                        ry="14"
                        fill="none"
                        stroke="#D93829"
                        strokeWidth="2"
                        strokeDasharray="4 2"
                        initial={{ opacity: 0, scale: 0.7 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 1.3, duration: 0.4 }}
                      />

                      {/* Animated Pencil Icon at the end of the drawn line */}
                      <motion.g
                        initial={{ x: 45, y: 16, opacity: 0 }}
                        animate={{ x: 384, y: 66, opacity: 1 }}
                        transition={{ duration: 1.4, ease: 'easeInOut' }}
                      >
                        <rect
                          x="0"
                          y="-14"
                          width="5"
                          height="13"
                          rx="1"
                          transform="rotate(35)"
                          fill="#FDE047"
                          stroke="#1B2534"
                          strokeWidth="1.2"
                        />
                        <polygon
                          points="0,0 2.5,5 5,0"
                          transform="rotate(35)"
                          fill="#D93829"
                        />
                      </motion.g>
                    </svg>
                  </div>

                  {/* Topic-Level Breakdown Bars (Interactive on click) */}
                  <div className="mt-4 space-y-2.5" role="list" aria-label="Detected topic mastery scores">
                    <div className="flex items-center justify-between text-xs font-mono text-ink-muted dark:text-chalkboard-muted">
                      <span>Click any topic to inspect gap analysis:</span>
                      <span>Score / Status</span>
                    </div>

                    {heroCard.topics.map((topic, index) => {
                      const isGap = topic.score < 70;
                      const isSelected = selectedTopicId === topic.id;

                      return (
                        <button
                          key={topic.id}
                          type="button"
                          onClick={() => setSelectedTopicId(topic.id)}
                          className={`w-full text-left p-2.5 rounded-xl border transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-redpen ${
                            isSelected
                              ? 'bg-highlighter-yellowSoft/80 dark:bg-chalkboard-surface border-ink dark:border-white/40 shadow-sm'
                              : 'bg-paper/60 dark:bg-chalkboard/40 border-ink/15 dark:border-white/10 hover:border-ink/40'
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs sm:text-sm font-semibold text-ink dark:text-chalkboard-chalk mb-1.5">
                            <span className="flex items-center gap-1.5">
                              {isGap ? (
                                <AlertCircle className="w-4 h-4 text-redpen shrink-0" />
                              ) : (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              )}
                              <span>{topic.name}</span>
                            </span>
                            <span className="flex items-center gap-2 font-mono text-xs">
                              <span
                                className={`px-2 py-0.5 rounded font-bold ${
                                  isGap
                                    ? 'bg-redpen-soft text-redpen-dark dark:bg-red-950/80 dark:text-red-300'
                                    : 'bg-highlighter-mintSoft text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-300'
                                }`}
                              >
                                {topic.note}
                              </span>
                              <span className="font-bold w-9 text-right">{topic.score}%</span>
                            </span>
                          </div>

                          {/* Pen-stroke style progress bar */}
                          <div className="h-2.5 w-full rounded-full bg-paper-warm dark:bg-chalkboard overflow-hidden border border-ink/15 dark:border-white/10 p-0.5">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${topic.score}%` }}
                              transition={{ duration: 0.9, delay: 0.2 + index * 0.12, ease: 'easeOut' }}
                              className={`h-full rounded-full ${
                                topic.score >= 80
                                  ? 'bg-emerald-500'
                                  : topic.score >= 60
                                  ? 'bg-amber-400'
                                  : 'bg-redpen'
                              }`}
                            />
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Sticky-Note Personalized Recommendation Footer */}
                  <div className="mt-4 p-3.5 rounded-xl bg-highlighter-yellowSoft dark:bg-yellow-950/50 border-2 border-ink/20 dark:border-yellow-500/30 shadow-sticky rotate-[0.5deg]">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-redpen dark:text-red-300">
                          ★ Recommended Next Step ({heroCard.pinnedRecommendation.topic})
                        </span>
                        <p className="text-sm font-bold text-ink dark:text-chalkboard-chalk mt-0.5">
                          {heroCard.pinnedRecommendation.title}
                        </p>
                        <p className="text-xs text-ink-muted dark:text-chalkboard-muted mt-0.5">
                          {heroCard.pinnedRecommendation.matchReason}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenDemo('student')}
                        className="shrink-0 px-3 py-1.5 rounded-lg bg-ink text-paper dark:bg-highlighter-yellow dark:text-ink text-xs font-mono font-bold hover:opacity-90 transition-opacity"
                      >
                        Start →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

