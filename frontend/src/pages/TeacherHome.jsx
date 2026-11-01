import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpenCheck,
  Users,
  Target,
  ClipboardCheck,
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

const UPCOMING_TEACHER_MODULES = [
  {
    icon: Target,
    title: 'Class-Wide Topic Gap Distribution',
    detail:
      'Spot which syllabus topics need a 10-minute whole-class warm-up versus a small-group pullout before the next unit exam.',
    tag: 'Phase 2 • Class Heatmap',
  },
  {
    icon: Users,
    title: 'Priority Student Support Roster',
    detail:
      'See which learners have multiple topic scores below 70% alongside their strongest topics for peer study pairing.',
    tag: 'Phase 2 • Roster Alerts',
  },
  {
    icon: ClipboardCheck,
    title: '1-Click Teacher Intervention Log',
    detail:
      'Record 1-on-1 check-ins, lab walkthroughs, and assigned practice packs while tracking post-intervention mastery gains.',
    tag: 'Phase 2 • Progress Ledger',
  },
];

export default function TeacherHome() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [pingData, setPingData] = useState(null);
  const [pingLoading, setPingLoading] = useState(true);
  const [pingError, setPingError] = useState('');

  const fetchPing = async () => {
    setPingLoading(true);
    setPingError('');
    try {
      const data = await apiRequest('/teacher/ping');
      setPingData(data.message);
    } catch (err) {
      setPingError(err.message || 'Could not reach the teacher gradebook service.');
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
          ROLE_{user?.role || 'TEACHER'}
        </span>
      </span>
    </div>
  );

  return (
    <PortalShell
      portalSubtitle="Teacher Gradebook"
      skipLabel="Skip to teacher gradebook workspace"
      user={user}
      onLogout={handleLogout}
      badgeIcon={BookOpenCheck}
      badgeLabel="Instructor Gradebook"
      badgeColorClass="bg-highlighter-mint text-ink"
      title={`Welcome, ${user?.fullName || 'Teacher'}!`}
      subtitle="Your educator account has been verified by an administrator. Section rosters and diagnostic gradebooks are being connected to your workspace."
      headerRight={accountBadge}
    >
      {/* Intentional "Coming Soon" Teacher Gradebook Sheet */}
      <NotebookCard
        pageLabel="Page 02 • Instructor Gradebook Roadmap"
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
                <span>Next Milestone: Section Roster &amp; Intervention API</span>
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-ink dark:text-chalkboard-chalk">
              What’s Being Prepared for Your Gradebook
            </h2>
            <p className="text-sm text-ink-muted dark:text-chalkboard-muted max-w-2xl">
              Your approved instructor credentials are active. Here are the three classroom tools arriving in the next release:
            </p>
          </div>

          <Button to="/#demo" variant="mint" size="sm" className="self-start sm:self-center shrink-0">
            <span>Preview Gradebook Demo</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {UPCOMING_TEACHER_MODULES.map((mod) => {
            const Icon = mod.icon;
            return (
              <div
                key={mod.title}
                className="rounded-xl bg-paper-warm/75 dark:bg-chalkboard-surface border border-ink/20 dark:border-white/20 p-4 flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="w-9 h-9 rounded-lg bg-paper-card dark:bg-chalkboard-card border border-ink/20 dark:border-white/20 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-redpen dark:text-highlighter-mint" aria-hidden="true" />
                    </div>
                    <span className="font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-highlighter-mintSoft text-ink">
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

      {/* Role Authorization Verification Bar (/api/teacher/ping) */}
      <SessionVerificationBar
        endpointLabel="GET /api/teacher/ping • ROLE_TEACHER"
        pingData={pingData}
        pingLoading={pingLoading}
        pingError={pingError}
        onRecheck={fetchPing}
        accentClass="bg-highlighter-mint"
      />
    </PortalShell>
  );
}
