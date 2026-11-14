import React from 'react';
import {
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  HelpCircle,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react';

export const MASTERY_CONFIG = {
  STRENGTH: {
    label: 'Strength',
    icon: CheckCircle2,
    badgeClass: 'bg-highlighter-mintSoft dark:bg-emerald-950/50 text-ink dark:text-highlighter-mint border-ink/25 dark:border-emerald-500/40',
    barClass: 'bg-emerald-500',
    desc: 'High proficiency (≥ 80%)',
  },
  DEVELOPING: {
    label: 'Developing',
    icon: TrendingUp,
    badgeClass: 'bg-highlighter-yellowSoft dark:bg-amber-950/50 text-ink dark:text-highlighter-yellow border-ink/25 dark:border-amber-500/40',
    barClass: 'bg-amber-400',
    desc: 'Moderate understanding (60% – 79%)',
  },
  GAP: {
    label: 'Learning Gap',
    icon: AlertTriangle,
    badgeClass: 'bg-redpen-soft dark:bg-red-950/50 text-redpen-dark dark:text-red-300 border-redpen/40',
    barClass: 'bg-redpen',
    desc: 'Needs reinforcement (< 60%)',
  },
  INSUFFICIENT_DATA: {
    label: 'Insufficient Data',
    icon: HelpCircle,
    badgeClass: 'bg-paper-warm dark:bg-chalkboard-surface text-ink-muted dark:text-chalkboard-muted border-ink/20 dark:border-chalkboard-borderSubtle',
    barClass: 'bg-ink/30 dark:bg-chalkboard-muted/30',
    desc: 'Fewer than 3 questions answered',
  },
};

/**
 * Accessible status pill with icon and text label (never color alone).
 */
export function StatusBadge({ status, size = 'sm' }) {
  const config = MASTERY_CONFIG[status] || MASTERY_CONFIG.INSUFFICIENT_DATA;
  const Icon = config.icon;

  const sizeClasses =
    size === 'md'
      ? 'px-3 py-1 text-xs gap-1.5'
      : size === 'xs'
        ? 'px-2 py-0.5 text-[11px] gap-1'
        : 'px-2.5 py-0.5 text-xs gap-1';

  return (
    <span
      className={`inline-flex items-center rounded-md font-mono font-bold border transition-colors ${config.badgeClass} ${sizeClasses}`}
      title={config.desc}
    >
      <Icon className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
      <span>{config.label}</span>
    </span>
  );
}

/**
 * Trend arrow indicator comparing current mastery with previous attempt.
 */
export function TrendIndicator({ trend }) {
  if (trend === 'UP') {
    return (
      <span
        className="inline-flex items-center gap-1 text-xs font-mono font-bold text-ink-blue dark:text-highlighter-mint"
        title="Mastery improved since last evaluation"
      >
        <ArrowUpRight className="w-4 h-4 text-ink-blue dark:text-highlighter-mint" aria-hidden="true" />
        <span>Improving</span>
      </span>
    );
  }
  if (trend === 'DOWN') {
    return (
      <span
        className="inline-flex items-center gap-1 text-xs font-mono font-bold text-redpen-dark dark:text-red-400"
        title="Mastery declined since last evaluation"
      >
        <ArrowDownRight className="w-4 h-4 text-redpen-dark dark:text-red-400" aria-hidden="true" />
        <span>Declining</span>
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-mono text-ink-muted dark:text-chalkboard-muted"
      title="Mastery unchanged"
    >
      <Minus className="w-3.5 h-3.5 text-ink-muted dark:text-chalkboard-muted" aria-hidden="true" />
      <span>Steady</span>
    </span>
  );
}

/**
 * Visual notebook mastery progress bar with accessible aria attributes and motion safety.
 */
export function MasteryBar({ percent, status, showLabel = true }) {
  const config = MASTERY_CONFIG[status] || MASTERY_CONFIG.INSUFFICIENT_DATA;
  const clampedPercent = Math.min(100, Math.max(0, percent != null ? percent : 0));
  const isInsufficient = status === 'INSUFFICIENT_DATA';

  return (
    <div className="w-full space-y-1">
      {showLabel && (
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-ink-muted dark:text-chalkboard-muted font-medium">Mastery</span>
          <span className="font-bold text-ink dark:text-chalkboard-chalk">
            {isInsufficient ? '—' : `${clampedPercent}%`}
          </span>
        </div>
      )}
      <div
        className="w-full h-2.5 rounded-full bg-paper-warm dark:bg-chalkboard border border-ink/15 dark:border-chalkboard-borderSubtle overflow-hidden p-0.5"
        role="progressbar"
        aria-valuenow={isInsufficient ? 0 : clampedPercent}
        aria-valuemin="0"
        aria-valuemax="100"
        aria-label={`Mastery: ${isInsufficient ? 'Insufficient data' : `${clampedPercent}%`}`}
      >
        <div
          className={`h-full rounded-full transition-all duration-300 motion-reduce:transition-none ${config.barClass}`}
          style={{ width: isInsufficient ? '0%' : `${clampedPercent}%` }}
        />
      </div>
    </div>
  );
}

