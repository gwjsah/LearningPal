import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowLeft,
  Send,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { surveyService } from '../services/surveyService';
import { PortalShell, NotebookCard, Button, NotebookBackButton } from '../components/NotebookPrimitives';
import { getRoleHome } from '../utils/roleHome';

const SCALE_LABELS = [
  { score: 1, label: 'Strongly disagree' },
  { score: 2, label: 'Disagree' },
  { score: 3, label: 'Neutral' },
  { score: 4, label: 'Agree' },
  { score: 5, label: 'Strongly agree' },
];

export default function UsabilitySurvey() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [surveyData, setSurveyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form state
  const [answers, setAnswers] = useState({});
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const fetchSurvey = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await surveyService.getSurveyStatus();
      setSurveyData(data);
    } catch (err) {
      setError(err.message || 'Failed to load survey items.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSurvey();
  }, []);

  const handleScoreChange = (itemKey, score) => {
    setAnswers((prev) => ({
      ...prev,
      [itemKey]: score,
    }));
  };

  const answeredCount = Object.keys(answers).length;
  const totalCount = surveyData?.items?.length || 0;
  const isComplete = totalCount > 0 && answeredCount === totalCount;
  const progressPercent = totalCount > 0 ? Math.round((answeredCount / totalCount) * 100) : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isComplete) {
      setSubmitError('Please provide a rating for every statement before submitting.');
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    try {
      await surveyService.submitSurvey({
        surveyVersion: surveyData.surveyVersion,
        answers,
        comment: comment.trim() || null,
      });
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err.message || 'Failed to submit survey. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const backDestination = getRoleHome(user?.role);

  return (
    <PortalShell
      portalSubtitle="In-App Usability Survey"
      user={user}
      onLogout={logout}
      badgeIcon={MessageSquare}
      badgeLabel="User Experience Feedback"
      badgeColorClass="bg-highlighter-yellow text-ink"
      title="LearningPal Usability Survey"
      subtitle="Help us evaluate and improve your learning and teaching experience. Takes about 2 minutes."
      headerRight={
        <div className="flex items-center gap-2.5 shrink-0">
          <NotebookBackButton to={backDestination} label="Back to Dashboard" />
        </div>
      }
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {loading ? (
          <NotebookCard className="p-12 text-center bg-paper-card dark:bg-chalkboard-card border-2 border-ink dark:border-chalkboard-border">
            <div className="inline-flex items-center gap-2 text-ink-muted dark:text-chalkboard-muted">
              <Clock className="w-5 h-5 animate-spin text-redpen dark:text-highlighter-yellow" />
              <span className="font-mono text-sm">Loading survey questions...</span>
            </div>
          </NotebookCard>
        ) : error ? (
          <div
            role="alert"
            className="p-6 rounded-xl border-2 border-redpen bg-redpen-soft dark:bg-red-950/40 text-redpen-dark dark:text-red-200 text-sm"
          >
            {error}
          </div>
        ) : surveyData?.alreadyResponded || submitted ? (
          /* THANK YOU / ALREADY RESPONDED CARD */
          <NotebookCard
            ruled
            marginLine
            lifted
            className="p-8 sm:p-12 text-center bg-paper-card dark:bg-chalkboard-card border-2 border-ink dark:border-chalkboard-border space-y-4"
          >
            <div className="w-12 h-12 mx-auto rounded-full bg-highlighter-mint flex items-center justify-center text-ink border-2 border-ink shadow-notebook-sm">
              <CheckCircle2 className="w-6 h-6 text-emerald-800" />
            </div>

            <div className="space-y-2 max-w-lg mx-auto">
              <h2 className="text-2xl font-extrabold text-ink dark:text-chalkboard-chalk">
                Thank You for Your Feedback!
              </h2>
              <p className="text-sm text-ink-muted dark:text-chalkboard-muted leading-relaxed">
                Your responses have been recorded and will be combined with our usability benchmarks to ensure LearningPal is intuitive, transparent, and easy to use.
              </p>
            </div>

            <div className="pt-4">
              <Button
                to={backDestination}
                variant="primary"
                size="md"
              >
                <span>Return to Workspace</span>
              </Button>
            </div>
          </NotebookCard>
        ) : (
          /* SURVEY FORM */
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* PROGRESS BAR */}
            <NotebookCard
              borderStyle="sketch"
              className="p-5 bg-paper-card dark:bg-chalkboard-card border-2 border-ink dark:border-chalkboard-border space-y-2"
            >
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-ink dark:text-chalkboard-chalk">
                  Progress: {answeredCount} of {totalCount} statements answered
                </span>
                <span className="text-ink-muted dark:text-chalkboard-muted">
                  {progressPercent}% completed
                </span>
              </div>
              <div className="w-full bg-ink/10 dark:bg-chalkboard-borderSubtle h-2.5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-redpen dark:bg-highlighter-yellow transition-all duration-300 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                  role="progressbar"
                  aria-valuenow={answeredCount}
                  aria-valuemin="0"
                  aria-valuemax={totalCount}
                />
              </div>
            </NotebookCard>

            {/* SURVEY STATEMENTS */}
            <div className="space-y-4">
              {surveyData?.items?.map((item, idx) => {
                const currentScore = answers[item.key];

                return (
                  <NotebookCard
                    key={item.key}
                    ruled
                    marginLine
                    className={`p-6 bg-paper-card dark:bg-chalkboard-card border-2 transition-colors ${
                      currentScore != null
                        ? 'border-ink dark:border-chalkboard-border'
                        : 'border-ink/30 dark:border-chalkboard-borderSubtle'
                    }`}
                  >
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-paper-warm dark:bg-chalkboard-surface border border-ink/20 text-ink-muted dark:text-chalkboard-muted shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <h3 className="text-base font-bold text-ink dark:text-chalkboard-chalk leading-snug">
                          {item.statement}
                        </h3>
                      </div>

                      {/* 1-to-5 Likert Radio Group */}
                      <fieldset
                        role="radiogroup"
                        aria-label={item.statement}
                        className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-1"
                      >
                        <legend className="sr-only">{item.statement}</legend>
                        {SCALE_LABELS.map((scale) => {
                          const isSelected = currentScore === scale.score;

                          return (
                            <label
                              key={scale.score}
                              className={`flex sm:flex-col items-center justify-between sm:justify-center p-3 rounded-xl border-2 text-center cursor-pointer transition-all ${
                                isSelected
                                  ? 'border-redpen bg-redpen-soft/30 dark:bg-redpen-soft/20 text-ink dark:text-chalkboard-chalk font-bold shadow-xs'
                                  : 'border-ink/20 dark:border-chalkboard-border bg-paper-warm/50 dark:bg-chalkboard-surface/50 hover:bg-paper-warm text-ink dark:text-chalkboard-chalk'
                              }`}
                            >
                              <div className="flex items-center gap-2 sm:flex-col sm:gap-1">
                                <span className="font-mono text-base sm:text-lg font-extrabold text-redpen dark:text-highlighter-yellow">
                                  {scale.score}
                                </span>
                                <span className="text-xs font-medium leading-tight">
                                  {scale.label}
                                </span>
                              </div>

                              <input
                                type="radio"
                                name={`item-${item.key}`}
                                value={scale.score}
                                checked={isSelected}
                                onChange={() => handleScoreChange(item.key, scale.score)}
                                className="sm:mt-2 text-redpen focus:ring-redpen"
                              />
                            </label>
                          );
                        })}
                      </fieldset>
                    </div>
                  </NotebookCard>
                );
              })}
            </div>

            {/* OPTIONAL OPEN COMMENT */}
            <NotebookCard
              borderStyle="sketch"
              className="p-6 bg-paper-card dark:bg-chalkboard-card border-2 border-ink dark:border-chalkboard-border space-y-3"
            >
              <div className="flex items-center justify-between">
                <label
                  htmlFor="survey-comment"
                  className="text-xs font-mono font-bold uppercase tracking-wider text-ink dark:text-chalkboard-chalk"
                >
                  Additional Comments or Suggestions (optional)
                </label>
                <span className="text-[10px] font-mono text-ink-muted dark:text-chalkboard-muted">
                  {comment.length} / 500
                </span>
              </div>

              <textarea
                id="survey-comment"
                rows={3}
                maxLength={500}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="What did you like most about LearningPal? What could be improved?"
                className="w-full p-3 rounded-xl text-xs bg-paper-warm dark:bg-chalkboard-surface border border-ink/20 dark:border-chalkboard-border text-ink dark:text-chalkboard-chalk placeholder:text-ink-muted/50 focus:outline-none focus:ring-2 focus:ring-redpen"
              />
            </NotebookCard>

            {/* SUBMIT BUTTON & ERROR */}
            {submitError && (
              <div
                role="alert"
                className="p-4 rounded-xl border-2 border-redpen bg-redpen-soft dark:bg-red-950/40 text-redpen-dark dark:text-red-200 text-xs flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{submitError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={!isComplete || submitting}
                className="w-full sm:w-auto"
              >
                <Send className="w-4 h-4 mr-2" />
                <span>{submitting ? 'Submitting Responses...' : 'Submit Usability Survey'}</span>
              </Button>
            </div>
          </form>
        )}
      </div>
    </PortalShell>
  );
}
