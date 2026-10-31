import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  LogOut,
  Check,
  X,
  Clock,
  AlertCircle,
  RefreshCw,
  UserCheck,
  Inbox,
  Calendar,
  Mail,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { adminService } from '../services/adminService';
import { LearningPalLogo } from '../components/Doodles';

export default function AdminHome() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [pendingTeachers, setPendingTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionNotice, setActionNotice] = useState(null); // { type: 'success'|'error', text: string }
  const [processingId, setProcessingId] = useState(null);

  const fetchPendingTeachers = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminService.getPendingTeachers();
      setPendingTeachers(data);
    } catch (err) {
      setError(err.message || 'Failed to load pending teacher requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingTeachers();
  }, []);

  const handleApprove = async (teacher) => {
    setProcessingId(teacher.id);
    setActionNotice(null);
    try {
      await adminService.approveTeacher(teacher.id);
      // Remove row immediately from pending list
      setPendingTeachers((prev) => prev.filter((t) => t.id !== teacher.id));
      setActionNotice({
        type: 'success',
        text: `Approved ${teacher.fullName} (${teacher.email}). Their account is now ACTIVE.`,
      });
    } catch (err) {
      setActionNotice({
        type: 'error',
        text: `Failed to approve ${teacher.fullName}: ${err.message}`,
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (teacher) => {
    setProcessingId(teacher.id);
    setActionNotice(null);
    try {
      await adminService.rejectTeacher(teacher.id);
      // Remove row immediately from pending list
      setPendingTeachers((prev) => prev.filter((t) => t.id !== teacher.id));
      setActionNotice({
        type: 'success',
        text: `Declined teacher registration request for ${teacher.fullName}.`,
      });
    } catch (err) {
      setActionNotice({
        type: 'error',
        text: `Failed to reject ${teacher.fullName}: ${err.message}`,
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-paper flex flex-col text-ink font-sans">
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
                Admin Control Ledger
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-bold text-ink">{user?.fullName || 'System Admin'}</span>
              <span className="text-[10px] font-mono text-ink-muted">{user?.email}</span>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-ink bg-paper-warm hover:bg-redpen hover:text-white text-ink text-xs font-bold shadow-[2px_2px_0_#1B2534] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-redpen"
              title="Sign out of administrator account"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Workspace */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-8 space-y-6">
        {/* Admin Header Notebook Spread */}
        <div className="relative bg-paper-card border-2 border-ink rounded-2xl p-6 sm:p-8 shadow-lifted notebook-margin-line pl-12 sm:pl-16 bg-ruled-paper">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-highlighter-yellow text-ink font-mono text-xs font-bold uppercase tracking-wider border border-ink/20 mb-2">
                <ShieldCheck className="w-4 h-4 text-ink-blue" />
                <span>Administrative Ledger</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
                Teacher Verification & Approval Queue
              </h1>
              <p className="text-sm text-ink-muted mt-1">
                Review and approve educator applications before granting access to student gradebooks.
              </p>
            </div>

            <button
              type="button"
              onClick={fetchPendingTeachers}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border-2 border-ink bg-paper-warm hover:bg-paper font-mono text-xs font-bold shadow-[2px_2px_0_#1B2534] transition-all self-start sm:self-auto focus:outline-none focus-visible:ring-2 focus-visible:ring-redpen"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Ledger</span>
            </button>
          </div>
        </div>

        {/* Action Confirmation Banner */}
        {actionNotice && (
          <div
            role="status"
            aria-live="polite"
            className={`flex items-center gap-3 p-4 rounded-xl border-2 font-medium text-sm shadow-sm animate-fadeIn ${
              actionNotice.type === 'success'
                ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                : 'border-redpen bg-redpen-soft text-redpen-dark'
            }`}
          >
            {actionNotice.type === 'success' ? (
              <UserCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-redpen shrink-0" />
            )}
            <span>{actionNotice.text}</span>
          </div>
        )}

        {/* Error State Banner */}
        {error && (
          <div
            role="alert"
            className="flex items-start gap-3 p-4 rounded-xl border-2 border-redpen bg-redpen-soft text-redpen-dark text-sm font-medium shadow-sm"
          >
            <AlertCircle className="w-5 h-5 text-redpen shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold">Error Loading Queue</p>
              <p className="text-xs mt-0.5">{error}</p>
            </div>
            <button
              type="button"
              onClick={fetchPendingTeachers}
              className="px-2.5 py-1 text-xs font-mono font-bold bg-white border border-redpen rounded shadow-sm hover:bg-redpen hover:text-white transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Gradebook / Checklist Styled Table */}
        <div className="bg-paper-card border-2 border-ink rounded-2xl shadow-lifted overflow-hidden">
          {/* Notebook Checklist Top Header */}
          <div className="px-6 py-3 bg-paper-warm border-b-2 border-ink flex items-center justify-between text-xs font-mono text-ink-muted">
            <span className="font-bold text-ink flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-redpen inline-block" />
              PENDING REGISTRATIONS: {pendingTeachers.length}
            </span>
            <span>Index Ref • SEC-ADM-01</span>
          </div>

          {loading ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-8 h-8 border-4 border-ink-blue border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="font-mono text-xs text-ink-muted">Reading pending entries from database…</p>
            </div>
          ) : pendingTeachers.length === 0 ? (
            /* Empty State */
            <div className="py-16 px-4 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-paper-warm border-2 border-ink/30 mx-auto flex items-center justify-center text-ink-muted">
                <Inbox className="w-7 h-7" />
              </div>
              <h2 className="text-lg font-bold text-ink font-sans">
                No teacher requests waiting
              </h2>
              <p className="text-xs text-ink-muted max-w-sm mx-auto font-mono">
                All educator registration requests have been reviewed and resolved. New applications will appear here automatically.
              </p>
            </div>
          ) : (
            /* Pending Teachers Table */
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse" aria-label="Pending Teacher Requests Table">
                <thead>
                  <tr className="bg-paper-warm/60 border-b border-ink/20 text-xs font-mono font-bold text-ink-muted uppercase">
                    <th scope="col" className="py-3 px-6">Applicant Name</th>
                    <th scope="col" className="py-3 px-6">Email Address</th>
                    <th scope="col" className="py-3 px-6">Date Requested</th>
                    <th scope="col" className="py-3 px-6 text-right">Review Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/10">
                  {pendingTeachers.map((teacher) => {
                    const isProcessing = processingId === teacher.id;
                    const formattedDate = teacher.createdAt
                      ? new Date(teacher.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Recently';

                    return (
                      <tr
                        key={teacher.id}
                        className="hover:bg-paper-warm/40 transition-colors"
                      >
                        {/* Name */}
                        <td className="py-4 px-6 font-bold text-ink font-sans">
                          {teacher.fullName}
                        </td>

                        {/* Email */}
                        <td className="py-4 px-6 font-mono text-xs text-ink-muted">
                          <span className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-ink-light" />
                            {teacher.email}
                          </span>
                        </td>

                        {/* Date Requested */}
                        <td className="py-4 px-6 font-mono text-xs text-ink-muted">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-ink-light" />
                            {formattedDate}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Approve Button */}
                            <button
                              type="button"
                              onClick={() => handleApprove(teacher)}
                              disabled={isProcessing}
                              aria-label={`Approve ${teacher.fullName}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-ink bg-highlighter-mint hover:bg-emerald-300 text-ink text-xs font-bold shadow-[2px_2px_0_#1B2534] hover:translate-y-[-1px] active:translate-y-0 disabled:opacity-50 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
                            >
                              <Check className="w-3.5 h-3.5 text-emerald-800" />
                              <span>Approve</span>
                            </button>

                            {/* Reject Button */}
                            <button
                              type="button"
                              onClick={() => handleReject(teacher)}
                              disabled={isProcessing}
                              aria-label={`Reject ${teacher.fullName}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-ink bg-redpen-soft hover:bg-redpen hover:text-white text-redpen-dark text-xs font-bold shadow-[2px_2px_0_#1B2534] hover:translate-y-[-1px] active:translate-y-0 disabled:opacity-50 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-redpen"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

