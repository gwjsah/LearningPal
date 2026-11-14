import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ShieldCheck,
  Check,
  X,
  AlertCircle,
  RefreshCw,
  UserCheck,
  Inbox,
  Users,
  BookOpen,
  UserX,
  RotateCcw,
  FlaskConical,
  BarChart3,
  ArrowRightLeft,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { adminService } from '../services/adminService';
import {
  Button,
  PortalShell,
  NotebookTabs,
  NotebookTabPanel,
  SearchInput,
  PaginationControls,
  NotebookTable,
  NotebookTableHead,
  NotebookTableRow,
  NotebookTableHeaderCell,
  NotebookTableCell,
  EmptyState,
} from '../components/NotebookPrimitives';

const ROLE_OPTIONS = [
  { value: 'ALL', label: 'All' },
  { value: 'TEACHER', label: 'Teachers' },
  { value: 'STUDENT', label: 'Students' },
  { value: 'ADMIN', label: 'Admins' },
];

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'DEACTIVATED', label: 'Deactivated' },
  { value: 'PENDING', label: 'Pending' },
];

export default function AdminHome() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const rawTab = searchParams.get('tab');
  const activeTab = rawTab === 'classes' ? 'classes' : 'users';

  const handleTabChange = (tabId) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', tabId);
    setSearchParams(next, { replace: true });
  };

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
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [userSortField, setUserSortField] = useState('fullName');
  const [userSortDir, setUserSortDir] = useState('asc');
  const [userPage, setUserPage] = useState(1);
  const [userPageSize, setUserPageSize] = useState(10);
  const [processingUserId, setProcessingUserId] = useState(null);

  // Institution Classes & Reassignment State
  const [classes, setClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [classesError, setClassesError] = useState('');
  const [classSearch, setClassSearch] = useState('');
  const [classStatusFilter, setClassStatusFilter] = useState('ALL');
  const [classPage, setClassPage] = useState(1);
  const [classPageSize, setClassPageSize] = useState(10);
  const [selectedTeacherByClass, setSelectedTeacherByClass] = useState({});
  const [reassigningClassId, setReassigningClassId] = useState(null);

  // Shared Notice Banner
  const [actionNotice, setActionNotice] = useState(null);

  const fetchPendingTeachers = async () => {
    setLoadingPending(true);
    setPendingError('');
    try {
      const data = await adminService.getPendingTeachers();
      setPendingTeachers(Array.isArray(data) ? data : []);
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
      const data = await adminService.getUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setUsersError(err.message || 'Failed to load institution users.');
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchClasses = async () => {
    setLoadingClasses(true);
    setClassesError('');
    try {
      const data = await adminService.getClasses();
      const list = Array.isArray(data) ? data : [];
      setClasses(list);
      const initialSelections = {};
      list.forEach((cls) => {
        if (cls.teacherId != null) {
          initialSelections[cls.id] = String(cls.teacherId);
        }
      });
      setSelectedTeacherByClass(initialSelections);
    } catch (err) {
      setClassesError(err.message || 'Failed to load institution classes.');
    } finally {
      setLoadingClasses(false);
    }
  };

  const refreshAll = () => {
    fetchPendingTeachers();
    fetchUsers();
    fetchClasses();
  };

  useEffect(() => {
    refreshAll();
  }, []);

  // Reset pagination when user filters change
  useEffect(() => {
    setUserPage(1);
  }, [userSearch, roleFilter, statusFilter, userPageSize]);

  // Reset pagination when class filters change
  useEffect(() => {
    setClassPage(1);
  }, [classSearch, classStatusFilter, classPageSize]);

  const activeTeachers = useMemo(
    () =>
      users
        .filter((u) => u.role === 'TEACHER' && u.status === 'ACTIVE')
        .sort((a, b) => (a.fullName || '').localeCompare(b.fullName || '')),
    [users]
  );

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    const list = users.filter((u) => {
      if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
      if (statusFilter !== 'ALL' && u.status !== statusFilter) return false;
      if (q) {
        const nameMatch = (u.fullName || '').toLowerCase().includes(q);
        const emailMatch = (u.email || '').toLowerCase().includes(q);
        if (!nameMatch && !emailMatch) return false;
      }
      return true;
    });

    return [...list].sort((a, b) => {
      const valA = String(a[userSortField] || '').toLowerCase();
      const valB = String(b[userSortField] || '').toLowerCase();
      const cmp = valA.localeCompare(valB);
      return userSortDir === 'asc' ? cmp : -cmp;
    });
  }, [users, userSearch, roleFilter, statusFilter, userSortField, userSortDir]);

  const paginatedUsers = useMemo(() => {
    const start = (userPage - 1) * userPageSize;
    return filteredUsers.slice(start, start + userPageSize);
  }, [filteredUsers, userPage, userPageSize]);

  const filteredClasses = useMemo(() => {
    const q = classSearch.trim().toLowerCase();
    return classes.filter((cls) => {
      if (classStatusFilter !== 'ALL' && cls.status !== classStatusFilter) return false;
      if (q) {
        const hay = [
          cls.name,
          cls.joinCode,
          cls.subjectCode,
          cls.subjectName,
          cls.teacherName,
          cls.teacherEmail,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [classes, classSearch, classStatusFilter]);

  const paginatedClasses = useMemo(() => {
    const start = (classPage - 1) * classPageSize;
    return filteredClasses.slice(start, start + classPageSize);
  }, [filteredClasses, classPage, classPageSize]);

  const toggleUserSort = (field) => {
    if (userSortField === field) {
      setUserSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setUserSortField(field);
      setUserSortDir('asc');
    }
  };

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
      fetchUsers();
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

  const handleReassignTeacher = async (cls) => {
    const nextTeacherId = Number(selectedTeacherByClass[cls.id]);
    if (!nextTeacherId || nextTeacherId === cls.teacherId) return;

    setReassigningClassId(cls.id);
    setActionNotice(null);
    try {
      const res = await adminService.reassignClassTeacher(cls.id, nextTeacherId);
      setActionNotice({
        type: 'success',
        text: res?.message || `Reassigned ${cls.name} to the selected instructor.`,
      });
      fetchClasses();
    } catch (err) {
      setActionNotice({
        type: 'error',
        text: `Could not reassign ${cls.name}: ${err.message}`,
      });
    } finally {
      setReassigningClassId(null);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const headerActions = (
    <div className="flex flex-col sm:items-end gap-2 shrink-0">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          to="/admin/evaluation"
          variant="primary"
          size="sm"
          className="font-mono text-xs whitespace-nowrap"
        >
          <BarChart3 className="w-3.5 h-3.5 mr-1 text-white" />
          <span>Evaluation Dashboard</span>
        </Button>
        <Button
          to="/admin/validation"
          variant="mint"
          size="sm"
          className="font-mono text-xs whitespace-nowrap"
        >
          <FlaskConical className="w-3.5 h-3.5 mr-1 text-ink-blue" />
          <span>Validation Report</span>
        </Button>
      </div>
      <Button
        variant="secondary"
        size="sm"
        onClick={refreshAll}
        disabled={loadingPending || loadingUsers || loadingClasses}
        className="font-mono text-xs self-start sm:self-end whitespace-nowrap"
      >
        <RefreshCw
          className={`w-3.5 h-3.5 mr-1 ${
            loadingPending || loadingUsers || loadingClasses ? 'animate-spin' : ''
          }`}
          aria-hidden="true"
        />
        <span>Refresh Data</span>
      </Button>
    </div>
  );

  const institutionLabel = user?.institutionName
    ? `${user.institutionName} (${user.institutionCode || 'ACTIVE'})`
    : 'Pilot University (PILOT-2026)';

  const adminTabs = [
    {
      id: 'users',
      label: 'User Directory',
      icon: Users,
      badge: users.length,
    },
    {
      id: 'classes',
      label: 'Classes & Reassignment',
      icon: BookOpen,
      badge: classes.length,
    },
  ];

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
      subtitle={`Managing educator approvals, user directory, and classroom assignments for ${institutionLabel}.`}
      headerRight={headerActions}
    >
      {/* Action Confirmation Banner */}
      {actionNotice && (
        <div
          role="status"
          aria-live="polite"
          className={`flex items-center justify-between gap-3 p-3.5 rounded-xl border-2 font-medium text-xs sm:text-sm shadow-xs ${
            actionNotice.type === 'success'
              ? 'border-ink bg-highlighter-mintSoft text-ink'
              : 'border-redpen bg-redpen-soft text-redpen-dark'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {actionNotice.type === 'success' ? (
              <UserCheck className="w-4 h-4 text-ink-blue shrink-0" aria-hidden="true" />
            ) : (
              <AlertCircle className="w-4 h-4 text-redpen shrink-0" aria-hidden="true" />
            )}
            <span>{actionNotice.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionNotice(null)}
            className="text-xs font-mono underline opacity-80 hover:opacity-100 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* SECTION 1: Compact Pending Teacher Approvals Table */}
      <section aria-labelledby="pending-approvals-heading" className="space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full inline-block ${
                pendingTeachers.length > 0 ? 'bg-redpen' : 'bg-emerald-600 dark:bg-emerald-400'
              }`}
              aria-hidden="true"
            />
            <h2
              id="pending-approvals-heading"
              className="text-sm font-mono font-bold uppercase tracking-wider text-ink dark:text-chalkboard-chalk"
            >
              Pending Teacher Approvals ({pendingTeachers.length})
            </h2>
          </div>
          <span className="text-xs font-mono text-ink-muted dark:text-chalkboard-muted">
            Institution Code: <strong className="text-ink dark:text-chalkboard-chalk">{user?.institutionCode || 'PILOT-2026'}</strong>
          </span>
        </div>

        {pendingError && (
          <div className="p-3 rounded-xl bg-redpen-soft border border-redpen text-redpen-dark text-xs flex items-center justify-between">
            <span>{pendingError}</span>
            <Button variant="secondary" size="sm" onClick={fetchPendingTeachers}>
              Retry
            </Button>
          </div>
        )}

        {loadingPending ? (
          <div className="p-6 rounded-2xl border-2 border-ink dark:border-chalkboard-border bg-paper-card dark:bg-chalkboard-card text-center">
            <span className="font-mono text-xs text-ink-muted dark:text-chalkboard-muted">
              Loading pending educator requests…
            </span>
          </div>
        ) : pendingTeachers.length === 0 ? (
          <div className="px-4 py-3 rounded-xl border-2 border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-card dark:bg-chalkboard-card flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-ink-muted dark:text-chalkboard-muted">
            <div className="flex items-center gap-2">
              <Inbox className="w-4 h-4 text-ink-muted dark:text-chalkboard-muted shrink-0" aria-hidden="true" />
              <span className="font-bold text-ink dark:text-chalkboard-chalk">No pending teacher requests.</span>
              <span>All instructor registrations in this institution have been reviewed.</span>
            </div>
          </div>
        ) : (
          <NotebookTable>
            <NotebookTableHead>
              <NotebookTableRow hover={false}>
                <NotebookTableHeaderCell>Name</NotebookTableHeaderCell>
                <NotebookTableHeaderCell>Email</NotebookTableHeaderCell>
                <NotebookTableHeaderCell>Requested Date</NotebookTableHeaderCell>
                <NotebookTableHeaderCell align="right">Actions</NotebookTableHeaderCell>
              </NotebookTableRow>
            </NotebookTableHead>
            <tbody className="divide-y divide-ink/10 dark:divide-chalkboard-borderSubtle">
              {pendingTeachers.map((teacher) => {
                const isProcessing = processingId === teacher.id;
                const isConfirmingReject = confirmRejectId === teacher.id;

                return (
                  <NotebookTableRow key={teacher.id}>
                    <NotebookTableCell className="font-sans font-bold text-ink dark:text-chalkboard-chalk">
                      {teacher.fullName}
                    </NotebookTableCell>
                    <NotebookTableCell className="text-ink-muted dark:text-chalkboard-muted">
                      {teacher.email}
                    </NotebookTableCell>
                    <NotebookTableCell className="text-ink-muted dark:text-chalkboard-muted">
                      {teacher.createdAt ? new Date(teacher.createdAt).toLocaleDateString() : 'Recent'}
                    </NotebookTableCell>
                    <NotebookTableCell align="right">
                      {isConfirmingReject ? (
                        <div className="inline-flex items-center justify-end gap-1.5">
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
                        <div className="inline-flex items-center justify-end gap-2">
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
                            aria-label={`Reject ${teacher.fullName}`}
                          >
                            <X className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Reject</span>
                          </Button>
                        </div>
                      )}
                    </NotebookTableCell>
                  </NotebookTableRow>
                );
              })}
            </tbody>
          </NotebookTable>
        )}
      </section>

      {/* SECTION 2: Tabbed Directory (Users & Classes) */}
      <section aria-label="Institution Directory and Class Management" className="space-y-4">
        <NotebookTabs
          tabs={adminTabs}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          ariaLabel="Admin directory views"
        />

        {/* TAB 1: USER DIRECTORY */}
        <NotebookTabPanel id="users" activeTab={activeTab} className="space-y-4">
          {/* Controls Bar: Search, Role Filter Pills, Status Filter */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-2xl bg-paper-card dark:bg-chalkboard-card border-2 border-ink dark:border-chalkboard-border shadow-notebook-sm">
            {/* Role Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {ROLE_OPTIONS.map((opt) => {
                const active = roleFilter === opt.value;
                const count =
                  opt.value === 'ALL'
                    ? users.length
                    : users.filter((u) => u.role === opt.value).length;

                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRoleFilter(opt.value)}
                    aria-pressed={active}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer border ${
                      active
                        ? 'bg-ink text-white dark:bg-highlighter-mint dark:text-ink border-ink dark:border-chalkboard-border shadow-xs'
                        : 'bg-paper-warm dark:bg-chalkboard-surface text-ink-muted dark:text-chalkboard-muted border-ink/20 dark:border-chalkboard-borderSubtle hover:text-ink dark:hover:text-chalkboard-chalk'
                    }`}
                  >
                    {opt.label} ({count})
                  </button>
                );
              })}
            </div>

            {/* Search & Status Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter users by account status"
                className="bg-paper dark:bg-chalkboard border-2 border-ink/20 dark:border-chalkboard-borderSubtle rounded-xl px-3 py-1.5 text-xs font-mono text-ink dark:text-chalkboard-chalk focus:outline-none focus:border-ink dark:focus:border-highlighter-mint"
              >
                {STATUS_OPTIONS.map((st) => (
                  <option key={st.value} value={st.value}>
                    {st.label}
                  </option>
                ))}
              </select>

              <SearchInput
                id="admin-user-search"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                onClear={() => setUserSearch('')}
                placeholder="Search name or email…"
                ariaLabel="Search users by name or email"
                className="w-full sm:w-64"
              />
            </div>
          </div>

          {usersError && (
            <div className="p-3 rounded-xl bg-redpen-soft border border-redpen text-redpen-dark text-xs flex items-center justify-between">
              <span>{usersError}</span>
              <Button variant="secondary" size="sm" onClick={fetchUsers}>
                Retry
              </Button>
            </div>
          )}

          {loadingUsers ? (
            <div className="py-12 rounded-2xl border-2 border-ink dark:border-chalkboard-border bg-paper-card dark:bg-chalkboard-card text-center space-y-2">
              <div className="w-6 h-6 border-3 border-ink-blue dark:border-highlighter-yellow border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="font-mono text-xs text-ink-muted dark:text-chalkboard-muted">
                Loading campus user directory…
              </p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No users match your filters"
              message="Try clearing your search query or switching the role and status filters."
              action={
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setUserSearch('');
                    setRoleFilter('ALL');
                    setStatusFilter('ALL');
                  }}
                >
                  Reset Filters
                </Button>
              }
            />
          ) : (
            <div className="space-y-0">
              <NotebookTable>
                <NotebookTableHead>
                  <NotebookTableRow hover={false}>
                    <NotebookTableHeaderCell
                      sortable
                      sorted={userSortField === 'fullName' ? userSortDir : null}
                      onSort={() => toggleUserSort('fullName')}
                    >
                      Name
                    </NotebookTableHeaderCell>
                    <NotebookTableHeaderCell
                      sortable
                      sorted={userSortField === 'email' ? userSortDir : null}
                      onSort={() => toggleUserSort('email')}
                    >
                      Email
                    </NotebookTableHeaderCell>
                    <NotebookTableHeaderCell>Role</NotebookTableHeaderCell>
                    <NotebookTableHeaderCell>Status</NotebookTableHeaderCell>
                    <NotebookTableHeaderCell align="right">Account Actions</NotebookTableHeaderCell>
                  </NotebookTableRow>
                </NotebookTableHead>
                <tbody className="divide-y divide-ink/10 dark:divide-chalkboard-borderSubtle">
                  {paginatedUsers.map((u) => {
                    const isSelf = u.id === user?.id;
                    const isSuper = u.role === 'SUPER_ADMIN';
                    const isDeactivated = u.status === 'DEACTIVATED';
                    const isProcessing = processingUserId === u.id;

                    return (
                      <NotebookTableRow key={u.id}>
                        <NotebookTableCell className="font-sans font-bold text-ink dark:text-chalkboard-chalk">
                          {u.fullName}
                          {isSelf && (
                            <span className="ml-1.5 text-[11px] font-mono font-normal text-ink-muted dark:text-chalkboard-muted">
                              (You)
                            </span>
                          )}
                        </NotebookTableCell>
                        <NotebookTableCell className="text-ink-muted dark:text-chalkboard-muted">
                          {u.email}
                        </NotebookTableCell>
                        <NotebookTableCell>
                          <span
                            className={`px-2 py-0.5 rounded-md font-bold uppercase text-[10px] ${
                              u.role === 'ADMIN'
                                ? 'bg-highlighter-yellow/30 text-ink dark:text-highlighter-yellow border border-ink/20'
                                : u.role === 'TEACHER'
                                ? 'bg-highlighter-mint/30 text-ink dark:text-highlighter-mint border border-ink/20'
                                : 'bg-paper-warm text-ink-muted dark:bg-chalkboard-surface dark:text-chalkboard-muted border border-ink/10'
                            }`}
                          >
                            {u.role}
                          </span>
                        </NotebookTableCell>
                        <NotebookTableCell>
                          <span
                            className={`px-2 py-0.5 rounded-md font-bold uppercase text-[10px] ${
                              u.status === 'ACTIVE'
                                ? 'bg-highlighter-mintSoft text-ink dark:bg-highlighter-mint/20 dark:text-highlighter-mint'
                                : u.status === 'PENDING'
                                ? 'bg-highlighter-yellow/40 text-ink dark:text-highlighter-yellow'
                                : 'bg-redpen-soft text-redpen-dark'
                            }`}
                          >
                            {u.status}
                          </span>
                        </NotebookTableCell>
                        <NotebookTableCell align="right">
                          {isSelf || isSuper ? (
                            <span className="text-xs font-mono text-ink-muted dark:text-chalkboard-muted italic">
                              —
                            </span>
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
                        </NotebookTableCell>
                      </NotebookTableRow>
                    );
                  })}
                </tbody>
              </NotebookTable>

              <PaginationControls
                currentPage={userPage}
                pageSize={userPageSize}
                totalItems={filteredUsers.length}
                onPageChange={setUserPage}
                onPageSizeChange={(newSize) => {
                  setUserPageSize(newSize);
                  setUserPage(1);
                }}
                pageSizeOptions={[10, 25, 50]}
              />
            </div>
          )}
        </NotebookTabPanel>

        {/* TAB 2: CLASSES & TEACHER REASSIGNMENT */}
        <NotebookTabPanel id="classes" activeTab={activeTab} className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-2xl bg-paper-card dark:bg-chalkboard-card border-2 border-ink dark:border-chalkboard-border shadow-notebook-sm">
            {/* Class Status Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {[
                { value: 'ALL', label: 'All Classes' },
                { value: 'ACTIVE', label: 'Active' },
                { value: 'ARCHIVED', label: 'Archived' },
              ].map((opt) => {
                const active = classStatusFilter === opt.value;
                const count =
                  opt.value === 'ALL'
                    ? classes.length
                    : classes.filter((c) => c.status === opt.value).length;

                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setClassStatusFilter(opt.value);
                      setClassPage(1);
                    }}
                    aria-pressed={active}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer border ${
                      active
                        ? 'bg-ink text-white dark:bg-highlighter-mint dark:text-ink border-ink dark:border-chalkboard-border shadow-xs'
                        : 'bg-paper-warm dark:bg-chalkboard-surface text-ink-muted dark:text-chalkboard-muted border-ink/20 dark:border-chalkboard-borderSubtle hover:text-ink dark:hover:text-chalkboard-chalk'
                    }`}
                  >
                    {opt.label} ({count})
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <SearchInput
              id="admin-class-search"
              value={classSearch}
              onChange={(e) => {
                setClassSearch(e.target.value);
                setClassPage(1);
              }}
              onClear={() => {
                setClassSearch('');
                setClassPage(1);
              }}
              placeholder="Search class, subject, join code, teacher…"
              ariaLabel="Search classes by name, subject, join code, or teacher"
              className="w-full sm:w-80"
            />
          </div>

          {classesError && (
            <div className="p-3 rounded-xl bg-redpen-soft border border-redpen text-redpen-dark text-xs flex items-center justify-between">
              <span>{classesError}</span>
              <Button variant="secondary" size="sm" onClick={fetchClasses}>
                Retry
              </Button>
            </div>
          )}

          {loadingClasses ? (
            <div className="py-12 rounded-2xl border-2 border-ink dark:border-chalkboard-border bg-paper-card dark:bg-chalkboard-card text-center space-y-2">
              <div className="w-6 h-6 border-3 border-ink-blue dark:border-highlighter-yellow border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="font-mono text-xs text-ink-muted dark:text-chalkboard-muted">
                Loading institution classes…
              </p>
            </div>
          ) : filteredClasses.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No classes match your filters"
              message="Try clearing the search box or switching the class status filter."
              action={
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setClassSearch('');
                    setClassStatusFilter('ALL');
                  }}
                >
                  Reset Filters
                </Button>
              }
            />
          ) : (
            <div className="space-y-0">
              <NotebookTable>
                <NotebookTableHead>
                  <NotebookTableRow hover={false}>
                    <NotebookTableHeaderCell>Class Section</NotebookTableHeaderCell>
                    <NotebookTableHeaderCell>Subject</NotebookTableHeaderCell>
                    <NotebookTableHeaderCell align="center">Students</NotebookTableHeaderCell>
                    <NotebookTableHeaderCell align="center">Status</NotebookTableHeaderCell>
                    <NotebookTableHeaderCell>Assigned Teacher</NotebookTableHeaderCell>
                    <NotebookTableHeaderCell align="right">Reassign</NotebookTableHeaderCell>
                  </NotebookTableRow>
                </NotebookTableHead>
                <tbody className="divide-y divide-ink/10 dark:divide-chalkboard-borderSubtle">
                  {paginatedClasses.map((cls) => {
                    const selectedTeacherId = selectedTeacherByClass[cls.id] ?? String(cls.teacherId || '');
                    const isUnchanged = Number(selectedTeacherId) === cls.teacherId;
                    const isReassigning = reassigningClassId === cls.id;

                    return (
                      <NotebookTableRow key={cls.id}>
                        <NotebookTableCell>
                          <div className="font-sans font-bold text-ink dark:text-chalkboard-chalk">
                            {cls.name}
                          </div>
                          <div className="text-[11px] font-mono text-ink-muted dark:text-chalkboard-muted">
                            Join Code: <span className="font-bold text-ink dark:text-chalkboard-chalk">{cls.joinCode}</span>
                          </div>
                        </NotebookTableCell>
                        <NotebookTableCell>
                          <div className="font-sans font-medium text-ink dark:text-chalkboard-chalk">
                            {cls.subjectName}
                          </div>
                          <div className="text-[11px] font-mono text-ink-muted dark:text-chalkboard-muted">
                            {cls.subjectCode}
                          </div>
                        </NotebookTableCell>
                        <NotebookTableCell align="center" className="font-bold text-ink dark:text-chalkboard-chalk">
                          {cls.studentCount}
                        </NotebookTableCell>
                        <NotebookTableCell align="center">
                          <span
                            className={`px-2 py-0.5 rounded-md font-bold uppercase text-[10px] ${
                              cls.status === 'ACTIVE'
                                ? 'bg-highlighter-mintSoft text-ink dark:bg-highlighter-mint/20 dark:text-highlighter-mint'
                                : 'bg-paper-warm text-ink-muted dark:bg-chalkboard-surface dark:text-chalkboard-muted'
                            }`}
                          >
                            {cls.status}
                          </span>
                        </NotebookTableCell>
                        <NotebookTableCell>
                          <div className="font-sans font-semibold text-ink dark:text-chalkboard-chalk">
                            {cls.teacherName || 'Unassigned'}
                          </div>
                          {cls.teacherEmail && (
                            <div className="text-[11px] font-mono text-ink-muted dark:text-chalkboard-muted">
                              {cls.teacherEmail}
                            </div>
                          )}
                        </NotebookTableCell>
                        <NotebookTableCell align="right">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            <select
                              value={selectedTeacherId}
                              onChange={(e) =>
                                setSelectedTeacherByClass((prev) => ({
                                  ...prev,
                                  [cls.id]: e.target.value,
                                }))
                              }
                              aria-label={`Select teacher for ${cls.name}`}
                              className="bg-paper dark:bg-chalkboard border border-ink/25 dark:border-chalkboard-borderSubtle rounded-lg px-2 py-1 text-xs font-mono text-ink dark:text-chalkboard-chalk focus:outline-none focus:border-ink w-32 sm:w-40 truncate"
                            >
                              {activeTeachers.length === 0 && (
                                <option value={cls.teacherId || ''}>
                                  {cls.teacherName || 'No active teachers'}
                                </option>
                              )}
                              {activeTeachers.map((t) => (
                                <option key={t.id} value={t.id} title={`${t.fullName} (${t.email})`}>
                                  {t.fullName}
                                </option>
                              ))}
                            </select>
                            <Button
                              variant="secondary"
                              size="sm"
                              disabled={isUnchanged || isReassigning || activeTeachers.length === 0}
                              onClick={() => handleReassignTeacher(cls)}
                              aria-label={`Reassign ${cls.name}`}
                              className="font-mono text-xs shrink-0 whitespace-nowrap"
                            >
                              <ArrowRightLeft className="w-3 h-3 mr-1" aria-hidden="true" />
                              <span>{isReassigning ? 'Saving…' : 'Reassign'}</span>
                            </Button>
                          </div>
                        </NotebookTableCell>
                      </NotebookTableRow>
                    );
                  })}
                </tbody>
              </NotebookTable>

              <PaginationControls
                currentPage={classPage}
                pageSize={classPageSize}
                totalItems={filteredClasses.length}
                onPageChange={setClassPage}
                onPageSizeChange={(newSize) => {
                  setClassPageSize(newSize);
                  setClassPage(1);
                }}
                pageSizeOptions={[10, 25, 50]}
              />
            </div>
          )}
        </NotebookTabPanel>
      </section>
    </PortalShell>
  );
}
