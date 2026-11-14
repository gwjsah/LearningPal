import React, { useMemo } from 'react';
import {
  Star,
  MessageSquare,
  AlertTriangle,
  ThumbsUp,
  Award,
} from 'lucide-react';
import {
  NotebookCard,
  NotebookTable,
  NotebookTableHead,
  NotebookTableRow,
  NotebookTableHeaderCell,
  NotebookTableCell,
  EmptyState,
} from '../../components/NotebookPrimitives';

export default function ClassRatingsTab({ ratingsSummary }) {
  // Normalized Ratings Summary Data (safe against undefined/null)
  const {
    topicRatingsList,
    resourceRatingsList,
    lowestRatedResourcesList,
    recentCommentsList,
    totalRatingsCount,
  } = useMemo(() => {
    const topics = ratingsSummary?.topics || ratingsSummary?.topicRatings || [];
    const resources = ratingsSummary?.resources || ratingsSummary?.resourceRatings || [];
    const lowest = ratingsSummary?.lowestRatedResources || [];
    const comments = ratingsSummary?.recentComments || [];

    const totalTopicRatings = topics.reduce((acc, t) => acc + (t.totalRatings || 0), 0);
    const totalResourceRatings = resources.reduce((acc, r) => acc + (r.totalRatings || 0), 0);
    const totalCount =
      ratingsSummary?.totalRatingsCount ?? totalTopicRatings + totalResourceRatings;

    return {
      topicRatingsList: topics,
      resourceRatingsList: resources,
      lowestRatedResourcesList: lowest,
      recentCommentsList: comments,
      totalRatingsCount: totalCount,
    };
  }, [ratingsSummary]);

  if (totalRatingsCount === 0) {
    return (
      <EmptyState
        icon={Star}
        title="No Ratings or Feedback Yet"
        message="As students in this class section review their diagnostic feedback and recommended study resources, their anonymous helpfulness ratings (1 to 5) and comments will appear here."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-paper-card dark:bg-chalkboard-card border-2 border-ink dark:border-chalkboard-border shadow-notebook-sm">
        <div>
          <h3 className="text-base font-bold text-ink dark:text-chalkboard-chalk flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500 fill-amber-500" aria-hidden="true" />
            <span>Feedback Quality & Student Ratings</span>
          </h3>
          <p className="text-xs font-mono text-ink-muted dark:text-chalkboard-muted mt-0.5">
            Anonymous student ratings on diagnostic feedback and study materials (Target: ≥ 80% Helpful).
          </p>
        </div>
        <span className="font-mono text-xs font-bold px-3 py-1.5 rounded-xl border border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-warm dark:bg-chalkboard-surface text-ink dark:text-chalkboard-chalk shrink-0">
          {totalRatingsCount} Total Student Ratings
        </span>
      </div>

      {/* Topic Diagnostic Feedback Ratings Table */}
      {topicRatingsList.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-mono font-bold uppercase tracking-wider text-ink-muted dark:text-chalkboard-muted">
              Topic Diagnostic Feedback Ratings
            </h4>
            <span className="text-[11px] font-mono text-ink-muted dark:text-chalkboard-muted">
              Ratings of 4 or 5 count as "Helpful"
            </span>
          </div>

          <NotebookTable>
            <NotebookTableHead>
              <NotebookTableRow hover={false}>
                <NotebookTableHeaderCell>Curriculum Topic</NotebookTableHeaderCell>
                <NotebookTableHeaderCell align="center">Total Ratings</NotebookTableHeaderCell>
                <NotebookTableHeaderCell align="center">Avg Score</NotebookTableHeaderCell>
                <NotebookTableHeaderCell align="right">Helpful %</NotebookTableHeaderCell>
              </NotebookTableRow>
            </NotebookTableHead>
            <tbody className="divide-y divide-ink/10 dark:divide-chalkboard-borderSubtle">
              {topicRatingsList.map((tr) => {
                const avg = Number(tr.averageRating || 0);
                const helpful = Number(tr.helpfulPercentage ?? tr.helpfulPercent ?? 0);
                return (
                  <NotebookTableRow key={tr.topicId}>
                    <NotebookTableCell>
                      <span className="font-sans font-bold text-sm text-ink dark:text-chalkboard-chalk">
                        {tr.topicName}
                      </span>
                    </NotebookTableCell>
                    <NotebookTableCell align="center">
                      <span className="font-mono text-xs text-ink dark:text-chalkboard-chalk">
                        {tr.totalRatings}
                      </span>
                    </NotebookTableCell>
                    <NotebookTableCell align="center">
                      <span className="font-mono font-bold text-xs text-ink dark:text-chalkboard-chalk">
                        {avg.toFixed(1)} / 5.0
                      </span>
                    </NotebookTableCell>
                    <NotebookTableCell align="right">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                          helpful >= 80
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                            : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                        }`}
                      >
                        {helpful.toFixed(0)}%
                      </span>
                    </NotebookTableCell>
                  </NotebookTableRow>
                );
              })}
            </tbody>
          </NotebookTable>
        </div>
      )}

      {/* Materials Flagged for Improvement (≥ 3 ratings) */}
      {lowestRatedResourcesList.length > 0 && (
        <div className="bg-paper-card dark:bg-chalkboard-card border-2 border-redpen/40 dark:border-redpen/50 rounded-2xl overflow-hidden shadow-notebook-sm">
          <div className="px-5 py-3 bg-redpen-soft/40 dark:bg-red-950/40 border-b border-redpen/30 dark:border-red-500/40 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-redpen-dark dark:text-red-300">
              <AlertTriangle className="w-4 h-4" aria-hidden="true" />
              <span>Materials Flagged for Improvement (≥ 3 ratings)</span>
            </div>
            <span className="text-[11px] font-mono text-redpen-dark dark:text-red-300">
              Lowest rated learning resources
            </span>
          </div>
          <div className="divide-y divide-ink/10 dark:divide-chalkboard-borderSubtle">
            {lowestRatedResourcesList.map((res) => {
              const avg = Number(res.averageRating || 0);
              const helpful = Number(res.helpfulPercentage ?? res.helpfulPercent ?? 0);
              return (
                <div
                  key={res.resourceId}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-ink/20 bg-paper-warm dark:bg-chalkboard-surface font-bold text-ink dark:text-chalkboard-chalk">
                        {res.resourceType}
                      </span>
                      <h5 className="text-sm font-bold text-ink dark:text-chalkboard-chalk">
                        {res.resourceTitle}
                      </h5>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-mono shrink-0">
                    <span className="text-ink-muted dark:text-chalkboard-muted">
                      {res.totalRatings} ratings
                    </span>
                    <span className="font-bold text-redpen dark:text-red-400">
                      {avg.toFixed(1)} / 5.0 avg
                    </span>
                    <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold">
                      {helpful.toFixed(0)}% helpful
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Anonymous Student Comments List */}
      {recentCommentsList.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-mono font-bold uppercase tracking-wider text-ink-muted dark:text-chalkboard-muted flex items-center gap-2">
            <MessageSquare className="w-4 h-4" aria-hidden="true" />
            <span>Recent Anonymous Feedback Comments</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recentCommentsList.slice(0, 8).map((comm, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-warm/50 dark:bg-chalkboard-surface/50 space-y-1.5 shadow-xs"
              >
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="font-bold text-ink dark:text-chalkboard-chalk truncate max-w-[200px]">
                    {comm.itemTitle || comm.topicName || 'Topic Feedback'}
                  </span>
                  <span className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" aria-hidden="true" />
                    <span>{comm.rating}/5</span>
                  </span>
                </div>
                <p className="text-xs text-ink-muted dark:text-chalkboard-muted italic leading-relaxed">
                  "{comm.comment}"
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
