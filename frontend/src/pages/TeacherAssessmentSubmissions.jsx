import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Users,
  CheckCircle2,
  Clock,
  FileCheck2,
  AlertCircle,
  BarChart3,
  CircleDashed,
  PenLine,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { teacherService } from '../services/teacherService';
import {
  PortalShell,
  NotebookCard,
  NotebookTable,
  NotebookTableHead,
  NotebookTableRow,
  NotebookTableHeaderCell,
  NotebookTableCell,
  SearchInput,
  PaginationControls,
  EmptyState,
  Button,
  NotebookButton,
  NotebookBackButton,
} from '../components/NotebookPrimitives';

const STATUS_BADGE_MAP = {
  NOT_STARTED: {
    label: 'Not Started',
    icon: CircleDashed,
    classes:
      'bg-ink/5 text-ink-muted border-ink/20 dark:bg-chalkboard-surface dark:text-chalkboard-muted dark:border-chalkboard-borderSubtle',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    icon: Clock,
    classes:
      'bg-highlighter-yellowSoft text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
  },
  NEEDS_GRADING: {
    label: 'Needs Grading',
    icon: PenLine,
    classes:
      'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/60 dark:text-blue-200 dark:border-blue-800',
  },
  GRADED: {
    label: 'Graded',
    icon: CheckCircle2,
    classes:
      'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
  },
};

export default function TeacherAssessmentSubmissions() {
  const { classId, assessmentId } = useParams();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const backToAssessmentsUrl = `/teacher/classes/${classId}?tab=assessments`;
  const selfUrl = `/teacher/classes/${classId}/assessments/${assessmentId}/submissions`;

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await teacherService.getAssessmentSubmissions(classId, assessmentId);
        if (active) {
          setData(res);
        }
      } catch (err) {
        if (!active) return;
        if (err.status === 401) {
          logout();
          navigate('/login', { replace: true });
          return;
        }
        if (err.status === 404) {
          setError('Assessment submissions not found for this class.');
          return;
        }
        setError(err.message || 'Failed to load assessment submissions.');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [classId, assessmentId, logout, navigate]);

  const submissions = data?.submissions || [];

  const filteredSubmissions = useMemo(() => {
    let list = submissions;
    if (statusFilter !== 'ALL') {
      list = list.filter((row) => row.status === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (row) =>
          (row.studentName && row.studentName.toLowerCase().includes(q)) ||
          (row.studentEmail && row.studentEmail.toLowerCase().includes(q))
      );
    }
    return list;
  }, [submissions, statusFilter, searchQuery]);

  const paginatedSubmissions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSubmissions.slice(start, start + pageSize);
  }, [filteredSubmissions, currentPage, pageSize]);

  const formatDateTime = (isoString) => {
    if (!isoString) return '—';
    try {
      return new Date(isoString).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const openAttemptReview = (row) => {
    if (!row.attemptId) return;
    navigate(`/teacher/classes/${classId}/students/${row.studentId}/attempts/${row.attemptId}`, {
      state: {
        returnTo: selfUrl,
        returnLabel: 'Back to Assessment Submissions',
      },
    });
  };

  const renderBody = () => (
    <>

      {/* Loading State */}
      {loading && (
        <div className="space-y-4">
          <div className="h-24 rounded-2xl bg-paper-card dark:bg-chalkboard-card border-2 border-ink/20 animate-pulse" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 rounded-2xl bg-paper-card dark:bg-chalkboard-card border-2 border-ink/20 animate-pulse"
              />
            ))}
          </div>
          <div className="h-72 rounded-2xl bg-paper-card dark:bg-chalkboard-card border-2 border-ink/20 animate-pulse" />
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <NotebookCard pattern="ruled" borderStyle="sketch" className="p-6 text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-redpen mx-auto" aria-hidden="true" />
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-ink dark:text-chalkboard-chalk">
              Unable to Load Submissions
            </h2>
            <p className="text-sm text-ink-muted dark:text-chalkboard-muted">{error}</p>
          </div>
          <NotebookBackButton to={backToAssessmentsUrl} label="Return to Class Assessments" />
        </NotebookCard>
      )}

      {/* Main Content */}
      {!loading && !error && data && (
        <>
          {/* Quick Summary Metrics Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Enrolled', value: data.totalEnrolled, Icon: Users },
              { label: 'Submitted', value: `${data.submittedCount} / ${data.totalEnrolled}`, Icon: FileCheck2 },
              { label: 'Needs Grading', value: data.needsGradingCount, Icon: PenLine },
              { label: 'Class Average', value: data.classAverage != null ? `${data.classAverage}%` : '—', Icon: BarChart3 },
            ].map(({ label, value, Icon }) => (
              <div
                key={label}
                className="bg-paper-card dark:bg-chalkboard-card border-2 border-ink dark:border-chalkboard-border shadow-paper rounded-2xl p-4 flex items-center gap-3.5"
              >
                <div className="w-10 h-10 rounded-xl bg-paper-warm dark:bg-chalkboard-surface border border-ink/15 dark:border-chalkboard-borderSubtle flex items-center justify-center shrink-0 text-ink dark:text-chalkboard-chalk">
                  <Icon className="w-5 h-5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-ink-muted dark:text-chalkboard-muted truncate">
                    {label}
                  </p>
                  <p className="text-2xl font-extrabold tabular-nums text-ink dark:text-chalkboard-chalk leading-tight mt-0.5">
                    {value}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Filter Pills & Search Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-4 rounded-2xl bg-paper-card dark:bg-chalkboard-card border-2 border-ink dark:border-chalkboard-border shadow-notebook-sm">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'ALL', label: `All Students (${data.totalEnrolled})` },
                { id: 'NEEDS_GRADING', label: `Needs Grading (${data.needsGradingCount})` },
                { id: 'GRADED', label: `Graded (${data.gradedCount})` },
                { id: 'IN_PROGRESS', label: `In Progress (${data.inProgressCount})` },
                { id: 'NOT_STARTED', label: `Not Started (${data.notStartedCount})` },
              ].map((pill) => (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => {
                    setStatusFilter(pill.id);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer border ${
                    statusFilter === pill.id
                      ? 'bg-ink text-white dark:bg-highlighter-mint dark:text-ink border-ink dark:border-chalkboard-border shadow-xs'
                      : 'bg-paper-warm dark:bg-chalkboard-surface text-ink-muted dark:text-chalkboard-muted border-ink/20 dark:border-chalkboard-borderSubtle hover:text-ink'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            <SearchInput
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search student name or email…"
              ariaLabel="Search students by name or email"
              className="w-full lg:w-72"
            />
          </div>

          {/* Submissions Table */}
          {filteredSubmissions.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No Students Match"
              message={
                searchQuery || statusFilter !== 'ALL'
                  ? 'No enrolled students match your current filter or search query.'
                  : 'No students are currently enrolled in this class section.'
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
                    className="px-3 py-1.5 rounded-xl text-xs font-bold border-2 border-ink dark:border-chalkboard-border bg-paper-card dark:bg-chalkboard-card text-ink dark:text-chalkboard-chalk hover:bg-paper-warm dark:hover:bg-chalkboard-surface cursor-pointer"
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
                    <NotebookTableHeaderCell>Student</NotebookTableHeaderCell>
                    <NotebookTableHeaderCell align="center">Submission Status</NotebookTableHeaderCell>
                    <NotebookTableHeaderCell align="center">Submitted At</NotebookTableHeaderCell>
                    <NotebookTableHeaderCell align="center">Score</NotebookTableHeaderCell>
                    <NotebookTableHeaderCell align="right">Action</NotebookTableHeaderCell>
                  </NotebookTableRow>
                </NotebookTableHead>
                <tbody className="divide-y divide-ink/10 dark:divide-chalkboard-borderSubtle">
                  {paginatedSubmissions.map((row) => {
                    const badge = STATUS_BADGE_MAP[row.status] || STATUS_BADGE_MAP.NOT_STARTED;
                    const StatusIcon = badge.icon;
                    const isNeedsGrading = row.status === 'NEEDS_GRADING';
                    const isGraded = row.status === 'GRADED';

                    return (
                      <NotebookTableRow key={row.studentId}>
                        {/* Student Name & Email */}
                        <NotebookTableCell>
                          <div className="min-w-0">
                            <p className="font-bold text-sm text-ink dark:text-chalkboard-chalk truncate">
                              {row.studentName}
                            </p>
                            <p className="text-xs font-mono text-ink-muted dark:text-chalkboard-muted truncate">
                              {row.studentEmail}
                            </p>
                          </div>
                        </NotebookTableCell>

                        {/* Submission Status */}
                        <NotebookTableCell align="center">
                          <div className="inline-flex flex-col items-center gap-1">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold border ${badge.classes}`}
                            >
                              <StatusIcon className="w-3 h-3" aria-hidden="true" />
                              <span>{badge.label}</span>
                            </span>
                            {isNeedsGrading && row.ungradedEssayCount > 0 && (
                              <span className="text-[10px] font-mono text-blue-700 dark:text-blue-300">
                                {row.ungradedEssayCount} essay{row.ungradedEssayCount === 1 ? '' : 's'} pending
                              </span>
                            )}
                          </div>
                        </NotebookTableCell>

                        {/* Submitted Date/Time */}
                        <NotebookTableCell align="center">
                          <span className="font-mono text-xs text-ink-muted dark:text-chalkboard-muted">
                            {formatDateTime(row.submittedAt)}
                          </span>
                        </NotebookTableCell>

                        {/* Score */}
                        <NotebookTableCell align="center">
                          {isGraded && row.finalScore != null ? (
                            <span className="font-mono text-xs font-bold text-ink dark:text-chalkboard-chalk">
                              {row.finalScore} / {row.maxScore}{' '}
                              <span className="text-ink-muted dark:text-chalkboard-muted font-normal">
                                ({row.percentage}%)
                              </span>
                            </span>
                          ) : isNeedsGrading ? (
                            <span className="font-mono text-xs font-bold text-blue-700 dark:text-blue-300">
                              Awaiting Grading
                            </span>
                          ) : (
                            <span className="font-mono text-xs text-ink-muted dark:text-chalkboard-muted">
                              —
                            </span>
                          )}
                        </NotebookTableCell>

                        {/* Action */}
                        <NotebookTableCell align="right">
                          {isNeedsGrading ? (
                            <NotebookButton
                              variant="primary"
                              size="sm"
                              onClick={() => openAttemptReview(row)}
                              iconRight={ArrowRight}
                            >
                              Grade Attempt
                            </NotebookButton>
                          ) : isGraded ? (
                            <NotebookButton
                              variant="secondary"
                              size="sm"
                              onClick={() => openAttemptReview(row)}
                              iconRight={ArrowRight}
                            >
                              Review / Override
                            </NotebookButton>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-mono text-ink-muted dark:text-chalkboard-muted bg-ink/5 dark:bg-chalkboard-surface border border-ink/10 dark:border-chalkboard-borderSubtle">
                              Not Submitted
                            </span>
                          )}
                        </NotebookTableCell>
                      </NotebookTableRow>
                    );
                  })}
                </tbody>
              </NotebookTable>

              <PaginationControls
                currentPage={currentPage}
                pageSize={pageSize}
                totalItems={filteredSubmissions.length}
                onPageChange={setCurrentPage}
                onPageSizeChange={(newSize) => {
                  setPageSize(newSize);
                  setCurrentPage(1);
                }}
                pageSizeOptions={[10, 25, 50]}
              />
            </div>
          )}
        </>
      )}
    </>
  );

  const assessmentMetaText = data
    ? `${data.className} • ${data.questionCount} question${data.questionCount === 1 ? '' : 's'} (${data.totalPoints} pts)${
        data.essayCount > 0 ? ` • ${data.essayCount} essay${data.essayCount === 1 ? '' : 's'}` : ''
      }`
    : '';

  const renderBackLink = () => (
    <NotebookBackButton to={backToAssessmentsUrl} label="Back to Class Assessments" />
  );

  return (
    <PortalShell
      portalSubtitle="Teacher Gradebook"
      user={user}
      onLogout={logout}
      badgeIcon={FileCheck2}
      badgeLabel={data ? `Assessment Submissions Roster • ${data.className}` : 'Assessment Submissions Roster'}
      badgeColorClass="bg-highlighter-mint text-ink"
      title={data ? data.title : 'Assessment Submissions'}
      subtitle={
        data
          ? `${assessmentMetaText}${data.description ? ` — ${data.description}` : ''}`
          : undefined
      }
      headerRight={
        <div className="flex flex-col items-end gap-2 shrink-0">
          {renderBackLink()}
          {data && (
            <div className="flex items-center gap-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold border border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-warm dark:bg-chalkboard-surface text-ink dark:text-chalkboard-chalk">
                {data.status}
              </span>
              {data.timeLimitMinutes && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono border border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-card dark:bg-chalkboard-card text-ink-muted dark:text-chalkboard-muted">
                  {data.timeLimitMinutes} min limit
                </span>
              )}
            </div>
          )}
        </div>
      }
    >
      <div className="w-full space-y-6">
        {renderBody()}
      </div>
    </PortalShell>
  );
}
