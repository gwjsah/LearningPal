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
  const { subjectId } = useParams();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [assessments, setAssessments] = useState([]);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    if (!subjectId) {
      navigate('/student', { replace: true });
      return;
    }
    setLoading(true);
    setError('');
    try {
      const [assessmentsData, progressData] = await Promise.all([
        studentService.getSubjectAssessments(subjectId),
        studentService.getSubjectProgress(subjectId).catch(() => null),
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
        setError(err.message || 'You are not enrolled in this subject.');
        return;
      }
      setError(err.message || 'Unable to load subject data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [subjectId]);

  const diagnostic = assessments.find((a) =>
    a.title.toLowerCase().includes('diagnostic')
  );

  const topicQuizzes = assessments.filter(
    (a) => !a.title.toLowerCase().includes('diagnostic')
  );

  const hasAnyAttempts =
    progress?.topics?.some((t) => t.status !== 'INSUFFICIENT_DATA' || t.questionsAnswered > 0) ?? false;

  const subjectName = diagnostic?.subjectName || (assessments[0]?.subjectName) || 'Subject Workspace';

  return (
    <PortalShell
      portalSubtitle="Student Learning Notebook"
      user={user}
      onLogout={logout}
      badgeIcon={GraduationCap}
      badgeLabel="Subject Workspace"
      badgeColorClass="bg-highlighter-mint text-ink"
      title={subjectName}
      subtitle="Complete diagnostic quizzes, analyze your strengths and learning gaps, and master topics."
      headerRight={
        <div className="flex items-center gap-2">
          <Link
            to="/student"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-ink/25 dark:border-white/25 text-ink dark:text-chalkboard-chalk bg-paper-card dark:bg-chalkboard-card hover:bg-paper-warm dark:hover:bg-chalkboard-surface shadow-xs transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>My Subjects</span>
          </Link>
          <Link
            to={`/student/subjects/${subjectId}/progress`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-ink/25 dark:border-white/25 text-ink dark:text-chalkboard-chalk bg-paper-card dark:bg-chalkboard-card hover:bg-highlighter-yellow/30 shadow-xs transition-colors"
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
              <span>My Subjects</span>
            </Link>
            <span>/</span>
            <span className="font-bold text-ink dark:text-chalkboard-chalk">{subjectName}</span>
          </div>
          <span className="text-ink-muted dark:text-chalkboard-muted hidden sm:inline">
            Subject ID: #{subjectId}
          </span>
        </nav>

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
                              navigate(`/student/subjects/${subjectId}/attempts/${diagnostic.latestAttemptId}/result`)
                            }
                          >
                            <Award className="w-4 h-4 mr-1.5" />
                            View Result
                          </Button>
                          <Button
                            variant="secondary"
                            size="md"
                            className="w-full md:w-44"
                            onClick={() =>
                              navigate(`/student/subjects/${subjectId}/assessments/${diagnostic.id}/take`)
                            }
                          >
                            <RotateCcw className="w-4 h-4 mr-1.5" />
                            Retake Quiz
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="primary"
                          size="lg"
                          className="w-full md:w-48 shadow-notebook"
                          onClick={() =>
                            navigate(`/student/subjects/${subjectId}/assessments/${diagnostic.id}/take`)
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
                                    navigate(`/student/subjects/${subjectId}/attempts/${quiz.latestAttemptId}/result`)
                                  }
                                >
                                  Result
                                </Button>
                                <Button
                                  variant="mint"
                                  size="sm"
                                  className="flex-1"
                                  onClick={() =>
                                    navigate(`/student/subjects/${subjectId}/assessments/${quiz.id}/take`)
                                  }
                                >
                                  Retake
                                </Button>
                              </>
                            ) : (
                              <Button
                                variant={isInProgress ? 'yellow' : 'primary'}
                                size="sm"
                                className="w-full"
                                onClick={() =>
                                  navigate(`/student/subjects/${subjectId}/assessments/${quiz.id}/take`)
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

