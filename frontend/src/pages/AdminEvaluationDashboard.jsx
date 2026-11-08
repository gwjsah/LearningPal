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
  Users,
  ShieldCheck,
  TrendingUp,
  FileSpreadsheet,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { adminService } from '../services/adminService';
import { PortalShell, NotebookCard, Button } from '../components/NotebookPrimitives';

export default function AdminEvaluationDashboard() {
  const { user, logout } = useAuth();

  const [ratingsSummary, setRatingsSummary] = useState(null);
  const [surveySummary, setSurveySummary] = useState(null);
  const [validationReport, setValidationReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [exportingRatings, setExportingRatings] = useState(false);
  const [exportingSurvey, setExportingSurvey] = useState(false);

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

  const getStatusBadge = (status) => {
    const isMet = status === 'MET';
    const isNotMet = status === 'NOT_MET';

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-extrabold uppercase border ${
          isMet
            ? 'bg-highlighter-mint text-ink border-ink/20'
            : isNotMet
            ? 'bg-redpen-soft text-redpen-dark border-redpen/30'
            : 'bg-paper-warm dark:bg-chalkboard-surface text-ink-muted dark:text-chalkboard-muted border-ink/20'
        }`}
      >
        {isMet && <CheckCircle2 className="w-3.5 h-3.5" />}
        {isNotMet && <AlertCircle className="w-3.5 h-3.5" />}
        {!isMet && !isNotMet && <Clock className="w-3.5 h-3.5" />}
        <span>
          {isMet ? 'Target Met' : isNotMet ? 'Target Not Met' : 'Not Enough Data'}
        </span>
      </span>
    );
  };

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
        <Button
          to="/admin"
          variant="secondary"
          size="sm"
          className="text-xs"
        >
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
            <TrendingUp className="w-5 h-5 text-ink-blue" />
          </div>
          <div className="space-y-1">
            <h2 className="text-sm font-extrabold text-ink dark:text-chalkboard-chalk">
              Pilot Evaluation Ledger & Target Checks
            </h2>
            <p className="text-xs text-ink-muted dark:text-chalkboard-muted leading-relaxed">
              These three objective metrics measure student satisfaction, system usability, and algorithmic diagnostic agreement.
              Target compliance statuses require real tester participation to reach sample size thresholds.
            </p>
          </div>
        </NotebookCard>

        {loading ? (
          <NotebookCard className="p-12 text-center bg-paper-card dark:bg-chalkboard-card border-2 border-ink dark:border-chalkboard-border">
            <div className="inline-flex items-center gap-2 text-ink-muted dark:text-chalkboard-muted">
              <Clock className="w-5 h-5 animate-spin text-redpen dark:text-highlighter-yellow" />
              <span className="font-mono text-sm">Aggregating evaluation targets and survey summaries...</span>
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
                    <div className="flex items-center gap-2.5">
                      <Star className="w-5 h-5 text-redpen dark:text-highlighter-yellow" />
                      <h3 className="text-xl font-extrabold text-ink dark:text-chalkboard-chalk">
                        Feedback & Resource Helpfulness
                      </h3>
                      {getStatusBadge(ratingsSummary.targetCheckStatus)}
                    </div>
                    <p className="text-xs sm:text-sm text-ink-muted dark:text-chalkboard-muted">
                      Target: At least 80% of ratings are 4 or 5 (Very/Extremely helpful), across ≥ 10 raters.
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
                      {ratingsSummary.helpfulPercentage}%
                    </span>
                    <span className="text-[10px] text-ink-muted dark:text-chalkboard-muted block">
                      Ratings of 4 or 5
                    </span>
                  </div>

                  <div className="p-4 rounded-xl border-2 border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-warm/50 dark:bg-chalkboard-surface/50">
                    <span className="text-[10px] font-mono font-bold uppercase text-ink-muted dark:text-chalkboard-muted block">
                      Distinct Raters
                    </span>
                    <span className="text-2xl font-extrabold font-mono text-ink dark:text-chalkboard-chalk mt-1 block">
                      {ratingsSummary.totalRaters}
                    </span>
                    <span className="text-[10px] text-ink-muted dark:text-chalkboard-muted block">
                      Target: ≥ 10 raters
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
                      {ratingsSummary.satisfiedRatersPercentage}%
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
                    <div className="flex items-center gap-2.5">
                      <MessageSquare className="w-5 h-5 text-redpen dark:text-highlighter-yellow" />
                      <h3 className="text-xl font-extrabold text-ink dark:text-chalkboard-chalk">
                        In-App Usability Survey
                      </h3>
                      {getStatusBadge(surveySummary.targetCheckStatus)}
                    </div>
                    <p className="text-xs sm:text-sm text-ink-muted dark:text-chalkboard-muted">
                      Target: Overall usability score of at least 4.0 out of 5, across ≥ 5 responses per role.
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
                      {surveySummary.overallAverage.toFixed(2)}
                      <span className="text-xs font-normal text-ink-muted dark:text-chalkboard-muted ml-1">/ 5.0</span>
                    </span>
                    <span className="text-[10px] text-ink-muted dark:text-chalkboard-muted block">
                      Target: ≥ 4.0
                    </span>
                  </div>

                  <div className="p-4 rounded-xl border-2 border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-warm/50 dark:bg-chalkboard-surface/50">
                    <span className="text-[10px] font-mono font-bold uppercase text-ink-muted dark:text-chalkboard-muted block">
                      Student Average
                    </span>
                    <span className="text-2xl font-extrabold font-mono text-ink dark:text-chalkboard-chalk mt-1 block">
                      {surveySummary.studentAverage.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-ink-muted dark:text-chalkboard-muted block">
                      {surveySummary.studentResponsesCount} student responses
                    </span>
                  </div>

                  <div className="p-4 rounded-xl border-2 border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-warm/50 dark:bg-chalkboard-surface/50">
                    <span className="text-[10px] font-mono font-bold uppercase text-ink-muted dark:text-chalkboard-muted block">
                      Teacher Average
                    </span>
                    <span className="text-2xl font-extrabold font-mono text-ink dark:text-chalkboard-chalk mt-1 block">
                      {surveySummary.teacherAverage.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-ink-muted dark:text-chalkboard-muted block">
                      {surveySummary.teacherResponsesCount} teacher responses
                    </span>
                  </div>

                  <div className="p-4 rounded-xl border-2 border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-warm/50 dark:bg-chalkboard-surface/50">
                    <span className="text-[10px] font-mono font-bold uppercase text-ink-muted dark:text-chalkboard-muted block">
                      Total Survey Responses
                    </span>
                    <span className="text-2xl font-extrabold font-mono text-ink dark:text-chalkboard-chalk mt-1 block">
                      {surveySummary.totalResponses}
                    </span>
                    <span className="text-[10px] text-ink-muted dark:text-chalkboard-muted block">
                      {surveySummary.satisfiedRespondentsPercentage}% rated ≥ 4.0
                    </span>
                  </div>
                </div>
              </NotebookCard>
            )}

            {/* CARD 3: VALIDATION LAB AGREEMENT (85% TARGET) */}
            {validationReport && (
              <NotebookCard
                ruled
                marginLine
                lifted
                className="p-6 sm:p-8 bg-paper-card dark:bg-chalkboard-card border-2 border-ink dark:border-chalkboard-border space-y-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-ink/10 dark:border-chalkboard-borderSubtle pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <FlaskConical className="w-5 h-5 text-redpen dark:text-highlighter-yellow" />
                      <h3 className="text-xl font-extrabold text-ink dark:text-chalkboard-chalk">
                        Validation Lab Topic Agreement
                      </h3>
                      {getStatusBadge(validationReport.targetCheck?.status)}
                    </div>
                    <p className="text-xs sm:text-sm text-ink-muted dark:text-chalkboard-muted">
                      Target: At least 85% agreement with blind teacher validations on ≥ 30 students.
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

                <p className="text-sm font-bold text-ink dark:text-chalkboard-chalk">
                  {validationReport.targetCheck?.sentence}
                </p>

                {/* 3 Metric Tiles */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-xl border-2 border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-warm/50 dark:bg-chalkboard-surface/50">
                    <span className="text-[10px] font-mono font-bold uppercase text-ink-muted dark:text-chalkboard-muted block">
                      Algorithm Agreement
                    </span>
                    <span className="text-2xl font-extrabold font-mono text-ink dark:text-chalkboard-chalk mt-1 block">
                      {validationReport.metrics?.accuracyPercent != null ? `${validationReport.metrics.accuracyPercent}%` : '—'}
                    </span>
                    <span className="text-[10px] text-ink-muted dark:text-chalkboard-muted block">
                      Target: ≥ 85%
                    </span>
                  </div>

                  <div className="p-4 rounded-xl border-2 border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-warm/50 dark:bg-chalkboard-surface/50">
                    <span className="text-[10px] font-mono font-bold uppercase text-ink-muted dark:text-chalkboard-muted block">
                      Evaluated Students
                    </span>
                    <span className="text-2xl font-extrabold font-mono text-ink dark:text-chalkboard-chalk mt-1 block">
                      {validationReport.sampleSize?.usableStudents || 0}
                    </span>
                    <span className="text-[10px] text-ink-muted dark:text-chalkboard-muted block">
                      Target: ≥ 30 students
                    </span>
                  </div>

                  <div className="p-4 rounded-xl border-2 border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-warm/50 dark:bg-chalkboard-surface/50">
                    <span className="text-[10px] font-mono font-bold uppercase text-ink-muted dark:text-chalkboard-muted block">
                      Usable Topic Validations
                    </span>
                    <span className="text-2xl font-extrabold font-mono text-ink dark:text-chalkboard-chalk mt-1 block">
                      {validationReport.sampleSize?.usablePairs || 0}
                    </span>
                    <span className="text-[10px] text-ink-muted dark:text-chalkboard-muted block">
                      Excluded: {validationReport.sampleSize?.cannotJudgeExcludedCount || 0} ambiguous
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
