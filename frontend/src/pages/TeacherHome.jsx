import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  LogOut,
  BookOpenCheck,
  Sparkles,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Users,
  Target,
  FileCheck2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import { LearningPalLogo } from '../components/Doodles';

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
      setPingError(err.message || 'Failed to ping teacher endpoint');
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

  return (
    <div className="min-h-screen bg-paper flex flex-col text-ink">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-paper-card border-b-2 border-ink px-4 sm:px-8 py-3.5 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 group">
            <LearningPalLogo className="w-8 h-8 transition-transform group-hover:-rotate-6" />
            <div className="flex flex-col">
              <span className="font-bold text-lg tracking-tight text-ink flex items-center">
                Learning<span className="font-hand text-2xl text-redpen -mt-1">Pal</span>
              </span>
              <span className="text-[10px] font-mono uppercase text-ink-muted -mt-1">
                Teacher Gradebook
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-bold text-ink">{user?.fullName || 'Teacher'}</span>
              <span className="text-[10px] font-mono text-ink-muted">{user?.email}</span>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-ink bg-paper-warm hover:bg-redpen hover:text-white text-ink text-xs font-bold shadow-[2px_2px_0_#1B2534] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-redpen"
              title="Sign out of teacher gradebook"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Teacher Workspace */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-8 space-y-8">
        {/* Welcome Notebook Spread */}
        <div className="relative bg-paper-card border-2 border-ink rounded-2xl p-6 sm:p-8 shadow-lifted notebook-margin-line pl-12 sm:pl-16 bg-ruled-paper">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-highlighter-mint text-ink font-mono text-xs font-bold uppercase tracking-wider border border-ink/20 mb-2">
                <BookOpenCheck className="w-4 h-4 text-ink-blue" />
                <span>Instructor Gradebook</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-ink font-sans tracking-tight">
                Welcome, {user?.fullName}!
              </h1>
              <p className="text-sm text-ink-muted mt-1">
                Your teacher account has been verified and approved by the administration.
              </p>
            </div>

            <div className="sm:text-right font-mono text-xs text-ink-muted bg-paper-warm/80 p-3 rounded-xl border border-ink/15">
              <span className="block font-bold text-ink">Account Status: <span className="text-emerald-700 uppercase">{user?.status}</span></span>
              <span>Role Authority: <span className="text-ink-blue uppercase">ROLE_{user?.role}</span></span>
            </div>
          </div>
        </div>

        {/* Role Authorization Verification Box (Ping Result) */}
        <div className="bg-paper-card border-2 border-ink rounded-2xl p-6 shadow-paper space-y-4">
          <div className="flex items-center justify-between border-b border-ink/10 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-redpen" />
              <h2 className="text-base font-bold text-ink font-sans">
                Server Authorization Handshake (/api/teacher/ping)
              </h2>
            </div>
            <button
              type="button"
              onClick={fetchPing}
              disabled={pingLoading}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-bold rounded-lg border border-ink/30 hover:bg-paper-warm transition-colors"
            >
              <RefreshCw className={`w-3 h-3 ${pingLoading ? 'animate-spin' : ''}`} />
              <span>Re-check</span>
            </button>
          </div>

          {pingLoading ? (
            <div className="flex items-center gap-3 py-3 text-xs font-mono text-ink-muted">
              <div className="w-4 h-4 border-2 border-ink-blue border-t-transparent rounded-full animate-spin" />
              <span>Verifying JWT claims against Spring Security filter…</span>
            </div>
          ) : pingError ? (
            <div className="flex items-start gap-2.5 p-3 rounded-xl border-2 border-redpen bg-redpen-soft text-redpen-dark text-xs font-mono">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Authorization Failure:</p>
                <p>{pingError}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl border-2 border-emerald-600 bg-emerald-50 text-emerald-900 text-xs font-mono shadow-sm">
              <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <div>
                <p className="font-bold text-emerald-800">Spring Security Confirmed:</p>
                <p className="text-emerald-950 font-semibold">{pingData}</p>
              </div>
            </div>
          )}

          <p className="text-[11px] font-mono text-ink-muted">
            ★ This endpoint strictly enforces <code className="bg-paper-warm px-1 py-0.5 rounded border border-ink/20">ROLE_TEACHER</code>. Students and unapproved accounts are rejected with HTTP 403.
          </p>
        </div>

        {/* Classroom Overview Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-paper-card border-2 border-ink rounded-xl p-5 shadow-paper">
            <span className="text-xs font-mono uppercase text-ink-muted flex items-center gap-1.5">
              <Users className="w-4 h-4 text-ink-blue" />
              Enrolled Students
            </span>
            <p className="text-3xl font-extrabold text-ink mt-2">28</p>
            <span className="text-[11px] font-mono text-emerald-700">100% Active in Section</span>
          </div>

          <div className="bg-paper-card border-2 border-ink rounded-xl p-5 shadow-paper">
            <span className="text-xs font-mono uppercase text-ink-muted flex items-center gap-1.5">
              <Target className="w-4 h-4 text-redpen" />
              Identified Concept Gaps
            </span>
            <p className="text-3xl font-extrabold text-redpen mt-2">4 Topics</p>
            <span className="text-[11px] font-mono text-ink-muted">Primary: Quadratic Factoring</span>
          </div>

          <div className="bg-paper-card border-2 border-ink rounded-xl p-5 shadow-paper">
            <span className="text-xs font-mono uppercase text-ink-muted flex items-center gap-1.5">
              <FileCheck2 className="w-4 h-4 text-emerald-600" />
              Assigned Interventions
            </span>
            <p className="text-3xl font-extrabold text-ink mt-2">12 Sheets</p>
            <span className="text-[11px] font-mono text-emerald-700">8 Completed Today</span>
          </div>
        </div>
      </main>
    </div>
  );
}

