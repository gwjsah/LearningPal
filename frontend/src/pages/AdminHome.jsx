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
  Users,
  Building2,
  UserX,
  RotateCcw,
  FlaskConical,
  BarChart3,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { adminService } from '../services/adminService';
import { Button, PortalShell } from '../components/NotebookPrimitives';

export default function AdminHome() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Pending Teachers State
  const [pendingTeachers, setPendingTeachers] = useState([]);
  const [loadingPending, setLoadingPending] = useState(true);
  const [pendingError, setPendingError] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [confirmRejectId, setConfirmRejectId] = useState(null);

  // Institution Users Directory State
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [usersError, setUsersError] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [actionNotice, setActionNotice] = useState(null);
  const [processingUserId, setProcessingUserId] = useState(null);

  const fetchPendingTeachers = async () => {
    setLoadingPending(true);
    setPendingError('');
    try {
      const data = await adminService.getPendingTeachers();
      setPendingTeachers(data);
    } catch (err) {
      setPendingError(err.message || 'Failed to load pending teacher requests.');
    } finally {
      setLoadingPending(false);
    }
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    setUsersError('');
    try {
      const data = await adminService.getUsers(roleFilter || undefined, statusFilter || undefined);
      setUsers(data);
    } catch (err) {
      setUsersError(err.message || 'Failed to load institution users.');
    } finally {
      setLoadingUsers(false);
    }
  };

  const refreshAll = () => {
    fetchPendingTeachers();
    fetchUsers();
  };

  useEffect(() => {
    fetchPendingTeachers();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, statusFilter]);

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
      fetchUsers(); // Refresh users list
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
      fetchUsers();
    } catch (err) {
      setActionNotice({
        type: 'error',
        text: `Could not reject ${teacher.fullName}: ${err.message}`,
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeactivateUser = async (targetUser) => {
    const confirmed = window.confirm(
      `Are you sure you want to deactivate ${targetUser.fullName}? They will be logged out and cannot log in.`
    );
    if (!confirmed) return;

    setProcessingUserId(targetUser.id);
    setActionNotice(null);
    try {
      await adminService.deactivateUser(targetUser.id);
      setActionNotice({
        type: 'success',
        text: `Deactivated ${targetUser.fullName}.`,
      });
      fetchUsers();
    } catch (err) {
      setActionNotice({
        type: 'error',
        text: `Could not deactivate ${targetUser.fullName}: ${err.message}`,
      });
    } finally {
      setProcessingUserId(null);
    }
  };

  const handleReactivateUser = async (targetUser) => {
    setProcessingUserId(targetUser.id);
    setActionNotice(null);
    try {
      await adminService.reactivateUser(targetUser.id);
      setActionNotice({
        type: 'success',
        text: `Reactivated account for ${targetUser.fullName}.`,
      });
      fetchUsers();
    } catch (err) {
      setActionNotice({
        type: 'error',
        text: `Could not reactivate ${targetUser.fullName}: ${err.message}`,
      });
    } finally {
      setProcessingUserId(null);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const headerActions = (
    <div className="flex items-center gap-2">
      <Button
        to="/admin/evaluation"
        variant="primary"
        size="sm"
        className="font-mono text-xs"
      >
        <BarChart3 className="w-3.5 h-3.5 mr-1 text-white" />
        <span>Evaluation Dashboard</span>
      </Button>
      <Button
        to="/admin/validation"
        variant="mint"
        size="sm"
        className="font-mono text-xs"
      >
        <FlaskConical className="w-3.5 h-3.5 mr-1 text-ink-blue" />
        <span>Validation Lab</span>
      </Button>
      <Button
        variant="secondary"
        size="sm"
        onClick={refreshAll}
        disabled={loadingPending || loadingUsers}
        className="self-start sm:self-auto font-mono text-xs"
      >
        <RefreshCw className={`w-3.5 h-3.5 mr-1 ${loadingPending || loadingUsers ? 'animate-spin' : ''}`} aria-hidden="true" />
        <span>Refresh</span>
      </Button>
    </div>
  );

  const institutionLabel = user?.institutionName
    ? `${user.institutionName} (${user.institutionCode || 'ACTIVE'})`
    : 'Pilot University (PILOT-2026)';

  return (
    <PortalShell
      portalSubtitle="Institution Admin Ledger"
      skipLabel="Skip to admin control ledger"
      user={user}
      onLogout={handleLogout}
      badgeIcon={ShieldCheck}
      badgeLabel="Campus Administrator"
      badgeColorClass="bg-highlighter-yellow text-ink"
      title="Institution Administration Portal"
      subtitle={`Managing users, classes, and research validation for ${institutionLabel}.`}
      headerRight={headerActions}
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

      {/* Evaluation Dashboard Overview Card */}
      <div className="bg-paper-card dark:bg-chalkboard-card border-2 border-ink dark:border-chalkboard-border rounded-2xl shadow-lifted p-6 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-ink-muted dark:text-chalkboard-muted">
              Project Objectives & Empirical Measurement
            </span>
            <h2 className="text-lg font-extrabold text-ink dark:text-chalkboard-chalk flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-redpen dark:text-highlighter-yellow" />
              <span>Project Evaluation Dashboard</span>
            </h2>
            <p className="text-xs sm:text-sm text-ink-muted dark:text-chalkboard-muted max-w-2xl leading-relaxed">
              Track live evaluation metrics against project targets: Helpfulness Ratings (≥ 80%), Usability Survey (≥ 4.0 / 5.0), and Validation Lab (≥ 85% Agreement). Export research-ready pseudonymized CSV datasets.
            </p>
          </div>
          <Button
            to="/admin/evaluation"
            variant="primary"
            size="md"
            className="shrink-0"
          >
            <BarChart3 className="w-4 h-4 mr-1.5" />
            <span>Open Evaluation Dashboard</span>
          </Button>
        </div>
      </div>

      {/* Validation Lab Overview Card */}
      <div className="bg-paper-card dark:bg-chalkboard-card border-2 border-ink dark:border-chalkboard-border rounded-2xl shadow-lifted p-6 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-ink-muted dark:text-chalkboard-muted">
              Research Validation & Accuracy Objective
            </span>
            <h2 className="text-lg font-extrabold text-ink dark:text-chalkboard-chalk flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-redpen dark:text-highlighter-yellow" />
              <span>Institution Validation Lab</span>
            </h2>
            <p className="text-xs sm:text-sm text-ink-muted dark:text-chalkboard-muted max-w-2xl leading-relaxed">
              Monitor campus-wide agreement between blind teacher judgments and automated topic gap classifications against the ≥ 85% validation target.
            </p>
          </div>
          <Button
            to="/admin/validation"
            variant="mint"
            size="md"
            className="shrink-0"
          >
            <span>Open Validation Report</span>
          </Button>
        </div>
      </div>

      {/* SECTION 1: Pending Teachers Approval Queue */}
      <div className="bg-paper-card dark:bg-chalkboard-card border-2 border-ink dark:border-chalkboard-border rounded-2xl shadow-lifted overflow-hidden">
        <div className="px-6 py-3 bg-paper-warm dark:bg-chalkboard-surface border-b-2 border-ink dark:border-chalkboard-borderSubtle flex items-center justify-between text-xs font-mono text-ink-muted dark:text-chalkboard-muted">
          <span className="font-bold text-ink dark:text-chalkboard-chalk flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-redpen inline-block" />
            PENDING TEACHER APPROVALS: {pendingTeachers.length}
          </span>
          <span>Institution Scoped • {user?.institutionCode || 'PILOT-2026'}</span>
        </div>

        {pendingError && (
          <div className="p-4 bg-redpen-soft border-b border-redpen text-redpen-dark text-xs flex items-center justify-between">
            <span>{pendingError}</span>
            <Button variant="secondary" size="sm" onClick={fetchPendingTeachers}>Retry</Button>
          </div>
        )}

        {loadingPending ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-7 h-7 border-4 border-ink-blue dark:border-highlighter-yellow border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="font-mono text-xs text-ink-muted dark:text-chalkboard-muted">
              Loading pending educator requests…
            </p>
          </div>
        ) : pendingTeachers.length === 0 ? (
          <div className="py-12 px-4 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-paper-warm dark:bg-chalkboard-surface border border-ink/20 dark:border-chalkboard-borderSubtle mx-auto flex items-center justify-center text-ink-muted dark:text-chalkboard-muted">
              <Inbox className="w-6 h-6" aria-hidden="true" />
            </div>
            <h2 className="text-base font-bold text-ink dark:text-chalkboard-chalk font-sans">
              No pending teacher requests
            </h2>
            <p className="text-xs text-ink-muted dark:text-chalkboard-muted max-w-sm mx-auto font-mono">
              All instructor accounts in this institution are up to date.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse" aria-label="Pending Teacher Requests Table">
              <thead>
                <tr className="bg-paper-warm/60 dark:bg-chalkboard-surface/70 border-b border-ink/20 dark:border-chalkboard-borderSubtle text-xs font-mono font-bold text-ink-muted dark:text-chalkboard-muted uppercase">
                  <th scope="col" className="py-3 px-6">Applicant</th>
                  <th scope="col" className="py-3 px-6">Email</th>
                  <th scope="col" className="py-3 px-6">Date Requested</th>
                  <th scope="col" className="py-3 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10 dark:divide-chalkboard-borderSubtle">
                {pendingTeachers.map((teacher) => {
                  const isProcessing = processingId === teacher.id;
                  const isConfirmingReject = confirmRejectId === teacher.id;

                  return (
                    <tr key={teacher.id} className="hover:bg-paper-warm/40 dark:hover:bg-chalkboard-surface/40 transition-colors">
                      <td className="py-3.5 px-6 font-bold text-ink dark:text-chalkboard-chalk">{teacher.fullName}</td>
                      <td className="py-3.5 px-6 font-mono text-xs text-ink-muted dark:text-chalkboard-muted">{teacher.email}</td>
                      <td className="py-3.5 px-6 text-xs text-ink-muted dark:text-chalkboard-muted font-mono">
                        {teacher.createdAt ? new Date(teacher.createdAt).toLocaleDateString() : 'Recent'}
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        {isConfirmingReject ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="danger"
                              size="sm"
                              disabled={isProcessing}
                              onClick={() => handleReject(teacher)}
                              aria-label={`Confirm rejection of ${teacher.fullName}`}
                            >
                              Confirm
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={isProcessing}
                              onClick={() => setConfirmRejectId(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="primary"
                              size="sm"
                              disabled={isProcessing}
                              onClick={() => handleApprove(teacher)}
                              aria-label={`Approve ${teacher.fullName}`}
                            >
                              <Check className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>Approve</span>
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              disabled={isProcessing}
                              onClick={() => setConfirmRejectId(teacher.id)}
                              aria-label={`Decline ${teacher.fullName}`}
                            >
                              <X className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>Decline</span>
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECTION 2: Institution Users Directory */}
      <div className="bg-paper-card dark:bg-chalkboard-card border-2 border-ink dark:border-chalkboard-border rounded-2xl shadow-lifted overflow-hidden">
        <div className="px-6 py-4 bg-paper-warm dark:bg-chalkboard-surface border-b-2 border-ink dark:border-chalkboard-borderSubtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-bold text-ink dark:text-chalkboard-chalk text-base flex items-center gap-2">
              <Users className="w-5 h-5 text-ink-blue dark:text-highlighter-mint" aria-hidden="true" />
              <span>Campus User Directory</span>
            </h2>
            <p className="text-xs text-ink-muted dark:text-chalkboard-muted font-mono mt-0.5">
              Roster of registered students, instructors, and administrators ({users.length} total)
            </p>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              aria-label="Filter users by role"
              className="bg-paper dark:bg-chalkboard border border-ink/30 dark:border-chalkboard-borderSubtle rounded-lg px-2.5 py-1.5 text-xs font-mono text-ink dark:text-chalkboard-chalk focus:outline-none focus:ring-2 focus:ring-redpen"
            >
              <option value="">All Roles</option>
              <option value="STUDENT">Students</option>
              <option value="TEACHER">Teachers</option>
              <option value="ADMIN">Admins</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter users by account status"
              className="bg-paper dark:bg-chalkboard border border-ink/30 dark:border-chalkboard-borderSubtle rounded-lg px-2.5 py-1.5 text-xs font-mono text-ink dark:text-chalkboard-chalk focus:outline-none focus:ring-2 focus:ring-redpen"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="PENDING">Pending</option>
              <option value="DEACTIVATED">Deactivated</option>
            </select>
          </div>
        </div>

        {usersError && (
          <div className="p-4 bg-redpen-soft border-b border-redpen text-redpen-dark text-xs flex items-center justify-between">
            <span>{usersError}</span>
            <Button variant="secondary" size="sm" onClick={fetchUsers}>Retry</Button>
          </div>
        )}

        {loadingUsers ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-7 h-7 border-4 border-ink-blue dark:border-highlighter-yellow border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="font-mono text-xs text-ink-muted dark:text-chalkboard-muted">
              Loading user roster…
            </p>
          </div>
        ) : users.length === 0 ? (
          <div className="py-12 px-4 text-center space-y-2">
            <p className="text-sm font-bold text-ink dark:text-chalkboard-chalk">No users match the selected filters</p>
            <p className="text-xs text-ink-muted dark:text-chalkboard-muted font-mono">Try clearing the role or status filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse" aria-label="Institution Users Table">
              <thead>
                <tr className="bg-paper-warm/60 dark:bg-chalkboard-surface/70 border-b border-ink/20 dark:border-chalkboard-borderSubtle text-xs font-mono font-bold text-ink-muted dark:text-chalkboard-muted uppercase">
                  <th scope="col" className="py-3 px-6">Name</th>
                  <th scope="col" className="py-3 px-6">Email</th>
                  <th scope="col" className="py-3 px-6">Role</th>
                  <th scope="col" className="py-3 px-6">Status</th>
                  <th scope="col" className="py-3 px-6 text-right">Account Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10 dark:divide-chalkboard-borderSubtle">
                {users.map((u) => {
                  const isSelf = u.id === user?.id;
                  const isSuper = u.role === 'SUPER_ADMIN';
                  const isDeactivated = u.status === 'DEACTIVATED';
                  const isProcessing = processingUserId === u.id;

                  return (
                    <tr key={u.id} className="hover:bg-paper-warm/40 dark:hover:bg-chalkboard-surface/40 transition-colors">
                      <td className="py-3 px-6 font-bold text-ink dark:text-chalkboard-chalk">
                        {u.fullName} {isSelf && <span className="ml-1 text-[11px] font-mono text-ink-muted dark:text-chalkboard-muted">(You)</span>}
                      </td>
                      <td className="py-3 px-6 font-mono text-xs text-ink-muted dark:text-chalkboard-muted">{u.email}</td>
                      <td className="py-3 px-6 font-mono text-xs">
                        <span className={`px-2 py-0.5 rounded-md font-bold uppercase text-[10px] ${
                          u.role === 'ADMIN' ? 'bg-highlighter-yellow/30 text-ink dark:text-highlighter-yellow border border-ink/20' :
                          u.role === 'TEACHER' ? 'bg-highlighter-mint/30 text-ink dark:text-highlighter-mint border border-ink/20' :
                          'bg-paper-warm text-ink-muted dark:bg-chalkboard-surface dark:text-chalkboard-muted border border-ink/10'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-6 font-mono text-xs">
                        <span className={`px-2 py-0.5 rounded-md font-bold uppercase text-[10px] ${
                          u.status === 'ACTIVE' ? 'bg-highlighter-mintSoft text-ink dark:bg-highlighter-mint/20 dark:text-highlighter-mint' :
                          u.status === 'PENDING' ? 'bg-highlighter-yellow/40 text-ink' :
                          'bg-redpen-soft text-redpen-dark'
                        }`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-right">
                        {isSelf || isSuper ? (
                          <span className="text-xs font-mono text-ink-muted dark:text-chalkboard-muted italic">—</span>
                        ) : isDeactivated ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={isProcessing}
                            onClick={() => handleReactivateUser(u)}
                            aria-label={`Reactivate ${u.fullName}`}
                            className="font-mono text-xs"
                          >
                            <RotateCcw className="w-3 h-3 mr-1" aria-hidden="true" />
                            <span>Reactivate</span>
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={isProcessing}
                            onClick={() => handleDeactivateUser(u)}
                            aria-label={`Deactivate ${u.fullName}`}
                            className="text-redpen hover:bg-redpen-soft font-mono text-xs"
                          >
                            <UserX className="w-3 h-3 mr-1" aria-hidden="true" />
                            <span>Deactivate</span>
                          </Button>
                        )}
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
