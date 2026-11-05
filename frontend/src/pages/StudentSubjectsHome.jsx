import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
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
  Archive,
  UserCheck,
  X,
  Clock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { studentService } from '../services/studentService';
import { Button, NotebookCard, PortalShell } from '../components/NotebookPrimitives';

export default function StudentSubjectsHome() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Join Class Modal State
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [actionNotice, setActionNotice] = useState(null);
  const [highlightedClassId, setHighlightedClassId] = useState(null);

  // Accessibility refs for modal focus management
  const modalInputRef = useRef(null);
  const joinButtonRef = useRef(null);
  const newlyJoinedCardRef = useRef(null);

  const loadClasses = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await studentService.getClasses();
      setClasses(data);
    } catch (err) {
      if (err.status === 401 || err.message?.includes('authentication is required')) {
        logout();
        navigate('/login', { replace: true });
        return;
      }
      setError(err.message || 'Unable to load your enrolled classes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClasses();
  }, []);

  // Trap focus inside modal when opened
  useEffect(() => {
    if (joinModalOpen) {
      setTimeout(() => modalInputRef.current?.focus(), 50);
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          handleCloseModal();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [joinModalOpen]);

  // Focus newly joined card after modal closes
  useEffect(() => {
    if (highlightedClassId && newlyJoinedCardRef.current) {
      newlyJoinedCardRef.current.focus();
    }
  }, [highlightedClassId]);

  const handleOpenModal = () => {
    setJoinCode('');
    setJoinError('');
    setJoinModalOpen(true);
  };

  const handleCloseModal = () => {
    setJoinModalOpen(false);
    setJoinError('');
    joinButtonRef.current?.focus();
  };

  const handleJoinCodeChange = (e) => {
    const cleanValue = e.target.value.toUpperCase().replace(/[^2-9A-HJ-NP-Z]/g, '').slice(0, 6);
    setJoinCode(cleanValue);
    if (joinError) setJoinError('');
  };

  const handleJoinSubmit = async (e) => {
    e.preventDefault();
    if (!joinCode || joinCode.length < 6) {
      setJoinError('Please enter a complete 6-character join code.');
      return;
    }

    setJoining(true);
    setJoinError('');
    setActionNotice(null);

    try {
      const summary = await studentService.joinClass(joinCode);
      setJoinModalOpen(false);

      // Refresh classes list
      const refreshedList = await studentService.getClasses();
      setClasses(refreshedList);

      setHighlightedClassId(summary.classId);
      setActionNotice({
        type: 'success',
        text: `Successfully joined ${summary.sectionName} for ${summary.subject.name}!`,
      });
    } catch (err) {
      setJoinError(err.message || 'Could not join class. Please check your code and try again.');
    } finally {
      setJoining(false);
    }
  };

  // Group into Active and Archived classes
  const activeClasses = classes.filter((c) => c.status === 'ACTIVE');
  const pastClasses = classes.filter((c) => c.status === 'ARCHIVED');

  const institutionLabel = user?.institutionName
    ? `${user.institutionName} (${user.institutionCode || 'PILOT-2026'})`
    : 'Pilot University';

  return (
    <PortalShell
      portalSubtitle="Student Classroom Workspace"
      skipLabel="Skip to enrolled class cards"
      user={user}
      onLogout={logout}
      badgeIcon={GraduationCap}
      badgeLabel="My Desk"
      badgeColorClass="bg-highlighter-mint text-ink"
      title={`My Classes, ${user?.fullName?.split(' ')[0] || 'Student'}`}
      subtitle={`Enrolled sections at ${institutionLabel}. Take quizzes, track topic mastery, and eliminate learning gaps.`}
      headerRight={
        <Button
          ref={joinButtonRef}
          variant="primary"
          size="sm"
          onClick={handleOpenModal}
          className="self-start sm:self-center shrink-0 font-bold"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span>+ Join a Class</span>
        </Button>
      }
    >
      <div className="w-full space-y-8">
        {/* Action Notice Alert */}
        {actionNotice && (
          <div
            role="status"
            aria-live="polite"
            className={`flex items-center gap-3 p-4 rounded-xl border-2 font-medium text-sm shadow-sm ${
              actionNotice.type === 'success'
                ? 'border-ink bg-highlighter-mintSoft text-ink dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-500/40'
                : 'border-redpen bg-redpen-soft text-redpen-dark'
            }`}
          >
            {actionNotice.type === 'success' ? (
              <UserCheck className="w-5 h-5 text-ink-blue dark:text-highlighter-mint shrink-0" aria-hidden="true" />
            ) : (
              <AlertCircle className="w-5 h-5 text-redpen shrink-0" aria-hidden="true" />
            )}
            <span>{actionNotice.text}</span>
          </div>
        )}

        {/* Global Error Banner */}
        {error && (
          <div
            role="alert"
            className="flex items-center justify-between gap-3 p-4 rounded-xl border-2 border-redpen bg-redpen-soft text-redpen-dark text-sm"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
            <Button variant="secondary" size="sm" onClick={loadClasses}>
              Retry
            </Button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="py-20 text-center space-y-4">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-redpen" aria-hidden="true" />
            <p className="font-hand text-2xl text-ink dark:text-chalkboard-chalk">
              Loading your classroom notebooks and diagnostic results...
            </p>
          </div>
        )}

        {/* Empty State: No classes enrolled */}
        {!loading && !error && classes.length === 0 && (
          <NotebookCard ruled marginLine className="text-center py-12 px-4 space-y-4 max-w-xl mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-highlighter-yellow/30 border-2 border-ink dark:border-chalkboard-border flex items-center justify-center mx-auto">
              <GraduationCap className="w-8 h-8 text-ink dark:text-chalkboard-chalk" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-extrabold text-ink dark:text-chalkboard-chalk tracking-tight">
                No Classes Enrolled Yet
              </h2>
              <p className="text-sm text-ink-muted dark:text-chalkboard-muted max-w-md mx-auto leading-relaxed">
                Ask your instructor for your 6-character class join code to access diagnostic exams and topic study materials.
              </p>
            </div>
            <Button variant="primary" size="md" onClick={handleOpenModal} className="mt-2">
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>Join Your First Class</span>
            </Button>
          </NotebookCard>
        )}

        {/* Active Classes Grid */}
        {!loading && activeClasses.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-ink/15 dark:border-chalkboard-borderSubtle pb-2">
              <h2 className="text-lg font-bold font-sans text-ink dark:text-chalkboard-chalk flex items-center gap-2">
                <span>Active Classes</span>
                <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-highlighter-mintSoft text-ink dark:bg-emerald-950 dark:text-emerald-300 font-bold">
                  {activeClasses.length}
                </span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeClasses.map((cls) => {
                const isHighlighted = cls.classId === highlightedClassId;
                return (
                  <div
                    key={cls.classId}
                    ref={isHighlighted ? newlyJoinedCardRef : null}
                    tabIndex={isHighlighted ? -1 : undefined}
                    className={`rounded-2xl border-2 bg-paper-card dark:bg-chalkboard-card p-6 flex flex-col justify-between space-y-5 shadow-paper hover:shadow-lifted transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-redpen ${
                      isHighlighted
                        ? 'border-ink-blue ring-2 ring-ink-blue/40'
                        : 'border-ink dark:border-chalkboard-border'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-mono text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-warm dark:bg-chalkboard-surface text-ink dark:text-chalkboard-chalk">
                          {cls.subject.code}
                        </span>
                        <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold uppercase text-emerald-800 dark:text-emerald-300 bg-highlighter-mintSoft dark:bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-600/30">
                          Active
                        </span>
                      </div>

                      <div>
                        <h3 className="text-xl font-extrabold text-ink dark:text-chalkboard-chalk tracking-tight">
                          {cls.sectionName}
                        </h3>
                        <p className="text-xs font-medium text-ink-muted dark:text-chalkboard-muted mt-0.5">
                          {cls.subject.name}
                        </p>
                      </div>

                      <div className="text-xs font-mono text-ink-muted dark:text-chalkboard-muted flex items-center gap-1">
                        <span>Instructor:</span>
                        <span className="font-bold text-ink dark:text-chalkboard-chalk">
                          {cls.teacherName}
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-paper-warm/80 dark:bg-chalkboard-surface border border-ink/15 dark:border-chalkboard-borderSubtle space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-ink-muted dark:text-chalkboard-muted">Diagnostic Status:</span>
                          <span className="font-bold text-ink dark:text-chalkboard-chalk">{cls.oneLineStatus}</span>
                        </div>

                        {cls.studyNext && (
                          <div className="flex items-center justify-between text-xs font-mono pt-1 border-t border-ink/10 dark:border-chalkboard-borderSubtle">
                            <span className="text-ink-muted dark:text-chalkboard-muted">Study Next:</span>
                            <span className="font-bold text-redpen dark:text-highlighter-yellow truncate max-w-[150px]" title={cls.studyNext.topicName}>
                              {cls.studyNext.topicName}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <Button
                      to={`/student/classes/${cls.classId}`}
                      variant="primary"
                      size="sm"
                      className="w-full justify-between mt-2"
                    >
                      <span>Open Class Workspace</span>
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Past Classes (Archived) Section */}
        {!loading && pastClasses.length > 0 && (
          <div className="space-y-4 pt-6 border-t-2 border-dashed border-ink/20 dark:border-chalkboard-borderSubtle">
            <div className="space-y-1">
              <h2 className="text-lg font-bold font-sans text-ink-muted dark:text-chalkboard-muted flex items-center gap-2">
                <Archive className="w-4 h-4" aria-hidden="true" />
                <span>Past Classes</span>
                <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-paper-warm dark:bg-chalkboard-surface text-ink-muted dark:text-chalkboard-muted font-bold border border-ink/15 dark:border-chalkboard-borderSubtle">
                  {pastClasses.length}
                </span>
              </h2>
              <p className="text-xs text-ink-muted dark:text-chalkboard-muted">
                These sections have concluded. All your historical quiz attempts, feedback, and progress remain accessible in read-only mode.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-75 hover:opacity-100 transition-opacity">
              {pastClasses.map((cls) => (
                <div
                  key={cls.classId}
                  className="rounded-2xl border-2 border-dashed border-ink/30 dark:border-chalkboard-borderSubtle bg-paper-warm/50 dark:bg-chalkboard-surface/50 p-6 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-ink/20 dark:border-chalkboard-borderSubtle bg-paper dark:bg-chalkboard text-ink-muted dark:text-chalkboard-muted">
                        {cls.subject.code}
                      </span>
                      <span className="font-mono text-[10px] uppercase font-bold text-ink-muted dark:text-chalkboard-muted border border-ink/20 dark:border-chalkboard-borderSubtle px-2 py-0.5 rounded">
                        Archived
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-ink dark:text-chalkboard-chalk">
                        {cls.sectionName}
                      </h3>
                      <p className="text-xs text-ink-muted dark:text-chalkboard-muted">
                        {cls.subject.name} • {cls.teacherName}
                      </p>
                    </div>

                    <div className="text-xs font-mono text-ink-muted dark:text-chalkboard-muted">
                      Result: <span className="font-bold text-ink dark:text-chalkboard-chalk">{cls.oneLineStatus}</span>
                    </div>
                  </div>

                  <Button
                    to={`/student/classes/${cls.classId}`}
                    variant="secondary"
                    size="sm"
                    className="w-full justify-between text-xs"
                  >
                    <span>View Past Results</span>
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Accessible Join Class Modal */}
      {joinModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="join-class-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 dark:bg-black/70 backdrop-blur-xs animate-fadeIn"
        >
          <div className="relative w-full max-w-md bg-paper dark:bg-chalkboard border-2 border-ink dark:border-chalkboard-border rounded-2xl shadow-lifted p-6 space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-ink/15 dark:border-chalkboard-borderSubtle">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-highlighter-mint flex items-center justify-center border border-ink text-ink font-bold">
                  <Plus className="w-4 h-4" aria-hidden="true" />
                </div>
                <h2 id="join-class-modal-title" className="text-lg font-extrabold text-ink dark:text-chalkboard-chalk">
                  Join a Class Section
                </h2>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={joining}
                className="p-1 rounded-lg text-ink-muted dark:text-chalkboard-muted hover:text-ink dark:hover:text-chalkboard-chalk hover:bg-paper-warm dark:hover:bg-chalkboard-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-redpen"
                aria-label="Close join class modal"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleJoinSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="join-code-input"
                  className="block text-xs font-mono font-bold uppercase tracking-wider text-ink dark:text-chalkboard-chalk"
                >
                  6-Character Join Code <span className="text-redpen">*</span>
                </label>
                <input
                  ref={modalInputRef}
                  id="join-code-input"
                  name="code"
                  type="text"
                  maxLength={6}
                  required
                  autoComplete="off"
                  value={joinCode}
                  onChange={handleJoinCodeChange}
                  placeholder="e.g. 7K2M9X"
                  className="w-full min-h-[46px] px-4 py-2 text-center font-mono text-2xl font-black tracking-widest uppercase rounded-xl border-2 border-ink dark:border-chalkboard-border bg-paper-card dark:bg-chalkboard-surface text-ink dark:text-chalkboard-chalk placeholder:text-ink-light dark:placeholder:text-chalkboard-muted/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-redpen"
                  aria-describedby={joinError ? 'join-code-error' : 'join-code-hint'}
                />
                <p id="join-code-hint" className="text-[11px] font-mono text-ink-muted dark:text-chalkboard-muted">
                  Ask your course teacher for this code. Letters and numbers only (excluding 0, 1, O, I).
                </p>
                {joinError && (
                  <p id="join-code-error" role="alert" className="text-xs text-redpen font-bold flex items-center gap-1.5 pt-1">
                    <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>{joinError}</span>
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleCloseModal}
                  disabled={joining}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={joining || joinCode.length < 6}
                >
                  {joining ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                      <span>Verifying Code…</span>
                    </>
                  ) : (
                    <span>Join Class</span>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PortalShell>
  );
}
