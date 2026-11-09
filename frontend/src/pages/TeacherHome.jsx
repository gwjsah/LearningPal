import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  BookOpenCheck,
  BookOpen,
  Users,
  Plus,
  Copy,
  Check,
  ArrowRight,
  Sparkles,
  AlertCircle,
  RefreshCw,
  FolderOpen,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { teacherService } from '../services/teacherService';
import {
  Button,
  NotebookCard,
  PortalShell,
} from '../components/NotebookPrimitives';

export default function TeacherHome() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [subjectSuggestions, setSubjectSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [surveyDismissed, setSurveyDismissed] = useState(() => {
    return localStorage.getItem('learningpal_survey_dismissed_v1') === 'true';
  });

  const handleDismissSurvey = () => {
    localStorage.setItem('learningpal_survey_dismissed_v1', 'true');
    setSurveyDismissed(true);
  };

  // Creation Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [name, setName] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // Copy Feedback State (classId -> boolean)
  const [copiedId, setCopiedId] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [classesData, subjectsData] = await Promise.all([
        teacherService.getClasses(),
        teacherService.getTeacherSubjects().catch(() => []),
      ]);
      setClasses(classesData);
      setSubjects(subjectsData || []);
    } catch (err) {
      if (err.status === 401) {
        logout();
        navigate('/login', { replace: true });
        return;
      }
      setError(err.message || 'Unable to load teacher classes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCopyCode = async (code, id) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
    } catch {
      // fallback
    }
  };

  const activeSubjects = subjects.filter((s) => s.status === 'ACTIVE');

  const handleOpenCreateModal = () => {
    setCreateError('');
    if (activeSubjects.length > 0 && !selectedSubjectId) {
      setSelectedSubjectId(activeSubjects[0].id.toString());
    }
    setShowModal(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSubjectId) {
      setCreateError('Please select a subject from your list.');
      return;
    }
    const selectedSubject = activeSubjects.find((s) => s.id.toString() === selectedSubjectId.toString());
    if (!selectedSubject) {
      setCreateError('Please select a valid subject from your list.');
      return;
    }
    const trimmedName = name.trim();
    if (!trimmedName) {
      setCreateError('Please provide a class/section name (e.g. "Section A").');
      return;
    }
    if (trimmedName.length > 60) {
      setCreateError('Class name cannot exceed 60 characters.');
      return;
    }

    setCreateLoading(true);
    setCreateError('');
    try {
      const newClass = await teacherService.createClass({
        subjectId: selectedSubject.id,
        subjectName: selectedSubject.name,
        name: trimmedName,
      });

      // Insert at the front of the list
      setClasses((prev) => [newClass, ...prev]);
      setShowModal(false);
      setName('');
      setSuccessToast(`Class "${newClass.name}" created! Share code ${newClass.joinCode} with your students.`);
      setTimeout(() => setSuccessToast(''), 5000);
    } catch (err) {
      setCreateError(err.message || 'Failed to create class section.');
    } finally {
      setCreateLoading(false);
    }
  };

  const activeClasses = classes.filter((c) => c.status === 'ACTIVE');
  const archivedClasses = classes.filter((c) => c.status === 'ARCHIVED');

  return (
    <PortalShell
      portalSubtitle="Teacher Gradebook"
      skipLabel="Skip to teacher classroom workspace"
      user={user}
      onLogout={logout}
      badgeIcon={BookOpenCheck}
      badgeLabel="Instructor Workspace"
      badgeColorClass="bg-highlighter-mint text-ink"
      title={`Welcome, ${user?.fullName || 'Teacher'}!`}
      subtitle="Manage your class sections, distribute student join codes, and view class rosters."
      headerRight={
        <div className="flex items-center gap-2.5">
          <Button
            to="/teacher/subjects"
            variant="secondary"
            size="md"
            className="flex items-center gap-1.5 shadow-notebook-sm"
          >
            <BookOpen className="w-4 h-4 text-ink-muted dark:text-chalkboard-muted" />
            <span>My Subjects</span>
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleOpenCreateModal}
            className="flex items-center gap-1.5 shadow-notebook"
          >
            <Plus className="w-4 h-4" />
            <span>New Class</span>
          </Button>
        </div>
      }
    >
      <div className="w-full space-y-8">
        {/* Success Banner */}
        {successToast && (
          <div
            role="status"
            className="p-4 rounded-xl border-2 border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 flex items-center justify-between"
          >
            <div className="flex items-center gap-2 text-sm font-bold">
              <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>{successToast}</span>
            </div>
            <button
              onClick={() => setSuccessToast('')}
              className="text-xs uppercase font-mono font-bold hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="py-20 text-center space-y-4">
            <RefreshCw className="w-9 h-9 animate-spin mx-auto text-redpen" />
            <p className="font-hand text-2xl text-ink-muted dark:text-chalkboard-muted">
              Loading your classes…
            </p>
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="p-5 rounded-2xl border-2 border-redpen bg-redpen-soft text-redpen-dark flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold">{error}</p>
                <p className="text-xs mt-0.5">Please check your network connection or try again.</p>
              </div>
            </div>
            <Button size="sm" variant="primary" onClick={loadData}>
              <RefreshCw className="w-3.5 h-3.5 mr-1" />
              Retry
            </Button>
          </div>
        )}

        {/* Content loaded */}
        {!loading && !error && (
          <>
            {classes.length === 0 ? (
              /* Empty state */
              <NotebookCard
                pattern="ruled"
                borderStyle="sketch"
                className="p-12 text-center space-y-4 bg-paper-card dark:bg-chalkboard-card"
              >
                <div className="w-14 h-14 rounded-2xl bg-highlighter-yellow/30 border border-ink/20 flex items-center justify-center mx-auto">
                  <FolderOpen className="w-7 h-7 text-ink-muted dark:text-chalkboard-muted" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-ink dark:text-chalkboard-chalk">
                    You don't have any classes yet
                  </h3>
                  <p className="text-sm text-ink-muted dark:text-chalkboard-muted max-w-md mx-auto">
                    Create your first class section to get a unique 6-character join code for your students.
                  </p>
                </div>
                <div className="pt-2">
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleOpenCreateModal}
                    className="shadow-notebook"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    <span>Create Your First Class</span>
                  </Button>
                </div>
              </NotebookCard>
            ) : (
              <div className="space-y-8">
                {/* Dismissible Usability Survey Invitation */}
                {!surveyDismissed && (
                  <div className="p-4 sm:p-5 rounded-2xl border-2 border-ink dark:border-chalkboard-border bg-paper-card dark:bg-chalkboard-card shadow-notebook-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className="p-2.5 rounded-xl bg-highlighter-yellow/30 border border-ink/20 dark:border-chalkboard-borderSubtle text-redpen dark:text-highlighter-yellow shrink-0">
                        <Sparkles className="w-5 h-5" aria-hidden="true" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-highlighter-yellow text-ink border border-ink/20">
                            Teacher Usability Survey
                          </span>
                          <h3 className="text-sm sm:text-base font-bold text-ink dark:text-chalkboard-chalk">
                            Help us improve LearningPal · 2-minute usability survey
                          </h3>
                        </div>
                        <p className="text-xs text-ink-muted dark:text-chalkboard-muted max-w-2xl leading-relaxed">
                          Rate teacher roster management, gap analytics, and workflow simplicity to help evaluate our target usability threshold (≥ 4.0 / 5.0).
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <button
                        type="button"
                        onClick={handleDismissSurvey}
                        className="px-3 py-1.5 text-xs font-mono font-bold text-ink-muted dark:text-chalkboard-muted hover:text-ink dark:hover:text-chalkboard-chalk transition-colors cursor-pointer"
                      >
                        Dismiss
                      </button>
                      <Button
                        to="/feedback/survey"
                        variant="mint"
                        size="sm"
                        className="font-bold text-xs"
                      >
                        <span>Take Survey</span>
                        <ArrowRight className="w-3.5 h-3.5 ml-1" aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Active Classes Grid */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-ink dark:text-chalkboard-chalk flex items-center gap-2">
                        <span>Active Classes</span>
                        <span className="text-sm font-mono font-normal text-ink-muted dark:text-chalkboard-muted">
                          ({activeClasses.length})
                        </span>
                      </h2>
                      <p className="text-xs sm:text-sm text-ink-muted dark:text-chalkboard-muted">
                        Active sections currently open for student diagnostics and learning.
                      </p>
                    </div>
                  </div>

                  {activeClasses.length === 0 ? (
                    <NotebookCard className="p-6 text-center text-xs text-ink-muted dark:text-chalkboard-muted">
                      No active classes. All sections are currently archived.
                    </NotebookCard>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {activeClasses.map((cls) => {
                        const isCopied = copiedId === cls.id;
                        return (
                          <NotebookCard
                            key={cls.id}
                            pattern="grid"
                            borderStyle="sketch"
                            className="flex flex-col justify-between p-6 space-y-5 bg-paper-card dark:bg-chalkboard-card hover:shadow-notebook transition-shadow"
                          >
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-mono font-bold uppercase px-2 py-0.5 rounded bg-highlighter-yellow/30 text-ink border border-ink/20">
                                  {cls.subject.code}
                                </span>
                                <span className="text-[11px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                                  Active
                                </span>
                              </div>

                              <div>
                                <h3 className="font-bold text-xl text-ink dark:text-chalkboard-chalk leading-snug">
                                  {cls.name}
                                </h3>
                                <p className="text-xs text-ink-muted dark:text-chalkboard-muted mt-0.5">
                                  {cls.subject.name}
                                </p>
                              </div>

                              {/* Prominent Monospace Join Code Box */}
                              <div className="p-3 rounded-xl bg-paper-warm dark:bg-chalkboard-surface border-2 border-ink dark:border-chalkboard-border space-y-1.5">
                                <span className="block text-[10px] font-mono font-bold uppercase tracking-wider text-ink-muted dark:text-chalkboard-muted">
                                  Student Join Code
                                </span>
                                <div className="flex items-center justify-between">
                                  <span className="font-mono text-xl sm:text-2xl tracking-wider font-extrabold text-redpen dark:text-highlighter-yellow select-all">
                                    {cls.joinCode}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyCode(cls.joinCode, cls.id)}
                                    aria-label={`Copy join code for ${cls.name}`}
                                    className="p-1.5 rounded-lg border border-ink/30 dark:border-chalkboard-borderSubtle bg-paper-card dark:bg-chalkboard-card hover:bg-highlighter-yellow/30 text-ink dark:text-chalkboard-chalk transition-colors cursor-pointer"
                                    title="Copy code"
                                  >
                                    {isCopied ? (
                                      <Check className="w-4 h-4 text-emerald-700" />
                                    ) : (
                                      <Copy className="w-4 h-4" />
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>

                            <div className="pt-3 border-t border-ink/10 dark:border-chalkboard-borderSubtle flex items-center justify-between">
                              <Link
                                to={`/teacher/classes/${cls.id}`}
                                className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-ink-muted dark:text-chalkboard-muted hover:text-ink dark:hover:text-chalkboard-chalk"
                              >
                                <Users className="w-4 h-4 text-ink-blue dark:text-highlighter-mint" />
                                <span>{cls.studentCount} Students</span>
                              </Link>

                              <Link
                                to={`/teacher/classes/${cls.id}`}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border border-ink/30 bg-paper-warm dark:bg-chalkboard-surface hover:bg-paper-card text-ink dark:text-chalkboard-chalk transition-colors"
                              >
                                <span>View Roster</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </Link>
                            </div>
                          </NotebookCard>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Archived Classes Section */}
                {archivedClasses.length > 0 && (
                  <div className="pt-6 border-t border-ink/15 dark:border-chalkboard-borderSubtle space-y-4">
                    <div>
                      <h2 className="text-lg font-bold text-ink-muted dark:text-chalkboard-muted flex items-center gap-2">
                        <span>Past / Archived Classes</span>
                        <span className="text-xs font-mono">({archivedClasses.length})</span>
                      </h2>
                      <p className="text-xs text-ink-muted dark:text-chalkboard-muted">
                        Archived classes preserve past student attempts and progress for your records.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 opacity-80">
                      {archivedClasses.map((cls) => (
                        <NotebookCard
                          key={cls.id}
                          pattern="ruled"
                          borderStyle="sketch"
                          className="flex flex-col justify-between p-5 space-y-4 bg-paper-card dark:bg-chalkboard-card"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-mono font-bold uppercase text-ink-muted">
                                {cls.subject.code}
                              </span>
                              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                                Archived
                              </span>
                            </div>
                            <h3 className="font-bold text-lg text-ink dark:text-chalkboard-chalk">
                              {cls.name}
                            </h3>
                            <p className="text-xs text-ink-muted dark:text-chalkboard-muted">
                              {cls.subject.name}
                            </p>
                          </div>

                          <div className="pt-3 border-t border-ink/10 dark:border-chalkboard-borderSubtle flex items-center justify-between text-xs font-mono">
                            <span className="text-ink-muted dark:text-chalkboard-muted">
                              {cls.studentCount} Students
                            </span>
                            <Link
                              to={`/teacher/classes/${cls.id}`}
                              className="font-bold underline hover:text-redpen"
                            >
                              View Records →
                            </Link>
                          </div>
                        </NotebookCard>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Modal: Create New Class */}
        {showModal && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-class-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-xs"
          >
            <div className="w-full max-w-lg bg-paper-card dark:bg-chalkboard-card border-2 border-ink dark:border-chalkboard-border rounded-2xl p-6 sm:p-7 shadow-notebook space-y-5">
              <div className="flex items-center justify-between border-b border-ink/15 dark:border-chalkboard-borderSubtle pb-3">
                <h3
                  id="create-class-title"
                  className="text-lg font-bold text-ink dark:text-chalkboard-chalk"
                >
                  Create New Class Section
                </h3>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="p-1 rounded-lg hover:bg-paper-warm dark:hover:bg-chalkboard-surface text-ink-muted dark:text-chalkboard-muted hover:text-ink cursor-pointer"
                  aria-label="Close dialog"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {createError && (
                <div className="p-3 rounded-xl border border-redpen bg-redpen-soft text-redpen-dark text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{createError}</span>
                </div>
              )}

              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="subject-select"
                      className="block text-xs font-mono font-bold uppercase tracking-wider text-ink dark:text-chalkboard-chalk"
                    >
                      Subject <span className="text-redpen">*</span>
                    </label>
                    <Link
                      to="/teacher/subjects"
                      className="text-xs text-redpen hover:underline font-mono"
                    >
                      + New Subject
                    </Link>
                  </div>

                  {activeSubjects.length === 0 ? (
                    <div className="p-3.5 rounded-xl border-2 border-dashed border-ink/20 dark:border-chalkboard-border bg-paper-warm/50 dark:bg-chalkboard-surface space-y-2">
                      <p className="text-xs text-ink-muted dark:text-chalkboard-muted">
                        You have not created any course subjects yet. Create a subject in Course Authoring before setting up a class section.
                      </p>
                      <Link
                        to="/teacher/subjects"
                        className="inline-flex items-center gap-1 text-xs font-bold text-redpen hover:underline"
                      >
                        <span>Go to My Subjects to create one</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  ) : (
                    <>
                      <select
                        id="subject-select"
                        required
                        value={selectedSubjectId}
                        onChange={(e) => setSelectedSubjectId(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border-2 border-ink/30 dark:border-chalkboard-borderSubtle bg-paper-card dark:bg-chalkboard-card text-ink dark:text-chalkboard-chalk text-sm focus:outline-none focus:border-redpen cursor-pointer"
                      >
                        <option value="" disabled>-- Select a Subject --</option>
                        {activeSubjects.map((sub) => (
                          <option key={sub.id} value={sub.id}>
                            {sub.name} ({sub.code})
                          </option>
                        ))}
                      </select>
                      <div className="flex justify-between items-center text-[10px] font-mono text-ink-muted dark:text-chalkboard-muted mt-1">
                        <span>Select from your owned course subjects.</span>
                        <span>{activeSubjects.length} subject{activeSubjects.length === 1 ? '' : 's'} available</span>
                      </div>
                    </>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="section-name"
                    className="block text-xs font-mono font-bold uppercase tracking-wider text-ink dark:text-chalkboard-chalk mb-1.5"
                  >
                    Class / Section Name <span className="text-redpen">*</span>
                  </label>
                  <input
                    id="section-name"
                    type="text"
                    required
                    maxLength={60}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Section A, Period 3, Morning Cohort"
                    className="w-full px-3.5 py-2.5 rounded-xl border-2 border-ink/30 dark:border-chalkboard-borderSubtle bg-paper-card dark:bg-chalkboard-card text-ink dark:text-chalkboard-chalk text-sm focus:outline-none focus:border-redpen"
                  />
                  <div className="flex justify-between items-center text-[10px] font-mono text-ink-muted dark:text-chalkboard-muted mt-1">
                    <span>Must be unique for this subject in your classes.</span>
                    <span>{name.length}/60</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-ink/10 dark:border-chalkboard-borderSubtle flex items-center justify-end gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    onClick={() => setShowModal(false)}
                    disabled={createLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    disabled={createLoading || activeSubjects.length === 0}
                    className="shadow-notebook"
                  >
                    {createLoading ? 'Creating…' : 'Create Class'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </PortalShell>
  );
}
