import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Check,
  X,
  AlertCircle,
  RefreshCw,
  UserCheck,
  Inbox,
  Calendar,
  Mail,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { adminService } from '../services/adminService';
import { Button, PortalShell } from '../components/NotebookPrimitives';

export default function AdminHome() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [pendingTeachers, setPendingTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionNotice, setActionNotice] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [confirmRejectId, setConfirmRejectId] = useState(null);

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
    setConfirmRejectId(null);
    setActionNotice(null);
    try {
      await adminService.approveTeacher(teacher.id);
      setPendingTeachers((prev) => prev.filter((t) => t.id !== teacher.id));
      setActionNotice({
        type: 'success',
        text: `Approved ${teacher.fullName} (${teacher.email}). Their teacher account is now ACTIVE.`,
      });
    } catch (err) {
      setActionNotice({
        type: 'error',
        text: `Could not approve ${teacher.fullName}: ${err.message}`,
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (teacher) => {
    setProcessingId(teacher.id);
    setConfirmRejectId(null);
    setActionNotice(null);
    try {
      await adminService.rejectTeacher(teacher.id);
      setPendingTeachers((prev) => prev.filter((t) => t.id !== teacher.id));
      setActionNotice({
        type: 'success',
        text: `Declined teacher registration request for ${teacher.fullName}.`,
      });
    } catch (err) {
      setActionNotice({
        type: 'error',
        text: `Could not reject ${teacher.fullName}: ${err.message}`,
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const refreshButton = (
    <Button
      variant="secondary"
      size="sm"
      onClick={fetchPendingTeachers}
      disabled={loading}
      className="self-start sm:self-auto font-mono"
    >
      <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
      <span>Refresh Ledger</span>
    </Button>
  );

  return (
    <PortalShell
      portalSubtitle="Admin Control Ledger"
      skipLabel="Skip to admin approval queue"
      user={user}
      onLogout={handleLogout}
      badgeIcon={ShieldCheck}
      badgeLabel="Administrative Ledger"
      badgeColorClass="bg-highlighter-yellow text-ink"
      title="Teacher Verification & Approval Queue"
      subtitle="Review educator applications before granting access to student diagnostic gradebooks."
      headerRight={refreshButton}
    >
      {/* Action Confirmation Banner */}
      {actionNotice && (
        <div
          role="status"
          aria-live="polite"
          className={`flex items-center gap-3 p-4 rounded-xl border-2 font-medium text-sm shadow-sm animate-fadeIn ${
            actionNotice.type === 'success'
              ? 'border-ink bg-highlighter-mintSoft text-ink'
              : 'border-redpen bg-redpen-soft text-redpen-dark'
          }`}
        >
          {actionNotice.type === 'success' ? (
            <UserCheck className="w-5 h-5 text-ink-blue shrink-0" aria-hidden="true" />
          ) : (
            <AlertCircle className="w-5 h-5 text-redpen shrink-0" aria-hidden="true" />
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
          <AlertCircle className="w-5 h-5 text-redpen shrink-0 mt-0.5" aria-hidden="true" />
          <div className="flex-1">
            <p className="font-bold">Unable to Load Approval Queue</p>
            <p className="text-xs mt-0.5">{error}</p>
          </div>
          <Button variant="secondary" size="sm" onClick={fetchPendingTeachers}>
            Retry
          </Button>
        </div>
      )}

      {/* Gradebook / Checklist Styled Table */}
      <div className="bg-paper-card dark:bg-chalkboard-card border-2 border-ink dark:border-white/45 rounded-2xl shadow-lifted overflow-hidden">
        <div className="px-6 py-3 bg-paper-warm dark:bg-chalkboard-surface border-b-2 border-ink dark:border-white/30 flex items-center justify-between text-xs font-mono text-ink-muted dark:text-chalkboard-muted">
          <span className="font-bold text-ink dark:text-chalkboard-chalk flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-redpen inline-block" />
            PENDING REGISTRATIONS: {pendingTeachers.length}
          </span>
          <span>Index Ref • SEC-ADM-01</span>
        </div>

        {loading ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-8 h-8 border-4 border-ink-blue dark:border-highlighter-yellow border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="font-mono text-xs text-ink-muted dark:text-chalkboard-muted">
              Reading pending educator applications…
            </p>
          </div>
        ) : pendingTeachers.length === 0 ? (
          <div className="py-16 px-4 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-paper-warm dark:bg-chalkboard-surface border-2 border-ink/30 dark:border-white/30 mx-auto flex items-center justify-center text-ink-muted dark:text-chalkboard-muted">
              <Inbox className="w-7 h-7" aria-hidden="true" />
            </div>
            <h2 className="text-lg font-bold text-ink dark:text-chalkboard-chalk font-sans">
              No teacher requests waiting
            </h2>
            <p className="text-xs text-ink-muted dark:text-chalkboard-muted max-w-sm mx-auto font-mono">
              All educator registration requests have been reviewed. New applications will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse" aria-label="Pending Teacher Requests Table">
              <thead>
                <tr className="bg-paper-warm/60 dark:bg-chalkboard-surface/70 border-b border-ink/20 dark:border-white/20 text-xs font-mono font-bold text-ink-muted dark:text-chalkboard-muted uppercase">
                  <th scope="col" className="py-3 px-6">Applicant Name</th>
                  <th scope="col" className="py-3 px-6">Email Address</th>
                  <th scope="col" className="py-3 px-6">Date Requested</th>
                  <th scope="col" className="py-3 px-6 text-right">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10 dark:divide-white/10">
                {pendingTeachers.map((teacher) => {
                  const isProcessing = processingId === teacher.id;
                  const isConfirmingReject = confirmRejectId === teacher.id;
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
                      className="hover:bg-paper-warm/40 dark:hover:bg-white/5 transition-colors"
                    >
                      <td className="py-4 px-6 font-bold text-ink dark:text-chalkboard-chalk font-sans">
                        {teacher.fullName}
                      </td>

                      <td className="py-4 px-6 font-mono text-xs text-ink-muted dark:text-chalkboard-muted">
                        <span className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-ink-light dark:text-chalkboard-muted" aria-hidden="true" />
                          {teacher.email}
                        </span>
                      </td>

                      <td className="py-4 px-6 font-mono text-xs text-ink-muted dark:text-chalkboard-muted">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-ink-light dark:text-chalkboard-muted" aria-hidden="true" />
                          {formattedDate}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="mint"
                            size="sm"
                            onClick={() => handleApprove(teacher)}
                            disabled={isProcessing}
                            aria-label={`Approve ${teacher.fullName}`}
                          >
                            <Check className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Approve</span>
                          </Button>

                          {isConfirmingReject ? (
                            <div className="inline-flex items-center gap-1.5 animate-fadeIn">
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleReject(teacher)}
                                disabled={isProcessing}
                                aria-label={`Confirm rejecting ${teacher.fullName}`}
                              >
                                <span>Confirm Reject</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setConfirmRejectId(null)}
                                disabled={isProcessing}
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => setConfirmRejectId(teacher.id)}
                              disabled={isProcessing}
                              aria-label={`Reject ${teacher.fullName}`}
                            >
                              <X className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>Reject</span>
                            </Button>
                          )}
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
    </PortalShell>
  );
}
