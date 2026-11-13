import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Award,
  CheckCircle2,
  XCircle,
  MinusCircle,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  BookOpen,
  Lightbulb,
  AlertCircle,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { studentService } from '../services/studentService';
import { Button, NotebookCard, PortalShell } from '../components/NotebookPrimitives';

export default function AttemptResult() {
  const { id, subjectId } = useParams();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const validSubjectId =
    subjectId && subjectId !== 'undefined' && !isNaN(subjectId)
      ? subjectId
      : null;

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  if (loading) {
    return (
      <div className="min-h-screen bg-paper dark:bg-chalkboard flex flex-col items-center justify-center space-y-4 p-4">
        <RefreshCw className="w-8 h-8 animate-spin text-redpen" />
        <p className="font-hand text-2xl text-ink dark:text-chalkboard-chalk">
          Grading your attempt and compiling topic review...
        </p>
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

  // Format question text with code snippets
  const renderFormattedText = (text) => {
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
            <p key={idx} className="text-base sm:text-lg font-medium text-ink dark:text-chalkboard-chalk leading-relaxed">
              {part}
            </p>
          );
        })}
      </div>
    );
  };

  const scoreBadgeColor =
    result.percentage >= 80
      ? 'bg-highlighter-mint text-ink border-ink'
      : result.percentage >= 60
      ? 'bg-highlighter-yellow text-ink border-ink'
      : 'bg-redpen-soft text-redpen-dark border-redpen';

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
      <div className="w-full space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between text-xs font-mono">
          <Link
            to={validSubjectId ? `/student/subjects/${validSubjectId}` : '/student'}
            className="inline-flex items-center gap-1.5 text-ink-muted dark:text-chalkboard-muted hover:text-ink dark:hover:text-chalkboard-chalk transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-redpen rounded"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{validSubjectId ? 'Back to Subject Dashboard' : 'Back to My Desk'}</span>
          </Link>
          <div className="flex items-center gap-1.5 text-ink-muted dark:text-chalkboard-muted">
            <Link to="/student" className="hover:underline">My Classes</Link>
            {validSubjectId && (
              <>
                <span>/</span>
                <Link to={`/student/subjects/${validSubjectId}`} className="hover:underline">Subject #{validSubjectId}</Link>
              </>
            )}
            <span>/</span>
            <span className="font-bold text-ink dark:text-chalkboard-chalk">Result Review</span>
          </div>
        </div>

        {/* 1. Score Summary Banner */}
        <NotebookCard pattern="grid" borderStyle="sketch" className="p-6 sm:p-8 bg-paper-card dark:bg-chalkboard-card">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center sm:text-left">
              <span className="text-xs font-mono uppercase text-ink-muted dark:text-chalkboard-muted tracking-wider block">
                Final Score Card
              </span>
              <div className="flex items-baseline gap-3 justify-center sm:justify-start">
                <span className="text-4xl sm:text-5xl font-extrabold font-mono text-ink dark:text-chalkboard-chalk">
                  {result.score}
                </span>
                <span className="text-2xl font-mono text-ink-muted dark:text-chalkboard-muted">
                  / {result.maxScore} pts
                </span>
              </div>
              <p className="text-sm text-ink-muted dark:text-chalkboard-muted">
                Review your topic performance below to see which concepts need reinforcement.
              </p>
            </div>

            <div className="flex flex-col items-center gap-3">
              <div
                className={`px-5 py-3 rounded-2xl font-mono text-2xl font-extrabold border-2 shadow-notebook-sm text-center ${scoreBadgeColor}`}
              >
                {result.percentage}%
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate(validSubjectId ? `/student/subjects/${validSubjectId}` : '/student')}
                >
                  <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                  {validSubjectId ? 'Subject' : 'Dashboard'}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() =>
                    navigate(
                      validSubjectId
                        ? `/student/subjects/${validSubjectId}/assessments/${result.assessmentId}/take`
                        : `/student/assessments/${result.assessmentId}/take`
                    )
                  }
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1" />
                  Retake
                </Button>
              </div>
            </div>
          </div>
        </NotebookCard>

        {/* Awaiting Teacher Grading Banner */}
        {result.awaitingTeacherGrading && (
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-500 text-amber-950 dark:text-amber-200 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm space-y-1">
              <span className="font-bold block">
                Awaiting teacher grading ({result.ungradedEssayCount} essay{result.ungradedEssayCount === 1 ? '' : 's'})
              </span>
              <p className="leading-relaxed">
                Your essay responses are waiting for your teacher to grade them. Ungraded essay points are excluded from your topic mastery calculation until graded, so you are not penalized while waiting.
              </p>
            </div>
          </div>
        )}

        {/* Diagnostic Progress Updated Notice */}
        <div className="p-4 rounded-xl bg-highlighter-mint/30 border border-emerald-600/30 dark:border-emerald-400/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-ink dark:text-chalkboard-chalk">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-700 dark:text-emerald-400 flex-shrink-0" />
            <span className="text-sm font-medium">
              Your conceptual progress was updated with this attempt.
            </span>
          </div>
          <Link
            to={validSubjectId ? `/student/subjects/${validSubjectId}/progress` : '/student/progress'}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-mono font-bold text-emerald-800 dark:text-emerald-300 hover:text-ink dark:hover:text-chalkboard-chalk underline underline-offset-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-redpen rounded"
          >
            <span>View Progress Breakdown</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* 2. Topic Breakdown Section */}
        {result.topicBreakdowns?.length > 0 && (
          <NotebookCard pattern="ruled" className="p-6 sm:p-8 space-y-5">
            <div className="border-b border-ink/10 dark:border-chalkboard-borderSubtle pb-3">
              <h2 className="text-xl font-bold text-ink dark:text-chalkboard-chalk">
                Topic Breakdown
              </h2>
              <p className="text-xs text-ink-muted dark:text-chalkboard-muted">
                Plain question count correct vs total per syllabus topic.
              </p>
            </div>

            <div className="space-y-4">
              {result.topicBreakdowns.map((tb) => {
                const percent =
                  tb.totalCount > 0 ? Math.round((tb.correctCount / tb.totalCount) * 100) : 0;
                const isSolid = percent >= 80;
                const isFair = percent >= 60 && percent < 80;

                const barColor = isSolid ? 'bg-emerald-600' : isFair ? 'bg-amber-500' : 'bg-redpen';
                const labelColor = isSolid
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : isFair
                  ? 'text-amber-700 dark:text-amber-400'
                  : 'text-redpen dark:text-redpen-soft';

                return (
                  <div key={tb.topicName} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs sm:text-sm font-mono">
                      <span className="font-bold text-ink dark:text-chalkboard-chalk">
                        {tb.topicName}
                      </span>
                      <span className={`font-bold ${labelColor}`}>
                        {tb.correctCount} / {tb.totalCount} correct ({percent}%)
                      </span>
                    </div>

                    <div className="w-full h-3 rounded-full bg-paper-warm dark:bg-chalkboard-surface border border-ink/15 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${barColor}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </NotebookCard>
        )}

        {/* 3. Question-by-Question Review List */}
        <div className="space-y-6">
          <div className="border-b-2 border-ink dark:border-chalkboard-borderSubtle pb-2">
            <h2 className="text-2xl font-bold text-ink dark:text-chalkboard-chalk">
              Question-by-Question Review
            </h2>
            <p className="text-xs sm:text-sm text-ink-muted dark:text-chalkboard-muted">
              Inspect your answers against correct choices with technical explanations.
            </p>
          </div>

          <div className="space-y-6">
            {result.questionReviews.map((q, idx) => {
              const qType = q.type || 'MULTIPLE_CHOICE';
              const wasAnswered =
                qType === 'MULTIPLE_CHOICE'
                  ? q.studentChoiceId != null
                  : q.studentTextAnswer != null && q.studentTextAnswer.trim().length > 0;
              const isCorrect = q.isCorrect;

              let statusBadge = (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono font-bold border-2 border-emerald-700 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                  Correct (+{q.pointsEarned} pt)
                </span>
              );

              if (qType === 'ESSAY' && !q.graded) {
                statusBadge = (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono font-bold border-2 border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                    Awaiting teacher grading ({q.pointsPossible} pts)
                  </span>
                );
              } else if (qType === 'ESSAY' && q.graded) {
                statusBadge = (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono font-bold border-2 border-emerald-700 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                    Graded ({q.pointsEarned} / {q.pointsPossible} pt)
                  </span>
                );
              } else if (!wasAnswered) {
                statusBadge = (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono font-bold border-2 border-ink/40 bg-paper-warm dark:bg-chalkboard-surface text-ink-muted">
                    <MinusCircle className="w-3.5 h-3.5 text-ink-muted" />
                    Unanswered (0.0 / {q.pointsPossible} pt)
                  </span>
                );
              } else if (!isCorrect) {
                statusBadge = (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono font-bold border-2 border-redpen bg-redpen-soft text-redpen-dark">
                    <XCircle className="w-3.5 h-3.5 text-redpen" />
                    Incorrect (0.0 / {q.pointsPossible} pt)
                  </span>
                );
              }

              return (
                <NotebookCard
                  key={q.questionId}
                  pattern="ruled"
                  borderStyle="margin"
                  className="p-6 sm:p-7 space-y-5"
                >
                  {/* Question header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink/10 dark:border-chalkboard-borderSubtle pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-ink-muted dark:text-chalkboard-muted">
                        Question {idx + 1}
                      </span>
                      <span>•</span>
                      <span className="px-2 py-0.5 rounded bg-highlighter-yellow/30 text-ink font-mono text-xs font-bold border border-ink/20">
                        {q.topicName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {q.adjusted && qType !== 'ESSAY' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono font-bold border-2 border-amber-600 bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200">
                          <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                          Adjusted by your teacher ({q.pointsEarned} / {q.pointsPossible} pt)
                        </span>
                      ) : (
                        statusBadge
                      )}
                    </div>
                  </div>

                  {/* Instructor Feedback on Adjusted Answer */}
                  {q.teacherComment && (
                    <div className="p-3.5 rounded-xl border-2 border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 space-y-1">
                      <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-amber-900 dark:text-amber-200">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
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
                          {q.studentTextAnswer && q.studentTextAnswer.trim() ? q.studentTextAnswer : '— (No answer submitted)'}
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
                          {q.studentTextAnswer && q.studentTextAnswer.trim() ? q.studentTextAnswer : '— (No response submitted)'}
                        </p>
                      </div>
                      {q.graded && q.rubricScores && q.rubricScores.length > 0 && (
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
                            rowStyle =
                              'border-2 border-redpen bg-redpen-soft text-redpen-dark font-semibold';
                          }

                          return (
                            <div
                              key={choice.id}
                              className={`p-3 sm:p-3.5 rounded-xl flex items-start justify-between gap-3 text-sm sm:text-base ${rowStyle}`}
                            >
                              <div className="flex items-start gap-2.5">
                                <span className="font-mono font-bold text-redpen">
                                  {choice.label})
                                </span>
                                <span>{choice.text}</span>
                              </div>

                              <div className="flex items-center gap-1.5 flex-shrink-0 font-mono text-xs font-bold">
                                {isStudentChoice && (
                                  <span className="px-2 py-0.5 rounded bg-ink/10 dark:bg-chalkboard-highlight text-ink dark:text-chalkboard-chalk">
                                    Your Choice
                                  </span>
                                )}
                                {isCorrectChoice && (
                                  <span className="px-2 py-0.5 rounded bg-emerald-700 text-white flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" />
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

                  {/* Explanation Callout */}
                  {q.explanation && (
                    <div className="p-4 rounded-xl border-2 border-dashed border-ink/30 dark:border-chalkboard-borderSubtle bg-paper-warm dark:bg-chalkboard-surface space-y-1.5">
                      <div className="flex items-center gap-2 font-mono text-xs font-bold text-redpen">
                        <Lightbulb className="w-4 h-4" />
                        <span>Explanation & Concepts:</span>
                      </div>
                      <p className="text-xs sm:text-sm text-ink dark:text-chalkboard-chalk leading-relaxed">
                        {q.explanation}
                      </p>
                    </div>
                  )}
                </NotebookCard>
              );
            })}
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="flex items-center justify-between pt-6 border-t-2 border-ink dark:border-chalkboard-borderSubtle">
          <Button variant="secondary" size="md" onClick={() => navigate(validSubjectId ? `/student/subjects/${validSubjectId}` : '/student')}>
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            {validSubjectId ? 'Back to Dashboard' : 'Back to My Classes'}
          </Button>

          <Button
            variant="mint"
            size="md"
            onClick={() =>
              navigate(
                validSubjectId
                  ? `/student/subjects/${validSubjectId}/assessments/${result.assessmentId}/take`
                  : `/student/assessments/${result.assessmentId}/take`
              )
            }
          >
            <RotateCcw className="w-4 h-4 mr-1.5" />
            Retake Quiz
          </Button>
        </div>
      </div>
    </PortalShell>
  );
}

