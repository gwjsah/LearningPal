import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  BookOpen,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Clock,
  HelpCircle,
  Sparkles,
  ExternalLink,
  CheckSquare,
  Square,
  FileText,
  Dumbbell,
  Lightbulb,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { studentService } from '../services/studentService';
import { Button, NotebookCard, PortalShell } from '../components/NotebookPrimitives';
import { StatusBadge, TrendIndicator, MasteryBar } from '../components/MasteryPrimitives';

export default function TopicProgressDetail() {
  const { id, subjectId } = useParams();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [topicDetail, setTopicDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [completionError, setCompletionError] = useState('');
  const [togglingId, setTogglingId] = useState(null);

  const loadTopicDetail = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await studentService.getTopicProgress(id);
      setTopicDetail(data);
    } catch (err) {
      if (err.status === 401 || err.message?.includes('authentication is required')) {
        logout();
        navigate('/login', { replace: true });
        return;
      }
      setError(err.message || 'Unable to load topic progress details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTopicDetail();
  }, [id]);

  // Handle immediate optimistic completion toggle with rollback on failure
  const handleToggleComplete = async (resourceId, currentlyCompleted) => {
    if (!topicDetail || togglingId) return;
    setCompletionError('');
    setTogglingId(resourceId);

    const previousDetail = { ...topicDetail };
    const updatedResources = topicDetail.resources.map((r) =>
      r.id === resourceId ? { ...r, completed: !currentlyCompleted } : r
    );
    const updatedCompletedCount = updatedResources.filter((r) => r.completed).length;

    setTopicDetail({
      ...topicDetail,
      resources: updatedResources,
      resourcesCompleted: updatedCompletedCount,
    });

    try {
      if (currentlyCompleted) {
        await studentService.uncompleteResource(resourceId);
      } else {
        await studentService.completeResource(resourceId);
      }
    } catch (err) {
      setTopicDetail(previousDetail);
      setCompletionError(err.message || 'Failed to update resource completion status. Please try again.');
    } finally {
      setTogglingId(null);
    }
  };

  // Safe plaintext renderer preserving code in monospace blocks without innerHTML
  const renderResourceContent = (content) => {
    if (!content) return null;

    const codeBlockRegex = /```(?:[a-zA-Z0-9_-]+)?\n([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          text: content.substring(lastIndex, match.index),
        });
      }
      parts.push({
        type: 'code',
        code: match[1],
      });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      parts.push({
        type: 'text',
        text: content.substring(lastIndex),
      });
    }

    return (
      <div className="space-y-3">
        {parts.map((p, i) => {
          if (p.type === 'code') {
            return (
              <pre
                key={i}
                className="p-3.5 rounded-lg font-mono text-xs sm:text-sm bg-paper-warm dark:bg-chalkboard-surface border border-ink/20 dark:border-white/20 whitespace-pre overflow-x-auto text-ink dark:text-chalkboard-chalk"
              >
                <code>{p.code}</code>
              </pre>
            );
          }

          return (
            <div
              key={i}
              className="text-sm text-ink-muted dark:text-chalkboard-muted leading-relaxed whitespace-pre-line"
            >
              {p.text}
            </div>
          );
        })}
      </div>
    );
  };

  // Safe URL validator for external links (http or https only)
  const isValidHttpUrl = (url) => {
    if (!url) return false;
    return url.startsWith('http://') || url.startsWith('https://');
  };

  // Format question text with code blocks
  const renderFormattedText = (text) => {
    if (!text) return null;
    const parts = text.split('\n\n');

    return (
      <div className="space-y-2.5">
        {parts.map((part, idx) => {
          const isCode =
            part.includes('#include') ||
            part.includes('int main') ||
            part.includes('printf(') ||
            part.includes('scanf(') ||
            part.includes('for (') ||
            part.includes('while (');

          if (isCode) {
            return (
              <pre
                key={idx}
                className="p-3 rounded-lg font-mono text-xs sm:text-sm bg-paper-warm dark:bg-chalkboard-surface border border-ink/20 dark:border-white/20 whitespace-pre-wrap overflow-x-auto text-ink dark:text-chalkboard-chalk"
              >
                <code>{part}</code>
              </pre>
            );
          }

          return (
            <p key={idx} className="text-sm sm:text-base font-medium text-ink dark:text-chalkboard-chalk leading-relaxed">
              {part}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <PortalShell
      portalSubtitle="Personalized Diagnostic Feedback & Learning Resources"
      user={user}
      onLogout={logout}
      badgeIcon={BookOpen}
      badgeLabel="Topic Diagnostics"
      badgeColorClass="bg-highlighter-yellow text-ink"
      title={topicDetail ? topicDetail.topicName : 'Topic Feedback & Resources'}
      subtitle="Targeted study materials, customized guidance, and question reviews for this domain."
    >
      <div className="w-full space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between text-xs font-mono">
          <Link
            to={
              subjectId
                ? `/student/subjects/${subjectId}/progress`
                : '/student/progress'
            }
            className="inline-flex items-center gap-1.5 text-ink-muted dark:text-chalkboard-muted hover:text-ink dark:hover:text-chalkboard-chalk transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-redpen rounded"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Curriculum Progress</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              to={subjectId ? `/student/subjects/${subjectId}` : '/student'}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-ink/20 dark:border-white/20 text-ink dark:text-chalkboard-chalk hover:bg-paper-warm dark:hover:bg-chalkboard-surface font-bold text-xs"
            >
              <span>{subjectId ? 'Subject Dashboard' : 'Desk'}</span>
            </Link>
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="py-20 text-center space-y-4">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-redpen" />
            <p className="font-hand text-2xl text-ink dark:text-chalkboard-chalk">
              Compiling personalized feedback and recommended resources...
            </p>
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="p-4 rounded-xl border-2 border-redpen bg-redpen-soft text-redpen-dark flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-semibold">{error}</p>
            </div>
            <Button size="sm" variant="secondary" onClick={loadTopicDetail}>
              <RefreshCw className="w-3.5 h-3.5 mr-1" />
              Retry
            </Button>
          </div>
        )}

        {/* Content loaded */}
        {!loading && !error && topicDetail && (
          <>
            {/* Transient completion error banner */}
            {completionError && (
              <div className="p-4 rounded-xl border border-redpen bg-redpen-soft text-redpen-dark flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <p className="text-xs sm:text-sm font-medium">{completionError}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setCompletionError('')}
                  className="text-xs font-mono font-bold hover:underline"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* 1. Personalized Feedback Card */}
            {topicDetail.feedback && (
              <NotebookCard
                pattern="grid"
                borderStyle="sketch"
                className="p-6 sm:p-8 bg-paper-card dark:bg-chalkboard-card border-2 border-ink dark:border-white/50"
              >
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-mono font-bold uppercase bg-highlighter-yellow text-ink border border-ink/30 shadow-notebook-sm">
                        <Sparkles className="w-3.5 h-3.5 text-redpen" />
                        Diagnostic Feedback
                      </span>
                      <StatusBadge status={topicDetail.status} />
                      <TrendIndicator trend={topicDetail.trend} />
                    </div>

                    <div className="text-xs font-mono text-ink-muted dark:text-chalkboard-muted">
                      Mastery: <span className="font-bold text-ink dark:text-chalkboard-chalk">{topicDetail.masteryPercent}%</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <h2 className="text-xl sm:text-2xl font-bold text-ink dark:text-chalkboard-chalk">
                      {topicDetail.feedback.headline}
                    </h2>
                    <p className="text-sm sm:text-base text-ink-muted dark:text-chalkboard-muted leading-relaxed">
                      {topicDetail.feedback.message}
                    </p>
                  </div>

                  <div className="pt-2">
                    <MasteryBar
                      percent={topicDetail.masteryPercent}
                      status={topicDetail.status}
                    />
                  </div>
                </div>
              </NotebookCard>
            )}

            {/* 2. What to Review Section (Missed Questions) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-ink dark:text-chalkboard-chalk">
                    What to Review
                  </h3>
                  <p className="text-xs sm:text-sm text-ink-muted dark:text-chalkboard-muted">
                    Questions answered incorrectly or left blank in your most recent submitted quiz attempts.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-paper-warm dark:bg-chalkboard-surface border border-ink/20 dark:border-white/20 text-ink dark:text-chalkboard-chalk">
                  {topicDetail.feedback?.whatToReview?.length || 0} Questions
                </span>
              </div>

              {!topicDetail.feedback?.whatToReview || topicDetail.feedback.whatToReview.length === 0 ? (
                <NotebookCard className="p-6 text-center space-y-2 bg-paper-warm dark:bg-chalkboard-surface border border-ink/20 dark:border-white/20">
                  <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-600 dark:text-emerald-400" />
                  <h4 className="text-base font-bold text-ink dark:text-chalkboard-chalk">
                    No Missed Questions!
                  </h4>
                  <p className="text-xs text-ink-muted dark:text-chalkboard-muted max-w-md mx-auto">
                    {topicDetail.status === 'INSUFFICIENT_DATA'
                      ? 'You have not submitted quiz questions on this topic yet. Take the topic quiz to identify any areas to review.'
                      : 'You scored 100% on every tested question for this topic! Work through the practice challenge below to reinforce your skills.'}
                  </p>
                </NotebookCard>
              ) : (
                <div className="space-y-4">
                  {topicDetail.feedback.whatToReview.map((item, idx) => (
                    <NotebookCard
                      key={item.questionId}
                      pattern="ruled"
                      borderStyle="sketch"
                      className="p-5 sm:p-6 space-y-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-highlighter-yellow/30 text-ink border border-ink/20">
                          Missed Concept #{idx + 1}
                        </span>
                      </div>

                      <div className="pt-1">
                        {renderFormattedText(item.questionText)}
                      </div>

                      {/* Answers Comparison */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        {/* Student Answer */}
                        <div className="p-3 rounded-lg bg-redpen-soft/60 border border-redpen/30 space-y-1">
                          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-redpen-dark dark:text-red-300">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Your Answer</span>
                          </div>
                          <p className="text-xs sm:text-sm font-semibold text-ink dark:text-chalkboard-chalk break-words">
                            {item.studentAnswer}
                          </p>
                        </div>

                        {/* Correct Answer */}
                        <div className="p-3 rounded-lg bg-highlighter-mint/40 border border-emerald-600/30 space-y-1">
                          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-800 dark:text-emerald-300">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Correct Answer</span>
                          </div>
                          <p className="text-xs sm:text-sm font-semibold text-ink dark:text-chalkboard-chalk break-words">
                            {item.correctAnswer}
                          </p>
                        </div>
                      </div>

                      {/* Explanation */}
                      {item.explanation && (
                        <div className="p-3.5 rounded-lg bg-paper-warm dark:bg-chalkboard-surface border border-ink/15 dark:border-white/15 space-y-1.5">
                          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-ink dark:text-chalkboard-chalk">
                            <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                            <span>Explanation & Misconception</span>
                          </div>
                          <p className="text-xs sm:text-sm text-ink-muted dark:text-chalkboard-muted leading-relaxed">
                            {item.explanation}
                          </p>
                        </div>
                      )}
                    </NotebookCard>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Recommended Resources Section */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-ink dark:text-chalkboard-chalk">
                    Recommended Resources
                  </h3>
                  <p className="text-xs sm:text-sm text-ink-muted dark:text-chalkboard-muted">
                    Study notes and practice exercises prioritized for your current mastery level.
                  </p>
                </div>

                {/* Completion Progress Badge */}
                {topicDetail.resourcesRecommended > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold px-3 py-1 rounded-full border border-ink/20 dark:border-white/20 bg-paper-warm dark:bg-chalkboard-surface text-ink dark:text-chalkboard-chalk">
                      {topicDetail.resourcesCompleted} of {topicDetail.resourcesRecommended} Completed
                    </span>
                  </div>
                )}
              </div>

              {/* Progress Bar for Resources */}
              {topicDetail.resourcesRecommended > 0 && (
                <div
                  className="w-full h-2 rounded-full bg-paper-warm dark:bg-chalkboard-surface border border-ink/20 dark:border-white/20 overflow-hidden"
                  role="progressbar"
                  aria-valuenow={topicDetail.resourcesCompleted}
                  aria-valuemin="0"
                  aria-valuemax={topicDetail.resourcesRecommended}
                  aria-label={`${topicDetail.resourcesCompleted} of ${topicDetail.resourcesRecommended} resources completed`}
                >
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-300 motion-reduce:transition-none"
                    style={{
                      width: `${Math.round(
                        (topicDetail.resourcesCompleted / topicDetail.resourcesRecommended) * 100
                      )}%`,
                    }}
                  />
                </div>
              )}

              {topicDetail.resources?.length === 0 ? (
                <NotebookCard className="p-8 text-center text-ink-muted dark:text-chalkboard-muted">
                  <p>No recommended resources available for this topic yet.</p>
                </NotebookCard>
              ) : (
                <div className="space-y-5">
                  {topicDetail.resources.map((res) => {
                    const isCompleted = res.completed;
                    const isNote = res.type === 'NOTE';

                    return (
                      <NotebookCard
                        key={res.id}
                        pattern="ruled"
                        borderStyle="sketch"
                        className={`p-6 space-y-4 transition-all ${
                          isCompleted
                            ? 'bg-paper-card/90 dark:bg-chalkboard-card/90 border-emerald-600/50'
                            : 'bg-paper-card dark:bg-chalkboard-card'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-mono font-bold border ${
                                isNote
                                  ? 'bg-highlighter-skySoft text-blue-900 dark:text-blue-300 border-blue-400/40'
                                  : 'bg-highlighter-yellowSoft text-amber-900 dark:text-amber-300 border-amber-400/40'
                              }`}
                            >
                              {isNote ? (
                                <FileText className="w-3.5 h-3.5" />
                              ) : (
                                <Dumbbell className="w-3.5 h-3.5" />
                              )}
                              <span>{res.type}</span>
                            </span>

                            <h4 className="text-lg font-bold text-ink dark:text-chalkboard-chalk">
                              {res.title}
                            </h4>
                          </div>

                          {/* Completion Toggle Button / Checkbox */}
                          <button
                            type="button"
                            onClick={() => handleToggleComplete(res.id, isCompleted)}
                            disabled={togglingId === res.id}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-redpen ${
                              isCompleted
                                ? 'bg-highlighter-mint text-ink border-emerald-700 shadow-notebook-sm'
                                : 'bg-paper-warm dark:bg-chalkboard-surface text-ink-muted dark:text-chalkboard-muted border-ink/30 hover:border-ink dark:hover:border-white/50'
                            }`}
                            aria-pressed={isCompleted}
                            aria-label={`Mark ${res.title} as ${isCompleted ? 'incomplete' : 'completed'}`}
                          >
                            {isCompleted ? (
                              <>
                                <CheckSquare className="w-4 h-4 text-emerald-800" />
                                <span>Completed</span>
                              </>
                            ) : (
                              <>
                                <Square className="w-4 h-4 text-ink-muted dark:text-chalkboard-muted" />
                                <span>Mark as Completed</span>
                              </>
                            )}
                          </button>
                        </div>

                        {res.description && (
                          <p className="text-xs sm:text-sm text-ink-muted dark:text-chalkboard-muted italic">
                            {res.description}
                          </p>
                        )}

                        {/* Resource Content: Plain text with monospace code blocks */}
                        {res.content && (
                          <div className="pt-2 border-t border-ink/10 dark:border-white/10">
                            {renderResourceContent(res.content)}
                          </div>
                        )}

                        {/* External Link (if present and valid http/https) */}
                        {isValidHttpUrl(res.url) && (
                          <div className="pt-2 flex items-center justify-end">
                            <a
                              href={res.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-redpen hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-redpen rounded"
                            >
                              <span>Open External Resource</span>
                              <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                            </a>
                          </div>
                        )}
                      </NotebookCard>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 4. Full Answer History Section */}
            <div className="space-y-4 pt-4 border-t border-ink/15 dark:border-white/15">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-ink dark:text-chalkboard-chalk">
                    Submitted Answer Log
                  </h3>
                  <p className="text-xs text-ink-muted dark:text-chalkboard-muted">
                    Full history of your submissions for this topic across past quiz attempts.
                  </p>
                </div>
                <span className="text-xs font-mono text-ink-muted dark:text-chalkboard-muted">
                  {topicDetail.history?.length || 0} Submissions
                </span>
              </div>

              {topicDetail.history?.length === 0 ? (
                <NotebookCard className="p-6 text-center text-xs text-ink-muted dark:text-chalkboard-muted">
                  No submissions yet.
                </NotebookCard>
              ) : (
                <div className="space-y-3">
                  {topicDetail.history.map((item, idx) => (
                    <div
                      key={`hist-${item.questionId}-${idx}`}
                      className="p-3.5 rounded-xl bg-paper-warm/80 dark:bg-chalkboard-surface/80 border border-ink/15 dark:border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1 max-w-xl">
                        <span className="font-mono font-bold text-ink-muted dark:text-chalkboard-muted">
                          #{idx + 1}
                        </span>
                        <p className="font-medium text-ink dark:text-chalkboard-chalk line-clamp-2">
                          {item.questionText}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        {item.isCorrect ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-bold bg-highlighter-mint/40 text-emerald-900 dark:text-emerald-300 border border-emerald-600/30">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Correct ({item.scoreEarned} pt)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-bold bg-redpen-soft text-redpen-dark dark:text-red-300 border border-redpen/30">
                            <XCircle className="w-3 h-3" />
                            <span>Incorrect (0 pt)</span>
                          </span>
                        )}

                        {item.submittedAt && (
                          <span className="font-mono text-ink-muted dark:text-chalkboard-muted text-[11px]">
                            {new Date(item.submittedAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </PortalShell>
  );
}
