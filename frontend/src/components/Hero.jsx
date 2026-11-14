import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Clock,
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

const TOPIC_RECOMMENDATIONS = {
  variables: {
    topic: 'Variables & Data Types',
    title: 'PDF Reference: C99 Primitive Types & Format Specifiers',
    matchReason: 'Strength (92% ≥ 80% across 6 questions) — optional reference sheet for review.',
  },
  control: {
    topic: 'Control Flow & Loops',
    title: 'DOCX Guide: Loop Invariant & Trace Table Walkthrough',
    matchReason: 'Strength (81% ≥ 80% across 5 questions) — reinforces nested loop boundary checks.',
  },
  functions: {
    topic: 'Functions & Scope',
    title: 'PDF Guide: Stack Frames & Pass-by-Value Illustrated',
    matchReason: 'Developing (68%, 60–79% band) — 2 missed questions on local parameter copies.',
  },
  pointers: {
    topic: 'Pointers & Memory Addresses',
    title: 'PDF Guide: Visualizing & and * Dereference Operators on the Stack',
    matchReason: 'Learning Gap (48% < 60% across 4 questions) — prioritized for study next.',
  },
};

export default function Hero({ onSelectDemoRole }) {
  const [selectedTopicId, setSelectedTopicId] = useState('pointers');
  const shouldReduceMotion = useReducedMotion();
  const { heroCard } = heroContent;
  const activeRecommendation =
    TOPIC_RECOMMENDATIONS[selectedTopicId] || heroCard.pinnedRecommendation;

  const handleOpenDemo = (role) => {
    onSelectDemoRole(role);
    const demoEl = document.getElementById('demo');
    if (demoEl) {
      demoEl.scrollIntoView({ behavior: shouldReduceMotion ? 'auto' : 'smooth' });
    }
  };

  return (
    <section
      aria-labelledby="hero-heading"
      className="relative overflow-hidden bg-ruled-paper notebook-margin-line border-b-2 border-ink/15 dark:border-chalkboard-borderSubtle pt-10 pb-20 lg:pt-16 lg:pb-24"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pl-10 sm:pl-14 lg:pl-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
          {/* Left Column: Copy, Hand-Drawn Annotations & CTAs */}
          <div className="lg:col-span-6 space-y-6">
            {/* Washi-tape style eyebrow badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md bg-highlighter-yellowSoft dark:bg-yellow-950/70 border border-ink/20 dark:border-yellow-500/30 shadow-sm -rotate-1">
              <PenTool className="w-3.5 h-3.5 text-redpen dark:text-red-400" aria-hidden="true" />
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
                className="group inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl border-2 border-ink bg-redpen hover:bg-redpen-dark text-white font-bold text-base shadow-notebook-lg hover:translate-y-[-2px] active:translate-y-0 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-redpen"
              >
                <span>{heroContent.primaryCta}</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Link>

              <button
                type="button"
                onClick={() => handleOpenDemo('student')}
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl border-2 border-ink dark:border-chalkboard-border bg-paper-card dark:bg-chalkboard-card hover:bg-highlighter-mintSoft dark:hover:bg-chalkboard-surface text-ink dark:text-chalkboard-chalk font-bold text-base shadow-notebook-lg hover:translate-y-[-2px] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-redpen cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-ink-blue dark:text-highlighter-mint" aria-hidden="true" />
                <span>{heroContent.secondaryCta}</span>
              </button>
            </div>

            {/* Subtle login link */}
            <p className="text-xs font-mono text-ink-muted dark:text-chalkboard-muted">
              Already using LearningPal?{' '}
              <Link
                to="/login"
                className="font-bold text-ink dark:text-chalkboard-chalk hover:text-redpen underline underline-offset-2"
              >
                Log in here →
              </Link>
            </p>

            {/* Handwritten Margin Callout */}
            <div className="pt-2 flex items-center gap-3 text-redpen dark:text-red-400">
              <ScribbledArrow className="w-10 h-8 shrink-0 -mt-3" />
              <p className="font-hand text-2xl sm:text-3xl font-bold tracking-wide">
                “{heroContent.marginNote}”
              </p>
            </div>

            {/* Quick Trust Pills */}
            <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-ink/10 dark:border-chalkboard-borderSubtle max-w-lg">
              <div>
                <dt className="text-xs font-mono uppercase text-ink-muted dark:text-chalkboard-muted">
                  Mastery Scope
                </dt>
                <dd className="text-sm sm:text-base font-bold text-ink dark:text-chalkboard-chalk">
                  Per Student, Per Class
                </dd>
              </div>
              <div>
                <dt className="text-xs font-mono uppercase text-ink-muted dark:text-chalkboard-muted">
                  Grading Engine
                </dt>
                <dd className="text-sm sm:text-base font-bold text-ink dark:text-chalkboard-chalk">
                  100% Rule-Based
                </dd>
              </div>
              <div>
                <dt className="text-xs font-mono uppercase text-ink-muted dark:text-chalkboard-muted">
                  Study Resources
                </dt>
                <dd className="text-sm sm:text-base font-bold text-ink dark:text-chalkboard-chalk">
                  PDF, DOCX &amp; Links
                </dd>
              </div>
            </dl>
          </div>

          {/* Right Column: Sample Diagnostic Sheet Preview */}
          <div className="lg:col-span-6 relative">
            {/* Decorative background graph sheet tilted behind */}
            <div
              className="hidden sm:block absolute inset-0 translate-x-3 translate-y-3 rotate-2 rounded-2xl bg-graph-paper border-2 border-ink/25 dark:border-chalkboard-borderSubtle shadow-paper pointer-events-none"
              aria-hidden="true"
            />

            {/* Main Notebook Sheet Card */}
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, y: 18, rotate: -1 }}
              animate={{ opacity: 1, y: 0, rotate: -0.75 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              className="relative rounded-2xl bg-paper-card dark:bg-chalkboard-card border-2 border-ink dark:border-chalkboard-border shadow-lifted overflow-hidden"
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
                  <div className="flex flex-wrap items-start justify-between gap-2 pb-4 border-b border-ink/15 dark:border-chalkboard-borderSubtle">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 text-[11px] font-mono font-bold uppercase rounded bg-highlighter-yellow text-ink border border-ink/20">
                          {heroCard.sampleBadge}
                        </span>
                        <span className="text-xs font-mono text-ink-muted dark:text-chalkboard-muted">
                          {heroCard.dateLabel}
                        </span>
                      </div>
                      <h2 className="text-lg sm:text-xl font-bold text-ink dark:text-chalkboard-chalk mt-1">
                        {heroCard.subject}
                      </h2>
                      <p className="text-xs font-mono text-ink-muted dark:text-chalkboard-muted">
                        Learner: <strong className="text-ink dark:text-chalkboard-chalk">{heroCard.studentName}</strong>
                      </p>
                    </div>

                    {/* Red-Pen Graded Score Stamp */}
                    <div className="relative px-3.5 py-1.5 text-center">
                      <HandDrawnCircle className="absolute inset-0 w-full h-full" />
                      <div className="font-hand text-3xl font-bold text-redpen dark:text-red-400 leading-none">
                        {heroCard.overallScore}%
                      </div>
                      <div className="text-[11px] font-mono font-semibold text-amber-800 dark:text-amber-300 flex items-center justify-center gap-0.5 mt-0.5">
                        <TrendingUp className="w-3 h-3" aria-hidden="true" />
                        <span>{heroCard.scoreDelta}</span>
                      </div>
                    </div>
                  </div>

                  {/* SVG Hand-Drawn Mastery Curve with 80% Strength and 60% Gap lines */}
                  <div className="mt-4 p-3 rounded-xl bg-graph-paper border border-ink/15 dark:border-chalkboard-borderSubtle">
                    <div className="flex flex-wrap items-center justify-between gap-1 text-xs font-mono mb-1.5">
                      <span className="font-semibold text-ink dark:text-chalkboard-chalk flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-redpen" aria-hidden="true" />
                        Sample Topic Mastery Profile (≥ 3 Questions / Topic)
                      </span>
                      <span className="text-ink-muted dark:text-chalkboard-muted text-[11px]">
                        Bands: ≥80% Strength • 60–79% Dev • &lt;60% Gap
                      </span>
                    </div>

                    <svg
                      viewBox="0 0 420 115"
                      className="w-full h-24 sm:h-28 overflow-visible"
                      role="img"
                      aria-label="Sample chart showing Strength at 92% in Variables and 81% in Loops, Developing at 68% in Functions, and a Learning Gap at 48% in Pointers against 80% Strength and 60% Gap reference lines."
                    >
                      {/* 80% Strength reference line */}
                      <line
                        x1="20"
                        y1="28"
                        x2="400"
                        y2="28"
                        stroke="#059669"
                        strokeWidth="1.5"
                        strokeDasharray="4 4"
                        opacity="0.8"
                      />
                      <text x="325" y="23" fill="#059669" className="text-[9px] font-mono font-bold">
                        80% Strength
                      </text>

                      {/* 60% Gap reference line */}
                      <line
                        x1="20"
                        y1="62"
                        x2="400"
                        y2="62"
                        stroke="#D93829"
                        strokeWidth="1.5"
                        strokeDasharray="5 5"
                        opacity="0.8"
                      />
                      <text x="342" y="57" fill="#D93829" className="text-[9px] font-mono font-bold">
                        60% Gap
                      </text>

                      {/* Animated Pen-Drawn Mastery Curve */}
                      <motion.path
                        d="M 45 16 C 115 20, 145 25, 175 27 C 215 31, 255 44, 290 49 C 325 56, 355 72, 380 78"
                        fill="none"
                        stroke="#1E3A5F"
                        className="dark:stroke-sky-300"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        initial={shouldReduceMotion ? false : { pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.1, ease: 'easeInOut' }}
                      />

                      {/* Data nodes along the curve */}
                      {[
                        { cx: 45, cy: 16, label: 'Variables', status: 'STRENGTH' },
                        { cx: 175, cy: 27, label: 'Loops', status: 'STRENGTH' },
                        { cx: 290, cy: 49, label: 'Functions', status: 'DEVELOPING' },
                        { cx: 380, cy: 78, label: 'Pointers', status: 'GAP' },
                      ].map((pt, idx) => (
                        <g key={pt.label}>
                          <motion.circle
                            cx={pt.cx}
                            cy={pt.cy}
                            r={pt.status === 'GAP' ? 6 : 5}
                            fill={
                              pt.status === 'GAP'
                                ? '#D93829'
                                : pt.status === 'DEVELOPING'
                                ? '#F59E0B'
                                : '#10B981'
                            }
                            stroke="#FDFBF7"
                            strokeWidth="2"
                            initial={shouldReduceMotion ? false : { scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2 + idx * 0.15, type: 'spring' }}
                          />
                          <text
                            x={pt.cx}
                            y="106"
                            textAnchor="middle"
                            className="fill-ink dark:fill-chalkboard-chalk text-[10px] font-mono font-medium"
                          >
                            {pt.label}
                          </text>
                        </g>
                      ))}

                      {/* Red-pen circle around the Pointers <60% gap point */}
                      <ellipse
                        cx="380"
                        cy="78"
                        rx="22"
                        ry="14"
                        fill="none"
                        stroke="#D93829"
                        strokeWidth="2"
                        strokeDasharray="4 2"
                      />
                    </svg>
                  </div>

                  {/* Topic-Level Breakdown Bars (Interactive on click) */}
                  <div className="mt-4 space-y-2.5" aria-label="Sample topic mastery scores">
                    <div className="flex items-center justify-between text-xs font-mono text-ink-muted dark:text-chalkboard-muted">
                      <span>Click any topic to inspect rule-based status:</span>
                      <span>Band / Mastery</span>
                    </div>

                    {heroCard.topics.map((topic) => {
                      const isGap = topic.score < 60;
                      const isDeveloping = topic.score >= 60 && topic.score < 80;
                      const isSelected = selectedTopicId === topic.id;

                      return (
                        <button
                          key={topic.id}
                          type="button"
                          onClick={() => setSelectedTopicId(topic.id)}
                          aria-pressed={isSelected}
                          className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-redpen ${
                            isSelected
                              ? 'bg-highlighter-yellowSoft/80 dark:bg-chalkboard-surface border-ink dark:border-chalkboard-borderStrong shadow-sm'
                              : 'bg-paper/60 dark:bg-chalkboard/40 border-ink/15 dark:border-chalkboard-borderSubtle hover:border-ink/40'
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs sm:text-sm font-semibold text-ink dark:text-chalkboard-chalk mb-1.5">
                            <span className="flex items-center gap-1.5">
                              {isGap ? (
                                <AlertCircle className="w-4 h-4 text-redpen shrink-0" aria-hidden="true" />
                              ) : isDeveloping ? (
                                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" aria-hidden="true" />
                              ) : (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
                              )}
                              <span>{topic.name}</span>
                            </span>
                            <span className="flex items-center gap-2 font-mono text-xs">
                              <span
                                className={`px-2 py-0.5 rounded font-bold ${
                                  isGap
                                    ? 'bg-redpen-soft text-redpen-dark dark:bg-red-950/80 dark:text-red-300'
                                    : isDeveloping
                                    ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300'
                                    : 'bg-highlighter-mintSoft text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-300'
                                }`}
                              >
                                {topic.note}
                              </span>
                              <span className="font-bold w-9 text-right">{topic.score}%</span>
                            </span>
                          </div>

                          {/* Pen-stroke style progress bar */}
                          <div className="h-2.5 w-full rounded-full bg-paper-warm dark:bg-chalkboard overflow-hidden border border-ink/15 dark:border-chalkboard-borderSubtle p-0.5">
                            <div
                              style={{ width: `${topic.score}%` }}
                              className={`h-full rounded-full transition-all duration-300 ${
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

                  {/* Sticky-Note Study Next Footer */}
                  <div className="mt-4 p-3.5 rounded-xl bg-highlighter-yellowSoft dark:bg-yellow-950/50 border-2 border-ink/20 dark:border-yellow-500/30 shadow-sticky rotate-[0.5deg]">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
                      <div>
                        <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-redpen-dark dark:text-red-300">
                          ★ Study Next Recommendation ({activeRecommendation.topic})
                        </span>
                        <p className="text-sm font-bold text-ink dark:text-chalkboard-chalk mt-0.5">
                          {activeRecommendation.title}
                        </p>
                        <p className="text-xs text-ink-muted dark:text-chalkboard-muted mt-0.5">
                          {activeRecommendation.matchReason}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenDemo('student')}
                        className="shrink-0 px-3 py-1.5 rounded-lg bg-ink text-paper dark:bg-highlighter-yellow dark:text-ink text-xs font-mono font-bold hover:opacity-90 transition-opacity cursor-pointer"
                      >
                        Explore →
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
