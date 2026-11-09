import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  GraduationCap,
  Award,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Compass,
  AlertTriangle,
  BookOpen,
  Check,
  Target,
  FileQuestion,
  Layers,
  Link2,
  ExternalLink,
  Download,
  FileText,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { studentService } from '../services/studentService';
import { Button, NotebookCard, PortalShell } from '../components/NotebookPrimitives';
import { StatusBadge, TrendIndicator, MasteryBar } from '../components/MasteryPrimitives';
import { WashiTape } from '../components/Doodles';

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export default function SubjectDashboard() {
  const { subjectId, classId } = useParams();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [workspace, setWorkspace] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [progress, setProgress] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Tab filter for quizzes: 'active' | 'completed'
  const [quizFilter, setQuizFilter] = useState('active');
  const [downloadingId, setDownloadingId] = useState(null);
  const [downloadError, setDownloadError] = useState('');

  const handleDownloadFile = async (res) => {
    const effectiveClassId = classId || workspace?.id;
    if (!effectiveClassId) return;
    setDownloadingId(res.id);
    setDownloadError('');
    try {
      await studentService.downloadClassFile(
        effectiveClassId,
        res.id,
        res.fileName || `${res.title}.${res.fileContentType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ? 'docx' : 'pdf'}`
      );
    } catch (err) {
      setDownloadError(err.message || 'Failed to download file. Please try again.');
    } finally {
      setDownloadingId(null);
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      let resolvedSubjectId = subjectId;
      let classData = null;

      if (classId) {
        classData = await studentService.getClassWorkspace(classId);
        setWorkspace(classData);
        resolvedSubjectId = classData.subject.id;
      } else if (subjectId) {
        // Resolve subject to class workspace and redirect to clean class url
        try {
          const res = await studentService.resolveClassForSubject(subjectId);
          if (res?.classId) {
            navigate(`/student/classes/${res.classId}`, { replace: true });
            return;
          }
        } catch {
          // Fallback if resolving fails
        }
      } else {
        navigate('/student', { replace: true });
        return;
      }

      const [assessmentsData, progressData, materialsData] = await Promise.all([
        studentService.getSubjectAssessments(resolvedSubjectId),
        classId
          ? studentService.getClassProgress(classId).catch(() => null)
          : studentService.getSubjectProgress(resolvedSubjectId).catch(() => null),
        classId
          ? studentService.getClassStudyMaterials(classId).catch(() => [])
          : Promise.resolve([]),
      ]);
      setAssessments(assessmentsData || []);
      setProgress(progressData);
      setMaterials(materialsData || []);
    } catch (err) {
      if (err.status === 401 || err.message?.includes('authentication is required')) {
        logout();
        navigate('/login', { replace: true });
        return;
      }
      if (err.status === 403 || err.message?.includes('not enrolled')) {
        setError(err.message || 'You are not enrolled in this class or subject.');
        return;
      }
      if (err.status === 404) {
        setError('Class or subject not found. You may not be enrolled in this class.');
        return;
      }
      setError(err.message || 'Unable to load class workspace. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [subjectId, classId]);

  // Derived classification & data
  const diagnostic = assessments.find((a) =>
    a.title.toLowerCase().includes('diagnostic')
  );

  const topicQuizzes = assessments.filter(
    (a) => !a.title.toLowerCase().includes('diagnostic')
  );

  const isDiagnosticSubmitted = diagnostic?.latestAttemptStatus === 'SUBMITTED';

  const hasAnyAttempts =
    progress?.topics?.some((t) => t.status !== 'INSUFFICIENT_DATA' || t.questionsAnswered > 0) ?? false;

  const subjectName =
    workspace?.subject?.name ||
    diagnostic?.subjectName ||
    assessments[0]?.subjectName ||
    'Class Workspace';

  const effectiveSubjectId =
    workspace?.subject?.id ||
    (subjectId && subjectId !== 'undefined' && !isNaN(subjectId) ? subjectId : null);

  const isArchived = workspace ? !workspace.canAttempt : false;

  // Breakdown of topics by mastery status
  const priorityGaps = progress?.topics?.filter((t) => t.status === 'GAP') || [];
  const masteredTopics = progress?.topics?.filter((t) => t.status === 'STRENGTH') || [];
  const developingTopics = progress?.topics?.filter((t) => t.status === 'DEVELOPING') || [];

  // Group assessments into Active and Completed
  const inProgressQuiz = assessments.find((a) => a.latestAttemptStatus === 'IN_PROGRESS');
  const activeQuizzes = topicQuizzes.filter((q) => q.latestAttemptStatus !== 'SUBMITTED');
  const completedQuizzes = [
    ...(diagnostic && isDiagnosticSubmitted ? [diagnostic] : []),
    ...topicQuizzes.filter((q) => q.latestAttemptStatus === 'SUBMITTED'),
  ];

  const progressUrl = classId
    ? `/student/classes/${classId}/progress`
    : effectiveSubjectId
    ? `/student/subjects/${effectiveSubjectId}/progress`
    : '/student/progress';

  const getTopicProgressUrl = (topicId) =>
    classId
      ? `/student/classes/${classId}/progress/topics/${topicId}`
      : effectiveSubjectId
      ? `/student/subjects/${effectiveSubjectId}/progress/topics/${topicId}`
      : `/student/progress/topics/${topicId}`;

  return (
    <PortalShell
      portalSubtitle="Student Learning Notebook"
      user={user}
      onLogout={logout}
      badgeIcon={GraduationCap}
      badgeLabel={workspace ? `Class: ${workspace.name}` : 'Class Workspace'}
      badgeColorClass={
        isArchived
          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200'
          : 'bg-highlighter-mint text-ink'
      }
      title={workspace ? `${workspace.subject.name} (${workspace.name})` : subjectName}
      subtitle={
        workspace
          ? `Instructor: ${workspace.teacherName || 'Assigned Instructor'} • Status: ${workspace.status}`
          : 'Complete diagnostic quizzes, analyze your strengths and learning gaps, and master topics.'
      }
      headerRight={
        <div className="flex items-center gap-2">
          <Link
            to="/student"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-ink/25 dark:border-chalkboard-borderSubtle text-ink dark:text-chalkboard-chalk bg-paper-card dark:bg-chalkboard-card hover:bg-paper-warm dark:hover:bg-chalkboard-surface shadow-xs transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>My Classes</span>
          </Link>
          <Link
            to={progressUrl}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-ink/25 dark:border-chalkboard-borderSubtle text-ink dark:text-chalkboard-chalk bg-paper-card dark:bg-chalkboard-card hover:bg-highlighter-yellow/30 shadow-xs transition-colors"
          >
            <Compass className="w-3.5 h-3.5 text-ink-blue dark:text-highlighter-mint" />
            <span>Gap Analysis</span>
          </Link>
        </div>
      }
    >
      <div className="w-full space-y-8">
        {/* Breadcrumb Navigation Bar */}
        <nav aria-label="Breadcrumb" className="flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2 text-ink-muted dark:text-chalkboard-muted">
            <Link
              to="/student"
              className="hover:text-ink dark:hover:text-chalkboard-chalk underline underline-offset-2 flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>My Classes</span>
            </Link>
            <span>/</span>
            <span className="font-bold text-ink dark:text-chalkboard-chalk">
              {workspace ? `${workspace.subject.name} - ${workspace.name}` : subjectName}
            </span>
          </div>
          <span className="text-ink-muted dark:text-chalkboard-muted hidden sm:inline">
            {workspace ? `Class #${workspace.id} • ${workspace.status}` : `Subject #${effectiveSubjectId || subjectId}`}
          </span>
        </nav>

        {/* Archived Banner if applicable */}
        {isArchived && (
          <div className="p-4 rounded-xl border-2 border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="text-sm font-bold">This class is archived</p>
              <p className="text-xs mt-0.5">
                This class has been archived by your instructor. Past attempts and feedback remain viewable, but new attempts cannot be started.
              </p>
            </div>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="py-20 text-center space-y-4">
            <RefreshCw className="w-9 h-9 animate-spin mx-auto text-redpen" />
            <p className="font-hand text-2xl text-ink-muted dark:text-chalkboard-muted">
              Opening subject notebook and loading your workspace…
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
                <p className="text-xs mt-0.5">
                  {error.includes('not enrolled')
                    ? 'Return to your subjects desk to self-enroll in this course.'
                    : 'Check your connection or try loading again.'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="secondary" onClick={() => navigate('/student')}>
                Back to Desk
              </Button>
              <Button size="sm" variant="primary" onClick={loadData}>
                <RefreshCw className="w-3.5 h-3.5 mr-1" />
                Retry
              </Button>
            </div>
          </div>
        )}

        {/* Loaded Content */}
        {!loading && !error && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* =========================================================================
                LEFT / MAIN COLUMN (8 cols desktop): Hero Action + Filterable Quizzes
            ========================================================================= */}
            <div className="lg:col-span-8 space-y-8">
              {/* ---------------------------------------------------------------------
                  HERO BLOCK: Dynamic State-Aware Action Card (Taped Index Card Motif)
              --------------------------------------------------------------------- */}
              {assessments.length === 0 ? (
                /* STATE 0 HERO: Teacher Still Setting Up Class */
                <div className="relative pt-3">
                  <div className="absolute -top-1 left-8 z-10">
                    <WashiTape
                      colorClass="bg-highlighter-yellow/90 dark:bg-yellow-500/50"
                      rotate="-rotate-1"
                    />
                  </div>
                  <NotebookCard
                    pattern="grid"
                    borderStyle="sketch"
                    className="p-8 text-center space-y-4 bg-paper-warm dark:bg-chalkboard-card border-2 border-ink dark:border-chalkboard-border shadow-notebook-sm"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-highlighter-yellow/30 border border-ink/20 flex items-center justify-center mx-auto text-redpen dark:text-highlighter-yellow">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h2 className="text-xl sm:text-2xl font-extrabold text-ink dark:text-chalkboard-chalk">
                        Your teacher is still setting up this class
                      </h2>
                      <p className="text-xs sm:text-sm text-ink-muted dark:text-chalkboard-muted max-w-md mx-auto leading-relaxed">
                        No published quizzes or diagnostics are currently available for this section. Check back soon or explore the study materials below!
                      </p>
                    </div>
                  </NotebookCard>
                </div>
              ) : !isDiagnosticSubmitted && diagnostic ? (
                /* STATE 1 HERO: Diagnostic Required / First Step */
                <div className="relative pt-3">
                  <div className="absolute -top-1 left-8 z-10">
                    <WashiTape
                      colorClass="bg-highlighter-yellow/90 dark:bg-yellow-500/50"
                      rotate="-rotate-2"
                    />
                  </div>
                  <NotebookCard
                    pattern="grid"
                    borderStyle="sketch"
                    className="p-6 sm:p-8 bg-paper-warm dark:bg-chalkboard-card border-2 border-ink dark:border-chalkboard-border space-y-5 shadow-notebook-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono font-bold uppercase bg-highlighter-yellow text-ink border border-ink/30 shadow-xs">
                        <Sparkles className="w-3.5 h-3.5 text-redpen" />
                        First Step • Required Baseline
                      </span>
                      <span className="text-xs font-mono text-ink-muted dark:text-chalkboard-muted">
                        {diagnostic.questionCount} Questions • Untimed
                      </span>
                    </div>

                    <div className="space-y-2">
                      <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink dark:text-chalkboard-chalk">
                        {diagnostic.title}
                      </h2>
                      <p className="text-sm sm:text-base text-ink-muted dark:text-chalkboard-muted leading-relaxed">
                        Take this initial diagnostic to establish your conceptual baseline. As soon as you submit, LearningPal pinpoints your exact strengths and learning gaps by topic.
                      </p>
                    </div>

                    {diagnostic.latestAttemptStatus === 'IN_PROGRESS' && (
                      <div className="p-3 rounded-xl bg-highlighter-yellowSoft dark:bg-yellow-950/40 border border-ink/20 flex items-center gap-2.5 text-xs font-mono text-ink dark:text-yellow-200">
                        <Clock className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
                        <span>You have an attempt currently open. Resume to finish and see your topic map.</span>
                      </div>
                    )}

                    <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      {isArchived || !diagnostic.canStart ? (
                        <Button
                          variant="secondary"
                          size="lg"
                          disabled
                          className="opacity-50 cursor-not-allowed"
                        >
                          {isArchived ? 'Diagnostic Unavailable (Archived)' : diagnostic.lockReason || 'Quiz Locked'}
                        </Button>
                      ) : (
                        <Button
                          variant="primary"
                          size="lg"
                          className="font-bold shadow-notebook hover:translate-y-[-1px] transition-transform"
                          onClick={() =>
                            navigate(
                              `/student/subjects/${effectiveSubjectId}/assessments/${diagnostic.id}/take`
                            )
                          }
                        >
                          <span>
                            {diagnostic.latestAttemptStatus === 'IN_PROGRESS'
                              ? 'Resume Diagnostic'
                              : 'Start Diagnostic Quiz'}
                          </span>
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      )}
                      <span className="text-xs font-mono text-ink-muted dark:text-chalkboard-muted text-center sm:text-left">
                        Takes ~15–20 minutes • Immediate feedback
                      </span>
                    </div>
                  </NotebookCard>
                </div>
              ) : (
                /* STATE 2 HERO: Next Step / Highest Priority Remediation */
                <div className="relative pt-3">
                  <div className="absolute -top-1 left-8 z-10">
                    <WashiTape
                      colorClass={
                        inProgressQuiz
                          ? 'bg-highlighter-yellow/90 dark:bg-yellow-500/50'
                          : priorityGaps.length > 0
                          ? 'bg-highlighter-pink/80 dark:bg-rose-500/40'
                          : 'bg-highlighter-mint/90 dark:bg-emerald-500/50'
                      }
                      rotate="-rotate-1"
                    />
                  </div>
                  <NotebookCard
                    pattern="grid"
                    borderStyle="sketch"
                    className="p-6 sm:p-8 bg-paper-card dark:bg-chalkboard-card border-2 border-ink dark:border-chalkboard-border space-y-4 shadow-notebook-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono font-bold uppercase border border-ink/30 shadow-xs ${
                          inProgressQuiz
                            ? 'bg-highlighter-yellow text-ink'
                            : priorityGaps.length > 0
                            ? 'bg-redpen-soft text-redpen-dark dark:bg-rose-950 dark:text-rose-200'
                            : 'bg-highlighter-mint text-ink'
                        }`}
                      >
                        {inProgressQuiz ? (
                          <>
                            <Clock className="w-3.5 h-3.5 text-amber-700" />
                            <span>In-Progress Attempt</span>
                          </>
                        ) : priorityGaps.length > 0 ? (
                          <>
                            <Target className="w-3.5 h-3.5 text-redpen" />
                            <span>Recommended Focus • Close Learning Gap</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                            <span>Great Progress • All Gaps Closed</span>
                          </>
                        )}
                      </span>

                      {progress?.studyNext?.resourcesRecommended > 0 && (
                        <span className="text-xs font-mono text-ink-muted dark:text-chalkboard-muted">
                          {progress.studyNext.resourcesCompleted} of{' '}
                          {progress.studyNext.resourcesRecommended} resources completed
                        </span>
                      )}
                    </div>

                    {inProgressQuiz ? (
                      /* Sub-state: Resume in-progress quiz */
                      <div className="space-y-2">
                        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink dark:text-chalkboard-chalk">
                          Resume: {inProgressQuiz.title}
                        </h2>
                        <p className="text-sm text-ink-muted dark:text-chalkboard-muted leading-relaxed">
                          You have an active attempt currently open. Finish your questions and submit to update your topic mastery scores.
                        </p>
                        <div className="pt-2">
                          <Button
                            variant="primary"
                            size="lg"
                            className="font-bold"
                            onClick={() =>
                              navigate(
                                `/student/subjects/${effectiveSubjectId}/assessments/${inProgressQuiz.id}/take`
                              )
                            }
                          >
                            <span>Resume Quiz</span>
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                      </div>
                    ) : progress?.studyNext || priorityGaps.length > 0 ? (
                      /* Sub-state: Target priority gap */
                      (() => {
                        const targetTopic = progress?.studyNext || priorityGaps[0];
                        return (
                          <div className="space-y-3">
                            <div className="space-y-1">
                              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink dark:text-chalkboard-chalk">
                                Focus on: {targetTopic.topicName}
                              </h2>
                              <p className="text-sm text-ink-muted dark:text-chalkboard-muted leading-relaxed">
                                Diagnostic analysis flagged this concept as a learning gap ({targetTopic.masteryPercent}% accuracy). Review missed questions and short study guides to master this topic.
                              </p>
                            </div>

                            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                              <Button
                                variant="primary"
                                size="lg"
                                className="font-bold"
                                onClick={() =>
                                  navigate(getTopicProgressUrl(targetTopic.topicId))
                                }
                              >
                                <span>Study This Topic & Review Misses</span>
                                <ArrowRight className="w-4 h-4 ml-2" />
                              </Button>
                              <span className="text-xs font-mono text-ink-muted dark:text-chalkboard-muted">
                                Missed questions breakdown ready
                              </span>
                            </div>
                          </div>
                        );
                      })()
                    ) : (
                      /* Sub-state: Solid mastery across all */
                      <div className="space-y-3">
                        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink dark:text-chalkboard-chalk">
                          You are on track across all topics!
                        </h2>
                        <p className="text-sm text-ink-muted dark:text-chalkboard-muted leading-relaxed">
                          You have scored ≥ 80% on all diagnostic questions. Review completed attempts or take additional topic practice checks to lock in your mastery.
                        </p>
                        <div className="pt-2">
                          <Button
                            variant="secondary"
                            size="md"
                            onClick={() =>
                              navigate(progressUrl)
                            }
                          >
                            <span>View Full Learning Journey</span>
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </NotebookCard>
                </div>
              )}

              {/* ---------------------------------------------------------------------
                  ASSESSMENTS & QUIZZES FEED (Filterable Active vs Completed)
              --------------------------------------------------------------------- */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-ink/15 dark:border-chalkboard-borderSubtle pb-3">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-ink dark:text-chalkboard-chalk flex items-center gap-2">
                      <FileQuestion className="w-5 h-5 text-ink-blue dark:text-highlighter-mint" />
                      <span>Class Quizzes & Tests</span>
                    </h3>
                    <p className="text-xs text-ink-muted dark:text-chalkboard-muted">
                      Diagnostic tests and topic-level concept checks assigned by your instructor.
                    </p>
                  </div>

                  {/* Filter Pills: Active vs Completed */}
                  <div className="flex items-center gap-1.5 p-1 rounded-xl bg-paper-warm dark:bg-chalkboard-surface border border-ink/20 dark:border-chalkboard-borderSubtle self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setQuizFilter('active')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                        quizFilter === 'active'
                          ? 'bg-paper-card dark:bg-chalkboard-card text-ink dark:text-chalkboard-chalk shadow-xs border border-ink/20'
                          : 'text-ink-muted dark:text-chalkboard-muted hover:text-ink'
                      }`}
                    >
                      Active ({activeQuizzes.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuizFilter('completed')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                        quizFilter === 'completed'
                          ? 'bg-paper-card dark:bg-chalkboard-card text-ink dark:text-chalkboard-chalk shadow-xs border border-ink/20'
                          : 'text-ink-muted dark:text-chalkboard-muted hover:text-ink'
                      }`}
                    >
                      Completed ({completedQuizzes.length})
                    </button>
                  </div>
                </div>

                {/* TAB 1: Active Quizzes */}
                {quizFilter === 'active' && (
                  <div className="space-y-4">
                    {activeQuizzes.length === 0 ? (
                      <NotebookCard className="p-8 text-center space-y-2 bg-paper-card dark:bg-chalkboard-card border border-ink/20">
                        <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                        <h4 className="font-bold text-base text-ink dark:text-chalkboard-chalk">
                          All Available Quizzes Completed!
                        </h4>
                        <p className="text-xs text-ink-muted dark:text-chalkboard-muted max-w-sm mx-auto">
                          You have submitted all quizzes currently assigned in this class. Flip to the "Completed" tab to review your scores and mistake breakdowns.
                        </p>
                      </NotebookCard>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {activeQuizzes.map((quiz, idx) => {
                          const isInProgress = quiz.latestAttemptStatus === 'IN_PROGRESS';

                          return (
                            <NotebookCard
                              key={quiz.id}
                              pattern="ruled"
                              borderStyle="sketch"
                              className="p-5 flex flex-col justify-between space-y-4 hover:shadow-notebook transition-shadow"
                            >
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs font-mono">
                                  <span className="px-2 py-0.5 rounded bg-highlighter-yellow/30 text-ink font-bold border border-ink/20">
                                    Topic 0{idx + 1}
                                  </span>
                                  <span className="text-ink-muted dark:text-chalkboard-muted">
                                    {quiz.questionCount} Questions
                                  </span>
                                </div>
                                <h4 className="font-bold text-base sm:text-lg text-ink dark:text-chalkboard-chalk leading-snug">
                                  {quiz.title}
                                </h4>
                                <p className="text-xs text-ink-muted dark:text-chalkboard-muted line-clamp-2">
                                  {quiz.description}
                                </p>
                              </div>

                              <div className="pt-3 border-t border-ink/10 dark:border-chalkboard-borderSubtle space-y-2.5">
                                {isInProgress && (
                                  <div className="flex items-center gap-1.5 text-xs font-mono text-amber-700 dark:text-amber-400">
                                    <Clock className="w-3.5 h-3.5 shrink-0" />
                                    <span>Attempt in progress</span>
                                  </div>
                                )}

                                <div>
                                  {isArchived || !quiz.canStart ? (
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      disabled
                                      className="w-full opacity-50 cursor-not-allowed"
                                    >
                                      {quiz.accessStatus === 'NOT_OPEN_YET'
                                        ? 'Not Open'
                                        : quiz.accessStatus === 'CLOSED'
                                        ? 'Closed by Teacher'
                                        : isArchived
                                        ? 'Archived'
                                        : 'Unavailable'}
                                    </Button>
                                  ) : (
                                    <Button
                                      variant={isInProgress ? 'yellow' : 'primary'}
                                      size="sm"
                                      className="w-full font-bold"
                                      onClick={() =>
                                        navigate(
                                          `/student/subjects/${effectiveSubjectId}/assessments/${quiz.id}/take`
                                        )
                                      }
                                    >
                                      <span>{isInProgress ? 'Resume Quiz' : 'Take Quiz'}</span>
                                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </NotebookCard>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: Completed Quizzes */}
                {quizFilter === 'completed' && (
                  <div className="space-y-4">
                    {completedQuizzes.length === 0 ? (
                      <NotebookCard className="p-8 text-center space-y-2 bg-paper-card dark:bg-chalkboard-card border border-ink/20">
                        <FileQuestion className="w-8 h-8 text-ink-muted mx-auto" />
                        <h4 className="font-bold text-base text-ink dark:text-chalkboard-chalk">
                          No Completed Quizzes Yet
                        </h4>
                        <p className="text-xs text-ink-muted dark:text-chalkboard-muted max-w-sm mx-auto">
                          Once you take and submit an assessment, your score, red-pen stamp, and question-by-question mistake breakdown will appear here.
                        </p>
                      </NotebookCard>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {completedQuizzes.map((quiz) => {
                          const scorePercent =
                            quiz.latestAttemptMaxScore > 0
                              ? Math.round((quiz.latestAttemptScore / quiz.latestAttemptMaxScore) * 100)
                              : null;
                          const isDiag = quiz.title.toLowerCase().includes('diagnostic');

                          return (
                            <NotebookCard
                              key={quiz.id}
                              pattern="ruled"
                              borderStyle="sketch"
                              className="p-5 flex flex-col justify-between space-y-4 hover:shadow-notebook transition-shadow"
                            >
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs font-mono">
                                  <span
                                    className={`px-2 py-0.5 rounded font-bold border border-ink/20 ${
                                      isDiag
                                        ? 'bg-highlighter-mintSoft text-ink dark:bg-emerald-950 dark:text-emerald-300'
                                        : 'bg-paper-warm dark:bg-chalkboard-surface text-ink-muted dark:text-chalkboard-muted'
                                    }`}
                                  >
                                    {isDiag ? 'Diagnostic Battery' : 'Topic Check'}
                                  </span>
                                  {scorePercent !== null && (
                                    <span
                                      className={`px-2 py-0.5 rounded font-bold font-mono text-xs ${
                                        scorePercent >= 80
                                          ? 'bg-highlighter-mint text-ink'
                                          : scorePercent >= 60
                                          ? 'bg-highlighter-yellow text-ink'
                                          : 'bg-redpen-soft text-redpen-dark'
                                      }`}
                                    >
                                      {scorePercent}% ({quiz.latestAttemptScore} / {quiz.latestAttemptMaxScore})
                                    </span>
                                  )}
                                </div>
                                <h4 className="font-bold text-base sm:text-lg text-ink dark:text-chalkboard-chalk leading-snug">
                                  {quiz.title}
                                </h4>
                                <p className="text-xs text-ink-muted dark:text-chalkboard-muted line-clamp-2">
                                  {quiz.description}
                                </p>
                              </div>

                              <div className="pt-3 border-t border-ink/10 dark:border-chalkboard-borderSubtle flex items-center gap-2">
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  className="flex-1 font-bold"
                                  onClick={() =>
                                    navigate(
                                      `/student/subjects/${effectiveSubjectId}/attempts/${quiz.latestAttemptId}/result`
                                    )
                                  }
                                >
                                  <Award className="w-3.5 h-3.5 mr-1" />
                                  <span>Review Mistakes</span>
                                </Button>

                                {!isArchived && quiz.canStart && (
                                  <Button
                                    variant="mint"
                                    size="sm"
                                    onClick={() =>
                                      navigate(
                                        `/student/subjects/${effectiveSubjectId}/assessments/${quiz.id}/take`
                                      )
                                    }
                                  >
                                    <RotateCcw className="w-3.5 h-3.5 mr-1" />
                                    <span>Retake</span>
                                  </Button>
                                )}
                              </div>
                            </NotebookCard>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* ---------------------------------------------------------------------
                    CLASS STUDY MATERIALS (Documents & Link Resources)
                --------------------------------------------------------------------- */}
                {materials.length > 0 && (
                  <div className="space-y-4 pt-4 border-t border-ink/10 dark:border-chalkboard-borderSubtle">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-redpen dark:text-highlighter-yellow" />
                        <h2 className="text-xl sm:text-2xl font-bold text-ink dark:text-chalkboard-chalk">
                          Study Materials & Resources
                        </h2>
                      </div>
                      <span className="text-xs font-mono text-ink-muted dark:text-chalkboard-muted">
                        {materials.length} item{materials.length === 1 ? '' : 's'}
                      </span>
                    </div>

                    {downloadError && (
                      <div className="p-3 rounded-xl border border-redpen bg-redpen-soft text-redpen-dark flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{downloadError}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setDownloadError('')}
                          className="font-bold underline"
                        >
                          Dismiss
                        </button>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {materials.map((res) => {
                        const isFile = res.type === 'FILE';
                        const isDocx = res.fileName?.toLowerCase().endsWith('.docx') ||
                          res.fileContentType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

                        return (
                          <NotebookCard
                            key={res.id}
                            pattern="ruled"
                            className="p-5 bg-paper-card dark:bg-chalkboard-card flex flex-col justify-between space-y-3 hover:shadow-notebook-sm transition-shadow"
                          >
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2">
                                {isFile ? (
                                  <span
                                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border inline-flex items-center gap-1 ${
                                      isDocx
                                        ? 'bg-blue-100 text-blue-900 border-blue-400 dark:bg-blue-950 dark:text-blue-300'
                                        : 'bg-red-100 text-red-900 border-red-400 dark:bg-red-950 dark:text-red-300'
                                    }`}
                                  >
                                    <FileText className="w-3 h-3" />
                                    <span>{isDocx ? 'DOCX' : 'PDF'}</span>
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-highlighter-mint/30 text-ink border border-ink/20 inline-flex items-center gap-1">
                                    <Link2 className="w-3 h-3" />
                                    <span>{res.domain || 'External Link'}</span>
                                  </span>
                                )}

                                {isFile && res.fileSizeBytes > 0 && (
                                  <span className="text-[10px] font-mono text-ink-muted dark:text-chalkboard-muted">
                                    {formatBytes(res.fileSizeBytes)}
                                  </span>
                                )}
                              </div>

                              <h3 className="font-bold text-base text-ink dark:text-chalkboard-chalk">
                                {res.title}
                              </h3>
                              {res.description && (
                                <p className="text-xs text-ink-muted dark:text-chalkboard-muted line-clamp-2">
                                  {res.description}
                                </p>
                              )}
                              {isFile && res.fileName && (
                                <p className="text-[11px] font-mono text-ink-muted dark:text-chalkboard-muted truncate">
                                  {res.fileName}
                                </p>
                              )}
                            </div>

                            <div className="pt-2 border-t border-ink/10 dark:border-chalkboard-borderSubtle">
                              {isFile ? (
                                <button
                                  type="button"
                                  onClick={() => handleDownloadFile(res)}
                                  disabled={downloadingId === res.id}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-paper-warm dark:bg-chalkboard-surface border border-ink/20 text-ink dark:text-chalkboard-chalk hover:bg-highlighter-yellow/30 transition-colors cursor-pointer"
                                >
                                  {downloadingId === res.id ? (
                                    <>
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                      <span>Downloading…</span>
                                    </>
                                  ) : (
                                    <>
                                      <Download className="w-3.5 h-3.5 text-redpen" />
                                      <span>Download Document</span>
                                    </>
                                  )}
                                </button>
                              ) : (
                                <a
                                  href={res.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-xs font-bold text-redpen hover:underline"
                                >
                                  <span>Open Resource</span>
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                          </NotebookCard>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* =========================================================================
                RIGHT SIDEBAR (4 cols desktop, sticky): "My Learning Radar"
            ========================================================================= */}
            <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-20">
              <NotebookCard
                pattern="ruled"
                borderStyle="sketch"
                className="p-5 sm:p-6 bg-paper-card dark:bg-chalkboard-card border-2 border-ink dark:border-chalkboard-border space-y-5"
              >
                {/* Radar Header */}
                <div className="flex items-center justify-between border-b border-ink/15 dark:border-chalkboard-borderSubtle pb-3">
                  <div className="flex items-center gap-2">
                    <Compass className="w-5 h-5 text-ink-blue dark:text-highlighter-mint" />
                    <h3 className="font-bold text-base sm:text-lg text-ink dark:text-chalkboard-chalk">
                      My Learning Radar
                    </h3>
                  </div>
                  {hasAnyAttempts && (
                    <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-paper-warm dark:bg-chalkboard-surface border border-ink/20 font-bold">
                      {progress?.topics?.length || 0} Topics
                    </span>
                  )}
                </div>

                {!hasAnyAttempts ? (
                  /* Cold Start Placeholder */
                  <div className="text-center py-6 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-highlighter-yellow/30 border border-ink/20 flex items-center justify-center mx-auto">
                      <Target className="w-6 h-6 text-ink dark:text-chalkboard-chalk" />
                    </div>
                    <h4 className="font-bold text-sm text-ink dark:text-chalkboard-chalk">
                      Topic Radar Locked
                    </h4>
                    <p className="text-xs text-ink-muted dark:text-chalkboard-muted leading-relaxed">
                      Your personalized strengths and gaps breakdown will generate automatically as soon as you complete the diagnostic quiz.
                    </p>
                  </div>
                ) : (
                  /* Active Radar Breakdown */
                  <div className="space-y-5">
                    {/* 1. Priority Gaps (< 60%) */}
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="font-bold text-redpen dark:text-redpen-soft uppercase tracking-wider flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Priority Gaps</span>
                        </span>
                        <span className="font-bold text-ink dark:text-chalkboard-chalk">
                          {priorityGaps.length} Topics
                        </span>
                      </div>

                      {priorityGaps.length === 0 ? (
                        <div className="p-3 rounded-xl bg-highlighter-mintSoft dark:bg-emerald-950/40 border border-emerald-500/30 flex items-center gap-2 text-xs text-emerald-900 dark:text-emerald-200">
                          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                          <span>No critical concept gaps detected!</span>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {priorityGaps.map((gap) => (
                            <div
                              key={gap.topicId}
                              className="p-3.5 rounded-xl bg-redpen-soft/60 dark:bg-rose-950/40 border border-redpen/30 space-y-2"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <h5 className="font-bold text-xs sm:text-sm text-ink dark:text-chalkboard-chalk leading-snug">
                                  {gap.topicName}
                                </h5>
                                <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-redpen text-white shrink-0">
                                  {gap.masteryPercent}%
                                </span>
                              </div>

                              <div className="pt-1 flex items-center justify-between text-xs">
                                <span className="text-ink-muted dark:text-chalkboard-muted font-mono text-[11px]">
                                  {gap.resourcesCompleted}/{gap.resourcesRecommended} materials
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    navigate(getTopicProgressUrl(gap.topicId))
                                  }
                                  className="font-mono text-xs font-bold text-redpen-dark dark:text-red-300 hover:underline flex items-center gap-0.5"
                                >
                                  <span>Study</span>
                                  <ArrowRight className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 2. Mastered & Developing Concepts (>= 60%) */}
                    <div className="space-y-2.5 pt-2 border-t border-ink/10 dark:border-chalkboard-borderSubtle">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="font-bold text-ink-muted dark:text-chalkboard-muted uppercase tracking-wider flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Mastered &amp; On Track</span>
                        </span>
                        <span className="font-bold text-ink dark:text-chalkboard-chalk">
                          {masteredTopics.length + developingTopics.length}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {[...masteredTopics, ...developingTopics].map((t) => (
                          <Link
                            key={t.topicId}
                            to={getTopicProgressUrl(t.topicId)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono bg-paper-warm dark:bg-chalkboard-surface border border-ink/15 dark:border-chalkboard-borderSubtle text-ink dark:text-chalkboard-chalk hover:bg-highlighter-yellow/30 transition-colors"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                            <span className="font-medium truncate max-w-[140px]">{t.topicName}</span>
                            <span className="text-ink-muted dark:text-chalkboard-muted font-bold text-[10px]">
                              {t.masteryPercent}%
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>

                    {/* 3. Link to Full Gap Analysis */}
                    <div className="pt-2">
                      <Link
                        to={progressUrl}
                        className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-ink/25 dark:border-chalkboard-borderSubtle text-xs font-mono font-bold text-ink dark:text-chalkboard-chalk bg-paper-warm dark:bg-chalkboard-surface hover:bg-highlighter-yellow/30 transition-colors shadow-xs text-center"
                      >
                        <Compass className="w-4 h-4 text-ink-blue dark:text-highlighter-mint" />
                        <span>View Full Topic Journey &amp; History →</span>
                      </Link>
                    </div>
                  </div>
                )}
              </NotebookCard>
            </div>
          </div>
        )}
      </div>
    </PortalShell>
  );
}
