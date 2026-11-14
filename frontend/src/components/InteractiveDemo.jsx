import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';
import {
  GraduationCap,
  Presentation,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  FileText,
  ExternalLink,
  Plus,
  Users,
  ClipboardCheck,
  Target,
  ShieldCheck,
  FlaskConical,
} from 'lucide-react';
import { demoContent } from '../data/content';
import {
  SectionHeading,
  NotebookTabs,
  NotebookTabPanel,
  SearchInput,
  NotebookTable,
  NotebookTableHead,
  NotebookTableRow,
  NotebookTableHeaderCell,
  NotebookTableCell,
  Button,
} from './NotebookPrimitives';
import {
  StatusBadge as MasteryBadge,
  MasteryBar,
  MASTERY_CONFIG,
} from './MasteryPrimitives';

/**
 * Custom Recharts tooltip matching ClassOverviewTab.jsx.
 */
function DemoTopicChartTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;

  return (
    <div className="p-3 rounded-xl bg-paper-card dark:bg-chalkboard-card border-2 border-ink dark:border-chalkboard-border shadow-notebook-sm text-xs font-mono space-y-1.5">
      <p className="font-sans font-bold text-ink dark:text-chalkboard-chalk">{d.topic}</p>
      <p className="text-ink dark:text-chalkboard-chalk">
        Class Average: <strong>{d.avgMastery}%</strong>
      </p>
      <div className="pt-1 border-t border-ink/10 dark:border-chalkboard-borderSubtle space-y-0.5 text-[11px] text-ink-muted dark:text-chalkboard-muted">
        <div>Strength (≥80%): {d.strengthCount} students</div>
        <div>Developing (60–79%): {d.developingCount} students</div>
        <div className="text-redpen dark:text-red-300 font-bold">
          Learning Gap (&lt;60%): {d.gapCount} students
        </div>
      </div>
    </div>
  );
}

export default function InteractiveDemo({ activeRole = 'student', onChangeRole }) {
  const [searchParams, setSearchParams] = useSearchParams();

  // Sync role, subject, and sub-tab with URL search parameters
  const urlRole = searchParams.get('demo');
  const effectiveRole =
    urlRole === 'teacher' || urlRole === 'student' ? urlRole : activeRole;

  const urlSubject = searchParams.get('demoSubject');
  const activeSubjectKey =
    urlSubject && demoContent.subjects[urlSubject] ? urlSubject : 'cs101';

  const defaultStudentTab = 'workspace';
  const defaultTeacherTab = 'overview';
  const rawDemoTab = searchParams.get('demoTab');

  const studentTabs = [
    { id: 'workspace', label: 'Class Workspace & Study Next', icon: Target },
    { id: 'resources', label: 'Resources & Helpfulness Rating', icon: BookOpen },
    { id: 'results', label: 'Quiz Results & Explanations', icon: ClipboardCheck },
  ];

  const teacherTabs = [
    { id: 'overview', label: 'Overview', icon: Presentation },
    {
      id: 'students',
      label: 'Students',
      icon: Users,
      badge: demoContent.subjects[activeSubjectKey].teacherData.students.length,
    },
    {
      id: 'interventions',
      label: 'Interventions',
      icon: ClipboardCheck,
    },
  ];

  const validStudentTabIds = studentTabs.map((t) => t.id);
  const validTeacherTabIds = teacherTabs.map((t) => t.id);

  const activeSubTab =
    effectiveRole === 'student'
      ? validStudentTabIds.includes(rawDemoTab)
        ? rawDemoTab
        : defaultStudentTab
      : validTeacherTabIds.includes(rawDemoTab)
      ? rawDemoTab
      : defaultTeacherTab;

  const updateDemoParams = (updates) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        Object.entries(updates).forEach(([k, v]) => {
          if (v == null) next.delete(k);
          else next.set(k, v);
        });
        return next;
      },
      { replace: true }
    );
  };

  const handleRoleSwitch = (nextRole) => {
    if (onChangeRole) {
      onChangeRole(nextRole);
    } else {
      updateDemoParams({
        demo: nextRole,
        demoTab: nextRole === 'student' ? defaultStudentTab : defaultTeacherTab,
      });
    }
  };

  const handleSubjectSwitch = (nextSubjectKey) => {
    updateDemoParams({ demoSubject: nextSubjectKey });
  };

  const handleSubTabChange = (nextTabId) => {
    updateDemoParams({ demo: effectiveRole, demoTab: nextTabId });
  };

  // Interactive Student State: Resource completion & 1-5 helpfulness ratings (never inflates mastery)
  const [completedResources, setCompletedResources] = useState({
    'res-c1': true,
    'res-c2': true,
    'res-b1': true,
    'res-b2': true,
  });

  const [resourceRatings, setResourceRatings] = useState({
    'res-c1': 5,
    'res-c2': 4,
    'res-b1': 5,
    'res-b2': 4,
  });

  // Interactive Teacher State: Student search/filter & Interventions table
  const [studentSearch, setStudentSearch] = useState('');
  const [studentBandFilter, setStudentBandFilter] = useState('ALL');
  const [interventionFilter, setInterventionFilter] = useState('ALL');

  const [interventionsBySubject, setInterventionsBySubject] = useState({
    cs101: demoContent.subjects.cs101.teacherData.interventions,
    biology: demoContent.subjects.biology.teacherData.interventions,
  });

  const [newIntStudent, setNewIntStudent] = useState('');
  const [newIntTopic, setNewIntTopic] = useState('');
  const [newIntNote, setNewIntNote] = useState('');

  const currentSubject = demoContent.subjects[activeSubjectKey];
  const teacherData = currentSubject.teacherData;
  const currentInterventions = interventionsBySubject[activeSubjectKey] || [];

  const toggleResourceComplete = (resId) => {
    setCompletedResources((prev) => ({
      ...prev,
      [resId]: !prev[resId],
    }));
  };

  const handleRateResource = (resId, stars) => {
    setResourceRatings((prev) => ({
      ...prev,
      [resId]: stars,
    }));
  };

  const filteredStudents = useMemo(() => {
    const q = studentSearch.trim().toLowerCase();
    return teacherData.students.filter((st) => {
      if (studentBandFilter === 'ATTENTION' && !st.needsAttention) return false;
      if (
        studentBandFilter !== 'ALL' &&
        studentBandFilter !== 'ATTENTION' &&
        st.overallStatus !== studentBandFilter
      ) {
        return false;
      }
      if (q) {
        const hay = `${st.fullName} ${st.email} ${st.weakestTopic}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [teacherData.students, studentSearch, studentBandFilter]);

  const filteredInterventions = useMemo(() => {
    return currentInterventions.filter((item) => {
      if (interventionFilter !== 'ALL' && item.status !== interventionFilter) return false;
      return true;
    });
  }, [currentInterventions, interventionFilter]);

  const activeInterventionsCount = useMemo(
    () => currentInterventions.filter((i) => i.status !== 'COMPLETED').length,
    [currentInterventions]
  );

  const handleAddSampleIntervention = (e) => {
    e.preventDefault();
    if (!newIntNote.trim()) return;
    const studentName = newIntStudent || teacherData.students[0]?.fullName || 'Maya Lin';
    const topicName = newIntTopic || teacherData.weakestTopicName;

    const created = {
      id: `sample-int-${Date.now()}`,
      studentName,
      topicName,
      actionTaken: newIntNote.trim(),
      status: 'PLANNED',
      createdAt: 'Sample • Just now',
    };

    setInterventionsBySubject((prev) => ({
      ...prev,
      [activeSubjectKey]: [created, ...(prev[activeSubjectKey] || [])],
    }));
    setNewIntNote('');
  };

  const handleUpdateInterventionStatus = (id, nextStatus) => {
    setInterventionsBySubject((prev) => ({
      ...prev,
      [activeSubjectKey]: (prev[activeSubjectKey] || []).map((item) =>
        item.id === id ? { ...item, status: nextStatus } : item
      ),
    }));
  };

  const totalResourcesCount = currentSubject.topics.reduce(
    (acc, t) => acc + t.resources.length,
    0
  );
  const completedResourcesCount = currentSubject.topics.reduce(
    (acc, t) =>
      acc + t.resources.filter((r) => completedResources[r.id]).length,
    0
  );

  return (
    <section
      id="demo"
      aria-labelledby="demo-heading"
      className="relative py-16 lg:py-24 bg-ruled-paper notebook-margin-line border-b-2 border-ink/15 dark:border-chalkboard-borderSubtle"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pl-10 sm:pl-14 lg:pl-16 space-y-8">
        <SectionHeading
          id="demo-heading"
          label={demoContent.sectionLabel}
          headline={demoContent.headline}
          subheadline={demoContent.subheadline}
        />

        {/* Sample Data Honesty & Controls Header Bar */}
        <div className="p-4 sm:p-5 rounded-2xl bg-paper-card dark:bg-chalkboard-card border-2 border-ink dark:border-chalkboard-border shadow-notebook-sm space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Role Switcher */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded-md bg-highlighter-yellow text-ink font-mono text-xs font-extrabold uppercase tracking-wider border border-ink/25">
                Sample Data
              </span>
              <div
                role="group"
                aria-label="Choose interactive demo perspective"
                className="inline-flex rounded-xl bg-paper-warm dark:bg-chalkboard-surface p-1 border-2 border-ink dark:border-chalkboard-border"
              >
                <button
                  type="button"
                  onClick={() => handleRoleSwitch('student')}
                  aria-pressed={effectiveRole === 'student'}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-redpen ${
                    effectiveRole === 'student'
                      ? 'bg-redpen text-white shadow-xs'
                      : 'text-ink dark:text-chalkboard-chalk hover:bg-paper-card dark:hover:bg-chalkboard-card'
                  }`}
                >
                  <GraduationCap className="w-4 h-4" aria-hidden="true" />
                  <span>Student Workspace</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleSwitch('teacher')}
                  aria-pressed={effectiveRole === 'teacher'}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-redpen ${
                    effectiveRole === 'teacher'
                      ? 'bg-ink text-paper dark:bg-highlighter-yellow dark:text-ink shadow-xs'
                      : 'text-ink dark:text-chalkboard-chalk hover:bg-paper-card dark:hover:bg-chalkboard-card'
                  }`}
                >
                  <Presentation className="w-4 h-4" aria-hidden="true" />
                  <span>Teacher Class Page</span>
                </button>
              </div>
            </div>

            {/* Subject Switcher (Seeded CS101 vs Teacher-Owned Private Subject) */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase text-ink-muted dark:text-chalkboard-muted">
                Sample Class:
              </span>
              <div
                role="group"
                aria-label="Switch sample class subject"
                className="inline-flex flex-wrap gap-1.5"
              >
                {Object.values(demoContent.subjects).map((subj) => {
                  const isSelected = activeSubjectKey === subj.id;
                  return (
                    <button
                      key={subj.id}
                      type="button"
                      onClick={() => handleSubjectSwitch(subj.id)}
                      aria-pressed={isSelected}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border-2 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-redpen ${
                        isSelected
                          ? 'bg-highlighter-mint text-ink border-ink shadow-notebook-sm'
                          : 'bg-paper-warm dark:bg-chalkboard-surface text-ink-muted dark:text-chalkboard-muted border-ink/20 dark:border-chalkboard-borderSubtle hover:text-ink dark:hover:text-chalkboard-chalk'
                      }`}
                    >
                      {subj.code} ({subj.ownershipBadge})
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Shared Mastery Band Legend */}
          <div className="pt-3 border-t border-ink/10 dark:border-chalkboard-borderSubtle flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              <span className="font-bold text-ink-muted dark:text-chalkboard-muted uppercase text-[11px]">
                Mastery Bands:
              </span>
              {Object.entries(MASTERY_CONFIG).map(([key, cfg]) => (
                <span key={key} className="inline-flex items-center gap-1">
                  <MasteryBadge status={key} size="sm" />
                  <span className="text-[11px] text-ink-muted dark:text-chalkboard-muted">
                    ({key === 'STRENGTH' ? '≥80%' : key === 'DEVELOPING' ? '60–79%' : key === 'GAP' ? '<60%' : '<3 qs'})
                  </span>
                </span>
              ))}
            </div>
            <span className="text-[11px] font-mono text-ink-muted dark:text-chalkboard-muted">
              Rule-based grading • One mastery profile per student per class
            </span>
          </div>
        </div>

        {/* ================================================================= */}
        {/* STUDENT DEMO VIEW (Mirrors SubjectDashboard.jsx & AttemptResult) */}
        {/* ================================================================= */}
        {effectiveRole === 'student' ? (
          <div className="rounded-2xl bg-paper-card dark:bg-chalkboard-card border-2 border-ink dark:border-chalkboard-border shadow-lifted overflow-hidden">
            {/* Student Class Workspace Header */}
            <div className="p-5 sm:p-6 bg-paper-warm dark:bg-chalkboard-surface border-b-2 border-ink dark:border-chalkboard-borderSubtle flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                  <span className="px-2 py-0.5 rounded bg-highlighter-yellow text-ink font-bold uppercase border border-ink/20">
                    Sample Data
                  </span>
                  <span className="px-2 py-0.5 rounded bg-paper-card dark:bg-chalkboard-card text-ink dark:text-chalkboard-chalk font-bold border border-ink/20">
                    {currentSubject.ownershipBadge}
                  </span>
                  <span className="text-ink-muted dark:text-chalkboard-muted">
                    {currentSubject.className} • Instructor: {currentSubject.teacherName}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-ink dark:text-chalkboard-chalk">
                  {currentSubject.name}
                </h3>
                <p className="text-xs font-mono text-ink-muted dark:text-chalkboard-muted">
                  Student: <strong className="text-ink dark:text-chalkboard-chalk">{currentSubject.studentName}</strong> • {currentSubject.lastUpdated}
                </p>
              </div>

              <div className="flex items-center gap-4 self-start md:self-auto bg-paper-card dark:bg-chalkboard-card px-4 py-3 rounded-xl border-2 border-ink dark:border-chalkboard-border">
                <div>
                  <span className="text-[10px] font-mono uppercase text-ink-muted dark:text-chalkboard-muted block">
                    Class Mastery Average
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-2xl font-extrabold font-mono text-ink dark:text-chalkboard-chalk">
                      {currentSubject.overallMastery}%
                    </span>
                    <MasteryBadge status={currentSubject.overallStatus} size="xs" />
                  </div>
                </div>
              </div>
            </div>

            {/* Student Sub-Tabs (Keyboard Operable) */}
            <div className="p-4 sm:p-6 space-y-6">
              <NotebookTabs
                tabs={studentTabs}
                activeTab={activeSubTab}
                onTabChange={handleSubTabChange}
                ariaLabel="Student workspace demo tabs"
              />

              {/* STUDENT TAB 1: CLASS WORKSPACE & STUDY NEXT */}
              <NotebookTabPanel id="workspace" activeTab={activeSubTab} className="space-y-6">
                {/* Study Next ("Focus on") Priority Card */}
                <div className="p-5 rounded-2xl bg-redpen-soft/40 dark:bg-red-950/30 border-2 border-redpen/50 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-redpen dark:text-red-400" aria-hidden="true" />
                      <span className="text-xs font-mono font-extrabold uppercase tracking-wider text-redpen dark:text-red-300">
                        Study Next • Focus Topic
                      </span>
                    </div>
                    <MasteryBadge status={currentSubject.focusTopic.status} size="xs" />
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="text-lg font-extrabold text-ink dark:text-chalkboard-chalk">
                        Focus on: {currentSubject.focusTopic.name} ({currentSubject.focusTopic.mastery}%)
                      </h4>
                      <p className="text-xs sm:text-sm text-ink-muted dark:text-chalkboard-muted leading-relaxed">
                        {currentSubject.focusTopic.reason}
                      </p>
                      <p className="text-xs font-mono text-ink dark:text-chalkboard-chalk pt-1">
                        Recommended Assessment: <strong>{currentSubject.focusTopic.recommendedQuiz}</strong>
                      </p>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleSubTabChange('resources')}
                      className="shrink-0 font-mono text-xs"
                    >
                      <BookOpen className="w-3.5 h-3.5 mr-1" />
                      <span>Open Topic Resources</span>
                    </Button>
                  </div>
                </div>

                {/* Per-Topic Strengths & Gaps Table/Cards */}
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-sm font-mono font-bold uppercase tracking-wider text-ink dark:text-chalkboard-chalk">
                      Per-Topic Mastery Breakdown ({currentSubject.topics.length} Topics)
                    </h4>
                    <span className="text-xs font-mono text-ink-muted dark:text-chalkboard-muted">
                      Requires ≥ 3 distinct questions answered per topic
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentSubject.topics.map((t) => (
                      <div
                        key={t.id}
                        className="p-4 rounded-2xl border-2 border-ink/20 dark:border-chalkboard-borderSubtle bg-paper/70 dark:bg-chalkboard-surface/50 flex flex-col justify-between gap-3"
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <h5 className="font-bold text-sm sm:text-base text-ink dark:text-chalkboard-chalk">
                              {t.topic}
                            </h5>
                            <MasteryBadge status={t.status} size="xs" />
                          </div>

                          <div className="flex items-center justify-between text-xs font-mono text-ink-muted dark:text-chalkboard-muted">
                            <span>Questions answered: {t.questionsAnswered} ({t.lastScore})</span>
                            <span className="font-bold text-ink dark:text-chalkboard-chalk">
                              {t.mastery != null ? `${t.mastery}%` : '— (Need ≥ 3 qs)'}
                            </span>
                          </div>

                          <MasteryBar
                            percent={t.mastery}
                            status={t.status}
                            showLabel={false}
                          />

                          <p className="text-xs text-ink-muted dark:text-chalkboard-muted leading-relaxed pt-1">
                            {t.feedback}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-ink/10 dark:border-chalkboard-borderSubtle flex items-center justify-between text-xs font-mono">
                          <span className="text-ink-muted dark:text-chalkboard-muted">
                            {t.resources.length} study resource(s)
                          </span>
                          <button
                            type="button"
                            onClick={() => handleSubTabChange('resources')}
                            className="font-bold text-ink-blue dark:text-highlighter-mint hover:underline cursor-pointer"
                          >
                            View resources →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </NotebookTabPanel>

              {/* STUDENT TAB 2: RECOMMENDED RESOURCES & HELPFULNESS RATING */}
              <NotebookTabPanel id="resources" activeTab={activeSubTab} className="space-y-5">
                <div className="p-4 rounded-xl bg-paper-warm dark:bg-chalkboard-surface border border-ink/20 dark:border-chalkboard-borderSubtle flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5">
                    <p className="font-bold text-ink dark:text-chalkboard-chalk">
                      Teacher-Uploaded File Resources (PDF &amp; DOCX) and Web Links
                    </p>
                    <p className="text-ink-muted dark:text-chalkboard-muted">
                      Checking off a resource tracks your study progress ({completedResourcesCount} of {totalResourcesCount} completed) and lets you rate its helpfulness (1–5 stars). Mastery scores only change when you submit a quiz.
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-paper-card dark:bg-chalkboard-card border border-ink/20 font-mono font-bold text-ink dark:text-chalkboard-chalk shrink-0">
                    Completed: {completedResourcesCount} / {totalResourcesCount}
                  </span>
                </div>

                <div className="space-y-4">
                  {currentSubject.topics.map((t) => (
                    <div
                      key={t.id}
                      className="p-4 rounded-2xl border-2 border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-card dark:bg-chalkboard-card space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <h5 className="font-bold text-sm text-ink dark:text-chalkboard-chalk">
                            {t.topic}
                          </h5>
                          <MasteryBadge status={t.status} size="xs" />
                        </div>
                        <span className="text-xs font-mono font-bold text-ink dark:text-chalkboard-chalk">
                          {t.mastery != null ? `Mastery: ${t.mastery}%` : 'Insufficient Data (< 3 qs)'}
                        </span>
                      </div>

                      <div className="space-y-2">
                        {t.resources.map((res) => {
                          const isDone = Boolean(completedResources[res.id]);
                          const currentRating = resourceRatings[res.id] || 0;

                          return (
                            <div
                              key={res.id}
                              className={`p-3 rounded-xl border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                                isDone
                                  ? 'bg-highlighter-mintSoft/50 dark:bg-emerald-950/20 border-emerald-500/40'
                                  : 'bg-paper-warm/50 dark:bg-chalkboard-surface/60 border-ink/15 dark:border-chalkboard-borderSubtle'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <input
                                  id={`demo-res-${res.id}`}
                                  type="checkbox"
                                  checked={isDone}
                                  onChange={() => toggleResourceComplete(res.id)}
                                  className="mt-1 w-4 h-4 rounded border-ink text-ink-blue focus:ring-redpen cursor-pointer"
                                />
                                <div>
                                  <label
                                    htmlFor={`demo-res-${res.id}`}
                                    className={`text-xs sm:text-sm font-bold cursor-pointer ${
                                      isDone
                                        ? 'line-through text-ink-muted dark:text-chalkboard-muted'
                                        : 'text-ink dark:text-chalkboard-chalk'
                                    }`}
                                  >
                                    {res.title}
                                  </label>
                                  <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] font-mono text-ink-muted dark:text-chalkboard-muted">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-paper-card dark:bg-chalkboard-card border border-ink/15 font-bold text-ink dark:text-chalkboard-chalk">
                                      {res.type === 'LINK' ? (
                                        <ExternalLink className="w-3 h-3" aria-hidden="true" />
                                      ) : (
                                        <FileText className="w-3 h-3" aria-hidden="true" />
                                      )}
                                      {res.type}
                                    </span>
                                    <span>{res.sizeLabel}</span>
                                    <span>• Status: {isDone ? 'COMPLETED' : 'NOT_STARTED'}</span>
                                  </div>
                                </div>
                              </div>

                              {/* 1-5 Star Helpfulness Rating */}
                              <div className="flex items-center gap-1.5 self-end sm:self-center">
                                <span className="text-[11px] font-mono text-ink-muted dark:text-chalkboard-muted mr-1">
                                  Helpful?
                                </span>
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    type="button"
                                    onClick={() => handleRateResource(res.id, star)}
                                    aria-label={`Rate ${res.title} ${star} out of 5 stars`}
                                    aria-pressed={currentRating === star}
                                    className={`w-6 h-6 rounded-md text-xs font-mono font-bold border transition-colors cursor-pointer ${
                                      star <= currentRating
                                        ? 'bg-highlighter-yellow text-ink border-ink'
                                        : 'bg-paper-card dark:bg-chalkboard-card text-ink-muted dark:text-chalkboard-muted border-ink/20'
                                    }`}
                                  >
                                    {star}
                                  </button>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </NotebookTabPanel>

              {/* STUDENT TAB 3: QUIZ RESULTS & EXPLANATIONS (Mirrors AttemptResult.jsx) */}
              <NotebookTabPanel id="results" activeTab={activeSubTab} className="space-y-4">
                <div className="p-4 rounded-xl bg-paper-warm dark:bg-chalkboard-surface border-2 border-ink/20 dark:border-chalkboard-borderSubtle flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="font-extrabold text-sm sm:text-base text-ink dark:text-chalkboard-chalk">
                      {currentSubject.sampleAttempt.assessmentTitle}
                    </h4>
                    <p className="text-xs font-mono text-ink-muted dark:text-chalkboard-muted">
                      {currentSubject.sampleAttempt.submittedAt}
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-highlighter-yellow text-ink font-mono text-xs font-bold border border-ink/20 self-start sm:self-center">
                    Difficulty-Weighted Rule Grading
                  </span>
                </div>

                <div className="space-y-3">
                  {currentSubject.sampleAttempt.questions.map((q, idx) => (
                    <div
                      key={q.id}
                      className="p-4 rounded-2xl border-2 border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-card dark:bg-chalkboard-card space-y-2.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-ink dark:text-chalkboard-chalk">
                            Question {idx + 1}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-paper-warm dark:bg-chalkboard-surface border border-ink/15 text-ink dark:text-chalkboard-chalk">
                            {q.topicName}
                          </span>
                          <span className="text-ink-muted dark:text-chalkboard-muted">
                            Difficulty: {q.difficulty} ({q.weight})
                          </span>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold ${
                            q.isCorrect
                              ? 'bg-highlighter-mintSoft dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border border-emerald-400 dark:border-emerald-700'
                              : 'bg-redpen-soft dark:bg-red-950/60 text-redpen-dark dark:text-red-300 border border-redpen/30 dark:border-red-500/50'
                          }`}
                        >
                          {q.isCorrect ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>Correct</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>Incorrect</span>
                            </>
                          )}
                        </span>
                      </div>

                      <p className="text-sm font-bold text-ink dark:text-chalkboard-chalk">
                        {q.prompt}
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                        <div className="p-2.5 rounded-lg bg-paper-warm/60 dark:bg-chalkboard-surface border border-ink/15">
                          <span className="text-ink-muted dark:text-chalkboard-muted block text-[10px] uppercase">
                            Student Answer:
                          </span>
                          <span className="font-bold text-ink dark:text-chalkboard-chalk">
                            {q.selectedChoice}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-highlighter-mintSoft/40 dark:bg-emerald-950/20 border border-emerald-500/30">
                          <span className="text-ink-muted dark:text-chalkboard-muted block text-[10px] uppercase">
                            Correct Answer:
                          </span>
                          <span className="font-bold text-ink dark:text-chalkboard-chalk">
                            {q.correctChoice}
                          </span>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-paper-warm dark:bg-chalkboard-surface border border-ink/15 dark:border-chalkboard-borderSubtle text-xs text-ink-muted dark:text-chalkboard-muted leading-relaxed">
                        <strong className="text-ink dark:text-chalkboard-chalk">Explanation: </strong>
                        {q.explanation}
                      </div>
                    </div>
                  ))}
                </div>
              </NotebookTabPanel>
            </div>
          </div>
        ) : (
          /* ================================================================= */
          /* TEACHER DEMO VIEW (Mirrors TeacherClassDetail.jsx)                */
          /* ================================================================= */
          <div className="rounded-2xl bg-paper-card dark:bg-chalkboard-card border-2 border-ink dark:border-chalkboard-border shadow-lifted overflow-hidden">
            {/* Slim Teacher Class Control Bar (Join Code, Institution Code, Validation Lab Pill) */}
            <div className="p-5 sm:p-6 bg-paper-warm dark:bg-chalkboard-surface border-b-2 border-ink dark:border-chalkboard-borderSubtle flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                  <span className="px-2 py-0.5 rounded bg-highlighter-yellow text-ink font-bold uppercase border border-ink/20">
                    Sample Data
                  </span>
                  <span className="px-2 py-0.5 rounded bg-paper-card dark:bg-chalkboard-card text-ink dark:text-chalkboard-chalk font-bold border border-ink/20">
                    {currentSubject.ownershipBadge}
                  </span>
                  <span className="text-ink-muted dark:text-chalkboard-muted">
                    {currentSubject.institutionLabel} • Admin-Approved Teacher
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-ink dark:text-chalkboard-chalk">
                  {currentSubject.className} — {currentSubject.name}
                </h3>
                <p className="text-xs font-mono text-ink-muted dark:text-chalkboard-muted">
                  Instructor: <strong className="text-ink dark:text-chalkboard-chalk">{currentSubject.teacherName}</strong> • Per-Class Mastery Ledger
                </p>
              </div>

              {/* Teacher-Only Join Code & Validation Lab Badge */}
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="px-3.5 py-2 rounded-xl bg-paper-card dark:bg-chalkboard-card border-2 border-ink dark:border-chalkboard-border text-xs font-mono">
                  <span className="text-[10px] uppercase text-ink-muted dark:text-chalkboard-muted block">
                    Class Join Code (Teacher-Only)
                  </span>
                  <span className="font-extrabold text-sm tracking-widest text-ink dark:text-chalkboard-chalk">
                    {currentSubject.joinCode}
                  </span>
                </div>
                <div className="px-3.5 py-2 rounded-xl bg-highlighter-mintSoft dark:bg-emerald-950/40 border-2 border-ink dark:border-chalkboard-border text-xs font-mono">
                  <span className="text-[10px] uppercase text-ink-muted dark:text-chalkboard-muted block">
                    Blind Validation Lab
                  </span>
                  <span className="font-bold text-ink dark:text-chalkboard-chalk flex items-center gap-1">
                    <FlaskConical className="w-3.5 h-3.5 text-ink-blue" aria-hidden="true" />
                    3 Topics/Student • 30-Student Gate
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6 space-y-6">
              {/* Teacher Tabs (Mirrors TeacherClassDetail.jsx) */}
              <NotebookTabs
                tabs={teacherTabs}
                activeTab={activeSubTab}
                onTabChange={handleSubTabChange}
                ariaLabel="Teacher class page demo tabs"
              />

              {/* TEACHER TAB 1: OVERVIEW (4 KPI Cards + 60% & 80% Bar Chart) */}
              <NotebookTabPanel id="overview" activeTab={activeSubTab} className="space-y-6">
                {/* 4 KPI Cards matching TeacherClassDetail / ClassOverviewTab */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  <div className="p-4 rounded-2xl border-2 border-ink dark:border-chalkboard-border bg-paper-warm/40 dark:bg-chalkboard-surface">
                    <span className="text-[11px] font-mono font-bold uppercase text-ink-muted dark:text-chalkboard-muted block">
                      Average Mastery
                    </span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-2xl font-extrabold font-mono text-ink dark:text-chalkboard-chalk">
                        {teacherData.classAverageMastery}%
                      </span>
                      <MasteryBadge status="DEVELOPING" size="xs" />
                    </div>
                    <span className="text-[11px] font-mono text-ink-muted dark:text-chalkboard-muted mt-1 block">
                      Across {teacherData.totalStudents} enrolled students
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl border-2 border-ink dark:border-chalkboard-border bg-paper-warm/40 dark:bg-chalkboard-surface">
                    <span className="text-[11px] font-mono font-bold uppercase text-ink-muted dark:text-chalkboard-muted block">
                      Needs Attention
                    </span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-2xl font-extrabold font-mono text-redpen dark:text-red-400">
                        {teacherData.studentsNeedingAttention} / {teacherData.totalStudents}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-ink-muted dark:text-chalkboard-muted mt-1 block">
                      Students with ≥ 1 topic &lt; 60%
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl border-2 border-ink dark:border-chalkboard-border bg-paper-warm/40 dark:bg-chalkboard-surface">
                    <span className="text-[11px] font-mono font-bold uppercase text-ink-muted dark:text-chalkboard-muted block">
                      Weakest Topic
                    </span>
                    <div className="mt-1">
                      <span className="text-sm font-extrabold text-ink dark:text-chalkboard-chalk line-clamp-1">
                        {teacherData.weakestTopicName}
                      </span>
                      <span className="text-xs font-mono font-bold text-redpen dark:text-red-400 block">
                        {teacherData.weakestTopicAvg}% Class Avg (&lt; 60% Gap)
                      </span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl border-2 border-ink dark:border-chalkboard-border bg-paper-warm/40 dark:bg-chalkboard-surface">
                    <span className="text-[11px] font-mono font-bold uppercase text-ink-muted dark:text-chalkboard-muted block">
                      Active Interventions
                    </span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-2xl font-extrabold font-mono text-ink dark:text-chalkboard-chalk">
                        {activeInterventionsCount}
                      </span>
                      <span className="text-xs font-mono text-ink-muted dark:text-chalkboard-muted">
                        ({currentInterventions.length} total logged)
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-ink-muted dark:text-chalkboard-muted mt-1 block">
                      Teacher-only • Never visible to students
                    </span>
                  </div>
                </div>

                {/* Per-Topic Bar Chart with 60% Gap and 80% Strength Reference Lines */}
                <div className="p-5 rounded-2xl border-2 border-ink dark:border-chalkboard-border bg-paper-card dark:bg-chalkboard-card space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-base font-extrabold text-ink dark:text-chalkboard-chalk">
                        Per-Topic Class Mastery Distribution (Sample Data)
                      </h4>
                      <p className="text-xs font-mono text-ink-muted dark:text-chalkboard-muted">
                        Dashed reference lines mark the <strong>60% Learning Gap</strong> threshold and <strong>80% Strength</strong> threshold.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-3 h-0.5 bg-emerald-600 inline-block" />
                        <span>80% Strength Line</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-3 h-0.5 bg-redpen inline-block" />
                        <span>60% Gap Line</span>
                      </span>
                    </div>
                  </div>

                  <div className="h-64 w-full" role="region" aria-label="Sample Per-Topic Class Mastery Bar Chart">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={teacherData.topicChart}
                        margin={{ top: 14, right: 24, left: 0, bottom: 8 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(27,37,52,0.12)" />
                        <XAxis
                          dataKey="shortName"
                          tick={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', fill: '#4A5568' }}
                        />
                        <YAxis
                          domain={[0, 100]}
                          tickFormatter={(v) => `${v}%`}
                          tick={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', fill: '#4A5568' }}
                        />
                        <Tooltip content={<DemoTopicChartTooltip />} />
                        <ReferenceLine
                          y={80}
                          stroke="#059669"
                          strokeDasharray="4 4"
                          strokeWidth={1.75}
                          label={{
                            value: '80% Strength',
                            position: 'right',
                            fill: '#059669',
                            fontSize: 10,
                            fontFamily: 'JetBrains Mono, monospace',
                          }}
                        />
                        <ReferenceLine
                          y={60}
                          stroke="#D93829"
                          strokeDasharray="5 5"
                          strokeWidth={1.75}
                          label={{
                            value: '60% Gap',
                            position: 'right',
                            fill: '#D93829',
                            fontSize: 10,
                            fontFamily: 'JetBrains Mono, monospace',
                          }}
                        />
                        <Bar dataKey="avgMastery" radius={[6, 6, 0, 0]} maxBarSize={48}>
                          {teacherData.topicChart.map((entry) => {
                            const fill =
                              entry.avgMastery < 60
                                ? '#D93829'
                                : entry.avgMastery < 80
                                ? '#F59E0B'
                                : '#10B981';
                            return <Cell key={entry.topic} fill={fill} />;
                          })}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Accessible table fallback for screen readers */}
                  <div className="sr-only">
                    <table>
                      <caption>Per-Topic Class Mastery Summary (Sample Data)</caption>
                      <thead>
                        <tr>
                          <th>Topic</th>
                          <th>Average Mastery</th>
                          <th>Gap Students (&lt;60%)</th>
                          <th>Developing Students (60-79%)</th>
                          <th>Strength Students (≥80%)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {teacherData.topicChart.map((row) => (
                          <tr key={row.topic}>
                            <td>{row.topic}</td>
                            <td>{row.avgMastery}%</td>
                            <td>{row.gapCount}</td>
                            <td>{row.developingCount}</td>
                            <td>{row.strengthCount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Teacher Product Honesty Strip: Local AI Drafting & Blind Validation Lab */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-paper-warm dark:bg-chalkboard-surface border border-ink/20 dark:border-chalkboard-borderSubtle text-xs space-y-1">
                    <p className="font-bold text-ink dark:text-chalkboard-chalk flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-ink-blue" aria-hidden="true" />
                      <span>Local AI Question Drafting (Off by Default • Teacher Reviewed)</span>
                    </p>
                    <p className="text-ink-muted dark:text-chalkboard-muted leading-relaxed">
                      In the Subject Workspace, teachers can upload PDF or DOCX resources and optionally draft multiple-choice questions on a local model. Every draft includes a verbatim evidence quote and stays in a review queue—nothing AI-drafted reaches students without teacher approval, and AI never grades students.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-paper-warm dark:bg-chalkboard-surface border border-ink/20 dark:border-chalkboard-borderSubtle text-xs space-y-1">
                    <p className="font-bold text-ink dark:text-chalkboard-chalk flex items-center gap-1.5">
                      <FlaskConical className="w-4 h-4 text-redpen" aria-hidden="true" />
                      <span>Blind Validation Lab &amp; Project Targets</span>
                    </p>
                    <p className="text-ink-muted dark:text-chalkboard-muted leading-relaxed">
                      Teachers blindly label 3 random eligible topics per student as WEAK or NOT WEAK. Preliminary metrics appear from the first label, while certifying project evaluation targets (≥ 85% agreement on ≥ 30 students, ≥ 80% helpfulness rated 4–5, ≥ 4.0 / 5.0 usability) requires meeting each sample gate.
                    </p>
                  </div>
                </div>
              </NotebookTabPanel>

              {/* TEACHER TAB 2: STUDENTS TABLE (Mirrors ClassStudentsTab.jsx) */}
              <NotebookTabPanel id="students" activeTab={activeSubTab} className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <SearchInput
                    id="demo-teacher-student-search"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    onClear={() => setStudentSearch('')}
                    placeholder="Search sample students by name, email, or topic…"
                    ariaLabel="Search sample students"
                    className="w-full sm:w-80"
                  />

                  <div className="flex flex-wrap items-center gap-1.5">
                    {[
                      { id: 'ALL', label: 'All' },
                      { id: 'ATTENTION', label: 'Needs Attention' },
                      { id: 'GAP', label: 'Learning Gap (<60%)' },
                      { id: 'DEVELOPING', label: 'Developing (60–79%)' },
                      { id: 'STRENGTH', label: 'Strength (≥80%)' },
                      { id: 'INSUFFICIENT_DATA', label: 'Insufficient Data' },
                    ].map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setStudentBandFilter(f.id)}
                        aria-pressed={studentBandFilter === f.id}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                          studentBandFilter === f.id
                            ? 'bg-ink text-white dark:bg-highlighter-mint dark:text-ink font-bold'
                            : 'bg-paper-warm dark:bg-chalkboard-surface text-ink-muted dark:text-chalkboard-muted hover:text-ink'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                <NotebookTable>
                  <NotebookTableHead>
                    <NotebookTableRow hover={false}>
                      <NotebookTableHeaderCell>Student</NotebookTableHeaderCell>
                      <NotebookTableHeaderCell>Overall Mastery</NotebookTableHeaderCell>
                      <NotebookTableHeaderCell>Weakest Topic</NotebookTableHeaderCell>
                      <NotebookTableHeaderCell align="center">Gap Topics</NotebookTableHeaderCell>
                      <NotebookTableHeaderCell align="center">Quizzes</NotebookTableHeaderCell>
                      <NotebookTableHeaderCell align="right">Status Flag</NotebookTableHeaderCell>
                    </NotebookTableRow>
                  </NotebookTableHead>
                  <tbody className="divide-y divide-ink/10 dark:divide-chalkboard-borderSubtle">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-xs font-mono text-ink-muted dark:text-chalkboard-muted">
                          No sample students match your search or filter.
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((st) => (
                      <NotebookTableRow key={st.id}>
                        <NotebookTableCell>
                          <div className="font-sans font-bold text-ink dark:text-chalkboard-chalk">
                            {st.fullName}
                          </div>
                          <div className="text-[11px] font-mono text-ink-muted dark:text-chalkboard-muted">
                            {st.email}
                          </div>
                        </NotebookTableCell>
                        <NotebookTableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-ink dark:text-chalkboard-chalk">
                              {st.overallMastery != null ? `${st.overallMastery}%` : '—'}
                            </span>
                            <MasteryBadge status={st.overallStatus} size="xs" />
                          </div>
                        </NotebookTableCell>
                        <NotebookTableCell className="text-ink dark:text-chalkboard-chalk">
                          {st.weakestTopic}
                        </NotebookTableCell>
                        <NotebookTableCell align="center" className="font-bold">
                          {st.gapTopicsCount}
                        </NotebookTableCell>
                        <NotebookTableCell align="center">
                          {st.attemptsCount}
                        </NotebookTableCell>
                        <NotebookTableCell align="right">
                          {st.needsAttention ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-redpen-soft dark:bg-red-950/60 text-redpen-dark dark:text-red-300 border border-redpen/30 dark:border-red-500/50">
                              <AlertCircle className="w-3 h-3" aria-hidden="true" />
                              Needs Attention
                            </span>
                          ) : (
                            <span className="text-xs font-mono text-ink-muted dark:text-chalkboard-muted">
                              On Track
                            </span>
                          )}
                        </NotebookTableCell>
                      </NotebookTableRow>
                      ))
                    )}
                  </tbody>
                </NotebookTable>
              </NotebookTabPanel>

              {/* TEACHER TAB 3: INTERVENTIONS TABLE (Mirrors ClassInterventionsTab.jsx) */}
              <NotebookTabPanel id="interventions" activeTab={activeSubTab} className="space-y-4">
                <div className="p-3.5 rounded-xl bg-paper-warm dark:bg-chalkboard-surface border border-ink/20 dark:border-chalkboard-borderSubtle flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <span className="text-ink-muted dark:text-chalkboard-muted">
                    <strong className="text-ink dark:text-chalkboard-chalk">Teacher-Only Intervention Log:</strong> Interventions record small-group or 1-on-1 instructional support and are never visible to students.
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {['ALL', 'PLANNED', 'IN_PROGRESS', 'COMPLETED'].map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setInterventionFilter(st)}
                        aria-pressed={interventionFilter === st}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-mono cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-redpen ${
                          interventionFilter === st
                            ? 'bg-ink text-paper-card dark:bg-highlighter-mint dark:text-ink font-bold'
                            : 'bg-paper-card dark:bg-chalkboard-card text-ink-muted dark:text-chalkboard-muted'
                        }`}
                      >
                        {st.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Inline Sample Intervention Logger */}
                <form
                  onSubmit={handleAddSampleIntervention}
                  className="p-4 rounded-2xl border-2 border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-warm/40 dark:bg-chalkboard-surface/40 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end"
                >
                  <div className="sm:col-span-3">
                    <label
                      htmlFor="demo-int-student"
                      className="block text-[11px] font-mono font-bold uppercase text-ink-muted dark:text-chalkboard-muted mb-1"
                    >
                      Student
                    </label>
                    <select
                      id="demo-int-student"
                      value={newIntStudent}
                      onChange={(e) => setNewIntStudent(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-xl border border-ink/25 dark:border-chalkboard-borderSubtle bg-paper-card dark:bg-chalkboard-card text-xs font-mono text-ink dark:text-chalkboard-chalk"
                    >
                      {teacherData.students.map((s) => (
                        <option key={s.id} value={s.fullName}>
                          {s.fullName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-3">
                    <label
                      htmlFor="demo-int-topic"
                      className="block text-[11px] font-mono font-bold uppercase text-ink-muted dark:text-chalkboard-muted mb-1"
                    >
                      Topic
                    </label>
                    <select
                      id="demo-int-topic"
                      value={newIntTopic}
                      onChange={(e) => setNewIntTopic(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-xl border border-ink/25 dark:border-chalkboard-borderSubtle bg-paper-card dark:bg-chalkboard-card text-xs font-mono text-ink dark:text-chalkboard-chalk"
                    >
                      {currentSubject.topics.map((t) => (
                        <option key={t.id} value={t.topic}>
                          {t.topic}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-4">
                    <label
                      htmlFor="demo-int-note"
                      className="block text-[11px] font-mono font-bold uppercase text-ink-muted dark:text-chalkboard-muted mb-1"
                    >
                      Action Taken (Sample)
                    </label>
                    <input
                      id="demo-int-note"
                      type="text"
                      value={newIntNote}
                      onChange={(e) => setNewIntNote(e.target.value)}
                      placeholder="e.g., 10-min pointer trace review…"
                      className="w-full px-3 py-2 rounded-xl border border-ink/25 dark:border-chalkboard-borderSubtle bg-paper-card dark:bg-chalkboard-card text-xs font-sans text-ink dark:text-chalkboard-chalk"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Button type="submit" variant="primary" size="sm" className="w-full font-mono text-xs">
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      <span>Log Sample</span>
                    </Button>
                  </div>
                </form>

                <NotebookTable>
                  <NotebookTableHead>
                    <NotebookTableRow hover={false}>
                      <NotebookTableHeaderCell>Student</NotebookTableHeaderCell>
                      <NotebookTableHeaderCell>Topic</NotebookTableHeaderCell>
                      <NotebookTableHeaderCell>Action Taken</NotebookTableHeaderCell>
                      <NotebookTableHeaderCell>Logged</NotebookTableHeaderCell>
                      <NotebookTableHeaderCell align="right">Status</NotebookTableHeaderCell>
                    </NotebookTableRow>
                  </NotebookTableHead>
                  <tbody className="divide-y divide-ink/10 dark:divide-chalkboard-borderSubtle">
                    {filteredInterventions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-xs font-mono text-ink-muted dark:text-chalkboard-muted">
                          No interventions match this status filter.
                        </td>
                      </tr>
                    ) : (
                      filteredInterventions.map((item) => (
                      <NotebookTableRow key={item.id}>
                        <NotebookTableCell className="font-sans font-bold text-ink dark:text-chalkboard-chalk">
                          {item.studentName}
                        </NotebookTableCell>
                        <NotebookTableCell className="text-ink dark:text-chalkboard-chalk">
                          {item.topicName}
                        </NotebookTableCell>
                        <NotebookTableCell className="font-sans text-ink-muted dark:text-chalkboard-muted max-w-md">
                          {item.actionTaken}
                        </NotebookTableCell>
                        <NotebookTableCell className="text-ink-muted dark:text-chalkboard-muted">
                          {item.createdAt}
                        </NotebookTableCell>
                        <NotebookTableCell align="right">
                          <select
                            value={item.status}
                            onChange={(e) =>
                              handleUpdateInterventionStatus(item.id, e.target.value)
                            }
                            aria-label={`Intervention status for ${item.studentName}`}
                            className="px-2 py-1 rounded-lg border border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-warm dark:bg-chalkboard-surface text-xs font-mono font-bold text-ink dark:text-chalkboard-chalk focus:outline-none focus-visible:ring-2 focus-visible:ring-redpen"
                          >
                            <option value="PLANNED">Planned</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="COMPLETED">Completed</option>
                          </select>
                        </NotebookTableCell>
                      </NotebookTableRow>
                      ))
                    )}
                  </tbody>
                </NotebookTable>
              </NotebookTabPanel>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
