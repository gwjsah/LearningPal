import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Mail,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  BookOpen,
  Award,
  Clock,
  ChevronDown,
  ChevronUp,
  Plus,
  Check,
  X,
  FileText,
  AlertCircle,
  HelpCircle,
  Edit2,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { teacherService } from '../services/teacherService';
import { Button, NotebookCard, PortalShell } from '../components/NotebookPrimitives';

export default function TeacherStudentDetail() {
  const { classId, studentId } = useParams();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Expanded state for missed questions per topic
  const [expandedTopics, setExpandedTopics] = useState({});

  // Interventions modal state
  const [showLogModal, setShowLogModal] = useState(false);
  const [intervForm, setIntervForm] = useState({
    topicId: '',
    type: 'ONE_ON_ONE',
    note: '',
    followUpDate: '',
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Edit intervention modal
  const [editingIntervention, setEditingIntervention] = useState(null);
  const [editForm, setEditForm] = useState({ note: '', followUpDate: '' });

  // Status confirm modal (Mark Done / Cancel)
  const [confirmModal, setConfirmModal] = useState({ open: false, id: null, status: null, title: '' });

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await teacherService.getStudentDetail(classId, studentId);
      setData(res);
      if (res.topicMasteries && res.topicMasteries.length > 0) {
        setIntervForm((prev) => ({
          ...prev,
          topicId: prev.topicId || String(res.topicMasteries[0].topicId),
        }));
      }
    } catch (err) {
      if (err.status === 401) {
        logout();
        navigate('/login', { replace: true });
        return;
      }
      if (err.status === 404) {
        setError('Student not found. Ensure this student is actively enrolled in your assigned section.');
        return;
      }
      setError(err.message || 'Failed to load student learning data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [classId, studentId]);

  const toggleTopicExpand = (topicId) => {
    setExpandedTopics((prev) => ({
      ...prev,
      [topicId]: !prev[topicId],
    }));
  };

  const handleCreateIntervention = async (e) => {
    e.preventDefault();
    if (!intervForm.topicId || !intervForm.note.trim()) {
      setActionError('Please select a topic and enter an intervention note.');
      return;
    }

    setActionLoading(true);
    setActionError('');
    try {
      const payload = {
        topicId: Number(intervForm.topicId),
        type: intervForm.type,
        note: intervForm.note.trim(),
        followUpDate: intervForm.followUpDate || null,
      };

      const created = await teacherService.createIntervention(classId, studentId, payload);
      setData((prev) => ({
        ...prev,
        interventions: [created, ...(prev.interventions || [])],
      }));

      setShowLogModal(false);
      setIntervForm((prev) => ({
        topicId: prev.topicId,
        type: 'ONE_ON_ONE',
        note: '',
        followUpDate: '',
      }));
      setActionSuccess('Intervention logged successfully!');
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err) {
      setActionError(err.message || 'Failed to create intervention.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenEditIntervention = (item) => {
    setEditingIntervention(item);
    setEditForm({
      note: item.note,
      followUpDate: item.followUpDate || '',
    });
    setActionError('');
  };

  const handleSaveEditIntervention = async (e) => {
    e.preventDefault();
    if (!editingIntervention) return;
    setActionLoading(true);
    setActionError('');
    try {
      const payload = {
        note: editForm.note.trim(),
        followUpDate: editForm.followUpDate || null,
      };
      const updated = await teacherService.updateIntervention(classId, editingIntervention.id, payload);
      setData((prev) => ({
        ...prev,
        interventions: prev.interventions.map((i) => (i.id === updated.id ? updated : i)),
      }));
      setEditingIntervention(null);
      setActionSuccess('Intervention updated successfully!');
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err) {
      setActionError(err.message || 'Failed to update intervention.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmStatusChange = async () => {
    const { id, status } = confirmModal;
    if (!id || !status) return;

    setActionLoading(true);
    try {
      const updated = await teacherService.updateIntervention(classId, id, { status });
      setData((prev) => ({
        ...prev,
        interventions: prev.interventions.map((i) => (i.id === updated.id ? updated : i)),
      }));
      setConfirmModal({ open: false, id: null, status: null, title: '' });
      setActionSuccess(`Intervention marked as ${status}!`);
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err) {
      setActionError(err.message || 'Failed to update intervention status.');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return '—';
    return new Date(isoString).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <PortalShell
      role="TEACHER"
      portalName="LearningPal Teacher"
      portalSubtitle="Student Diagnostic Profile & Learning Progress"
      badgeLabel="Student Progress"
      user={user}
      onLogout={logout}
    >
      <div className="space-y-8 max-w-5xl mx-auto pb-12">
        {/* Navigation Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs font-mono text-ink-muted dark:text-chalkboard-muted">
          <Link
            to={`/teacher/classes/${classId}`}
            className="hover:text-redpen underline transition-colors"
          >
            Class Overview
          </Link>
          <span>/</span>
          <span className="text-ink dark:text-chalkboard-chalk font-bold">
            {data?.profile ? data.profile.name : 'Student Detail'}
          </span>
        </div>

        {/* Action feedback banners */}
        {actionSuccess && (
          <div
            role="status"
            className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-500 rounded-xl text-emerald-900 dark:text-emerald-200 text-xs font-mono flex items-center gap-2 shadow-notebook-sm"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <NotebookCard className="p-12 text-center text-xs font-mono text-ink-muted dark:text-chalkboard-muted space-y-3">
            <div className="inline-block animate-spin w-6 h-6 border-2 border-redpen border-t-transparent rounded-full" />
            <p>Loading student learning diagnostic profile…</p>
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
              onClick={() => navigate(`/teacher/classes/${classId}`)}
            >
              Back to Class
            </Button>
          </NotebookCard>
        )}

        {/* Loaded Content */}
        {data && !loading && (
          <>
            {/* Student Header Card */}
            <NotebookCard className="p-6 border-3 border-ink/20 dark:border-chalkboard-borderSubtle shadow-notebook space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl sm:text-3xl font-bold text-ink dark:text-chalkboard-chalk">
                      {data.profile.name}
                    </h1>
                    {data.profile.needsAttention ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase bg-redpen-soft text-redpen-dark border-2 border-redpen">
                        <AlertTriangle className="w-3.5 h-3.5 text-redpen" />
                        Needs Attention
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase bg-emerald-100 text-emerald-900 border-2 border-emerald-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                        On Track
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-ink-muted dark:text-chalkboard-muted mt-2">
                    <span className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" />
                      {data.profile.email}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      Enrolled: {formatDate(data.profile.joinedAt)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setShowLogModal(true)}
                    className="text-xs"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Log Intervention
                  </Button>
                </div>
              </div>
            </NotebookCard>

            {/* PART 1: LEARNING NEEDS & TOPIC MASTERY */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-ink dark:text-chalkboard-chalk flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-redpen dark:text-highlighter-yellow" />
                    <span>Learning Needs & Topic Mastery</span>
                  </h2>
                  <p className="text-xs text-ink-muted dark:text-chalkboard-muted">
                    Cumulative curriculum understanding across tested competencies.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {(data.topicMasteries || []).map((tm) => {
                  const hasGapOrDev = tm.status === 'GAP' || tm.status === 'DEVELOPING';
                  const misses = data.missedQuestionsByTopic?.[tm.topicId] || [];
                  const isExpanded = !!expandedTopics[tm.topicId];

                  let statusBadge = (
                    <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-ink/10 text-ink-muted border border-ink/20">
                      NO DATA
                    </span>
                  );
                  let barColor = 'bg-ink/20';

                  if (tm.status === 'STRENGTH') {
                    statusBadge = (
                      <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                        STRENGTH
                      </span>
                    );
                    barColor = 'bg-emerald-600';
                  } else if (tm.status === 'DEVELOPING') {
                    statusBadge = (
                      <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300">
                        DEVELOPING
                      </span>
                    );
                    barColor = 'bg-amber-500';
                  } else if (tm.status === 'GAP') {
                    statusBadge = (
                      <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-redpen-soft text-redpen-dark border border-redpen/40">
                        GAP
                      </span>
                    );
                    barColor = 'bg-redpen';
                  }

                  return (
                    <NotebookCard
                      key={tm.topicId}
                      className="p-4 sm:p-5 border-2 border-ink/15 dark:border-chalkboard-borderSubtle shadow-notebook-sm space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-base text-ink dark:text-chalkboard-chalk">
                              {tm.name}
                            </h3>
                            {statusBadge}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-ink-muted dark:text-chalkboard-muted">
                            <span>Questions Answered: <strong>{tm.questionsAnswered}</strong></span>
                            <span>•</span>
                            <span>
                              Resources: <strong>{tm.resourcesCompleted} / {tm.resourcesRecommended}</strong> completed
                            </span>
                            {tm.trend && tm.trend !== 'STABLE' && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1 font-bold">
                                  Trend:
                                  {tm.trend === 'UP' ? (
                                    <span className="text-emerald-700 flex items-center">
                                      <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> Up
                                    </span>
                                  ) : (
                                    <span className="text-redpen flex items-center">
                                      <TrendingDown className="w-3.5 h-3.5 mr-0.5" /> Down
                                    </span>
                                  )}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Mastery Bar */}
                        <div className="w-full sm:w-56 flex items-center gap-3">
                          <div className="flex-1 h-3 rounded-full bg-ink/10 dark:bg-chalkboard-highlight overflow-hidden">
                            <div
                              className={`h-full ${barColor} transition-all duration-500`}
                              style={{ width: `${Math.min(100, tm.masteryPercent ?? 0)}%` }}
                            />
                          </div>
                          <span className="font-mono text-xs font-bold text-ink dark:text-chalkboard-chalk w-12 text-right">
                            {tm.masteryPercent != null ? `${tm.masteryPercent}%` : '—'}
                          </span>
                        </div>
                      </div>

                      {/* Most-missed questions trigger for GAP / DEVELOPING */}
                      {hasGapOrDev && misses.length > 0 && (
                        <div className="pt-2 border-t border-ink/10 dark:border-chalkboard-borderSubtle">
                          <button
                            type="button"
                            onClick={() => toggleTopicExpand(tm.topicId)}
                            className="text-xs font-mono font-bold text-redpen hover:underline flex items-center gap-1 cursor-pointer focus:outline-none"
                          >
                            <span>
                              {isExpanded ? 'Hide' : 'Review'} {misses.length} most-missed diagnostic questions
                            </span>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>

                          {isExpanded && (
                            <div className="mt-3 space-y-2.5">
                              {misses.map((m, mIdx) => (
                                <div
                                  key={m.questionId || mIdx}
                                  className="p-3 rounded-xl border border-ink/15 dark:border-chalkboard-borderSubtle bg-paper-warm/40 dark:bg-chalkboard-surface/40 text-xs space-y-1.5"
                                >
                                  <p className="font-medium text-ink dark:text-chalkboard-chalk">
                                    <strong className="text-ink-muted">Q{mIdx + 1}:</strong> {m.questionText}
                                  </p>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[11px]">
                                    <div className="p-2 rounded bg-redpen-soft/60 border border-redpen/20 text-redpen-dark">
                                      <span className="block font-bold">Student Answer:</span>
                                      <span>{m.studentAnswer}</span>
                                    </div>
                                    <div className="p-2 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 text-emerald-900 dark:text-emerald-200">
                                      <span className="block font-bold">Correct Answer:</span>
                                      <span>{m.correctAnswer}</span>
                                    </div>
                                  </div>
                                  {m.explanation && (
                                    <p className="text-[11px] text-ink-muted dark:text-chalkboard-muted italic pt-1">
                                      Concept note: {m.explanation}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </NotebookCard>
                  );
                })}
              </div>
            </div>

            {/* PART 2: ATTEMPTS & DIAGNOSTIC TREND */}
            <div className="space-y-4 pt-4 border-t border-ink/15 dark:border-chalkboard-borderSubtle">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-ink dark:text-chalkboard-chalk flex items-center gap-2">
                    <Award className="w-5 h-5 text-redpen dark:text-highlighter-yellow" />
                    <span>Attempts & Diagnostic Performance in this Class</span>
                  </h2>
                  <p className="text-xs text-ink-muted dark:text-chalkboard-muted">
                    Exams and quizzes submitted specifically under this classroom section.
                  </p>
                </div>
              </div>

              {/* Simple Diagnostic Trend Visual */}
              {data.diagnosticTrend.length > 1 && (
                <NotebookCard className="p-5 border-2 border-ink/15 shadow-notebook-sm space-y-3">
                  <span className="text-xs font-mono font-bold uppercase text-ink-muted block">
                    Diagnostic Score Progression Over Time:
                  </span>
                  <div className="flex items-center gap-3 overflow-x-auto py-2">
                    {data.diagnosticTrend.map((pt, pIdx) => (
                      <div key={pt.attemptId} className="flex items-center gap-3">
                        <div className="flex flex-col items-center p-2.5 rounded-xl border border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-warm/40 dark:bg-chalkboard-surface/40 min-w-[90px]">
                          <span className="text-[10px] font-mono text-ink-muted">Attempt #{pIdx + 1}</span>
                          <span className="text-base font-extrabold font-mono text-emerald-700 dark:text-emerald-400">
                            {pt.percent}%
                          </span>
                          <span className="text-[9px] font-mono text-ink-muted">{formatDate(pt.submittedAt)}</span>
                        </div>
                        {pIdx < data.diagnosticTrend.length - 1 && (
                          <span className="text-ink-muted font-mono font-bold">→</span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Screen Reader Table */}
                  <div className="sr-only">
                    <table>
                      <caption>Diagnostic assessment trend progression</caption>
                      <thead>
                        <tr>
                          <th>Attempt</th>
                          <th>Score %</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.diagnosticTrend.map((pt, pIdx) => (
                          <tr key={pt.attemptId}>
                            <td>Attempt {pIdx + 1}</td>
                            <td>{pt.percent}%</td>
                            <td>{formatDate(pt.submittedAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </NotebookCard>
              )}

              {/* Attempts Table */}
              {data.attempts.length === 0 ? (
                <NotebookCard className="p-8 text-center text-xs font-mono text-ink-muted">
                  No attempts recorded in this class section yet.
                </NotebookCard>
              ) : (
                <div className="overflow-x-auto rounded-2xl border-2 border-ink/20 dark:border-chalkboard-borderSubtle shadow-notebook">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b-2 border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-warm dark:bg-chalkboard-surface font-mono uppercase text-ink-muted">
                        <th className="py-3 px-3">Assessment</th>
                        <th className="py-3 px-3">Date Submitted</th>
                        <th className="py-3 px-3">Score</th>
                        <th className="py-3 px-3">Percentage</th>
                        <th className="py-3 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink/10 dark:divide-chalkboard-borderSubtle font-mono">
                      {data.attempts.map((att) => (
                        <tr
                          key={att.attemptId}
                          className="hover:bg-highlighter-yellow/10 dark:hover:bg-chalkboard-highlight transition-colors"
                        >
                          <td className="py-3 px-3 font-bold text-ink dark:text-chalkboard-chalk">
                            {att.assessmentTitle}
                          </td>
                          <td className="py-3 px-3 text-ink-muted">
                            {formatDate(att.submittedAt)}
                          </td>
                          <td className="py-3 px-3 text-ink dark:text-chalkboard-chalk">
                            {att.score} / {att.maxScore}
                          </td>
                          <td className="py-3 px-3 font-bold text-emerald-700 dark:text-emerald-400">
                            {att.percent}%
                          </td>
                          <td className="py-3 px-3 text-right">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() =>
                                navigate(
                                  `/teacher/classes/${classId}/students/${studentId}/attempts/${att.attemptId}`
                                )
                              }
                              className="text-xs"
                            >
                              Review & Grade
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* PART 3: PEDAGOGICAL INTERVENTIONS */}
            <div className="space-y-4 pt-4 border-t border-ink/15 dark:border-chalkboard-borderSubtle">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-ink dark:text-chalkboard-chalk flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-redpen dark:text-highlighter-yellow" />
                    <span>Pedagogical Interventions</span>
                    <span className="text-xs font-mono font-normal text-ink-muted">
                      ({data.interventions.length} logged)
                    </span>
                  </h2>
                  <p className="text-xs text-ink-muted dark:text-chalkboard-muted">
                    Private teacher action plans and targeted learning support for this student.
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowLogModal(true)}
                  className="text-xs"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Log Intervention
                </Button>
              </div>

              {data.interventions.length === 0 ? (
                <NotebookCard className="p-8 text-center text-xs font-mono text-ink-muted">
                  No interventions logged yet for this student. Click "Log Intervention" to plan targeted support.
                </NotebookCard>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {data.interventions.map((item) => {
                    const diffFromStart =
                      item.currentMastery != null && item.masteryAtStart != null
                        ? item.currentMastery - item.masteryAtStart
                        : null;

                    let outcomeBadge = (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-ink/10 text-ink-muted border border-ink/20">
                        {item.outcome}
                      </span>
                    );
                    if (item.outcome === 'IMPROVED') {
                      outcomeBadge = (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                          Improved {diffFromStart != null ? `(+${diffFromStart}%)` : ''}
                        </span>
                      );
                    } else if (item.outcome === 'DECLINED') {
                      outcomeBadge = (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-redpen-soft text-redpen-dark border border-redpen/30">
                          Declined {diffFromStart != null ? `(${diffFromStart}%)` : ''}
                        </span>
                      );
                    } else if (item.outcome === 'SAME') {
                      outcomeBadge = (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300">
                          Stable {diffFromStart != null ? `(${diffFromStart >= 0 ? '+' : ''}${diffFromStart}%)` : ''}
                        </span>
                      );
                    } else if (item.outcome === 'NO_NEW_DATA') {
                      outcomeBadge = (
                        <span
                          title="Waiting for the student's next quiz"
                          className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-ink/10 text-ink-muted border border-ink/20 inline-flex items-center gap-1"
                        >
                          <Clock className="w-3 h-3 text-ink-muted" />
                          Waiting for next quiz
                        </span>
                      );
                    }

                    return (
                      <NotebookCard
                        key={item.id}
                        className="p-5 border-2 border-ink/15 dark:border-chalkboard-borderSubtle space-y-3 shadow-notebook-sm"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink/10 pb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-ink/10 text-ink dark:text-chalkboard-chalk font-mono text-[10px] font-bold uppercase">
                              {item.type.replace('_', ' ')}
                            </span>
                            <span className="font-bold text-sm text-ink dark:text-chalkboard-chalk">
                              {item.topicName}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {outcomeBadge}
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                                item.status === 'DONE'
                                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                  : item.status === 'CANCELLED'
                                  ? 'bg-ink/10 text-ink-muted border-ink/20'
                                  : 'bg-amber-100 text-amber-900 border-amber-300'
                              }`}
                            >
                              {item.status}
                            </span>
                          </div>
                        </div>

                        {/* Plain text note */}
                        <p className="text-xs font-mono text-ink dark:text-chalkboard-chalk whitespace-pre-wrap leading-relaxed">
                          {item.note}
                        </p>

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-ink/10 text-xs font-mono text-ink-muted">
                          <div className="flex items-center gap-3">
                            <span>
                              Mastery: {item.masteryAtStart != null ? `${item.masteryAtStart}%` : '—'} →{' '}
                              <strong>
                                {item.currentMastery != null ? `${item.currentMastery}%` : '—'}
                              </strong>
                            </span>
                            {item.status === 'DONE' && item.masteryAtCompletion != null && (
                              <span className="text-[11px] text-ink-muted">
                                (at completion: {item.masteryAtCompletion}%
                                {item.changeSinceCompletion != null && (
                                  <span
                                    className={
                                      item.changeSinceCompletion >= 0
                                        ? ' text-emerald-600 font-semibold'
                                        : ' text-redpen font-semibold'
                                    }
                                  >
                                    {` • since: ${item.changeSinceCompletion >= 0 ? '+' : ''}${item.changeSinceCompletion}%`}
                                  </span>
                                )}
                                )
                              </span>
                            )}
                            {item.followUpDate && (
                              <span>• Follow-up: {formatDate(item.followUpDate)}</span>
                            )}
                          </div>

                          {/* Action controls for PLANNED interventions */}
                          {item.status === 'PLANNED' && (
                            <div className="flex items-center gap-1.5">
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleOpenEditIntervention(item)}
                                className="text-xs"
                              >
                                Edit
                              </Button>
                              <Button
                                variant="mint"
                                size="sm"
                                onClick={() =>
                                  setConfirmModal({
                                    open: true,
                                    id: item.id,
                                    status: 'DONE',
                                    title: 'Mark this intervention as DONE?',
                                  })
                                }
                                className="text-xs"
                              >
                                Mark Done
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() =>
                                  setConfirmModal({
                                    open: true,
                                    id: item.id,
                                    status: 'CANCELLED',
                                    title: 'Cancel this intervention?',
                                  })
                                }
                                className="text-xs"
                              >
                                Cancel
                              </Button>
                            </div>
                          )}
                        </div>
                      </NotebookCard>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* Modal: Log Intervention */}
        {showLogModal && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="log-intervention-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-xs"
          >
            <div className="w-full max-w-lg bg-paper-card dark:bg-chalkboard-card border-3 border-ink dark:border-chalkboard-border rounded-2xl p-6 shadow-notebook space-y-4">
              <div className="flex items-center gap-2 text-ink dark:text-chalkboard-chalk">
                <Sparkles className="w-5 h-5 text-redpen dark:text-highlighter-yellow" />
                <h3 id="log-intervention-title" className="text-lg font-bold">
                  Log Pedagogical Intervention
                </h3>
              </div>

              {actionError && (
                <div className="p-3 bg-redpen-soft border border-redpen/30 rounded-xl text-redpen-dark text-xs font-mono">
                  {actionError}
                </div>
              )}

              <form onSubmit={handleCreateIntervention} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-ink-muted mb-1">
                    Target Topic
                  </label>
                  <select
                    value={intervForm.topicId}
                    onChange={(e) =>
                      setIntervForm((prev) => ({ ...prev, topicId: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl border-2 border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-card dark:bg-chalkboard-card text-xs font-mono text-ink dark:text-chalkboard-chalk focus:outline-none focus:border-redpen"
                    required
                  >
                    {data?.topicMasteries?.map((t) => (
                      <option key={t.topicId} value={t.topicId}>
                        {t.name} ({t.status})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono uppercase text-ink-muted mb-1">
                      Intervention Type
                    </label>
                    <select
                      value={intervForm.type}
                      onChange={(e) =>
                        setIntervForm((prev) => ({ ...prev, type: e.target.value }))
                      }
                      className="w-full px-3 py-2 rounded-xl border-2 border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-card dark:bg-chalkboard-card text-xs font-mono text-ink dark:text-chalkboard-chalk focus:outline-none focus:border-redpen"
                    >
                      <option value="ONE_ON_ONE">One-on-One Tutoring</option>
                      <option value="EXTRA_PRACTICE">Extra Practice Challenge</option>
                      <option value="GROUP_SESSION">Small Group Session</option>
                      <option value="OTHER">Other Remediation</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-ink-muted mb-1">
                      Follow-up Date (Optional)
                    </label>
                    <input
                      type="date"
                      min={todayStr}
                      value={intervForm.followUpDate}
                      onChange={(e) =>
                        setIntervForm((prev) => ({ ...prev, followUpDate: e.target.value }))
                      }
                      className="w-full px-3 py-2 rounded-xl border-2 border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-card dark:bg-chalkboard-card text-xs font-mono text-ink dark:text-chalkboard-chalk focus:outline-none focus:border-redpen"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-mono uppercase text-ink-muted">
                      Intervention Note
                    </label>
                    <span className="text-[10px] font-mono text-ink-muted">
                      {intervForm.note.length} / 1000
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    maxLength={1000}
                    value={intervForm.note}
                    onChange={(e) =>
                      setIntervForm((prev) => ({ ...prev, note: e.target.value }))
                    }
                    placeholder="Describe specific learning gaps identified, targeted exercises assigned, or tutoring action points…"
                    className="w-full px-3 py-2 rounded-xl border-2 border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-card dark:bg-chalkboard-card text-xs font-mono text-ink dark:text-chalkboard-chalk focus:outline-none focus:border-redpen"
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowLogModal(false)}
                    disabled={actionLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'Logging…' : 'Log Plan'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Edit Intervention */}
        {editingIntervention && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-intervention-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-xs"
          >
            <div className="w-full max-w-lg bg-paper-card dark:bg-chalkboard-card border-3 border-ink dark:border-chalkboard-border rounded-2xl p-6 shadow-notebook space-y-4">
              <h3 id="edit-intervention-title" className="text-lg font-bold text-ink dark:text-chalkboard-chalk">
                Edit Intervention: {editingIntervention.topicName}
              </h3>

              {actionError && (
                <div className="p-3 bg-redpen-soft border border-redpen/30 rounded-xl text-redpen-dark text-xs font-mono">
                  {actionError}
                </div>
              )}

              <form onSubmit={handleSaveEditIntervention} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-ink-muted mb-1">
                    Follow-up Date
                  </label>
                  <input
                    type="date"
                    min={todayStr}
                    value={editForm.followUpDate}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, followUpDate: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl border-2 border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-card dark:bg-chalkboard-card text-xs font-mono text-ink dark:text-chalkboard-chalk focus:outline-none focus:border-redpen"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-mono uppercase text-ink-muted">
                      Note
                    </label>
                    <span className="text-[10px] font-mono text-ink-muted">
                      {editForm.note.length} / 1000
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    maxLength={1000}
                    value={editForm.note}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, note: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl border-2 border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-card dark:bg-chalkboard-card text-xs font-mono text-ink dark:text-chalkboard-chalk focus:outline-none focus:border-redpen"
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setEditingIntervention(null)}
                    disabled={actionLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'Saving…' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Status Confirmation (Done / Cancel) */}
        {confirmModal.open && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-modal-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-xs"
          >
            <div className="w-full max-w-md bg-paper-card dark:bg-chalkboard-card border-3 border-ink dark:border-chalkboard-border rounded-2xl p-6 shadow-notebook space-y-4">
              <h3 id="confirm-modal-title" className="text-base font-bold text-ink dark:text-chalkboard-chalk">
                {confirmModal.title}
              </h3>
              <p className="text-xs text-ink-muted dark:text-chalkboard-muted leading-relaxed font-mono">
                {confirmModal.status === 'DONE'
                  ? 'Marking this intervention as DONE will stamp the completion timestamp and record the student\'s topic mastery at completion. This action is permanent and cannot be reopened.'
                  : 'Cancelling this intervention will finalize the record as CANCELLED. This action cannot be undone.'}
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setConfirmModal({ open: false, id: null, status: null, title: '' })}
                  disabled={actionLoading}
                >
                  Go Back
                </Button>
                <Button
                  type="button"
                  variant={confirmModal.status === 'DONE' ? 'mint' : 'danger'}
                  size="sm"
                  onClick={handleConfirmStatusChange}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Updating…' : 'Yes, Confirm'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PortalShell>
  );
}

