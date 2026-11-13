import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  Download,
  Star,
  MessageSquare,
  FlaskConical,
  BarChart3,
  ShieldCheck,
  TrendingUp,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { adminService } from '../services/adminService';
import { PortalShell, NotebookCard, Button } from '../components/NotebookPrimitives';

/**
 * Accessible (?) plain-language explainer button + disclosure panel.
 * Works with mouse, touch (360px mobile), and keyboard (Enter/Space).
 */
function PlainLanguageExplainer({ id, label, open, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      aria-controls={id}
      aria-label={label}
      title={label}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono font-bold border transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-redpen ${
        open
          ? 'bg-ink text-white dark:bg-highlighter-mint dark:text-ink border-ink'
          : 'bg-paper-warm dark:bg-chalkboard-surface text-ink-muted dark:text-chalkboard-muted border-ink/20 hover:text-ink dark:hover:text-chalkboard-chalk'
      }`}
    >
      <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
      <span>(?)</span>
    </button>
  );
}

export default function AdminEvaluationDashboard() {
  const { user, logout } = useAuth();

  const [ratingsSummary, setRatingsSummary] = useState(null);
  const [surveySummary, setSurveySummary] = useState(null);
  const [validationReport, setValidationReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [exportingRatings, setExportingRatings] = useState(false);
  const [exportingSurvey, setExportingSurvey] = useState(false);

  // Plain-language (?) explainer toggle states
  const [openExplainers, setOpenExplainers] = useState({
    helpfulness: false,
    usability: false,
    kappa: false,
  });

  const toggleExplainer = (key) => {
    setOpenExplainers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const fetchAllSummaries = async () => {
    setLoading(true);
    setError('');
    try {
      const [rSummary, sSummary, vReport] = await Promise.all([
        adminService.getRatingsSummary(),
        adminService.getSurveySummary(),
        adminService.getValidationReport('TEACHER', false),
      ]);
      setRatingsSummary(rSummary);
      setSurveySummary(sSummary);
      setValidationReport(vReport);
    } catch (err) {
      setError(err.message || 'Failed to load evaluation metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllSummaries();
  }, []);

  const handleExportRatings = async () => {
    setExportingRatings(true);
    try {
      await adminService.downloadRatingsExport();
    } catch (err) {
      alert(`Export failed: ${err.message}`);
    } finally {
      setExportingRatings(false);
    }
  };

  const handleExportSurvey = async () => {
    setExportingSurvey(true);
    try {
      await adminService.downloadSurveyExport();
    } catch (err) {
      alert(`Export failed: ${err.message}`);
    } finally {
      setExportingSurvey(false);
    }
  };

  /**
   * Never present a target as met without meeting the sample gate and having real data.
   */
  const getStatusBadge = (status, sampleCount = 0, minSampleGate = 1, bannerType = null) => {
    const hasEnoughSample = sampleCount >= minSampleGate && status === 'MET';
    const isNotMet = sampleCount >= minSampleGate && status === 'NOT_MET';
    const isSmallComplete = bannerType === 'SMALL_CLASS_COMPLETE';
    const isNoEligible = bannerType === 'NO_ELIGIBLE_STUDENTS';

    let badgeLabel = `Preliminary (n = ${sampleCount} / ${minSampleGate})`;
    if (hasEnoughSample) {
      badgeLabel = `Target Met (n = ${sampleCount})`;
    } else if (isNotMet) {
      badgeLabel = `Target Not Met (n = ${sampleCount})`;
    } else if (isSmallComplete) {
      badgeLabel = `Complete but < ${minSampleGate} Gate (n = ${sampleCount})`;
    } else if (isNoEligible || sampleCount === 0) {
      badgeLabel = `No Data Yet (n = 0 / ${minSampleGate})`;
    }

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-extrabold uppercase border ${
          hasEnoughSample
            ? 'bg-highlighter-mint text-ink border-ink/20'
            : isNotMet
            ? 'bg-redpen-soft text-redpen-dark border-redpen/30'
            : 'bg-paper-warm dark:bg-chalkboard-surface text-ink-muted dark:text-chalkboard-muted border-ink/20'
        }`}
      >
        {hasEnoughSample && <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />}
        {isNotMet && <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />}
        {!hasEnoughSample && !isNotMet && <Clock className="w-3.5 h-3.5" aria-hidden="true" />}
        <span>{badgeLabel}</span>
      </span>
    );
  };

  const evaluatedStudents =
    validationReport?.targetCheck?.studentsEvaluated ??
    validationReport?.sampleSize?.studentsWithUsableLabel ??
    0;
  const usablePairs = validationReport?.sampleSize?.usableStudentTopicPairs ?? 0;
  const excludedCannotJudge = validationReport?.sampleSize?.excludedCannotJudge ?? 0;
  const cohenKappa =
    usablePairs > 0 && validationReport?.metrics?.cohenKappa != null
      ? Number(validationReport.metrics.cohenKappa).toFixed(3)
      : null;

  return (
    <PortalShell
      portalSubtitle="Institution Administration"
      user={user}
      onLogout={logout}
      badgeIcon={ShieldCheck}
      badgeLabel="Evaluation Dashboard"
      badgeColorClass="bg-highlighter-yellow text-ink"
      title="User Testing & Evaluation Ledger"
      subtitle="Monitor project objectives with empirical data across helpfulness, usability, and algorithmic gap validation."
      headerRight={
        <Button to="/admin" variant="secondary" size="sm" className="text-xs">
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          <span>Back to Admin Home</span>
        </Button>
      }
    >
      <div className="space-y-6">
        {/* EDUCATIONAL / CONTEXTUAL NOTICE */}
        <NotebookCard
          borderStyle="sketch"
          className="p-5 bg-paper-card dark:bg-chalkboard-card border-2 border-ink dark:border-chalkboard-border flex items-start gap-3"
        >
          <div className="p-2 rounded-xl bg-highlighter-mint/30 text-ink border border-ink/15 shrink-0 mt-0.5">
            <TrendingUp className="w-5 h-5 text-ink-blue" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <h2 className="text-sm font-extrabold text-ink dark:text-chalkboard-chalk">
              Pilot Evaluation Ledger & Honest Target Gates
            </h2>
            <p className="text-xs text-ink-muted dark:text-chalkboard-muted leading-relaxed">
              Each objective below reports both its live measurement and sample size (<em>n</em>). A target is never marked as met until its minimum participant gate is reached. Click any <strong>(?)</strong> button for a plain-language explanation of how the metric is calculated.
            </p>
          </div>
        </NotebookCard>

        {loading ? (
          <NotebookCard className="p-12 text-center bg-paper-card dark:bg-chalkboard-card border-2 border-ink dark:border-chalkboard-border">
            <div className="inline-flex items-center gap-2 text-ink-muted dark:text-chalkboard-muted">
              <Clock className="w-5 h-5 animate-spin text-redpen dark:text-highlighter-yellow" />
              <span className="font-mono text-sm">
                Aggregating evaluation targets and survey summaries...
              </span>
            </div>
          </NotebookCard>
        ) : error ? (
          <div className="p-6 rounded-xl border-2 border-red-500 bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-200 text-sm">
            {error}
          </div>
        ) : (
          <div className="space-y-6">
            {/* CARD 1: HELPFULNESS RATINGS (80% TARGET) */}
            {ratingsSummary && (
              <NotebookCard
                ruled
                marginLine
                lifted
                className="p-6 sm:p-8 bg-paper-card dark:bg-chalkboard-card border-2 border-ink dark:border-chalkboard-border space-y-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-ink/10 dark:border-chalkboard-borderSubtle pb-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <Star className="w-5 h-5 text-redpen dark:text-highlighter-yellow" aria-hidden="true" />
                      <h3 className="text-xl font-extrabold text-ink dark:text-chalkboard-chalk">
                        Feedback & Resource Helpfulness
                      </h3>
                      <PlainLanguageExplainer
                        id="explainer-helpfulness"
                        label="Explain helpfulness rating metric in plain language"
                        open={openExplainers.helpfulness}
                        onToggle={() => toggleExplainer('helpfulness')}
                      />
                      {getStatusBadge(
                        ratingsSummary.targetCheckStatus,
                        ratingsSummary.totalRaters ?? 0,
                        10
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-ink-muted dark:text-chalkboard-muted">
                      Target: At least 80% of ratings are 4 or 5 (Very/Extremely helpful), across ≥ 10 distinct student raters.
                    </p>
                  </div>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleExportRatings}
                    disabled={exportingRatings || ratingsSummary.totalRatings === 0}
                    className="text-xs shrink-0"
                  >
                    <Download className="w-3.5 h-3.5 mr-1" />
                    <span>{exportingRatings ? 'Exporting...' : 'Export Ratings CSV'}</span>
                  </Button>
                </div>

                {openExplainers.helpfulness && (
                  <div
                    id="explainer-helpfulness"
                    className="p-4 rounded-xl bg-paper-warm dark:bg-chalkboard-surface border border-ink/20 dark:border-chalkboard-borderSubtle text-xs text-ink dark:text-chalkboard-chalk space-y-1.5 leading-relaxed"
                  >
                    <p className="font-bold">What is the Helpfulness Rating?</p>
                    <p className="text-ink-muted dark:text-chalkboard-muted">
                      After viewing topic feedback or completing a recommended study resource, students rate how helpful it was on a 1 to 5 scale. This metric calculates the percentage of all submitted ratings that scored <strong>4 (Very Helpful)</strong> or <strong>5 (Extremely Helpful)</strong>. To prevent a single user from skewing results, the 80% target requires at least <strong>n = 10 distinct student raters</strong> before it can be certified.
                    </p>
                  </div>
                )}

                <p className="text-sm font-bold text-ink dark:text-chalkboard-chalk">
                  {ratingsSummary.targetCheckSentence}
                </p>

                {/* 4 Quick Metric Tiles */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-4 rounded-xl border-2 border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-warm/50 dark:bg-chalkboard-surface/50">
                    <span className="text-[10px] font-mono font-bold uppercase text-ink-muted dark:text-chalkboard-muted block">
                      Helpful Percentage
                    </span>
                    <span className="text-2xl font-extrabold font-mono text-ink dark:text-chalkboard-chalk mt-1 block">
                      {ratingsSummary.totalRatings > 0 ? `${ratingsSummary.helpfulPercentage}%` : '—'}
                    </span>
                    <span className="text-[10px] text-ink-muted dark:text-chalkboard-muted block">
                      Ratings of 4 or 5 (n = {ratingsSummary.totalRatings})
                    </span>
                  </div>

                  <div className="p-4 rounded-xl border-2 border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-warm/50 dark:bg-chalkboard-surface/50">
                    <span className="text-[10px] font-mono font-bold uppercase text-ink-muted dark:text-chalkboard-muted block">
                      Distinct Raters (n)
                    </span>
                    <span className="text-2xl font-extrabold font-mono text-ink dark:text-chalkboard-chalk mt-1 block">
                      {ratingsSummary.totalRaters}
                    </span>
                    <span className="text-[10px] text-ink-muted dark:text-chalkboard-muted block">
                      Gate: ≥ 10 raters
                    </span>
                  </div>

                  <div className="p-4 rounded-xl border-2 border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-warm/50 dark:bg-chalkboard-surface/50">
                    <span className="text-[10px] font-mono font-bold uppercase text-ink-muted dark:text-chalkboard-muted block">
                      Total Ratings Logged
                    </span>
                    <span className="text-2xl font-extrabold font-mono text-ink dark:text-chalkboard-chalk mt-1 block">
                      {ratingsSummary.totalRatings}
                    </span>
                    <span className="text-[10px] text-ink-muted dark:text-chalkboard-muted block">
                      Topics & resources
                    </span>
                  </div>

                  <div className="p-4 rounded-xl border-2 border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-warm/50 dark:bg-chalkboard-surface/50">
                    <span className="text-[10px] font-mono font-bold uppercase text-ink-muted dark:text-chalkboard-muted block">
                      Satisfied Students
                    </span>
                    <span className="text-2xl font-extrabold font-mono text-ink dark:text-chalkboard-chalk mt-1 block">
                      {ratingsSummary.totalRaters > 0 ? `${ratingsSummary.satisfiedRatersPercentage}%` : '—'}
                    </span>
                    <span className="text-[10px] text-ink-muted dark:text-chalkboard-muted block">
                      Personal average ≥ 4.0
                    </span>
                  </div>
                </div>
              </NotebookCard>
            )}

            {/* CARD 2: USABILITY SURVEY (4.0 / 5.0 TARGET) */}
            {surveySummary && (
              <NotebookCard
                ruled
                marginLine
                lifted
                className="p-6 sm:p-8 bg-paper-card dark:bg-chalkboard-card border-2 border-ink dark:border-chalkboard-border space-y-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-ink/10 dark:border-chalkboard-borderSubtle pb-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <MessageSquare className="w-5 h-5 text-redpen dark:text-highlighter-yellow" aria-hidden="true" />
                      <h3 className="text-xl font-extrabold text-ink dark:text-chalkboard-chalk">
                        In-App Usability Survey
                      </h3>
                      <PlainLanguageExplainer
                        id="explainer-usability"
                        label="Explain usability survey score in plain language"
                        open={openExplainers.usability}
                        onToggle={() => toggleExplainer('usability')}
                      />
                      {getStatusBadge(
                        surveySummary.targetCheckStatus,
                        surveySummary.totalResponses ?? 0,
                        10
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-ink-muted dark:text-chalkboard-muted">
                      Target: Overall usability average of at least 4.0 out of 5.0, across ≥ 5 responses per role (student & teacher).
                    </p>
                  </div>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleExportSurvey}
                    disabled={exportingSurvey || surveySummary.totalResponses === 0}
                    className="text-xs shrink-0"
                  >
                    <Download className="w-3.5 h-3.5 mr-1" />
                    <span>{exportingSurvey ? 'Exporting...' : 'Export Survey CSV'}</span>
                  </Button>
                </div>

                {openExplainers.usability && (
                  <div
                    id="explainer-usability"
                    className="p-4 rounded-xl bg-paper-warm dark:bg-chalkboard-surface border border-ink/20 dark:border-chalkboard-borderSubtle text-xs text-ink dark:text-chalkboard-chalk space-y-1.5 leading-relaxed"
                  >
                    <p className="font-bold">What is the Usability Survey Score?</p>
                    <p className="text-ink-muted dark:text-chalkboard-muted">
                      Students and teachers complete a structured 5-point Likert questionnaire evaluating ease of navigation, clarity of mastery statuses, and workflow speed (1 = Strongly Disagree to 5 = Strongly Agree). Each participant&apos;s item scores are averaged, and the overall score is the mean across all respondents. Certifying the <strong>≥ 4.0 / 5.0</strong> target requires at least <strong>5 student responses and 5 teacher responses</strong>.
                    </p>
                  </div>
                )}

                <p className="text-sm font-bold text-ink dark:text-chalkboard-chalk">
                  {surveySummary.targetCheckSentence}
                </p>

                {/* 4 Quick Metric Tiles */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-4 rounded-xl border-2 border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-warm/50 dark:bg-chalkboard-surface/50">
                    <span className="text-[10px] font-mono font-bold uppercase text-ink-muted dark:text-chalkboard-muted block">
                      Overall Usability Score
                    </span>
                    <span className="text-2xl font-extrabold font-mono text-ink dark:text-chalkboard-chalk mt-1 block">
                      {surveySummary.totalResponses > 0 ? (
                        <>
                          {surveySummary.overallAverage.toFixed(2)}
                          <span className="text-xs font-normal text-ink-muted dark:text-chalkboard-muted ml-1">
                            / 5.0
                          </span>
                        </>
                      ) : (
                        '—'
                      )}
                    </span>
                    <span className="text-[10px] text-ink-muted dark:text-chalkboard-muted block">
                      Target: ≥ 4.0 (n = {surveySummary.totalResponses})
                    </span>
                  </div>

                  <div className="p-4 rounded-xl border-2 border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-warm/50 dark:bg-chalkboard-surface/50">
                    <span className="text-[10px] font-mono font-bold uppercase text-ink-muted dark:text-chalkboard-muted block">
                      Student Average
                    </span>
                    <span className="text-2xl font-extrabold font-mono text-ink dark:text-chalkboard-chalk mt-1 block">
                      {surveySummary.studentResponsesCount > 0
                        ? surveySummary.studentAverage.toFixed(2)
                        : '—'}
                    </span>
                    <span className="text-[10px] text-ink-muted dark:text-chalkboard-muted block">
                      n = {surveySummary.studentResponsesCount} (gate: ≥ 5)
                    </span>
                  </div>

                  <div className="p-4 rounded-xl border-2 border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-warm/50 dark:bg-chalkboard-surface/50">
                    <span className="text-[10px] font-mono font-bold uppercase text-ink-muted dark:text-chalkboard-muted block">
                      Teacher Average
                    </span>
                    <span className="text-2xl font-extrabold font-mono text-ink dark:text-chalkboard-chalk mt-1 block">
                      {surveySummary.teacherResponsesCount > 0
                        ? surveySummary.teacherAverage.toFixed(2)
                        : '—'}
                    </span>
                    <span className="text-[10px] text-ink-muted dark:text-chalkboard-muted block">
                      n = {surveySummary.teacherResponsesCount} (gate: ≥ 5)
                    </span>
                  </div>

                  <div className="p-4 rounded-xl border-2 border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-warm/50 dark:bg-chalkboard-surface/50">
                    <span className="text-[10px] font-mono font-bold uppercase text-ink-muted dark:text-chalkboard-muted block">
                      Total Survey Responses (n)
                    </span>
                    <span className="text-2xl font-extrabold font-mono text-ink dark:text-chalkboard-chalk mt-1 block">
                      {surveySummary.totalResponses}
                    </span>
                    <span className="text-[10px] text-ink-muted dark:text-chalkboard-muted block">
                      {surveySummary.totalResponses > 0
                        ? `${surveySummary.satisfiedRespondentsPercentage}% rated ≥ 4.0`
                        : 'No responses yet'}
                    </span>
                  </div>
                </div>
              </NotebookCard>
            )}

            {/* CARD 3: VALIDATION LAB AGREEMENT & COHEN'S KAPPA (85% TARGET) */}
            {validationReport && (
              <NotebookCard
                ruled
                marginLine
                lifted
                className="p-6 sm:p-8 bg-paper-card dark:bg-chalkboard-card border-2 border-ink dark:border-chalkboard-border space-y-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-ink/10 dark:border-chalkboard-borderSubtle pb-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <FlaskConical className="w-5 h-5 text-redpen dark:text-highlighter-yellow" aria-hidden="true" />
                      <h3 className="text-xl font-extrabold text-ink dark:text-chalkboard-chalk">
                        Validation Lab Agreement &amp; Cohen&apos;s Kappa
                      </h3>
                      <PlainLanguageExplainer
                        id="explainer-kappa"
                        label="Explain validation agreement and Cohen's kappa in plain language"
                        open={openExplainers.kappa}
                        onToggle={() => toggleExplainer('kappa')}
                      />
                      {getStatusBadge(
                        validationReport.targetCheck?.status,
                        evaluatedStudents,
                        30,
                        validationReport.targetCheck?.bannerType
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-ink-muted dark:text-chalkboard-muted">
                      Target: At least 85% agreement between rule-based topic gap detection and blind teacher judgments across ≥ 30 fully evaluated students.
                    </p>
                  </div>

                  <Button
                    to="/admin/validation"
                    variant="mint"
                    size="sm"
                    className="text-xs shrink-0"
                  >
                    <BarChart3 className="w-3.5 h-3.5 mr-1" />
                    <span>Open Validation Lab Report</span>
                  </Button>
                </div>

                {openExplainers.kappa && (
                  <div
                    id="explainer-kappa"
                    className="p-4 rounded-xl bg-paper-warm dark:bg-chalkboard-surface border border-ink/20 dark:border-chalkboard-borderSubtle text-xs text-ink dark:text-chalkboard-chalk space-y-1.5 leading-relaxed"
                  >
                    <p className="font-bold">
                      What are Validation Agreement and Cohen&apos;s Kappa (κ)?
                    </p>
                    <p className="text-ink-muted dark:text-chalkboard-muted">
                      In the blind Validation Lab, teachers review a student&apos;s raw quiz answers on 3 randomly assigned topics without seeing the system&apos;s score, and label each topic as <strong>WEAK</strong> or <strong>NOT WEAK</strong>. <strong>Agreement</strong> is the percentage of topic pairs where the teacher&apos;s blind label matches the system&apos;s rule-based <strong>GAP (&lt; 60%)</strong> classification. <strong>Cohen&apos;s kappa (κ)</strong> measures how much of that agreement goes beyond random chance (0.00 = chance level, &gt; 0.60 = substantial agreement, 1.00 = perfect agreement; shown as &ldquo;—&rdquo; if all labels fall into a single category). Certifying the 85% target requires <strong>n ≥ 30 fully evaluated students</strong>.
                    </p>
                  </div>
                )}

                <p className="text-sm font-bold text-ink dark:text-chalkboard-chalk">
                  {validationReport.targetCheck?.sentence}
                </p>

                {/* 4 Metric Tiles including Cohen's Kappa */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-4 rounded-xl border-2 border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-warm/50 dark:bg-chalkboard-surface/50">
                    <span className="text-[10px] font-mono font-bold uppercase text-ink-muted dark:text-chalkboard-muted block">
                      Algorithm Agreement
                    </span>
                    <span className="text-2xl font-extrabold font-mono text-ink dark:text-chalkboard-chalk mt-1 block">
                      {usablePairs > 0 && validationReport.metrics?.accuracyPercent != null
                        ? `${validationReport.metrics.accuracyPercent}%`
                        : '—'}
                    </span>
                    <span className="text-[10px] text-ink-muted dark:text-chalkboard-muted block">
                      Target: ≥ 85%
                    </span>
                  </div>

                  <div className="p-4 rounded-xl border-2 border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-warm/50 dark:bg-chalkboard-surface/50">
                    <span className="text-[10px] font-mono font-bold uppercase text-ink-muted dark:text-chalkboard-muted block">
                      Cohen&apos;s Kappa (κ)
                    </span>
                    <span className="text-2xl font-extrabold font-mono text-ink dark:text-chalkboard-chalk mt-1 block">
                      {cohenKappa ?? '—'}
                    </span>
                    <span className="text-[10px] text-ink-muted dark:text-chalkboard-muted block">
                      Agreement beyond chance
                    </span>
                  </div>

                  <div className="p-4 rounded-xl border-2 border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-warm/50 dark:bg-chalkboard-surface/50">
                    <span className="text-[10px] font-mono font-bold uppercase text-ink-muted dark:text-chalkboard-muted block">
                      Evaluated Students (n)
                    </span>
                    <span className="text-2xl font-extrabold font-mono text-ink dark:text-chalkboard-chalk mt-1 block">
                      {evaluatedStudents}
                    </span>
                    <span className="text-[10px] text-ink-muted dark:text-chalkboard-muted block">
                      Gate: ≥ 30 students
                    </span>
                  </div>

                  <div className="p-4 rounded-xl border-2 border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-warm/50 dark:bg-chalkboard-surface/50">
                    <span className="text-[10px] font-mono font-bold uppercase text-ink-muted dark:text-chalkboard-muted block">
                      Usable Topic Pairs
                    </span>
                    <span className="text-2xl font-extrabold font-mono text-ink dark:text-chalkboard-chalk mt-1 block">
                      {usablePairs}
                    </span>
                    <span className="text-[10px] text-ink-muted dark:text-chalkboard-muted block">
                      Excluded: {excludedCannotJudge} cannot judge
                    </span>
                  </div>
                </div>
              </NotebookCard>
            )}
          </div>
        )}
      </div>
    </PortalShell>
  );
}
