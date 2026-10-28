import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  Cell,
  CartesianGrid,
} from 'recharts';
import {
  GraduationCap,
  BookOpenCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  PlusCircle,
  ThumbsUp,
  Clock,
  Filter,
  RotateCcw,
  Users,
  ClipboardCheck,
} from 'lucide-react';
import { demoContent } from '../data/content';
import { BinderHoles, WashiTape, HandDrawnCircle } from './Doodles';

export default function InteractiveDemo({ activeRole, onChangeRole }) {
  // Student View state
  const [selectedSubjectKey, setSelectedSubjectKey] = useState('biology');
  const [topicFilter, setTopicFilter] = useState('all'); // 'all' | 'gaps' | 'strengths'
  const [completedResourceIds, setCompletedResourceIds] = useState({
    'res-b1': true,
    'res-b2': true,
    'res-a1': true,
    'res-a2': true,
  });
  const [helpfulVotes, setHelpfulVotes] = useState({ 'res-b5a': true });

  // Teacher View state
  const [selectedStudentId, setSelectedStudentId] = useState('stu-1');
  const [interventions, setInterventions] = useState(demoContent.teacherView.initialInterventions);
  const [newLogStudent, setNewLogStudent] = useState('Liam O’Connor');
  const [newLogTopic, setNewLogTopic] = useState('Meiosis & Chromosome Crossing');
  const [newLogType, setNewLogType] = useState('1-on-1 Mini-Lesson (10m)');
  const [newLogNote, setNewLogNote] = useState('');

  // Compute live Student Subject Data with interactive resource completion boosts
  const currentSubject = useMemo(() => {
    const base = demoContent.subjects[selectedSubjectKey];
    const computedTopics = base.topics.map((t) => {
      let extraBoost = 0;
      const updatedResources = t.resources.map((r) => {
        const isDone = !!completedResourceIds[r.id];
        if (isDone && !r.completed) {
          extraBoost += r.boost;
        } else if (!isDone && r.completed) {
          extraBoost -= r.boost;
        }
        return { ...r, isDone };
      });
      const liveMastery = Math.min(100, Math.max(30, t.mastery + extraBoost));
      const liveStatus =
        liveMastery >= 80
          ? 'Strength'
          : liveMastery >= 70
          ? 'On Track'
          : liveMastery >= 60
          ? 'Gap Detected'
          : 'Priority Gap';

      return {
        ...t,
        liveMastery,
        liveStatus,
        resources: updatedResources,
      };
    });

    const avgMastery = Math.round(
      computedTopics.reduce((acc, item) => acc + item.liveMastery, 0) / computedTopics.length
    );

    return {
      ...base,
      liveOverallMastery: avgMastery,
      topics: computedTopics,
    };
  }, [selectedSubjectKey, completedResourceIds]);

  const filteredTopics = useMemo(() => {
    if (topicFilter === 'gaps') {
      return currentSubject.topics.filter((t) => t.liveMastery < 70);
    }
    if (topicFilter === 'strengths') {
      return currentSubject.topics.filter((t) => t.liveMastery >= 80);
    }
    return currentSubject.topics;
  }, [currentSubject, topicFilter]);

  const toggleResourceComplete = (resId) => {
    setCompletedResourceIds((prev) => ({
      ...prev,
      [resId]: !prev[resId],
    }));
  };

  const resetDemoProgress = () => {
    setCompletedResourceIds({
      'res-b1': true,
      'res-b2': true,
      'res-a1': true,
      'res-a2': true,
    });
  };

  const handleAddIntervention = (e) => {
    e.preventDefault();
    const trimmedNote =
      newLogNote.trim() ||
      `Assigned targeted practice & concept check for ${newLogTopic}. Follow-up quiz scheduled Friday.`;
    const newEntry = {
      id: `int-${Date.now()}`,
      date: 'Just Now',
      student: newLogStudent,
      topic: newLogTopic,
      type: newLogType,
      outcome: 'Logged • Monitoring Progress',
      note: trimmedNote,
    };
    setInterventions((prev) => [newEntry, ...prev]);
    setNewLogNote('');
  };

  const { teacherView } = demoContent;

  return (
    <section
      id="demo"
      aria-labelledby="demo-heading"
      className="relative py-20 lg:py-28 bg-graph-paper border-b-2 border-ink/15 dark:border-white/15"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <span className="inline-block px-3 py-1 rounded-md font-mono text-xs font-bold uppercase tracking-wider bg-highlighter-mintSoft dark:bg-emerald-950/70 text-ink dark:text-emerald-200 border border-ink/20 dark:border-emerald-500/30">
            {demoContent.sectionLabel}
          </span>
          <h2
            id="demo-heading"
            className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-ink dark:text-chalkboard-chalk tracking-tight"
          >
            {demoContent.headline}
          </h2>
          <p className="text-base sm:text-lg text-ink-muted dark:text-chalkboard-muted leading-relaxed">
            {demoContent.subheadline}
          </p>
        </div>

        {/* Notebook Divider Tab Strip (Student View vs. Teacher View) */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 max-w-6xl mx-auto px-2">
          <div
            role="tablist"
            aria-label="Interactive notebook perspective tabs"
            className="flex items-end gap-2 w-full sm:w-auto"
          >
            <button
              type="button"
              role="tab"
              id="tab-student"
              aria-selected={activeRole === 'student'}
              aria-controls="panel-student"
              onClick={() => onChangeRole('student')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2.5 px-5 sm:px-7 py-3.5 rounded-t-2xl border-t-2 border-x-2 border-ink dark:border-white/35 font-bold text-sm sm:text-base transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-redpen ${
                activeRole === 'student'
                  ? 'bg-highlighter-yellow text-ink translate-y-[2px] pb-4 shadow-[0_-3px_10px_rgba(0,0,0,0.06)] z-20'
                  : 'bg-paper-warm dark:bg-chalkboard-surface text-ink-muted dark:text-chalkboard-muted hover:bg-highlighter-yellowSoft/60'
              }`}
            >
              <GraduationCap className="w-5 h-5" />
              <span>Tab 1: Student Notebook</span>
              <span className="hidden md:inline-block px-2 py-0.5 text-[11px] font-mono rounded bg-ink/10 text-ink">
                Maya Lin
              </span>
            </button>

            <button
              type="button"
              role="tab"
              id="tab-teacher"
              aria-selected={activeRole === 'teacher'}
              aria-controls="panel-teacher"
              onClick={() => onChangeRole('teacher')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2.5 px-5 sm:px-7 py-3.5 rounded-t-2xl border-t-2 border-x-2 border-ink dark:border-white/35 font-bold text-sm sm:text-base transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-redpen ${
                activeRole === 'teacher'
                  ? 'bg-highlighter-mint text-ink translate-y-[2px] pb-4 shadow-[0_-3px_10px_rgba(0,0,0,0.06)] z-20'
                  : 'bg-paper-warm dark:bg-chalkboard-surface text-ink-muted dark:text-chalkboard-muted hover:bg-highlighter-mintSoft/60'
              }`}
            >
              <BookOpenCheck className="w-5 h-5" />
              <span>Tab 2: Teacher Gradebook</span>
              <span className="hidden md:inline-block px-2 py-0.5 text-[11px] font-mono rounded bg-ink/10 text-ink">
                Mr. Davis (32 Students)
              </span>
            </button>
          </div>

          {/* Interactive Hint Pill */}
          <div className="text-xs font-mono text-ink-muted dark:text-chalkboard-muted flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-redpen shrink-0" />
            <span>
              {activeRole === 'student'
                ? 'Tip: Check off any recommended activity below to watch mastery bars grow!'
                : 'Tip: Click a student row or log a new teacher intervention below!'}
            </span>
          </div>
        </div>

        {/* Main Open Notebook Spread Container */}
        <div className="relative max-w-6xl mx-auto rounded-2xl rounded-tl-none bg-paper-card dark:bg-chalkboard-card border-2 border-ink dark:border-white/35 shadow-lifted overflow-hidden">
          <div className="pt-2">
            <WashiTape
              colorClass={
                activeRole === 'student'
                  ? 'bg-highlighter-yellow/75 dark:bg-yellow-500/40'
                  : 'bg-highlighter-mint/75 dark:bg-emerald-500/40'
              }
              rotate="-rotate-1"
            />
          </div>

          <div className="flex">
            {/* Left Binder Holes */}
            <div className="hidden sm:flex">
              <BinderHoles vertical={true} />
            </div>

            {/* Animated Page-Flip Content Area */}
            <div className="flex-1 p-4 sm:p-7 lg:p-8 border-l-0 sm:border-l-2 border-redpen/30">
              <AnimatePresence mode="wait">
                {activeRole === 'student' ? (
                  <motion.div
                    key="student-view"
                    id="panel-student"
                    role="tabpanel"
                    aria-labelledby="tab-student"
                    initial={{ opacity: 0, rotateY: -4, y: 10 }}
                    animate={{ opacity: 1, rotateY: 0, y: 0 }}
                    exit={{ opacity: 0, rotateY: 4, y: -10 }}
                    transition={{ duration: 0.28, ease: 'easeOut' }}
                    className="space-y-7"
                  >
                    {/* Top Student Notebook Bar: Subject Switcher + Overall Mastery Stamp */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b-2 border-ink/10 dark:border-white/10">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded bg-highlighter-yellow text-ink font-mono text-xs font-bold">
                            STUDENT DASHBOARD
                          </span>
                          <span className="text-xs font-mono text-ink-muted dark:text-chalkboard-muted">
                            {currentSubject.studentName} ({currentSubject.studentId}) • {currentSubject.lastUpdated}
                          </span>
                        </div>

                        {/* Subject Selector Pills */}
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <span className="text-xs font-mono font-bold uppercase text-ink-muted dark:text-chalkboard-muted mr-1">
                            Subject Notebook:
                          </span>
                          {Object.values(demoContent.subjects).map((subj) => (
                            <button
                              key={subj.id}
                              type="button"
                              onClick={() => setSelectedSubjectKey(subj.id)}
                              className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold border transition-all ${
                                selectedSubjectKey === subj.id
                                  ? 'bg-ink text-paper dark:bg-highlighter-yellow dark:text-ink border-ink shadow-sm'
                                  : 'bg-paper-warm dark:bg-chalkboard-surface text-ink dark:text-chalkboard-chalk border-ink/20 dark:border-white/20 hover:border-ink'
                              }`}
                            >
                              {subj.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Live Calculated Subject Mastery Score Stamp */}
                      <div className="flex items-center gap-4 self-start lg:self-center bg-paper-warm/80 dark:bg-chalkboard-surface px-4 py-3 rounded-2xl border border-ink/20 dark:border-white/15">
                        <div>
                          <span className="text-[11px] font-mono uppercase text-ink-muted dark:text-chalkboard-muted block">
                            Current Subject Mastery
                          </span>
                          <span className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
                            Goal: {currentSubject.targetMastery}% Target
                          </span>
                        </div>
                        <div className="relative px-3 py-1">
                          <HandDrawnCircle className="absolute inset-0 w-full h-full" />
                          <span className="font-hand text-4xl font-bold text-redpen dark:text-red-400">
                            {currentSubject.liveOverallMastery}%
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={resetDemoProgress}
                          title="Reset demo checkboxes"
                          className="p-1.5 rounded-lg text-ink-muted hover:text-ink dark:text-chalkboard-muted dark:hover:text-white border border-transparent hover:border-ink/20"
                          aria-label="Reset interactive demo checkboxes"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Diagnostic Summary Callout + Recharts Topic Mastery Chart */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                      {/* Left 5 Cols: Automated Gap Analysis Note */}
                      <div className="lg:col-span-5 rounded-2xl bg-highlighter-yellowSoft/70 dark:bg-yellow-950/35 border-2 border-ink/20 dark:border-yellow-500/30 p-5 flex flex-col justify-between">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs font-bold uppercase tracking-wider text-redpen dark:text-red-400">
                              ★ Automated Gap Analysis
                            </span>
                            <span className="font-hand text-lg font-bold text-ink dark:text-yellow-200">
                              Updated Live
                            </span>
                          </div>
                          <h3 className="text-lg font-extrabold text-ink dark:text-chalkboard-chalk">
                            What your recent quizzes tell us:
                          </h3>
                          <p className="text-sm text-ink-muted dark:text-chalkboard-muted leading-relaxed">
                            {currentSubject.summaryFeedback}
                          </p>
                        </div>

                        <div className="mt-5 pt-4 border-t border-ink/15 dark:border-white/15 grid grid-cols-2 gap-3">
                          <div className="p-2.5 rounded-xl bg-paper-card dark:bg-chalkboard-card border border-ink/15">
                            <span className="text-[11px] font-mono uppercase text-emerald-700 dark:text-emerald-400 font-bold block">
                              Top Strength
                            </span>
                            <span className="text-xs sm:text-sm font-bold text-ink dark:text-chalkboard-chalk">
                              {currentSubject.topics[0].topic} ({currentSubject.topics[0].liveMastery}%)
                            </span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-redpen-soft/70 dark:bg-red-950/50 border border-redpen/30">
                            <span className="text-[11px] font-mono uppercase text-redpen-dark dark:text-red-300 font-bold block">
                              Priority Focus Gap
                            </span>
                            <span className="text-xs sm:text-sm font-bold text-ink dark:text-chalkboard-chalk">
                              {
                                [...currentSubject.topics].sort(
                                  (a, b) => a.liveMastery - b.liveMastery
                                )[0].topic
                              }{' '}
                              (
                              {
                                [...currentSubject.topics].sort(
                                  (a, b) => a.liveMastery - b.liveMastery
                                )[0].liveMastery
                              }
                              %)
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right 7 Cols: Recharts Topic Mastery Bar Chart */}
                      <div className="lg:col-span-7 rounded-2xl bg-paper dark:bg-chalkboard-surface border-2 border-ink/20 dark:border-white/20 p-4 sm:p-5">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                          <div>
                            <h3 className="text-sm sm:text-base font-extrabold text-ink dark:text-chalkboard-chalk">
                              Topic-Level Mastery vs. 80% Target Benchmark
                            </h3>
                            <p className="text-xs font-mono text-ink-muted dark:text-chalkboard-muted">
                              Green = Strength (≥80%) • Amber = Developing (70–79%) • Red = Gap (&lt;70%)
                            </p>
                          </div>
                        </div>

                        <div className="h-56 w-full" aria-label="Topic mastery bar chart">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={currentSubject.topics}
                              margin={{ top: 10, right: 16, left: -12, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
                              <XAxis
                                dataKey="topic"
                                tick={{ fontSize: 11, fill: '#64748B' }}
                                tickFormatter={(val) => (val.length > 14 ? `${val.slice(0, 12)}…` : val)}
                              />
                              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748B' }} unit="%" />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: '#FFFDF9',
                                  borderColor: '#1B2534',
                                  borderRadius: '12px',
                                  color: '#1B2534',
                                  fontSize: '12px',
                                }}
                                formatter={(value, name) => [
                                  `${value}%`,
                                  name === 'liveMastery' ? 'Your Mastery' : 'Class Avg',
                                ]}
                              />
                              <ReferenceLine
                                y={80}
                                stroke="#D93829"
                                strokeDasharray="5 5"
                                label={{
                                  value: '80% Goal',
                                  position: 'insideTopRight',
                                  fill: '#D93829',
                                  fontSize: 11,
                                }}
                              />
                              <Bar dataKey="liveMastery" radius={[6, 6, 0, 0]} maxBarSize={44}>
                                {currentSubject.topics.map((entry) => (
                                  <Cell
                                    key={entry.id}
                                    fill={
                                      entry.liveMastery >= 80
                                        ? '#10B981'
                                        : entry.liveMastery >= 70
                                        ? '#F59E0B'
                                        : '#D93829'
                                    }
                                  />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>

                    {/* Filter Bar + Topic Cards with Personalized Feedback & Interactive Resources */}
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <Filter className="w-4 h-4 text-redpen" />
                          <h3 className="text-base sm:text-lg font-extrabold text-ink dark:text-chalkboard-chalk">
                            Personalized Feedback & Recommended Activities by Topic
                          </h3>
                        </div>

                        <div className="flex items-center gap-1.5" role="group" aria-label="Filter topics">
                          {[
                            { id: 'all', label: `All Topics (${currentSubject.topics.length})` },
                            {
                              id: 'gaps',
                              label: `Learning Gaps (${
                                currentSubject.topics.filter((t) => t.liveMastery < 70).length
                              })`,
                            },
                            {
                              id: 'strengths',
                              label: `Strengths (${
                                currentSubject.topics.filter((t) => t.liveMastery >= 80).length
                              })`,
                            },
                          ].map((tab) => (
                            <button
                              key={tab.id}
                              type="button"
                              onClick={() => setTopicFilter(tab.id)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all ${
                                topicFilter === tab.id
                                  ? 'bg-ink text-paper dark:bg-highlighter-yellow dark:text-ink border-ink'
                                  : 'bg-paper-warm dark:bg-chalkboard-surface text-ink-muted dark:text-chalkboard-muted border-ink/15 dark:border-white/15'
                              }`}
                            >
                              {tab.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Topic Cards List */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredTopics.map((topic) => {
                          const isGap = topic.liveMastery < 70;
                          return (
                            <div
                              key={topic.id}
                              className={`rounded-2xl p-5 border-2 transition-all flex flex-col justify-between ${
                                isGap
                                  ? 'bg-redpen-soft/35 dark:bg-red-950/25 border-redpen/45'
                                  : 'bg-paper dark:bg-chalkboard-surface border-ink/20 dark:border-white/15'
                              }`}
                            >
                              <div>
                                {/* Topic Title & Mastery Score */}
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <div>
                                    <span
                                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-bold uppercase ${
                                        isGap
                                          ? 'bg-redpen text-white'
                                          : topic.liveMastery >= 80
                                          ? 'bg-highlighter-mint text-ink'
                                          : 'bg-highlighter-yellow text-ink'
                                      }`}
                                    >
                                      {isGap ? (
                                        <AlertCircle className="w-3 h-3" />
                                      ) : (
                                        <CheckCircle2 className="w-3 h-3" />
                                      )}
                                      {topic.liveStatus}
                                    </span>
                                    <h4 className="text-base sm:text-lg font-extrabold text-ink dark:text-chalkboard-chalk mt-1">
                                      {topic.topic}
                                    </h4>
                                  </div>
                                  <div className="text-right font-mono">
                                    <span className="text-2xl font-extrabold text-ink dark:text-chalkboard-chalk">
                                      {topic.liveMastery}%
                                    </span>
                                    <span className="block text-[11px] text-ink-muted dark:text-chalkboard-muted">
                                      Last Quiz: {topic.lastScore}
                                    </span>
                                  </div>
                                </div>

                                {/* Pen-stroke mastery bar */}
                                <div className="h-2.5 w-full rounded-full bg-paper-warm dark:bg-chalkboard overflow-hidden border border-ink/15 p-0.5 mb-3">
                                  <div
                                    style={{ width: `${topic.liveMastery}%` }}
                                    className={`h-full rounded-full transition-all duration-500 ${
                                      topic.liveMastery >= 80
                                        ? 'bg-emerald-500'
                                        : topic.liveMastery >= 70
                                        ? 'bg-amber-400'
                                        : 'bg-redpen'
                                    }`}
                                  />
                                </div>

                                {/* Personalized Feedback */}
                                <p className="text-xs sm:text-sm text-ink-muted dark:text-chalkboard-muted mb-4 bg-paper-card/80 dark:bg-chalkboard/60 p-2.5 rounded-xl border border-ink/10 dark:border-white/10">
                                  <strong className="text-ink dark:text-white">Diagnostic Feedback: </strong>
                                  {topic.feedback}
                                </p>
                              </div>

                              {/* Recommended Resources Checklist */}
                              <div className="space-y-2 pt-2 border-t border-ink/10 dark:border-white/10">
                                <span className="text-[11px] font-mono font-bold uppercase text-ink-muted dark:text-chalkboard-muted block">
                                  Recommended Learning Resources (Check to complete):
                                </span>
                                {topic.resources.map((res) => (
                                  <div
                                    key={res.id}
                                    className={`flex items-center justify-between gap-2 p-2.5 rounded-xl border text-xs transition-all ${
                                      res.isDone
                                        ? 'bg-highlighter-mintSoft/60 dark:bg-emerald-950/40 border-emerald-600/30 text-ink dark:text-emerald-200'
                                        : 'bg-paper-card dark:bg-chalkboard-card border-ink/20 dark:border-white/15 text-ink dark:text-chalkboard-chalk'
                                    }`}
                                  >
                                    <label className="flex items-start gap-2.5 cursor-pointer flex-1">
                                      <input
                                        type="checkbox"
                                        checked={res.isDone}
                                        onChange={() => toggleResourceComplete(res.id)}
                                        className="mt-0.5 h-4 w-4 rounded border-ink text-redpen focus:ring-redpen"
                                      />
                                      <div>
                                        <span
                                          className={`font-bold block ${
                                            res.isDone ? 'line-through opacity-75' : ''
                                          }`}
                                        >
                                          {res.title}
                                        </span>
                                        <span className="text-[11px] font-mono text-ink-muted dark:text-chalkboard-muted flex items-center gap-2 mt-0.5">
                                          <span>{res.type}</span>
                                          <span>•</span>
                                          <span className="inline-flex items-center gap-0.5">
                                            <Clock className="w-3 h-3" /> {res.duration}
                                          </span>
                                          <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                                            +{res.boost}% mastery
                                          </span>
                                        </span>
                                      </div>
                                    </label>

                                    {/* Resource Rating Preview Button */}
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setHelpfulVotes((prev) => ({
                                          ...prev,
                                          [res.id]: !prev[res.id],
                                        }))
                                      }
                                      className={`shrink-0 px-2 py-1 rounded-md border text-[11px] font-mono flex items-center gap-1 transition-colors ${
                                        helpfulVotes[res.id]
                                          ? 'bg-highlighter-yellow text-ink border-ink font-bold'
                                          : 'border-ink/20 text-ink-muted dark:text-chalkboard-muted hover:text-ink'
                                      }`}
                                      title="Preview of Upcoming Feature: Rate Resource Helpfulness"
                                    >
                                      <ThumbsUp className="w-3 h-3" />
                                      <span>{helpfulVotes[res.id] ? 'Helpful!' : 'Rate'}</span>
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  /* =========================================================
                     TAB 2: TEACHER GRADEBOOK & INTERVENTION LOG VIEW
                     ========================================================= */
                  <motion.div
                    key="teacher-view"
                    id="panel-teacher"
                    role="tabpanel"
                    aria-labelledby="tab-teacher"
                    initial={{ opacity: 0, rotateY: 4, y: 10 }}
                    animate={{ opacity: 1, rotateY: 0, y: 0 }}
                    exit={{ opacity: 0, rotateY: -4, y: -10 }}
                    transition={{ duration: 0.28, ease: 'easeOut' }}
                    className="space-y-7"
                  >
                    {/* Top Teacher Header */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b-2 border-ink/10 dark:border-white/10">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded bg-highlighter-mint text-ink font-mono text-xs font-bold">
                            TEACHER DIAGNOSTIC GRADEBOOK
                          </span>
                          <span className="text-xs font-mono text-ink-muted dark:text-chalkboard-muted">
                            {teacherView.teacherName} • {teacherView.termLabel}
                          </span>
                        </div>
                        <h3 className="text-xl sm:text-2xl font-extrabold text-ink dark:text-chalkboard-chalk mt-1">
                          {teacherView.className}
                        </h3>
                      </div>

                      {/* 4 Quick Class Metrics */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {teacherView.classMetrics.map((m) => (
                          <div
                            key={m.label}
                            className="p-2.5 rounded-xl bg-paper-warm/80 dark:bg-chalkboard-surface border border-ink/15 dark:border-white/15"
                          >
                            <span className="text-[10px] font-mono uppercase text-ink-muted dark:text-chalkboard-muted block">
                              {m.label}
                            </span>
                            <span className="text-base sm:text-lg font-extrabold text-ink dark:text-chalkboard-chalk">
                              {m.value}
                            </span>
                            <span className="text-[11px] font-mono text-redpen dark:text-red-400 block">
                              {m.delta}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Class Gap Chart + Priority Student Roster */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                      {/* Left 6 Cols: Class-Wide Topic Gap Chart */}
                      <div className="lg:col-span-6 rounded-2xl bg-paper dark:bg-chalkboard-surface border-2 border-ink/20 dark:border-white/20 p-5 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <h4 className="text-base font-extrabold text-ink dark:text-chalkboard-chalk">
                              Class-Wide Topic Mastery & Gap Distribution
                            </h4>
                            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-redpen-soft text-redpen-dark">
                              2 Class Gaps Flagged
                            </span>
                          </div>
                          <p className="text-xs text-ink-muted dark:text-chalkboard-muted mb-4">
                            Instantly spot which syllabus topics need a whole-class warm-up vs. a small-group pullout.
                          </p>

                          <div className="h-52 w-full" aria-label="Class topic gap bar chart">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={teacherView.classTopicData}
                                margin={{ top: 8, right: 12, left: -14, bottom: 5 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
                                <XAxis dataKey="shortName" tick={{ fontSize: 11, fill: '#64748B' }} />
                                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748B' }} unit="%" />
                                <Tooltip
                                  contentStyle={{
                                    backgroundColor: '#FFFDF9',
                                    borderColor: '#1B2534',
                                    borderRadius: '12px',
                                    color: '#1B2534',
                                    fontSize: '12px',
                                  }}
                                  formatter={(val, name) => [
                                    name === 'avgMastery' ? `${val}% Class Avg` : `${val} Students <70%`,
                                    name === 'avgMastery' ? 'Class Mastery' : 'Needs Support',
                                  ]}
                                />
                                <ReferenceLine y={70} stroke="#D93829" strokeDasharray="4 4" />
                                <Bar dataKey="avgMastery" radius={[6, 6, 0, 0]} maxBarSize={40}>
                                  {teacherView.classTopicData.map((item) => (
                                    <Cell
                                      key={item.topic}
                                      fill={
                                        item.avgMastery >= 78
                                          ? '#10B981'
                                          : item.avgMastery >= 70
                                          ? '#F59E0B'
                                          : '#D93829'
                                      }
                                    />
                                  ))}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* Heatmap Summary Strip */}
                        <div className="mt-3 pt-3 border-t border-ink/10 dark:border-white/10 grid grid-cols-5 gap-1.5 text-center">
                          {teacherView.classTopicData.map((t) => (
                            <div
                              key={t.topic}
                              className={`p-1.5 rounded-lg border text-[11px] font-mono ${
                                t.studentsBelow70 >= 10
                                  ? 'bg-redpen-soft text-redpen-dark border-redpen/40 font-bold'
                                  : 'bg-paper-warm dark:bg-chalkboard border-ink/10 text-ink dark:text-chalkboard-chalk'
                              }`}
                            >
                              <div className="truncate font-bold">{t.shortName}</div>
                              <div>{t.studentsBelow70} stu &lt;70%</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Right 6 Cols: Students Needing Targeted Support */}
                      <div className="lg:col-span-6 rounded-2xl bg-paper dark:bg-chalkboard-surface border-2 border-ink/20 dark:border-white/20 p-5 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <h4 className="text-base font-extrabold text-ink dark:text-chalkboard-chalk flex items-center gap-2">
                              <Users className="w-4 h-4 text-redpen" />
                              <span>Students with Priority Topic Gaps</span>
                            </h4>
                            <span className="text-xs font-mono text-ink-muted dark:text-chalkboard-muted">
                              Click student to pre-fill log
                            </span>
                          </div>

                          <div className="space-y-2.5">
                            {teacherView.studentRoster.map((stu) => {
                              const isSelected = selectedStudentId === stu.id;
                              return (
                                <button
                                  key={stu.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedStudentId(stu.id);
                                    setNewLogStudent(stu.name);
                                  }}
                                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                                    isSelected
                                      ? 'bg-highlighter-mintSoft/70 dark:bg-emerald-950/40 border-ink dark:border-emerald-400 shadow-sm'
                                      : 'bg-paper-card dark:bg-chalkboard-card border-ink/15 dark:border-white/10 hover:border-ink/40'
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-sm text-ink dark:text-chalkboard-chalk">
                                        {stu.name}
                                      </span>
                                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-900">
                                        {stu.trend}
                                      </span>
                                    </div>
                                    <span
                                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                                        stu.status === 'Needs Check-in'
                                          ? 'bg-redpen-soft text-redpen-dark'
                                          : 'bg-highlighter-yellowSoft text-ink'
                                      }`}
                                    >
                                      {stu.status}
                                    </span>
                                  </div>
                                  <div className="mt-1.5 grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs font-mono">
                                    <span className="text-redpen dark:text-red-400 font-semibold truncate">
                                      Gap: {stu.weakestTopic}
                                    </span>
                                    <span className="text-emerald-700 dark:text-emerald-400 truncate">
                                      Strength: {stu.strength}
                                    </span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="mt-4 p-3 rounded-xl bg-highlighter-yellowSoft/70 dark:bg-yellow-950/35 border border-ink/15 text-xs flex items-center justify-between">
                          <span className="font-medium text-ink dark:text-chalkboard-chalk">
                            💡 <strong>Smart Grouping Suggestion:</strong> Pull Maya, Liam, and Noah together for a 12-min Meiosis II review.
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Teacher Intervention Log & Live Form */}
                    <div className="rounded-2xl bg-paper-warm/70 dark:bg-chalkboard-surface border-2 border-ink/20 dark:border-white/20 p-5 sm:p-6 space-y-5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <h4 className="text-lg font-extrabold text-ink dark:text-chalkboard-chalk flex items-center gap-2">
                            <ClipboardCheck className="w-5 h-5 text-redpen" />
                            <span>Teacher Intervention Log & Progress Tracker</span>
                          </h4>
                          <p className="text-xs sm:text-sm text-ink-muted dark:text-chalkboard-muted">
                            Record targeted 1-on-1 check-ins, small-group reviews, or practice assignments and track their impact.
                          </p>
                        </div>
                        <span className="font-hand text-xl font-bold text-redpen dark:text-red-400">
                          {interventions.length} Interventions Recorded
                        </span>
                      </div>

                      {/* Interactive Form to Log a New Intervention */}
                      <form
                        onSubmit={handleAddIntervention}
                        className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-paper-card dark:bg-chalkboard-card p-3.5 rounded-xl border border-ink/20 dark:border-white/15"
                      >
                        <div className="sm:col-span-3">
                          <label className="block text-[10px] font-mono font-bold uppercase text-ink-muted dark:text-chalkboard-muted mb-1">
                            Student / Group
                          </label>
                          <select
                            value={newLogStudent}
                            onChange={(e) => setNewLogStudent(e.target.value)}
                            className="w-full rounded-lg border border-ink/25 dark:border-white/20 bg-paper dark:bg-chalkboard px-2.5 py-2 text-xs font-semibold text-ink dark:text-chalkboard-chalk"
                          >
                            <option value="Liam O’Connor">Liam O’Connor</option>
                            <option value="Maya Lin">Maya Lin</option>
                            <option value="Aisha Patel">Aisha Patel</option>
                            <option value="Noah Takahashi">Noah Takahashi</option>
                            <option value="Small Group (Meiosis Cluster)">Small Group (Meiosis Cluster)</option>
                          </select>
                        </div>

                        <div className="sm:col-span-3">
                          <label className="block text-[10px] font-mono font-bold uppercase text-ink-muted dark:text-chalkboard-muted mb-1">
                            Targeted Gap Topic
                          </label>
                          <select
                            value={newLogTopic}
                            onChange={(e) => setNewLogTopic(e.target.value)}
                            className="w-full rounded-lg border border-ink/25 dark:border-white/20 bg-paper dark:bg-chalkboard px-2.5 py-2 text-xs font-semibold text-ink dark:text-chalkboard-chalk"
                          >
                            <option value="Meiosis & Chromosome Crossing">Meiosis & Chromosome Crossing</option>
                            <option value="Enzyme Kinetics & pH Curves">Enzyme Kinetics & pH Curves</option>
                            <option value="DNA Replication & Transcription">DNA Replication & Transcription</option>
                          </select>
                        </div>

                        <div className="sm:col-span-3">
                          <label className="block text-[10px] font-mono font-bold uppercase text-ink-muted dark:text-chalkboard-muted mb-1">
                            Support Action
                          </label>
                          <select
                            value={newLogType}
                            onChange={(e) => setNewLogType(e.target.value)}
                            className="w-full rounded-lg border border-ink/25 dark:border-white/20 bg-paper dark:bg-chalkboard px-2.5 py-2 text-xs font-semibold text-ink dark:text-chalkboard-chalk"
                          >
                            <option value="1-on-1 Mini-Lesson (10m)">1-on-1 Mini-Lesson (10m)</option>
                            <option value="Small-Group Lab Walkthrough">Small-Group Lab Walkthrough</option>
                            <option value="Targeted Practice Pack Assigned">Targeted Practice Pack Assigned</option>
                            <option value="Peer Study Pairing">Peer Study Pairing</option>
                          </select>
                        </div>

                        <div className="sm:col-span-3 flex items-end">
                          <button
                            type="submit"
                            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border-2 border-ink bg-highlighter-mint hover:bg-emerald-300 text-ink font-bold text-xs shadow-[2px_2px_0_#1B2534] transition-all"
                          >
                            <PlusCircle className="w-4 h-4" />
                            <span>Log Intervention</span>
                          </button>
                        </div>
                      </form>

                      {/* Logged Interventions List */}
                      <div className="space-y-2.5">
                        {interventions.map((entry) => (
                          <div
                            key={entry.id}
                            className="p-3.5 rounded-xl bg-paper-card dark:bg-chalkboard-card border border-ink/15 dark:border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                          >
                            <div className="space-y-0.5">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="px-2 py-0.5 rounded bg-paper-warm dark:bg-chalkboard font-mono text-[11px] font-bold text-ink dark:text-chalkboard-chalk">
                                  {entry.date}
                                </span>
                                <span className="font-bold text-sm text-ink dark:text-chalkboard-chalk">
                                  {entry.student}
                                </span>
                                <span className="text-xs font-mono text-redpen dark:text-red-400 font-semibold">
                                  • {entry.topic}
                                </span>
                                <span className="px-2 py-0.5 rounded bg-highlighter-yellowSoft text-ink font-mono text-[11px] font-medium">
                                  {entry.type}
                                </span>
                              </div>
                              <p className="text-xs text-ink-muted dark:text-chalkboard-muted">{entry.note}</p>
                            </div>
                            <span className="shrink-0 self-start sm:self-center px-2.5 py-1 rounded-lg bg-highlighter-mintSoft dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-300 font-mono text-xs font-bold border border-emerald-600/20">
                              {entry.outcome}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

