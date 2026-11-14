import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpenCheck,
  Search,
  Clock,
  Unlock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Lock,
  ArrowRight,
} from 'lucide-react';
import {
  SearchInput,
  PaginationControls,
  NotebookTable,
  NotebookTableHead,
  NotebookTableRow,
  NotebookTableHeaderCell,
  NotebookTableCell,
  EmptyState,
} from '../../components/NotebookPrimitives';

export default function ClassAssessmentsTab({
  classId,
  assessments = [],
  onOpenScheduleModal,
  onOpenUnlockModal,
}) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'PUBLISHED' | 'SCHEDULED' | 'CLOSED' | 'DRAFT'
  const [includeArchived, setIncludeArchived] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const formatDate = (isoString) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  // Filter assessments
  const filteredAssessments = useMemo(() => {
    let list = [...assessments];

    if (!includeArchived) {
      list = list.filter((a) => a.status !== 'ARCHIVED');
    }

    if (statusFilter !== 'ALL') {
      list = list.filter((a) => a.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (a) =>
          (a.title && a.title.toLowerCase().includes(q)) ||
          (a.description && a.description.toLowerCase().includes(q))
      );
    }

    return list;
  }, [assessments, includeArchived, statusFilter, searchQuery]);

  // Paginated slice
  const paginatedAssessments = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAssessments.slice(start, start + pageSize);
  }, [filteredAssessments, currentPage, pageSize]);

  // Filter count helpers
  const countByStatus = (st) => assessments.filter((a) => a.status === st).length;

  return (
    <div className="space-y-4">
      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-2xl bg-paper-card dark:bg-chalkboard-card border-2 border-ink dark:border-chalkboard-border shadow-notebook-sm">
        {/* Status Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'ALL', label: `All (${assessments.length})` },
            { id: 'PUBLISHED', label: `Published (${countByStatus('PUBLISHED')})` },
            { id: 'SCHEDULED', label: `Scheduled (${countByStatus('SCHEDULED')})` },
            { id: 'CLOSED', label: `Closed (${countByStatus('CLOSED')})` },
            { id: 'DRAFT', label: `Draft (${countByStatus('DRAFT')})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setStatusFilter(tab.id);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer border ${
                statusFilter === tab.id
                  ? 'bg-ink text-white dark:bg-highlighter-mint dark:text-ink border-ink dark:border-chalkboard-border shadow-xs'
                  : 'bg-paper-warm dark:bg-chalkboard-surface text-ink-muted dark:text-chalkboard-muted border-ink/20 dark:border-chalkboard-borderSubtle hover:text-ink'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Archived Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <label className="inline-flex items-center gap-2 text-xs font-mono text-ink-muted dark:text-chalkboard-muted cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includeArchived}
              onChange={(e) => {
                setIncludeArchived(e.target.checked);
                setCurrentPage(1);
              }}
              className="w-4 h-4 rounded border-2 border-ink text-redpen focus:ring-redpen"
            />
            <span>Include archived</span>
          </label>

          <SearchInput
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search quizzes…"
            ariaLabel="Search assessments by title"
            className="w-full sm:w-60"
          />
        </div>
      </div>

      {/* Assessments Data Table */}
      {filteredAssessments.length === 0 ? (
        <EmptyState
          icon={BookOpenCheck}
          title="No Assessments Found"
          message={
            searchQuery || statusFilter !== 'ALL'
              ? 'No assessments match your current filters. Try adjusting your search or status selection.'
              : 'No quizzes or assessments are assigned to this class section yet.'
          }
          action={
            (searchQuery || statusFilter !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('ALL');
                  setCurrentPage(1);
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-bold border-2 border-ink bg-paper-card text-ink hover:bg-paper-warm"
              >
                Reset Filters
              </button>
            )
          }
        />
      ) : (
        <div className="space-y-0">
          <NotebookTable>
            <NotebookTableHead>
              <NotebookTableRow hover={false}>
                <NotebookTableHeaderCell>Assessment Title</NotebookTableHeaderCell>
                <NotebookTableHeaderCell align="center">Status</NotebookTableHeaderCell>
                <NotebookTableHeaderCell align="center">Schedule Window</NotebookTableHeaderCell>
                <NotebookTableHeaderCell align="center">Questions</NotebookTableHeaderCell>
                <NotebookTableHeaderCell align="center">Attempts</NotebookTableHeaderCell>
                <NotebookTableHeaderCell align="center">Retakes</NotebookTableHeaderCell>
                <NotebookTableHeaderCell align="right">Actions</NotebookTableHeaderCell>
              </NotebookTableRow>
            </NotebookTableHead>
            <tbody className="divide-y divide-ink/10 dark:divide-chalkboard-borderSubtle">
              {paginatedAssessments.map((asm) => {
                const isPublished = asm.status === 'PUBLISHED';
                const isClosed = asm.status === 'CLOSED';
                const isScheduled = asm.status === 'SCHEDULED';
                const retakesAllowed = asm.allowRetakes ?? true;

                const submissionsUrl = `/teacher/classes/${classId}/assessments/${asm.assessmentId}/submissions`;

                return (
                  <NotebookTableRow
                    key={asm.assessmentId}
                    onClick={() => navigate(submissionsUrl)}
                    className="cursor-pointer group"
                  >
                    {/* Title & Description */}
                    <NotebookTableCell>
                      <div>
                        <span className="font-bold text-sm text-ink dark:text-chalkboard-chalk group-hover:text-redpen dark:group-hover:text-highlighter-yellow transition-colors block">
                          {asm.title}
                        </span>
                        {asm.ungradedEssayCount > 0 && (
                          <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-400">
                            <Clock className="w-3 h-3" aria-hidden="true" />
                            {asm.ungradedEssayCount} Needs Review
                          </span>
                        )}
                        {asm.description && (
                          <span className="text-[11px] text-ink-muted dark:text-chalkboard-muted line-clamp-1 font-sans">
                            {asm.description}
                          </span>
                        )}
                      </div>
                    </NotebookTableCell>

                    {/* Status Badge */}
                    <NotebookTableCell align="center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                          isPublished
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                            : isScheduled
                            ? 'bg-highlighter-yellowSoft text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                            : isClosed
                            ? 'bg-ink/10 text-ink-muted border-ink/20'
                            : 'bg-paper-warm text-ink-muted border-ink/20'
                        }`}
                      >
                        {isPublished ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-700 dark:text-emerald-300" aria-hidden="true" />
                        ) : isScheduled ? (
                          <Clock className="w-3 h-3 text-amber-700 dark:text-amber-300" aria-hidden="true" />
                        ) : null}
                        <span>{asm.status}</span>
                      </span>
                    </NotebookTableCell>

                    {/* Window / Dates */}
                    <NotebookTableCell align="center">
                      <div className="text-[11px] font-mono text-ink-muted dark:text-chalkboard-muted space-y-0.5">
                        {asm.availableFrom || asm.availableUntil ? (
                          <>
                            <div>From: {formatDate(asm.availableFrom)}</div>
                            <div>Until: {formatDate(asm.availableUntil)}</div>
                          </>
                        ) : (
                          <span>Always open</span>
                        )}
                      </div>
                    </NotebookTableCell>

                    {/* Total Questions */}
                    <NotebookTableCell align="center">
                      <span className="font-mono text-xs text-ink dark:text-chalkboard-chalk">
                        {asm.totalQuestions ?? asm.questionsCount ?? '—'}
                      </span>
                    </NotebookTableCell>

                    {/* Attempts / Submissions Progress */}
                    <NotebookTableCell align="center">
                      {asm.enrolledCount > 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-paper-warm dark:bg-chalkboard-surface text-ink dark:text-chalkboard-chalk border border-ink/20 dark:border-chalkboard-borderSubtle">
                          {asm.submittedStudentCount ?? 0}/{asm.enrolledCount} Submitted
                        </span>
                      ) : (
                        <span className="font-mono text-xs text-ink dark:text-chalkboard-chalk">
                          {asm.attemptCount ?? 0}
                        </span>
                      )}
                    </NotebookTableCell>

                    {/* Retakes */}
                    <NotebookTableCell align="center">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          retakesAllowed
                            ? 'bg-emerald-100/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                            : 'bg-redpen-soft text-redpen-dark border border-redpen/30'
                        }`}
                      >
                        {retakesAllowed ? (
                          <span>Allowed</span>
                        ) : (
                          <>
                            <Lock className="w-3 h-3 text-redpen" aria-hidden="true" />
                            <span>Locked</span>
                          </>
                        )}
                      </span>
                    </NotebookTableCell>

                    {/* Actions: View Submissions, Schedule & Unlock Retake */}
                    <NotebookTableCell align="right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(submissionsUrl);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border border-ink dark:border-chalkboard-border bg-ink text-white dark:bg-highlighter-mint dark:text-ink hover:opacity-90 transition-opacity cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-redpen"
                          title="Open enrolled student submissions and grade attempts"
                        >
                          <span>Submissions</span>
                          <ArrowRight className="w-3 h-3" aria-hidden="true" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenScheduleModal && onOpenScheduleModal(asm);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-card dark:bg-chalkboard-card hover:bg-paper-warm dark:hover:bg-chalkboard-surface text-ink dark:text-chalkboard-chalk transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-redpen"
                          title="Configure availability dates and retake permissions"
                        >
                          <Clock className="w-3 h-3 text-redpen dark:text-highlighter-yellow" aria-hidden="true" />
                          <span>Schedule</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenUnlockModal && onOpenUnlockModal(asm);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-card dark:bg-chalkboard-card hover:bg-paper-warm dark:hover:bg-chalkboard-surface text-ink dark:text-chalkboard-chalk transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-redpen"
                          title="Grant an individual retake unlock or deadline extension"
                        >
                          <Unlock className="w-3 h-3 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                          <span>Unlock</span>
                        </button>
                      </div>
                    </NotebookTableCell>
                  </NotebookTableRow>
                );
              })}
            </tbody>
          </NotebookTable>

          {/* Pagination Controls */}
          <PaginationControls
            currentPage={currentPage}
            pageSize={pageSize}
            totalItems={filteredAssessments.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setCurrentPage(1);
            }}
            pageSizeOptions={[10, 25, 50]}
          />
        </div>
      )}
    </div>
  );
}
