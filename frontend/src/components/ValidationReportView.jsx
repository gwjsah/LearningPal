import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  Download,
  HelpCircle,
  FlaskConical,
  BarChart3,
  Sliders,
  Users,
  Target,
  FileSpreadsheet,
} from 'lucide-react';
import { NotebookCard, Button } from './NotebookPrimitives';

/**
 * Shared report view for Validation Lab agreement statistics.
 * Used in both Teacher (/teacher/classes/:id/validation/report) and Admin (/admin/validation) views.
 */
export default function ValidationReportView({
  report,
  loading,
  error,
  source = 'TEACHER',
  onSourceChange,
  includeStale = false,
  onIncludeStaleChange,
  onExport,
  exporting = false,
  title,
  subtitle,
}) {
  if (loading) {
    return (
      <NotebookCard className="p-12 text-center bg-paper-card dark:bg-chalkboard-card border-2 border-ink dark:border-chalkboard-border">
        <div className="inline-flex items-center gap-2 text-ink-muted dark:text-chalkboard-muted">
          <Clock className="w-5 h-5 animate-spin text-redpen dark:text-highlighter-yellow" />
          <span className="font-mono text-sm">Computing validation agreement metrics...</span>
        </div>
      </NotebookCard>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-xl border-2 border-red-500 bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-200 flex items-start gap-3">
        <AlertCircle className="w-6 h-6 flex-shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
        <div className="space-y-1">
          <h3 className="font-bold text-sm">Unable to generate validation report</h3>
          <p className="text-xs">{error}</p>
        </div>
      </div>
    );
  }

  if (!report) return null;

  // Adapt backend ValidationReportDto field names to the names this view renders.
  const rawSample = report.sampleSize || {};
  const rawMetrics = report.metrics || {};
  const rawCm = report.confusionMatrix || {};
  const sampleSize = {
    usablePairs: rawSample.usableStudentTopicPairs ?? 0,
    usableStudents: rawSample.studentsWithUsableLabel ?? 0,
    totalLabelsCount: rawSample.totalLabelsEvaluated ?? 0,
    cannotJudgeExcludedCount: rawSample.excludedCannotJudge ?? 0,
    insufficientDataExcludedCount: rawSample.excludedInsufficientData ?? 0,
    staleExcludedCount: rawSample.excludedStale ?? 0,
  };
  const metrics = {
    ...rawMetrics,
    cohensKappa: rawMetrics.cohenKappa,
    studentTotalUsableCount: rawSample.studentsWithUsableLabel ?? 0,
  };
  const { tp = 0, fp = 0, tn = 0, fn = 0 } = rawCm;
  const confusionMatrix = {
    truePositives: tp,
    falsePositives: fp,
    trueNegatives: tn,
    falseNegatives: fn,
    predictedWeakTotal: tp + fp,
    predictedNotWeakTotal: fn + tn,
    actualWeakTotal: tp + fn,
    actualNotWeakTotal: fp + tn,
  };
  const topicMetrics = (report.perTopic || []).map((t) => ({
    ...t,
    usablePairs: t.usableCount,
    matchesCount: t.matchCount,
  }));
  const thresholdSensitivity = (report.thresholdSensitivity || []).map((r) => ({
    ...r,
    systemWeakCount: r.tp + r.fp,
    systemNotWeakCount: r.fn + r.tn,
    accuracyPercent: r.agreementPercent,
    bestFit: report.bestThreshold != null && r.threshold === report.bestThreshold,
  }));
  const disagreements = (report.disagreements || []).map((d) => ({
    ...d,
    systemMasteryPercent: d.systemMastery,
  }));
  const {
    targetCheck = {},
    simulated = report.isSimulated ?? false,
    pooledClassesCount = null,
    classBreakdowns = [],
  } = report;

  const [showKappaInfo, setShowKappaInfo] = useState(false);

  // Cohen's Kappa qualitative interpretation
  const getKappaInterpretation = (k) => {
    if (k == null) return '—';
    if (k < 0) return 'Poor (worse than chance)';
    if (k <= 0.20) return 'Slight agreement';
    if (k <= 0.40) return 'Fair agreement';
    if (k <= 0.60) return 'Moderate agreement';
    if (k <= 0.80) return 'Substantial agreement';
    return 'Almost perfect agreement';
  };

  return (
    <div className="space-y-8">
      {/* Header & Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-ink/10 dark:border-chalkboard-borderSubtle">
        <div>
          <h2 className="text-2xl font-extrabold text-ink dark:text-chalkboard-chalk flex items-center gap-2.5">
            <FlaskConical className="w-6 h-6 text-redpen dark:text-highlighter-yellow" />
            <span>{title || 'Validation Lab Agreement Report'}</span>
          </h2>
          <p className="text-xs sm:text-sm text-ink-muted dark:text-chalkboard-muted mt-0.5">
            {subtitle || 'Measuring agreement between blind teacher judgments and automated gap detection.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Source Toggle */}
          <div className="inline-flex rounded-xl p-1 bg-paper-warm dark:bg-chalkboard-surface border border-ink/20 dark:border-chalkboard-border">
            <button
              type="button"
              onClick={() => onSourceChange?.('TEACHER')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                source === 'TEACHER'
                  ? 'bg-paper-card dark:bg-chalkboard-card text-ink dark:text-chalkboard-chalk shadow-xs border border-ink/15 dark:border-chalkboard-border'
                  : 'text-ink-muted dark:text-chalkboard-muted hover:text-ink dark:hover:text-chalkboard-chalk'
              }`}
            >
              Teacher Labels
            </button>
            <button
              type="button"
              onClick={() => onSourceChange?.('SYNTHETIC')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                source === 'SYNTHETIC'
                  ? 'bg-paper-card dark:bg-chalkboard-card text-ink dark:text-chalkboard-chalk shadow-xs border border-ink/15 dark:border-chalkboard-border'
                  : 'text-ink-muted dark:text-chalkboard-muted hover:text-ink dark:hover:text-chalkboard-chalk'
              }`}
            >
              Simulated Benchmark
            </button>
          </div>

          {/* Stale Toggle */}
          <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-paper-card dark:bg-chalkboard-card border border-ink/20 dark:border-chalkboard-border cursor-pointer text-xs font-medium text-ink dark:text-chalkboard-chalk">
            <input
              type="checkbox"
              checked={includeStale}
              onChange={(e) => onIncludeStaleChange?.(e.target.checked)}
              className="rounded border-ink/30 text-redpen focus:ring-redpen"
            />
            <span>Include stale ({sampleSize.staleExcludedCount || 0})</span>
          </label>

          {/* Export CSV button (if handler provided) */}
          {onExport && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onExport}
              disabled={exporting || sampleSize.usablePairs === 0}
              className="text-xs gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{exporting ? 'Exporting...' : 'Export CSV'}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Simulated Banner if Synthetic */}
      {simulated && (
        <div
          role="alert"
          className="p-4 rounded-xl border-2 border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
          <div className="space-y-1">
            <p className="text-xs font-mono uppercase tracking-wider font-extrabold text-amber-800 dark:text-amber-300">
              Simulated Labels Benchmark
            </p>
            <p className="text-xs leading-relaxed">
              These metrics reflect synthetic simulation data generated for validation pipeline testing and calibration.
              They must not be presented or interpreted as empirical teacher validation.
            </p>
          </div>
        </div>
      )}

      {/* SECTION 1: TARGET CHECK BANNER (DECISIONS 5, 6, 7) */}
      <NotebookCard
        ruled
        marginLine
        lifted
        className={`p-6 bg-paper-card dark:bg-chalkboard-card border-2 ${
          targetCheck.bannerType === 'MET'
            ? 'border-emerald-600 dark:border-emerald-500'
            : targetCheck.bannerType === 'NOT_MET'
            ? 'border-redpen'
            : targetCheck.bannerType === 'SMALL_CLASS_COMPLETE'
            ? 'border-blue-600 dark:border-blue-500'
            : targetCheck.bannerType === 'NO_ELIGIBLE_STUDENTS'
            ? 'border-ink/20 dark:border-chalkboard-border'
            : 'border-amber-500 dark:border-amber-400'
        } space-y-4`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-ink-muted dark:text-chalkboard-muted">
                Validation Objective Target
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-extrabold uppercase border ${
                  targetCheck.bannerType === 'MET'
                    ? 'bg-highlighter-mint text-ink border-ink/20'
                    : targetCheck.bannerType === 'NOT_MET'
                    ? 'bg-redpen-soft text-redpen-dark border-redpen/30'
                    : targetCheck.bannerType === 'SMALL_CLASS_COMPLETE'
                    ? 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/60 dark:text-blue-200'
                    : targetCheck.bannerType === 'NO_ELIGIBLE_STUDENTS'
                    ? 'bg-paper-warm text-ink-muted border-ink/20 dark:bg-chalkboard-surface dark:text-chalkboard-muted'
                    : 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-200'
                }`}
              >
                {targetCheck.bannerType === 'MET' && <CheckCircle2 className="w-3.5 h-3.5" />}
                {targetCheck.bannerType === 'NOT_MET' && <AlertCircle className="w-3.5 h-3.5" />}
                {targetCheck.bannerType === 'SMALL_CLASS_COMPLETE' && <CheckCircle2 className="w-3.5 h-3.5" />}
                {targetCheck.bannerType === 'NO_ELIGIBLE_STUDENTS' && <Clock className="w-3.5 h-3.5" />}
                {targetCheck.bannerType === 'PRELIMINARY' && <Clock className="w-3.5 h-3.5" />}
                <span>
                  {targetCheck.bannerType === 'MET'
                    ? `Target Met (${metrics.accuracyPercent}% vs 85%)`
                    : targetCheck.bannerType === 'NOT_MET'
                    ? `Target Not Met (${metrics.accuracyPercent}% vs 85%)`
                    : targetCheck.bannerType === 'SMALL_CLASS_COMPLETE'
                    ? 'Complete (Small Class)'
                    : targetCheck.bannerType === 'NO_ELIGIBLE_STUDENTS'
                    ? 'No Eligible Students'
                    : `Preliminary (${targetCheck.studentsEvaluated || 0} of 30 Labeled)`}
                </span>
              </span>
            </div>

            <p className="text-base sm:text-lg font-bold text-ink dark:text-chalkboard-chalk leading-snug">
              {targetCheck.sentence}
            </p>

            {targetCheck.warningMessage && (
              <p className="text-xs text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 p-2.5 rounded-lg border border-amber-200 dark:border-amber-800/40">
                ⚠️ {targetCheck.warningMessage}
              </p>
            )}
          </div>

          {/* Quick Dual Meters: Agreement & Sample */}
          <div className="flex items-center gap-4 bg-paper-warm dark:bg-chalkboard-surface p-4 rounded-xl border border-ink/15 dark:border-chalkboard-border">
            <div className="text-center px-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-ink-muted dark:text-chalkboard-muted block">
                Accuracy (vs 85%)
              </span>
              <span className="text-2xl font-extrabold font-mono text-ink dark:text-chalkboard-chalk">
                {metrics.accuracyPercent != null ? `${metrics.accuracyPercent}%` : '—'}
              </span>
              <span className="text-[10px] font-mono text-ink-muted dark:text-chalkboard-muted block">
                Target: ≥ 85%
              </span>
            </div>

            <div className="w-px h-10 bg-ink/15 dark:bg-chalkboard-borderSubtle" />

            <div className="text-center px-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-ink-muted dark:text-chalkboard-muted block">
                Students Evaluated
              </span>
              <span className="text-2xl font-extrabold font-mono text-ink dark:text-chalkboard-chalk">
                {targetCheck.studentsEvaluated || 0}
              </span>
              <span className="text-[10px] font-mono text-ink-muted dark:text-chalkboard-muted block">
                Gate: 30 students
              </span>
            </div>
          </div>
        </div>
      </NotebookCard>

      {/* SECTION 2: STATISTICAL METRICS GRID */}
      <div className="space-y-3">
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-ink-muted dark:text-chalkboard-muted">
          Agreement & Classification Statistics
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Accuracy */}
          <div className="p-4 rounded-xl border-2 border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-card dark:bg-chalkboard-card shadow-notebook-sm">
            <span className="text-[10px] font-mono font-bold uppercase text-ink-muted dark:text-chalkboard-muted block">
              Agreement (Accuracy)
            </span>
            <span className="text-2xl font-extrabold text-ink dark:text-chalkboard-chalk font-mono mt-1 block">
              {metrics.accuracyPercent != null ? `${metrics.accuracyPercent}%` : '—'}
            </span>
            <span className="text-[10px] text-ink-muted dark:text-chalkboard-muted block mt-0.5">
              (TP + TN) / Usable
            </span>
          </div>

          {/* Precision */}
          <div className="p-4 rounded-xl border-2 border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-card dark:bg-chalkboard-card shadow-notebook-sm">
            <span className="text-[10px] font-mono font-bold uppercase text-ink-muted dark:text-chalkboard-muted block">
              Precision (Weak)
            </span>
            <span className="text-2xl font-extrabold text-ink dark:text-chalkboard-chalk font-mono mt-1 block">
              {metrics.precisionPercent != null ? `${metrics.precisionPercent}%` : '—'}
            </span>
            <span className="text-[10px] text-ink-muted dark:text-chalkboard-muted block mt-0.5">
              TP / (TP + FP)
            </span>
          </div>

          {/* Recall */}
          <div className="p-4 rounded-xl border-2 border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-card dark:bg-chalkboard-card shadow-notebook-sm">
            <span className="text-[10px] font-mono font-bold uppercase text-ink-muted dark:text-chalkboard-muted block">
              Recall (Weak)
            </span>
            <span className="text-2xl font-extrabold text-ink dark:text-chalkboard-chalk font-mono mt-1 block">
              {metrics.recallPercent != null ? `${metrics.recallPercent}%` : '—'}
            </span>
            <span className="text-[10px] text-ink-muted dark:text-chalkboard-muted block mt-0.5">
              TP / (TP + FN)
            </span>
          </div>

          {/* F1 */}
          <div className="p-4 rounded-xl border-2 border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-card dark:bg-chalkboard-card shadow-notebook-sm">
            <span className="text-[10px] font-mono font-bold uppercase text-ink-muted dark:text-chalkboard-muted block">
              F1 Score (Weak)
            </span>
            <span className="text-2xl font-extrabold text-ink dark:text-chalkboard-chalk font-mono mt-1 block">
              {metrics.f1Percent != null ? `${metrics.f1Percent}%` : '—'}
            </span>
            <span className="text-[10px] text-ink-muted dark:text-chalkboard-muted block mt-0.5">
              Harmonic mean
            </span>
          </div>

          {/* Cohen's Kappa */}
          <div className="p-4 rounded-xl border-2 border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-card dark:bg-chalkboard-card shadow-notebook-sm relative">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase text-ink-muted dark:text-chalkboard-muted block">
                Cohen&apos;s Kappa (κ)
              </span>
              <button
                type="button"
                onClick={() => setShowKappaInfo(!showKappaInfo)}
                className="text-ink-muted hover:text-ink dark:hover:text-chalkboard-chalk"
                title="What is Cohen's Kappa?"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            </div>
            <span className="text-2xl font-extrabold text-ink-blue dark:text-highlighter-mint font-mono mt-1 block">
              {metrics.cohensKappa != null ? metrics.cohensKappa.toFixed(3) : '—'}
            </span>
            <span className="text-[10px] text-ink-muted dark:text-chalkboard-muted block mt-0.5 truncate" title={getKappaInterpretation(metrics.cohensKappa)}>
              {getKappaInterpretation(metrics.cohensKappa)}
            </span>
            {showKappaInfo && (
              <div className="absolute z-20 bottom-full left-0 mb-2 w-64 p-3 bg-paper-card dark:bg-chalkboard-card border-2 border-ink dark:border-chalkboard-border rounded-xl shadow-notebook-lg text-[11px] text-ink dark:text-chalkboard-chalk space-y-1">
                <p className="font-bold">What is Cohen&apos;s Kappa?</p>
                <p className="text-ink-muted dark:text-chalkboard-muted">
                  Cohen&apos;s kappa measures agreement between two raters (teacher and system) after accounting for the agreement that could happen purely by chance. A score above 0.60 indicates strong agreement beyond random luck.
                </p>
              </div>
            )}
          </div>

          {/* Student Exact Match */}
          <div className="p-4 rounded-xl border-2 border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-card dark:bg-chalkboard-card shadow-notebook-sm">
            <span className="text-[10px] font-mono font-bold uppercase text-ink-muted dark:text-chalkboard-muted block">
              Student Exact Match
            </span>
            <span className="text-2xl font-extrabold text-ink dark:text-chalkboard-chalk font-mono mt-1 block">
              {metrics.studentExactMatchPercent != null ? `${metrics.studentExactMatchPercent}%` : '—'}
            </span>
            <span className="text-[10px] text-ink-muted dark:text-chalkboard-muted block mt-0.5">
              {metrics.studentExactMatchCount || 0} / {metrics.studentTotalUsableCount || 0} students
            </span>
          </div>
        </div>

        {/* PLAIN-LANGUAGE METRIC DEFINITIONS (DECISION 10) */}
        <div className="p-4 rounded-xl border border-ink/15 dark:border-chalkboard-border bg-paper-warm/60 dark:bg-chalkboard-surface/60 space-y-2">
          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-ink-muted dark:text-chalkboard-muted flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-ink-muted dark:text-chalkboard-muted" />
            <span>Understanding the Validation Metrics in Plain Language</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="font-bold text-ink dark:text-chalkboard-chalk">Agreement (Accuracy):</span>
              <p className="text-ink-muted dark:text-chalkboard-muted mt-0.5">
                How often the system&apos;s gap assessment matched the teacher&apos;s judgment.
              </p>
            </div>
            <div>
              <span className="font-bold text-ink dark:text-chalkboard-chalk">Precision (Weak):</span>
              <p className="text-ink-muted dark:text-chalkboard-muted mt-0.5">
                When the system flagged a gap, how often the teacher confirmed it was a real gap.
              </p>
            </div>
            <div>
              <span className="font-bold text-ink dark:text-chalkboard-chalk">Recall (Weak):</span>
              <p className="text-ink-muted dark:text-chalkboard-muted mt-0.5">
                Of all the learning gaps identified by the teacher, how many the system caught.
              </p>
            </div>
            <div>
              <span className="font-bold text-ink dark:text-chalkboard-chalk">Cohen&apos;s Kappa:</span>
              <p className="text-ink-muted dark:text-chalkboard-muted mt-0.5">
                Agreement beyond chance. Scores &gt; 0.60 indicate strong agreement not explained by luck.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: SAMPLE SIZE & EXCLUSION COUNTS */}
      <div className="p-4 rounded-xl border-2 border-ink/15 dark:border-chalkboard-border bg-paper-warm dark:bg-chalkboard-surface space-y-2">
        <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-ink-muted dark:text-chalkboard-muted flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" />
          <span>Sample Size & Dataset Exclusions Accounting</span>
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs font-mono">
          <div>
            <span className="text-ink-muted dark:text-chalkboard-muted block text-[10px]">Total Pairs Labeled</span>
            <span className="text-sm font-bold text-ink dark:text-chalkboard-chalk">{sampleSize.totalLabelsCount || 0}</span>
          </div>
          <div>
            <span className="text-ink-muted dark:text-chalkboard-muted block text-[10px]">Usable Student-Topic Pairs</span>
            <span className="text-sm font-bold text-ink dark:text-chalkboard-chalk">{sampleSize.usablePairs || 0}</span>
          </div>
          <div>
            <span className="text-ink-muted dark:text-chalkboard-muted block text-[10px]">Usable Students</span>
            <span className="text-sm font-bold text-ink dark:text-chalkboard-chalk">{sampleSize.usableStudents || 0}</span>
          </div>
          <div>
            <span className="text-ink-muted dark:text-chalkboard-muted block text-[10px]">Excluded: Cannot Judge</span>
            <span className="text-sm font-bold text-amber-700 dark:text-amber-400">{sampleSize.cannotJudgeExcludedCount || 0}</span>
          </div>
          <div>
            <span className="text-ink-muted dark:text-chalkboard-muted block text-[10px]">Excluded: Insufficient Data</span>
            <span className="text-sm font-bold text-amber-700 dark:text-amber-400">{sampleSize.insufficientDataExcludedCount || 0}</span>
          </div>
          <div>
            <span className="text-ink-muted dark:text-chalkboard-muted block text-[10px]">Excluded: Stale Labels</span>
            <span className="text-sm font-bold text-amber-700 dark:text-amber-400">{sampleSize.staleExcludedCount || 0}</span>
          </div>
        </div>
      </div>

      {/* SECTION 4: CONFUSION MATRIX & PER-TOPIC ACCURACY */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Confusion Matrix Table */}
        <NotebookCard
          borderStyle="sketch"
          className="p-6 bg-paper-card dark:bg-chalkboard-card border-2 border-ink dark:border-chalkboard-border space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-ink dark:text-chalkboard-chalk flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-redpen dark:text-highlighter-yellow" />
              <span>Confusion Matrix (2 × 2)</span>
            </h3>
            <span className="text-[10px] font-mono text-ink-muted dark:text-chalkboard-muted">
              Usable pairs: {sampleSize.usablePairs || 0}
            </span>
          </div>

          <p className="text-xs text-ink-muted dark:text-chalkboard-muted">
            Rows show automated system classifications. Columns show blind teacher judgments.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono border-collapse border border-ink/20 dark:border-chalkboard-border">
              <thead>
                <tr className="bg-paper-warm dark:bg-chalkboard-surface text-ink dark:text-chalkboard-chalk">
                  <th className="p-2 border border-ink/20 dark:border-chalkboard-border text-left"></th>
                  <th className="p-2 border border-ink/20 dark:border-chalkboard-border text-center">
                    Teacher WEAK
                  </th>
                  <th className="p-2 border border-ink/20 dark:border-chalkboard-border text-center">
                    Teacher NOT WEAK
                  </th>
                  <th className="p-2 border border-ink/20 dark:border-chalkboard-border text-center font-bold bg-paper/60 dark:bg-chalkboard/40">
                    System Total
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th className="p-2 border border-ink/20 dark:border-chalkboard-border text-left font-bold bg-paper-warm dark:bg-chalkboard-surface">
                    System WEAK (GAP)
                  </th>
                  <td className="p-2 border border-ink/20 dark:border-chalkboard-border text-center bg-highlighter-mint/20 text-ink dark:text-chalkboard-chalk font-bold">
                    <div>{confusionMatrix.truePositives || 0}</div>
                    <span className="text-[9px] text-ink-muted dark:text-chalkboard-muted">True Positive</span>
                  </td>
                  <td className="p-2 border border-ink/20 dark:border-chalkboard-border text-center bg-redpen-soft/20 text-ink dark:text-chalkboard-chalk">
                    <div>{confusionMatrix.falsePositives || 0}</div>
                    <span className="text-[9px] text-ink-muted dark:text-chalkboard-muted">False Positive</span>
                  </td>
                  <td className="p-2 border border-ink/20 dark:border-chalkboard-border text-center font-bold bg-paper/60 dark:bg-chalkboard/40">
                    {confusionMatrix.predictedWeakTotal || 0}
                  </td>
                </tr>
                <tr>
                  <th className="p-2 border border-ink/20 dark:border-chalkboard-border text-left font-bold bg-paper-warm dark:bg-chalkboard-surface">
                    System NOT WEAK (DEV/STR)
                  </th>
                  <td className="p-2 border border-ink/20 dark:border-chalkboard-border text-center bg-redpen-soft/20 text-ink dark:text-chalkboard-chalk">
                    <div>{confusionMatrix.falseNegatives || 0}</div>
                    <span className="text-[9px] text-ink-muted dark:text-chalkboard-muted">False Negative</span>
                  </td>
                  <td className="p-2 border border-ink/20 dark:border-chalkboard-border text-center bg-highlighter-mint/20 text-ink dark:text-chalkboard-chalk font-bold">
                    <div>{confusionMatrix.trueNegatives || 0}</div>
                    <span className="text-[9px] text-ink-muted dark:text-chalkboard-muted">True Negative</span>
                  </td>
                  <td className="p-2 border border-ink/20 dark:border-chalkboard-border text-center font-bold bg-paper/60 dark:bg-chalkboard/40">
                    {confusionMatrix.predictedNotWeakTotal || 0}
                  </td>
                </tr>
                <tr className="bg-paper/60 dark:bg-chalkboard/40 font-bold">
                  <th className="p-2 border border-ink/20 dark:border-chalkboard-border text-left">
                    Teacher Total
                  </th>
                  <td className="p-2 border border-ink/20 dark:border-chalkboard-border text-center">
                    {confusionMatrix.actualWeakTotal || 0}
                  </td>
                  <td className="p-2 border border-ink/20 dark:border-chalkboard-border text-center">
                    {confusionMatrix.actualNotWeakTotal || 0}
                  </td>
                  <td className="p-2 border border-ink/20 dark:border-chalkboard-border text-center text-redpen dark:text-highlighter-yellow">
                    {sampleSize.usablePairs || 0}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </NotebookCard>

        {/* Per-Topic Agreement */}
        <NotebookCard
          borderStyle="sketch"
          className="p-6 bg-paper-card dark:bg-chalkboard-card border-2 border-ink dark:border-chalkboard-border space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-ink dark:text-chalkboard-chalk flex items-center gap-2">
              <Target className="w-4 h-4 text-redpen dark:text-highlighter-yellow" />
              <span>Per-Topic Agreement Breakdown</span>
            </h3>
            <span className="text-[10px] font-mono text-ink-muted dark:text-chalkboard-muted">
              {topicMetrics.length} topics
            </span>
          </div>

          <p className="text-xs text-ink-muted dark:text-chalkboard-muted">
            Agreement rates per curricular topic. High agreement indicates robust topic detection.
          </p>

          {topicMetrics.length === 0 ? (
            <p className="text-xs text-ink-muted dark:text-chalkboard-muted italic py-4">
              No usable topic validations recorded yet.
            </p>
          ) : (
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {topicMetrics.map((topic) => (
                <div key={topic.topicId} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-ink dark:text-chalkboard-chalk truncate max-w-[200px]" title={topic.topicName}>
                      {topic.topicName}
                    </span>
                    <span className="font-mono font-bold text-ink dark:text-chalkboard-chalk">
                      {topic.accuracyPercent != null ? `${topic.accuracyPercent}%` : '—'}
                      <span className="text-[10px] font-normal text-ink-muted dark:text-chalkboard-muted ml-1">
                        ({topic.matchesCount}/{topic.usablePairs})
                      </span>
                    </span>
                  </div>
                  <div className="w-full bg-ink/10 dark:bg-chalkboard-borderSubtle h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        (topic.accuracyPercent ?? 0) >= 85
                          ? 'bg-emerald-600 dark:bg-emerald-400'
                          : (topic.accuracyPercent ?? 0) >= 70
                          ? 'bg-amber-500'
                          : 'bg-redpen'
                      }`}
                      style={{ width: `${Math.min(100, topic.accuracyPercent ?? 0)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Accessible Table for Screen Readers */}
          <div className="sr-only">
            <table>
              <caption>Per-Topic Agreement Summary</caption>
              <thead>
                <tr>
                  <th>Topic</th>
                  <th>Usable Pairs</th>
                  <th>Matches</th>
                  <th>Accuracy</th>
                </tr>
              </thead>
              <tbody>
                {topicMetrics.map((t) => (
                  <tr key={t.topicId}>
                    <td>{t.topicName}</td>
                    <td>{t.usablePairs}</td>
                    <td>{t.matchesCount}</td>
                    <td>{t.accuracyPercent}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </NotebookCard>
      </div>

      {/* SECTION 5: THRESHOLD SENSITIVITY ANALYSIS */}
      <NotebookCard
        borderStyle="sketch"
        className="p-6 bg-paper-card dark:bg-chalkboard-card border-2 border-ink dark:border-chalkboard-border space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="space-y-0.5">
            <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-ink dark:text-chalkboard-chalk flex items-center gap-2">
              <Sliders className="w-4 h-4 text-redpen dark:text-highlighter-yellow" />
              <span>Threshold Sensitivity Analysis</span>
            </h3>
            <p className="text-xs text-ink-muted dark:text-chalkboard-muted">
              Evaluates how system agreement and recall vary across simulated gap thresholds (default: 60%). No production threshold is altered.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono border-collapse border border-ink/20 dark:border-chalkboard-border">
            <thead>
              <tr className="bg-paper-warm dark:bg-chalkboard-surface text-ink dark:text-chalkboard-chalk">
                <th className="p-2 border border-ink/20 dark:border-chalkboard-border text-left">Gap Threshold</th>
                <th className="p-2 border border-ink/20 dark:border-chalkboard-border text-center">System Weak</th>
                <th className="p-2 border border-ink/20 dark:border-chalkboard-border text-center">System Not Weak</th>
                <th className="p-2 border border-ink/20 dark:border-chalkboard-border text-center">Agreement %</th>
                <th className="p-2 border border-ink/20 dark:border-chalkboard-border text-center">Recall %</th>
                <th className="p-2 border border-ink/20 dark:border-chalkboard-border text-center">Calibration Fit</th>
              </tr>
            </thead>
            <tbody>
              {thresholdSensitivity.map((row) => (
                <tr
                  key={row.threshold}
                  className={`border-b border-ink/10 dark:border-chalkboard-borderSubtle transition-colors ${
                    row.bestFit
                      ? 'bg-highlighter-mint/20 font-bold'
                      : 'hover:bg-paper-warm/50 dark:hover:bg-chalkboard-surface/50'
                  }`}
                >
                  <td className="p-2.5 border border-ink/20 dark:border-chalkboard-border text-left">
                    <span className="font-extrabold">{row.threshold}%</span>
                    {row.threshold === 60 && (
                      <span className="ml-1.5 text-[9px] uppercase px-1.5 py-0.5 rounded bg-ink/10 dark:bg-chalkboard-border font-normal text-ink-muted dark:text-chalkboard-muted">
                        Current
                      </span>
                    )}
                  </td>
                  <td className="p-2.5 border border-ink/20 dark:border-chalkboard-border text-center">{row.systemWeakCount}</td>
                  <td className="p-2.5 border border-ink/20 dark:border-chalkboard-border text-center">{row.systemNotWeakCount}</td>
                  <td className="p-2.5 border border-ink/20 dark:border-chalkboard-border text-center font-bold">
                    {row.accuracyPercent != null ? `${row.accuracyPercent}%` : '—'}
                  </td>
                  <td className="p-2.5 border border-ink/20 dark:border-chalkboard-border text-center">
                    {row.recallPercent != null ? `${row.recallPercent}%` : '—'}
                  </td>
                  <td className="p-2.5 border border-ink/20 dark:border-chalkboard-border text-center">
                    {row.bestFit ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold uppercase bg-emerald-100 text-emerald-900 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300">
                        <CheckCircle2 className="w-3 h-3" />
                        Best Agreement
                      </span>
                    ) : (
                      <span className="text-[10px] text-ink-muted dark:text-chalkboard-muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </NotebookCard>

      {/* SECTION 6: DISAGREEMENTS AUDIT TABLE */}
      <NotebookCard
        borderStyle="sketch"
        className="p-6 bg-paper-card dark:bg-chalkboard-card border-2 border-ink dark:border-chalkboard-border space-y-4"
      >
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-ink dark:text-chalkboard-chalk flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Disagreements Audit Log</span>
            </h3>
            <p className="text-xs text-ink-muted dark:text-chalkboard-muted">
              Cases where teacher judgment diverged from system classification (pseudonymized student IDs).
            </p>
          </div>
          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-paper-warm dark:bg-chalkboard-surface border border-ink/20 text-ink-muted dark:text-chalkboard-muted">
            {disagreements.length} divergence(s)
          </span>
        </div>

        {disagreements.length === 0 ? (
          <div className="p-6 text-center rounded-xl bg-paper-warm dark:bg-chalkboard-surface border border-ink/15 text-xs text-ink-muted dark:text-chalkboard-muted">
            <CheckCircle2 className="w-5 h-5 mx-auto text-emerald-600 dark:text-emerald-400 mb-1" />
            <span>Zero disagreements found! All usable teacher validations match the system classification.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono border-collapse border border-ink/20 dark:border-chalkboard-border">
              <thead>
                <tr className="bg-paper-warm dark:bg-chalkboard-surface text-ink dark:text-chalkboard-chalk">
                  <th className="p-2 border border-ink/20 dark:border-chalkboard-border text-left">Student ID</th>
                  <th className="p-2 border border-ink/20 dark:border-chalkboard-border text-left">Curricular Topic</th>
                  <th className="p-2 border border-ink/20 dark:border-chalkboard-border text-center">Teacher Label</th>
                  <th className="p-2 border border-ink/20 dark:border-chalkboard-border text-center">System Status</th>
                  <th className="p-2 border border-ink/20 dark:border-chalkboard-border text-center">System Mastery</th>
                </tr>
              </thead>
              <tbody>
                {disagreements.map((d, idx) => (
                  <tr
                    key={`${d.studentCode}-${d.topicId || idx}`}
                    className="border-b border-ink/10 dark:border-chalkboard-borderSubtle hover:bg-paper-warm/40 dark:hover:bg-chalkboard-surface/40"
                  >
                    <td className="p-2.5 border border-ink/20 dark:border-chalkboard-border text-left font-bold text-ink-blue dark:text-highlighter-mint">
                      {d.studentCode}
                    </td>
                    <td className="p-2.5 border border-ink/20 dark:border-chalkboard-border text-left text-ink dark:text-chalkboard-chalk">
                      {d.topicName}
                    </td>
                    <td className="p-2.5 border border-ink/20 dark:border-chalkboard-border text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          d.teacherLabel === 'WEAK'
                            ? 'bg-redpen-soft text-redpen-dark'
                            : 'bg-emerald-100 text-emerald-900'
                        }`}
                      >
                        {d.teacherLabel}
                      </span>
                    </td>
                    <td className="p-2.5 border border-ink/20 dark:border-chalkboard-border text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-ink/10 dark:bg-chalkboard-border text-ink dark:text-chalkboard-chalk">
                        {d.systemStatus}
                      </span>
                    </td>
                    <td className="p-2.5 border border-ink/20 dark:border-chalkboard-border text-center font-bold">
                      {d.systemMasteryPercent != null ? `${d.systemMasteryPercent}%` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </NotebookCard>

      {/* SECTION 7: ADMIN PER-CLASS BREAKDOWN TABLE (DECISION 9) */}
      {classBreakdowns && classBreakdowns.length > 0 && (
        <NotebookCard
          borderStyle="sketch"
          className="p-6 bg-paper-card dark:bg-chalkboard-card border-2 border-ink dark:border-chalkboard-border space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="space-y-0.5">
              <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-ink dark:text-chalkboard-chalk flex items-center gap-2">
                <Users className="w-4 h-4 text-redpen dark:text-highlighter-yellow" />
                <span>Classroom Validation Breakdown</span>
              </h3>
              <p className="text-xs text-ink-muted dark:text-chalkboard-muted">
                Per-class sample progress and empirical agreement across sections in your institution.
              </p>
            </div>
            {pooledClassesCount != null && (
              <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-paper-warm dark:bg-chalkboard-surface border border-ink/20 text-ink dark:text-chalkboard-chalk self-start sm:self-auto">
                Pooled across {pooledClassesCount} classes
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono border-collapse border border-ink/20 dark:border-chalkboard-border">
              <thead>
                <tr className="bg-paper-warm dark:bg-chalkboard-surface text-ink dark:text-chalkboard-chalk text-left">
                  <th className="p-2 border border-ink/20 dark:border-chalkboard-border">Class Name</th>
                  <th className="p-2 border border-ink/20 dark:border-chalkboard-border">Teacher</th>
                  <th className="p-2 border border-ink/20 dark:border-chalkboard-border text-center">Labeled / Eligible</th>
                  <th className="p-2 border border-ink/20 dark:border-chalkboard-border text-center">Status</th>
                  <th className="p-2 border border-ink/20 dark:border-chalkboard-border text-center">Agreement %</th>
                  <th className="p-2 border border-ink/20 dark:border-chalkboard-border text-center">Target Status</th>
                </tr>
              </thead>
              <tbody>
                {classBreakdowns.map((cb) => (
                  <tr
                    key={cb.classId}
                    className="border-b border-ink/10 dark:border-chalkboard-borderSubtle hover:bg-paper-warm/40 dark:hover:bg-chalkboard-surface/40"
                  >
                    <td className="p-2.5 border border-ink/20 dark:border-chalkboard-border font-bold text-ink dark:text-chalkboard-chalk">
                      {cb.className}
                    </td>
                    <td className="p-2.5 border border-ink/20 dark:border-chalkboard-border text-ink-muted dark:text-chalkboard-muted">
                      {cb.teacherName || '—'}
                    </td>
                    <td className="p-2.5 border border-ink/20 dark:border-chalkboard-border text-center font-bold">
                      {cb.studentsLabeled} / {cb.totalStudents}
                    </td>
                    <td className="p-2.5 border border-ink/20 dark:border-chalkboard-border text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        cb.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300' :
                        cb.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-900 border border-blue-300 dark:bg-blue-950/60 dark:text-blue-300' :
                        'bg-paper-warm dark:bg-chalkboard-surface text-ink-muted dark:text-chalkboard-muted border border-ink/15'
                      }`}>
                        {cb.status}
                      </span>
                    </td>
                    <td className="p-2.5 border border-ink/20 dark:border-chalkboard-border text-center font-bold">
                      {cb.agreementPercent != null ? `${cb.agreementPercent}%` : '—'}
                    </td>
                    <td className="p-2.5 border border-ink/20 dark:border-chalkboard-border text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        cb.targetStatus === 'MET' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300' :
                        cb.targetStatus === 'NOT_MET' ? 'bg-redpen-soft text-redpen-dark border border-redpen/30' :
                        cb.targetStatus === 'SMALL_CLASS_COMPLETE' ? 'bg-blue-100 text-blue-900 border border-blue-300 dark:bg-blue-950/60 dark:text-blue-300' :
                        cb.targetStatus === 'NO_ELIGIBLE_STUDENTS' ? 'bg-paper-warm dark:bg-chalkboard-surface text-ink-muted dark:text-chalkboard-muted border border-ink/15' :
                        'bg-amber-100/80 text-amber-900 border border-amber-300 dark:bg-amber-950/50 dark:text-amber-300'
                      }`}>
                        {cb.targetStatus === 'MET' ? 'Target Met (≥85%)' :
                         cb.targetStatus === 'NOT_MET' ? 'Target Not Met (<85%)' :
                         cb.targetStatus === 'SMALL_CLASS_COMPLETE' ? 'Small Class Complete' :
                         cb.targetStatus === 'NO_ELIGIBLE_STUDENTS' ? 'No Eligible Students' :
                         'Preliminary'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </NotebookCard>
      )}
    </div>
  );
}

