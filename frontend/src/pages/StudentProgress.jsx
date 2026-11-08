import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import {
  Compass,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  TrendingUp,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { studentService } from '../services/studentService';
import { Button, NotebookCard, PortalShell } from '../components/NotebookPrimitives';
import { StatusBadge, TrendIndicator, MasteryBar } from '../components/MasteryPrimitives';

export default function StudentProgress() {
  const { classId, subjectId } = useParams();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const validClassId =
    classId && classId !== 'undefined' && !isNaN(classId)
      ? classId
      : null;

  const validSubjectId =
    subjectId && subjectId !== 'undefined' && !isNaN(subjectId)
      ? subjectId
      : null;

  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadProgress = async () => {
    setLoading(true);
    setError('');
    try {
      const data = validClassId
        ? await studentService.getClassProgress(validClassId)
        : validSubjectId
        ? await studentService.getSubjectProgress(validSubjectId)
        : await studentService.getProgress();
      setProgress(data);
    } catch (err) {
      if (err.status === 401 || err.message?.includes('authentication is required')) {
        logout();
        navigate('/login', { replace: true });
        return;
      }
      setError(err.message || 'Unable to load diagnostic progress. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProgress();
  }, [classId, subjectId]);

  const hasAnyAttempts =
    progress?.topics?.some((t) => t.status !== 'INSUFFICIENT_DATA' || t.questionsAnswered > 0) ?? false;

  const backUrl = validClassId
    ? `/student/classes/${validClassId}`
    : validSubjectId
    ? `/student/subjects/${validSubjectId}`
    : '/student';

  const backLabel = validClassId
    ? 'Back to Class Workspace'
    : validSubjectId
    ? 'Back to Subject Dashboard'
    : 'Back to My Desk';

  const getTopicDetailUrl = (topicId) =>
    validClassId
      ? `/student/classes/${validClassId}/progress/topics/${topicId}`
      : validSubjectId
      ? `/student/subjects/${validSubjectId}/progress/topics/${topicId}`
      : `/student/progress/topics/${topicId}`;

  return (
    <PortalShell
      portalSubtitle="Curriculum Diagnostic & Mastery Progress"
      user={user}
      onLogout={logout}
      badgeIcon={Compass}
      badgeLabel="Diagnostic Progress"
      badgeColorClass="bg-highlighter-mint text-ink"
      title="Your Learning Journey"
      subtitle="Track your conceptual strengths, identify learning gaps, and focus your study time where it matters most."
    >
      <div className="w-full space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between text-xs font-mono">
          <Link
            to={backUrl}
            className="inline-flex items-center gap-1.5 text-ink-muted dark:text-chalkboard-muted hover:text-ink dark:hover:text-chalkboard-chalk transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-redpen rounded"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{backLabel}</span>
          </Link>
          <div className="flex items-center gap-1.5 text-ink-muted dark:text-chalkboard-muted">
            <Link to="/student" className="hover:underline">My Classes</Link>
            {validClassId && (
              <>
                <span>/</span>
                <Link to={`/student/classes/${validClassId}`} className="hover:underline">Class #{validClassId}</Link>
              </>
            )}
            {!validClassId && validSubjectId && (
              <>
                <span>/</span>
                <Link to={`/student/subjects/${validSubjectId}`} className="hover:underline">Subject #{validSubjectId}</Link>
              </>
            )}
            <span>/</span>
            <span className="font-bold text-ink dark:text-chalkboard-chalk">Curriculum Progress</span>
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="py-20 text-center space-y-4">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-redpen" />
            <p className="font-hand text-2xl text-ink dark:text-chalkboard-chalk">
              Analyzing your quiz submissions and computing topic mastery...
            </p>
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="p-4 rounded-xl border-2 border-redpen bg-redpen-soft text-redpen-dark flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-semibold">{error}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="secondary" onClick={() => navigate('/student')}>
                Back to My Classes
              </Button>
              <Button size="sm" variant="primary" onClick={loadProgress}>
                <RefreshCw className="w-3.5 h-3.5 mr-1" />
                Retry
              </Button>
            </div>
          </div>
        )}

        {/* Content loaded */}
        {!loading && !error && progress && (
          <>
            {/* If no attempts yet: Empty state */}
            {!hasAnyAttempts ? (
              <NotebookCard pattern="ruled" borderStyle="sketch" className="p-8 sm:p-12 text-center space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-highlighter-yellow/40 border-2 border-ink dark:border-chalkboard-border flex items-center justify-center mx-auto shadow-notebook-sm">
                  <BookOpen className="w-8 h-8 text-ink dark:text-chalkboard-chalk" />
                </div>
                <div className="max-w-md mx-auto space-y-2">
                  <h3 className="text-2xl font-bold text-ink dark:text-chalkboard-chalk">
                    No Diagnostic Data Yet
                  </h3>
                  <p className="text-sm text-ink-muted dark:text-chalkboard-muted leading-relaxed">
                    Take your first assessment to see your strengths and gaps! As soon as you complete the
                    Comprehensive Diagnostic or a topic quiz, your conceptual mastery and trends will appear here.
                  </p>
                </div>
                <Button variant="primary" size="lg" onClick={() => navigate('/student')}>
                  <span>Go to Assessments</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </NotebookCard>
            ) : (
              <>
                {/* 1. Top Summary Banner & Study Next Highlight */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Study Next Highlight Card */}
                  <div className="md:col-span-2">
                    <NotebookCard
                      pattern="grid"
                      borderStyle="sketch"
                      className="p-6 bg-paper-card dark:bg-chalkboard-card border-2 border-ink dark:border-chalkboard-border h-full flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold font-mono uppercase bg-highlighter-yellow text-ink border border-ink/40 shadow-notebook-sm">
                            <Sparkles className="w-3.5 h-3.5 text-redpen" />
                            Recommended Focus
                          </span>
                        </div>
                        <div>
                          <h3 className="text-xl sm:text-2xl font-bold text-ink dark:text-chalkboard-chalk">
                            {progress.studyNext ? progress.studyNext.topicName : 'All topics on track!'}
                          </h3>
                          <p className="text-sm text-ink-muted dark:text-chalkboard-muted mt-1 leading-relaxed">
                            {progress.studyNext
                              ? progress.studyNext.status === 'GAP'
                                ? 'Our diagnostic engine detected a learning gap here. Review this topic to build a solid foundation before advancing.'
                                : 'This topic has the most room for growth. Strengthen your understanding with practice.'
                              : 'Outstanding progress! All evaluated topics have met proficiency requirements.'}
                          </p>
                        </div>
                        {progress.studyNext && (
                          <div className="pt-2 max-w-sm space-y-2">
                            <MasteryBar
                              percent={progress.studyNext.masteryPercent}
                              status={progress.studyNext.status}
                            />
                            {progress.studyNext.resourcesRecommended > 0 && (
                              <div className="text-xs font-mono text-ink-muted dark:text-chalkboard-muted">
                                {progress.studyNext.resourcesCompleted} of {progress.studyNext.resourcesRecommended} Recommended Resources Completed
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {progress.studyNext && (
                        <div className="pt-4 mt-4 border-t border-ink/10 dark:border-chalkboard-borderSubtle flex items-center gap-3">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() =>
                              navigate(getTopicDetailUrl(progress.studyNext.topicId))
                            }
                          >
                            <span>Topic Details & History</span>
                            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                          </Button>
                        </div>
                      )}
                    </NotebookCard>
                  </div>

                  {/* Summary Metric Counters */}
                  <div className="grid grid-cols-2 md:grid-cols-1 gap-4">
                    <NotebookCard className="p-5 flex flex-col justify-center space-y-1 bg-paper-warm dark:bg-chalkboard-surface border border-ink/20 dark:border-chalkboard-borderSubtle">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono uppercase tracking-wider text-ink-muted dark:text-chalkboard-muted">
                          Strengths
                        </span>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="text-3xl font-extrabold font-mono text-ink dark:text-chalkboard-chalk">
                        {progress.strengths?.length || 0}
                      </div>
                      <p className="text-xs text-ink-muted dark:text-chalkboard-muted">
                        Topics with ≥ 80% mastery
                      </p>
                    </NotebookCard>

                    <NotebookCard className="p-5 flex flex-col justify-center space-y-1 bg-paper-warm dark:bg-chalkboard-surface border border-ink/20 dark:border-chalkboard-borderSubtle">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono uppercase tracking-wider text-ink-muted dark:text-chalkboard-muted">
                          Learning Gaps
                        </span>
                        <AlertTriangle className="w-4 h-4 text-redpen" />
                      </div>
                      <div className="text-3xl font-extrabold font-mono text-ink dark:text-chalkboard-chalk">
                        {progress.gaps?.length || 0}
                      </div>
                      <p className="text-xs text-ink-muted dark:text-chalkboard-muted">
                        Topics needing review (&lt; 60%)
                      </p>
                    </NotebookCard>
                  </div>
                </div>

                {/* 2. All 6 Curriculum Topics List */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-ink dark:text-chalkboard-chalk">
                      All Curriculum Topics
                    </h3>
                    <p className="text-xs sm:text-sm text-ink-muted dark:text-chalkboard-muted">
                      Select any topic to review your question-by-question answer history.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {progress.topics?.map((topic, idx) => {
                      const topicDetailUrl = getTopicDetailUrl(topic.topicId);
                      return (
                        <div
                          key={topic.topicId}
                          onClick={() => navigate(topicDetailUrl)}
                          className="group block cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-redpen rounded-2xl"
                          tabIndex={0}
                          role="link"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              navigate(topicDetailUrl);
                            }
                          }}
                        >
                          <NotebookCard
                            pattern="ruled"
                            borderStyle="sketch"
                            className="p-5 space-y-4 transition-all hover:shadow-notebook group-hover:-translate-y-0.5"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="space-y-1 flex-1">
                                <div className="flex items-center gap-2 text-xs font-mono text-ink-muted dark:text-chalkboard-muted">
                                  <span className="px-2 py-0.5 rounded bg-highlighter-yellow/30 text-ink font-bold border border-ink/20">
                                    Topic 0{idx + 1}
                                  </span>
                                  <span>•</span>
                                  <span>{topic.questionsAnswered} distinct questions evaluated</span>
                                </div>
                                <h4 className="font-bold text-lg text-ink dark:text-chalkboard-chalk group-hover:text-redpen transition-colors">
                                  {topic.topicName}
                                </h4>
                              </div>

                              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                                <StatusBadge status={topic.status} />
                                <TrendIndicator trend={topic.trend} />
                              </div>
                            </div>

                            <div className="pt-2">
                              <MasteryBar
                                percent={topic.masteryPercent}
                                status={topic.status}
                              />
                            </div>

                            {topic.resourcesRecommended > 0 && (
                              <div className="flex items-center justify-between text-xs font-mono pt-1">
                                <span className="text-ink-muted dark:text-chalkboard-muted">Study Resources:</span>
                                <span className={`font-bold ${topic.status === 'GAP' ? 'text-redpen-dark dark:text-red-300' : 'text-ink dark:text-chalkboard-chalk'}`}>
                                  {topic.resourcesCompleted} of {topic.resourcesRecommended} completed
                                </span>
                              </div>
                            )}

                            <div className="pt-2 border-t border-ink/10 dark:border-chalkboard-borderSubtle flex items-center justify-between text-xs font-mono text-ink-muted dark:text-chalkboard-muted">
                              <span>
                                {topic.status === 'INSUFFICIENT_DATA'
                                  ? 'Take topic quiz to assess'
                                  : `Last tested: ${
                                      topic.lastUpdated
                                        ? new Date(topic.lastUpdated).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                          })
                                        : 'Recent'
                                    }`}
                              </span>
                              <span className="inline-flex items-center gap-1 font-bold text-ink dark:text-chalkboard-chalk group-hover:translate-x-1 transition-transform">
                                <span>Details & History</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </span>
                            </div>
                          </NotebookCard>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </PortalShell>
  );
}

