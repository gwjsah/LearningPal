import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
  Calendar,
  Mail,
  AlertCircle,
  RefreshCw,
  ShieldAlert,
  Search,
  ArrowUpDown,
  CheckCircle2,
  Clock,
  HelpCircle,
  Award,
  Sparkles,
  TrendingDown,
  BarChart3,
  BookOpen,
  HeartHandshake,
  FlaskConical,
  Star,
  MessageSquare,
  ThumbsUp,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { teacherService } from '../services/teacherService';
import { Button, NotebookCard, PortalShell } from '../components/NotebookPrimitives';

export default function TeacherClassDetail() {
  const { id } = useParams();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [classDetail, setClassDetail] = useState(null);
  const [roster, setRoster] = useState([]);
  const [overview, setOverview] = useState(null);
  const [classInterventions, setClassInterventions] = useState([]);
  const [ratingsSummary, setRatingsSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // Search & Sorting state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name'); // 'name', 'gaps', 'diagnostic'

  // Modals & Action States
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showRegenModal, setShowRegenModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [scheduleSuccess, setScheduleSuccess] = useState('');

  // Part 4: Assessments & Scheduling State
  const [assessments, setAssessments] = useState([]);
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

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [detailData, rosterData, overviewData, assessmentsData, interventionsData, ratingsData] = await Promise.all([
        teacherService.getClassDetail(id),
        teacherService.getClassRoster(id),
        teacherService.getClassOverview(id),
        teacherService.getClassAssessments(id),
        teacherService.getClassInterventions(id),
        teacherService.getClassRatingsSummary(id).catch(() => null),
      ]);
      setClassDetail(detailData);
      setRoster(rosterData);
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
    } catch (err) {
      setActionError(err.message || 'Failed to update enrollment setting.');
    } finally {
      setActionLoading(false);
    }
  };

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
        availableFrom: scheduleForm.availableFrom ? new Date(scheduleForm.availableFrom).toISOString() : null,
        availableUntil: scheduleForm.availableUntil ? new Date(scheduleForm.availableUntil).toISOString() : null,
        allowRetakes: scheduleForm.allowRetakes,
      };
      const updated = await teacherService.updateClassAssessmentSetting(id, editingAssessment.assessmentId, payload);
      setAssessments((prev) =>
        prev.map((a) => (a.assessmentId === updated.assessmentId ? updated : a))
      );
      setEditingAssessment(null);
      setScheduleSuccess('Schedule updated successfully!');
      setTimeout(() => setScheduleSuccess(''), 3000);
    } catch (err) {
      setActionError(err.message || 'Failed to update schedule.');
    } finally {
      setActionLoading(false);
    }
  };

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
        extendedUntil: unlockModal.extendedUntil ? new Date(unlockModal.extendedUntil).toISOString() : null,
      });
      setUnlockModal({ open: false, assessmentId: null, assessmentTitle: '', studentId: '', reason: '', extendedUntil: '' });
      setScheduleSuccess('Student retake unlocked successfully!');
      setTimeout(() => setScheduleSuccess(''), 3000);
    } catch (err) {
      setActionError(err.message || 'Failed to unlock student retake.');
    } finally {
      setActionLoading(false);
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

  // Filter & Sort Roster
  const filteredAndSortedRoster = useMemo(() => {
    let result = [...roster];

    // Filter by name or email
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q)
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'gaps') {
        if (b.gapCount !== a.gapCount) return b.gapCount - a.gapCount;
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'diagnostic') {
        const scoreA = a.latestDiagnostic?.percent ?? -1;
        const scoreB = b.latestDiagnostic?.percent ?? -1;
        if (scoreB !== scoreA) return scoreB - scoreA;
        return a.name.localeCompare(b.name);
      }
      // default: name
      return a.name.localeCompare(b.name);
    });

    return result;
  }, [roster, searchQuery, sortBy]);

  // Top 1-2 Topics to Reteach
  const topicsToReteach = useMemo(() => {
    if (!overview?.topics) return [];
    return overview.topics.filter((t) => t.gapCount > 0).slice(0, 2);
  }, [overview]);

  // Normalized Ratings Summary Data (safe against undefined/null)
  const { topicRatingsList, resourceRatingsList, lowestRatedResourcesList, recentCommentsList, totalRatingsCount } = useMemo(() => {
    const topics = ratingsSummary?.topics || ratingsSummary?.topicRatings || [];
    const resources = ratingsSummary?.resources || ratingsSummary?.resourceRatings || [];
    const lowest = ratingsSummary?.lowestRatedResources || [];
    const comments = ratingsSummary?.recentComments || [];

    const totalTopicRatings = topics.reduce((acc, t) => acc + (t.totalRatings || 0), 0);
    const totalResourceRatings = resources.reduce((acc, r) => acc + (r.totalRatings || 0), 0);
    const totalCount = ratingsSummary?.totalRatingsCount ?? (totalTopicRatings + totalResourceRatings);

    return {
      topicRatingsList: topics,
      resourceRatingsList: resources,
      lowestRatedResourcesList: lowest,
      recentCommentsList: comments,
      totalRatingsCount: totalCount,
    };
  }, [ratingsSummary]);

  const isArchived = classDetail?.status === 'ARCHIVED';

  return (
    <PortalShell
      portalSubtitle="Teacher Gradebook"
      user={user}
      onLogout={logout}
      badgeIcon={BookOpenCheck}
      badgeLabel={classDetail ? `Class Section • ${classDetail.name}` : 'Class Roster'}
      badgeColorClass={isArchived ? 'bg-amber-100 text-amber-900' : 'bg-highlighter-mint text-ink'}
      title={classDetail ? `${classDetail.subject.name} (${classDetail.name})` : 'Class Overview'}
      subtitle={
        classDetail
          ? `Created on ${formatDate(classDetail.createdAt)} • Subject Code: ${classDetail.subject.code}`
          : 'View your class join code, topic gap breakdown, and student roster.'
      }
      headerRight={
        <div className="flex items-center gap-2">
          <Link
            to={`/teacher/classes/${id}/validation`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-ink/25 dark:border-chalkboard-borderSubtle text-ink dark:text-chalkboard-chalk bg-highlighter-mint hover:bg-highlighter-mintSoft shadow-xs transition-colors"
          >
            <FlaskConical className="w-3.5 h-3.5 text-ink-blue" />
            <span>Validation Lab</span>
          </Link>
          <Link
            to="/teacher"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-ink/25 dark:border-chalkboard-borderSubtle text-ink dark:text-chalkboard-chalk bg-paper-card dark:bg-chalkboard-card hover:bg-paper-warm dark:hover:bg-chalkboard-surface shadow-xs transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to My Classes</span>
          </Link>
        </div>
      }
    >
      <div className="w-full space-y-8">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2 text-ink-muted dark:text-chalkboard-muted">
            <Link
              to="/teacher"
              className="hover:text-ink dark:hover:text-chalkboard-chalk underline underline-offset-2 flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>My Classes</span>
            </Link>
            <span>/</span>
            <span className="font-bold text-ink dark:text-chalkboard-chalk">
              {classDetail ? `${classDetail.name}` : 'Detail'}
            </span>
          </div>
          {classDetail && (
            <span className="text-ink-muted dark:text-chalkboard-muted">
              Class ID: #{classDetail.id}
            </span>
          )}
        </nav>

        {/* Loading state */}
        {loading && (
          <div className="py-20 text-center space-y-4">
            <RefreshCw className="w-9 h-9 animate-spin mx-auto text-redpen" />
            <p className="font-hand text-2xl text-ink-muted dark:text-chalkboard-muted">
              Loading class roster, join codes, and topic gap overview…
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
                <p className="text-xs mt-0.5">Please check your permissions or return to your classes.</p>
              </div>
            </div>
            <Button size="sm" variant="secondary" onClick={() => navigate('/teacher')}>
              Back to My Classes
            </Button>
          </div>
        )}

        {/* Action Error Banner */}
        {actionError && (
          <div className="p-4 rounded-xl border-2 border-redpen bg-redpen-soft text-redpen-dark flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
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

        {/* Content Loaded */}
        {!loading && !error && classDetail && (
          <>
            {/* Archived Alert Banner */}
            {isArchived && (
              <div className="p-4 rounded-xl border-2 border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                <div>
                  <p className="text-sm font-bold">This class is archived</p>
                  <p className="text-xs mt-0.5">
                    Students can still view past quiz attempts and progress, but new quiz attempts cannot be started and new students cannot join.
                  </p>
                </div>
              </div>
            )}

            {/* Top Cards: Join Code & Class Settings */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Join Code Card */}
              <NotebookCard
                pattern="grid"
                borderStyle="sketch"
                className="md:col-span-2 p-6 bg-paper-card dark:bg-chalkboard-card border-2 border-ink dark:border-chalkboard-border space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-ink-muted dark:text-chalkboard-muted">
                      Student Join Code
                    </span>
                    <span
                      className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border ${
                        classDetail.enrollmentOpen
                          ? 'bg-highlighter-mint text-ink border-ink/20'
                          : 'bg-amber-100 text-amber-900 border-amber-300'
                      }`}
                    >
                      {classDetail.enrollmentOpen ? 'Enrollment Open' : 'Enrollment Closed'}
                    </span>
                  </div>
                  <span
                    className={`text-xs font-mono font-bold uppercase px-2.5 py-1 rounded-md border ${
                      isArchived
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                    }`}
                  >
                    {classDetail.status}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 bg-paper-warm dark:bg-chalkboard-surface p-4 rounded-xl border-2 border-ink dark:border-chalkboard-border">
                  <div className="flex-1 text-center sm:text-left">
                    <p className="text-xs text-ink-muted dark:text-chalkboard-muted font-mono mb-1">
                      Give this code to students to let them join:
                    </p>
                    <div className="font-mono text-3xl sm:text-4xl font-extrabold tracking-widest text-redpen dark:text-highlighter-yellow select-all">
                      {classDetail.joinCode}
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center gap-2 w-full sm:w-auto">
                    <Button
                      variant={copied ? 'mint' : 'secondary'}
                      size="md"
                      onClick={handleCopyCode}
                      className="w-full sm:w-36 flex items-center justify-center gap-1.5"
                      aria-live="polite"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-700" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Copy Code</span>
                        </>
                      )}
                    </Button>
                    {!isArchived && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowRegenModal(true)}
                        className="w-full sm:w-36 text-xs flex items-center justify-center gap-1"
                        title="Generate a new 6-character code"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Regenerate</span>
                      </Button>
                    )}
                  </div>
                </div>

                <p className="text-xs text-ink-muted dark:text-chalkboard-muted">
                  Students join by entering this 6-character code on their dashboard. Codes are unique per institution.
                </p>
              </NotebookCard>

              {/* Class Controls Card */}
              <NotebookCard
                pattern="ruled"
                borderStyle="sketch"
                className="p-6 bg-paper-card dark:bg-chalkboard-card border-2 border-ink dark:border-chalkboard-border flex flex-col justify-between space-y-4"
              >
                <div>
                  <h3 className="font-bold text-lg text-ink dark:text-chalkboard-chalk mb-2">
                    Class Settings
                  </h3>
                  <p className="text-xs text-ink-muted dark:text-chalkboard-muted mb-4">
                    Manage enrollment status or archive this class at the end of the term.
                  </p>

                  <div className="space-y-3">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleToggleEnrollment}
                      disabled={actionLoading || isArchived}
                      className="w-full justify-start text-xs"
                    >
                      {classDetail.enrollmentOpen ? (
                        <>
                          <Lock className="w-3.5 h-3.5 mr-2 text-amber-700" />
                          <span>Lock Enrollment (Pause Joins)</span>
                        </>
                      ) : (
                        <>
                          <Unlock className="w-3.5 h-3.5 mr-2 text-emerald-700" />
                          <span>Open Enrollment (Allow Joins)</span>
                        </>
                      )}
                    </Button>

                    {!isArchived && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setShowArchiveModal(true)}
                        disabled={actionLoading}
                        className="w-full justify-start text-xs"
                      >
                        <Archive className="w-3.5 h-3.5 mr-2" />
                        <span>Archive Class Section</span>
                      </Button>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-ink/10 dark:border-chalkboard-borderSubtle text-xs font-mono text-ink-muted dark:text-chalkboard-muted">
                  <span>Enrolled: </span>
                  <span className="font-bold text-ink dark:text-chalkboard-chalk">
                    {roster.length} students
                  </span>
                </div>
              </NotebookCard>
            </div>

            {/* PART 2: CLASS OVERVIEW SECTION */}
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-ink/10 dark:border-chalkboard-borderSubtle pb-3">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-ink dark:text-chalkboard-chalk flex items-center gap-2">
                    <BarChart3 className="w-6 h-6 text-redpen dark:text-highlighter-yellow" />
                    <span>Class Learning Gap Overview</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-ink-muted dark:text-chalkboard-muted">
                    Topic-level mastery breakdown and diagnostic gap distribution across your section.
                  </p>
                </div>
              </div>

              {/* Class Aggregate Metric Tiles */}
              {overview?.totals && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  <div className="p-4 rounded-xl border-2 border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-card dark:bg-chalkboard-card shadow-notebook-sm">
                    <span className="text-[11px] font-mono font-bold uppercase text-ink-muted dark:text-chalkboard-muted block">
                      Enrolled Students
                    </span>
                    <span className="text-2xl sm:text-3xl font-extrabold text-ink dark:text-chalkboard-chalk font-mono mt-1 block">
                      {overview.totals.enrolledStudents}
                    </span>
                  </div>

                  <div className="p-4 rounded-xl border-2 border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-card dark:bg-chalkboard-card shadow-notebook-sm">
                    <span className="text-[11px] font-mono font-bold uppercase text-ink-muted dark:text-chalkboard-muted block">
                      Active Learners
                    </span>
                    <span className="text-2xl sm:text-3xl font-extrabold text-ink-blue dark:text-highlighter-mint font-mono mt-1 block">
                      {overview.totals.studentsWithAttempts}
                    </span>
                    <span className="text-[10px] text-ink-muted dark:text-chalkboard-muted">
                      with at least 1 attempt
                    </span>
                  </div>

                  <div className="p-4 rounded-xl border-2 border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-card dark:bg-chalkboard-card shadow-notebook-sm">
                    <span className="text-[11px] font-mono font-bold uppercase text-ink-muted dark:text-chalkboard-muted block">
                      Avg Diagnostic
                    </span>
                    <span className="text-2xl sm:text-3xl font-extrabold text-emerald-700 dark:text-emerald-400 font-mono mt-1 block">
                      {overview.totals.averageDiagnosticPercent != null
                        ? `${overview.totals.averageDiagnosticPercent}%`
                        : '—'}
                    </span>
                    <span className="text-[10px] text-ink-muted dark:text-chalkboard-muted">
                      comprehensive assessment
                    </span>
                  </div>

                  <div className="p-4 rounded-xl border-2 border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-card dark:bg-chalkboard-card shadow-notebook-sm">
                    <span className="text-[11px] font-mono font-bold uppercase text-ink-muted dark:text-chalkboard-muted block">
                      Needs Attention
                    </span>
                    <span className="text-2xl sm:text-3xl font-extrabold text-redpen dark:text-highlighter-yellow font-mono mt-1 block">
                      {overview.totals.studentsNeedingAttention}
                    </span>
                    <span className="text-[10px] text-ink-muted dark:text-chalkboard-muted">
                      ≥ 2 learning gap topics
                    </span>
                  </div>

                  <div className="p-4 rounded-xl border-2 border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-card dark:bg-chalkboard-card shadow-notebook-sm col-span-2 sm:col-span-1">
                    <span className="text-[11px] font-mono font-bold uppercase text-ink-muted dark:text-chalkboard-muted block">
                      Open Interventions
                    </span>
                    <span className="text-2xl sm:text-3xl font-extrabold text-cyan-600 dark:text-cyan-400 font-mono mt-1 block">
                      {overview.totals.openInterventions ?? classInterventions.filter((i) => i.status === 'PLANNED').length}
                    </span>
                    <span className="text-[10px] text-ink-muted dark:text-chalkboard-muted">
                      active pedagogical plans
                    </span>
                  </div>
                </div>
              )}

              {/* Topics to Reteach Callout */}
              {topicsToReteach.length > 0 && (
                <div className="p-5 rounded-2xl border-2 border-redpen bg-redpen-soft dark:bg-redpen-soft/20 text-redpen-dark dark:text-redpen-soft flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-notebook-sm">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-redpen text-white flex-shrink-0 mt-0.5">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold uppercase tracking-wider bg-redpen text-white px-2 py-0.5 rounded">
                          Priority Focus
                        </span>
                        <h4 className="font-bold text-base text-ink dark:text-chalkboard-chalk">
                          Topics Recommended for Whole-Class Reteaching
                        </h4>
                      </div>
                      <p className="text-xs sm:text-sm text-ink-muted dark:text-chalkboard-muted mt-1">
                        Diagnostic data indicates the highest concentration of student learning gaps in:{' '}
                        <strong>
                          {topicsToReteach.map((t) => `${t.topicName} (${t.gapCount} students)`).join(' and ')}
                        </strong>. Consider a 10-minute warm-up review or lab walkthrough.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Topic Gap Bar Visualizations */}
              {overview?.topics && overview.topics.length > 0 ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-ink dark:text-chalkboard-chalk">
                    Topic Breakdown (Ranked by Learning Gaps)
                  </h3>

                  <div className="grid grid-cols-1 gap-4">
                    {overview.topics.map((t) => {
                      const totalStudents = overview.totals.enrolledStudents || 1;
                      const gapPct = Math.round((t.gapCount / totalStudents) * 100);
                      const devPct = Math.round((t.developingCount / totalStudents) * 100);
                      const strPct = Math.round((t.strengthCount / totalStudents) * 100);
                      const noDataPct = Math.max(0, 100 - gapPct - devPct - strPct);

                      return (
                        <NotebookCard
                          key={t.topicId}
                          pattern="ruled"
                          borderStyle="sketch"
                          className="p-4 sm:p-5 bg-paper-card dark:bg-chalkboard-card space-y-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <span className="px-2 py-0.5 rounded bg-highlighter-yellow/30 text-ink font-mono font-bold text-xs border border-ink/20">
                                Rank #{t.rank}
                              </span>
                              <h4 className="font-bold text-base text-ink dark:text-chalkboard-chalk">
                                {t.topicName}
                              </h4>
                            </div>

                            <div className="text-xs font-mono text-ink-muted dark:text-chalkboard-muted">
                              <span>Class Average: </span>
                              <strong className="text-ink dark:text-chalkboard-chalk">
                                {t.averageMasteryPercent != null ? `${t.averageMasteryPercent}%` : 'No Data'}
                              </strong>
                            </div>
                          </div>

                          {/* Accessible CSS Stacked Bar */}
                          <div
                            className="w-full h-5 rounded-lg overflow-hidden flex border border-ink/30 dark:border-chalkboard-borderSubtle bg-paper-warm dark:bg-chalkboard-surface"
                            role="progressbar"
                            aria-label={`Student distribution for ${t.topicName}: ${t.gapCount} gap, ${t.developingCount} developing, ${t.strengthCount} strength, ${t.noDataCount + t.insufficientDataCount} no data`}
                          >
                            {gapPct > 0 && (
                              <div
                                style={{ width: `${gapPct}%` }}
                                className="bg-redpen h-full"
                                title={`Gap: ${t.gapCount} students (${gapPct}%)`}
                              />
                            )}
                            {devPct > 0 && (
                              <div
                                style={{ width: `${devPct}%` }}
                                className="bg-amber-400 h-full"
                                title={`Developing: ${t.developingCount} students (${devPct}%)`}
                              />
                            )}
                            {strPct > 0 && (
                              <div
                                style={{ width: `${strPct}%` }}
                                className="bg-emerald-500 h-full"
                                title={`Strength: ${t.strengthCount} students (${strPct}%)`}
                              />
                            )}
                            {noDataPct > 0 && (
                              <div
                                style={{ width: `${noDataPct}%` }}
                                className="bg-ink/10 dark:bg-chalkboard-highlight h-full"
                                title={`No Data: ${t.noDataCount + t.insufficientDataCount} students (${noDataPct}%)`}
                              />
                            )}
                          </div>

                          {/* Text labels and icons (Never color alone!) */}
                          <div className="flex flex-wrap items-center justify-between text-xs font-mono pt-1 text-ink-muted dark:text-chalkboard-muted gap-2">
                            <div className="flex flex-wrap items-center gap-4">
                              <span className="flex items-center gap-1 text-redpen-dark dark:text-redpen">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                <strong>{t.gapCount}</strong> Gap ({gapPct}%)
                              </span>
                              <span className="flex items-center gap-1 text-amber-700 dark:text-amber-400">
                                <Clock className="w-3.5 h-3.5" />
                                <strong>{t.developingCount}</strong> Developing ({devPct}%)
                              </span>
                              <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <strong>{t.strengthCount}</strong> Strength ({strPct}%)
                              </span>
                              {(t.noDataCount + t.insufficientDataCount) > 0 && (
                                <span className="flex items-center gap-1 text-ink-muted dark:text-chalkboard-muted">
                                  <HelpCircle className="w-3.5 h-3.5" />
                                  <strong>{t.noDataCount + t.insufficientDataCount}</strong> Not Started
                                </span>
                              )}
                            </div>

                            <span className="text-[11px] font-mono">
                              {t.gapCount > 0 ? (
                                <span className="text-redpen font-bold">Needs Reteach</span>
                              ) : (
                                <span className="text-emerald-700 dark:text-emerald-400 font-bold">Solid Foundation</span>
                              )}
                            </span>
                          </div>
                        </NotebookCard>
                      );
                    })}
                  </div>

                  {/* Screen Reader Companion Data Table */}
                  <details className="mt-4 text-xs font-mono text-ink-muted dark:text-chalkboard-muted cursor-pointer">
                    <summary className="font-bold underline hover:text-ink dark:hover:text-chalkboard-chalk">
                      View Raw Topic Breakdown Data Table (Accessible Format)
                    </summary>
                    <div className="mt-3 overflow-x-auto rounded-xl border border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-card dark:bg-chalkboard-card p-2">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-ink/10 dark:border-chalkboard-borderSubtle uppercase">
                            <th className="p-2">Rank</th>
                            <th className="p-2">Topic</th>
                            <th className="p-2">Gap Count</th>
                            <th className="p-2">Developing</th>
                            <th className="p-2">Strength</th>
                            <th className="p-2">No Data</th>
                            <th className="p-2">Class Average</th>
                          </tr>
                        </thead>
                        <tbody>
                          {overview.topics.map((t) => (
                            <tr key={t.topicId} className="border-b border-ink/5 dark:border-chalkboard-borderSubtle">
                              <td className="p-2 font-bold">{t.rank}</td>
                              <td className="p-2 font-bold">{t.topicName}</td>
                              <td className="p-2 text-redpen font-bold">{t.gapCount}</td>
                              <td className="p-2 text-amber-700">{t.developingCount}</td>
                              <td className="p-2 text-emerald-700">{t.strengthCount}</td>
                              <td className="p-2">{t.noDataCount + t.insufficientDataCount}</td>
                              <td className="p-2 font-bold">{t.averageMasteryPercent != null ? `${t.averageMasteryPercent}%` : '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </details>
                </div>
              ) : (
                <NotebookCard className="p-8 text-center text-xs text-ink-muted dark:text-chalkboard-muted">
                  No topic diagnostic data available yet.
                </NotebookCard>
              )}
            </div>

            {/* PART 4: CLASS ASSESSMENTS & SCHEDULE SECTION */}
            <div className="space-y-6 pt-6 border-t border-ink/15 dark:border-chalkboard-borderSubtle">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-ink dark:text-chalkboard-chalk flex items-center gap-2">
                    <BookOpenCheck className="w-6 h-6 text-redpen dark:text-highlighter-yellow" />
                    <span>Class Assessment Controls</span>
                    <span className="text-sm font-mono font-normal text-ink-muted dark:text-chalkboard-muted">
                      ({assessments.length} assessments)
                    </span>
                  </h2>
                  <p className="text-xs sm:text-sm text-ink-muted dark:text-chalkboard-muted">
                    Configure availability dates, deadlines, and retake allowances specifically for students in this section.
                  </p>
                </div>
              </div>

              {scheduleSuccess && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-500 rounded-xl text-emerald-800 dark:text-emerald-200 text-xs font-mono flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{scheduleSuccess}</span>
                </div>
              )}

              {assessments.length === 0 ? (
                <NotebookCard className="p-8 text-center text-xs text-ink-muted dark:text-chalkboard-muted">
                  No published assessments found for this subject.
                </NotebookCard>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {assessments.map((asm) => {
                    const now = new Date();
                    const fromDate = asm.availableFrom ? new Date(asm.availableFrom) : null;
                    const untilDate = asm.availableUntil ? new Date(asm.availableUntil) : null;
                    const isClosed = untilDate && now > untilDate;
                    const isNotOpen = fromDate && now < fromDate;

                    return (
                      <NotebookCard
                        key={asm.assessmentId}
                        className="p-5 flex flex-col justify-between space-y-4 border-2 border-ink/15 hover:border-ink/30 transition-all shadow-notebook"
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-base font-bold text-ink dark:text-chalkboard-chalk">
                              {asm.title}
                            </h3>
                            {asm.hasCustomSetting && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                CUSTOM
                              </span>
                            )}
                          </div>
                          {asm.description && (
                            <p className="text-xs text-ink-muted dark:text-chalkboard-muted line-clamp-2">
                              {asm.description}
                            </p>
                          )}

                          {/* Scheduling & Retake badges */}
                          <div className="pt-2 flex flex-wrap gap-2 text-xs font-mono">
                            <span
                              className={`px-2.5 py-1 rounded-md border flex items-center gap-1.5 ${
                                isClosed
                                  ? 'bg-redpen-soft text-redpen-dark border-redpen/30 font-bold'
                                  : isNotOpen
                                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                                  : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                              }`}
                            >
                              <Clock className="w-3.5 h-3.5" />
                              {isClosed
                                ? 'Closed by Schedule'
                                : isNotOpen
                                ? `Opens: ${fromDate.toLocaleDateString()}`
                                : untilDate
                                ? `Due: ${untilDate.toLocaleDateString()}`
                                : 'Always Open'}
                            </span>

                            <span
                              className={`px-2.5 py-1 rounded-md border flex items-center gap-1.5 ${
                                asm.allowRetakes
                                  ? 'bg-ink/5 dark:bg-chalkboard-highlight text-ink dark:text-chalkboard-chalk border-ink/20 dark:border-chalkboard-borderSubtle'
                                  : 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
                              }`}
                            >
                              {asm.allowRetakes ? <Unlock className="w-3.5 h-3.5 text-emerald-600" /> : <Lock className="w-3.5 h-3.5 text-amber-700" />}
                              {asm.allowRetakes ? 'Retakes Allowed' : 'Retakes Locked'}
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-3 border-t border-ink/10 dark:border-chalkboard-borderSubtle flex items-center justify-end gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleOpenUnlockModal(asm)}
                            title="Reopen assessment or extend deadline for a student"
                            className="text-xs"
                          >
                            <Unlock className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                            Unlock Student
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleOpenScheduleModal(asm)}
                            className="text-xs"
                          >
                            Edit Schedule
                          </Button>
                        </div>
                      </NotebookCard>
                    );
                  })}
                </div>
              )}
            </div>

            {/* PART 2: STUDENT ROSTER SECTION */}
            <div className="space-y-6 pt-6 border-t border-ink/15 dark:border-chalkboard-borderSubtle">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-ink dark:text-chalkboard-chalk flex items-center gap-2">
                    <Users className="w-6 h-6 text-redpen dark:text-highlighter-yellow" />
                    <span>Class Student Roster</span>
                    <span className="text-sm font-mono font-normal text-ink-muted dark:text-chalkboard-muted">
                      ({roster.length} total)
                    </span>
                  </h2>
                  <p className="text-xs sm:text-sm text-ink-muted dark:text-chalkboard-muted">
                    Individual student progress, diagnostic assessment results, and conceptual learning gaps.
                  </p>
                </div>

                {/* Search & Sort Controls */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-60">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-ink-muted dark:text-chalkboard-muted pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search student or email…"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border-2 border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-card dark:bg-chalkboard-card text-xs font-mono text-ink dark:text-chalkboard-chalk focus:outline-none focus:border-redpen"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 bg-paper-card dark:bg-chalkboard-card px-3 py-1.5 rounded-xl border-2 border-ink/20 dark:border-chalkboard-borderSubtle text-xs font-mono">
                    <ArrowUpDown className="w-3.5 h-3.5 text-ink-muted dark:text-chalkboard-muted" />
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="bg-transparent text-ink dark:text-chalkboard-chalk focus:outline-none text-xs font-mono font-bold cursor-pointer"
                    >
                      <option value="name">Sort by Name</option>
                      <option value="gaps">Sort by Most Gaps</option>
                      <option value="diagnostic">Sort by Diagnostic %</option>
                    </select>
                  </div>
                </div>
              </div>

              {roster.length === 0 ? (
                <NotebookCard
                  pattern="ruled"
                  borderStyle="sketch"
                  className="p-10 text-center space-y-3 bg-paper-card dark:bg-chalkboard-card"
                >
                  <div className="w-12 h-12 rounded-xl bg-highlighter-yellow/30 border border-ink/20 flex items-center justify-center mx-auto">
                    <Users className="w-6 h-6 text-ink-muted dark:text-chalkboard-muted" />
                  </div>
                  <h4 className="font-bold text-base text-ink dark:text-chalkboard-chalk">
                    No students have joined yet
                  </h4>
                  <p className="text-xs text-ink-muted dark:text-chalkboard-muted max-w-md mx-auto">
                    Share your join code <strong className="font-mono text-redpen">{classDetail.joinCode}</strong> with your students. As soon as they enter it, their roster entry and topic analysis will appear here.
                  </p>
                </NotebookCard>
              ) : filteredAndSortedRoster.length === 0 ? (
                <NotebookCard className="p-8 text-center text-xs text-ink-muted dark:text-chalkboard-muted">
                  No students match your search filter "<strong>{searchQuery}</strong>".
                </NotebookCard>
              ) : (
                <>
                  {/* Desktop / Tablet Table View */}
                  <div className="hidden md:block overflow-x-auto rounded-xl border-2 border-ink dark:border-chalkboard-border bg-paper-card dark:bg-chalkboard-card shadow-notebook-sm">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b-2 border-ink dark:border-chalkboard-borderSubtle bg-paper-warm dark:bg-chalkboard-surface font-mono uppercase text-ink dark:text-chalkboard-chalk">
                          <th className="py-3 px-3">#</th>
                          <th className="py-3 px-3">Student</th>
                          <th className="py-3 px-3">Status</th>
                          <th className="py-3 px-3">
                            {filteredAndSortedRoster[0]?.latestDiagnostic?.label || 'Latest Assessment'}
                          </th>
                          <th className="py-3 px-3">Curriculum Topics</th>
                          <th className="py-3 px-3">Attempts</th>
                          <th className="py-3 px-3">Interventions</th>
                          <th className="py-3 px-3">Joined</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-ink/10 dark:divide-chalkboard-borderSubtle font-mono">
                        {filteredAndSortedRoster.map((student, idx) => (
                          <tr
                            key={student.studentId}
                            className="hover:bg-highlighter-yellow/10 dark:hover:bg-chalkboard-highlight transition-colors"
                          >
                            <td className="py-3 px-3 text-ink-muted dark:text-chalkboard-muted font-bold">
                              {idx + 1}
                            </td>

                            {/* Student Name & Email (Links to Student Detail Page) */}
                            <td className="py-3 px-3">
                              <Link
                                to={`/teacher/classes/${id}/students/${student.studentId}`}
                                className="font-bold text-sm text-ink dark:text-chalkboard-chalk block hover:text-redpen hover:underline transition-colors"
                              >
                                {student.name}
                              </Link>
                              <span className="text-[11px] text-ink-muted dark:text-chalkboard-muted flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {student.email}
                              </span>
                            </td>

                            {/* Attention Flag */}
                            <td className="py-3 px-3">
                              {student.needsAttention ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-redpen-soft text-redpen-dark border border-redpen/40">
                                  <AlertTriangle className="w-3 h-3 text-redpen" />
                                  <span>Needs Attention ({student.gapCount} Gaps)</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-900 border border-emerald-300">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                                  <span>On Track</span>
                                </span>
                              )}
                            </td>

                            {/* Latest Assessment / Quiz Score */}
                            <td className="py-3 px-3">
                              {student.latestDiagnostic ? (
                                <div>
                                  <span className="font-bold text-ink dark:text-chalkboard-chalk block">
                                    {student.latestDiagnostic.score} / {student.latestDiagnostic.maxScore} (
                                    {student.latestDiagnostic.percent}%)
                                  </span>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="text-[9px] font-mono uppercase px-1 py-0.2 rounded bg-ink/10 text-ink-muted font-bold">
                                      {student.latestDiagnostic.label || 'Diagnostic'}
                                    </span>
                                    <span className="text-[10px] text-ink-muted dark:text-chalkboard-muted">
                                      {formatDate(student.latestDiagnostic.submittedAt)}
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-ink-muted dark:text-chalkboard-muted italic">
                                  Not started
                                </span>
                              )}
                            </td>

                            {/* Topic Mastery Chips with Text & Icon */}
                            <td className="py-3 px-3">
                              <div className="flex flex-wrap items-center gap-1 max-w-xs">
                                {student.topics.map((t) => {
                                  let bgClass = 'bg-ink/10 text-ink-muted border-ink/20';
                                  let labelText = 'NO DATA';
                                  if (t.status === 'STRENGTH') {
                                    bgClass = 'bg-emerald-100 text-emerald-900 border-emerald-300';
                                    labelText = 'STR';
                                  } else if (t.status === 'DEVELOPING') {
                                    bgClass = 'bg-amber-100 text-amber-900 border-amber-300';
                                    labelText = 'DEV';
                                  } else if (t.status === 'GAP') {
                                    bgClass = 'bg-redpen-soft text-redpen-dark border-redpen/40 font-bold';
                                    labelText = 'GAP';
                                  } else if (t.status === 'INSUFFICIENT_DATA') {
                                    labelText = 'INC';
                                  }

                                  return (
                                    <span
                                      key={t.topicId}
                                      className={`px-1.5 py-0.5 rounded text-[9px] font-mono border ${bgClass}`}
                                      title={`${t.topicName}: ${t.status} (${t.masteryPercent != null ? t.masteryPercent + '%' : 'No Data'})`}
                                    >
                                      {t.topicName.slice(0, 4)}: {labelText}
                                    </span>
                                  );
                                })}
                              </div>
                            </td>

                            {/* Attempts Count in this class */}
                            <td className="py-3 px-3 font-bold text-ink dark:text-chalkboard-chalk">
                              {student.attemptsCount}
                            </td>

                            {/* Interventions */}
                            <td className="py-3 px-3">
                              {student.openInterventions > 0 ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 text-cyan-900 border border-cyan-300 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-800">
                                  <HeartHandshake className="w-3 h-3 text-cyan-700 dark:text-cyan-300" />
                                  <span>{student.openInterventions} Open</span>
                                </span>
                              ) : (
                                <span className="text-ink-muted dark:text-chalkboard-muted">—</span>
                              )}
                            </td>

                            {/* Joined Date */}
                            <td className="py-3 px-3 text-ink-muted dark:text-chalkboard-muted">
                              {formatDate(student.joinedAt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Responsive Cards View */}
                  <div className="md:hidden space-y-4">
                    {filteredAndSortedRoster.map((student, idx) => (
                      <NotebookCard
                        key={student.studentId}
                        pattern="ruled"
                        borderStyle="sketch"
                        className="p-4 bg-paper-card dark:bg-chalkboard-card space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <Link
                              to={`/teacher/classes/${id}/students/${student.studentId}`}
                              className="font-bold text-base text-ink dark:text-chalkboard-chalk block hover:text-redpen hover:underline"
                            >
                              {student.name}
                            </Link>
                            <span className="text-xs text-ink-muted dark:text-chalkboard-muted flex items-center gap-1 font-mono">
                              <Mail className="w-3 h-3" />
                              {student.email}
                            </span>
                          </div>

                          {student.needsAttention ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-redpen-soft text-redpen-dark border border-redpen/40">
                              <AlertTriangle className="w-3 h-3 text-redpen" />
                              <span>Needs Attention</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-900 border border-emerald-300">
                              <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                              <span>On Track</span>
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-xs font-mono pt-2 border-t border-ink/10 dark:border-chalkboard-borderSubtle">
                          <div>
                            <span className="text-ink-muted block text-[10px] uppercase">
                              {student.latestDiagnostic?.label || 'Assessment'}
                            </span>
                            <span className="font-bold text-ink dark:text-chalkboard-chalk">
                              {student.latestDiagnostic
                                ? `${student.latestDiagnostic.score}/${student.latestDiagnostic.maxScore} (${student.latestDiagnostic.percent}%)`
                                : 'Not started'}
                            </span>
                          </div>
                          <div>
                            <span className="text-ink-muted block text-[10px] uppercase">Attempts</span>
                            <span className="font-bold text-ink dark:text-chalkboard-chalk">
                              {student.attemptsCount}
                            </span>
                          </div>
                          <div>
                            <span className="text-ink-muted block text-[10px] uppercase">Interventions</span>
                            <span className="font-bold text-ink dark:text-chalkboard-chalk">
                              {student.openInterventions > 0 ? (
                                <span className="text-cyan-700 dark:text-cyan-300 font-bold">
                                  {student.openInterventions} open
                                </span>
                              ) : (
                                '—'
                              )}
                            </span>
                          </div>
                        </div>

                        {/* Mobile Topic Chips */}
                        <div className="pt-2 border-t border-ink/10 dark:border-chalkboard-borderSubtle space-y-1.5">
                          <span className="text-[10px] font-mono uppercase text-ink-muted block">
                            Topic Mastery:
                          </span>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {student.topics.map((t) => {
                              let bgClass = 'bg-ink/10 text-ink-muted border-ink/20';
                              let labelText = 'NO DATA';
                              if (t.status === 'STRENGTH') {
                                bgClass = 'bg-emerald-100 text-emerald-900 border-emerald-300';
                                labelText = 'STR';
                              } else if (t.status === 'DEVELOPING') {
                                bgClass = 'bg-amber-100 text-amber-900 border-amber-300';
                                labelText = 'DEV';
                              } else if (t.status === 'GAP') {
                                bgClass = 'bg-redpen-soft text-redpen-dark border-redpen/40 font-bold';
                                labelText = 'GAP';
                              }
                              return (
                                <span
                                  key={t.topicId}
                                  className={`px-2 py-0.5 rounded text-[10px] font-mono border ${bgClass}`}
                                >
                                  {t.topicName}: {labelText}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </NotebookCard>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* PART 3: PEDAGOGICAL INTERVENTIONS SECTION */}
            <div className="space-y-4 pt-6 border-t border-ink/15 dark:border-chalkboard-borderSubtle">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-ink dark:text-chalkboard-chalk flex items-center gap-2">
                    <HeartHandshake className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
                    <span>Pedagogical Interventions</span>
                    <span className="text-sm font-mono font-normal text-ink-muted dark:text-chalkboard-muted">
                      ({classInterventions.length} total)
                    </span>
                  </h2>
                  <p className="text-xs sm:text-sm text-ink-muted dark:text-chalkboard-muted">
                    Active and completed targeted interventions logged for students in this class. Click a student to log or update support.
                  </p>
                </div>
              </div>

              {classInterventions.length === 0 ? (
                <NotebookCard
                  pattern="ruled"
                  borderStyle="sketch"
                  className="p-8 text-center space-y-2 bg-paper-card dark:bg-chalkboard-card"
                >
                  <div className="w-10 h-10 rounded-xl bg-cyan-100 dark:bg-cyan-950/50 border border-cyan-300 dark:border-cyan-800 flex items-center justify-center mx-auto text-cyan-700 dark:text-cyan-400">
                    <HeartHandshake className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-sm text-ink dark:text-chalkboard-chalk">
                    No Interventions Logged Yet
                  </h4>
                  <p className="text-xs text-ink-muted dark:text-chalkboard-muted max-w-md mx-auto">
                    To record one-on-one sessions, extra practice, or remedial reviews, click any student in the roster above and use the "Log Intervention" button.
                  </p>
                </NotebookCard>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {classInterventions.map((itv) => {
                    const isDone = itv.status === 'DONE';
                    const isCancelled = itv.status === 'CANCELLED';
                    return (
                      <NotebookCard
                        key={itv.id}
                        className="p-4 bg-paper-card dark:bg-chalkboard-card flex flex-col justify-between gap-3 text-xs font-mono"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-start justify-between gap-2">
                            <Link
                              to={`/teacher/classes/${id}/students/${itv.studentId}`}
                              className="font-bold text-sm text-ink dark:text-chalkboard-chalk hover:text-redpen hover:underline line-clamp-1"
                            >
                              {itv.studentName || `Student #${itv.studentId}`}
                            </Link>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                                isDone
                                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
                                  : isCancelled
                                  ? 'bg-ink/10 text-ink-muted border-ink/20'
                                  : 'bg-cyan-100 text-cyan-900 border-cyan-300 dark:bg-cyan-950/50 dark:text-cyan-300 dark:border-cyan-800'
                              }`}
                            >
                              {itv.status}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-[11px]">
                            <span className="px-2 py-0.5 rounded bg-paper-warm dark:bg-chalkboard-surface border border-ink/20 font-bold text-ink dark:text-chalkboard-chalk">
                              {itv.topicName}
                            </span>
                            <span className="text-ink-muted dark:text-chalkboard-muted">
                              {itv.type.replace('_', ' ')}
                            </span>
                            {itv.followUpDate && !isDone && !isCancelled && (
                              <span className="text-ink-muted dark:text-chalkboard-muted">
                                • Follow-up: {new Date(itv.followUpDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>

                          {itv.note && (
                            <p className="text-xs text-ink/80 dark:text-chalkboard-chalk/80 font-sans italic line-clamp-2 pt-1 border-t border-ink/10 dark:border-chalkboard-borderSubtle">
                              "{itv.note}"
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-ink/10 dark:border-chalkboard-borderSubtle text-[10px]">
                          <div className="flex items-center gap-2">
                            {itv.outcome && (
                              <span
                                className={`px-2 py-0.5 rounded font-bold border flex items-center gap-1 ${
                                  itv.outcome === 'IMPROVED'
                                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                    : itv.outcome === 'DECLINED'
                                    ? 'bg-redpen-soft text-redpen-dark border-redpen/40'
                                    : itv.outcome === 'SAME'
                                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                                    : 'bg-ink/10 text-ink-muted border-ink/20'
                                }`}
                              >
                                {itv.outcome === 'NO_NEW_DATA' ? (
                                  <>
                                    <Clock className="w-3 h-3" />
                                    <span>Waiting for next quiz</span>
                                  </>
                                ) : itv.outcome === 'IMPROVED' ? (
                                  <span>Improved</span>
                                ) : itv.outcome === 'DECLINED' ? (
                                  <span>Declined</span>
                                ) : itv.outcome === 'SAME' ? (
                                  <span>Stable</span>
                                ) : (
                                  <span>Outcome: {itv.outcome}</span>
                                )}
                              </span>
                            )}
                          </div>
                          <Link
                            to={`/teacher/classes/${id}/students/${itv.studentId}`}
                            className="text-redpen hover:underline font-bold"
                          >
                            View Student →
                          </Link>
                        </div>
                      </NotebookCard>
                    );
                  })}
                </div>
              )}
            </div>

            {/* PART 5: TEACHER VALIDATION LAB SECTION */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-ink/10 dark:border-chalkboard-borderSubtle pb-3 gap-2">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-ink dark:text-chalkboard-chalk flex items-center gap-2">
                    <FlaskConical className="w-6 h-6 text-redpen dark:text-highlighter-yellow" />
                    <span>Teacher Validation Lab</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-ink-muted dark:text-chalkboard-muted">
                    Blind evaluation study comparing teacher judgments with automated gap classifications.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    to={`/teacher/classes/${id}/validation/report`}
                    variant="secondary"
                    size="sm"
                    className="text-xs"
                  >
                    <BarChart3 className="w-3.5 h-3.5 mr-1" />
                    <span>View Agreement Report</span>
                  </Button>
                  <Button
                    to={`/teacher/classes/${id}/validation`}
                    variant="primary"
                    size="sm"
                    className="text-xs"
                  >
                    <span>Enter Validation Lab</span>
                  </Button>
                </div>
              </div>

              <NotebookCard
                ruled
                marginLine
                lifted
                className="p-6 bg-paper-card dark:bg-chalkboard-card border-2 border-ink dark:border-chalkboard-border space-y-4"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-2 max-w-2xl">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-ink-muted dark:text-chalkboard-muted">
                      Research & Accuracy Benchmark
                    </span>
                    <h3 className="text-lg font-extrabold text-ink dark:text-chalkboard-chalk">
                      Validate Learning Gaps Blindly
                    </h3>
                    <p className="text-xs sm:text-sm text-ink-muted dark:text-chalkboard-muted leading-relaxed">
                      Evaluate your students’ topic mastery based strictly on their raw quiz answers without seeing system scores.
                      This generates ground-truth data to measure whether LearningPal meets the 85% agreement objective across 30+ students.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
                    <Button
                      to={`/teacher/classes/${id}/validation`}
                      variant="mint"
                      size="md"
                      className="w-full sm:w-auto"
                    >
                      <FlaskConical className="w-4 h-4 mr-2" />
                      <span>Start Blind Labeling</span>
                    </Button>
                  </div>
                </div>
              </NotebookCard>
            </div>

            {/* PART 6: FEEDBACK QUALITY & STUDENT RATINGS */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-ink/10 dark:border-chalkboard-borderSubtle pb-3 gap-2">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-ink dark:text-chalkboard-chalk flex items-center gap-2">
                    <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
                    <span>Feedback Quality & Student Ratings</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-ink-muted dark:text-chalkboard-muted">
                    Anonymous student ratings on diagnostic feedback and study materials (Target: ≥ 80% Helpful).
                  </p>
                </div>
                {totalRatingsCount > 0 && (
                  <span className="font-mono text-xs font-bold px-3 py-1 rounded-full border border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-warm dark:bg-chalkboard-surface text-ink dark:text-chalkboard-chalk">
                    {totalRatingsCount} Total Student Ratings
                  </span>
                )}
              </div>

              {totalRatingsCount === 0 ? (
                <NotebookCard className="p-8 text-center space-y-2 bg-paper-card dark:bg-chalkboard-card border-2 border-ink dark:border-chalkboard-border">
                  <div className="w-12 h-12 rounded-2xl bg-highlighter-yellow/30 border border-ink/20 flex items-center justify-center mx-auto">
                    <Star className="w-6 h-6 text-amber-500" />
                  </div>
                  <h3 className="text-base font-bold text-ink dark:text-chalkboard-chalk">
                    No Ratings Yet
                  </h3>
                  <p className="text-xs text-ink-muted dark:text-chalkboard-muted max-w-md mx-auto leading-relaxed">
                    As students in this section review their diagnostic feedback and recommended study resources, their anonymous helpfulness ratings (1 to 5) and comments will appear here.
                  </p>
                </NotebookCard>
              ) : (
                <div className="space-y-6">
                  {/* Topic Ratings Table */}
                  <div className="bg-paper-card dark:bg-chalkboard-card border-2 border-ink dark:border-chalkboard-border rounded-2xl overflow-hidden shadow-lifted">
                    <div className="px-5 py-3 bg-paper-warm dark:bg-chalkboard-surface border-b-2 border-ink dark:border-chalkboard-borderSubtle flex items-center justify-between">
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-ink dark:text-chalkboard-chalk">
                        Topic Diagnostic Feedback Ratings
                      </span>
                      <span className="text-xs font-mono text-ink-muted dark:text-chalkboard-muted">
                        Ratings of 4 or 5 count as "Helpful"
                      </span>
                    </div>

                    <div className="divide-y divide-ink/10 dark:divide-chalkboard-borderSubtle overflow-x-auto">
                      <table className="w-full text-left text-xs font-mono">
                        <thead className="bg-paper-warm/50 dark:bg-chalkboard-surface/50 text-ink-muted dark:text-chalkboard-muted">
                          <tr>
                            <th className="px-5 py-2.5 font-bold">Topic</th>
                            <th className="px-4 py-2.5 font-bold text-center">Ratings</th>
                            <th className="px-4 py-2.5 font-bold text-center">Avg Score</th>
                            <th className="px-5 py-2.5 font-bold text-right">Helpful %</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-ink/5 dark:divide-chalkboard-borderSubtle">
                          {topicRatingsList.map((tr) => {
                            const avg = Number(tr.averageRating || 0);
                            const helpful = Number(tr.helpfulPercentage ?? tr.helpfulPercent ?? 0);
                            return (
                              <tr key={tr.topicId} className="hover:bg-paper-warm/30 dark:hover:bg-chalkboard-surface/40 transition-colors">
                                <td className="px-5 py-3 font-sans font-bold text-ink dark:text-chalkboard-chalk">
                                  {tr.topicName}
                                </td>
                                <td className="px-4 py-3 text-center text-ink dark:text-chalkboard-chalk">
                                  {tr.totalRatings}
                                </td>
                                <td className="px-4 py-3 text-center font-bold text-ink dark:text-chalkboard-chalk">
                                  {avg.toFixed(1)} / 5.0
                                </td>
                                <td className="px-5 py-3 text-right">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                                    helpful >= 80
                                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                                      : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                                  }`}>
                                    {helpful.toFixed(0)}%
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Lowest-Rated Resources (for resources with at least 3 ratings) */}
                  {lowestRatedResourcesList.length > 0 && (
                    <div className="bg-paper-card dark:bg-chalkboard-card border-2 border-redpen/40 dark:border-redpen/50 rounded-2xl overflow-hidden shadow-notebook-sm">
                      <div className="px-5 py-3 bg-redpen-soft/40 border-b border-redpen/30 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-mono font-bold text-redpen-dark dark:text-red-300">
                          <AlertTriangle className="w-4 h-4" />
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
                            <div key={res.resourceId} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-ink/20 bg-paper-warm dark:bg-chalkboard-surface font-bold text-ink dark:text-chalkboard-chalk">
                                    {res.resourceType}
                                  </span>
                                  <h4 className="text-sm font-bold text-ink dark:text-chalkboard-chalk">
                                    {res.resourceTitle}
                                  </h4>
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
                      <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-ink-muted dark:text-chalkboard-muted flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        <span>Recent Anonymous Feedback Comments</span>
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {recentCommentsList.slice(0, 6).map((comm, idx) => (
                          <div
                            key={idx}
                            className="p-3.5 rounded-xl border border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-warm/50 dark:bg-chalkboard-surface/50 space-y-1.5"
                          >
                            <div className="flex items-center justify-between text-[11px] font-mono">
                              <span className="font-bold text-ink dark:text-chalkboard-chalk truncate max-w-[200px]">
                                {comm.itemTitle || comm.topicName || 'Topic Feedback'}
                              </span>
                              <span className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                                <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                                {comm.rating}/5
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
              )}
            </div>
          </>
        )}

        {/* Modal: Regenerate Join Code */}
        {showRegenModal && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="regen-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-xs"
          >
            <div className="w-full max-w-md bg-paper-card dark:bg-chalkboard-card border-2 border-ink dark:border-chalkboard-border rounded-2xl p-6 shadow-notebook space-y-4">
              <div className="flex items-center gap-3 text-redpen">
                <RotateCcw className="w-6 h-6" />
                <h3 id="regen-title" className="text-lg font-bold text-ink dark:text-chalkboard-chalk">
                  Regenerate Join Code?
                </h3>
              </div>
              <p className="text-xs text-ink-muted dark:text-chalkboard-muted leading-relaxed">
                A new 6-character code will be generated. The current code (<strong>{classDetail?.joinCode}</strong>) will immediately stop working for new joins. Existing enrolled students will remain in the class.
              </p>
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowRegenModal(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleRegenerateCode}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Generating…' : 'Yes, Generate New Code'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Archive Class */}
        {showArchiveModal && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="archive-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-xs"
          >
            <div className="w-full max-w-md bg-paper-card dark:bg-chalkboard-card border-2 border-ink dark:border-chalkboard-border rounded-2xl p-6 shadow-notebook space-y-4">
              <div className="flex items-center gap-3 text-redpen">
                <ShieldAlert className="w-6 h-6" />
                <h3 id="archive-title" className="text-lg font-bold text-ink dark:text-chalkboard-chalk">
                  Archive Class Section?
                </h3>
              </div>
              <p className="text-xs text-ink-muted dark:text-chalkboard-muted leading-relaxed">
                Archiving this class will stop students from starting new quiz attempts. Enrolled students can still review their past work, feedback, and learning gaps. This action cannot be undone.
              </p>
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowArchiveModal(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleArchive}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Archiving…' : 'Yes, Archive Class'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Edit Assessment Schedule & Retake Rules */}
        {editingAssessment && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="schedule-modal-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-xs"
          >
            <div className="w-full max-w-lg bg-paper-card dark:bg-chalkboard-card border-2 border-ink dark:border-chalkboard-border rounded-2xl p-6 shadow-notebook space-y-5">
              <div className="flex items-center gap-3 text-ink dark:text-chalkboard-chalk">
                <Clock className="w-6 h-6 text-redpen dark:text-highlighter-yellow" />
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
                <div className="p-3 bg-redpen-soft border border-redpen/30 rounded-xl text-redpen-dark text-xs font-mono">
                  {actionError}
                </div>
              )}

              <form onSubmit={handleSaveSchedule} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono uppercase text-ink-muted dark:text-chalkboard-muted mb-1">
                      Available From
                    </label>
                    <input
                      type="datetime-local"
                      value={scheduleForm.availableFrom}
                      onChange={(e) =>
                        setScheduleForm((prev) => ({ ...prev, availableFrom: e.target.value }))
                      }
                      className="w-full px-3 py-2 rounded-xl border-2 border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-card dark:bg-chalkboard-card text-xs font-mono text-ink dark:text-chalkboard-chalk focus:outline-none focus:border-redpen"
                    />
                    <span className="text-[10px] text-ink-muted block mt-1">Leave empty to open immediately</span>
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
                    <span className="text-[10px] text-ink-muted block mt-1">Leave empty for no deadline</span>
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
                      When unchecked, students cannot start another attempt after submitting, unless you grant them an individual unlock.
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
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={actionLoading}
                  >
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
            <div className="w-full max-w-md bg-paper-card dark:bg-chalkboard-card border-2 border-ink dark:border-chalkboard-border rounded-2xl p-6 shadow-notebook space-y-4">
              <div className="flex items-center gap-3 text-ink dark:text-chalkboard-chalk">
                <Unlock className="w-6 h-6 text-emerald-600" />
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
                <div className="p-3 bg-redpen-soft border border-redpen/30 rounded-xl text-redpen-dark text-xs font-mono">
                  {actionError}
                </div>
              )}

              <form onSubmit={handleSaveUnlock} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-ink-muted dark:text-chalkboard-muted mb-1">
                    Select Enrolled Student
                  </label>
                  <select
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
                  <span className="text-[10px] text-ink-muted block mt-1">Leave blank if no extension is needed</span>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      setUnlockModal({ open: false, assessmentId: null, assessmentTitle: '', studentId: '', reason: '', extendedUntil: '' })
                    }
                    disabled={actionLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'Unlocking…' : 'Grant Unlock'}
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
