import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
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
  Bot,
  Loader2,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { teacherService } from '../services/teacherService';
import { aiService } from '../services/aiService';
import { Button, NotebookCard, PortalShell } from '../components/NotebookPrimitives';

export default function TeacherAttemptReview() {
  const { classId, studentId, attemptId } = useParams();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const returnTo = location.state?.returnTo || `/teacher/classes/${classId}/students/${studentId}`;
  const returnLabel = location.state?.returnLabel || 'Back to Student Detail';
  const shortReturnLabel = location.state?.returnTo ? 'Back to Submissions' : 'Back to Student';

  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Per-answer edit state: { [answerId]: { teacherScore: string, comment: string, saving: boolean, suggesting: boolean, error: string } }
  const [editForms, setEditForms] = useState({});
  const [globalNotice, setGlobalNotice] = useState('');
  const [aiStatus, setAiStatus] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [data, status] = await Promise.all([
        teacherService.getAttemptReview(classId, attemptId),
        aiService.getStatus().catch(() => null),
      ]);
      setReview(data);
      setAiStatus(status);

      const forms = {};
      data.answers.forEach((ans) => {
        const rubricMap = {};
        const activeSuggestion = ans.aiSuggestion?.status === 'SUGGESTED' ? ans.aiSuggestion : null;
        const suggestedById = {};
        (activeSuggestion?.criteria || []).forEach((sc) => {
          suggestedById[sc.criterionId] = sc.points;
        });

        (ans.rubricCriteria || []).forEach((rc) => {
          if (rc.pointsAwarded != null) {
            rubricMap[rc.criterionId] = String(rc.pointsAwarded);
          } else if (suggestedById[rc.criterionId] != null) {
            rubricMap[rc.criterionId] = String(suggestedById[rc.criterionId]);
          } else {
            rubricMap[rc.criterionId] = '';
          }
        });
        forms[ans.answerId] = {
          teacherScore: ans.teacherScore != null ? String(ans.teacherScore) : '',
          comment: ans.teacherComment || activeSuggestion?.overallFeedback || '',
          rubricScores: rubricMap,
          saving: false,
          suggesting: false,
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

  const handleRubricPointChange = (answerId, criterionId, val) => {
    setEditForms((prev) => ({
      ...prev,
      [answerId]: {
        ...prev[answerId],
        rubricScores: { ...(prev[answerId]?.rubricScores || {}), [criterionId]: val },
        error: '',
      },
    }));
  };

  const handleSuggestEssayGrade = async (ans) => {
    setEditForms((prev) => ({
      ...prev,
      [ans.answerId]: { ...prev[ans.answerId], suggesting: true, error: '' },
    }));
    try {
      const suggestion = await teacherService.suggestEssayGrade(classId, attemptId, ans.answerId);
      const nextRubricMap = { ...(editForms[ans.answerId]?.rubricScores || {}) };
      (suggestion.criteria || []).forEach((sc) => {
        nextRubricMap[sc.criterionId] = String(sc.points);
      });
      setReview((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          answers: prev.answers.map((a) => (a.answerId === ans.answerId ? { ...a, aiSuggestion: suggestion } : a)),
        };
      });
      setEditForms((prev) => ({
        ...prev,
        [ans.answerId]: {
          ...prev[ans.answerId],
          rubricScores: nextRubricMap,
          comment: suggestion.overallFeedback || prev[ans.answerId]?.comment || '',
          suggesting: false,
          error: '',
        },
      }));
    } catch (err) {
      setEditForms((prev) => ({
        ...prev,
        [ans.answerId]: {
          ...prev[ans.answerId],
          suggesting: false,
          error: err.message || 'Could not generate an AI grade suggestion right now.',
        },
      }));
    }
  };

  const handleDiscardSuggestion = async (ans) => {
    if (!ans.aiSuggestion?.id) return;
    setEditForms((prev) => ({
      ...prev,
      [ans.answerId]: { ...prev[ans.answerId], suggesting: true, error: '' },
    }));
    try {
      await teacherService.discardEssaySuggestion(classId, attemptId, ans.answerId, ans.aiSuggestion.id);
      setReview((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          answers: prev.answers.map((a) => (a.answerId === ans.answerId ? { ...a, aiSuggestion: null } : a)),
        };
      });
      setEditForms((prev) => ({
        ...prev,
        [ans.answerId]: { ...prev[ans.answerId], suggesting: false },
      }));
    } catch (err) {
      setEditForms((prev) => ({
        ...prev,
        [ans.answerId]: {
          ...prev[ans.answerId],
          suggesting: false,
          error: err.message || 'Failed to discard AI suggestion.',
        },
      }));
    }
  };

  const handleSaveGrade = async (ans, isRevert = false) => {
    const form = editForms[ans.answerId];
    if (!form) return;

    const isEssay = ans.type === 'ESSAY';
    let parsedScore = null;
    let rubricScoresPayload = null;

    if (isEssay) {
      const criteria = ans.rubricCriteria || [];
      const built = [];
      for (const rc of criteria) {
        const raw = form.rubricScores?.[rc.criterionId];
        if (raw === '' || raw == null) {
          setEditForms((prev) => ({
            ...prev,
            [ans.answerId]: { ...prev[ans.answerId], error: `Please enter points for "${rc.name}".` },
          }));
          return;
        }
        const intVal = Number(raw);
        if (!Number.isInteger(intVal) || intVal < 0 || intVal > rc.maxPoints) {
          setEditForms((prev) => ({
            ...prev,
            [ans.answerId]: {
              ...prev[ans.answerId],
              error: `Points for "${rc.name}" must be an integer between 0 and ${rc.maxPoints}.`,
            },
          }));
          return;
        }
        built.push({ criterionId: rc.criterionId, points: intVal });
      }
      rubricScoresPayload = built;
    } else if (!isRevert) {
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
      const payload = isEssay
        ? {
            rubricScores: rubricScoresPayload,
            teacherComment: form.comment ? form.comment.trim() : null,
          }
        : {
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
        const remainingUngraded = updatedAnswers.filter((a) => a.type === 'ESSAY' && !a.graded).length;
        return {
          ...prev,
          totalScore: res.newAttemptTotalScore,
          percentage: res.newAttemptPercentage,
          awaitingTeacherGrading: remainingUngraded > 0,
          ungradedEssayCount: remainingUngraded,
          answers: updatedAnswers,
        };
      });

      const nextRubricMap = {};
      (res.answer.rubricCriteria || []).forEach((rc) => {
        nextRubricMap[rc.criterionId] = rc.pointsAwarded != null ? String(rc.pointsAwarded) : '';
      });

      setEditForms((prev) => ({
        ...prev,
        [ans.answerId]: {
          teacherScore: res.answer.teacherScore != null ? String(res.answer.teacherScore) : '',
          comment: res.answer.teacherComment || '',
          rubricScores: nextRubricMap,
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
      user={user}
      onLogout={logout}
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
            to={returnTo}
            className="hover:text-redpen underline transition-colors"
          >
            {location.state?.returnTo ? 'Assessment Submissions' : 'Student Progress'}
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
              onClick={() => navigate(returnTo)}
            >
              {returnLabel}
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
                    onClick={() => navigate(returnTo)}
                  >
                    <ArrowLeft className="w-4 h-4 mr-1.5" />
                    {shortReturnLabel}
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
                    {review.awaitingTeacherGrading
                      ? `Awaiting teacher grading (${review.ungradedEssayCount})`
                      : review.status}
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
                const qType = ans.type || 'MULTIPLE_CHOICE';
                const isCorrect =
                  qType === 'MULTIPLE_CHOICE'
                    ? ans.correctChoiceId != null && ans.correctChoiceId === ans.studentChoiceId
                    : ans.finalScore != null && ans.finalScore >= ans.pointsPossible;

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
                        {qType === 'ESSAY' ? (
                          <span
                            className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold border flex items-center gap-1 ${
                              ans.graded
                                ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                : 'bg-amber-100 text-amber-900 border-amber-400'
                            }`}
                          >
                            {ans.graded ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                            {ans.graded ? `Graded: ${ans.finalScore} / ${ans.pointsPossible} pt` : 'Ungraded Essay'}
                          </span>
                        ) : (
                          <>
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
                          </>
                        )}
                      </div>
                    </div>

                    {/* Question Text */}
                    <p className="text-sm font-medium text-ink dark:text-chalkboard-chalk whitespace-pre-wrap leading-relaxed">
                      {ans.questionText}
                    </p>

                    {/* Student Answer Display by Type */}
                    {qType === 'ENUMERATION' ? (
                      <div className="space-y-2 pt-1">
                        <div className="p-3 rounded-xl border border-ink/20 bg-paper-warm/40 dark:bg-chalkboard-surface/40 space-y-1">
                          <span className="text-xs font-mono font-bold uppercase text-ink-muted dark:text-chalkboard-muted block">
                            Student Answer:
                          </span>
                          <p className="text-sm font-mono text-ink dark:text-chalkboard-chalk whitespace-pre-wrap">
                            {ans.studentTextAnswer && ans.studentTextAnswer.trim() ? ans.studentTextAnswer : '— (No answer submitted)'}
                          </p>
                        </div>
                        {ans.acceptedAnswers && ans.acceptedAnswers.length > 0 && (
                          <div className="p-3 rounded-xl border border-emerald-600/40 bg-emerald-50/60 dark:bg-emerald-950/30 space-y-1">
                            <span className="text-xs font-mono font-bold uppercase text-emerald-800 dark:text-emerald-300 block">
                              Accepted Answers:
                            </span>
                            <p className="text-xs font-mono text-ink dark:text-chalkboard-chalk">
                              {ans.acceptedAnswers.join(' | ')}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : qType === 'ESSAY' ? (
                      <div className="p-3.5 rounded-xl border border-ink/20 bg-paper-warm/40 dark:bg-chalkboard-surface/40 space-y-1">
                        <span className="text-xs font-mono font-bold uppercase text-ink-muted dark:text-chalkboard-muted block">
                          Student Essay Response:
                        </span>
                        <p className="text-sm text-ink dark:text-chalkboard-chalk whitespace-pre-wrap leading-relaxed">
                          {ans.studentTextAnswer && ans.studentTextAnswer.trim() ? ans.studentTextAnswer : '— (No response submitted)'}
                        </p>
                      </div>
                    ) : (
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
                    )}

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

                    {/* Teacher Grading Form (Rubric for ESSAY, Manual Override for MCQ/ENUMERATION) */}
                    <div className="p-4 rounded-xl border-2 border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-card dark:bg-chalkboard-card space-y-3">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                        <div>
                          <label
                            htmlFor={`score-${ans.answerId}`}
                            className="block text-xs font-mono font-bold uppercase text-ink dark:text-chalkboard-chalk"
                          >
                            {qType === 'ESSAY'
                              ? `Rubric Grading for Item #${idx + 1}`
                              : `Teacher Override Score for Item #${idx + 1}`}
                          </label>
                          <span className="text-[10px] text-ink-muted dark:text-chalkboard-muted">
                            {qType === 'ESSAY'
                              ? `Enter integer points per criterion. Current score: ${ans.finalScore ?? 'Ungraded'} / ${ans.pointsPossible} pt`
                              : <>Range: 0.00 to {ans.pointsPossible} (max 2 decimals). Final score currently: <strong>{ans.finalScore} pt</strong></>}
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

                      {qType === 'ESSAY' ? (
                        <div className="space-y-3">
                          {/* On-Demand AI Suggestion Controls & Status */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl border border-ink/15 bg-paper-warm/40 dark:bg-chalkboard-surface/40">
                            <div className="flex flex-wrap items-center gap-2">
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                disabled={form.suggesting || form.saving}
                                onClick={() => handleSuggestEssayGrade(ans)}
                                className="text-xs focus:ring-2 focus:ring-ink"
                              >
                                {form.suggesting ? (
                                  <>
                                    <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                                    <span>Suggesting…</span>
                                  </>
                                ) : (
                                  <>
                                    <Bot className="w-3.5 h-3.5 mr-1" />
                                    <span>Suggest grade with AI</span>
                                  </>
                                )}
                              </Button>

                              {ans.aiSuggestion?.status === 'SUGGESTED' && (
                                <>
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-[11px] font-mono font-bold text-amber-900 dark:text-amber-200">
                                    <Sparkles className="w-3 h-3" />
                                    <span>AI suggested, not final</span>
                                  </span>
                                  <button
                                    type="button"
                                    disabled={form.suggesting || form.saving}
                                    onClick={() => handleDiscardSuggestion(ans)}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border border-ink/20 text-[11px] font-mono text-ink-muted hover:text-redpen hover:border-redpen/40 focus:outline-none focus:ring-2 focus:ring-redpen cursor-pointer"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    <span>Discard</span>
                                  </button>
                                </>
                              )}

                              {(ans.aiSuggestion?.status === 'ACCEPTED' || ans.aiSuggestion?.status === 'EDITED') && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-paper-card dark:bg-chalkboard-card border border-ink/20 text-[11px] font-mono text-ink-muted">
                                  <Bot className="w-3 h-3" />
                                  <span>
                                    Started from AI suggestion ({ans.aiSuggestion.status === 'ACCEPTED' ? 'Accepted' : 'Edited'})
                                  </span>
                                </span>
                              )}
                            </div>

                            {aiStatus?.provider === 'gemini' && (
                              <span className="text-[11px] font-mono text-ink-muted dark:text-chalkboard-muted">
                                Cloud mode: this student's answer text is sent to Google.
                              </span>
                            )}
                          </div>

                          <div className="space-y-2">
                            {(ans.rubricCriteria || []).map((rc) => {
                              const activeReason = ans.aiSuggestion?.status === 'SUGGESTED'
                                ? ans.aiSuggestion.criteria?.find((sc) => sc.criterionId === rc.criterionId)?.reason
                                : null;
                              return (
                                <div
                                  key={rc.criterionId}
                                  className="p-2.5 rounded-xl border border-ink/15 bg-paper-warm/40 dark:bg-chalkboard-surface/40 space-y-1.5"
                                >
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <div className="space-y-0.5">
                                      <span className="text-xs font-bold text-ink dark:text-chalkboard-chalk block">
                                        {rc.name}
                                      </span>
                                      {rc.description && (
                                        <span className="text-[11px] text-ink-muted dark:text-chalkboard-muted block">
                                          {rc.description}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <input
                                        type="number"
                                        min={0}
                                        max={rc.maxPoints}
                                        step={1}
                                        value={form.rubricScores?.[rc.criterionId] ?? ''}
                                        onChange={(e) => handleRubricPointChange(ans.answerId, rc.criterionId, e.target.value)}
                                        className="w-16 px-2 py-1.5 rounded-lg border-2 border-ink/20 bg-paper-card dark:bg-chalkboard-card text-xs font-mono text-center text-ink dark:text-chalkboard-chalk focus:outline-none focus:border-redpen focus:ring-1 focus:ring-redpen"
                                        aria-label={`Points for ${rc.name}`}
                                      />
                                      <span className="text-xs font-mono text-ink-muted">
                                        / {rc.maxPoints} pts
                                      </span>
                                    </div>
                                  </div>
                                  {activeReason && (
                                    <p className="text-[11px] font-mono text-ink-muted dark:text-chalkboard-muted pl-2 border-l-2 border-amber-400">
                                      AI reason: {activeReason}
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          <textarea
                            rows={2}
                            maxLength={2000}
                            placeholder="Optional feedback to the student (max 2000 chars)"
                            value={form.comment}
                            onChange={(e) => handleCommentChange(ans.answerId, e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border-2 border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-warm/30 dark:bg-chalkboard-surface/30 text-xs font-mono text-ink dark:text-chalkboard-chalk focus:outline-none focus:border-redpen"
                          />
                        </div>
                      ) : (
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
                      )}

                      <div className="flex items-center justify-end gap-2 pt-1">
                        {qType !== 'ESSAY' && ans.adjusted && (
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
                          {form.saving ? 'Saving…' : qType === 'ESSAY' ? 'Save Essay Grade' : 'Save Score'}
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

