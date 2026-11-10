import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  HeartHandshake,
  Search,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Minus,
  RefreshCw,
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
  Button,
} from '../../components/NotebookPrimitives';

export default function ClassInterventionsTab({
  classId,
  interventions = [],
  roster = [],
  topics = [],
  onOpenLogModal,
  onUpdateStatus,
  actionLoading = false,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'PLANNED' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED'
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [updatingId, setUpdatingId] = useState(null);

  // Filter interventions
  const filteredInterventions = useMemo(() => {
    let list = [...interventions];

    if (statusFilter !== 'ALL') {
      list = list.filter((i) => i.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (i) =>
          (i.studentName && i.studentName.toLowerCase().includes(q)) ||
          (i.topicName && i.topicName.toLowerCase().includes(q)) ||
          (i.note && i.note.toLowerCase().includes(q))
      );
    }

    return list;
  }, [interventions, statusFilter, searchQuery]);

  // Paginated slice
  const paginatedInterventions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredInterventions.slice(start, start + pageSize);
  }, [filteredInterventions, currentPage, pageSize]);

  const countByStatus = (st) => interventions.filter((i) => i.status === st).length;

  const handleStatusChange = async (itvId, newStatus) => {
    if (!onUpdateStatus) return;
    setUpdatingId(itvId);
    try {
      await onUpdateStatus(itvId, newStatus);
    } finally {
      setUpdatingId(null);
    }
  };

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

  return (
    <div className="space-y-4">
      {/* Filter, Search & Log Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-2xl bg-paper-card dark:bg-chalkboard-card border-2 border-ink dark:border-chalkboard-border shadow-notebook-sm">
        {/* Status Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'ALL', label: `All (${interventions.length})` },
            { id: 'PLANNED', label: `Planned (${countByStatus('PLANNED')})` },
            { id: 'IN_PROGRESS', label: `In Progress (${countByStatus('IN_PROGRESS')})` },
            { id: 'DONE', label: `Done (${countByStatus('DONE')})` },
            { id: 'CANCELLED', label: `Cancelled (${countByStatus('CANCELLED')})` },
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

        {/* Search & Log Intervention Button */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <SearchInput
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search student or topic…"
            ariaLabel="Search interventions by student or topic"
            className="w-full sm:w-60"
          />

          <Button
            variant="mint"
            size="sm"
            onClick={onOpenLogModal}
            className="whitespace-nowrap shrink-0"
          >
            <PlusCircle className="w-4 h-4 mr-1.5" aria-hidden="true" />
            <span>Log Intervention</span>
          </Button>
        </div>
      </div>

      {/* Interventions Data Table */}
      {filteredInterventions.length === 0 ? (
        <EmptyState
          icon={HeartHandshake}
          title="No Interventions Found"
          message={
            searchQuery || statusFilter !== 'ALL'
              ? 'No interventions match your current search or status filter.'
              : 'No pedagogical interventions have been logged for this class section yet. Click "Log Intervention" to record one-on-one sessions, extra practice, or remedial reviews.'
          }
          action={
            searchQuery || statusFilter !== 'ALL' ? (
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
            ) : (
              <Button variant="primary" size="sm" onClick={onOpenLogModal}>
                <PlusCircle className="w-4 h-4 mr-1.5" aria-hidden="true" />
                <span>Log First Intervention</span>
              </Button>
            )
          }
        />
      ) : (
        <div className="space-y-0">
          <NotebookTable>
            <NotebookTableHead>
              <NotebookTableRow hover={false}>
                <NotebookTableHeaderCell>Student</NotebookTableHeaderCell>
                <NotebookTableHeaderCell>Target Topic</NotebookTableHeaderCell>
                <NotebookTableHeaderCell>Type</NotebookTableHeaderCell>
                <NotebookTableHeaderCell>Follow-up Date</NotebookTableHeaderCell>
                <NotebookTableHeaderCell>Status</NotebookTableHeaderCell>
                <NotebookTableHeaderCell>Outcome</NotebookTableHeaderCell>
                <NotebookTableHeaderCell align="right">Actions</NotebookTableHeaderCell>
              </NotebookTableRow>
            </NotebookTableHead>
            <tbody className="divide-y divide-ink/10 dark:divide-chalkboard-borderSubtle">
              {paginatedInterventions.map((itv) => {
                const isUpdating = updatingId === itv.id;
                const isDone = itv.status === 'DONE';
                const isCancelled = itv.status === 'CANCELLED';

                return (
                  <NotebookTableRow key={itv.id}>
                    {/* Student */}
                    <NotebookTableCell>
                      <div>
                        <Link
                          to={`/teacher/classes/${classId}/students/${itv.studentId}`}
                          className="font-bold text-sm text-ink dark:text-chalkboard-chalk hover:text-redpen hover:underline block"
                        >
                          {itv.studentName || `Student #${itv.studentId}`}
                        </Link>
                        {itv.note && (
                          <span className="text-[11px] text-ink-muted dark:text-chalkboard-muted line-clamp-1 italic font-sans">
                            "{itv.note}"
                          </span>
                        )}
                      </div>
                    </NotebookTableCell>

                    {/* Topic */}
                    <NotebookTableCell>
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-paper-warm dark:bg-chalkboard-surface border border-ink/20 dark:border-chalkboard-borderSubtle text-ink dark:text-chalkboard-chalk">
                        {itv.topicName}
                      </span>
                    </NotebookTableCell>

                    {/* Type */}
                    <NotebookTableCell>
                      <span className="text-xs font-mono text-ink-muted dark:text-chalkboard-muted">
                        {itv.type ? itv.type.replace(/_/g, ' ') : '—'}
                      </span>
                    </NotebookTableCell>

                    {/* Follow-up Date */}
                    <NotebookTableCell>
                      <span className="text-xs font-mono text-ink-muted dark:text-chalkboard-muted">
                        {formatDate(itv.followUpDate)}
                      </span>
                    </NotebookTableCell>

                    {/* Interactive Status Dropdown */}
                    <NotebookTableCell>
                      <div className="flex items-center gap-1.5">
                        <select
                          value={itv.status}
                          disabled={isUpdating || actionLoading}
                          onChange={(e) => handleStatusChange(itv.id, e.target.value)}
                          className={`px-2 py-1 rounded-lg text-xs font-mono font-bold border transition-colors focus:outline-none cursor-pointer ${
                            isDone
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                              : isCancelled
                              ? 'bg-ink/10 text-ink-muted border-ink/20'
                              : 'bg-cyan-100 text-cyan-900 border-cyan-300 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-800'
                          }`}
                          aria-label={`Change status for intervention with ${itv.studentName}`}
                        >
                          <option value="PLANNED">PLANNED</option>
                          <option value="IN_PROGRESS">IN PROGRESS</option>
                          <option value="DONE">DONE</option>
                          <option value="CANCELLED">CANCELLED</option>
                        </select>
                        {isUpdating && (
                          <RefreshCw className="w-3 h-3 animate-spin text-ink-muted" aria-hidden="true" />
                        )}
                      </div>
                    </NotebookTableCell>

                    {/* Outcome */}
                    <NotebookTableCell>
                      {itv.outcome ? (
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                            itv.outcome === 'IMPROVED'
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                              : itv.outcome === 'DECLINED'
                              ? 'bg-redpen-soft text-redpen-dark border-redpen/40'
                              : itv.outcome === 'SAME'
                              ? 'bg-amber-100 text-amber-900 border-amber-300'
                              : 'bg-paper-warm text-ink-muted border-ink/20'
                          }`}
                        >
                          {itv.outcome === 'NO_NEW_DATA' ? (
                            <>
                              <Clock className="w-3 h-3" aria-hidden="true" />
                              <span>Waiting for quiz</span>
                            </>
                          ) : itv.outcome === 'IMPROVED' ? (
                            <>
                              <TrendingUp className="w-3 h-3 text-emerald-700" aria-hidden="true" />
                              <span>Improved</span>
                            </>
                          ) : itv.outcome === 'DECLINED' ? (
                            <>
                              <AlertTriangle className="w-3 h-3 text-redpen" aria-hidden="true" />
                              <span>Declined</span>
                            </>
                          ) : itv.outcome === 'SAME' ? (
                            <>
                              <Minus className="w-3 h-3 text-amber-700" aria-hidden="true" />
                              <span>Stable</span>
                            </>
                          ) : (
                            <span>{itv.outcome}</span>
                          )}
                        </span>
                      ) : (
                        <span className="text-ink-muted dark:text-chalkboard-muted text-[11px] font-mono">—</span>
                      )}
                    </NotebookTableCell>

                    {/* Actions */}
                    <NotebookTableCell align="right">
                      <Link
                        to={`/teacher/classes/${classId}/students/${itv.studentId}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-card dark:bg-chalkboard-card hover:bg-paper-warm dark:hover:bg-chalkboard-surface text-ink dark:text-chalkboard-chalk transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-redpen"
                      >
                        <span>Student</span>
                        <ArrowRight className="w-3 h-3" aria-hidden="true" />
                      </Link>
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
            totalItems={filteredInterventions.length}
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
