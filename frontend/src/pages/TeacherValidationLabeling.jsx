import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertCircle,
  HelpCircle,
  Save,
  Clock,
  EyeOff,
  BookOpen,
  Calendar,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { teacherService } from '../services/teacherService';
import { PortalShell, NotebookCard, Button } from '../components/NotebookPrimitives';

export default function TeacherValidationLabeling() {
  const { classId, studentId } = useParams();
  const { user, logout } = useAuth();

  const [studentDetail, setStudentDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Per-topic form state: { [topicId]: { label: 'WEAK'|'NOT_WEAK'|'CANNOT_JUDGE', note: string } }
  const [formData, setFormData] = useState({});
  // Per-topic saving status: { [topicId]: { saving: boolean, saved: boolean, error: string } }
  const [topicStatus, setTopicStatus] = useState({});

  const fetchStudentData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await teacherService.getValidationStudentDetail(classId, studentId);
      setStudentDetail(data);

      // Populate existing labels into form state
      const initialForm = {};
      if (data?.topics) {
        data.topics.forEach((t) => {
          initialForm[t.topicId] = {
            label: t.currentLabel || t.existingLabel || '',
            note: t.currentNote || t.existingNote || '',
          };
        });
      }
      setFormData(initialForm);
    } catch (err) {
      setError(err.message || 'Failed to load student topic evidence.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentData();
  }, [classId, studentId]);

  const handleLabelChange = (topicId, label) => {
    setFormData((prev) => ({
      ...prev,
      [topicId]: {
        ...(prev[topicId] || {}),
        label,
      },
    }));
  };

  const handleNoteChange = (topicId, note) => {
    if (note.length > 300) return;
    setFormData((prev) => ({
      ...prev,
      [topicId]: {
        ...(prev[topicId] || {}),
        note,
      },
    }));
  };

  const handleSaveTopicLabel = async (topicId) => {
    const current = formData[topicId];
    if (!current?.label) {
      setTopicStatus((prev) => ({
        ...prev,
        [topicId]: { error: 'Please select a judgment label (Weak, Not Weak, or Can’t Judge).' },
      }));
      return;
    }

    setTopicStatus((prev) => ({
      ...prev,
      [topicId]: { saving: true, saved: false, error: null },
    }));

    try {
      const result = await teacherService.saveValidationLabel(classId, studentId, topicId, {
        label: current.label,
        note: current.note || null,
      });

      // Update studentDetail existing label values
      setStudentDetail((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          topics: prev.topics.map((t) =>
            t.topicId === topicId
              ? {
                  ...t,
                  existingLabel: result.label,
                  existingNote: result.note,
                  labeledAt: result.labeledAt,
                }
              : t
          ),
        };
      });

      setTopicStatus((prev) => ({
        ...prev,
        [topicId]: { saving: false, saved: true, error: null },
      }));

      setTimeout(() => {
        setTopicStatus((prev) => ({
          ...prev,
          [topicId]: { ...(prev[topicId] || {}), saved: false },
        }));
      }, 4000);
    } catch (err) {
      setTopicStatus((prev) => ({
        ...prev,
        [topicId]: { saving: false, saved: false, error: err.message || 'Failed to save label.' },
      }));
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <PortalShell
      portalSubtitle="Teacher Validation Lab"
      user={user}
      onLogout={logout}
      badgeIcon={EyeOff}
      badgeLabel="Blind Evaluation"
      badgeColorClass="bg-highlighter-yellow text-ink"
      title={studentDetail?.studentName ? `Evaluating ${studentDetail.studentName}` : 'Blind Student Evaluation'}
      subtitle={
        studentDetail
          ? `${studentDetail.className || 'Class'} · ${studentDetail.submittedAttemptsCount} submitted quizzes in this class.`
          : 'Inspect student question evidence without algorithmic bias.'
      }
      headerRight={
        <div className="flex items-center gap-2">
          <Button
            to={`/teacher/classes/${classId}/validation`}
            variant="secondary"
            size="sm"
            className="text-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            <span>Validation Hub</span>
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* BLINDNESS BANNER (DECISION 10 CALLOUT) */}
        <NotebookCard
          borderStyle="sketch"
          className="p-4 bg-paper-card dark:bg-chalkboard-card border-2 border-ink dark:border-chalkboard-border flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-highlighter-mint/30 text-ink border border-ink/15 shrink-0">
              <EyeOff className="w-5 h-5 text-ink-blue" />
            </div>
            <div>
              <p className="text-xs font-mono font-bold uppercase tracking-wider text-ink-muted dark:text-chalkboard-muted">
                Blind Evaluation Mode Active
              </p>
              <p className="text-xs sm:text-sm font-medium text-ink dark:text-chalkboard-chalk">
                Your judgment is compared with the system afterwards. Seeing the system&apos;s score first would bias the result.
              </p>
            </div>
          </div>
        </NotebookCard>

        {studentDetail?.topics && studentDetail.topics.length > 0 && studentDetail.topics.length < 3 && (
          <div className="p-3 rounded-xl border border-ink/20 bg-paper-warm dark:bg-chalkboard-surface text-xs text-ink-muted dark:text-chalkboard-muted font-mono">
            ℹ️ This student has {studentDetail.topics.length} assigned topic{studentDetail.topics.length !== 1 ? 's' : ''}. Only topics with at least 3 attempted questions are eligible for validation.
          </div>
        )}

        {loading ? (
          <NotebookCard className="p-12 text-center bg-paper-card dark:bg-chalkboard-card border-2 border-ink dark:border-chalkboard-border">
            <div className="inline-flex items-center gap-2 text-ink-muted dark:text-chalkboard-muted">
              <Clock className="w-5 h-5 animate-spin text-redpen dark:text-highlighter-yellow" />
              <span className="font-mono text-sm">Loading student question evidence...</span>
            </div>
          </NotebookCard>
        ) : error ? (
          <div className="p-6 rounded-xl border-2 border-red-500 bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-200 text-sm">
            {error}
          </div>
        ) : !studentDetail?.topics || studentDetail.topics.length === 0 ? (
          <NotebookCard className="p-12 text-center bg-paper-card dark:bg-chalkboard-card border-2 border-ink dark:border-chalkboard-border">
            <p className="text-sm font-mono text-ink-muted dark:text-chalkboard-muted">
              No topics found for this class subject.
            </p>
          </NotebookCard>
        ) : (
          <div className="space-y-8">
            {studentDetail.topics.map((topic, index) => {
              const currentForm = formData[topic.topicId] || {};
              const status = topicStatus[topic.topicId] || {};
              const evidenceCount = topic.evidence ? topic.evidence.length : 0;
              const correctCount = topic.evidence ? topic.evidence.filter((e) => e.isCorrect).length : 0;

              return (
                <NotebookCard
                  key={topic.topicId}
                  ruled
                  marginLine
                  lifted
                  className="p-6 bg-paper-card dark:bg-chalkboard-card border-2 border-ink dark:border-chalkboard-border space-y-6"
                >
                  {/* Topic Title & Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-ink/10 dark:border-chalkboard-borderSubtle pb-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-paper-warm dark:bg-chalkboard-surface border border-ink/15 text-ink-muted dark:text-chalkboard-muted">
                          Topic {index + 1}
                        </span>
                        <h3 className="text-lg font-extrabold text-ink dark:text-chalkboard-chalk">
                          {topic.topicName}
                        </h3>
                      </div>
                      {topic.description && (
                        <p className="text-xs text-ink-muted dark:text-chalkboard-muted">
                          {topic.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span className="text-ink-muted dark:text-chalkboard-muted">
                        Evidence: {evidenceCount} question{evidenceCount !== 1 ? 's' : ''} answered
                      </span>
                      {evidenceCount > 0 && (
                        <span className="px-2 py-0.5 rounded bg-paper-warm dark:bg-chalkboard-surface border border-ink/15 text-ink dark:text-chalkboard-chalk font-bold">
                          {correctCount}/{evidenceCount} correct
                        </span>
                      )}
                    </div>
                  </div>

                  {/* RAW EVIDENCE: STUDENT'S ANSWERS TO QUESTIONS */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-ink-muted dark:text-chalkboard-muted flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Student Question Evidence in this Class</span>
                    </h4>

                    {evidenceCount === 0 ? (
                      <div className="p-4 rounded-xl bg-paper-warm dark:bg-chalkboard-surface border border-ink/15 text-xs text-ink-muted dark:text-chalkboard-muted italic">
                        No questions answered yet by this student in this topic for this class.
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                        {topic.evidence.map((ev, qIdx) => (
                          <div
                            key={ev.questionId || qIdx}
                            className="p-3.5 rounded-xl border border-ink/15 dark:border-chalkboard-border bg-paper-warm/60 dark:bg-chalkboard-surface/60 space-y-2"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <p className="text-xs font-medium text-ink dark:text-chalkboard-chalk leading-relaxed">
                                <span className="font-mono font-bold mr-1.5 text-ink-muted dark:text-chalkboard-muted">
                                  Q{qIdx + 1}.
                                </span>
                                {ev.questionPrompt}
                              </p>

                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase shrink-0 border ${
                                  ev.isCorrect
                                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300'
                                    : 'bg-redpen-soft text-redpen-dark border-redpen/30'
                                }`}
                              >
                                {ev.isCorrect ? (
                                  <>
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>Correct</span>
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="w-3 h-3" />
                                    <span>Incorrect</span>
                                  </>
                                )}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] pt-1 border-t border-ink/10 dark:border-chalkboard-borderSubtle">
                              <div className="text-ink-muted dark:text-chalkboard-muted">
                                <span>Student Answer: </span>
                                <span className="font-semibold text-ink dark:text-chalkboard-chalk font-mono">
                                  {ev.studentAnswer || '—'}
                                </span>
                              </div>

                              <div className="text-[10px] font-mono text-ink-muted dark:text-chalkboard-muted flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span>{formatDate(ev.submittedAt)}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* TEACHER BLIND JUDGMENT CONTROLS */}
                  <div className="p-4 rounded-xl border-2 border-ink/20 dark:border-chalkboard-border bg-paper-warm dark:bg-chalkboard-surface space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <label className="text-xs font-mono font-bold uppercase tracking-wider text-ink dark:text-chalkboard-chalk">
                        Your Pedagogical Assessment of Topic Mastery:
                      </label>

                      {topic.labeledAt && (
                        <span className="text-[10px] font-mono text-ink-muted dark:text-chalkboard-muted">
                          Last labeled: {formatDate(topic.labeledAt)}
                        </span>
                      )}
                    </div>

                    {/* Radio Group */}
                    <div
                      role="radiogroup"
                      aria-label={`Mastery judgment for ${topic.topicName}`}
                      className="grid grid-cols-1 sm:grid-cols-3 gap-3"
                    >
                      {/* Weak Option */}
                      <label
                        className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                          currentForm.label === 'WEAK'
                            ? 'border-redpen bg-redpen-soft/30 dark:bg-redpen-soft/20 text-ink dark:text-chalkboard-chalk shadow-xs'
                            : 'border-ink/20 dark:border-chalkboard-border bg-paper-card dark:bg-chalkboard-card hover:bg-paper-warm dark:hover:bg-chalkboard-surface text-ink dark:text-chalkboard-chalk'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`label-${topic.topicId}`}
                          value="WEAK"
                          checked={currentForm.label === 'WEAK'}
                          onChange={() => handleLabelChange(topic.topicId, 'WEAK')}
                          className="mt-1 text-redpen focus:ring-redpen"
                        />
                        <div>
                          <span className="block text-xs font-bold text-redpen-dark dark:text-red-400">
                            Weak (Gap)
                          </span>
                          <span className="block text-[11px] text-ink-muted dark:text-chalkboard-muted leading-tight mt-0.5">
                            Struggles with core concepts; requires targeted remediation.
                          </span>
                        </div>
                      </label>

                      {/* Not Weak Option */}
                      <label
                        className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                          currentForm.label === 'NOT_WEAK'
                            ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 text-ink dark:text-chalkboard-chalk shadow-xs'
                            : 'border-ink/20 dark:border-chalkboard-border bg-paper-card dark:bg-chalkboard-card hover:bg-paper-warm dark:hover:bg-chalkboard-surface text-ink dark:text-chalkboard-chalk'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`label-${topic.topicId}`}
                          value="NOT_WEAK"
                          checked={currentForm.label === 'NOT_WEAK'}
                          onChange={() => handleLabelChange(topic.topicId, 'NOT_WEAK')}
                          className="mt-1 text-emerald-600 focus:ring-emerald-600"
                        />
                        <div>
                          <span className="block text-xs font-bold text-emerald-700 dark:text-emerald-400">
                            Not Weak
                          </span>
                          <span className="block text-[11px] text-ink-muted dark:text-chalkboard-muted leading-tight mt-0.5">
                            Demonstrates developing or secure topic understanding.
                          </span>
                        </div>
                      </label>

                      {/* Cannot Judge Option */}
                      <label
                        className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                          currentForm.label === 'CANNOT_JUDGE'
                            ? 'border-amber-600 bg-amber-50 dark:bg-amber-950/30 text-ink dark:text-chalkboard-chalk shadow-xs'
                            : 'border-ink/20 dark:border-chalkboard-border bg-paper-card dark:bg-chalkboard-card hover:bg-paper-warm dark:hover:bg-chalkboard-surface text-ink dark:text-chalkboard-chalk'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`label-${topic.topicId}`}
                          value="CANNOT_JUDGE"
                          checked={currentForm.label === 'CANNOT_JUDGE'}
                          onChange={() => handleLabelChange(topic.topicId, 'CANNOT_JUDGE')}
                          className="mt-1 text-amber-600 focus:ring-amber-600"
                        />
                        <div>
                          <span className="block text-xs font-bold text-amber-700 dark:text-amber-400">
                            Cannot Judge
                          </span>
                          <span className="block text-[11px] text-ink-muted dark:text-chalkboard-muted leading-tight mt-0.5">
                            Insufficient evidence or ambiguous student responses.
                          </span>
                        </div>
                      </label>
                    </div>

                    {/* Teacher Optional Note */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label
                          htmlFor={`note-${topic.topicId}`}
                          className="text-[11px] font-mono font-bold uppercase tracking-wider text-ink-muted dark:text-chalkboard-muted"
                        >
                          Teacher Note (optional, max 300 characters)
                        </label>
                        <span className="text-[10px] font-mono text-ink-muted dark:text-chalkboard-muted">
                          {(currentForm.note || '').length} / 300
                        </span>
                      </div>
                      <textarea
                        id={`note-${topic.topicId}`}
                        rows={2}
                        maxLength={300}
                        value={currentForm.note || ''}
                        onChange={(e) => handleNoteChange(topic.topicId, e.target.value)}
                        placeholder="Add observational notes regarding student misconceptions or reasoning..."
                        className="w-full p-2.5 rounded-lg text-xs bg-paper-card dark:bg-chalkboard-card border border-ink/20 dark:border-chalkboard-border text-ink dark:text-chalkboard-chalk placeholder:text-ink-muted/50 focus:outline-none focus:ring-2 focus:ring-redpen"
                      />
                    </div>

                    {/* Action Bar: Save button, status message */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                      <div>
                        {status.error && (
                          <span className="text-xs font-bold text-redpen dark:text-red-400 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>{status.error}</span>
                          </span>
                        )}
                        {status.saved && (
                          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1 font-mono">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Judgment snapshot recorded successfully!</span>
                          </span>
                        )}
                      </div>

                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleSaveTopicLabel(topic.topicId)}
                        disabled={status.saving}
                        className="text-xs"
                      >
                        <Save className="w-3.5 h-3.5 mr-1.5" />
                        <span>{status.saving ? 'Saving...' : 'Save Label'}</span>
                      </Button>
                    </div>
                  </div>
                </NotebookCard>
              );
            })}
          </div>
        )}
      </div>
    </PortalShell>
  );
}

