import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  BookOpen,
  GraduationCap,
  Sparkles,
  ArrowRight,
  Plus,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Layers,
  FileQuestion,
  Compass,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { studentService } from '../services/studentService';
import { Button, NotebookCard, PortalShell } from '../components/NotebookPrimitives';
import { StatusBadge } from '../components/MasteryPrimitives';

export default function StudentSubjectsHome() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [enrolledSubjects, setEnrolledSubjects] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [enrollingId, setEnrollingId] = useState(null);
  const [actionNotice, setActionNotice] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [enrolled, available] = await Promise.all([
        studentService.getEnrolledSubjects(),
        studentService.getAvailableSubjects().catch(() => []),
      ]);
      setEnrolledSubjects(enrolled);
      setAvailableSubjects(available);
    } catch (err) {
      if (err.status === 401 || err.message?.includes('authentication is required')) {
        logout();
        navigate('/login', { replace: true });
        return;
      }
      setError(err.message || 'Unable to load subjects. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEnroll = async (subject) => {
    setEnrollingId(subject.subjectId);
    setActionNotice(null);
    try {
      const newEnrollment = await studentService.enrollSubject(subject.subjectId);
      // Update local state
      setEnrolledSubjects((prev) => [newEnrollment, ...prev]);
      setAvailableSubjects((prev) => prev.filter((s) => s.subjectId !== subject.subjectId));
      setActionNotice({
        type: 'success',
        text: `Successfully enrolled in ${subject.name} (${subject.code})!`,
      });
      setEnrollModalOpen(false);
    } catch (err) {
      setActionNotice({
        type: 'error',
        text: err.message || `Could not enroll in ${subject.name}. Please try again.`,
      });
    } finally {
      setEnrollingId(null);
    }
  };

  return (
    <PortalShell
      portalSubtitle="Student Learning Notebook"
      user={user}
      onLogout={logout}
      badgeIcon={GraduationCap}
      badgeLabel="My Desk"
      badgeColorClass="bg-highlighter-mint text-ink"
      title={`My Subjects, ${user?.fullName?.split(' ')[0] || 'Student'}`}
      subtitle="Select a subject to take diagnostic tests, practice topic quizzes, and track your strengths and learning gaps."
      headerRight={
        availableSubjects.length > 0 && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setEnrollModalOpen(true)}
            className="self-start sm:self-center shrink-0"
          >
            <Plus className="w-4 h-4 mr-1" />
            <span>Browse & Enroll</span>
          </Button>
        )
      }
    >
      <div className="w-full space-y-8">
        {/* Action Notice Banner */}
        {actionNotice && (
          <div
            className={`p-4 rounded-xl border-2 flex items-center justify-between gap-4 transition-all ${
              actionNotice.type === 'success'
                ? 'border-highlighter-mint bg-highlighter-mintSoft text-ink'
                : 'border-redpen bg-redpen-soft text-redpen-dark'
            }`}
          >
            <div className="flex items-center gap-3">
              {actionNotice.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-ink shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-redpen-dark shrink-0" />
              )}
              <p className="text-sm font-semibold">{actionNotice.text}</p>
            </div>
            <button
              type="button"
              onClick={() => setActionNotice(null)}
              className="text-xs font-bold underline cursor-pointer p-1"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="py-20 text-center space-y-4">
            <RefreshCw className="w-9 h-9 animate-spin mx-auto text-redpen" />
            <p className="font-hand text-2xl text-ink-muted dark:text-chalkboard-muted">
              Opening your notebook desk and loading enrolled subjects…
            </p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="p-4 rounded-xl border-2 border-redpen bg-redpen-soft text-redpen-dark flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="text-sm font-semibold">{error}</p>
            </div>
            <Button size="sm" variant="secondary" onClick={loadData}>
              <RefreshCw className="w-3.5 h-3.5 mr-1" />
              Retry
            </Button>
          </div>
        )}

        {/* Content Loaded */}
        {!loading && !error && (
          <>
            {/* Empty State: Not enrolled in any subject */}
            {enrolledSubjects.length === 0 ? (
              <NotebookCard ruled marginLine lifted className="p-8 sm:p-12 text-center space-y-6">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-highlighter-yellowSoft border-2 border-ink dark:border-white/40 flex items-center justify-center shadow-notebook">
                  <BookOpen className="w-8 h-8 text-ink" aria-hidden="true" />
                </div>
                <div className="space-y-2 max-w-lg mx-auto">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-ink dark:text-chalkboard-chalk">
                    Your Study Desk is Ready
                  </h2>
                  <p className="text-sm sm:text-base text-ink-muted dark:text-chalkboard-muted leading-relaxed">
                    You are not currently enrolled in any subjects. Self-enroll in a subject below to begin your diagnostic assessment and uncover your learning strengths and gaps.
                  </p>
                </div>

                {/* Available Subjects Directly in Empty State */}
                {availableSubjects.length > 0 ? (
                  <div className="pt-6 max-w-4xl mx-auto text-left">
                    <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-ink-muted dark:text-chalkboard-muted mb-4 text-center">
                      Available Subjects for Self-Enrollment
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {availableSubjects.map((s) => (
                        <div
                          key={s.subjectId}
                          className="p-5 rounded-2xl bg-paper dark:bg-chalkboard-surface border-2 border-ink dark:border-white/30 shadow-notebook-sm hover:shadow-notebook transition-all flex flex-col justify-between space-y-4"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-mono text-xs font-bold uppercase px-2.5 py-1 rounded bg-highlighter-yellow text-ink border border-ink/20">
                                {s.code}
                              </span>
                              <span className="text-xs font-mono text-ink-muted dark:text-chalkboard-muted">
                                {s.topicCount} topics • {s.assessmentCount} quizzes
                              </span>
                            </div>
                            <h4 className="text-base font-bold text-ink dark:text-chalkboard-chalk">
                              {s.name}
                            </h4>
                            <p className="text-xs text-ink-muted dark:text-chalkboard-muted leading-relaxed line-clamp-2">
                              {s.description}
                            </p>
                          </div>

                          <Button
                            variant="primary"
                            size="sm"
                            disabled={enrollingId === s.subjectId}
                            onClick={() => handleEnroll(s)}
                            className="w-full"
                          >
                            {enrollingId === s.subjectId ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                                <span>Enrolling…</span>
                              </>
                            ) : (
                              <>
                                <Plus className="w-3.5 h-3.5 mr-1.5" />
                                <span>Enroll in {s.code}</span>
                              </>
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs font-mono text-ink-muted dark:text-chalkboard-muted">
                    No new subjects are currently available for self-enrollment. Check back soon!
                  </p>
                )}
              </NotebookCard>
            ) : (
              /* Enrolled Subjects Cards Grid */
              <div className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-ink dark:text-chalkboard-chalk tracking-tight">
                      Enrolled Subjects ({enrolledSubjects.length})
                    </h2>
                    <p className="text-xs sm:text-sm text-ink-muted dark:text-chalkboard-muted mt-0.5">
                      Open any subject notebook to see your study queue and diagnostic progress.
                    </p>
                  </div>
                  {availableSubjects.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEnrollModalOpen(true)}
                      className="hidden sm:inline-flex"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      <span>Enroll in Another Subject</span>
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {enrolledSubjects.map((subj) => (
                    <div
                      key={subj.subjectId}
                      className="rounded-2xl bg-paper-card dark:bg-chalkboard-card border-2 border-ink dark:border-white/35 shadow-notebook hover:shadow-lifted hover:-translate-y-1 transition-all flex flex-col justify-between overflow-hidden"
                    >
                      {/* Top Spiral Header strip */}
                      <div className="px-5 py-3 border-b border-ink/10 dark:border-white/10 bg-paper-warm/75 dark:bg-chalkboard-surface flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-extrabold uppercase px-2.5 py-0.5 rounded bg-highlighter-yellow text-ink border border-ink/20">
                          {subj.code}
                        </span>
                        <span className="font-mono text-[11px] text-ink-muted dark:text-chalkboard-muted flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {subj.enrolledAt ? new Date(subj.enrolledAt).toLocaleDateString() : 'Active'}
                        </span>
                      </div>

                      {/* Card Content */}
                      <div className="p-5 sm:p-6 space-y-4 flex-1 flex flex-col justify-between">
                        <div className="space-y-2">
                          <h3 className="text-lg font-bold text-ink dark:text-chalkboard-chalk leading-snug">
                            {subj.name}
                          </h3>
                          <p className="text-xs text-ink-muted dark:text-chalkboard-muted leading-relaxed line-clamp-2">
                            {subj.description}
                          </p>
                        </div>

                        {/* Status Summary & Study Next */}
                        <div className="space-y-3 pt-3 border-t border-ink/10 dark:border-white/10">
                          {/* Diagnostic One-line status */}
                          <div className="flex items-center justify-between gap-2 text-xs">
                            <span className="text-ink-muted dark:text-chalkboard-muted font-medium">Status:</span>
                            <span
                              className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                                subj.oneLineStatus === 'Not started yet'
                                  ? 'bg-paper-warm text-ink-muted border border-ink/20'
                                  : subj.oneLineStatus.includes('gap') && !subj.oneLineStatus.startsWith('0')
                                  ? 'bg-redpen-soft text-redpen-dark font-semibold'
                                  : 'bg-highlighter-mintSoft text-ink'
                              }`}
                            >
                              {subj.oneLineStatus}
                            </span>
                          </div>

                          {/* Study Next Pill */}
                          {subj.studyNextTopic ? (
                            <div className="p-2.5 rounded-xl bg-paper-warm/80 dark:bg-chalkboard-surface border border-ink/15 dark:border-white/15 space-y-1">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-bold font-mono uppercase text-redpen dark:text-red-400 flex items-center gap-1">
                                  <Sparkles className="w-3 h-3" /> Study Next
                                </span>
                                <StatusBadge status={subj.studyNextTopic.status} />
                              </div>
                              <p className="text-xs font-bold text-ink dark:text-chalkboard-chalk truncate">
                                {subj.studyNextTopic.topicName}
                              </p>
                            </div>
                          ) : (
                            <div className="p-2.5 rounded-xl bg-paper-warm/50 dark:bg-chalkboard-surface border border-dashed border-ink/20 dark:border-white/20 text-xs text-ink-muted dark:text-chalkboard-muted font-hand">
                              Take your diagnostic quiz to unlock tailored recommendations.
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-2 flex flex-col gap-2">
                          <Link
                            to={`/student/subjects/${subj.subjectId}`}
                            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm bg-redpen hover:bg-redpen-dark text-white border-2 border-ink shadow-notebook-sm hover:-translate-y-0.5 active:translate-y-0 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-redpen"
                          >
                            <span>Open Subject</span>
                            <ArrowRight className="w-4 h-4" />
                          </Link>

                          <Link
                            to={`/student/subjects/${subj.subjectId}/progress`}
                            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs font-bold text-ink dark:text-chalkboard-chalk hover:bg-paper-warm dark:hover:bg-chalkboard-surface transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-redpen"
                          >
                            <Compass className="w-3.5 h-3.5 text-ink-blue dark:text-highlighter-mint" />
                            <span>View Gap Analysis</span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Self-Enrollment Modal / Drawer */}
        {enrollModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 dark:bg-black/70 backdrop-blur-xs animate-in fade-in"
            role="dialog"
            aria-modal="true"
            aria-labelledby="enroll-modal-title"
          >
            <div className="w-full max-w-2xl rounded-2xl bg-paper dark:bg-chalkboard-surface border-2 border-ink dark:border-white/50 shadow-lifted p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between gap-4 border-b border-ink/15 dark:border-white/15 pb-4">
                <div className="space-y-1">
                  <h3
                    id="enroll-modal-title"
                    className="text-xl sm:text-2xl font-extrabold text-ink dark:text-chalkboard-chalk"
                  >
                    Browse & Enroll in Subjects
                  </h3>
                  <p className="text-xs sm:text-sm text-ink-muted dark:text-chalkboard-muted">
                    Choose an available course to add to your personal study desk.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEnrollModalOpen(false)}
                  className="p-2 rounded-lg border border-ink/20 dark:border-white/20 text-ink dark:text-chalkboard-chalk hover:bg-paper-warm dark:hover:bg-chalkboard-card font-bold text-xs"
                >
                  ✕ Close
                </button>
              </div>

              {availableSubjects.length === 0 ? (
                <div className="py-8 text-center space-y-2">
                  <p className="font-hand text-lg text-ink-muted dark:text-chalkboard-muted">
                    You are already enrolled in all currently offered subjects!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {availableSubjects.map((s) => (
                    <div
                      key={s.subjectId}
                      className="p-4 rounded-xl bg-paper-card dark:bg-chalkboard-card border-2 border-ink dark:border-white/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold uppercase px-2 py-0.5 rounded bg-highlighter-yellow text-ink border border-ink/20">
                            {s.code}
                          </span>
                          <span className="text-xs font-mono text-ink-muted dark:text-chalkboard-muted">
                            {s.topicCount} topics • {s.assessmentCount} published quizzes
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-ink dark:text-chalkboard-chalk">
                          {s.name}
                        </h4>
                        <p className="text-xs text-ink-muted dark:text-chalkboard-muted leading-relaxed">
                          {s.description}
                        </p>
                      </div>

                      <Button
                        variant="primary"
                        size="sm"
                        disabled={enrollingId === s.subjectId}
                        onClick={() => handleEnroll(s)}
                        className="sm:self-center shrink-0"
                      >
                        {enrollingId === s.subjectId ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                            <span>Enrolling…</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5 mr-1.5" />
                            <span>Enroll</span>
                          </>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </PortalShell>
  );
}

