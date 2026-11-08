import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  FlaskConical,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
  Users,
  EyeOff,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { teacherService } from '../services/teacherService';
import { PortalShell, NotebookCard, Button } from '../components/NotebookPrimitives';

export default function TeacherValidationHub() {
  const { classId } = useParams();
  const { user, logout } = useAuth();

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchValidationStudents = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await teacherService.getValidationStudents(classId);
      setStudents(data);
    } catch (err) {
      setError(err.message || 'Failed to load validation student roster.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchValidationStudents();
  }, [classId]);

  // Count students who have labeled at least 1 topic
  const labeledStudentsCount = students.filter((s) => s.labeledTopicsCount > 0).length;
  const targetMinStudents = 30;
  const progressPercent = Math.min(100, Math.round((labeledStudentsCount / targetMinStudents) * 100));

  // Filter students by name or email
  const filteredStudents = students.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (s.studentName && s.studentName.toLowerCase().includes(q)) ||
      (s.email && s.email.toLowerCase().includes(q))
    );
  });

  return (
    <PortalShell
      portalSubtitle="Teacher Validation Lab"
      user={user}
      onLogout={logout}
      badgeIcon={FlaskConical}
      badgeLabel="Study Validation Lab"
      badgeColorClass="bg-highlighter-mint text-ink"
      title="Blind Topic Validation"
      subtitle="Evaluate student topic mastery blindly to measure automated gap detection accuracy."
      headerRight={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            to={`/teacher/classes/${classId}`}
            variant="secondary"
            size="sm"
            className="text-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            <span>Back to Class</span>
          </Button>

          <Button
            to={`/teacher/classes/${classId}/validation/report`}
            variant="primary"
            size="sm"
            className="text-xs"
          >
            <BarChart3 className="w-3.5 h-3.5 mr-1" />
            <span>View Validation Report</span>
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* EDUCATIONAL CALLOUT: WHY BLIND LABELING MATTERS */}
        <NotebookCard
          borderStyle="sketch"
          className="p-6 bg-paper-card dark:bg-chalkboard-card border-2 border-ink dark:border-chalkboard-border space-y-3"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-highlighter-yellow/30 text-ink dark:text-highlighter-yellow border border-ink/15 dark:border-chalkboard-border shrink-0 mt-0.5">
              <EyeOff className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-extrabold text-ink dark:text-chalkboard-chalk">
                Why Blind Labeling Matters: Label Before You Look
              </h2>
              <p className="text-xs sm:text-sm text-ink-muted dark:text-chalkboard-muted leading-relaxed">
                To scientifically measure how accurately LearningPal flags learning gaps, teachers review raw student answers
                <strong> without seeing</strong> the system’s scores, gap warnings, or mastery estimates.
                Your independent pedagogical judgment provides the authoritative ground-truth benchmark to verify our
                <strong> 85% agreement objective</strong>.
              </p>
            </div>
          </div>
        </NotebookCard>

        {/* PROGRESS TOWARDS 30-STUDENT TARGET */}
        <NotebookCard
          ruled
          marginLine
          lifted
          className="p-6 bg-paper-card dark:bg-chalkboard-card border-2 border-ink dark:border-chalkboard-border space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-ink-muted dark:text-chalkboard-muted">
                Validation Study Sample Progress
              </span>
              <h3 className="text-xl font-extrabold text-ink dark:text-chalkboard-chalk mt-0.5">
                {labeledStudentsCount} of {targetMinStudents} minimum students evaluated ({progressPercent}%)
              </h3>
            </div>

            <div className="text-right">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-extrabold uppercase border ${
                  labeledStudentsCount >= targetMinStudents
                    ? 'bg-highlighter-mint text-ink border-ink/20'
                    : 'bg-paper-warm dark:bg-chalkboard-surface text-ink-muted dark:text-chalkboard-muted border-ink/20'
                }`}
              >
                {labeledStudentsCount >= targetMinStudents ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Sample Target Met</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-3.5 h-3.5" />
                    <span>{targetMinStudents - labeledStudentsCount} more needed</span>
                  </>
                )}
              </span>
            </div>
          </div>

          <div className="w-full bg-ink/10 dark:bg-chalkboard-borderSubtle h-3 rounded-full overflow-hidden">
            <div
              className="h-full bg-redpen dark:bg-highlighter-yellow transition-all duration-500 rounded-full"
              style={{ width: `${progressPercent}%` }}
              role="progressbar"
              aria-valuenow={labeledStudentsCount}
              aria-valuemin="0"
              aria-valuemax={targetMinStudents}
            />
          </div>

          <p className="text-xs text-ink-muted dark:text-chalkboard-muted">
            The project validation protocol requires blind labeling across at least 30 enrolled students to establish statistical validity.
          </p>
        </NotebookCard>

        {/* STUDENT ROSTER FOR BLIND EVALUATION */}
        <NotebookCard
          borderStyle="sketch"
          className="p-6 bg-paper-card dark:bg-chalkboard-card border-2 border-ink dark:border-chalkboard-border space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-extrabold text-ink dark:text-chalkboard-chalk flex items-center gap-2">
                <Users className="w-5 h-5 text-redpen dark:text-highlighter-yellow" />
                <span>Class Roster & Evaluation Status</span>
              </h3>
              <p className="text-xs text-ink-muted dark:text-chalkboard-muted mt-0.5">
                Select a student to inspect their submitted question attempts and label topic understanding.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-ink-muted dark:text-chalkboard-muted absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg text-xs bg-paper-warm dark:bg-chalkboard-surface border border-ink/20 dark:border-chalkboard-border text-ink dark:text-chalkboard-chalk placeholder:text-ink-muted/60 focus:outline-none focus:ring-2 focus:ring-redpen"
              />
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs font-mono text-ink-muted dark:text-chalkboard-muted">
              Loading student roster...
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl border border-red-500 bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-200 text-xs">
              {error}
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="py-12 text-center text-xs font-mono text-ink-muted dark:text-chalkboard-muted">
              No students found matching your search.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-ink/15 dark:border-chalkboard-border text-left font-mono font-bold uppercase text-[11px] text-ink-muted dark:text-chalkboard-muted">
                    <th className="py-2.5 px-3">Student</th>
                    <th className="py-2.5 px-3 text-center">Class Attempts</th>
                    <th className="py-2.5 px-3 text-center">Topics Labeled</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/10 dark:divide-chalkboard-borderSubtle font-sans">
                  {filteredStudents.map((s) => {
                    const isComplete =
                      s.totalTopicsCount > 0 && s.labeledTopicsCount === s.totalTopicsCount;
                    const isStarted = s.labeledTopicsCount > 0;

                    return (
                      <tr
                        key={s.studentId}
                        className="hover:bg-paper-warm/50 dark:hover:bg-chalkboard-surface/50 transition-colors"
                      >
                        <td className="py-3 px-3">
                          <div className="font-bold text-ink dark:text-chalkboard-chalk">
                            {s.studentName}
                          </div>
                          <div className="text-[11px] font-mono text-ink-muted dark:text-chalkboard-muted">
                            {s.email}
                          </div>
                        </td>

                        <td className="py-3 px-3 text-center font-mono font-bold text-ink dark:text-chalkboard-chalk">
                          {s.submittedAttemptsCount}
                        </td>

                        <td className="py-3 px-3 text-center font-mono">
                          <span className="font-bold text-ink dark:text-chalkboard-chalk">
                            {s.labeledTopicsCount}
                          </span>
                          <span className="text-ink-muted dark:text-chalkboard-muted">
                            {' '}
                            / {s.totalTopicsCount}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-center">
                          <div className="inline-flex flex-wrap items-center justify-center gap-1.5">
                            {s.hasStaleLabels && (
                              <span
                                className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300"
                                title="Student has submitted new attempts since last label"
                              >
                                Stale
                              </span>
                            )}
                            {isComplete ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-100 text-emerald-900 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300">
                                Complete
                              </span>
                            ) : isStarted ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-blue-100 text-blue-900 border border-blue-300 dark:bg-blue-950/60 dark:text-blue-300">
                                In Progress
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-paper-warm dark:bg-chalkboard-surface text-ink-muted dark:text-chalkboard-muted border border-ink/15">
                                Unlabeled
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-3 text-right">
                          <Button
                            to={`/teacher/classes/${classId}/validation/students/${s.studentId}`}
                            variant={isComplete ? 'secondary' : 'mint'}
                            size="sm"
                            className="text-xs"
                          >
                            <span>{isComplete ? 'Review Labels' : 'Evaluate'}</span>
                            <ChevronRight className="w-3.5 h-3.5 ml-1" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </NotebookCard>
      </div>
    </PortalShell>
  );
}

