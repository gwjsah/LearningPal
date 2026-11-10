import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  Cell,
  CartesianGrid,
} from 'recharts';
import {
  Sparkles,
  FlaskConical,
  ArrowRight,
  HelpCircle,
  CheckCircle2,
  Clock,
  BarChart3,
} from 'lucide-react';
import { NotebookCard, Button } from '../../components/NotebookPrimitives';

/**
 * Custom Tooltip for Recharts topic mastery bar chart.
 */
function TopicChartTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;

  return (
    <div className="p-3 bg-paper-card dark:bg-chalkboard-card border-2 border-ink dark:border-chalkboard-border rounded-xl shadow-notebook-sm text-xs font-mono space-y-2 max-w-xs">
      <div className="font-bold font-sans text-sm text-ink dark:text-chalkboard-chalk border-b border-ink/10 dark:border-chalkboard-borderSubtle pb-1">
        {data.topicName}
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-ink-muted dark:text-chalkboard-muted">Avg Mastery:</span>
        <span className="font-bold text-ink dark:text-chalkboard-chalk">{data.displayMastery}</span>
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-ink-muted dark:text-chalkboard-muted">Status Band:</span>
        <span
          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
            data.status === 'STRENGTH'
              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
              : data.status === 'DEVELOPING'
              ? 'bg-amber-100 text-amber-900 border border-amber-300'
              : data.status === 'GAP'
              ? 'bg-redpen-soft text-redpen-dark border border-redpen/40'
              : 'bg-paper-warm text-ink-muted border border-ink/20'
          }`}
        >
          {data.statusLabel}
        </span>
      </div>
      <div className="pt-1.5 border-t border-ink/10 dark:border-chalkboard-borderSubtle space-y-1 text-[11px]">
        <div className="flex justify-between text-emerald-700 dark:text-emerald-400">
          <span>Strength (≥ 80%):</span>
          <strong>{data.strengthCount}</strong>
        </div>
        <div className="flex justify-between text-amber-700 dark:text-amber-400">
          <span>Developing (60–79%):</span>
          <strong>{data.developingCount}</strong>
        </div>
        <div className="flex justify-between text-redpen dark:text-red-400">
          <span>Gap (&lt; 60%):</span>
          <strong>{data.gapCount}</strong>
        </div>
        {data.noDataCount > 0 && (
          <div className="flex justify-between text-ink-muted dark:text-chalkboard-muted">
            <span>Insufficient / No Data:</span>
            <strong>{data.noDataCount}</strong>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ClassOverviewTab({
  classId,
  classDetail,
  overview,
  roster = [],
  classInterventions = [],
  onSelectTab,
}) {
  // Compute KPI 2: Students needing attention (gapCount >= 2)
  const studentsNeedingAttentionCount = useMemo(() => {
    if (overview?.totals?.studentsNeedingAttention != null) {
      return overview.totals.studentsNeedingAttention;
    }
    return roster.filter((s) => s.gapCount >= 2).length;
  }, [overview, roster]);

  // Compute KPI 3: Weakest Curriculum Topic
  const weakestTopic = useMemo(() => {
    if (!overview?.topics || overview.topics.length === 0) return null;
    const sorted = [...overview.topics].sort((a, b) => {
      // Sort primarily by gapCount descending, then averageMastery ascending
      if ((b.gapCount || 0) !== (a.gapCount || 0)) {
        return (b.gapCount || 0) - (a.gapCount || 0);
      }
      return (a.averageMasteryPercent ?? 100) - (b.averageMasteryPercent ?? 100);
    });
    return sorted[0];
  }, [overview]);

  // Compute KPI 4: Active Interventions
  const activeInterventionsCount = useMemo(() => {
    if (overview?.totals?.openInterventions != null) {
      return overview.totals.openInterventions;
    }
    return classInterventions.filter(
      (i) => i.status === 'PLANNED' || i.status === 'IN_PROGRESS'
    ).length;
  }, [overview, classInterventions]);

  // Compute Chart Data for Recharts Bar Chart
  const chartData = useMemo(() => {
    if (!overview?.topics) return [];
    return overview.topics.map((t) => {
      const avg = t.averageMasteryPercent;
      const isInsufficient =
        avg == null || ((t.noDataCount || 0) + (t.insufficientDataCount || 0) > 0 && avg === 0);

      let status = 'GAP';
      let statusLabel = 'GAP (< 60%)';
      let barFill = '#D93829';

      if (isInsufficient) {
        status = 'INSUFFICIENT_DATA';
        statusLabel = 'INSUFFICIENT DATA (< 3 questions)';
        barFill = 'url(#hatchedPattern)';
      } else if (avg >= 80) {
        status = 'STRENGTH';
        statusLabel = 'STRENGTH (≥ 80%)';
        barFill = '#10B981';
      } else if (avg >= 60) {
        status = 'DEVELOPING';
        statusLabel = 'DEVELOPING (60–79%)';
        barFill = '#F59E0B';
      }

      return {
        topicId: t.topicId,
        topicName: t.topicName,
        mastery: avg != null ? avg : 3, // 3% placeholder height so insufficient data bar is visually interactive
        realMastery: avg,
        displayMastery: avg != null ? `${avg}%` : 'No Data',
        status,
        statusLabel,
        barFill,
        isInsufficient,
        gapCount: t.gapCount || 0,
        developingCount: t.developingCount || 0,
        strengthCount: t.strengthCount || 0,
        noDataCount: (t.noDataCount || 0) + (t.insufficientDataCount || 0),
      };
    });
  }, [overview]);

  // Topics recommended for reteaching (top 2-3)
  const topicsToReteach = useMemo(() => {
    if (!overview?.topics) return [];
    return overview.topics.filter((t) => t.gapCount > 0).slice(0, 3);
  }, [overview]);

  return (
    <div className="space-y-6">
      {/* 4 Real KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Class Average Mastery */}
        <NotebookCard className="p-4 sm:p-5 bg-paper-card dark:bg-chalkboard-card flex flex-col justify-between shadow-notebook-sm border-2 border-ink dark:border-chalkboard-border rounded-2xl min-h-[108px]">
          <div>
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-ink-muted dark:text-chalkboard-muted block">
              Average Mastery
            </span>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-ink dark:text-chalkboard-chalk tracking-tight block">
              {overview?.totals?.averageDiagnosticPercent != null
                ? `${overview.totals.averageDiagnosticPercent}%`
                : '—'}
            </span>
            <span className="text-[11px] font-mono text-ink-muted dark:text-chalkboard-muted mt-0.5 block">
              Diagnostic benchmark
            </span>
          </div>
        </NotebookCard>

        {/* KPI 2: Students Needing Attention (Clickable to filter Students Tab) */}
        <button
          type="button"
          onClick={() => onSelectTab && onSelectTab('students', { filter: 'attention' })}
          className="text-left group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/20 dark:focus-visible:ring-chalkboard-chalk/20 rounded-2xl"
          aria-label={`View ${studentsNeedingAttentionCount} students needing attention`}
        >
          <NotebookCard className="p-4 sm:p-5 bg-paper-card dark:bg-chalkboard-card flex flex-col justify-between shadow-notebook-sm border-2 border-ink dark:border-chalkboard-border group-hover:shadow-notebook transition-all h-full rounded-2xl min-h-[108px]">
            <div>
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-ink-muted dark:text-chalkboard-muted block">
                Needs Attention
              </span>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold font-mono text-ink dark:text-chalkboard-chalk tracking-tight">
                  {studentsNeedingAttentionCount}
                </span>
                <span className="text-xs font-mono text-ink-muted dark:text-chalkboard-muted">
                  / {roster.length}
                </span>
              </div>
              <span className="text-[11px] font-mono text-ink-muted dark:text-chalkboard-muted group-hover:text-ink dark:group-hover:text-chalkboard-chalk group-hover:underline flex items-center gap-1 mt-0.5 transition-colors">
                <span>≥ 2 learning gaps</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform opacity-70 group-hover:opacity-100" />
              </span>
            </div>
          </NotebookCard>
        </button>

        {/* KPI 3: Weakest Topic (Clickable) */}
        <button
          type="button"
          onClick={() => onSelectTab && onSelectTab('students')}
          className="text-left group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/20 dark:focus-visible:ring-chalkboard-chalk/20 rounded-2xl"
          aria-label={`Weakest topic: ${weakestTopic?.topicName || 'None'}`}
        >
          <NotebookCard className="p-4 sm:p-5 bg-paper-card dark:bg-chalkboard-card flex flex-col justify-between shadow-notebook-sm border-2 border-ink dark:border-chalkboard-border group-hover:shadow-notebook transition-all h-full rounded-2xl min-h-[108px]">
            <div>
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-ink-muted dark:text-chalkboard-muted block">
                Weakest Topic
              </span>
            </div>
            <div className="mt-3">
              <span className="text-base sm:text-lg font-bold font-sans text-ink dark:text-chalkboard-chalk truncate block leading-snug">
                {weakestTopic?.topicName || 'None identified'}
              </span>
              <span className="text-[11px] font-mono text-ink-muted dark:text-chalkboard-muted mt-0.5 block">
                {weakestTopic
                  ? `${weakestTopic.averageMasteryPercent ?? 0}% avg • ${weakestTopic.gapCount} gap${
                      weakestTopic.gapCount === 1 ? '' : 's'
                    }`
                  : 'All topics strong'}
              </span>
            </div>
          </NotebookCard>
        </button>

        {/* KPI 4: Active Interventions (Clickable to Interventions Tab) */}
        <button
          type="button"
          onClick={() => onSelectTab && onSelectTab('interventions')}
          className="text-left group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/20 dark:focus-visible:ring-chalkboard-chalk/20 rounded-2xl"
          aria-label={`View ${activeInterventionsCount} active interventions`}
        >
          <NotebookCard className="p-4 sm:p-5 bg-paper-card dark:bg-chalkboard-card flex flex-col justify-between shadow-notebook-sm border-2 border-ink dark:border-chalkboard-border group-hover:shadow-notebook transition-all h-full rounded-2xl min-h-[108px]">
            <div>
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-ink-muted dark:text-chalkboard-muted block">
                Active Interventions
              </span>
            </div>
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-extrabold font-mono text-ink dark:text-chalkboard-chalk tracking-tight block">
                {activeInterventionsCount}
              </span>
              <span className="text-[11px] font-mono text-ink-muted dark:text-chalkboard-muted group-hover:text-ink dark:group-hover:text-chalkboard-chalk group-hover:underline flex items-center gap-1 mt-0.5 transition-colors">
                <span>Active support plans</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform opacity-70 group-hover:opacity-100" />
              </span>
            </div>
          </NotebookCard>
        </button>
      </div>

      {/* Per-Topic Recharts Bar Chart with Dual Reference Lines */}
      <NotebookCard className="p-5 sm:p-6 bg-paper-card dark:bg-chalkboard-card space-y-4 shadow-notebook-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-ink/10 dark:border-chalkboard-borderSubtle pb-4">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-redpen dark:text-highlighter-yellow" aria-hidden="true" />
              <h3 className="text-base sm:text-lg font-extrabold text-ink dark:text-chalkboard-chalk">
                Curriculum Topic Mastery vs. Benchmarks
              </h3>
            </div>
            <p className="text-xs font-mono text-ink-muted dark:text-chalkboard-muted mt-0.5">
              Dual reference lines: 60% Learning Gap cutoff and 80% Strength goal.
            </p>
          </div>

          {/* Visual Legend (Color + Label + Icon - never color alone) */}
          <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
            <span className="inline-flex items-center gap-1 text-emerald-800 dark:text-emerald-300">
              <span className="w-3 h-3 rounded-xs bg-emerald-500 inline-block border border-ink/20" />
              <span>Strength (≥ 80%)</span>
            </span>
            <span className="inline-flex items-center gap-1 text-amber-800 dark:text-amber-300">
              <span className="w-3 h-3 rounded-xs bg-amber-400 inline-block border border-ink/20" />
              <span>Developing (60–79%)</span>
            </span>
            <span className="inline-flex items-center gap-1 text-redpen dark:text-red-400 font-bold">
              <span className="w-3 h-3 rounded-xs bg-redpen inline-block border border-ink/20" />
              <span>Gap (&lt; 60%)</span>
            </span>
            <span className="inline-flex items-center gap-1 text-ink-muted dark:text-chalkboard-muted">
              <span className="w-3 h-3 rounded-xs border-2 border-dashed border-ink/40 bg-paper-warm inline-block" />
              <span>No Data (&lt; 3 qs)</span>
            </span>
          </div>
        </div>

        {chartData.length === 0 ? (
          <div className="py-12 text-center text-xs font-mono text-ink-muted dark:text-chalkboard-muted">
            No topic curriculum mastery data recorded yet.
          </div>
        ) : (
          <div>
            <div className="h-72 sm:h-80 w-full" aria-label="Topic mastery bar chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 24, left: -10, bottom: 25 }}>
                  <defs>
                    {/* SVG Hatched Pattern for Insufficient / No Data */}
                    <pattern id="hatchedPattern" patternUnits="userSpaceOnUse" width="8" height="8">
                      <path
                        d="M0 8 L8 0 M0 0 L0 0 M8 8 L8 8"
                        stroke="#94A3B8"
                        strokeWidth="1.5"
                        fill="transparent"
                      />
                    </pattern>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                  <XAxis
                    dataKey="topicName"
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                    height={40}
                  />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748B' }} unit="%" />
                  <Tooltip content={<TopicChartTooltip />} />

                  {/* Reference Line 1: 60% GAP cutoff */}
                  <ReferenceLine
                    y={60}
                    stroke="#D93829"
                    strokeDasharray="4 4"
                    strokeWidth={2}
                    label={{
                      value: '60% Gap',
                      position: 'insideBottomLeft',
                      fill: '#D93829',
                      fontSize: 11,
                      fontWeight: 'bold',
                    }}
                  />

                  {/* Reference Line 2: 80% STRENGTH goal */}
                  <ReferenceLine
                    y={80}
                    stroke="#10B981"
                    strokeDasharray="4 4"
                    strokeWidth={2}
                    label={{
                      value: '80% Strength',
                      position: 'insideTopLeft',
                      fill: '#10B981',
                      fontSize: 11,
                      fontWeight: 'bold',
                    }}
                  />

                  <Bar dataKey="mastery" radius={[6, 6, 0, 0]} maxBarSize={48}>
                    {chartData.map((entry) => (
                      <Cell
                        key={entry.topicId}
                        fill={entry.barFill}
                        stroke={entry.isInsufficient ? '#64748B' : '#1B2534'}
                        strokeWidth={entry.isInsufficient ? 1.5 : 1}
                        strokeDasharray={entry.isInsufficient ? '3 3' : undefined}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Screen Reader Alternative Table (WCAG accessibility) */}
            <div className="sr-only">
              <h4>Accessible Topic Mastery Breakdown Table</h4>
              <table>
                <thead>
                  <tr>
                    <th>Topic</th>
                    <th>Average Mastery</th>
                    <th>Status Band</th>
                    <th>Strength Count</th>
                    <th>Developing Count</th>
                    <th>Gap Count</th>
                    <th>Insufficient Data Count</th>
                  </tr>
                </thead>
                <tbody>
                  {chartData.map((t) => (
                    <tr key={t.topicId}>
                      <td>{t.topicName}</td>
                      <td>{t.displayMastery}</td>
                      <td>{t.statusLabel}</td>
                      <td>{t.strengthCount}</td>
                      <td>{t.developingCount}</td>
                      <td>{t.gapCount}</td>
                      <td>{t.noDataCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </NotebookCard>

      {/* Priority Focus & Recommended Actions */}
      {topicsToReteach.length > 0 && (
        <div className="p-5 rounded-2xl border-2 border-redpen bg-redpen-soft dark:bg-redpen-soft/20 text-redpen-dark dark:text-redpen-soft flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-notebook-sm">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-redpen text-white shrink-0 mt-0.5">
              <Sparkles className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider bg-redpen text-white px-2 py-0.5 rounded">
                  Priority Focus
                </span>
                <h4 className="font-bold text-base text-ink dark:text-chalkboard-chalk">
                  Topics Recommended for Whole-Class Reteaching
                </h4>
              </div>
              <p className="text-xs sm:text-sm text-ink-muted dark:text-chalkboard-muted mt-1 leading-relaxed">
                Diagnostic data indicates the highest concentration of student learning gaps in:{' '}
                <strong className="text-ink dark:text-chalkboard-chalk">
                  {topicsToReteach.map((t) => `${t.topicName} (${t.gapCount} students)`).join(', ')}
                </strong>
                . Consider dedicating 10–15 minutes of class time to review these concepts.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
            <Button
              size="sm"
              variant="primary"
              onClick={() => onSelectTab && onSelectTab('students', { filter: 'attention' })}
            >
              <span>View Gap Students</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Validation Lab Research Callout */}
      <NotebookCard className="p-5 bg-paper-card dark:bg-chalkboard-card border-2 border-ink dark:border-chalkboard-border shadow-notebook-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-highlighter-mint text-ink border border-ink/20 shrink-0 mt-0.5">
              <FlaskConical className="w-5 h-5 text-ink-blue" aria-hidden="true" />
            </div>
            <div>
              <h4 className="font-bold text-sm sm:text-base text-ink dark:text-chalkboard-chalk">
                Teacher Validation Lab
              </h4>
              <p className="text-xs text-ink-muted dark:text-chalkboard-muted mt-0.5 leading-relaxed max-w-2xl">
                Participate in our blind evaluation study by rating your students' quiz answers without system scores. Ground-truth data helps verify our 85% agreement objective.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              to={`/teacher/classes/${classId}/validation`}
              variant="secondary"
              size="sm"
            >
              <span>Open Validation Lab</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </NotebookCard>
    </div>
  );
}
