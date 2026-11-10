import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Search,
  AlertTriangle,
  CheckCircle2,
  Mail,
  HeartHandshake,
  ArrowRight,
  Filter,
  UserCheck,
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

export default function ClassStudentsTab({
  classId,
  roster = [],
  initialFilter = 'all', // 'all' | 'attention'
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState(initialFilter); // 'all' | 'attention'
  const [includeInactive, setIncludeInactive] = useState(false);
  const [sortField, setSortField] = useState('name'); // 'name' | 'diagnostic' | 'gaps' | 'activity'
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' | 'desc'
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Sync initialFilter prop if changed by parent jump link
  useEffect(() => {
    if (initialFilter) {
      setActiveFilter(initialFilter);
      setCurrentPage(1);
    }
  }, [initialFilter]);

  // Counts for filter pills
  const totalStudentsCount = roster.length;
  const needsAttentionCount = useMemo(() => {
    return roster.filter((s) => (s.gapCount || 0) >= 2).length;
  }, [roster]);

  // Handle header click for sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection(field === 'diagnostic' || field === 'gaps' ? 'desc' : 'asc');
    }
    setCurrentPage(1);
  };

  // Filter & Sort Roster
  const filteredAndSortedRoster = useMemo(() => {
    let list = [...roster];

    // Filter by active/archived if student has status property
    if (!includeInactive) {
      list = list.filter((s) => s.status !== 'ARCHIVED' && s.active !== false);
    }

    // Filter by needs attention pill
    if (activeFilter === 'attention') {
      list = list.filter((s) => (s.gapCount || 0) >= 2);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (s) =>
          (s.name && s.name.toLowerCase().includes(q)) ||
          (s.email && s.email.toLowerCase().includes(q))
      );
    }

    // Sort
    list.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') {
        cmp = (a.name || '').localeCompare(b.name || '');
      } else if (sortField === 'diagnostic') {
        const scoreA = a.latestDiagnostic?.percent ?? -1;
        const scoreB = b.latestDiagnostic?.percent ?? -1;
        cmp = scoreA - scoreB;
      } else if (sortField === 'gaps') {
        const gapsA = a.gapCount || 0;
        const gapsB = b.gapCount || 0;
        cmp = gapsA - gapsB;
      } else if (sortField === 'activity') {
        const dateA = a.lastActivityAt ? new Date(a.lastActivityAt).getTime() : 0;
        const dateB = b.lastActivityAt ? new Date(b.lastActivityAt).getTime() : 0;
        cmp = dateA - dateB;
      }

      return sortDirection === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [roster, includeInactive, activeFilter, searchQuery, sortField, sortDirection]);

  // Paginated slice
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedRoster.slice(start, start + pageSize);
  }, [filteredAndSortedRoster, currentPage, pageSize]);

  return (
    <div className="space-y-4">
      {/* Control Bar: Filters, Search, and Inactive Toggle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-2xl bg-paper-card dark:bg-chalkboard-card border-2 border-ink dark:border-chalkboard-border shadow-notebook-sm">
        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveFilter('all');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer border ${
              activeFilter === 'all'
                ? 'bg-ink text-white dark:bg-highlighter-mint dark:text-ink border-ink dark:border-chalkboard-border shadow-xs'
                : 'bg-paper-warm dark:bg-chalkboard-surface text-ink-muted dark:text-chalkboard-muted border-ink/20 dark:border-chalkboard-borderSubtle hover:text-ink'
            }`}
          >
            All Students ({totalStudentsCount})
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveFilter('attention');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
              activeFilter === 'attention'
                ? 'bg-redpen text-white border-redpen shadow-xs'
                : 'bg-redpen-soft/40 text-redpen-dark dark:text-red-300 border-redpen/30 hover:bg-redpen-soft'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Needs Attention ({needsAttentionCount})</span>
          </button>
        </div>

        {/* Search & Toggle Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <label className="inline-flex items-center gap-2 text-xs font-mono text-ink-muted dark:text-chalkboard-muted cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(e) => {
                setIncludeInactive(e.target.checked);
                setCurrentPage(1);
              }}
              className="w-4 h-4 rounded border-2 border-ink text-redpen focus:ring-redpen"
            />
            <span>Include inactive</span>
          </label>

          <SearchInput
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search name or email…"
            ariaLabel="Search students by name or email"
            className="w-full sm:w-64"
          />
        </div>
      </div>

      {/* Students Data Table */}
      {filteredAndSortedRoster.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No Students Found"
          message={
            searchQuery || activeFilter !== 'all'
              ? 'No students matched your search criteria or filter. Try clearing the filters.'
              : 'No students are currently enrolled in this class section.'
          }
          action={
            (searchQuery || activeFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setActiveFilter('all');
                  setCurrentPage(1);
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-bold border-2 border-ink bg-paper-card text-ink hover:bg-paper-warm"
              >
                Clear Filters
              </button>
            )
          }
        />
      ) : (
        <div className="space-y-0">
          <NotebookTable>
            <NotebookTableHead>
              <NotebookTableRow hover={false}>
                <NotebookTableHeaderCell
                  sortable
                  sorted={sortField === 'name' ? sortDirection : null}
                  onSort={() => handleSort('name')}
                >
                  Student
                </NotebookTableHeaderCell>
                <NotebookTableHeaderCell>Status</NotebookTableHeaderCell>
                <NotebookTableHeaderCell
                  sortable
                  sorted={sortField === 'diagnostic' ? sortDirection : null}
                  onSort={() => handleSort('diagnostic')}
                  align="center"
                >
                  Diagnostic Score
                </NotebookTableHeaderCell>
                <NotebookTableHeaderCell
                  sortable
                  sorted={sortField === 'gaps' ? sortDirection : null}
                  onSort={() => handleSort('gaps')}
                >
                  Topic Mastery
                </NotebookTableHeaderCell>
                <NotebookTableHeaderCell align="center">Attempts</NotebookTableHeaderCell>
                <NotebookTableHeaderCell align="center">Interventions</NotebookTableHeaderCell>
                <NotebookTableHeaderCell align="right">Actions</NotebookTableHeaderCell>
              </NotebookTableRow>
            </NotebookTableHead>
            <tbody className="divide-y divide-ink/10 dark:divide-chalkboard-borderSubtle">
              {paginatedStudents.map((student) => {
                const needsAttention = (student.gapCount || 0) >= 2 || student.needsAttention;
                return (
                  <NotebookTableRow key={student.studentId}>
                    {/* Student Info */}
                    <NotebookTableCell>
                      <div>
                        <Link
                          to={`/teacher/classes/${classId}/students/${student.studentId}`}
                          className="font-bold text-sm text-ink dark:text-chalkboard-chalk hover:text-redpen hover:underline block"
                        >
                          {student.name}
                        </Link>
                        <span className="text-[11px] text-ink-muted dark:text-chalkboard-muted flex items-center gap-1 font-mono">
                          <Mail className="w-3 h-3" aria-hidden="true" />
                          <span>{student.email}</span>
                        </span>
                      </div>
                    </NotebookTableCell>

                    {/* Status Pill */}
                    <NotebookTableCell>
                      {needsAttention ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-redpen-soft text-redpen-dark border border-redpen/40">
                          <AlertTriangle className="w-3 h-3 text-redpen" aria-hidden="true" />
                          <span>Needs Attention</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-900 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
                          <CheckCircle2 className="w-3 h-3 text-emerald-700 dark:text-emerald-300" aria-hidden="true" />
                          <span>On Track</span>
                        </span>
                      )}
                    </NotebookTableCell>

                    {/* Diagnostic Score */}
                    <NotebookTableCell align="center">
                      {student.latestDiagnostic ? (
                        <div className="font-mono">
                          <span className="font-bold text-xs text-ink dark:text-chalkboard-chalk">
                            {student.latestDiagnostic.score}/{student.latestDiagnostic.maxScore}
                          </span>
                          <span
                            className={`ml-1.5 px-1.5 py-0.2 rounded text-[10px] font-bold ${
                              student.latestDiagnostic.percent >= 80
                                ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300'
                                : student.latestDiagnostic.percent >= 60
                                ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-redpen-soft text-redpen-dark'
                            }`}
                          >
                            {student.latestDiagnostic.percent}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-ink-muted dark:text-chalkboard-muted text-[11px] font-mono">
                          Not started
                        </span>
                      )}
                    </NotebookTableCell>

                    {/* Topic Mastery Badges */}
                    <NotebookTableCell>
                      <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
                        {student.strengthCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 font-bold">
                            {student.strengthCount} STR
                          </span>
                        )}
                        {student.developingCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 font-bold">
                            {student.developingCount} DEV
                          </span>
                        )}
                        {student.gapCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-redpen-soft text-redpen-dark border border-redpen/40 font-bold">
                            {student.gapCount} GAP
                          </span>
                        )}
                        {!student.strengthCount && !student.developingCount && !student.gapCount && (
                          <span className="text-ink-muted dark:text-chalkboard-muted">No data</span>
                        )}
                      </div>
                    </NotebookTableCell>

                    {/* Attempts */}
                    <NotebookTableCell align="center">
                      <span className="font-mono text-xs text-ink dark:text-chalkboard-chalk">
                        {student.attemptsCount || 0}
                      </span>
                    </NotebookTableCell>

                    {/* Interventions */}
                    <NotebookTableCell align="center">
                      {student.openInterventions > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 text-cyan-900 border border-cyan-300 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-800">
                          <HeartHandshake className="w-3 h-3 text-cyan-700 dark:text-cyan-300" aria-hidden="true" />
                          <span>{student.openInterventions} Open</span>
                        </span>
                      ) : (
                        <span className="text-ink-muted dark:text-chalkboard-muted text-[11px] font-mono">—</span>
                      )}
                    </NotebookTableCell>

                    {/* Actions */}
                    <NotebookTableCell align="right">
                      <Link
                        to={`/teacher/classes/${classId}/students/${student.studentId}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-card dark:bg-chalkboard-card hover:bg-paper-warm dark:hover:bg-chalkboard-surface text-ink dark:text-chalkboard-chalk transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-redpen"
                      >
                        <span>Profile</span>
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
            totalItems={filteredAndSortedRoster.length}
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
