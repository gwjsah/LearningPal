import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  BookOpen,
  Compass,
  Sparkles,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import {
  Button,
  NotebookCard,
  PortalShell,
  SessionVerificationBar,
} from '../components/NotebookPrimitives';

const UPCOMING_STUDENT_MODULES = [
  {
    icon: BookOpen,
    title: 'Topic-by-Topic Mastery Ledger',
    detail:
      'Your quiz and assignment scores will automatically group by syllabus topic so you can see your strongest concepts at a glance.',
    tag: 'Phase 2 • Mastery Engine',
  },
  {
    icon: Compass,
    title: 'Automated Learning Gap Diagnostics',
    detail:
      'Whenever a topic score dips below 70%, LearningPal highlights the exact sub-skill that needs review—no more guessing what to study.',
    tag: 'Phase 2 • Gap Detector',
  },
  {
    icon: Sparkles,
    title: 'Matched 10-Minute Practice Activities',
    detail:
      'Check off short, targeted study sheets and visual recaps tailored to your learning gaps to watch your mastery bars climb.',
    tag: 'Phase 2 • Study Companion',
  },
];

export default function StudentHome() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [pingData, setPingData] = useState(null);
  const [pingLoading, setPingLoading] = useState(true);
  const [pingError, setPingError] = useState('');

  const fetchPing = async () => {
    setPingLoading(true);
    setPingError('');
    try {
      const data = await apiRequest('/student/ping');
      setPingData(data.message);
    } catch (err) {
      setPingError(err.message || 'Could not reach the student notebook service.');
    } finally {
      setPingLoading(false);
    }
  };

  useEffect(() => {
    fetchPing();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const accountBadge = (
    <div className="sm:text-right font-mono text-xs text-ink-muted dark:text-chalkboard-muted bg-paper-warm/90 dark:bg-chalkboard-surface p-3 rounded-xl border border-ink/15 dark:border-white/20">
      <span className="block font-bold text-ink dark:text-chalkboard-chalk">
        Account Status:{' '}
        <span className="text-ink-blue dark:text-highlighter-mint uppercase">
          {user?.status || 'ACTIVE'}
        </span>
      </span>
      <span>
        Role Authority:{' '}
        <span className="text-redpen dark:text-highlighter-yellow uppercase">
          ROLE_{user?.role || 'STUDENT'}
        </span>
      </span>
    </div>
  );

  return (
    <PortalShell
      portalSubtitle="Student Notebook"
      skipLabel="Skip to student notebook workspace"
      user={user}
      onLogout={handleLogout}
      badgeIcon={GraduationCap}
      badgeLabel="Student Study Desk"
      badgeColorClass="bg-highlighter-yellow text-ink"
      title={`Welcome, ${user?.fullName || 'Student'}!`}
      subtitle="Your student notebook account is active and ready. Live course diagnostics and practice sheets are being connected to your workspace."
      headerRight={accountBadge}
    >
      {/* Intentional "Coming Soon" Notebook Sheet */}
      <NotebookCard
        pageLabel="Page 02 • Student Workspace Roadmap"
        bodyClassName="space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-ink/15 dark:border-white/15">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2">
              <span className="rubber-stamp px-2.5 py-0.5 text-[11px] font-mono text-redpen">
                COMING SOON
              </span>
              <span className="font-mono text-xs text-ink-muted dark:text-chalkboard-muted flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Next Milestone: Assessment &amp; Topic Sync</span>
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-ink dark:text-chalkboard-chalk">
              What’s Being Prepared for Your Notebook
            </h2>
            <p className="text-sm text-ink-muted dark:text-chalkboard-muted max-w-2xl">
              Your authentication and role permissions are live. Here are the three study tools arriving in the next release:
            </p>
          </div>

          <Button to="/#demo" variant="yellow" size="sm" className="self-start sm:self-center shrink-0">
            <span>Preview Interactive Demo</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {UPCOMING_STUDENT_MODULES.map((mod) => {
            const Icon = mod.icon;
            return (
              <div
                key={mod.title}
                className="rounded-xl bg-paper-warm/75 dark:bg-chalkboard-surface border border-ink/20 dark:border-white/20 p-4 flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="w-9 h-9 rounded-lg bg-paper-card dark:bg-chalkboard-card border border-ink/20 dark:border-white/20 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-ink-blue dark:text-highlighter-yellow" aria-hidden="true" />
                    </div>
                    <span className="font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-highlighter-yellowSoft text-ink">
                      {mod.tag}
                    </span>
                  </div>
                  <h3 className="text-sm font-extrabold text-ink dark:text-chalkboard-chalk">
                    {mod.title}
                  </h3>
                  <p className="text-xs text-ink-muted dark:text-chalkboard-muted leading-relaxed">
                    {mod.detail}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </NotebookCard>

      {/* Role Authorization Verification Bar (/api/student/ping) */}
      <SessionVerificationBar
        endpointLabel="GET /api/student/ping • ROLE_STUDENT"
        pingData={pingData}
        pingLoading={pingLoading}
        pingError={pingError}
        onRecheck={fetchPing}
        accentClass="bg-highlighter-yellow/75"
      />
    </PortalShell>
  );
}
