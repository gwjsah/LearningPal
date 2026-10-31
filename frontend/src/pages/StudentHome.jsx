import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  LogOut,
  GraduationCap,
  Sparkles,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  BookOpen,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import { LearningPalLogo } from '../components/Doodles';

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
      setPingError(err.message || 'Failed to ping student endpoint');
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
                Student Notebook
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-bold text-ink">{user?.fullName || 'Student'}</span>
              <span className="text-[10px] font-mono text-ink-muted">{user?.email}</span>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-ink bg-paper-warm hover:bg-redpen hover:text-white text-ink text-xs font-bold shadow-[2px_2px_0_#1B2534] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-redpen"
              title="Sign out of student notebook"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Student Workspace */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-8 space-y-8">
        {/* Welcome Banner Notebook Spread */}
        <div className="relative bg-paper-card border-2 border-ink rounded-2xl p-6 sm:p-8 shadow-lifted notebook-margin-line pl-12 sm:pl-16 bg-ruled-paper">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-highlighter-yellow text-ink font-mono text-xs font-bold uppercase tracking-wider border border-ink/20 mb-2">
                <GraduationCap className="w-4 h-4 text-ink-blue" />
                <span>Student Desk</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-ink font-sans tracking-tight">
                Welcome back, {user?.fullName}!
              </h1>
              <p className="text-sm text-ink-muted mt-1">
                Here is your learning diagnostic ledger and mastery tracker.
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
                Server Authorization Handshake (/api/student/ping)
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
            ★ This endpoint strictly enforces <code className="bg-paper-warm px-1 py-0.5 rounded border border-ink/20">ROLE_STUDENT</code>. Teachers and unauthorized users are denied with HTTP 403.
          </p>
        </div>

        {/* Student Feature Highlights (Preview Grid) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Confirmed Strengths Card */}
          <div className="bg-paper-card border-2 border-ink rounded-2xl p-6 shadow-paper space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-ink flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                Mastered Topics
              </h3>
              <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                92% Avg
              </span>
            </div>
            <ul className="space-y-2 text-xs text-ink-muted">
              <li className="flex items-center justify-between p-2 rounded-lg bg-paper-warm border border-ink/10">
                <span className="font-medium text-ink">Linear Functions & Slope</span>
                <span className="font-mono text-emerald-700 font-bold">Strong</span>
              </li>
              <li className="flex items-center justify-between p-2 rounded-lg bg-paper-warm border border-ink/10">
                <span className="font-medium text-ink">Algebraic Polynomial Basics</span>
                <span className="font-mono text-emerald-700 font-bold">Strong</span>
              </li>
            </ul>
          </div>

          {/* Targeted Learning Gaps Card */}
          <div className="bg-paper-card border-2 border-ink rounded-2xl p-6 shadow-paper space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-ink flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-redpen inline-block" />
                Recommended Focus Gap
              </h3>
              <span className="font-mono text-xs font-bold text-redpen bg-redpen-soft px-2 py-0.5 rounded">
                Practice Needed
              </span>
            </div>
            <div className="p-3.5 rounded-xl border border-redpen/30 bg-redpen-soft/40 space-y-2">
              <p className="text-xs font-bold text-ink">Quadratic Formula: Vertex Finding</p>
              <p className="text-[11px] text-ink-muted">
                3 mistaken steps detected in sign-inversion during last quiz. Practice sheet ready.
              </p>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-redpen hover:text-redpen-dark transition-colors"
              >
                <span>Open Practice Activity</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

