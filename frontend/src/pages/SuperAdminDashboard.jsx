import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ShieldCheck,
  Building2,
  Users,
  BookOpen,
  Plus,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  X,
  UserPlus,
  Eye,
  EyeOff,
  UserX,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { superAdminService } from '../services/superAdminService';
import { Button, Field, NotebookCard, PortalShell } from '../components/NotebookPrimitives';
import { ConfirmModal } from '../components/ConfirmModal';
import {
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
} from '../components/NotebookTablePrimitives';

const INITIAL_FORM = {
  name: '',
  code: '',
  adminFullName: '',
  adminEmail: '',
  adminPassword: '',
};

const CODE_REGEX = /^[A-Z0-9-]{3,16}$/;
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,72}$/;

const ROLE_FILTERS = [
  { id: 'ALL', label: 'All Roles' },
  { id: 'STUDENT', label: 'Student' },
  { id: 'TEACHER', label: 'Teacher' },
  { id: 'ADMIN', label: 'Admin' },
];

const STATUS_FILTERS = [
  { id: 'ALL', label: 'All Statuses' },
  { id: 'ACTIVE', label: 'Active' },
  { id: 'PENDING', label: 'Pending' },
  { id: 'DEACTIVATED', label: 'Deactivated' },
];

function getRoleBadgeClass(role) {
  switch (role) {
    case 'SUPER_ADMIN':
      return 'bg-highlighter-yellow text-ink border-ink/30 dark:bg-highlighter-yellow dark:text-ink';
    case 'ADMIN':
      return 'bg-sky-100 text-sky-900 border-sky-400 dark:bg-sky-950/60 dark:text-sky-200 dark:border-sky-700';
    case 'TEACHER':
      return 'bg-amber-100 text-amber-900 border-amber-400 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-700';
    default:
      return 'bg-paper-warm text-ink border-ink/20 dark:bg-chalkboard-surface dark:text-chalkboard-chalk dark:border-chalkboard-borderSubtle';
  }
}

function getStatusBadgeClass(status) {
  switch (status) {
    case 'ACTIVE':
      return 'bg-emerald-100 text-emerald-900 border-emerald-400 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700';
    case 'PENDING':
      return 'bg-amber-100 text-amber-900 border-amber-400 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700';
    case 'DEACTIVATED':
    case 'REJECTED':
      return 'bg-red-100 text-red-900 border-red-400 dark:bg-red-950/60 dark:text-red-300 dark:border-red-700';
    default:
      return 'bg-paper-warm text-ink-muted border-ink/20 dark:bg-chalkboard-surface dark:text-chalkboard-muted dark:border-chalkboard-borderSubtle';
  }
}

export default function SuperAdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'users' ? 'users' : 'institutions';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [userToDeactivate, setUserToDeactivate] = useState(null);

  const handleTabChange = (nextTab) => {
    setActiveTab(nextTab);
    setSearchParams({ tab: nextTab }, { replace: true });
  };

  // Institutions state
  const [institutions, setInstitutions] = useState([]);
  const [loadingInstitutions, setLoadingInstitutions] = useState(true);
  const [instSearch, setInstSearch] = useState('');
  const [instPage, setInstPage] = useState(1);
  const [instPageSize, setInstPageSize] = useState(10);

  // Users state
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [institutionFilter, setInstitutionFilter] = useState('ALL');
  const [userPage, setUserPage] = useState(1);
  const [userPageSize, setUserPageSize] = useState(10);
  const [togglingUserId, setTogglingUserId] = useState(null);

  // Shared feedback & modal state
  const [error, setError] = useState('');
  const [successBanner, setSuccessBanner] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleAuthError = useCallback(
    (err) => {
      if (err?.status === 401 || err?.status === 403) {
        logout();
        navigate('/login', { replace: true });
        return true;
      }
      return false;
    },
    [logout, navigate]
  );

  const loadInstitutions = useCallback(async () => {
    setLoadingInstitutions(true);
    setError('');
    try {
      const data = await superAdminService.getInstitutions();
      setInstitutions(Array.isArray(data) ? data : []);
    } catch (err) {
      if (handleAuthError(err)) return;
      setError(err.message || 'Failed to load platform institutions.');
    } finally {
      setLoadingInstitutions(false);
    }
  }, [handleAuthError]);

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    setError('');
    try {
      const data = await superAdminService.getUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      if (handleAuthError(err)) return;
      setError(err.message || 'Failed to load platform users.');
    } finally {
      setLoadingUsers(false);
    }
  }, [handleAuthError]);

  useEffect(() => {
    loadInstitutions();
    loadUsers();
  }, [loadInstitutions, loadUsers]);

  useEffect(() => {
    if (!modalOpen) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && !submitting) {
        setModalOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [modalOpen, submitting]);

  // Reset pagination when filters change
  useEffect(() => {
    setInstPage(1);
  }, [instSearch, instPageSize]);

  useEffect(() => {
    setUserPage(1);
  }, [userSearch, roleFilter, statusFilter, institutionFilter, userPageSize]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const filteredInstitutions = useMemo(() => {
    const q = instSearch.trim().toLowerCase();
    if (!q) return institutions;
    return institutions.filter(
      (inst) =>
        inst.name?.toLowerCase().includes(q) || inst.code?.toLowerCase().includes(q)
    );
  }, [institutions, instSearch]);

  const paginatedInstitutions = useMemo(() => {
    const start = (instPage - 1) * instPageSize;
    return filteredInstitutions.slice(start, start + instPageSize);
  }, [filteredInstitutions, instPage, instPageSize]);

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
      if (statusFilter !== 'ALL' && u.status !== statusFilter) return false;
      if (institutionFilter !== 'ALL' && String(u.institutionId ?? '') !== institutionFilter) {
        return false;
      }
      if (
        q &&
        !u.fullName?.toLowerCase().includes(q) &&
        !u.email?.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [users, userSearch, roleFilter, statusFilter, institutionFilter]);

  const paginatedUsers = useMemo(() => {
    const start = (userPage - 1) * userPageSize;
    return filteredUsers.slice(start, start + userPageSize);
  }, [filteredUsers, userPage, userPageSize]);

  const stats = useMemo(() => {
    const total = institutions.length;
    const active = institutions.filter((i) => i.status === 'ACTIVE').length;
    const totalUsers = institutions.reduce((acc, i) => acc + (i.userCount || 0), 0);
    const totalClasses = institutions.reduce((acc, i) => acc + (i.classCount || 0), 0);
    return { total, active, totalUsers, totalClasses };
  }, [institutions]);

  const openCreateModal = () => {
    setForm(INITIAL_FORM);
    setFormError('');
    setShowPassword(false);
    setModalOpen(true);
  };

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'code' ? value.toUpperCase().replace(/[^A-Z0-9-]/g, '') : value,
    }));
    if (formError) setFormError('');
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const trimmedName = form.name.trim();
    const trimmedCode = form.code.trim();
    const trimmedAdminName = form.adminFullName.trim();
    const trimmedAdminEmail = form.adminEmail.trim();

    if (!trimmedName) {
      setFormError('Institution name is required.');
      return;
    }
    if (trimmedCode && !CODE_REGEX.test(trimmedCode)) {
      setFormError('Institution code must be 3–16 uppercase letters, numbers, or hyphens.');
      return;
    }
    if (!trimmedAdminName) {
      setFormError('Initial administrator full name is required.');
      return;
    }
    if (!trimmedAdminEmail || !trimmedAdminEmail.includes('@')) {
      setFormError('A valid administrator email address is required.');
      return;
    }
    if (!PASSWORD_REGEX.test(form.adminPassword)) {
      setFormError('Password must be 8+ characters with at least one letter and one number.');
      return;
    }

    setSubmitting(true);
    try {
      const created = await superAdminService.createInstitution({
        name: trimmedName,
        code: trimmedCode || undefined,
        adminFullName: trimmedAdminName,
        adminEmail: trimmedAdminEmail,
        adminPassword: form.adminPassword,
      });
      setModalOpen(false);
      setSuccessBanner(
        `Provisioned "${created.name}" (${created.code}) with administrator ${created.admin?.email || trimmedAdminEmail}.`
      );
      await Promise.all([loadInstitutions(), loadUsers()]);
    } catch (err) {
      setFormError(err.message || 'Failed to provision institution.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleUserStatus = async (targetUser) => {
    setTogglingUserId(targetUser.id);
    setError('');
    try {
      const isDeactivated = targetUser.status === 'DEACTIVATED';
      const res = isDeactivated
        ? await superAdminService.reactivateUser(targetUser.id)
        : await superAdminService.deactivateUser(targetUser.id);

      setUsers((prev) =>
        prev.map((u) =>
          u.id === targetUser.id
            ? { ...u, status: isDeactivated ? 'ACTIVE' : 'DEACTIVATED' }
            : u
        )
      );
      setSuccessBanner(
        res?.message ||
          `${targetUser.fullName} ${isDeactivated ? 'reactivated' : 'deactivated'} successfully.`
      );
      setUserToDeactivate(null);
    } catch (err) {
      if (handleAuthError(err)) return;
      setError(err.message || 'Failed to update user status.');
    } finally {
      setTogglingUserId(null);
    }
  };

  const formatDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const tabs = [
    {
      id: 'institutions',
      label: 'Institutions Directory',
      icon: Building2,
      badge: institutions.length,
    },
    {
      id: 'users',
      label: 'Users Directory',
      icon: Users,
      badge: users.length,
    },
  ];

  return (
    <PortalShell
      portalSubtitle="Platform Administration"
      user={user}
      onLogout={handleLogout}
      badgeIcon={ShieldCheck}
      badgeLabel="Super Admin Console"
      badgeColorClass="bg-highlighter-yellow text-ink"
      title="Platform Administration"
      subtitle="Provision school tenants, review institution directories, and manage platform user accounts."
      headerRight={
        <Button
          variant="primary"
          size="md"
          icon={Plus}
          onClick={openCreateModal}
          className="shrink-0"
        >
          Create Institution
        </Button>
      }
    >
      {/* Feedback Banners */}
      {successBanner && (
        <div
          role="status"
          className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-500 rounded-2xl text-emerald-900 dark:text-emerald-200 text-xs font-mono flex items-center justify-between gap-3 shadow-notebook-sm"
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{successBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessBanner('')}
            aria-label="Dismiss notice"
            className="p-1 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/50 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="p-4 bg-red-50 dark:bg-red-950/40 border-2 border-redpen rounded-2xl text-redpen dark:text-red-300 text-xs font-mono flex items-center justify-between gap-3 shadow-notebook-sm"
        >
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            onClick={() => {
              loadInstitutions();
              loadUsers();
            }}
          >
            Retry
          </Button>
        </div>
      )}

      {/* Platform Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Institutions', value: stats.total, Icon: Building2 },
          { label: 'Active Tenants', value: stats.active, Icon: ShieldCheck },
          { label: 'Total Accounts', value: stats.totalUsers, Icon: Users },
          { label: 'Total Classes', value: stats.totalClasses, Icon: BookOpen },
        ].map(({ label, value, Icon }) => (
          <div
            key={label}
            className="bg-paper-card dark:bg-chalkboard-card border-2 border-ink dark:border-chalkboard-border shadow-paper rounded-2xl p-4 flex items-center gap-3.5"
          >
            <div className="w-10 h-10 rounded-xl bg-paper-warm dark:bg-chalkboard-surface border border-ink/15 dark:border-chalkboard-borderSubtle flex items-center justify-center shrink-0 text-ink dark:text-chalkboard-chalk">
              <Icon className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-ink-muted dark:text-chalkboard-muted truncate">
                {label}
              </p>
              <p className="text-2xl font-extrabold tabular-nums text-ink dark:text-chalkboard-chalk leading-tight mt-0.5">
                {loadingInstitutions ? '—' : value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Console Tabs */}
      <NotebookTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        ariaLabel="Super Admin Console sections"
      />

      {/* TAB 1: INSTITUTIONS DIRECTORY */}
      <NotebookTabPanel id="institutions" activeTab={activeTab}>
        <NotebookCard className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h2 className="text-lg font-bold text-ink dark:text-chalkboard-chalk">
                Institutions Directory
              </h2>
              <p className="text-xs text-ink-muted dark:text-chalkboard-muted">
                Each institution operates as an isolated tenant with its own administrator, teachers, and students.
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <SearchInput
                id="institutions-search"
                value={instSearch}
                onChange={(e) => setInstSearch(e.target.value)}
                onClear={() => setInstSearch('')}
                placeholder="Search name or code…"
                ariaLabel="Search institutions by name or code"
                className="flex-1 sm:w-64"
              />
              <Button
                variant="secondary"
                size="sm"
                icon={RefreshCw}
                onClick={loadInstitutions}
                disabled={loadingInstitutions}
                aria-label="Refresh institutions"
              >
                Refresh
              </Button>
            </div>
          </div>

          {loadingInstitutions ? (
            <div className="space-y-2 py-4" aria-busy="true" aria-label="Loading institutions">
              {[1, 2, 3].map((row) => (
                <div
                  key={row}
                  className="h-12 rounded-xl bg-paper-warm/70 dark:bg-chalkboard-surface/70 animate-pulse border border-ink/10 dark:border-chalkboard-borderSubtle"
                />
              ))}
            </div>
          ) : filteredInstitutions.length === 0 ? (
            <EmptyState
              icon={Building2}
              title={instSearch ? 'No matching institutions' : 'No institutions provisioned yet'}
              message={
                instSearch
                  ? `No institutions match "${instSearch}". Try clearing your search filter.`
                  : 'Create your first school tenant to provision an institution code and administrator account.'
              }
              action={
                instSearch ? (
                  <Button variant="secondary" size="sm" onClick={() => setInstSearch('')}>
                    Clear Search
                  </Button>
                ) : (
                  <Button variant="primary" size="sm" icon={Plus} onClick={openCreateModal}>
                    Create Institution
                  </Button>
                )
              }
            />
          ) : (
            <>
              <NotebookTable>
                <NotebookTableHead>
                  <NotebookTableRow hover={false}>
                    <NotebookTableHeaderCell>Institution Name</NotebookTableHeaderCell>
                    <NotebookTableHeaderCell>Code</NotebookTableHeaderCell>
                    <NotebookTableHeaderCell>Status</NotebookTableHeaderCell>
                    <NotebookTableHeaderCell align="right">Users</NotebookTableHeaderCell>
                    <NotebookTableHeaderCell align="right">Classes</NotebookTableHeaderCell>
                    <NotebookTableHeaderCell align="right">Created</NotebookTableHeaderCell>
                  </NotebookTableRow>
                </NotebookTableHead>
                <tbody className="divide-y divide-ink/10 dark:divide-chalkboard-borderSubtle">
                  {paginatedInstitutions.map((inst) => (
                    <NotebookTableRow key={inst.id}>
                      <NotebookTableCell className="font-sans font-bold text-ink dark:text-chalkboard-chalk">
                        {inst.name}
                      </NotebookTableCell>
                      <NotebookTableCell>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-highlighter-yellowSoft dark:bg-chalkboard-surface border border-ink/20 dark:border-chalkboard-borderSubtle text-ink dark:text-highlighter-yellow">
                          {inst.code}
                        </span>
                      </NotebookTableCell>
                      <NotebookTableCell>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-mono font-bold border ${getStatusBadgeClass(
                            inst.status
                          )}`}
                        >
                          {inst.status}
                        </span>
                      </NotebookTableCell>
                      <NotebookTableCell align="right" className="text-ink dark:text-chalkboard-chalk">
                        {inst.userCount ?? 0}
                      </NotebookTableCell>
                      <NotebookTableCell align="right" className="text-ink dark:text-chalkboard-chalk">
                        {inst.classCount ?? 0}
                      </NotebookTableCell>
                      <NotebookTableCell align="right" className="text-ink-muted dark:text-chalkboard-muted">
                        {formatDate(inst.createdAt)}
                      </NotebookTableCell>
                    </NotebookTableRow>
                  ))}
                </tbody>
              </NotebookTable>

              <PaginationControls
                currentPage={instPage}
                pageSize={instPageSize}
                totalItems={filteredInstitutions.length}
                onPageChange={setInstPage}
                onPageSizeChange={setInstPageSize}
              />
            </>
          )}
        </NotebookCard>
      </NotebookTabPanel>

      {/* TAB 2: PLATFORM USERS DIRECTORY */}
      <NotebookTabPanel id="users" activeTab={activeTab}>
        <NotebookCard className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-ink dark:text-chalkboard-chalk">
                Users Directory
              </h2>
              <p className="text-xs text-ink-muted dark:text-chalkboard-muted">
                Inspect accounts across all institutions and deactivate or reactivate non-super-admin accounts.
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <SearchInput
                id="users-search"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                onClear={() => setUserSearch('')}
                placeholder="Search name or email…"
                ariaLabel="Search users by name or email"
                className="flex-1 sm:w-64"
              />
              <Button
                variant="secondary"
                size="sm"
                icon={RefreshCw}
                onClick={loadUsers}
                disabled={loadingUsers}
                aria-label="Refresh users"
              >
                Refresh
              </Button>
            </div>
          </div>

          {/* Filters Row */}
          <div className="my-5 px-4 py-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 rounded-2xl bg-paper-warm/60 dark:bg-chalkboard-surface/60 border border-ink/15 dark:border-chalkboard-borderSubtle">
            <div className="flex flex-wrap items-center gap-3">
              {/* Role Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter by role">
                {ROLE_FILTERS.map((opt) => {
                  const active = roleFilter === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setRoleFilter(opt.id)}
                      aria-pressed={active}
                      className={`px-3 py-1 rounded-full text-xs font-mono font-bold border transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-redpen ${
                        active
                          ? 'bg-ink text-paper border-ink dark:bg-highlighter-yellow dark:text-ink dark:border-highlighter-yellow'
                          : 'bg-paper-card dark:bg-chalkboard-card text-ink-muted dark:text-chalkboard-muted border-ink/20 dark:border-chalkboard-borderSubtle hover:text-ink dark:hover:text-chalkboard-chalk'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              <div className="hidden sm:block w-px h-5 bg-ink/15 dark:bg-chalkboard-borderSubtle" aria-hidden="true" />

              {/* Status Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter by status">
                {STATUS_FILTERS.map((opt) => {
                  const active = statusFilter === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setStatusFilter(opt.id)}
                      aria-pressed={active}
                      className={`px-3 py-1 rounded-full text-xs font-mono font-bold border transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-redpen ${
                        active
                          ? 'bg-redpen text-white border-redpen'
                          : 'bg-paper-card dark:bg-chalkboard-card text-ink-muted dark:text-chalkboard-muted border-ink/20 dark:border-chalkboard-borderSubtle hover:text-ink dark:hover:text-chalkboard-chalk'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Institution Dropdown */}
            <div className="flex items-center gap-2 shrink-0">
              <label
                htmlFor="users-institution-filter"
                className="text-[11px] font-mono font-bold uppercase tracking-wider text-ink-muted dark:text-chalkboard-muted"
              >
                Institution:
              </label>
              <select
                id="users-institution-filter"
                value={institutionFilter}
                onChange={(e) => setInstitutionFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border-2 border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-card dark:bg-chalkboard-card text-xs font-mono text-ink dark:text-chalkboard-chalk focus:outline-none focus:border-ink dark:focus:border-highlighter-mint"
              >
                <option value="ALL">All Institutions</option>
                {institutions.map((inst) => (
                  <option key={inst.id} value={String(inst.id)}>
                    {inst.name} ({inst.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loadingUsers ? (
            <div className="space-y-2 py-4" aria-busy="true" aria-label="Loading users">
              {[1, 2, 3, 4].map((row) => (
                <div
                  key={row}
                  className="h-12 rounded-xl bg-paper-warm/70 dark:bg-chalkboard-surface/70 animate-pulse border border-ink/10 dark:border-chalkboard-borderSubtle"
                />
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No matching users"
              message="No accounts match the active search or filter criteria."
              action={
                (userSearch || roleFilter !== 'ALL' || statusFilter !== 'ALL' || institutionFilter !== 'ALL') && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setUserSearch('');
                      setRoleFilter('ALL');
                      setStatusFilter('ALL');
                      setInstitutionFilter('ALL');
                    }}
                  >
                    Reset Filters
                  </Button>
                )
              }
            />
          ) : (
            <>
              <NotebookTable>
                <NotebookTableHead>
                  <NotebookTableRow hover={false}>
                    <NotebookTableHeaderCell>Full Name & Email</NotebookTableHeaderCell>
                    <NotebookTableHeaderCell>Role</NotebookTableHeaderCell>
                    <NotebookTableHeaderCell>Institution</NotebookTableHeaderCell>
                    <NotebookTableHeaderCell>Status</NotebookTableHeaderCell>
                    <NotebookTableHeaderCell align="right">Date Joined</NotebookTableHeaderCell>
                    <NotebookTableHeaderCell align="right">Actions</NotebookTableHeaderCell>
                  </NotebookTableRow>
                </NotebookTableHead>
                <tbody className="divide-y divide-ink/10 dark:divide-chalkboard-borderSubtle">
                  {paginatedUsers.map((u) => {
                    const isSuper = u.role === 'SUPER_ADMIN';
                    const isDeactivated = u.status === 'DEACTIVATED';
                    const busy = togglingUserId === u.id;

                    return (
                      <NotebookTableRow key={u.id}>
                        <NotebookTableCell className="font-sans">
                          <div className="font-bold text-ink dark:text-chalkboard-chalk">
                            {u.fullName}
                          </div>
                          <div className="text-[11px] font-mono text-ink-muted dark:text-chalkboard-muted">
                            {u.email}
                          </div>
                        </NotebookTableCell>
                        <NotebookTableCell>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono font-bold border ${getRoleBadgeClass(
                              u.role
                            )}`}
                          >
                            {u.role}
                          </span>
                        </NotebookTableCell>
                        <NotebookTableCell>
                          {u.institutionName ? (
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="font-sans text-ink dark:text-chalkboard-chalk">
                                {u.institutionName}
                              </span>
                              {u.institutionCode && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-paper-warm dark:bg-chalkboard-surface border border-ink/15 dark:border-chalkboard-borderSubtle text-ink-muted dark:text-chalkboard-muted">
                                  {u.institutionCode}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-ink-muted dark:text-chalkboard-muted italic">
                              Platform
                            </span>
                          )}
                        </NotebookTableCell>
                        <NotebookTableCell>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-mono font-bold border ${getStatusBadgeClass(
                              u.status
                            )}`}
                          >
                            {u.status}
                          </span>
                        </NotebookTableCell>
                        <NotebookTableCell align="right" className="text-ink-muted dark:text-chalkboard-muted">
                          {formatDate(u.createdAt)}
                        </NotebookTableCell>
                        <NotebookTableCell align="right">
                          {isSuper ? (
                            <span className="text-[11px] font-mono text-ink-muted dark:text-chalkboard-muted">
                              Protected
                            </span>
                          ) : (
                            <Button
                              variant={isDeactivated ? 'secondary' : 'danger'}
                              size="sm"
                              disabled={busy}
                              onClick={() =>
                                isDeactivated ? handleToggleUserStatus(u) : setUserToDeactivate(u)
                              }
                            >
                              {isDeactivated ? (
                                <>
                                  <UserCheck className="w-3.5 h-3.5" aria-hidden="true" />
                                  <span>{busy ? 'Saving…' : 'Reactivate'}</span>
                                </>
                              ) : (
                                <>
                                  <UserX className="w-3.5 h-3.5" aria-hidden="true" />
                                  <span>{busy ? 'Saving…' : 'Deactivate'}</span>
                                </>
                              )}
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
                onPageSizeChange={setUserPageSize}
              />
            </>
          )}
        </NotebookCard>
      </NotebookTabPanel>

      {/* MODAL: CREATE INSTITUTION + INITIAL ADMIN */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-institution-title"
        >
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-paper-card dark:bg-chalkboard-card border-2 border-ink dark:border-chalkboard-border rounded-2xl p-6 sm:p-7 shadow-notebook space-y-5">
            <div className="flex items-start justify-between gap-3 border-b border-ink/15 dark:border-chalkboard-borderSubtle pb-3">
              <div>
                <h2
                  id="create-institution-title"
                  className="text-lg font-extrabold text-ink dark:text-chalkboard-chalk flex items-center gap-2"
                >
                  <Building2 className="w-5 h-5 text-redpen dark:text-highlighter-yellow" />
                  <span>Provision New Institution</span>
                </h2>
                <p className="text-xs text-ink-muted dark:text-chalkboard-muted mt-0.5">
                  Creates a new school tenant and its initial Institution Admin account.
                </p>
              </div>
              <button
                type="button"
                onClick={() => !submitting && setModalOpen(false)}
                aria-label="Close dialog"
                className="p-1.5 rounded-lg text-ink-muted hover:text-ink dark:text-chalkboard-muted dark:hover:text-chalkboard-chalk hover:bg-paper-warm dark:hover:bg-chalkboard-surface cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div
                role="alert"
                className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border-2 border-redpen text-redpen dark:text-red-300 text-xs font-mono flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="space-y-3">
                <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-ink-muted dark:text-chalkboard-muted">
                  1. Institution Details
                </p>

                <Field
                  id="inst-name"
                  name="name"
                  label="Institution Name"
                  required
                  value={form.name}
                  onChange={handleFieldChange}
                  placeholder="e.g. Cebu Institute of Technology"
                />

                <Field
                  id="inst-code"
                  name="code"
                  label="Institution Code (optional)"
                  hint="3–16 uppercase letters, numbers, or hyphens. Leave blank to auto-generate."
                  value={form.code}
                  onChange={handleFieldChange}
                  placeholder="e.g. CITU-2026"
                />
              </div>

              <div className="pt-3 border-t border-ink/15 dark:border-chalkboard-borderSubtle space-y-3">
                <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-ink-muted dark:text-chalkboard-muted flex items-center gap-1.5">
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>2. Initial Institution Administrator</span>
                </p>

                <Field
                  id="admin-full-name"
                  name="adminFullName"
                  label="Admin Full Name"
                  required
                  value={form.adminFullName}
                  onChange={handleFieldChange}
                  placeholder="e.g. Dr. Elena Reyes"
                />

                <Field
                  id="admin-email"
                  name="adminEmail"
                  type="email"
                  label="Admin Email"
                  required
                  value={form.adminEmail}
                  onChange={handleFieldChange}
                  placeholder="e.g. admin@school.edu"
                />

                <Field
                  id="admin-password"
                  name="adminPassword"
                  type="password"
                  label="Temporary Password"
                  hint="8+ characters with at least one letter and one number."
                  required
                  value={form.adminPassword}
                  onChange={handleFieldChange}
                  placeholder="Create a strong password"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={() => setModalOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="md" loading={submitting}>
                  Provision Institution
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        open={Boolean(userToDeactivate)}
        variant="danger"
        title="Deactivate User Account"
        message={
          userToDeactivate
            ? `Are you sure you want to deactivate ${userToDeactivate.fullName}? They will be logged out and unable to sign in until reactivated.`
            : ''
        }
        confirmLabel="Deactivate User"
        loadingLabel="Deactivating…"
        loading={Boolean(userToDeactivate && togglingUserId === userToDeactivate.id)}
        onConfirm={() => userToDeactivate && handleToggleUserStatus(userToDeactivate)}
        onCancel={() => setUserToDeactivate(null)}
      />
    </PortalShell>
  );
}
