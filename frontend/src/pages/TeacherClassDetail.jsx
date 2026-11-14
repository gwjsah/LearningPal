import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import {
  BookOpenCheck,
  Users,
  Copy,
  Check,
  RotateCcw,
  Archive,
  Lock,
  Unlock,
  ArrowLeft,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  BarChart3,
  HeartHandshake,
  FlaskConical,
  Star,
  PlusCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { teacherService } from '../services/teacherService';
import {
  Button,
  NotebookButton,
  NotebookBackButton,
  NotebookCard,
  NotebookLoader,
  PortalShell,
  NotebookTabs,
  NotebookTabPanel,
} from '../components/NotebookPrimitives';
import { ConfirmModal } from '../components/ConfirmModal';

// Tab Subcomponents
import ClassOverviewTab from './class-tabs/ClassOverviewTab';
import ClassStudentsTab from './class-tabs/ClassStudentsTab';
import ClassAssessmentsTab from './class-tabs/ClassAssessmentsTab';
import ClassInterventionsTab from './class-tabs/ClassInterventionsTab';
import ClassRatingsTab from './class-tabs/ClassRatingsTab';

export default function TeacherClassDetail() {
  const { id } = useParams();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Tab state synced with URL search params (?tab=overview|students|assessments|interventions|ratings)
  const activeTab = searchParams.get('tab') || 'overview';
  const initialStudentFilter = searchParams.get('filter') || 'all';

  const [classDetail, setClassDetail] = useState(null);
  const [roster, setRoster] = useState([]);
  const [overview, setOverview] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [classInterventions, setClassInterventions] = useState([]);
  const [ratingsSummary, setRatingsSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // Modals & Action States
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showRegenModal, setShowRegenModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [successBanner, setSuccessBanner] = useState('');

  // Assessment Scheduling & Retake Modals
  const [editingAssessment, setEditingAssessment] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({
    availableFrom: '',
    availableUntil: '',
    allowRetakes: true,
  });
  const [unlockModal, setUnlockModal] = useState({
    open: false,
    assessmentId: null,
    assessmentTitle: '',
    studentId: '',
    reason: '',
    extendedUntil: '',
  });

  // Log Intervention Modal State
  const [showLogModal, setShowLogModal] = useState(false);
  const [intervForm, setIntervForm] = useState({
    studentId: '',
    topicId: '',
    type: 'ONE_ON_ONE',
    note: '',
    followUpDate: '',
  });

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [detailData, rosterData, overviewData, assessmentsData, interventionsData, ratingsData] =
        await Promise.all([
          teacherService.getClassDetail(id),
          teacherService.getClassRoster(id),
          teacherService.getClassOverview(id),
          teacherService.getClassAssessments(id),
          teacherService.getClassInterventions(id),
          teacherService.getClassRatingsSummary(id).catch(() => null),
        ]);
      setClassDetail(detailData);
      setRoster(rosterData || []);
      setOverview(overviewData);
      setAssessments(assessmentsData || []);
      setClassInterventions(interventionsData || []);
      setRatingsSummary(ratingsData);
    } catch (err) {
      if (err.status === 401) {
        logout();
        navigate('/login', { replace: true });
        return;
      }
      if (err.status === 404) {
        setError('Class not found. You can only view classes assigned to you in your institution.');
        return;
      }
      setError(err.message || 'Unable to load class data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  // Handle Tab Navigation with URL sync
  const handleTabChange = (tabId, options = {}) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('tab', tabId);
    if (options.filter) {
      nextParams.set('filter', options.filter);
    } else {
      nextParams.delete('filter');
    }
    setSearchParams(nextParams);
  };

  const handleCopyCode = async () => {
    if (!classDetail?.joinCode) return;
    try {
      await navigator.clipboard.writeText(classDetail.joinCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
    }
  };

  const handleArchive = async () => {
    setActionLoading(true);
    setActionError('');
    try {
      const updated = await teacherService.archiveClass(id);
      setClassDetail((prev) => ({
        ...prev,
        status: updated.status,
      }));
      setShowArchiveModal(false);
      setSuccessBanner('Class section archived successfully.');
      setTimeout(() => setSuccessBanner(''), 3000);
    } catch (err) {
      setActionError(err.message || 'Failed to archive class.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRegenerateCode = async () => {
    setActionLoading(true);
    setActionError('');
    try {
      const updated = await teacherService.regenerateJoinCode(id);
      setClassDetail((prev) => ({
        ...prev,
        joinCode: updated.joinCode,
      }));
      setShowRegenModal(false);
      setSuccessBanner('New join code generated successfully!');
      setTimeout(() => setSuccessBanner(''), 3000);
    } catch (err) {
      setActionError(err.message || 'Failed to regenerate join code.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleEnrollment = async () => {
    if (!classDetail) return;
    setActionLoading(true);
    setActionError('');
    try {
      const nextOpen = !classDetail.enrollmentOpen;
      const updated = await teacherService.toggleEnrollment(id, nextOpen);
      setClassDetail((prev) => ({
        ...prev,
        enrollmentOpen: updated.enrollmentOpen,
      }));
      setSuccessBanner(
        `Enrollment is now ${updated.enrollmentOpen ? 'OPEN' : 'CLOSED'} for this class.`
      );
      setTimeout(() => setSuccessBanner(''), 3000);
    } catch (err) {
      setActionError(err.message || 'Failed to update enrollment setting.');
    } finally {
      setActionLoading(false);
    }
  };

  // Assessment Schedule Modal Handlers
  const handleOpenScheduleModal = (asm) => {
    setEditingAssessment(asm);
    setScheduleForm({
      availableFrom: asm.availableFrom ? asm.availableFrom.substring(0, 16) : '',
      availableUntil: asm.availableUntil ? asm.availableUntil.substring(0, 16) : '',
      allowRetakes: asm.allowRetakes ?? true,
    });
    setActionError('');
  };

  const handleSaveSchedule = async (e) => {
    e.preventDefault();
    if (!editingAssessment) return;
    setActionLoading(true);
    setActionError('');
    try {
      const payload = {
        availableFrom: scheduleForm.availableFrom
          ? new Date(scheduleForm.availableFrom).toISOString()
          : null,
        availableUntil: scheduleForm.availableUntil
          ? new Date(scheduleForm.availableUntil).toISOString()
          : null,
        allowRetakes: scheduleForm.allowRetakes,
      };
      const updated = await teacherService.updateClassAssessmentSetting(
        id,
        editingAssessment.assessmentId,
        payload
      );
      setAssessments((prev) =>
        prev.map((a) => (a.assessmentId === updated.assessmentId ? updated : a))
      );
      setEditingAssessment(null);
      setSuccessBanner('Assessment schedule updated successfully!');
      setTimeout(() => setSuccessBanner(''), 3000);
    } catch (err) {
      setActionError(err.message || 'Failed to update schedule.');
    } finally {
      setActionLoading(false);
    }
  };

  // Unlock Retake Modal Handlers
  const handleOpenUnlockModal = (asm) => {
    setUnlockModal({
      open: true,
      assessmentId: asm.assessmentId,
      assessmentTitle: asm.title,
      studentId: roster.length > 0 ? roster[0].studentId : '',
      reason: 'Instructor retake permission granted',
      extendedUntil: '',
    });
    setActionError('');
  };

  const handleSaveUnlock = async (e) => {
    e.preventDefault();
    if (!unlockModal.studentId) return;
    setActionLoading(true);
    setActionError('');
    try {
      await teacherService.unlockStudentAssessment(id, unlockModal.assessmentId, {
        studentId: Number(unlockModal.studentId),
        reason: unlockModal.reason,
        extendedUntil: unlockModal.extendedUntil
          ? new Date(unlockModal.extendedUntil).toISOString()
          : null,
      });
      setUnlockModal({
        open: false,
        assessmentId: null,
        assessmentTitle: '',
        studentId: '',
        reason: '',
        extendedUntil: '',
      });
      setSuccessBanner('Student retake unlocked successfully!');
      setTimeout(() => setSuccessBanner(''), 3000);
    } catch (err) {
      setActionError(err.message || 'Failed to unlock student retake.');
    } finally {
      setActionLoading(false);
    }
  };

  // Intervention Status Update Handler
  const handleUpdateInterventionStatus = async (itvId, newStatus) => {
    setActionError('');
    try {
      const updated = await teacherService.updateIntervention(id, itvId, { status: newStatus });
      setClassInterventions((prev) =>
        prev.map((i) => (i.id === itvId ? { ...i, status: updated.status } : i))
      );
      setSuccessBanner(`Intervention status updated to ${newStatus}.`);
      setTimeout(() => setSuccessBanner(''), 3000);
    } catch (err) {
      setActionError(err.message || 'Failed to update intervention status.');
      throw err;
    }
  };

  // Open Log Intervention Modal
  const handleOpenLogModal = () => {
    const defaultStudentId = roster.length > 0 ? roster[0].studentId : '';
    const defaultTopicId =
      overview?.topics && overview.topics.length > 0 ? overview.topics[0].topicId : '';
    setIntervForm({
      studentId: defaultStudentId,
      topicId: defaultTopicId,
      type: 'ONE_ON_ONE',
      note: '',
      followUpDate: '',
    });
    setShowLogModal(true);
    setActionError('');
  };

  // Submit Log Intervention
  const handleCreateIntervention = async (e) => {
    e.preventDefault();
    if (!intervForm.studentId || !intervForm.topicId || !intervForm.note.trim()) {
      setActionError('Please select a student, target topic, and enter an intervention note.');
      return;
    }

    setActionLoading(true);
    setActionError('');
    try {
      const payload = {
        topicId: Number(intervForm.topicId),
        type: intervForm.type,
        note: intervForm.note.trim(),
        followUpDate: intervForm.followUpDate || null,
      };

      const created = await teacherService.createIntervention(
        id,
        intervForm.studentId,
        payload
      );
      setClassInterventions((prev) => [created, ...prev]);
      setShowLogModal(false);
      setSuccessBanner('Intervention logged successfully!');
      setTimeout(() => setSuccessBanner(''), 3000);
    } catch (err) {
      setActionError(err.message || 'Failed to create intervention.');
    } finally {
      setActionLoading(false);
    }
  };

  const isArchived = classDetail?.status === 'ARCHIVED';

  // Badge counts for tabs
  const openInterventionsCount = useMemo(() => {
    return classInterventions.filter(
      (i) => i.status === 'PLANNED' || i.status === 'IN_PROGRESS'
    ).length;
  }, [classInterventions]);

  const totalRatingsCount = useMemo(() => {
    const topics = ratingsSummary?.topics || ratingsSummary?.topicRatings || [];
    const resources = ratingsSummary?.resources || ratingsSummary?.resourceRatings || [];
    return topics.length + resources.length;
  }, [ratingsSummary]);

  // Tab definitions
  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'students', label: 'Students', icon: Users, badge: roster.length },
    { id: 'assessments', label: 'Assessments', icon: BookOpenCheck, badge: assessments.length },
    {
      id: 'interventions',
      label: 'Interventions',
      icon: HeartHandshake,
      badge: openInterventionsCount > 0 ? openInterventionsCount : undefined,
    },
    {
      id: 'ratings',
      label: 'Feedback & Ratings',
      icon: Star,
      badge: totalRatingsCount > 0 ? totalRatingsCount : undefined,
    },
  ];

  return (
    <PortalShell
      portalSubtitle="Teacher Gradebook"
      user={user}
      onLogout={logout}
      badgeIcon={BookOpenCheck}
      badgeLabel={classDetail ? `Class Section • ${classDetail.name}` : 'Class Roster'}
      badgeColorClass={isArchived ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200' : 'bg-highlighter-mint text-ink'}
      title={classDetail ? `${classDetail.subject.name} (${classDetail.name})` : 'Class Section'}
      subtitle={
        classDetail
          ? `Subject Code: ${classDetail.subject.code} • ${roster.length} Enrolled Student${
              roster.length === 1 ? '' : 's'
            }`
          : 'View your class join code, student roster, and topic gap overview.'
      }
      headerRight={
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <NotebookButton
            to={`/teacher/classes/${id}/validation`}
            variant="mint"
            size="md"
            icon={FlaskConical}
          >
            Validation Lab
          </NotebookButton>
          <NotebookBackButton to="/teacher" label="Back to Classes" />
        </div>
      }
    >
      <div className="w-full space-y-6">
        {/* Loading state */}
        {loading && (
          <NotebookLoader message="Loading class roster, join codes, and topic gap overview…" />
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="p-5 rounded-2xl border-2 border-redpen dark:border-red-500/60 bg-redpen-soft dark:bg-red-950/60 text-redpen-dark dark:text-red-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 shrink-0" aria-hidden="true" />
              <div>
                <p className="text-sm font-bold">{error}</p>
                <p className="text-xs mt-0.5">Please check your permissions or return to your classes.</p>
              </div>
            </div>
            <NotebookBackButton to="/teacher" label="Back to My Classes" />
          </div>
        )}

        {/* Success Alert Banner */}
        {successBanner && (
          <div className="p-3.5 rounded-xl border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 flex items-center justify-between text-xs font-mono font-bold shadow-xs">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              <span>{successBanner}</span>
            </div>
            <button
              onClick={() => setSuccessBanner('')}
              className="text-[10px] uppercase underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Action Error Banner */}
        {actionError && (
          <div className="p-4 rounded-xl border-2 border-redpen dark:border-red-500/60 bg-redpen-soft dark:bg-red-950/60 text-redpen-dark dark:text-red-300 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" aria-hidden="true" />
              <span>{actionError}</span>
            </div>
            <button
              onClick={() => setActionError('')}
              className="text-xs font-bold uppercase underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Main Content */}
        {!loading && !error && classDetail && (
          <>
            {/* Archived Alert Banner */}
            {isArchived && (
              <div className="p-4 rounded-xl border-2 border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                <div>
                  <p className="text-sm font-bold">This class is archived</p>
                  <p className="text-xs mt-0.5">
                    Students can still view past quiz attempts and progress, but new quiz attempts cannot be started and new students cannot join.
                  </p>
                </div>
              </div>
            )}

            {/* Slim Class Control Bar: Join Code & Quick Actions */}
            <div className="p-4 rounded-2xl bg-paper-card dark:bg-chalkboard-card border-2 border-ink dark:border-chalkboard-border shadow-notebook-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Left: Join Code & Enrollment Pill */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 bg-paper-warm dark:bg-chalkboard-surface px-3 py-1.5 rounded-xl border border-ink/20 dark:border-chalkboard-borderSubtle">
                  <span className="text-xs font-mono uppercase tracking-wider text-ink-muted dark:text-chalkboard-muted">
                    Join Code:
                  </span>
                  <span className="font-mono font-extrabold text-base tracking-widest text-ink dark:text-chalkboard-chalk">
                    {classDetail.joinCode}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    disabled={isArchived}
                    className="p-1 rounded-md hover:bg-paper-card dark:hover:bg-chalkboard-card text-ink-muted dark:text-chalkboard-muted hover:text-ink dark:hover:text-chalkboard-chalk transition-colors cursor-pointer"
                    title="Copy Join Code to Clipboard"
                    aria-label="Copy Join Code"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                    ) : (
                      <Copy className="w-4 h-4" aria-hidden="true" />
                    )}
                  </button>
                  {copied && (
                    <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">Copied!</span>
                  )}
                </div>

                {/* Enrollment Status Pill */}
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold border ${
                    classDetail.enrollmentOpen && !isArchived
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                      : 'bg-redpen-soft dark:bg-red-950/60 text-redpen-dark dark:text-red-300 border-redpen/40 dark:border-red-500/50'
                  }`}
                >
                  {classDetail.enrollmentOpen && !isArchived ? (
                    <Unlock className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-300" aria-hidden="true" />
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-redpen" aria-hidden="true" />
                  )}
                  <span>
                    {isArchived
                      ? 'Closed (Archived)'
                      : classDetail.enrollmentOpen
                      ? 'Enrollment Open'
                      : 'Enrollment Closed'}
                  </span>
                </span>
              </div>

              {/* Right: Class Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {!isArchived && (
                  <>
                    <button
                      type="button"
                      onClick={handleToggleEnrollment}
                      disabled={actionLoading}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-card dark:bg-chalkboard-card hover:bg-paper-warm dark:hover:bg-chalkboard-surface text-ink dark:text-chalkboard-chalk transition-colors cursor-pointer"
                    >
                      {classDetail.enrollmentOpen ? (
                        <>
                          <Lock className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Close Enrollment</span>
                        </>
                      ) : (
                        <>
                          <Unlock className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Open Enrollment</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowRegenModal(true)}
                      disabled={actionLoading}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-card dark:bg-chalkboard-card hover:bg-paper-warm dark:hover:bg-chalkboard-surface text-ink dark:text-chalkboard-chalk transition-colors cursor-pointer"
                      title="Generate a fresh join code"
                    >
                      <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Regenerate Code</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowArchiveModal(true)}
                      disabled={actionLoading}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border border-redpen/30 dark:border-red-500/50 text-redpen-dark dark:text-red-300 bg-redpen-soft/40 dark:bg-red-950/40 hover:bg-redpen-soft dark:hover:bg-red-950/70 transition-colors cursor-pointer"
                    >
                      <Archive className="w-3.5 h-3.5 text-redpen dark:text-red-400" aria-hidden="true" />
                      <span>Archive</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Accessible Tab Navigation */}
            <NotebookTabs
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={handleTabChange}
              ariaLabel="Class details tabs"
            />

            {/* Tab 1: Overview Tab */}
            <NotebookTabPanel id="overview" activeTab={activeTab}>
              <ClassOverviewTab
                classId={id}
                classDetail={classDetail}
                overview={overview}
                roster={roster}
                classInterventions={classInterventions}
                onSelectTab={handleTabChange}
              />
            </NotebookTabPanel>

            {/* Tab 2: Students Tab */}
            <NotebookTabPanel id="students" activeTab={activeTab}>
              <ClassStudentsTab
                classId={id}
                roster={roster}
                initialFilter={initialStudentFilter}
              />
            </NotebookTabPanel>

            {/* Tab 3: Assessments Tab */}
            <NotebookTabPanel id="assessments" activeTab={activeTab}>
              <ClassAssessmentsTab
                classId={id}
                assessments={assessments}
                onOpenScheduleModal={handleOpenScheduleModal}
                onOpenUnlockModal={handleOpenUnlockModal}
              />
            </NotebookTabPanel>

            {/* Tab 4: Interventions Tab */}
            <NotebookTabPanel id="interventions" activeTab={activeTab}>
              <ClassInterventionsTab
                classId={id}
                interventions={classInterventions}
                roster={roster}
                topics={overview?.topics || []}
                onOpenLogModal={handleOpenLogModal}
                onUpdateStatus={handleUpdateInterventionStatus}
                actionLoading={actionLoading}
              />
            </NotebookTabPanel>

            {/* Tab 5: Ratings & Quality Tab */}
            <NotebookTabPanel id="ratings" activeTab={activeTab}>
              <ClassRatingsTab ratingsSummary={ratingsSummary} />
            </NotebookTabPanel>
          </>
        )}

        {/* Modal: Regenerate Join Code */}
        <ConfirmModal
          isOpen={showRegenModal}
          title="Regenerate Join Code?"
          message={
            <span>
              A new 6-character code will be generated. The current code (
              <strong>{classDetail?.joinCode}</strong>) will immediately stop working for new
              joins. Existing enrolled students will remain in the class.
            </span>
          }
          confirmLabel="Yes, Generate New Code"
          cancelLabel="Cancel"
          variant="primary"
          loading={actionLoading}
          loadingLabel="Generating…"
          onConfirm={handleRegenerateCode}
          onCancel={() => setShowRegenModal(false)}
        />

        {/* Modal: Archive Class */}
        <ConfirmModal
          isOpen={showArchiveModal}
          title="Archive Class Section?"
          message="Archiving this class will stop students from starting new quiz attempts. Enrolled students can still review their past work, feedback, and learning gaps. This action cannot be undone."
          confirmLabel="Yes, Archive Class"
          cancelLabel="Cancel"
          variant="danger"
          loading={actionLoading}
          loadingLabel="Archiving…"
          onConfirm={handleArchive}
          onCancel={() => setShowArchiveModal(false)}
        />

        {/* Modal: Edit Assessment Schedule & Retake Rules */}
        {editingAssessment && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="schedule-modal-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-xs"
          >
            <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-paper-card dark:bg-chalkboard-card border-2 border-ink dark:border-chalkboard-border rounded-2xl p-6 shadow-notebook space-y-5">
              <div className="flex items-center gap-3 text-ink dark:text-chalkboard-chalk">
                <Clock className="w-6 h-6 text-redpen dark:text-highlighter-yellow" aria-hidden="true" />
                <div>
                  <h3 id="schedule-modal-title" className="text-lg font-bold">
                    Schedule: {editingAssessment.title}
                  </h3>
                  <p className="text-xs text-ink-muted dark:text-chalkboard-muted">
                    Set window dates and retake permissions for this class.
                  </p>
                </div>
              </div>

              {actionError && (
                <div role="alert" className="p-3 bg-redpen-soft dark:bg-red-950/60 border border-redpen/30 dark:border-red-500/50 rounded-xl text-redpen-dark dark:text-red-300 text-xs font-mono">
                  {actionError}
                </div>
              )}

              <form onSubmit={handleSaveSchedule} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="schedule-available-from" className="block text-xs font-mono uppercase text-ink-muted dark:text-chalkboard-muted mb-1">
                      Available From
                    </label>
                    <input
                      id="schedule-available-from"
                      type="datetime-local"
                      value={scheduleForm.availableFrom}
                      onChange={(e) =>
                        setScheduleForm((prev) => ({ ...prev, availableFrom: e.target.value }))
                      }
                      className="w-full px-3 py-2 rounded-xl border-2 border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-card dark:bg-chalkboard-card text-xs font-mono text-ink dark:text-chalkboard-chalk focus:outline-none focus:border-redpen"
                    />
                    <span className="text-[10px] text-ink-muted dark:text-chalkboard-muted block mt-1">
                      Leave empty to open immediately
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-ink-muted dark:text-chalkboard-muted mb-1">
                      Available Until (Deadline)
                    </label>
                    <input
                      type="datetime-local"
                      value={scheduleForm.availableUntil}
                      onChange={(e) =>
                        setScheduleForm((prev) => ({ ...prev, availableUntil: e.target.value }))
                      }
                      className="w-full px-3 py-2 rounded-xl border-2 border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-card dark:bg-chalkboard-card text-xs font-mono text-ink dark:text-chalkboard-chalk focus:outline-none focus:border-redpen"
                    />
                    <span className="text-[10px] text-ink-muted dark:text-chalkboard-muted block mt-1">
                      Leave empty for no deadline
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-ink/10 dark:border-chalkboard-borderSubtle flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="allowRetakesCheck"
                    checked={scheduleForm.allowRetakes}
                    onChange={(e) =>
                      setScheduleForm((prev) => ({ ...prev, allowRetakes: e.target.checked }))
                    }
                    className="mt-1 w-4 h-4 rounded border-2 border-ink text-redpen focus:ring-redpen"
                  />
                  <label htmlFor="allowRetakesCheck" className="text-xs text-ink dark:text-chalkboard-chalk">
                    <span className="font-bold block">Allow Retakes</span>
                    <span className="text-ink-muted dark:text-chalkboard-muted block">
                      When unchecked, students cannot start another attempt after submitting, unless
                      you grant them an individual unlock.
                    </span>
                  </label>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setEditingAssessment(null)}
                    disabled={actionLoading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="sm" disabled={actionLoading}>
                    {actionLoading ? 'Saving…' : 'Save Settings'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Unlock Student Retake */}
        {unlockModal.open && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="unlock-modal-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-xs"
          >
            <div className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-paper-card dark:bg-chalkboard-card border-2 border-ink dark:border-chalkboard-border rounded-2xl p-6 shadow-notebook space-y-4">
              <div className="flex items-center gap-3 text-ink dark:text-chalkboard-chalk">
                <Unlock className="w-6 h-6 text-ink-blue dark:text-highlighter-mint" aria-hidden="true" />
                <div>
                  <h3 id="unlock-modal-title" className="text-lg font-bold">
                    Unlock Retake: {unlockModal.assessmentTitle}
                  </h3>
                  <p className="text-xs text-ink-muted dark:text-chalkboard-muted">
                    Grant a one-time attempt unlock or deadline extension.
                  </p>
                </div>
              </div>

              {actionError && (
                <div role="alert" className="p-3 bg-redpen-soft dark:bg-red-950/60 border border-redpen/30 dark:border-red-500/50 rounded-xl text-redpen-dark dark:text-red-300 text-xs font-mono">
                  {actionError}
                </div>
              )}

              <form onSubmit={handleSaveUnlock} className="space-y-4">
                <div>
                  <label htmlFor="unlock-student-select" className="block text-xs font-mono uppercase text-ink-muted dark:text-chalkboard-muted mb-1">
                    Select Enrolled Student
                  </label>
                  <select
                    id="unlock-student-select"
                    value={unlockModal.studentId}
                    onChange={(e) =>
                      setUnlockModal((prev) => ({ ...prev, studentId: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl border-2 border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-card dark:bg-chalkboard-card text-xs font-mono text-ink dark:text-chalkboard-chalk focus:outline-none focus:border-redpen"
                    required
                  >
                    {roster.map((s) => (
                      <option key={s.studentId} value={s.studentId}>
                        {s.name} ({s.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-ink-muted dark:text-chalkboard-muted mb-1">
                    Reason
                  </label>
                  <input
                    type="text"
                    value={unlockModal.reason}
                    onChange={(e) =>
                      setUnlockModal((prev) => ({ ...prev, reason: e.target.value }))
                    }
                    placeholder="e.g. Approved makeup quiz, Technical issue"
                    className="w-full px-3 py-2 rounded-xl border-2 border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-card dark:bg-chalkboard-card text-xs font-mono text-ink dark:text-chalkboard-chalk focus:outline-none focus:border-redpen"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-ink-muted dark:text-chalkboard-muted mb-1">
                    Extended Deadline (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={unlockModal.extendedUntil}
                    onChange={(e) =>
                      setUnlockModal((prev) => ({ ...prev, extendedUntil: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl border-2 border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-card dark:bg-chalkboard-card text-xs font-mono text-ink dark:text-chalkboard-chalk focus:outline-none focus:border-redpen"
                  />
                  <span className="text-[10px] text-ink-muted dark:text-chalkboard-muted block mt-1">
                    Leave blank if no extension is needed
                  </span>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      setUnlockModal({
                        open: false,
                        assessmentId: null,
                        assessmentTitle: '',
                        studentId: '',
                        reason: '',
                        extendedUntil: '',
                      })
                    }
                    disabled={actionLoading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="sm" disabled={actionLoading}>
                    {actionLoading ? 'Unlocking…' : 'Grant Unlock'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Log Pedagogical Intervention */}
        {showLogModal && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="log-intervention-modal-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-xs"
          >
            <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-paper-card dark:bg-chalkboard-card border-2 border-ink dark:border-chalkboard-border rounded-2xl p-6 shadow-notebook space-y-4">
              <div className="flex items-center gap-3 text-ink dark:text-chalkboard-chalk">
                <HeartHandshake className="w-6 h-6 text-ink-blue dark:text-highlighter-mint" aria-hidden="true" />
                <div>
                  <h3 id="log-intervention-modal-title" className="text-lg font-bold">
                    Log Pedagogical Intervention
                  </h3>
                  <p className="text-xs text-ink-muted dark:text-chalkboard-muted">
                    Record targeted support, one-on-one tutoring, or review sessions.
                  </p>
                </div>
              </div>

              {actionError && (
                <div role="alert" className="p-3 bg-redpen-soft dark:bg-red-950/60 border border-redpen/30 dark:border-red-500/50 rounded-xl text-redpen-dark dark:text-red-300 text-xs font-mono">
                  {actionError}
                </div>
              )}

              <form onSubmit={handleCreateIntervention} className="space-y-4">
                {/* Select Student */}
                <div>
                  <label htmlFor="intervention-student-select" className="block text-xs font-mono uppercase text-ink-muted dark:text-chalkboard-muted mb-1">
                    Student
                  </label>
                  <select
                    id="intervention-student-select"
                    value={intervForm.studentId}
                    onChange={(e) =>
                      setIntervForm((prev) => ({ ...prev, studentId: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl border-2 border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-card dark:bg-chalkboard-card text-xs font-mono text-ink dark:text-chalkboard-chalk focus:outline-none focus:border-redpen"
                    required
                  >
                    {roster.map((s) => (
                      <option key={s.studentId} value={s.studentId}>
                        {s.name} ({s.email})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Select Target Topic */}
                <div>
                  <label className="block text-xs font-mono uppercase text-ink-muted dark:text-chalkboard-muted mb-1">
                    Target Topic
                  </label>
                  <select
                    value={intervForm.topicId}
                    onChange={(e) =>
                      setIntervForm((prev) => ({ ...prev, topicId: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl border-2 border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-card dark:bg-chalkboard-card text-xs font-mono text-ink dark:text-chalkboard-chalk focus:outline-none focus:border-redpen"
                    required
                  >
                    {(overview?.topics || []).map((t) => (
                      <option key={t.topicId} value={t.topicId}>
                        {t.topicName} ({t.gapCount} gap students)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Type & Follow-up Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono uppercase text-ink-muted dark:text-chalkboard-muted mb-1">
                      Intervention Type
                    </label>
                    <select
                      value={intervForm.type}
                      onChange={(e) =>
                        setIntervForm((prev) => ({ ...prev, type: e.target.value }))
                      }
                      className="w-full px-3 py-2 rounded-xl border-2 border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-card dark:bg-chalkboard-card text-xs font-mono text-ink dark:text-chalkboard-chalk focus:outline-none focus:border-redpen"
                    >
                      <option value="ONE_ON_ONE">One-on-One Tutoring</option>
                      <option value="EXTRA_PRACTICE">Extra Practice Challenge</option>
                      <option value="GROUP_SESSION">Small Group Session</option>
                      <option value="OTHER">Other Remediation</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-ink-muted dark:text-chalkboard-muted mb-1">
                      Follow-up Date (Optional)
                    </label>
                    <input
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      value={intervForm.followUpDate}
                      onChange={(e) =>
                        setIntervForm((prev) => ({ ...prev, followUpDate: e.target.value }))
                      }
                      className="w-full px-3 py-2 rounded-xl border-2 border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-card dark:bg-chalkboard-card text-xs font-mono text-ink dark:text-chalkboard-chalk focus:outline-none focus:border-redpen"
                    />
                  </div>
                </div>

                {/* Note */}
                <div>
                  <label className="block text-xs font-mono uppercase text-ink-muted dark:text-chalkboard-muted mb-1">
                    Intervention Note
                  </label>
                  <textarea
                    rows={3}
                    value={intervForm.note}
                    onChange={(e) =>
                      setIntervForm((prev) => ({ ...prev, note: e.target.value }))
                    }
                    placeholder="Describe specific learning gaps covered, worksheets assigned, or student response…"
                    className="w-full px-3 py-2 rounded-xl border-2 border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-card dark:bg-chalkboard-card text-xs font-mono text-ink dark:text-chalkboard-chalk focus:outline-none focus:border-redpen resize-none"
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowLogModal(false)}
                    disabled={actionLoading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="sm" disabled={actionLoading}>
                    {actionLoading ? 'Logging…' : 'Record Intervention'}
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
