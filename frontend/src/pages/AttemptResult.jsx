import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Award,
  CheckCircle2,
  XCircle,
  MinusCircle,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Lightbulb,
  AlertCircle,
  Sparkles,
  Clock,
  LayoutList,
  Square,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { studentService } from '../services/studentService';
import {
  Button,
  NotebookBackButton,
  NotebookCard,
  NotebookLoader,
  PortalShell,
} from '../components/NotebookPrimitives';
import { StatusBadge } from '../components/MasteryPrimitives';

function renderFormattedText(text) {
  if (!text) return null;
  const parts = text.split('\n\n');

  return (
    <div className="space-y-3">
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
              className="p-3.5 rounded-lg font-mono text-xs sm:text-sm bg-paper-warm dark:bg-chalkboard-surface border border-ink/20 dark:border-chalkboard-borderSubtle whitespace-pre-wrap overflow-x-auto text-ink dark:text-chalkboard-chalk"
            >
              <code>{part}</code>
            </pre>
          );
        }

        return (
          <p
            key={idx}
            className="text-base sm:text-lg font-medium text-ink dark:text-chalkboard-chalk leading-relaxed"
          >
            {part}
          </p>
        );
      })}
    </div>
  );
}

function getQuestionOutcome(q) {
  const qType = q.type || 'MULTIPLE_CHOICE';
  if (qType === 'ESSAY' && !q.graded) return 'awaiting';
  if (qType === 'ESSAY' && q.graded) return 'graded';
  if (q.isCorrect) return 'correct';
  const wasAnswered =
    qType === 'MULTIPLE_CHOICE'
      ? q.studentChoiceId != null
      : q.studentTextAnswer != null && q.studentTextAnswer.trim().length > 0;
  return wasAnswered ? 'incorrect' : 'unanswered';
}

function QuestionReviewCard({ q, questionNumber }) {
  const qType = q.type || 'MULTIPLE_CHOICE';
  const outcome = getQuestionOutcome(q);
  const isUngradedEssay = outcome === 'awaiting';

  let statusBadge = (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono font-bold border-2 border-emerald-700 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200">
      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
      Correct (+{q.pointsEarned} pt)
    </span>
  );

  if (outcome === 'awaiting') {
    statusBadge = (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono font-bold border-2 border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200">
        <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
        Awaiting teacher review ({q.pointsPossible} pts)
      </span>
    );
  } else if (outcome === 'graded') {
    statusBadge = (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono font-bold border-2 border-emerald-700 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
        Graded ({q.pointsEarned} / {q.pointsPossible} pt)
      </span>
    );
  } else if (outcome === 'unanswered') {
    statusBadge = (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono font-bold border-2 border-ink/40 dark:border-chalkboard-border bg-paper-warm dark:bg-chalkboard-surface text-ink-muted dark:text-chalkboard-muted">
        <MinusCircle className="w-3.5 h-3.5 text-ink-muted dark:text-chalkboard-muted" aria-hidden="true" />
        Unanswered (0.0 / {q.pointsPossible} pt)
      </span>
    );
  } else if (outcome === 'incorrect') {
    statusBadge = (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono font-bold border-2 border-redpen dark:border-red-500/60 bg-redpen-soft dark:bg-red-950/60 text-redpen-dark dark:text-red-300">
        <XCircle className="w-3.5 h-3.5 text-redpen dark:text-red-400" aria-hidden="true" />
        Incorrect (0.0 / {q.pointsPossible} pt)
      </span>
    );
  }

  return (
    <NotebookCard
      id={`question-${q.questionId}`}
      pattern="ruled"
      borderStyle="margin"
      className="p-6 sm:p-7 space-y-5 scroll-mt-24"
    >
      {/* Question header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink/10 dark:border-chalkboard-borderSubtle pb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-ink-muted dark:text-chalkboard-muted">
            Question {questionNumber}
          </span>
          <span aria-hidden="true">•</span>
          <span className="px-2 py-0.5 rounded bg-highlighter-yellow/30 text-ink dark:text-chalkboard-chalk font-mono text-xs font-bold border border-ink/20">
            {q.topicName}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {q.adjusted && qType !== 'ESSAY' ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono font-bold border-2 border-amber-600 bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200">
              <Sparkles className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" aria-hidden="true" />
              Adjusted by your teacher ({q.pointsEarned} / {q.pointsPossible} pt)
            </span>
          ) : (
            statusBadge
          )}
        </div>
      </div>

      {/* Instructor Feedback on Graded/Adjusted Answer */}
      {q.teacherComment && (
        <div className="p-3.5 rounded-xl border-2 border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 space-y-1">
          <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-amber-900 dark:text-amber-200">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
            <span>Teacher Comment:</span>
          </div>
          <p className="text-xs sm:text-sm text-ink dark:text-chalkboard-chalk font-mono whitespace-pre-wrap">
            {q.teacherComment}
          </p>
        </div>
      )}

      {/* Question Text */}
      {renderFormattedText(q.questionText)}

      {/* Answer Review Section by Question Type */}
      {qType === 'ENUMERATION' ? (
        <div className="space-y-3 pt-2">
          <div className="p-3.5 rounded-xl border border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-warm/50 dark:bg-chalkboard-surface/50 space-y-1">
            <span className="text-xs font-mono font-bold uppercase text-ink-muted dark:text-chalkboard-muted block">
              Your Answer:
            </span>
            <p className="text-sm font-mono text-ink dark:text-chalkboard-chalk whitespace-pre-wrap">
              {q.studentTextAnswer && q.studentTextAnswer.trim()
                ? q.studentTextAnswer
                : '— (No answer submitted)'}
            </p>
          </div>
          {q.acceptedAnswers && q.acceptedAnswers.length > 0 && (
            <div className="p-3.5 rounded-xl border-2 border-emerald-600/50 bg-emerald-50/70 dark:bg-emerald-950/30 space-y-1.5">
              <span className="text-xs font-mono font-bold uppercase text-emerald-800 dark:text-emerald-300 block">
                Accepted Answers:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {q.acceptedAnswers.map((ans, aIdx) => (
                  <span
                    key={aIdx}
                    className="px-2.5 py-0.5 rounded-lg bg-white dark:bg-chalkboard-card border border-emerald-600/40 text-xs font-mono text-ink dark:text-chalkboard-chalk"
                  >
                    {ans}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : qType === 'ESSAY' ? (
        <div className="space-y-3 pt-2">
          <div className="p-3.5 rounded-xl border border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-warm/50 dark:bg-chalkboard-surface/50 space-y-1">
            <span className="text-xs font-mono font-bold uppercase text-ink-muted dark:text-chalkboard-muted block">
              Your Essay Response:
            </span>
            <p className="text-sm text-ink dark:text-chalkboard-chalk whitespace-pre-wrap leading-relaxed">
              {q.studentTextAnswer && q.studentTextAnswer.trim()
                ? q.studentTextAnswer
                : '— (No response submitted)'}
            </p>
          </div>
          {isUngradedEssay ? (
            <div className="p-3.5 rounded-xl border-2 border-dashed border-amber-500/60 bg-amber-50/70 dark:bg-amber-950/30 flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-amber-700 dark:text-amber-300 shrink-0 mt-0.5" aria-hidden="true" />
              <div className="text-xs sm:text-sm text-amber-950 dark:text-amber-200">
                <span className="font-mono font-bold block">Awaiting teacher review</span>
                <span>
                  Rubric scores and model answer notes are hidden until your teacher finishes grading this essay.
                </span>
              </div>
            </div>
          ) : (
            q.rubricScores &&
            q.rubricScores.length > 0 && (
              <div className="p-3.5 rounded-xl border border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-card dark:bg-chalkboard-card space-y-2">
                <span className="text-xs font-mono font-bold uppercase text-ink-muted dark:text-chalkboard-muted block">
                  Rubric Score Breakdown:
                </span>
                <div className="space-y-1.5">
                  {q.rubricScores.map((rs) => (
                    <div
                      key={rs.criterionId}
                      className="flex items-center justify-between text-xs border-b border-ink/10 pb-1 last:border-b-0 last:pb-0"
                    >
                      <span className="font-medium text-ink dark:text-chalkboard-chalk">{rs.name}</span>
                      <span className="font-mono font-bold text-ink dark:text-chalkboard-chalk">
                        {rs.pointsAwarded} / {rs.maxPoints} pts
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )
          )}
        </div>
      ) : (
        <div className="space-y-2.5 pt-2">
          <span className="text-xs font-mono font-bold uppercase text-ink-muted dark:text-chalkboard-muted block">
            Answer Choices:
          </span>

          <div className="space-y-2">
            {q.choices.map((choice) => {
              const isStudentChoice = choice.id === q.studentChoiceId;
              const isCorrectChoice = choice.id === q.correctChoiceId;

              let rowStyle =
                'border border-ink/15 dark:border-chalkboard-borderSubtle bg-paper-warm/50 dark:bg-chalkboard-surface/50 opacity-80';

              if (isCorrectChoice) {
                rowStyle =
                  'border-2 border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 font-semibold shadow-xs';
              } else if (isStudentChoice && !isCorrectChoice) {
                rowStyle = 'border-2 border-redpen dark:border-red-500/60 bg-redpen-soft dark:bg-red-950/60 text-redpen-dark dark:text-red-300 font-semibold';
              }

              return (
                <div
                  key={choice.id}
                  className={`p-3 sm:p-3.5 rounded-xl flex items-start justify-between gap-3 text-sm sm:text-base ${rowStyle}`}
                >
                  <div className="flex items-start gap-2.5">
                    <span className="font-mono font-bold text-redpen">{choice.label})</span>
                    <span>{choice.text}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 flex-shrink-0 font-mono text-xs font-bold">
                    {isStudentChoice && (
                      <span className="px-2 py-0.5 rounded bg-ink/10 dark:bg-chalkboard-highlight text-ink dark:text-chalkboard-chalk">
                        Your Choice
                      </span>
                    )}
                    {isCorrectChoice && (
                      <span className="px-2 py-0.5 rounded bg-emerald-700 text-white flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                        Correct Choice
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Explanation Callout — Zero-Leakage: never shown for ungraded essays */}
      {!isUngradedEssay && q.explanation && (
        <div className="p-4 rounded-xl border-2 border-dashed border-ink/30 dark:border-chalkboard-borderSubtle bg-paper-warm dark:bg-chalkboard-surface space-y-1.5">
          <div className="flex items-center gap-2 font-mono text-xs font-bold text-redpen">
            <Lightbulb className="w-4 h-4" aria-hidden="true" />
            <span>Explanation & Concepts:</span>
          </div>
          <p className="text-xs sm:text-sm text-ink dark:text-chalkboard-chalk leading-relaxed">
            {q.explanation}
          </p>
        </div>
      )}
    </NotebookCard>
  );
}

export default function AttemptResult() {
  const { id, classId, subjectId } = useParams();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const validClassId = classId && classId !== 'undefined' && !isNaN(classId) ? classId : null;
  const validSubjectId = subjectId && subjectId !== 'undefined' && !isNaN(subjectId) ? subjectId : null;

  const workspaceUrl = validClassId
    ? `/student/classes/${validClassId}`
    : validSubjectId
    ? `/student/subjects/${validSubjectId}`
    : '/student';

  const progressUrl = validClassId
    ? `/student/classes/${validClassId}/progress`
    : validSubjectId
    ? `/student/subjects/${validSubjectId}/progress`
    : '/student/progress';

  const retakeUrl = (assessmentId) =>
    validClassId
      ? `/student/classes/${validClassId}/assessments/${assessmentId}/take`
      : validSubjectId
      ? `/student/subjects/${validSubjectId}/assessments/${assessmentId}/take`
      : `/student/assessments/${assessmentId}/take`;

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Two-step flow: start on clean Performance Scorecard, enter Review Mode on CTA click
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewFilter, setReviewFilter] = useState('all'); // 'all' | 'incorrect' | 'awaiting'
  const [viewMode, setViewMode] = useState('single'); // 'single' | 'all'
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    async function loadResult() {
      setLoading(true);
      setError('');
      try {
        const data = await studentService.getAttemptResult(id);
        setResult(data);
      } catch (err) {
        if (err.status === 401 || err.message?.includes('authentication is required')) {
          logout();
          navigate('/login', { replace: true });
          return;
        }
        setError(err.message || 'Could not load your assessment result.');
      } finally {
        setLoading(false);
      }
    }
    loadResult();
  }, [id]);

  const indexedReviews = useMemo(() => {
    if (!result?.questionReviews) return [];
    return result.questionReviews.map((q, idx) => ({
      ...q,
      originalNumber: idx + 1,
      outcome: getQuestionOutcome(q),
    }));
  }, [result]);

  const stats = useMemo(() => {
    let correct = 0;
    let incorrect = 0;
    let awaiting = 0;
    indexedReviews.forEach((q) => {
      if (q.outcome === 'awaiting') awaiting += 1;
      else if (q.outcome === 'correct' || q.outcome === 'graded') correct += 1;
      else incorrect += 1;
    });
    return { total: indexedReviews.length, correct, incorrect, awaiting };
  }, [indexedReviews]);

  const filteredReviews = useMemo(() => {
    if (reviewFilter === 'incorrect') {
      return indexedReviews.filter((q) => q.outcome === 'incorrect' || q.outcome === 'unanswered');
    }
    if (reviewFilter === 'awaiting') {
      return indexedReviews.filter((q) => q.outcome === 'awaiting');
    }
    return indexedReviews;
  }, [indexedReviews, reviewFilter]);

  // Clamp activeIndex when filter changes
  useEffect(() => {
    if (activeIndex >= filteredReviews.length) {
      setActiveIndex(0);
    }
  }, [filteredReviews.length, activeIndex]);

  // Keyboard ArrowLeft / ArrowRight navigation in Single Question mode
  useEffect(() => {
    if (!isReviewing || viewMode !== 'single' || filteredReviews.length <= 1) return;
    const handleKeyDown = (e) => {
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setActiveIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setActiveIndex((prev) => Math.min(filteredReviews.length - 1, prev + 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isReviewing, viewMode, filteredReviews.length]);

  const enterReviewMode = (filter = 'all') => {
    setReviewFilter(filter);
    setActiveIndex(0);
    setIsReviewing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePillClick = (idx, questionId) => {
    setActiveIndex(idx);
    if (viewMode === 'all') {
      const el = document.getElementById(`question-${questionId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-paper dark:bg-chalkboard flex flex-col items-center justify-center p-4">
        <NotebookLoader message="Grading your attempt and compiling topic review..." />
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-paper dark:bg-chalkboard flex flex-col items-center justify-center p-4">
        <NotebookCard className="max-w-md p-6 text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-redpen mx-auto" />
          <h2 className="text-xl font-bold text-ink dark:text-chalkboard-chalk">Result Error</h2>
          <p className="text-sm text-ink-muted dark:text-chalkboard-muted">{error || 'Result not found.'}</p>
          <Button variant="primary" onClick={() => navigate('/student')}>
            Return to Dashboard
          </Button>
        </NotebookCard>
      </div>
    );
  }

  const masteryStatus =
    result.percentage >= 80 ? 'STRENGTH' : result.percentage >= 60 ? 'DEVELOPING' : 'GAP';

  const scoreBadgeColor =
    result.percentage >= 80
      ? 'bg-highlighter-mint text-ink border-ink'
      : result.percentage >= 60
      ? 'bg-highlighter-yellow text-ink border-ink'
      : 'bg-redpen-soft dark:bg-red-950/60 text-redpen-dark dark:text-red-300 border-redpen dark:border-red-500/60';

  const feedbackNote = result.awaitingTeacherGrading
    ? `Your auto-graded items are scored. ${result.ungradedEssayCount} essay response${
        result.ungradedEssayCount === 1 ? ' is' : 's are'
      } awaiting teacher review and will update your final mastery once graded.`
    : masteryStatus === 'STRENGTH'
    ? 'Strong command of these concepts. Review any missed nuances or move on to your next priority topic.'
    : masteryStatus === 'DEVELOPING'
    ? 'Solid foundation with a few concepts to sharpen. Inspect the items you missed to push this topic into Strength.'
    : 'Several key concepts need reinforcement. Walk through each missed question and its explanation, then study the recommended topics.';

  const workspaceLabel = validClassId
    ? 'Return to Class Workspace'
    : validSubjectId
    ? 'Return to Subject Dashboard'
    : 'Return to My Desk';

  const activeQuestion = filteredReviews[activeIndex] || null;

  return (
    <PortalShell
      portalSubtitle="Student Diagnostic Review"
      user={user}
      onLogout={logout}
      badgeIcon={Award}
      badgeLabel="Assessment Results"
      badgeColorClass="bg-highlighter-yellow text-ink"
      title={result.assessmentTitle}
      subtitle={`Attempt completed on ${
        result.submittedAt
          ? new Date(result.submittedAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })
          : 'Recent'
      }`}
    >
      <div className="w-full space-y-6 pb-12">
        {/* Top Bar: Back */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          {isReviewing ? (
            <NotebookBackButton
              onClick={() => setIsReviewing(false)}
              label="Back to Scorecard"
            />
          ) : (
            <NotebookBackButton to={workspaceUrl} label={workspaceLabel} />
          )}
        </div>

        {!isReviewing ? (
          /* ================================================================
             STEP 1: CLEAN PERFORMANCE SCORECARD
             ================================================================ */
          <div className="space-y-6">
                <NotebookCard ruled marginLine lifted className="bg-paper-card dark:bg-chalkboard-card">
                  <div className="space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="space-y-2.5">
                        {result.subjectName && (
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2.5 py-1 rounded-md bg-paper-warm dark:bg-chalkboard-surface border border-ink/20 font-mono text-xs font-bold text-ink dark:text-chalkboard-chalk">
                              {result.subjectName}
                            </span>
                          </div>
                        )}

                        <div className="flex items-baseline gap-3">
                          <span className="text-4xl sm:text-5xl font-extrabold font-mono text-ink dark:text-chalkboard-chalk">
                            {result.score}
                          </span>
                          <span className="text-xl font-mono text-ink-muted dark:text-chalkboard-muted">
                            / {result.maxScore} pts
                          </span>
                        </div>

                        <p className="text-sm text-ink-muted dark:text-chalkboard-muted max-w-2xl leading-relaxed">
                          {feedbackNote}
                        </p>
                      </div>

                      <div
                        className={`px-5 py-3 rounded-xl font-mono text-3xl font-extrabold border-2 shadow-notebook text-center shrink-0 -rotate-2 ${scoreBadgeColor}`}
                        aria-label={`Score percentage: ${result.percentage}%`}
                      >
                        {result.percentage}%
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs font-mono py-3 border-y border-ink/15 dark:border-chalkboard-borderSubtle">
                      <span className="inline-flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                        {stats.correct} Correct
                      </span>
                      <span className="inline-flex items-center gap-1.5 font-bold text-redpen-dark dark:text-red-300">
                        <XCircle className="w-4 h-4 text-redpen" aria-hidden="true" />
                        {stats.incorrect} Incorrect
                      </span>
                      {stats.awaiting > 0 ? (
                        <span className="inline-flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300">
                          <Clock className="w-4 h-4 text-amber-600" aria-hidden="true" />
                          {stats.awaiting} Awaiting Grading
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 font-bold text-ink-muted dark:text-chalkboard-muted">
                          <BookOpen className="w-4 h-4" aria-hidden="true" />
                          {stats.total} Total Items
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                          <Button variant="primary" size="lg" onClick={() => enterReviewMode('all')}>
                            <span>Review Answers</span>
                            <ArrowRight className="w-4 h-4 ml-1" aria-hidden="true" />
                          </Button>
                          <div className="flex flex-wrap items-center gap-2.5">
                            <Button variant="ghost" onClick={() => navigate(retakeUrl(result.assessmentId))}>
                              <RotateCcw className="w-4 h-4 mr-1" aria-hidden="true" />
                              <span>Retake</span>
                            </Button>
                            <Button variant="secondary" onClick={() => navigate(progressUrl)}>
                              <span>Study Recommended Topics</span>
                            </Button>
                          </div>
                    </div>
                  </div>
                </NotebookCard>

            {/* Awaiting Teacher Grading Banner */}
            {result.awaitingTeacherGrading && (
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-500 text-amber-950 dark:text-amber-200 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
                <div className="text-xs sm:text-sm space-y-1">
                  <span className="font-bold block">
                    Awaiting teacher grading ({result.ungradedEssayCount} essay
                    {result.ungradedEssayCount === 1 ? '' : 's'})
                  </span>
                  <p className="leading-relaxed">
                    Your essay responses are waiting for your teacher to grade them. Ungraded essay points are excluded from your topic mastery calculation until graded, so you are not penalized while waiting.
                  </p>
                </div>
              </div>
            )}

          </div>
        ) : (
          /* ================================================================
             STEP 2: INTERACTIVE ANSWER REVIEW MODE
             ================================================================ */
          <div className="space-y-6">
            {/* Review Controls & Sticky Question Palette */}
            <NotebookCard className="p-4 sm:p-5 space-y-4 border-2 border-ink/20 dark:border-chalkboard-border shadow-notebook">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-ink/10 dark:border-chalkboard-borderSubtle pb-3">
                {/* Filter Pills */}
                <div
                  role="group"
                  aria-label="Filter question review"
                  className="inline-flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-paper-warm dark:bg-chalkboard-surface border border-ink/20 dark:border-chalkboard-borderSubtle self-start"
                >
                  <button
                    type="button"
                    aria-pressed={reviewFilter === 'all'}
                    onClick={() => {
                      setReviewFilter('all');
                      setActiveIndex(0);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-redpen ${
                      reviewFilter === 'all'
                        ? 'bg-paper-card dark:bg-chalkboard-card text-ink dark:text-chalkboard-chalk shadow-xs border border-ink/20'
                        : 'text-ink-muted dark:text-chalkboard-muted hover:text-ink'
                    }`}
                  >
                    All ({stats.total})
                  </button>
                  <button
                    type="button"
                    aria-pressed={reviewFilter === 'incorrect'}
                    onClick={() => {
                      setReviewFilter('incorrect');
                      setActiveIndex(0);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-redpen ${
                      reviewFilter === 'incorrect'
                        ? 'bg-paper-card dark:bg-chalkboard-card text-ink dark:text-chalkboard-chalk shadow-xs border border-ink/20'
                        : 'text-ink-muted dark:text-chalkboard-muted hover:text-ink'
                    }`}
                  >
                    Incorrect Only ({stats.incorrect})
                  </button>
                  {stats.awaiting > 0 && (
                    <button
                      type="button"
                      aria-pressed={reviewFilter === 'awaiting'}
                      onClick={() => {
                        setReviewFilter('awaiting');
                        setActiveIndex(0);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-redpen ${
                        reviewFilter === 'awaiting'
                          ? 'bg-paper-card dark:bg-chalkboard-card text-ink dark:text-chalkboard-chalk shadow-xs border border-ink/20'
                          : 'text-ink-muted dark:text-chalkboard-muted hover:text-ink'
                      }`}
                    >
                      Awaiting Grading ({stats.awaiting})
                    </button>
                  )}
                </div>

                {/* View Mode Toggle: Single Question vs Show All */}
                <div
                  role="group"
                  aria-label="Review layout mode"
                  className="inline-flex items-center gap-1 p-1 rounded-xl bg-paper-warm dark:bg-chalkboard-surface border border-ink/20 dark:border-chalkboard-borderSubtle self-start lg:self-auto"
                >
                  <button
                    type="button"
                    aria-pressed={viewMode === 'single'}
                    onClick={() => setViewMode('single')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-redpen ${
                      viewMode === 'single'
                        ? 'bg-paper-card dark:bg-chalkboard-card text-ink dark:text-chalkboard-chalk shadow-xs border border-ink/20'
                        : 'text-ink-muted dark:text-chalkboard-muted hover:text-ink'
                    }`}
                  >
                    <Square className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Single Question</span>
                  </button>
                  <button
                    type="button"
                    aria-pressed={viewMode === 'all'}
                    onClick={() => setViewMode('all')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-redpen ${
                      viewMode === 'all'
                        ? 'bg-paper-card dark:bg-chalkboard-card text-ink dark:text-chalkboard-chalk shadow-xs border border-ink/20'
                        : 'text-ink-muted dark:text-chalkboard-muted hover:text-ink'
                    }`}
                  >
                    <LayoutList className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Show All</span>
                  </button>
                </div>
              </div>

              {/* Numbered Question Palette */}
              {filteredReviews.length > 0 && (
                <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-mono text-ink-muted dark:text-chalkboard-muted">
                        <span>Question Palette — click a number to jump</span>
                        {viewMode === 'single' && (
                          <span className="hidden sm:inline">Tip: Use ← / → arrow keys</span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2" role="navigation" aria-label="Question jump palette">
                        {filteredReviews.map((q, idx) => {
                          const isActive = idx === activeIndex;
                          const isAwaiting = q.outcome === 'awaiting';
                          const isCorrect = q.outcome === 'correct' || q.outcome === 'graded';

                          const tileColors = isActive
                            ? isAwaiting
                              ? 'bg-amber-400 border-ink text-ink shadow-notebook-sm -translate-y-0.5'
                              : isCorrect
                              ? 'bg-emerald-600 border-ink text-white shadow-notebook-sm -translate-y-0.5'
                              : 'bg-redpen border-ink text-white shadow-notebook-sm -translate-y-0.5'
                            : isAwaiting
                            ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-500/70 text-amber-900 dark:text-amber-200 hover:border-amber-600'
                            : isCorrect
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-600/70 text-emerald-900 dark:text-emerald-200 hover:border-emerald-700'
                            : 'bg-redpen-soft dark:bg-red-950/50 border-redpen/70 text-redpen-dark dark:text-red-200 hover:border-redpen';

                          const outcomeLabel = isAwaiting
                            ? 'Awaiting teacher review'
                            : isCorrect
                            ? 'Correct'
                            : 'Incorrect';

                          return (
                            <button
                              key={q.questionId}
                              type="button"
                              onClick={() => handlePillClick(idx, q.questionId)}
                              aria-label={`Question ${q.originalNumber}: ${outcomeLabel}`}
                              aria-current={isActive ? 'step' : undefined}
                              className={`w-10 h-10 inline-flex items-center justify-center rounded-lg border-2 font-mono text-xs font-extrabold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-redpen ${tileColors}`}
                            >
                              {q.originalNumber}
                            </button>
                          );
                        })}
                      </div>
                </div>
              )}
            </NotebookCard>

            {/* Empty Filter State */}
            {filteredReviews.length === 0 ? (
              <NotebookCard className="p-8 text-center space-y-3">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" aria-hidden="true" />
                <p className="text-sm font-mono text-ink dark:text-chalkboard-chalk font-bold">
                  No questions match this filter.
                </p>
                <Button variant="secondary" size="sm" onClick={() => setReviewFilter('all')}>
                  Show All Questions ({stats.total})
                </Button>
              </NotebookCard>
            ) : viewMode === 'single' && activeQuestion ? (
              /* Single Question View */
              <div className="space-y-4">
                <QuestionReviewCard
                  q={activeQuestion}
                  questionNumber={activeQuestion.originalNumber}
                />

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <Button
                    variant="secondary"
                    disabled={activeIndex === 0}
                    onClick={() => setActiveIndex((prev) => Math.max(0, prev - 1))}
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" aria-hidden="true" />
                    <span>Previous Question</span>
                  </Button>

                  <span className="text-xs font-mono font-bold text-ink-muted dark:text-chalkboard-muted">
                    Showing {activeIndex + 1} of {filteredReviews.length}
                  </span>

                  <Button
                    variant="primary"
                    disabled={activeIndex >= filteredReviews.length - 1}
                    onClick={() =>
                      setActiveIndex((prev) => Math.min(filteredReviews.length - 1, prev + 1))
                    }
                  >
                    <span>Next Question</span>
                    <ArrowRight className="w-4 h-4 ml-1" aria-hidden="true" />
                  </Button>
                </div>
              </div>
            ) : (
              /* Show All View */
              <div className="space-y-6">
                {filteredReviews.map((q) => (
                  <QuestionReviewCard
                    key={q.questionId}
                    q={q}
                    questionNumber={q.originalNumber}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </PortalShell>
  );
}
