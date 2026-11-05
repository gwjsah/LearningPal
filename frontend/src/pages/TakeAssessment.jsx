import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  RefreshCw,
  Send,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { studentService } from '../services/studentService';
import { Button, NotebookCard, PortalShell } from '../components/NotebookPrimitives';

export default function TakeAssessment() {
  const { id, subjectId } = useParams();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const validSubjectId =
    subjectId && subjectId !== 'undefined' && !isNaN(subjectId)
      ? subjectId
      : null;

  const [attemptData, setAttemptData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Current question index in questions array (0-based)
  const [currentIndex, setCurrentIndex] = useState(0);

  // Selected answers: map of questionId -> selectedChoiceId
  const [answers, setAnswers] = useState({});

  // Submit modal / confirmation state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    async function start() {
      setLoading(true);
      setError('');
      try {
        const data = await studentService.startAttempt(id);
        setAttemptData(data);
      } catch (err) {
        if (err.status === 401 || err.message?.includes('authentication is required')) {
          logout();
          navigate('/login', { replace: true });
          return;
        }
        setError(err.message || 'Failed to start or resume assessment.');
      } finally {
        setLoading(false);
      }
    }
    start();
  }, [id]);

  const questions = attemptData?.questions || [];
  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;

  const handleSelectChoice = (questionId, choiceId) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: choiceId,
    }));
  };

  const answeredCount = Object.keys(answers).length;
  const unansweredCount = totalQuestions - answeredCount;
  const progressPercent = totalQuestions > 0 ? Math.round(((currentIndex + 1) / totalQuestions) * 100) : 0;

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError('');

    try {
      const payload = Object.entries(answers).map(([qId, cId]) => ({
        questionId: Number(qId),
        selectedChoiceId: cId,
      }));

      const response = await studentService.submitAttempt(attemptData.attemptId, payload);
      const target = validSubjectId
        ? `/student/subjects/${validSubjectId}/attempts/${response.attemptId}/result`
        : `/student/attempts/${response.attemptId}/result`;
      navigate(target, { replace: true });
    } catch (err) {
      if (err.status === 401 || err.message?.includes('authentication is required')) {
        logout();
        navigate('/login', { replace: true });
        return;
      }
      setSubmitError(err.message || 'Submission failed. Please try again.');
      setSubmitting(false);
    }
  };

  // Helper to detect if question text contains code block snippet
  const renderFormattedQuestion = (text) => {
    if (!text) return null;
    const parts = text.split('\n\n');

    return (
      <div className="space-y-4">
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
                className="p-4 rounded-xl font-mono text-sm sm:text-base bg-paper-warm dark:bg-chalkboard-surface border border-ink/20 dark:border-chalkboard-borderSubtle whitespace-pre-wrap overflow-x-auto text-ink dark:text-chalkboard-chalk shadow-inner"
              >
                <code>{part}</code>
              </pre>
            );
          }

          return (
            <p
              key={idx}
              className="text-lg sm:text-xl font-medium text-ink dark:text-chalkboard-chalk leading-relaxed"
            >
              {part}
            </p>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-paper dark:bg-chalkboard flex flex-col items-center justify-center space-y-4 p-4">
        <RefreshCw className="w-8 h-8 animate-spin text-redpen" />
        <p className="font-hand text-2xl text-ink dark:text-chalkboard-chalk">
          Setting up your test booklet...
        </p>
      </div>
    );
  }

  if (error || !currentQuestion) {
    return (
      <div className="min-h-screen bg-paper dark:bg-chalkboard flex flex-col items-center justify-center p-4">
        <NotebookCard className="max-w-md p-6 text-center space-y-4">
          <AlertTriangle className="w-10 h-10 text-redpen mx-auto" />
          <h2 className="text-xl font-bold text-ink dark:text-chalkboard-chalk">Assessment Notice</h2>
          <p className="text-sm text-ink-muted dark:text-chalkboard-muted">{error || 'No questions available.'}</p>
          <Button variant="primary" onClick={() => navigate('/student')}>
            Return to Dashboard
          </Button>
        </NotebookCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper dark:bg-chalkboard text-ink dark:text-chalkboard-chalk flex flex-col justify-between font-sans">
      {/* Header bar */}
      <header className="sticky top-0 z-30 bg-paper/95 dark:bg-chalkboard/95 backdrop-blur-md border-b-2 border-ink/15 dark:border-chalkboard-borderSubtle shadow-sm transition-colors">
        <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to={validSubjectId ? `/student/subjects/${validSubjectId}` : '/student'}
              className="p-1.5 rounded-lg border border-ink/20 dark:border-chalkboard-borderSubtle hover:bg-paper-warm dark:hover:bg-chalkboard-surface transition-colors"
              title="Exit test and return to dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="font-bold text-sm sm:text-base leading-tight truncate max-w-[200px] sm:max-w-md">
                {attemptData.assessmentTitle}
              </h1>
              <span className="text-[11px] font-mono text-ink-muted dark:text-chalkboard-muted">
                Question {currentIndex + 1} of {totalQuestions}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="mint"
              size="sm"
              onClick={() => setShowConfirmModal(true)}
              className="text-xs font-bold"
            >
              <Send className="w-3.5 h-3.5 mr-1" />
              Finish & Submit
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-paper-warm dark:bg-chalkboard-surface h-1.5 mt-2 rounded-full overflow-hidden">
          <div
            className="bg-redpen h-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </header>

      {/* Main question workspace */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1 space-y-6">
        {/* Question Navigator Pills */}
        <div className="p-3 bg-paper-card dark:bg-chalkboard-card rounded-xl border border-ink/15 dark:border-chalkboard-borderSubtle">
          <div className="flex items-center justify-between mb-2 text-xs font-mono">
            <span className="font-bold text-ink-muted dark:text-chalkboard-muted uppercase">
              Question Navigator
            </span>
            <span className="text-ink-muted dark:text-chalkboard-muted">
              {answeredCount} of {totalQuestions} answered
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {questions.map((q, idx) => {
              const isAnswered = answers[q.id] != null;
              const isCurrent = idx === currentIndex;

              let pillStyle =
                'border border-ink/20 text-ink-muted dark:text-chalkboard-muted bg-paper-warm dark:bg-chalkboard-surface';
              if (isAnswered) {
                pillStyle =
                  'border-2 border-ink bg-highlighter-mint text-ink font-bold shadow-notebook-sm';
              }
              if (isCurrent) {
                pillStyle =
                  'border-2 border-redpen bg-redpen text-white font-extrabold shadow-notebook-sm ring-2 ring-redpen/30';
              }

              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-9 h-9 rounded-lg text-xs font-mono transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-redpen cursor-pointer ${pillStyle}`}
                  aria-label={`Jump to question ${idx + 1}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Question Card */}
        <NotebookCard pattern="ruled" borderStyle="margin" className="p-6 sm:p-8 space-y-6">
          {/* Topic header */}
          <div className="flex items-center justify-between text-xs font-mono border-b border-ink/10 dark:border-chalkboard-borderSubtle pb-3">
            <span className="px-2.5 py-1 rounded-md bg-highlighter-yellow/30 text-ink font-bold border border-ink/20">
              Topic: {currentQuestion.topicName}
            </span>
            <span className="text-ink-muted dark:text-chalkboard-muted">
              Worth {currentQuestion.points || 1.0} pt
            </span>
          </div>

          {/* Formatted Question Text */}
          {renderFormattedQuestion(currentQuestion.text)}

          {/* Choices Radio Group */}
          <div className="space-y-3 pt-4 border-t border-ink/10 dark:border-chalkboard-borderSubtle">
            <span className="text-xs font-mono font-bold text-ink-muted dark:text-chalkboard-muted uppercase block">
              Choose the best answer:
            </span>

            <div role="radiogroup" aria-label="Multiple choice options" className="space-y-2.5">
              {currentQuestion.choices.map((choice) => {
                const isSelected = answers[currentQuestion.id] === choice.id;

                return (
                  <label
                    key={choice.id}
                    className={`flex items-start gap-3.5 p-4 rounded-xl border-2 transition-all cursor-pointer select-none ${
                      isSelected
                        ? 'border-ink dark:border-chalkboard-borderStrong bg-highlighter-yellow/40 dark:bg-chalkboard-surface shadow-notebook-sm font-semibold'
                        : 'border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-card dark:bg-chalkboard-card hover:bg-paper-warm dark:hover:bg-chalkboard-surface'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${currentQuestion.id}`}
                      value={choice.id}
                      checked={isSelected}
                      onChange={() => handleSelectChoice(currentQuestion.id, choice.id)}
                      className="mt-1 w-4 h-4 text-redpen focus:ring-redpen"
                    />
                    <div className="flex-1 text-sm sm:text-base leading-relaxed">
                      <span className="font-mono font-bold text-redpen mr-2">
                        {choice.label})
                      </span>
                      <span>{choice.text}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        </NotebookCard>
      </main>

      {/* Footer Navigation Bar */}
      <footer className="sticky bottom-0 z-30 bg-paper-card dark:bg-chalkboard-card border-t-2 border-ink dark:border-chalkboard-borderSubtle px-4 sm:px-8 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Button
            variant="secondary"
            size="md"
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Previous
          </Button>

          <span className="text-xs font-mono text-ink-muted dark:text-chalkboard-muted hidden sm:inline">
            Use Previous / Next or the Navigator pills above
          </span>

          {currentIndex < totalQuestions - 1 ? (
            <Button
              variant="primary"
              size="md"
              onClick={() => setCurrentIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
            >
              Next
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          ) : (
            <Button
              variant="mint"
              size="md"
              onClick={() => setShowConfirmModal(true)}
            >
              Review & Submit
              <Send className="w-4 h-4 ml-1.5" />
            </Button>
          )}
        </div>
      </footer>

      {/* Submit Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-xs">
          <NotebookCard
            pattern="grid"
            className="max-w-md w-full p-6 sm:p-8 space-y-5 bg-paper-card dark:bg-chalkboard-card border-2 border-ink dark:border-chalkboard-border shadow-notebook-lg"
          >
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-bold text-ink dark:text-chalkboard-chalk">
                Ready to submit?
              </h3>
              <p className="text-xs sm:text-sm text-ink-muted dark:text-chalkboard-muted">
                Your answers will be finalized and auto-graded immediately.
              </p>
            </div>

            {/* Answer tally stats */}
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 rounded-xl bg-highlighter-mint/40 border border-ink/20">
                <span className="block text-2xl font-mono font-bold text-ink">{answeredCount}</span>
                <span className="text-xs text-ink-muted">Answered</span>
              </div>
              <div className={`p-3 rounded-xl border ${
                unansweredCount > 0
                  ? 'bg-redpen-soft border-redpen text-redpen-dark'
                  : 'bg-paper-warm border-ink/20'
              }`}>
                <span className="block text-2xl font-mono font-bold">{unansweredCount}</span>
                <span className="text-xs">Unanswered</span>
              </div>
            </div>

            {/* Unanswered warning banner */}
            {unansweredCount > 0 && (
              <div className="p-3.5 rounded-xl border-2 border-amber-600 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 flex items-start gap-2.5 text-xs sm:text-sm">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-600 mt-0.5" />
                <p>
                  You have <strong className="font-bold">{unansweredCount} unanswered questions</strong>.
                  Unanswered questions receive zero points.
                </p>
              </div>
            )}

            {submitError && (
              <div className="p-3 rounded-lg bg-redpen-soft border border-redpen text-redpen-dark text-xs">
                {submitError}
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="secondary"
                size="md"
                className="flex-1"
                disabled={submitting}
                onClick={() => setShowConfirmModal(false)}
              >
                Return to Quiz
              </Button>
              <Button
                variant="primary"
                size="md"
                className="flex-1"
                disabled={submitting}
                onClick={handleSubmit}
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin mr-1.5" />
                    Grading...
                  </>
                ) : (
                  'Confirm & Submit'
                )}
              </Button>
            </div>
          </NotebookCard>
        </div>
      )}
    </div>
  );
}

