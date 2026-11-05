import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Sparkles,
  AlertCircle,
  Lightbulb,
  Clock,
  RotateCcw,
  Save,
  HelpCircle,
  Award,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { teacherService } from '../services/teacherService';
import { Button, NotebookCard, PortalShell } from '../components/NotebookPrimitives';

export default function TeacherAttemptReview() {
  const { classId, studentId, attemptId } = useParams();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Per-answer edit state: { [answerId]: { teacherScore: string, comment: string, saving: boolean, error: string } }
  const [editForms, setEditForms] = useState({});
  const [globalNotice, setGlobalNotice] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await teacherService.getAttemptReview(classId, attemptId);
      setReview(data);

      const forms = {};
      data.answers.forEach((ans) => {
        forms[ans.answerId] = {
          teacherScore: ans.teacherScore != null ? String(ans.teacherScore) : '',
          comment: ans.teacherComment || '',
          saving: false,
          error: '',
        };
      });
      setEditForms(forms);
    } catch (err) {
      if (err.status === 401) {
        logout();
        navigate('/login', { replace: true });
        return;
      }
      if (err.status === 404) {
        setError('Attempt not found. Make sure this attempt belongs to your assigned class.');
        return;
      }
      setError(err.message || 'Failed to load attempt review.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [classId, attemptId]);

  const handleScoreChange = (answerId, val) => {
    setEditForms((prev) => ({
      ...prev,
      [answerId]: { ...prev[answerId], teacherScore: val, error: '' },
    }));
  };

  const handleCommentChange = (answerId, val) => {
    setEditForms((prev) => ({
      ...prev,
      [answerId]: { ...prev[answerId], comment: val, error: '' },
    }));
  };

  const handleSaveGrade = async (ans, isRevert = false) => {
    const form = editForms[ans.answerId];
    if (!form) return;

    let parsedScore = null;
    if (!isRevert) {
      if (form.teacherScore === '' || form.teacherScore == null) {
        setEditForms((prev) => ({
          ...prev,
          [ans.answerId]: { ...prev[ans.answerId], error: 'Please enter a valid score or click "Revert to Auto".' },
        }));
        return;
      }
      parsedScore = parseFloat(form.teacherScore);
      if (isNaN(parsedScore) || parsedScore < 0 || parsedScore > ans.pointsPossible) {
        setEditForms((prev) => ({
          ...prev,
          [ans.answerId]: {
            ...prev[ans.answerId],
            error: `Score must be between 0.0 and ${ans.pointsPossible}.`,
          },
        }));
        return;
      }
      // Check 2 decimal places
      const parts = form.teacherScore.split('.');
      if (parts.length > 1 && parts[1].length > 2) {
        setEditForms((prev) => ({
          ...prev,
          [ans.answerId]: { ...prev[ans.answerId], error: 'Maximum 2 decimal places allowed.' },
        }));
        return;
      }
    }

    setEditForms((prev) => ({
      ...prev,
      [ans.answerId]: { ...prev[ans.answerId], saving: true, error: '' },
    }));

    try {
      const payload = {
        teacherScore: isRevert ? null : parsedScore,
        teacherComment: form.comment ? form.comment.trim() : null,
      };

      const res = await teacherService.gradeAnswer(classId, attemptId, ans.answerId, payload);

      // Update attempt total and answers list in local state
      setReview((prev) => {
        if (!prev) return prev;
        const updatedAnswers = prev.answers.map((a) =>
          a.answerId === ans.answerId ? res.answer : a
        );
        return {
          ...prev,
          totalScore: res.newAttemptTotalScore,
          percentage: res.newAttemptPercentage,
          answers: updatedAnswers,
        };
      });

      setEditForms((prev) => ({
        ...prev,
        [ans.answerId]: {
          teacherScore: res.answer.teacherScore != null ? String(res.answer.teacherScore) : '',
          comment: res.answer.teacherComment || '',
          saving: false,
          error: '',
        },
      }));

      const actionText = isRevert ? 'reverted to auto-grade' : 'saved';
      setGlobalNotice(
        `Grade ${actionText} successfully! Total score is now ${res.newAttemptTotalScore} / ${review?.maxScore} (${res.newAttemptPercentage}%). Topic mastery for "${res.affectedTopicName}" was automatically recalculated.`
      );
      setTimeout(() => setGlobalNotice(''), 6000);
    } catch (err) {
      setEditForms((prev) => ({
        ...prev,
        [ans.answerId]: {
          ...prev[ans.answerId],
          saving: false,
          error: err.message || 'Failed to save grade override.',
        },
      }));
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return '—';
    return new Date(isoString).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <PortalShell
      role="TEACHER"
      portalName="LearningPal Teacher"
      portalSubtitle="Student Attempt Review & Manual Grade Override"
      badgeLabel="Gradebook Review"
    >
      <div className="space-y-6 max-w-5xl mx-auto pb-12">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-mono text-ink-muted dark:text-chalkboard-muted">
          <Link
            to={`/teacher/classes/${classId}`}
            className="hover:text-redpen underline transition-colors"
          >
            Class Overview
          </Link>
          <span>/</span>
          <Link
            to={`/teacher/classes/${classId}/students/${studentId}`}
            className="hover:text-redpen underline transition-colors"
          >
            Student Progress
          </Link>
          <span>/</span>
          <span className="text-ink dark:text-chalkboard-chalk font-bold">Attempt Review</span>
        </div>

        {/* Global Notice */}
        {globalNotice && (
          <div
            role="status"
            className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-500 rounded-xl text-emerald-900 dark:text-emerald-200 text-xs font-mono flex items-start gap-2 shadow-notebook-sm"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold block">Progress was recalculated</span>
              <span>{globalNotice}</span>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <NotebookCard className="p-12 text-center text-xs font-mono text-ink-muted dark:text-chalkboard-muted space-y-3">
            <div className="inline-block animate-spin w-6 h-6 border-2 border-redpen border-t-transparent rounded-full" />
            <p>Loading attempt review & answers…</p>
          </NotebookCard>
        )}

        {/* Error State */}
        {error && !loading && (
          <NotebookCard className="p-8 text-center text-redpen space-y-4">
            <AlertCircle className="w-8 h-8 mx-auto" />
            <p className="text-sm font-mono">{error}</p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate(`/teacher/classes/${classId}/students/${studentId}`)}
            >
              Back to Student Detail
            </Button>
          </NotebookCard>
        )}

        {/* Main Content */}
        {review && !loading && (
          <>
            {/* Attempt Overview Card */}
            <NotebookCard className="p-6 border-3 border-ink/20 dark:border-chalkboard-border shadow-notebook space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-ink/10 dark:border-chalkboard-borderSubtle pb-4">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-ink dark:text-chalkboard-chalk">
                    {review.assessmentTitle}
                  </h1>
                  <p className="text-xs text-ink-muted dark:text-chalkboard-muted font-mono mt-0.5">
                    Student: <strong className="text-ink dark:text-chalkboard-chalk">{review.studentName}</strong> ({review.studentEmail}) • Class: {review.className}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate(`/teacher/classes/${classId}/students/${studentId}`)}
                  >
                    <ArrowLeft className="w-4 h-4 mr-1.5" />
                    Back to Student
                  </Button>
                </div>
              </div>

              {/* Score summary tiles */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl border border-ink/15 dark:border-chalkboard-borderSubtle bg-paper-warm/50 dark:bg-chalkboard-surface/50">
                  <span className="text-[10px] font-mono uppercase text-ink-muted block">Total Score</span>
                  <span className="text-xl sm:text-2xl font-bold font-mono text-ink dark:text-chalkboard-chalk">
                    {review.totalScore} / {review.maxScore}
                  </span>
                </div>

                <div className="p-3 rounded-xl border border-ink/15 dark:border-chalkboard-borderSubtle bg-paper-warm/50 dark:bg-chalkboard-surface/50">
                  <span className="text-[10px] font-mono uppercase text-ink-muted block">Score Percent</span>
                  <span className="text-xl sm:text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-400">
                    {review.percentage}%
                  </span>
                </div>

                <div className="p-3 rounded-xl border border-ink/15 dark:border-chalkboard-borderSubtle bg-paper-warm/50 dark:bg-chalkboard-surface/50">
                  <span className="text-[10px] font-mono uppercase text-ink-muted block">Attempt Status</span>
                  <span className="text-xs font-mono font-bold text-ink dark:text-chalkboard-chalk mt-1 block">
                    {review.status}
                  </span>
                </div>

                <div className="p-3 rounded-xl border border-ink/15 dark:border-chalkboard-borderSubtle bg-paper-warm/50 dark:bg-chalkboard-surface/50">
                  <span className="text-[10px] font-mono uppercase text-ink-muted block">Submitted Date</span>
                  <span className="text-xs font-mono text-ink-muted dark:text-chalkboard-muted mt-1 block">
                    {formatDate(review.submittedAt)}
                  </span>
                </div>
              </div>
            </NotebookCard>

            {/* Questions & Grading Forms */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-ink dark:text-chalkboard-chalk">
                  Question Responses ({review.answers.length} items)
                </h2>
                <span className="text-xs font-mono text-ink-muted dark:text-chalkboard-muted">
                  Overrides automatically recalculate student topic mastery
                </span>
              </div>

              {review.answers.map((ans, idx) => {
                const form = editForms[ans.answerId] || {};
                const isCorrect = ans.correctChoiceId != null && ans.correctChoiceId === ans.studentChoiceId;

                return (
                  <NotebookCard
                    key={ans.answerId}
                    pattern="ruled"
                    borderStyle="margin"
                    className="p-6 space-y-5 border-2 border-ink/15 dark:border-chalkboard-borderSubtle shadow-notebook-sm"
                  >
                    {/* Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink/10 dark:border-chalkboard-borderSubtle pb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-ink-muted dark:text-chalkboard-muted">
                          Item #{idx + 1}
                        </span>
                        <span>•</span>
                        <span className="px-2 py-0.5 rounded bg-highlighter-yellow/30 text-ink font-mono text-xs font-bold border border-ink/20">
                          {ans.topicName}
                        </span>
                        <span>•</span>
                        <span className="text-xs font-mono text-ink-muted">
                          Max: {ans.pointsPossible} pts
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {ans.adjusted && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-amber-700" />
                            ADJUSTED
                          </span>
                        )}

                        <span
                          className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold border flex items-center gap-1 ${
                            isCorrect
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                              : 'bg-redpen-soft text-redpen-dark border-redpen/30'
                          }`}
                        >
                          {isCorrect ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                          Auto: {ans.autoScore} / {ans.pointsPossible} pt
                        </span>
                      </div>
                    </div>

                    {/* Question Text */}
                    <p className="text-sm font-medium text-ink dark:text-chalkboard-chalk whitespace-pre-wrap leading-relaxed">
                      {ans.questionText}
                    </p>

                    {/* Choices */}
                    <div className="space-y-2 pt-1">
                      <span className="text-xs font-mono font-bold uppercase text-ink-muted dark:text-chalkboard-muted block">
                        Answer Choices:
                      </span>
                      <div className="space-y-1.5">
                        {ans.choices.map((c) => {
                          const isStudentChoice = c.id === ans.studentChoiceId;
                          const isCorrectChoice = c.id === ans.correctChoiceId;

                          let choiceStyle = 'border border-ink/10 dark:border-chalkboard-borderSubtle bg-paper-warm/30 dark:bg-chalkboard-surface/30';
                          if (isCorrectChoice) {
                            choiceStyle = 'border-2 border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 font-semibold';
                          } else if (isStudentChoice && !isCorrectChoice) {
                            choiceStyle = 'border-2 border-redpen bg-redpen-soft text-redpen-dark font-semibold';
                          }

                          return (
                            <div
                              key={c.id}
                              className={`p-2.5 sm:p-3 rounded-xl flex items-start justify-between gap-3 text-xs sm:text-sm ${choiceStyle}`}
                            >
                              <div className="flex items-start gap-2">
                                <span className="font-mono font-bold text-redpen">{c.label})</span>
                                <span>{c.text}</span>
                              </div>
                              <div className="flex items-center gap-1.5 flex-shrink-0 text-[10px] font-mono font-bold">
                                {isStudentChoice && (
                                  <span className="px-2 py-0.5 rounded bg-ink/10 dark:bg-chalkboard-highlight text-ink dark:text-chalkboard-chalk">
                                    Student Choice
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

                    {/* Explanation */}
                    {ans.explanation && (
                      <div className="p-3.5 rounded-xl border border-dashed border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-warm/60 dark:bg-chalkboard-surface/60 space-y-1">
                        <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-redpen">
                          <Lightbulb className="w-3.5 h-3.5" />
                          <span>Pedagogical Explanation:</span>
                        </div>
                        <p className="text-xs text-ink dark:text-chalkboard-chalk leading-relaxed">
                          {ans.explanation}
                        </p>
                      </div>
                    )}

                    {/* Teacher Manual Grade Override Form */}
                    <div className="p-4 rounded-xl border-2 border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-card dark:bg-chalkboard-card space-y-3">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                        <div>
                          <label
                            htmlFor={`score-${ans.answerId}`}
                            className="block text-xs font-mono font-bold uppercase text-ink dark:text-chalkboard-chalk"
                          >
                            Teacher Override Score for Item #{idx + 1}
                          </label>
                          <span className="text-[10px] text-ink-muted dark:text-chalkboard-muted">
                            Range: 0.00 to {ans.pointsPossible} (max 2 decimals). Final score currently: <strong>{ans.finalScore} pt</strong>
                          </span>
                        </div>
                        {ans.gradedAt && (
                          <span className="text-[10px] font-mono text-ink-muted">
                            Graded: {formatDate(ans.gradedAt)}
                          </span>
                        )}
                      </div>

                      {form.error && (
                        <div className="p-2 bg-redpen-soft border border-redpen/30 rounded-lg text-redpen-dark text-xs font-mono">
                          {form.error}
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-1">
                          <input
                            id={`score-${ans.answerId}`}
                            type="number"
                            step="0.01"
                            min="0"
                            max={ans.pointsPossible}
                            placeholder={`e.g. ${ans.pointsPossible}`}
                            value={form.teacherScore}
                            onChange={(e) => handleScoreChange(ans.answerId, e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border-2 border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-warm/30 dark:bg-chalkboard-surface/30 text-xs font-mono text-ink dark:text-chalkboard-chalk focus:outline-none focus:border-redpen"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <input
                            type="text"
                            maxLength={500}
                            placeholder="Optional instructor comment to the student (max 500 chars)"
                            value={form.comment}
                            onChange={(e) => handleCommentChange(ans.answerId, e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border-2 border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-warm/30 dark:bg-chalkboard-surface/30 text-xs font-mono text-ink dark:text-chalkboard-chalk focus:outline-none focus:border-redpen"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1">
                        {ans.adjusted && (
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            disabled={form.saving}
                            onClick={() => handleSaveGrade(ans, true)}
                            title="Remove manual override and restore auto-graded score"
                            className="text-xs"
                          >
                            <RotateCcw className="w-3.5 h-3.5 mr-1" />
                            Revert to Auto ({ans.autoScore} pt)
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          disabled={form.saving}
                          onClick={() => handleSaveGrade(ans, false)}
                          className="text-xs"
                        >
                          <Save className="w-3.5 h-3.5 mr-1" />
                          {form.saving ? 'Saving…' : 'Save Score'}
                        </Button>
                      </div>
                    </div>
                  </NotebookCard>
                );
              })}
            </div>
          </>
        )}
      </div>
    </PortalShell>
  );
}

