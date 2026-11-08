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
  Star,
  Check,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { studentService } from '../services/studentService';
import { Button, NotebookCard, PortalShell } from '../components/NotebookPrimitives';
import { StatusBadge, TrendIndicator, MasteryBar } from '../components/MasteryPrimitives';

const RATING_LABELS = {
  1: 'Not helpful',
  2: 'Slightly helpful',
  3: 'Moderately helpful',
  4: 'Very helpful',
  5: 'Extremely helpful',
};

/**
 * Expandable rating control for individual learning resources.
 */
function ResourceRatingWidget({ resource, onRatingSaved }) {
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(resource.studentRating || 0);
  const [comment, setComment] = useState(resource.studentComment || '');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setRating(resource.studentRating || 0);
    setComment(resource.studentComment || '');
  }, [resource.studentRating, resource.studentComment]);

  const handleSave = async (e) => {
    e?.preventDefault();
    if (!rating || saving) return;
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      const saved = await studentService.rateResource(resource.id, {
        rating,
        comment: comment.trim() ? comment.trim() : null,
      });
      onRatingSaved(resource.id, saved.rating, saved.comment);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setIsOpen(false);
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to save resource rating. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const hasExistingRating = resource.studentRating != null && resource.studentRating > 0;

  return (
    <div className="pt-3 border-t border-ink/10 dark:border-chalkboard-borderSubtle">
      {!isOpen ? (
        <div className="flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            {hasExistingRating ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-highlighter-yellow/30 text-ink dark:text-chalkboard-chalk font-bold">
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                <span>Your rating: {resource.studentRating}/5</span>
                <span className="text-ink-muted dark:text-chalkboard-muted">({RATING_LABELS[resource.studentRating]})</span>
              </span>
            ) : (
              <span className="text-ink-muted dark:text-chalkboard-muted">
                Was this resource helpful for your studies?
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="text-xs font-bold text-redpen hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-redpen rounded cursor-pointer"
          >
            {hasExistingRating ? 'Edit rating' : '+ Rate resource'}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSave} className="p-3.5 rounded-xl bg-paper-warm/80 dark:bg-chalkboard-surface border border-ink/20 dark:border-chalkboard-borderSubtle space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-ink dark:text-chalkboard-chalk">
              Rate this resource (1 to 5):
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              disabled={saving}
              className="text-xs text-ink-muted dark:text-chalkboard-muted hover:text-ink dark:hover:text-chalkboard-chalk cursor-pointer"
            >
              Cancel
            </button>
          </div>

          {/* 1-5 Star / Button selector */}
          <div className="flex items-center gap-1.5" role="radiogroup" aria-label="Resource rating">
            {[1, 2, 3, 4, 5].map((score) => {
              const isSelected = rating >= score;
              return (
                <button
                  key={score}
                  type="button"
                  onClick={() => setRating(score)}
                  disabled={saving}
                  role="radio"
                  aria-checked={rating === score}
                  className={`p-1.5 rounded-lg border transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-redpen cursor-pointer ${
                    rating === score
                      ? 'border-redpen bg-redpen-soft/40 shadow-xs'
                      : isSelected
                      ? 'border-amber-400 bg-amber-100/50 dark:bg-amber-950/40 text-amber-500'
                      : 'border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-card dark:bg-chalkboard-card text-ink-muted dark:text-chalkboard-muted hover:border-ink'
                  }`}
                  title={`${score} - ${RATING_LABELS[score]}`}
                >
                  <Star
                    className={`w-4 h-4 ${
                      isSelected
                        ? 'fill-amber-500 text-amber-500'
                        : 'text-ink-muted dark:text-chalkboard-muted'
                    }`}
                  />
                  <span className="sr-only">{score} of 5 - {RATING_LABELS[score]}</span>
                </button>
              );
            })}
            {rating > 0 && (
              <span className="text-xs font-mono font-bold text-ink dark:text-chalkboard-chalk ml-2">
                {rating}/5 · {RATING_LABELS[rating]}
              </span>
            )}
          </div>

          {/* Optional comment */}
          <div className="space-y-1">
            <label htmlFor={`res-comment-${resource.id}`} className="text-[11px] font-mono text-ink-muted dark:text-chalkboard-muted flex justify-between">
              <span>Optional note on this material (plain text):</span>
              <span>{300 - (comment?.length || 0)} left</span>
            </label>
            <input
              id={`res-comment-${resource.id}`}
              type="text"
              maxLength={300}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={saving}
              placeholder="e.g. Clear diagrams, good practice problem"
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-ink/20 dark:border-chalkboard-borderSubtle bg-paper dark:bg-chalkboard text-ink dark:text-chalkboard-chalk focus:outline-none focus:border-redpen"
            />
          </div>

          {error && (
            <p className="text-xs text-redpen font-semibold" role="alert">{error}</p>
          )}

          {success && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold" role="status">
              <Check className="w-3.5 h-3.5" />
              <span>Rating saved successfully!</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              disabled={saving}
              className="px-2.5 py-1 text-xs font-bold rounded-lg border border-ink/20 dark:border-chalkboard-borderSubtle text-ink dark:text-chalkboard-chalk hover:bg-paper-warm cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!rating || saving}
              className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-lg border border-ink dark:border-chalkboard-borderStrong bg-redpen hover:bg-redpen-dark text-white disabled:opacity-50 cursor-pointer shadow-notebook-sm"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Rating</span>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function TopicProgressDetail() {
  const { id, classId, subjectId } = useParams();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const validClassId =
    classId && classId !== 'undefined' && !isNaN(classId)
      ? classId
      : null;

  const [topicDetail, setTopicDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [completionError, setCompletionError] = useState('');
  const [togglingId, setTogglingId] = useState(null);

  // Topic Feedback Helpfulness Rating State
  const [feedbackRatingValue, setFeedbackRatingValue] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackSaving, setFeedbackSaving] = useState(false);
  const [feedbackSaveSuccess, setFeedbackSaveSuccess] = useState(false);
  const [feedbackSaveError, setFeedbackSaveError] = useState('');

  // Sync feedback rating state from loaded topic detail
  useEffect(() => {
    if (topicDetail?.studentFeedbackRating) {
      setFeedbackRatingValue(topicDetail.studentFeedbackRating.rating || 0);
      setFeedbackComment(topicDetail.studentFeedbackRating.comment || '');
    } else {
      setFeedbackRatingValue(0);
      setFeedbackComment('');
    }
  }, [topicDetail?.studentFeedbackRating]);

  const handleSaveFeedbackRating = async (e) => {
    e?.preventDefault();
    if (!feedbackRatingValue || feedbackSaving) return;
    setFeedbackSaving(true);
    setFeedbackSaveError('');
    setFeedbackSaveSuccess(false);
    try {
      const saved = await studentService.rateTopicFeedback(id, {
        rating: feedbackRatingValue,
        comment: feedbackComment.trim() ? feedbackComment.trim() : null,
      });
      setTopicDetail((prev) => ({
        ...prev,
        studentFeedbackRating: saved,
      }));
      setFeedbackSaveSuccess(true);
      setTimeout(() => setFeedbackSaveSuccess(false), 4000);
    } catch (err) {
      setFeedbackSaveError(err.message || 'Failed to save feedback rating. Please try again.');
    } finally {
      setFeedbackSaving(false);
    }
  };

  const handleResourceRatingSaved = (resourceId, newRating, newComment) => {
    setTopicDetail((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        resources: (prev.resources || []).map((r) =>
          r.id === resourceId
            ? { ...r, studentRating: newRating, studentComment: newComment }
            : r
        ),
      };
    });
  };

  const loadTopicDetail = async () => {
    setLoading(true);
    setError('');
    try {
      const data = validClassId
        ? await studentService.getClassTopicProgress(validClassId, id)
        : await studentService.getTopicProgress(id);
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
  }, [id, classId]);

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
        await studentService.uncompleteResource(resourceId, validClassId);
      } else {
        await studentService.completeResource(resourceId, validClassId);
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
                className="p-3.5 rounded-lg font-mono text-xs sm:text-sm bg-paper-warm dark:bg-chalkboard-surface border border-ink/20 dark:border-chalkboard-borderSubtle whitespace-pre overflow-x-auto text-ink dark:text-chalkboard-chalk"
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
                className="p-3 rounded-lg font-mono text-xs sm:text-sm bg-paper-warm dark:bg-chalkboard-surface border border-ink/20 dark:border-chalkboard-borderSubtle whitespace-pre-wrap overflow-x-auto text-ink dark:text-chalkboard-chalk"
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

  const validSubjectId =
    subjectId && subjectId !== 'undefined' && !isNaN(subjectId)
      ? subjectId
      : (topicDetail?.subjectId ? String(topicDetail.subjectId) : null);

  const progressBackUrl = validClassId
    ? `/student/classes/${validClassId}/progress`
    : validSubjectId
    ? `/student/subjects/${validSubjectId}/progress`
    : '/student/progress';

  const dashboardBackUrl = validClassId
    ? `/student/classes/${validClassId}`
    : validSubjectId
    ? `/student/subjects/${validSubjectId}`
    : '/student';

  const dashboardLabel = validClassId
    ? 'Class Workspace'
    : validSubjectId
    ? 'Subject Dashboard'
    : 'Desk';

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
            to={progressBackUrl}
            className="inline-flex items-center gap-1.5 text-ink-muted dark:text-chalkboard-muted hover:text-ink dark:hover:text-chalkboard-chalk transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-redpen rounded"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Curriculum Progress</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              to={dashboardBackUrl}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-ink/20 dark:border-chalkboard-borderSubtle text-ink dark:text-chalkboard-chalk hover:bg-paper-warm dark:hover:bg-chalkboard-surface font-bold text-xs"
            >
              <span>{dashboardLabel}</span>
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
          <div className="p-4 rounded-xl border-2 border-redpen bg-redpen-soft text-redpen-dark flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-semibold">{error}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="secondary" onClick={() => navigate('/student')}>
                Back to My Classes
              </Button>
              <Button size="sm" variant="primary" onClick={loadTopicDetail}>
                <RefreshCw className="w-3.5 h-3.5 mr-1" />
                Retry
              </Button>
            </div>
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
                className="p-6 sm:p-8 bg-paper-card dark:bg-chalkboard-card border-2 border-ink dark:border-chalkboard-border"
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

                  {/* Helpfulness Rating Section */}
                  <form
                    onSubmit={handleSaveFeedbackRating}
                    className="pt-4 mt-2 border-t border-ink/15 dark:border-chalkboard-borderSubtle space-y-3"
                  >
                    <fieldset className="space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <legend className="text-xs sm:text-sm font-bold text-ink dark:text-chalkboard-chalk">
                          Was this feedback helpful?
                        </legend>
                        {topicDetail.studentFeedbackRating && (
                          <span className="text-[11px] font-mono text-ink-muted dark:text-chalkboard-muted">
                            Previously rated {topicDetail.studentFeedbackRating.rating}/5
                          </span>
                        )}
                      </div>

                      {/* 5-Option Accessible Radio Group */}
                      <div
                        className="grid grid-cols-1 sm:grid-cols-5 gap-2"
                        role="radiogroup"
                        aria-label="Diagnostic feedback helpfulness"
                      >
                        {[
                          { score: 1, label: 'Not helpful' },
                          { score: 2, label: 'Slightly helpful' },
                          { score: 3, label: 'Moderately helpful' },
                          { score: 4, label: 'Very helpful' },
                          { score: 5, label: 'Extremely helpful' },
                        ].map((opt) => {
                          const isSelected = feedbackRatingValue === opt.score;
                          return (
                            <label
                              key={opt.score}
                              className={`flex sm:flex-col items-center sm:justify-center gap-2 p-2.5 rounded-xl border text-xs cursor-pointer transition-all focus-within:ring-2 focus-within:ring-redpen ${
                                isSelected
                                  ? 'border-redpen bg-redpen-soft/40 text-redpen-dark dark:text-red-300 font-bold shadow-notebook-sm'
                                  : 'border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-warm/50 dark:bg-chalkboard-surface/70 text-ink dark:text-chalkboard-chalk hover:border-ink/50'
                              }`}
                            >
                              <input
                                type="radio"
                                name="feedbackHelpfulness"
                                value={opt.score}
                                checked={isSelected}
                                onChange={() => setFeedbackRatingValue(opt.score)}
                                disabled={feedbackSaving}
                                className="w-3.5 h-3.5 accent-redpen focus:ring-redpen"
                              />
                              <span className="text-center font-mono">
                                <span className="font-bold sm:block sm:mb-0.5">{opt.score} ·</span> {opt.label}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </fieldset>

                    {/* Optional Comment */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-mono text-ink-muted dark:text-chalkboard-muted">
                        <label htmlFor="feedback-comment-input">
                          Optional comment for instructor & curriculum improvements (max 300 chars):
                        </label>
                        <span>{300 - feedbackComment.length} characters left</span>
                      </div>
                      <textarea
                        id="feedback-comment-input"
                        rows={2}
                        maxLength={300}
                        value={feedbackComment}
                        onChange={(e) => setFeedbackComment(e.target.value)}
                        disabled={feedbackSaving}
                        placeholder="What made this feedback clear or unclear? Any specific concept that helped you understand your mistake?"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-ink/20 dark:border-chalkboard-borderSubtle bg-paper dark:bg-chalkboard text-ink dark:text-chalkboard-chalk focus:outline-none focus:border-redpen transition-colors"
                      />
                    </div>

                    {/* Error Message */}
                    {feedbackSaveError && (
                      <div className="p-2.5 rounded-lg border border-redpen bg-redpen-soft text-redpen-dark text-xs flex items-center gap-2" role="alert">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{feedbackSaveError}</span>
                      </div>
                    )}

                    {/* Success Confirmation */}
                    {feedbackSaveSuccess && (
                      <div className="p-2.5 rounded-lg border border-emerald-600/30 bg-highlighter-mint/30 text-ink dark:text-chalkboard-chalk text-xs flex items-center gap-2" role="status">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span className="font-bold">Thank you! Your feedback rating has been recorded.</span>
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <Button
                        type="submit"
                        variant="primary"
                        size="sm"
                        disabled={!feedbackRatingValue || feedbackSaving}
                        className="font-bold text-xs"
                      >
                        {feedbackSaving ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                            <span>Saving Rating...</span>
                          </>
                        ) : (
                          <span>
                            {topicDetail.studentFeedbackRating ? 'Update Feedback Rating' : 'Save Feedback Rating'}
                          </span>
                        )}
                      </Button>
                    </div>
                  </form>
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
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-paper-warm dark:bg-chalkboard-surface border border-ink/20 dark:border-chalkboard-borderSubtle text-ink dark:text-chalkboard-chalk">
                  {topicDetail.feedback?.whatToReview?.length || 0} Questions
                </span>
              </div>

              {!topicDetail.feedback?.whatToReview || topicDetail.feedback.whatToReview.length === 0 ? (
                <NotebookCard className="p-6 text-center space-y-2 bg-paper-warm dark:bg-chalkboard-surface border border-ink/20 dark:border-chalkboard-borderSubtle">
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
                        <div className="p-3.5 rounded-lg bg-paper-warm dark:bg-chalkboard-surface border border-ink/15 dark:border-chalkboard-borderSubtle space-y-1.5">
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
                    <span className="text-xs font-mono font-bold px-3 py-1 rounded-full border border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-warm dark:bg-chalkboard-surface text-ink dark:text-chalkboard-chalk">
                      {topicDetail.resourcesCompleted} of {topicDetail.resourcesRecommended} Completed
                    </span>
                  </div>
                )}
              </div>

              {/* Progress Bar for Resources */}
              {topicDetail.resourcesRecommended > 0 && (
                <div
                  className="w-full h-2 rounded-full bg-paper-warm dark:bg-chalkboard-surface border border-ink/20 dark:border-chalkboard-borderSubtle overflow-hidden"
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
                                : 'bg-paper-warm dark:bg-chalkboard-surface text-ink-muted dark:text-chalkboard-muted border-ink/30 hover:border-ink dark:hover:border-chalkboard-borderStrong'
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
                          <div className="pt-2 border-t border-ink/10 dark:border-chalkboard-borderSubtle">
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

                        {/* Student Resource Rating Control */}
                        <ResourceRatingWidget
                          resource={res}
                          onRatingSaved={handleResourceRatingSaved}
                        />
                      </NotebookCard>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 4. Full Answer History Section */}
            <div className="space-y-4 pt-4 border-t border-ink/15 dark:border-chalkboard-borderSubtle">
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
                      className="p-3.5 rounded-xl bg-paper-warm/80 dark:bg-chalkboard-surface/80 border border-ink/15 dark:border-chalkboard-borderSubtle flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
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
