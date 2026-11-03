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
  TrendingUp,
  HelpCircle,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { studentService } from '../services/studentService';
import { Button, NotebookCard, PortalShell } from '../components/NotebookPrimitives';
import { StatusBadge, TrendIndicator, MasteryBar } from '../components/MasteryPrimitives';

export default function SubjectDashboard() {
  const { subjectId, classId } = useParams();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [workspace, setWorkspace] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
          // If resolving fails, fallback to direct subject data or report not enrolled
        }
      } else {
        navigate('/student', { replace: true });
        return;
      }

      const [assessmentsData, progressData] = await Promise.all([
        studentService.getSubjectAssessments(resolvedSubjectId),
        studentService.getSubjectProgress(resolvedSubjectId).catch(() => null),
      ]);
      setAssessments(assessmentsData);
      setProgress(progressData);
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

  const diagnostic = assessments.find((a) =>
    a.title.toLowerCase().includes('diagnostic')
  );

  const topicQuizzes = assessments.filter(
    (a) => !a.title.toLowerCase().includes('diagnostic')
  );

  const hasAnyAttempts =
    progress?.topics?.some((t) => t.status !== 'INSUFFICIENT_DATA' || t.questionsAnswered > 0) ?? false;

  const subjectName = workspace?.subject?.name || diagnostic?.subjectName || (assessments[0]?.subjectName) || 'Class Workspace';
  const effectiveSubjectId = workspace?.subject?.id || subjectId;
  const isArchived = workspace ? !workspace.canAttempt : false;

  return (
    <PortalShell
      portalSubtitle="Student Learning Notebook"
      user={user}
      onLogout={logout}
      badgeIcon={GraduationCap}
      badgeLabel={workspace ? `Class: ${workspace.name}` : "Class Workspace"}
      badgeColorClass={isArchived ? "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200" : "bg-highlighter-mint text-ink"}
      title={workspace ? `${workspace.subject.name} (${workspace.name})` : subjectName}
      subtitle={workspace ? `Instructor: ${workspace.teacherName || 'Assigned Instructor'} • Status: ${workspace.status}` : "Complete diagnostic quizzes, analyze your strengths and learning gaps, and master topics."}
      headerRight={
        <div className="flex items-center gap-2">
          <Link
            to="/student"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-ink/25 dark:border-white/25 text-ink dark:text-chalkboard-chalk bg-paper-card dark:bg-chalkboard-card hover:bg-paper-warm dark:hover:bg-chalkboard-surface shadow-xs transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>My Classes</span>
          </Link>
          {effectiveSubjectId && (
            <Link
              to={`/student/subjects/${effectiveSubjectId}/progress`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-ink/25 dark:border-white/25 text-ink dark:text-chalkboard-chalk bg-paper-card dark:bg-chalkboard-card hover:bg-highlighter-yellow/30 shadow-xs transition-colors"
            >
              <Compass className="w-3.5 h-3.5 text-ink-blue dark:text-highlighter-mint" />
              <span>Gap Analysis</span>
            </Link>
          )}
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
            {workspace ? `Class #${workspace.id} • ${workspace.status}` : `Subject #${subjectId}`}
          </span>
        </nav>

        {/* Archived Banner if applicable */}
        {isArchived && (
          <div className="p-4 rounded-xl border-2 border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="text-sm font-bold">This class is archived</p>
              <p className="text-xs mt-0.5">
                This class has been archived by your instructor. Your past attempts and feedback remain viewable, but new attempts cannot be started.
              </p>
            </div>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="py-20 text-center space-y-4">
            <RefreshCw className="w-9 h-9 animate-spin mx-auto text-redpen" />
            <p className="font-hand text-2xl text-ink-muted dark:text-chalkboard-muted">
              Opening subject notebook and loading your quizzes…
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

        {/* Content loaded */}
        {!loading && !error && (
          <>
            {/* 1. Study Next Card (if recommended topic exists) */}
            {progress?.studyNext && (
              <NotebookCard
                pattern="grid"
                borderStyle="sketch"
                className="p-5 sm:p-6 bg-paper-card dark:bg-chalkboard-card border-2 border-ink dark:border-white/50"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-2 max-w-xl">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold font-mono uppercase bg-highlighter-yellow text-ink border border-ink/30 shadow-notebook-sm">
                        <Sparkles className="w-3.5 h-3.5 text-redpen" />
                        Study Next
                      </span>
                      <StatusBadge status={progress.studyNext.status} />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-ink dark:text-chalkboard-chalk">
                      Focus on: {progress.studyNext.topicName}
                    </h3>
                    <p className="text-xs sm:text-sm text-ink-muted dark:text-chalkboard-muted">
                      {progress.studyNext.status === 'GAP'
                        ? 'Diagnostic analysis flagged this topic as a learning gap. Reinforce this concept to stay on track.'
                        : 'Strengthen this topic next to boost your overall subject mastery.'}
                    </p>
                    {progress.studyNext.resourcesRecommended > 0 && (
                      <div className="flex items-center gap-2 text-xs font-mono pt-1 text-ink-muted dark:text-chalkboard-muted">
                        <span>{progress.studyNext.resourcesRecommended} Recommended Resources</span>
                        <span>•</span>
                        <span className="font-bold text-ink dark:text-chalkboard-chalk">
                          {progress.studyNext.resourcesCompleted} of {progress.studyNext.resourcesRecommended} completed
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Button
                      variant="primary"
                      size="md"
                      className="w-full sm:w-auto"
                      onClick={() => navigate(`/student/subjects/${subjectId}/progress/topics/${progress.studyNext.topicId}`)}
                    >
                      <span>Review Topic</span>
                      <ArrowRight className="w-4 h-4 ml-1.5" />
                    </Button>
                  </div>
                </div>
              </NotebookCard>
            )}

            {/* 2. Your Strengths and Gaps Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-ink dark:text-chalkboard-chalk">
                    Your Strengths & Learning Gaps
                  </h3>
                  <p className="text-xs sm:text-sm text-ink-muted dark:text-chalkboard-muted">
                    Automated topic mastery calculated from your most recent assessment responses.
                  </p>
                </div>
                {hasAnyAttempts && (
                  <Link
                    to={`/student/subjects/${subjectId}/progress`}
                    className="inline-flex items-center gap-1 text-xs sm:text-sm font-mono font-bold text-ink dark:text-chalkboard-chalk hover:text-redpen dark:hover:text-redpen transition-colors"
                  >
                    <span>View All Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>

              {!hasAnyAttempts ? (
                <NotebookCard pattern="ruled" borderStyle="sketch" className="p-6 text-center space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-highlighter-yellow/40 border border-ink/30 flex items-center justify-center mx-auto">
                    <Compass className="w-5 h-5 text-ink dark:text-chalkboard-chalk" />
                  </div>
                  <h4 className="text-base font-bold text-ink dark:text-chalkboard-chalk">
                    Take your first assessment to see your strengths and gaps
                  </h4>
                  <p className="text-xs text-ink-muted dark:text-chalkboard-muted max-w-md mx-auto">
                    Complete the Comprehensive Diagnostic below or take any topic quiz. As soon as you submit, your topic breakdown and mastery status will be calculated automatically.
                  </p>
                </NotebookCard>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {progress?.topics?.map((topic) => (
                    <div
                      key={topic.topicId}
                      onClick={() => navigate(`/student/subjects/${subjectId}/progress/topics/${topic.topicId}`)}
                      className="group cursor-pointer rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-redpen"
                      tabIndex={0}
                      role="link"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          navigate(`/student/subjects/${subjectId}/progress/topics/${topic.topicId}`);
                        }
                      }}
                    >
                      <NotebookCard
                        pattern="ruled"
                        borderStyle="sketch"
                        className="p-4 space-y-3 hover:shadow-notebook group-hover:-translate-y-0.5 transition-all"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <h4 className="font-bold text-sm sm:text-base text-ink dark:text-chalkboard-chalk group-hover:text-redpen transition-colors">
                            {topic.topicName}
                          </h4>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <StatusBadge status={topic.status} />
                            <TrendIndicator trend={topic.trend} />
                          </div>
                        </div>

                        <MasteryBar
                          percent={topic.masteryPercent}
                          status={topic.status}
                        />

                        {topic.resourcesRecommended > 0 && (
                          <div className="pt-2 border-t border-ink/10 dark:border-white/10 flex items-center justify-between text-xs font-mono">
                            <span className="text-ink-muted dark:text-chalkboard-muted">Resources:</span>
                            <span className={`font-bold ${topic.status === 'GAP' ? 'text-redpen-dark dark:text-red-300' : 'text-ink dark:text-chalkboard-chalk'}`}>
                              {topic.resourcesCompleted} of {topic.resourcesRecommended} completed
                            </span>
                          </div>
                        )}
                      </NotebookCard>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Highlighted Diagnostic Assessment Banner */}
            {diagnostic && (
              <div className="relative">
                <div className="absolute -top-3 left-6 z-10">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold font-mono uppercase bg-highlighter-yellow text-ink border border-ink shadow-notebook-sm">
                    <Sparkles className="w-3.5 h-3.5 text-redpen" />
                    Recommended Starting Point
                  </span>
                </div>
                <NotebookCard
                  pattern="grid"
                  borderStyle="sketch"
                  className="pt-6 sm:p-8 bg-paper-warm dark:bg-chalkboard-card border-2 border-ink dark:border-white/50"
                >
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="space-y-2 max-w-2xl">
                      <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-ink-muted dark:text-chalkboard-muted">
                        <span className="px-2 py-0.5 rounded bg-highlighter-mint/40 text-ink font-bold">
                          {diagnostic.subjectName}
                        </span>
                        <span>•</span>
                        <span>{diagnostic.questionCount} Questions</span>
                        <span>•</span>
                        <span>Diagnostic Battery</span>
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink dark:text-chalkboard-chalk">
                        {diagnostic.title}
                      </h2>
                      <p className="text-sm text-ink-muted dark:text-chalkboard-muted leading-relaxed">
                        {diagnostic.description}
                      </p>

                      {/* Diagnostic attempt status badge */}
                      {diagnostic.latestAttemptStatus === 'SUBMITTED' && (
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-highlighter-mint text-ink font-mono text-xs font-bold border border-ink/30">
                          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                          <span>
                            Latest Score: {diagnostic.latestAttemptScore} / {diagnostic.latestAttemptMaxScore} (
                            {Math.round(
                              (diagnostic.latestAttemptScore / diagnostic.latestAttemptMaxScore) * 100
                            )}
                            %)
                          </span>
                        </div>
                      )}
                      {diagnostic.latestAttemptStatus === 'IN_PROGRESS' && (
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-highlighter-yellow text-ink font-mono text-xs font-bold border border-ink/30">
                          <Clock className="w-4 h-4 text-amber-700" />
                          <span>Attempt in progress</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-row md:flex-col items-center gap-3 w-full md:w-auto">
                      {diagnostic.latestAttemptStatus === 'SUBMITTED' ? (
                        <>
                          <Button
                            variant="primary"
                            size="md"
                            className="w-full md:w-44"
                            onClick={() =>
                              navigate(`/student/subjects/${effectiveSubjectId}/attempts/${diagnostic.latestAttemptId}/result`)
                            }
                          >
                            <Award className="w-4 h-4 mr-1.5" />
                            View Result
                          </Button>
                          {isArchived || !diagnostic.canStart ? (
                            <div className="w-full md:w-44 flex flex-col items-center">
                              <Button
                                variant="secondary"
                                size="md"
                                disabled
                                className="w-full opacity-50 cursor-not-allowed"
                                title={diagnostic.lockReason || 'Retake unavailable'}
                              >
                                <RotateCcw className="w-4 h-4 mr-1.5" />
                                {diagnostic.accessStatus === 'RETAKE_LOCKED'
                                  ? 'Retake Locked'
                                  : diagnostic.accessStatus === 'CLOSED'
                                  ? 'Closed by Teacher'
                                  : isArchived
                                  ? 'Retake (Archived)'
                                  : 'Retake Unavailable'}
                              </Button>
                              {diagnostic.lockReason && !isArchived && (
                                <span className="text-[10px] font-mono text-redpen dark:text-redpen-soft text-center mt-1">
                                  {diagnostic.lockReason}
                                </span>
                              )}
                            </div>
                          ) : (
                            <Button
                              variant="secondary"
                              size="md"
                              className="w-full md:w-44"
                              onClick={() =>
                                navigate(`/student/subjects/${effectiveSubjectId}/assessments/${diagnostic.id}/take`)
                              }
                            >
                              <RotateCcw className="w-4 h-4 mr-1.5" />
                              Retake Quiz
                            </Button>
                          )}
                        </>
                      ) : isArchived || !diagnostic.canStart ? (
                        <div className="w-full md:w-48 flex flex-col items-center">
                          <Button
                            variant="secondary"
                            size="lg"
                            disabled
                            className="w-full opacity-50 cursor-not-allowed"
                            title={diagnostic.lockReason || 'Quiz Unavailable'}
                          >
                            <span>
                              {diagnostic.accessStatus === 'NOT_OPEN_YET'
                                ? 'Not Open Yet'
                                : diagnostic.accessStatus === 'CLOSED'
                                ? 'Closed by Teacher'
                                : isArchived
                                ? 'Quiz Unavailable (Archived)'
                                : 'Quiz Unavailable'}
                            </span>
                          </Button>
                          {diagnostic.lockReason && !isArchived && (
                            <span className="text-[10px] font-mono text-redpen dark:text-redpen-soft text-center mt-1">
                              {diagnostic.lockReason}
                            </span>
                          )}
                        </div>
                      ) : (
                        <Button
                          variant="primary"
                          size="lg"
                          className="w-full md:w-48 shadow-notebook"
                          onClick={() =>
                            navigate(`/student/subjects/${effectiveSubjectId}/assessments/${diagnostic.id}/take`)
                          }
                        >
                          <span>
                            {diagnostic.latestAttemptStatus === 'IN_PROGRESS'
                              ? 'Resume Quiz'
                              : 'Start Diagnostic'}
                          </span>
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      )}
                    </div>
                  </div>
                </NotebookCard>
              </div>
            )}

            {/* 4. Topic-by-Topic Quizzes Grid */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-ink dark:text-chalkboard-chalk">
                    Topic Mastery Quizzes
                  </h3>
                  <p className="text-xs sm:text-sm text-ink-muted dark:text-chalkboard-muted">
                    Focused checks targeting individual subject concepts.
                  </p>
                </div>
              </div>

              {topicQuizzes.length === 0 ? (
                <NotebookCard className="p-8 text-center text-ink-muted dark:text-chalkboard-muted">
                  <p>No topic quizzes available yet.</p>
                </NotebookCard>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {topicQuizzes.map((quiz, index) => {
                    const isSubmitted = quiz.latestAttemptStatus === 'SUBMITTED';
                    const isInProgress = quiz.latestAttemptStatus === 'IN_PROGRESS';
                    const scorePercent =
                        isSubmitted && quiz.latestAttemptMaxScore > 0
                        ? Math.round((quiz.latestAttemptScore / quiz.latestAttemptMaxScore) * 100)
                        : null;

                    return (
                      <NotebookCard
                        key={quiz.id}
                        pattern="ruled"
                        borderStyle="sketch"
                        className="flex flex-col justify-between p-5 space-y-4 hover:shadow-notebook transition-shadow"
                      >
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between text-xs font-mono">
                            <span className="px-2 py-0.5 rounded bg-highlighter-yellow/30 text-ink font-bold border border-ink/20">
                              Topic 0{index + 1}
                            </span>
                            <span className="text-ink-muted dark:text-chalkboard-muted">
                              {quiz.questionCount} Questions
                            </span>
                          </div>

                          <h4 className="font-bold text-lg text-ink dark:text-chalkboard-chalk leading-snug">
                            {quiz.title}
                          </h4>

                          <p className="text-xs text-ink-muted dark:text-chalkboard-muted line-clamp-2">
                            {quiz.description}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-ink/10 dark:border-white/10 space-y-3">
                          {isSubmitted && (
                            <div className="flex items-center justify-between text-xs font-mono">
                              <span className="text-ink-muted dark:text-chalkboard-muted">Latest:</span>
                              <span className="font-bold px-2 py-0.5 rounded bg-highlighter-mint text-ink">
                                {quiz.latestAttemptScore} / {quiz.latestAttemptMaxScore} ({scorePercent}%)
                              </span>
                            </div>
                          )}

                          {isInProgress && (
                            <div className="flex items-center gap-1.5 text-xs font-mono text-amber-700 dark:text-amber-400">
                              <Clock className="w-3.5 h-3.5" />
                              <span>Attempt currently open</span>
                            </div>
                          )}

                          <div className="flex items-center gap-2">
                            {isSubmitted ? (
                              <>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  className="flex-1"
                                  onClick={() =>
                                    navigate(`/student/subjects/${effectiveSubjectId}/attempts/${quiz.latestAttemptId}/result`)
                                  }
                                >
                                  Result
                                </Button>
                                {isArchived || !quiz.canStart ? (
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    disabled
                                    className="flex-1 opacity-50 cursor-not-allowed"
                                    title={quiz.lockReason || 'Retake unavailable'}
                                  >
                                    {quiz.accessStatus === 'RETAKE_LOCKED'
                                      ? 'Locked'
                                      : quiz.accessStatus === 'CLOSED'
                                      ? 'Closed'
                                      : 'Retake'}
                                  </Button>
                                ) : (
                                  <Button
                                    variant="mint"
                                    size="sm"
                                    className="flex-1"
                                    onClick={() =>
                                      navigate(`/student/subjects/${effectiveSubjectId}/assessments/${quiz.id}/take`)
                                    }
                                  >
                                    Retake
                                  </Button>
                                )}
                              </>
                            ) : isArchived || !quiz.canStart ? (
                              <div className="w-full">
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  disabled
                                  className="w-full opacity-50 cursor-not-allowed"
                                  title={quiz.lockReason || 'Quiz unavailable'}
                                >
                                  {quiz.accessStatus === 'NOT_OPEN_YET'
                                    ? 'Not Open'
                                    : quiz.accessStatus === 'CLOSED'
                                    ? 'Closed'
                                    : isArchived
                                    ? 'Archived'
                                    : 'Unavailable'}
                                </Button>
                                {quiz.lockReason && !isArchived && (
                                  <p className="text-[10px] font-mono text-redpen dark:text-redpen-soft text-center mt-1">
                                    {quiz.lockReason}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <Button
                                variant={isInProgress ? 'yellow' : 'primary'}
                                size="sm"
                                className="w-full"
                                onClick={() =>
                                  navigate(`/student/subjects/${effectiveSubjectId}/assessments/${quiz.id}/take`)
                                }
                              >
                                {isInProgress ? 'Resume Quiz' : 'Take Quiz'}
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
          </>
        )}
      </div>
    </PortalShell>
  );
}

