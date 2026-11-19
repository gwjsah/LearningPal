import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  User,
  Sun,
  Moon,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  RotateCcw,
  Lock,
  Award,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { studentService } from '../services/studentService';
import { Button, Field, NotebookBackButton, NotebookCard, PortalShell } from '../components/NotebookPrimitives';
import PalAvatar from '../components/PalAvatar';
import { PalPickerFields } from '../components/PalCompanionCard';
import { PAL_ACCESSORIES, evaluatePalAchievements, getPalProfile } from '../utils/palEngine';
import { getRoleHome } from '../utils/roleHome';

const ROLE_LABELS = {
  STUDENT: 'Student',
  TEACHER: 'Teacher',
  ADMIN: 'Institution Admin',
  SUPER_ADMIN: 'Super Admin',
};

const ROLE_WORKSPACE_LABELS = {
  STUDENT: 'Back to My Classes',
  TEACHER: 'Back to Teacher Desk',
  ADMIN: 'Back to Admin Console',
  SUPER_ADMIN: 'Back to Super Admin',
};

function InlineNotice({ notice }) {
  if (!notice) return null;
  const isError = notice.type === 'error';
  return (
    <div
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
      className={`p-3 rounded-xl border-2 text-xs font-semibold flex items-center gap-2 ${
        isError
          ? 'border-redpen bg-redpen-soft text-redpen-dark dark:bg-chalkboard-surface dark:text-redpen-margin dark:border-redpen'
          : 'border-ink bg-highlighter-mintSoft text-ink dark:bg-chalkboard-surface dark:text-highlighter-mint dark:border-highlighter-mint/70'
      }`}
    >
      {isError ? (
        <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
      ) : (
        <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
      )}
      <span>{notice.text}</span>
    </div>
  );
}

function PreferenceToggle({ id, label, description, checked, disabled, onChange }) {
  return (
    <div
      className={`flex items-start justify-between gap-4 p-3.5 rounded-xl border-2 border-ink/20 dark:border-chalkboard-border bg-paper-warm/60 dark:bg-chalkboard-surface/80 ${
        disabled ? 'opacity-55' : ''
      }`}
    >
      <div className="space-y-0.5 min-w-0">
        <label
          htmlFor={id}
          className={`text-sm font-bold text-ink dark:text-chalkboard-chalk block ${
            disabled ? 'cursor-not-allowed' : 'cursor-pointer'
          }`}
        >
          {label}
        </label>
        <p className="text-xs text-ink-muted dark:text-chalkboard-muted leading-relaxed">
          {description}
        </p>
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative shrink-0 mt-0.5 w-12 h-7 rounded-full border-2 border-ink dark:border-chalkboard-chalk transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-redpen ${
          disabled ? 'cursor-not-allowed' : 'cursor-pointer'
        } ${
          checked ? 'bg-highlighter-mint' : 'bg-paper-card dark:bg-chalkboard-card'
        }`}
      >
        {/* Keep thumb dark ink when checked so contrast stays >11:1 on pastel mint in both themes */}
        <span
          className={`block w-4 h-4 rounded-full transition-transform ${
            checked
              ? 'translate-x-6 bg-ink'
              : 'translate-x-1 bg-ink dark:bg-chalkboard-chalk'
          }`}
        />
      </button>
    </div>
  );
}

export default function Settings() {
  const { user, logout, updateProfile, updatePal } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();

  const pal = getPalProfile(user);
  const role = user?.role || 'STUDENT';
  const isStudent = role === 'STUDENT';
  const isSuperAdmin = role === 'SUPER_ADMIN';

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileNotice, setProfileNotice] = useState(null);

  const [palDraft, setPalDraft] = useState({
    palName: pal.name,
    palStyle: pal.style,
    palColor: pal.color,
    palEnabled: pal.enabled,
    palQuietInQuiz: pal.quietInQuiz,
    palAccessory: pal.accessory,
  });
  const [palSaving, setPalSaving] = useState(false);
  const [palNotice, setPalNotice] = useState(null);
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    setFullName(user?.fullName || '');
  }, [user?.fullName]);

  useEffect(() => {
    const current = getPalProfile(user);
    setPalDraft({
      palName: current.name,
      palStyle: current.style,
      palColor: current.color,
      palEnabled: current.enabled,
      palQuietInQuiz: current.quietInQuiz,
      palAccessory: current.accessory,
    });
  }, [user?.palName, user?.palStyle, user?.palColor, user?.palEnabled, user?.palQuietInQuiz, user?.palAccessory]);

  useEffect(() => {
    if (!isStudent) return;
    studentService.getProgress().then(setProgress).catch(() => null);
  }, [isStudent]);

  const achSummary = evaluatePalAchievements(progress);

  const isProfileDirty = fullName.trim() !== (user?.fullName || '').trim();
  const isPalDirty =
    (palDraft.palName.trim() || 'Pip') !== pal.name ||
    palDraft.palStyle !== pal.style ||
    palDraft.palColor !== pal.color ||
    palDraft.palEnabled !== pal.enabled ||
    palDraft.palQuietInQuiz !== pal.quietInQuiz ||
    palDraft.palAccessory !== pal.accessory;

  const handleResetProfile = () => {
    setFullName(user?.fullName || '');
    setProfileNotice(null);
  };

  const handleResetPal = () => {
    setPalDraft({
      palName: pal.name,
      palStyle: pal.style,
      palColor: pal.color,
      palEnabled: pal.enabled,
      palQuietInQuiz: pal.quietInQuiz,
      palAccessory: pal.accessory,
    });
    setPalNotice(null);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    const trimmed = fullName.trim();
    if (!trimmed) {
      setProfileNotice({ type: 'error', text: 'Display name cannot be empty.' });
      return;
    }
    if (trimmed.length > 120) {
      setProfileNotice({ type: 'error', text: 'Display name must be 120 characters or fewer.' });
      return;
    }
    setProfileSaving(true);
    setProfileNotice(null);
    try {
      await updateProfile({ fullName: trimmed });
      setProfileNotice({ type: 'success', text: 'Profile updated across your workspace.' });
    } catch (err) {
      setProfileNotice({ type: 'error', text: err.message || 'Could not update profile.' });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleSavePal = async (e) => {
    e.preventDefault();
    const trimmedName = palDraft.palName.trim() || 'Pip';
    if (trimmedName.length > 30) {
      setPalNotice({ type: 'error', text: 'Pal name must be 30 characters or fewer.' });
      return;
    }
    setPalSaving(true);
    setPalNotice(null);
    try {
      await updatePal({
        palName: trimmedName,
        palStyle: palDraft.palStyle,
        palColor: palDraft.palColor,
        palEnabled: palDraft.palEnabled,
        palQuietInQuiz: palDraft.palQuietInQuiz,
        palAccessory: palDraft.palAccessory,
      });
      setPalNotice({ type: 'success', text: 'Study Pal preferences saved across your devices.' });
    } catch (err) {
      setPalNotice({ type: 'error', text: err.message || 'Could not save Study Pal preferences.' });
    } finally {
      setPalSaving(false);
    }
  };

  const institutionDisplay = isSuperAdmin
    ? 'Platform-Wide (All Institutions)'
    : user?.institutionName || 'Not assigned';

  return (
    <PortalShell
      portalSubtitle="Account & Personal Preferences"
      user={user}
      onLogout={logout}
      badgeIcon={SettingsIcon}
      badgeLabel={`${ROLE_LABELS[role] || role} Settings`}
      badgeColorClass="bg-highlighter-yellow text-ink"
      title="Settings & Preferences"
      subtitle={
        isStudent
          ? 'Manage your account profile, Study Pal companion, and notebook theme.'
          : 'Manage your account profile and notebook display preferences.'
      }
      headerRight={
        <NotebookBackButton
          to={getRoleHome(role)}
          label={ROLE_WORKSPACE_LABELS[role] || 'Back to Workspace'}
        />
      }
    >
      <div className="w-full space-y-6 pb-12">
        {/* 1. Account Profile */}
        <NotebookCard
          pageLabel="Section 01 • Account Profile"
          ruled
          bodyClassName="p-5 sm:p-6 space-y-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <User className="w-5 h-5 text-redpen dark:text-redpen-margin shrink-0" aria-hidden="true" />
              <h2 className="text-lg font-extrabold text-ink dark:text-chalkboard-chalk">
                Account Profile
              </h2>
            </div>
            {isProfileDirty && (
              <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-highlighter-yellow text-ink border border-ink/40">
                Unsaved changes
              </span>
            )}
          </div>

          <form onSubmit={handleSaveProfile} noValidate className="space-y-4">
            <Field
              id="settings-fullname"
              name="fullName"
              type="text"
              label="Display Name"
              required
              maxLength={120}
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                if (profileNotice) setProfileNotice(null);
              }}
              placeholder="Your full name"
              hint="Shown on your workspace header and class records (max 120 characters)."
            />

            <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-paper-warm/80 dark:bg-chalkboard-surface border border-ink/20 dark:border-chalkboard-border">
                <dt className="text-[11px] uppercase tracking-wider text-ink-muted dark:text-chalkboard-muted">
                  Email
                </dt>
                <dd className="mt-0.5 font-bold text-ink dark:text-chalkboard-chalk break-all">
                  {user?.email || '—'}
                </dd>
              </div>
              <div className="p-3 rounded-xl bg-paper-warm/80 dark:bg-chalkboard-surface border border-ink/20 dark:border-chalkboard-border">
                <dt className="text-[11px] uppercase tracking-wider text-ink-muted dark:text-chalkboard-muted">
                  Role
                </dt>
                <dd className="mt-0.5 font-bold text-ink dark:text-chalkboard-chalk">
                  {ROLE_LABELS[role] || role}
                </dd>
              </div>
              <div className="p-3 rounded-xl bg-paper-warm/80 dark:bg-chalkboard-surface border border-ink/20 dark:border-chalkboard-border">
                <dt className="text-[11px] uppercase tracking-wider text-ink-muted dark:text-chalkboard-muted">
                  Institution
                </dt>
                <dd className="mt-0.5 font-bold text-ink dark:text-chalkboard-chalk break-words">
                  {institutionDisplay}
                </dd>
              </div>
            </dl>

            <InlineNotice notice={profileNotice} />

            <div className="flex flex-wrap items-center justify-end gap-2.5 pt-1">
              {isProfileDirty && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleResetProfile}
                  disabled={profileSaving}
                >
                  <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Reset</span>
                </Button>
              )}
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={profileSaving || !isProfileDirty}
              >
                {profileSaving ? 'Saving...' : 'Save Profile'}
              </Button>
            </div>
          </form>
        </NotebookCard>

        {/* 2. Study Pal Preferences (Students Only) */}
        {isStudent && (
          <NotebookCard
            pageLabel="Section 02 • Study Pal"
            ruled
            bodyClassName="p-5 sm:p-6 space-y-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-redpen dark:text-redpen-margin shrink-0" aria-hidden="true" />
                  <h2 className="text-lg font-extrabold text-ink dark:text-chalkboard-chalk">
                    Study Pal Companion
                  </h2>
                </div>
                <p className="text-xs text-ink-muted dark:text-chalkboard-muted leading-relaxed">
                  Your floating Study Pal reacts to your per-class topic mastery and syncs across your devices.
                </p>
              </div>
              {isPalDirty && (
                <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-highlighter-yellow text-ink border border-ink/40 shrink-0">
                  Unsaved changes
                </span>
              )}
            </div>

            <form onSubmit={handleSavePal} noValidate className="space-y-5">
              <div className="space-y-3">
                <PreferenceToggle
                  id="toggle-pal-enabled"
                  label="Show Study Pal"
                  description="Display your floating study companion in the bottom-right corner across your workspace."
                  checked={palDraft.palEnabled}
                  disabled={palSaving}
                  onChange={(val) => {
                    setPalDraft((prev) => ({ ...prev, palEnabled: val }));
                    if (palNotice) setPalNotice(null);
                  }}
                />
                <PreferenceToggle
                  id="toggle-pal-quiet-quiz"
                  label="Quiet Companion during quizzes"
                  description="Keep your Pal quietly visible in the corner while taking assessments (dialogue stays closed unless clicked). Turn off to hide completely during quizzes."
                  checked={palDraft.palQuietInQuiz}
                  disabled={palSaving || !palDraft.palEnabled}
                  onChange={(val) => {
                    setPalDraft((prev) => ({ ...prev, palQuietInQuiz: val }));
                    if (palNotice) setPalNotice(null);
                  }}
                />
              </div>

              <div className={palDraft.palEnabled ? 'space-y-5' : 'space-y-5 opacity-50 pointer-events-none'}>
                <PalPickerFields
                  palName={palDraft.palName}
                  palStyle={palDraft.palStyle}
                  palColor={palDraft.palColor}
                  palAccessory={palDraft.palAccessory}
                  onChange={(next) => {
                    setPalDraft((prev) => ({ ...prev, ...next }));
                    if (palNotice) setPalNotice(null);
                  }}
                  disabled={palSaving || !palDraft.palEnabled}
                />

                {/* Achievement-Unlocked Accessories */}
                <div className="space-y-2.5 pt-2 border-t border-ink/15 dark:border-chalkboard-borderSubtle">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-ink-muted dark:text-chalkboard-muted">
                      <Award className="w-3.5 h-3.5 text-redpen dark:text-redpen-margin" aria-hidden="true" />
                      Achievement Accessories
                    </span>
                    <span className="text-xs font-mono font-bold text-ink dark:text-chalkboard-chalk">
                      {achSummary.unlockedCount} / {achSummary.totalCount} Unlocked
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5" role="radiogroup" aria-label="Pal accessory">
                    {PAL_ACCESSORIES.map((item) => {
                      const unlocked = Boolean(achSummary.unlockedMap[item.id]);
                      const active = palDraft.palAccessory === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          disabled={palSaving || !palDraft.palEnabled || !unlocked}
                          onClick={() => {
                            if (!unlocked) return;
                            setPalDraft((prev) => ({ ...prev, palAccessory: item.id }));
                            if (palNotice) setPalNotice(null);
                          }}
                          className={`relative flex flex-col items-center p-2.5 rounded-xl border-2 text-center transition focus:outline-none focus-visible:ring-2 focus-visible:ring-redpen ${
                            active
                              ? 'border-ink dark:border-chalkboard-chalk bg-highlighter-yellowSoft dark:bg-chalkboard-surface shadow-notebook-sm'
                              : unlocked
                              ? 'border-ink/20 dark:border-chalkboard-border bg-paper-card dark:bg-chalkboard-card hover:border-ink/60 cursor-pointer'
                              : 'border-dashed border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-warm/40 dark:bg-chalkboard-surface/40 opacity-60 cursor-not-allowed'
                          }`}
                        >
                          {!unlocked && (
                            <span
                              className="absolute top-1.5 right-1.5 p-1 rounded-full bg-paper-warm dark:bg-chalkboard-card border border-ink/20 text-ink-muted"
                              title={`Locked: ${item.condition}`}
                            >
                              <Lock className="w-3 h-3" aria-hidden="true" />
                            </span>
                          )}
                          <PalAvatar
                            style={palDraft.palStyle}
                            color={palDraft.palColor}
                            mood="thriving"
                            accessory={item.id}
                            size={52}
                            animate={false}
                            className={unlocked ? '' : 'grayscale opacity-70'}
                            label={item.title}
                          />
                          <span className="text-xs font-bold text-ink dark:text-chalkboard-chalk mt-1 leading-tight">
                            {item.title}
                          </span>
                          <span className="text-[10px] text-ink-muted dark:text-chalkboard-muted mt-0.5 leading-snug">
                            {item.condition}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <InlineNotice notice={palNotice} />

              <div className="flex flex-wrap items-center justify-end gap-2.5 pt-1">
                {isPalDirty && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleResetPal}
                    disabled={palSaving}
                  >
                    <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Reset</span>
                  </Button>
                )}
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={palSaving || !isPalDirty}
                >
                  {palSaving ? 'Saving...' : 'Save Pal Preferences'}
                </Button>
              </div>
            </form>
          </NotebookCard>
        )}

        {/* 3. Notebook Appearance */}
        <NotebookCard
          pageLabel={isStudent ? 'Section 03 • Display Theme' : 'Section 02 • Display Theme'}
          bodyClassName="p-5 sm:p-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-lg font-extrabold text-ink dark:text-chalkboard-chalk">
                Notebook Appearance
              </h2>
              <p className="text-xs text-ink-muted dark:text-chalkboard-muted leading-relaxed">
                Choose between Warm Cream Paper for daytime study and Chalkboard Night for low-light sessions.
              </p>
            </div>

            <div
              role="radiogroup"
              aria-label="Notebook theme"
              className="inline-grid grid-cols-2 gap-1.5 p-1.5 rounded-xl bg-paper-warm dark:bg-chalkboard-surface border-2 border-ink dark:border-chalkboard-border shrink-0 w-full sm:w-auto"
            >
              <button
                type="button"
                role="radio"
                aria-checked={!darkMode}
                onClick={() => darkMode && toggleDarkMode()}
                className={`inline-flex items-center justify-center gap-1.5 min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-redpen ${
                  !darkMode
                    ? 'bg-highlighter-yellow text-ink border-ink shadow-notebook-sm'
                    : 'border-transparent text-ink-muted dark:text-chalkboard-muted hover:text-ink dark:hover:text-chalkboard-chalk'
                }`}
              >
                <Sun className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Paper Light</span>
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={darkMode}
                onClick={() => !darkMode && toggleDarkMode()}
                className={`inline-flex items-center justify-center gap-1.5 min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-redpen ${
                  darkMode
                    ? 'bg-chalkboard-card text-chalkboard-chalk border-chalkboard-chalk shadow-notebook-sm'
                    : 'border-transparent text-ink-muted hover:text-ink'
                }`}
              >
                <Moon className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Chalkboard</span>
              </button>
            </div>
          </div>
        </NotebookCard>
      </div>
    </PortalShell>
  );
}
