import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  Plus,
  Copy,
  FolderOpen,
  AlertCircle,
  RefreshCw,
  Archive,
  Trash2,
  Edit2,
  ExternalLink,
  HelpCircle,
  Check,
  X,
  Layers,
  FileQuestion,
  GraduationCap,
  Link2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { teacherService } from '../services/teacherService';
import {
  Button,
  NotebookCard,
  PortalShell,
} from '../components/NotebookPrimitives';
import { ConfirmModal } from '../components/ConfirmModal';

export default function TeacherSubjects() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(null); // subject object or null
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [confirmState, setConfirmState] = useState(null);

  // Sample copy confirmation
  const [copyingSample, setCopyingSample] = useState(false);

  const loadSubjects = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await teacherService.getTeacherSubjects();
      setSubjects(data);
    } catch (err) {
      if (err.status === 401) {
        logout();
        navigate('/login', { replace: true });
        return;
      }
      setError(err.message || 'Failed to load your subjects. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubjects();
  }, []);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setModalError('Please enter a subject name.');
      return;
    }
    setModalLoading(true);
    setModalError('');
    try {
      const created = await teacherService.createSubject({
        name: trimmedName,
        description: description.trim() || null,
      });
      setSubjects((prev) => [created, ...prev]);
      setShowCreateModal(false);
      setName('');
      setDescription('');
      setSuccessToast(`Subject "${created.name}" created!`);
      setTimeout(() => setSuccessToast(''), 4000);
    } catch (err) {
      setModalError(err.message || 'Failed to create subject.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!showEditModal) return;
    const trimmedName = name.trim();
    if (!trimmedName) {
      setModalError('Subject name is required.');
      return;
    }
    setModalLoading(true);
    setModalError('');
    try {
      const updated = await teacherService.updateSubject(showEditModal.id, {
        name: trimmedName,
        description: description.trim() || null,
      });
      setSubjects((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      setShowEditModal(null);
      setName('');
      setDescription('');
      setSuccessToast(`Subject "${updated.name}" updated.`);
      setTimeout(() => setSuccessToast(''), 4000);
    } catch (err) {
      setModalError(err.message || 'Failed to update subject.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleCopySample = async () => {
    if (copyingSample) return;
    setCopyingSample(true);
    try {
      const copied = await teacherService.copySampleSubject();
      setSubjects((prev) => [copied, ...prev]);
      setSuccessToast(`Sample subject copied as "${copied.name}"! You now have a private, editable copy.`);
      setTimeout(() => setSuccessToast(''), 5000);
    } catch (err) {
      setError(err.message || 'Failed to copy sample subject.');
    } finally {
      setCopyingSample(false);
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmState?.onConfirm) {
      setConfirmState(null);
      return;
    }
    setConfirmState((prev) => ({ ...prev, loading: true }));
    try {
      await confirmState.onConfirm();
      setConfirmState(null);
    } catch (err) {
      setConfirmState(null);
    }
  };

  const handleArchive = (subject) => {
    setConfirmState({
      title: 'Archive Subject',
      message: `Are you sure you want to archive "${subject.name}"? Active classes will retain their history.`,
      confirmLabel: 'Archive Subject',
      variant: 'danger',
      loadingLabel: 'Archiving…',
      onConfirm: async () => {
        try {
          const updated = await teacherService.archiveSubject(subject.id);
          setSubjects((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
          setSuccessToast(`Subject "${subject.name}" archived.`);
          setTimeout(() => setSuccessToast(''), 4000);
        } catch (err) {
          setError(err.message || 'Failed to archive subject.');
        }
      },
    });
  };

  const handleDelete = (subject) => {
    setConfirmState({
      title: 'Permanently Delete Subject',
      message: `Permanently delete "${subject.name}"? This cannot be undone.`,
      confirmLabel: 'Delete Subject',
      variant: 'danger',
      loadingLabel: 'Deleting…',
      onConfirm: async () => {
        try {
          await teacherService.deleteSubject(subject.id);
          setSubjects((prev) => prev.filter((s) => s.id !== subject.id));
          setSuccessToast(`Subject "${subject.name}" deleted.`);
          setTimeout(() => setSuccessToast(''), 4000);
        } catch (err) {
          setError(err.message || 'Failed to delete subject.');
        }
      },
    });
  };

  const activeSubjects = subjects.filter((s) => s.status === 'ACTIVE');
  const archivedSubjects = subjects.filter((s) => s.status === 'ARCHIVED');

  return (
    <PortalShell
      portalSubtitle="Teacher Course Authoring"
      skipLabel="Skip to subjects list"
      user={user}
      onLogout={logout}
      badgeIcon={BookOpen}
      badgeLabel="Course Authoring"
      badgeColorClass="bg-highlighter-mint text-ink"
      title="My Subjects"
      subtitle="Author topics, maintain versioned question banks, create quizzes, and organize study links."
      headerRight={
        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="md"
            onClick={handleCopySample}
            disabled={copyingSample}
            className="flex items-center gap-1.5 shadow-notebook-sm"
          >
            <Copy className="w-4 h-4 text-ink-muted dark:text-chalkboard-muted" />
            <span>{copyingSample ? 'Copying…' : 'Copy Sample Subject'}</span>
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              setName('');
              setDescription('');
              setModalError('');
              setShowCreateModal(true);
            }}
            className="flex items-center gap-1.5 shadow-notebook"
          >
            <Plus className="w-4 h-4" />
            <span>New Subject</span>
          </Button>
        </div>
      }
    >
      <div className="w-full space-y-8">
        {/* Breadcrumb back to classes */}
        <div className="flex items-center gap-2 text-xs font-mono text-ink-muted dark:text-chalkboard-muted">
          <Link
            to="/teacher"
            className="hover:underline hover:text-ink dark:hover:text-chalkboard-chalk inline-flex items-center gap-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-redpen rounded"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Teacher Home</span>
          </Link>
          <span>/</span>
          <span className="text-ink dark:text-chalkboard-chalk font-bold">My Subjects</span>
        </div>

        {/* Success toast */}
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
              className="text-xs uppercase font-mono font-bold hover:underline cursor-pointer"
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
              Loading your subjects…
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
                <p className="text-xs mt-0.5">Please try again or check your permissions.</p>
              </div>
            </div>
            <Button variant="secondary" size="sm" onClick={loadSubjects}>
              Retry
            </Button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && subjects.length === 0 && (
          <NotebookCard pattern="ruled" borderStyle="sketch" className="p-12 text-center space-y-5 bg-paper-card dark:bg-chalkboard-card">
            <div className="w-14 h-14 rounded-2xl bg-highlighter-yellow/30 border border-ink/20 flex items-center justify-center mx-auto">
              <BookOpen className="w-7 h-7 text-ink-muted dark:text-chalkboard-muted" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-ink dark:text-chalkboard-chalk">
                You don't own any subjects yet
              </h3>
              <p className="text-sm text-ink-muted dark:text-chalkboard-muted max-w-md mx-auto">
                Create a new subject from scratch, or copy the seeded C Language Basics curriculum to get started right away.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Button
                variant="secondary"
                size="md"
                onClick={handleCopySample}
                disabled={copyingSample}
                className="shadow-notebook-sm"
              >
                <Copy className="w-4 h-4 mr-1.5" />
                <span>{copyingSample ? 'Copying…' : 'Copy Sample Subject'}</span>
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  setName('');
                  setDescription('');
                  setModalError('');
                  setShowCreateModal(true);
                }}
                className="shadow-notebook"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                <span>Create New Subject</span>
              </Button>
            </div>
          </NotebookCard>
        )}

        {/* Active Subjects List */}
        {!loading && !error && activeSubjects.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-ink dark:text-chalkboard-chalk flex items-center gap-2">
                  <span>Active Subjects</span>
                  <span className="text-sm font-mono font-normal text-ink-muted dark:text-chalkboard-muted">
                    ({activeSubjects.length})
                  </span>
                </h2>
                <p className="text-xs sm:text-sm text-ink-muted dark:text-chalkboard-muted">
                  Private subjects available to create classes, write questions, and build quizzes.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeSubjects.map((sub) => (
                <NotebookCard
                  key={sub.id}
                  pattern="grid"
                  borderStyle="sketch"
                  className="h-full bg-paper-card dark:bg-chalkboard-card hover:shadow-notebook transition-shadow"
                  bodyClassName="h-full flex flex-col justify-between gap-5 p-6"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold uppercase px-2 py-0.5 rounded bg-highlighter-yellow/30 text-ink border border-ink/20">
                        {sub.code}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setName(sub.name);
                            setDescription(sub.description || '');
                            setModalError('');
                            setShowEditModal(sub);
                          }}
                          aria-label={`Edit ${sub.name}`}
                          className="p-2 rounded-lg hover:bg-paper-warm dark:hover:bg-chalkboard-surface text-ink-muted dark:text-chalkboard-muted hover:text-ink cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-redpen"
                          title="Edit subject name/description"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleArchive(sub)}
                          aria-label={`Archive ${sub.name}`}
                          className="p-2 rounded-lg hover:bg-paper-warm dark:hover:bg-chalkboard-surface text-ink-muted dark:text-chalkboard-muted hover:text-amber-700 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-redpen"
                          title="Archive subject"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                        {sub.topicCount === 0 && sub.questionCount === 0 && sub.quizCount === 0 && sub.classCount === 0 && (
                          <button
                            type="button"
                            onClick={() => handleDelete(sub)}
                            aria-label={`Delete ${sub.name}`}
                            className="p-2 rounded-lg hover:bg-paper-warm dark:hover:bg-chalkboard-surface text-ink-muted dark:text-chalkboard-muted hover:text-redpen cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-redpen"
                            title="Delete unused subject"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-bold text-xl text-ink dark:text-chalkboard-chalk leading-snug">
                        {sub.name}
                      </h3>
                      {sub.description && (
                        <p className="text-xs text-ink-muted dark:text-chalkboard-muted mt-1.5 line-clamp-2 leading-relaxed">
                          {sub.description}
                        </p>
                      )}
                    </div>

                    {/* Compact Content Summary Strip (avoids nested card boxes) */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-ink-muted dark:text-chalkboard-muted pt-1">
                      <span className="inline-flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5" aria-hidden="true" />
                        <strong className="font-mono text-ink dark:text-chalkboard-chalk">{sub.topicCount}</strong> Topics
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <FileQuestion className="w-3.5 h-3.5" aria-hidden="true" />
                        <strong className="font-mono text-ink dark:text-chalkboard-chalk">{sub.questionCount}</strong> Questions
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <GraduationCap className="w-3.5 h-3.5" aria-hidden="true" />
                        <strong className="font-mono text-ink dark:text-chalkboard-chalk">{sub.quizCount}</strong> Quizzes
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Link2 className="w-3.5 h-3.5" aria-hidden="true" />
                        <strong className="font-mono text-ink dark:text-chalkboard-chalk">{sub.resourceCount}</strong> Links
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-ink/10 dark:border-chalkboard-borderSubtle">
                    <Button
                      to={`/teacher/subjects/${sub.id}`}
                      variant="primary"
                      size="sm"
                      className="w-full min-h-[40px] flex items-center justify-center gap-1.5 shadow-notebook-sm"
                    >
                      <span>Manage Content</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </NotebookCard>
              ))}
            </div>
          </div>
        )}

        {/* Archived Subjects Section */}
        {!loading && !error && archivedSubjects.length > 0 && (
          <div className="space-y-4 pt-4 border-t border-ink/10 dark:border-chalkboard-borderSubtle">
            <h2 className="text-lg font-bold text-ink-muted dark:text-chalkboard-muted flex items-center gap-2">
              <Archive className="w-4 h-4" />
              <span>Archived Subjects ({archivedSubjects.length})</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {archivedSubjects.map((sub) => (
                <NotebookCard key={sub.id} className="p-5 bg-paper-warm/70 dark:bg-chalkboard-surface/70 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-ink-muted dark:text-chalkboard-muted">{sub.code}</span>
                    <span className="text-[11px] uppercase font-mono font-semibold px-2 py-0.5 rounded bg-ink/10 text-ink-muted dark:text-chalkboard-muted">Archived</span>
                  </div>
                  <h3 className="font-bold text-base text-ink dark:text-chalkboard-chalk">{sub.name}</h3>
                  <div className="text-xs text-ink-muted dark:text-chalkboard-muted flex items-center gap-3 font-mono">
                    <span>{sub.topicCount} topics</span>
                    <span>{sub.questionCount} questions</span>
                    <span>{sub.quizCount} quizzes</span>
                  </div>
                </NotebookCard>
              ))}
            </div>
          </div>
        )}

        {/* Create Subject Modal */}
        {showCreateModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/45 dark:bg-black/65"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-subject-title"
          >
            <div className="w-full max-w-lg rounded-2xl bg-paper-card dark:bg-chalkboard-card border-2 border-ink dark:border-chalkboard-border p-6 shadow-notebook-lg space-y-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 id="create-subject-title" className="text-lg font-bold text-ink dark:text-chalkboard-chalk">
                    Create New Subject
                  </h3>
                  <p className="text-xs text-ink-muted dark:text-chalkboard-muted mt-0.5">
                    Private subject owned by you. Only you can create topics, questions, and quizzes in it.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="p-1 rounded-lg hover:bg-paper-warm dark:hover:bg-chalkboard-surface text-ink-muted dark:text-chalkboard-muted hover:text-ink cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {modalError && (
                <div className="p-3 rounded-xl border border-redpen bg-redpen-soft text-redpen-dark text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div>
                  <label htmlFor="create-subj-name" className="block text-xs font-mono font-bold uppercase tracking-wider text-ink dark:text-chalkboard-chalk mb-1.5">
                    Subject Name <span className="text-redpen">*</span>
                  </label>
                  <input
                    id="create-subj-name"
                    type="text"
                    required
                    maxLength={120}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Data Structures and Algorithms"
                    className="w-full px-3.5 py-2.5 rounded-xl border-2 border-ink/30 dark:border-chalkboard-borderSubtle bg-paper-card dark:bg-chalkboard-card text-ink dark:text-chalkboard-chalk text-sm focus:outline-none focus:border-redpen"
                  />
                  <div className="flex justify-between items-center text-[10px] font-mono text-ink-muted dark:text-chalkboard-muted mt-1">
                    <span>A unique code will be assigned automatically.</span>
                    <span>{name.length}/120</span>
                  </div>
                </div>

                <div>
                  <label htmlFor="create-subj-desc" className="block text-xs font-mono font-bold uppercase tracking-wider text-ink dark:text-chalkboard-chalk mb-1.5">
                    Description (Optional)
                  </label>
                  <textarea
                    id="create-subj-desc"
                    rows={3}
                    maxLength={1000}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of the course scope or curriculum objectives…"
                    className="w-full px-3.5 py-2.5 rounded-xl border-2 border-ink/30 dark:border-chalkboard-borderSubtle bg-paper-card dark:bg-chalkboard-card text-ink dark:text-chalkboard-chalk text-sm focus:outline-none focus:border-redpen"
                  />
                  <div className="text-right text-[10px] font-mono text-ink-muted dark:text-chalkboard-muted mt-1">
                    <span>{description.length}/1000</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-ink/10 dark:border-chalkboard-borderSubtle flex items-center justify-end gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    onClick={() => setShowCreateModal(false)}
                    disabled={modalLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    disabled={modalLoading}
                    className="shadow-notebook"
                  >
                    {modalLoading ? 'Creating…' : 'Create Subject'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Subject Modal */}
        {showEditModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/45 dark:bg-black/65"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-subject-title"
          >
            <div className="w-full max-w-lg rounded-2xl bg-paper-card dark:bg-chalkboard-card border-2 border-ink dark:border-chalkboard-border p-6 shadow-notebook-lg space-y-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 id="edit-subject-title" className="text-lg font-bold text-ink dark:text-chalkboard-chalk">
                    Edit Subject
                  </h3>
                  <p className="text-xs font-mono text-ink-muted dark:text-chalkboard-muted mt-0.5">
                    Code: {showEditModal.code}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEditModal(null)}
                  className="p-1 rounded-lg hover:bg-paper-warm dark:hover:bg-chalkboard-surface text-ink-muted dark:text-chalkboard-muted hover:text-ink cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {modalError && (
                <div className="p-3 rounded-xl border border-redpen bg-redpen-soft text-redpen-dark text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label htmlFor="edit-subj-name" className="block text-xs font-mono font-bold uppercase tracking-wider text-ink dark:text-chalkboard-chalk mb-1.5">
                    Subject Name <span className="text-redpen">*</span>
                  </label>
                  <input
                    id="edit-subj-name"
                    type="text"
                    required
                    maxLength={120}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border-2 border-ink/30 dark:border-chalkboard-borderSubtle bg-paper-card dark:bg-chalkboard-card text-ink dark:text-chalkboard-chalk text-sm focus:outline-none focus:border-redpen"
                  />
                  <div className="text-right text-[10px] font-mono text-ink-muted dark:text-chalkboard-muted mt-1">
                    <span>{name.length}/120</span>
                  </div>
                </div>

                <div>
                  <label htmlFor="edit-subj-desc" className="block text-xs font-mono font-bold uppercase tracking-wider text-ink dark:text-chalkboard-chalk mb-1.5">
                    Description (Optional)
                  </label>
                  <textarea
                    id="edit-subj-desc"
                    rows={3}
                    maxLength={1000}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border-2 border-ink/30 dark:border-chalkboard-borderSubtle bg-paper-card dark:bg-chalkboard-card text-ink dark:text-chalkboard-chalk text-sm focus:outline-none focus:border-redpen"
                  />
                  <div className="text-right text-[10px] font-mono text-ink-muted dark:text-chalkboard-muted mt-1">
                    <span>{description.length}/1000</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-ink/10 dark:border-chalkboard-borderSubtle flex items-center justify-end gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    onClick={() => setShowEditModal(null)}
                    disabled={modalLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    disabled={modalLoading}
                    className="shadow-notebook"
                  >
                    {modalLoading ? 'Saving…' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* Confirmation Modal */}
        <ConfirmModal
          isOpen={Boolean(confirmState)}
          title={confirmState?.title || ''}
          message={confirmState?.message || ''}
          confirmLabel={confirmState?.confirmLabel || 'Confirm'}
          cancelLabel={confirmState?.cancelLabel || 'Cancel'}
          variant={confirmState?.variant || 'primary'}
          loading={Boolean(confirmState?.loading)}
          loadingLabel={confirmState?.loadingLabel || 'Processing…'}
          isAlert={Boolean(confirmState?.isAlert)}
          onConfirm={handleConfirmAction}
          onCancel={() => {
            if (!confirmState?.loading) {
              setConfirmState(null);
            }
          }}
        />
      </div>
    </PortalShell>
  );
}
