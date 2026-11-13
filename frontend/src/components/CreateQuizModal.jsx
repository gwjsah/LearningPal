import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  Layers,
  List,
  Search,
  X,
} from 'lucide-react';
import { Button } from './NotebookPrimitives';

const TYPE_META = {
  MULTIPLE_CHOICE: {
    short: 'MCQ',
    label: 'Multiple Choice',
    badgeClass: 'border-ink/30 bg-paper-warm text-ink dark:border-chalkboard-borderSubtle dark:bg-chalkboard-surface dark:text-chalkboard-chalk',
  },
  ENUMERATION: {
    short: 'ENUM',
    label: 'Enumeration',
    badgeClass: 'border-amber-700/40 bg-amber-100/70 text-amber-900 dark:border-amber-400/40 dark:bg-amber-900/30 dark:text-amber-200',
  },
  ESSAY: {
    short: 'ESSAY',
    label: 'Essay',
    badgeClass: 'border-redpen/50 bg-redpen-soft text-redpen-dark dark:border-redpen/60 dark:bg-redpen/20 dark:text-redpen-soft',
  },
};

function getCanonicalType(q) {
  if (!q?.type || q.type === 'MCQ') return 'MULTIPLE_CHOICE';
  return q.type;
}

function getQuestionPoints(q) {
  if (getCanonicalType(q) === 'ESSAY' && Array.isArray(q.rubricCriteria) && q.rubricCriteria.length > 0) {
    return q.rubricCriteria.reduce((sum, c) => sum + Number(c.maxPoints || 0), 0);
  }
  return Number(q?.points ?? 1);
}

function formatPoints(pts) {
  return Number.isInteger(pts) ? pts : Number(pts.toFixed(2));
}

/**
 * Modal for creating or editing a quiz with filtered, grouped, and reviewable question selection.
 */
export default function CreateQuizModal({
  mode,
  title,
  onTitleChange,
  timeLimit,
  onTimeLimitChange,
  description,
  onDescriptionChange,
  questions,
  topics,
  selectedQuestionIds,
  onSelectedQuestionIdsChange,
  loading,
  error,
  onSubmit,
  onClose,
  onGoToQuestions,
}) {
  const [activeViewTab, setActiveViewTab] = useState('all'); // 'all' | 'selected'
  const [groupMode, setGroupMode] = useState('flat'); // 'flat' | 'topic'
  const [searchQuery, setSearchQuery] = useState('');
  const [topicFilter, setTopicFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [difficultyFilter, setDifficultyFilter] = useState('ALL');
  const [collapsedTopics, setCollapsedTopics] = useState({});
  const [confirmClear, setConfirmClear] = useState(false);

  // Close on Escape unless a save request is in flight
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && !loading) onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [loading, onClose]);

  const activeQuestions = useMemo(
    () => (questions || []).filter((q) => q.status === 'ACTIVE'),
    [questions]
  );

  const questionById = useMemo(() => {
    const map = new Map();
    for (const q of questions || []) {
      map.set(q.id, q);
    }
    return map;
  }, [questions]);

  const selectedSet = useMemo(() => new Set(selectedQuestionIds), [selectedQuestionIds]);

  const topicOptions = useMemo(() => {
    if (topics && topics.length > 0) {
      return topics.map((t) => ({ id: String(t.id), name: t.name }));
    }
    const seen = new Map();
    for (const q of activeQuestions) {
      if (q.topicId != null && !seen.has(String(q.topicId))) {
        seen.set(String(q.topicId), q.topicName || 'Uncategorized');
      }
    }
    return Array.from(seen, ([id, name]) => ({ id, name }));
  }, [topics, activeQuestions]);

  const filteredQuestions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return activeQuestions.filter((q) => {
      if (topicFilter !== 'ALL' && String(q.topicId) !== topicFilter) return false;
      if (typeFilter !== 'ALL' && getCanonicalType(q) !== typeFilter) return false;
      if (difficultyFilter !== 'ALL' && q.difficulty !== difficultyFilter) return false;
      if (query && !(q.text || '').toLowerCase().includes(query)) return false;
      return true;
    });
  }, [activeQuestions, topicFilter, typeFilter, difficultyFilter, searchQuery]);

  const groupedTopics = useMemo(() => {
    const groups = new Map();
    for (const q of filteredQuestions) {
      const key = q.topicId != null ? String(q.topicId) : 'uncategorized';
      const label = q.topicName || 'Uncategorized';
      if (!groups.has(key)) groups.set(key, { key, label, items: [] });
      groups.get(key).items.push(q);
    }
    return Array.from(groups.values());
  }, [filteredQuestions]);

  // Preserve quiz order for the Selected review tab
  const selectedQuestions = useMemo(
    () => selectedQuestionIds.map((id) => questionById.get(id)).filter(Boolean),
    [selectedQuestionIds, questionById]
  );

  const metrics = useMemo(() => {
    let totalPoints = 0;
    let mcq = 0;
    let enumeration = 0;
    let essay = 0;
    for (const q of selectedQuestions) {
      totalPoints += getQuestionPoints(q);
      const t = getCanonicalType(q);
      if (t === 'MULTIPLE_CHOICE') mcq += 1;
      else if (t === 'ENUMERATION') enumeration += 1;
      else if (t === 'ESSAY') essay += 1;
    }
    return {
      count: selectedQuestions.length,
      totalPoints: formatPoints(totalPoints),
      mcq,
      enumeration,
      essay,
    };
  }, [selectedQuestions]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    topicFilter !== 'ALL' ||
    typeFilter !== 'ALL' ||
    difficultyFilter !== 'ALL';

  const resetFilters = () => {
    setSearchQuery('');
    setTopicFilter('ALL');
    setTypeFilter('ALL');
    setDifficultyFilter('ALL');
  };

  const toggleQuestion = (qId) => {
    setConfirmClear(false);
    onSelectedQuestionIdsChange((prev) =>
      prev.includes(qId) ? prev.filter((id) => id !== qId) : [...prev, qId]
    );
  };

  const selectFiltered = () => {
    setConfirmClear(false);
    const filteredIds = filteredQuestions.map((q) => q.id);
    onSelectedQuestionIdsChange((prev) => {
      const next = new Set(prev);
      filteredIds.forEach((id) => next.add(id));
      return Array.from(next);
    });
  };

  const deselectFiltered = () => {
    setConfirmClear(false);
    const filteredSet = new Set(filteredQuestions.map((q) => q.id));
    onSelectedQuestionIdsChange((prev) => prev.filter((id) => !filteredSet.has(id)));
  };

  const toggleTopicGroup = (items) => {
    setConfirmClear(false);
    const itemIds = items.map((q) => q.id);
    const allSelected = itemIds.every((id) => selectedSet.has(id));
    onSelectedQuestionIdsChange((prev) => {
      if (allSelected) {
        const removeSet = new Set(itemIds);
        return prev.filter((id) => !removeSet.has(id));
      }
      const next = new Set(prev);
      itemIds.forEach((id) => next.add(id));
      return Array.from(next);
    });
  };

  const moveSelected = (index, delta) => {
    const target = index + delta;
    if (target < 0 || target >= selectedQuestionIds.length) return;
    onSelectedQuestionIdsChange((prev) => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const renderQuestionRow = (q) => {
    const checked = selectedSet.has(q.id);
    const cType = getCanonicalType(q);
    const typeMeta = TYPE_META[cType] || TYPE_META.MULTIPLE_CHOICE;
    const pts = formatPoints(getQuestionPoints(q));

    return (
      <label
        key={q.id}
        className={`p-3 rounded-xl border text-xs flex items-start gap-3 cursor-pointer transition-colors focus-within:ring-2 focus-within:ring-redpen ${
          checked
            ? 'bg-paper-card dark:bg-chalkboard-card border-redpen ring-1 ring-redpen/25 shadow-xs'
            : 'bg-paper-card/50 dark:bg-chalkboard-card/50 border-ink/15 dark:border-chalkboard-borderSubtle hover:bg-paper-card dark:hover:bg-chalkboard-card'
        }`}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={() => toggleQuestion(q.id)}
          className="mt-0.5 w-4 h-4 accent-redpen rounded cursor-pointer flex-shrink-0"
        />
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-highlighter-yellow/35 text-ink dark:text-chalkboard-chalk">
              {q.topicName || 'General'}
            </span>
            <span
              className={`text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border ${typeMeta.badgeClass}`}
            >
              {typeMeta.short}
            </span>
            <span className="text-[10px] font-mono text-ink-muted dark:text-chalkboard-muted">
              v{q.version} • {q.difficulty}
            </span>
            <span className="text-[10px] font-mono font-semibold text-ink dark:text-chalkboard-chalk ml-auto">
              ({pts} {pts === 1 ? 'pt' : 'pts'}{cType === 'ESSAY' ? ' rubric' : ''})
            </span>
          </div>
          <p className="text-ink dark:text-chalkboard-chalk font-medium line-clamp-2 leading-snug">
            {q.text}
          </p>
        </div>
      </label>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-ink/40 dark:bg-black/60 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quiz-modal-title"
    >
      <div className="w-full max-w-4xl rounded-2xl bg-paper-card dark:bg-chalkboard-card border-2 border-ink dark:border-chalkboard-border p-4 sm:p-6 shadow-notebook-lg space-y-4 my-4 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 flex-shrink-0">
          <div>
            <h3
              id="quiz-modal-title"
              className="text-lg font-bold text-ink dark:text-chalkboard-chalk"
            >
              {mode === 'create' ? 'Create New Quiz' : 'Edit Quiz'}
            </h3>
            <p className="text-xs text-ink-muted dark:text-chalkboard-muted">
              Filter your question bank by topic, type, or difficulty, then review your selection before saving.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="Close modal"
            className="p-1.5 rounded-lg hover:bg-paper-warm dark:hover:bg-chalkboard-surface text-ink-muted hover:text-ink dark:hover:text-chalkboard-chalk cursor-pointer focus:outline-none focus:ring-2 focus:ring-redpen"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl border border-redpen bg-redpen-soft text-redpen-dark text-xs flex items-center gap-2 flex-shrink-0">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4 flex-1 min-h-0 flex flex-col">
          {/* Quiz Metadata Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-shrink-0">
            <div className="sm:col-span-2">
              <label
                htmlFor="quiz-title-input"
                className="block text-xs font-mono font-bold uppercase tracking-wider text-ink dark:text-chalkboard-chalk mb-1"
              >
                Quiz Title <span className="text-redpen">*</span>
              </label>
              <input
                id="quiz-title-input"
                type="text"
                required
                maxLength={120}
                value={title}
                onChange={(e) => onTitleChange(e.target.value)}
                placeholder="e.g. Midterm Diagnostic Assessment"
                className="w-full px-3.5 py-2 rounded-xl border-2 border-ink/30 dark:border-chalkboard-borderSubtle bg-paper-card dark:bg-chalkboard-card text-ink dark:text-chalkboard-chalk text-sm focus:outline-none focus:border-redpen"
              />
            </div>

            <div>
              <label
                htmlFor="quiz-time-limit-input"
                className="block text-xs font-mono font-bold uppercase tracking-wider text-ink dark:text-chalkboard-chalk mb-1"
              >
                Time Limit (Mins)
              </label>
              <input
                id="quiz-time-limit-input"
                type="number"
                min="5"
                max="180"
                value={timeLimit}
                onChange={(e) => onTimeLimitChange(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border-2 border-ink/30 dark:border-chalkboard-borderSubtle bg-paper-card dark:bg-chalkboard-card text-ink dark:text-chalkboard-chalk text-sm focus:outline-none focus:border-redpen"
              />
            </div>
          </div>

          <div className="flex-shrink-0">
            <label
              htmlFor="quiz-description-input"
              className="block text-xs font-mono font-bold uppercase tracking-wider text-ink dark:text-chalkboard-chalk mb-1"
            >
              Description (Optional)
            </label>
            <textarea
              id="quiz-description-input"
              rows={2}
              maxLength={1000}
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              placeholder="Instructions or scope for students taking this quiz…"
              className="w-full px-3.5 py-2 rounded-xl border border-ink/30 dark:border-chalkboard-borderSubtle bg-paper-card dark:bg-chalkboard-card text-ink dark:text-chalkboard-chalk text-xs focus:outline-none focus:border-redpen"
            />
          </div>

          {/* Question Selector Section */}
          <div className="flex-1 min-h-0 flex flex-col space-y-2.5 border-t border-ink/10 dark:border-chalkboard-borderSubtle pt-3">
            {/* Live Summary Bar + All/Selected Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-2 flex-shrink-0">
              <div className="inline-flex rounded-xl border border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-warm dark:bg-chalkboard-surface p-0.5">
                <button
                  type="button"
                  onClick={() => setActiveViewTab('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer ${
                    activeViewTab === 'all'
                      ? 'bg-paper-card dark:bg-chalkboard-card text-ink dark:text-chalkboard-chalk shadow-xs'
                      : 'text-ink-muted hover:text-ink dark:text-chalkboard-muted'
                  }`}
                >
                  All Questions ({activeQuestions.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveViewTab('selected')}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer ${
                    activeViewTab === 'selected'
                      ? 'bg-paper-card dark:bg-chalkboard-card text-redpen shadow-xs'
                      : 'text-ink-muted hover:text-ink dark:text-chalkboard-muted'
                  }`}
                >
                  Selected ({metrics.count})
                </button>
              </div>

              {/* Quiz Metrics Badge */}
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono bg-paper-warm dark:bg-chalkboard-surface border border-ink/15 dark:border-chalkboard-borderSubtle rounded-xl px-3 py-1.5">
                <span className="font-bold text-ink dark:text-chalkboard-chalk">
                  {metrics.count} {metrics.count === 1 ? 'Question' : 'Questions'} Selected
                </span>
                <span className="text-ink-muted">•</span>
                <span className="font-bold text-redpen">{metrics.totalPoints} pts</span>
                {metrics.count > 0 && (
                  <>
                    <span className="text-ink-muted">•</span>
                    <span className="text-ink-muted dark:text-chalkboard-muted">
                      {[
                        metrics.mcq > 0 ? `${metrics.mcq} MCQ` : null,
                        metrics.enumeration > 0 ? `${metrics.enumeration} Enum` : null,
                        metrics.essay > 0 ? `${metrics.essay} Essay` : null,
                      ]
                        .filter(Boolean)
                        .join(' • ')}
                    </span>
                  </>
                )}
              </div>
            </div>

            {activeQuestions.length === 0 ? (
              <div className="p-6 rounded-xl border border-dashed border-ink/25 dark:border-chalkboard-borderSubtle bg-paper-warm dark:bg-chalkboard-surface text-center space-y-2">
                <p className="text-sm font-semibold text-ink dark:text-chalkboard-chalk">
                  No active questions in this subject yet.
                </p>
                <p className="text-xs text-ink-muted dark:text-chalkboard-muted">
                  Create questions manually or draft them with AI in the Questions tab before assembling a quiz.
                </p>
                {onGoToQuestions && (
                  <Button type="button" variant="secondary" size="sm" onClick={onGoToQuestions}>
                    Go to Questions Tab
                  </Button>
                )}
              </div>
            ) : activeViewTab === 'all' ? (
              <>
                {/* Filter & Search Toolbar */}
                <div className="space-y-2 flex-shrink-0 bg-paper-warm/70 dark:bg-chalkboard-surface/70 p-2.5 rounded-xl border border-ink/15 dark:border-chalkboard-borderSubtle">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    <div className="sm:col-span-6 relative">
                      <Search className="w-3.5 h-3.5 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search questions by prompt text…"
                        aria-label="Search questions by prompt text"
                        className="w-full pl-8 pr-7 py-1.5 rounded-lg border border-ink/25 dark:border-chalkboard-borderSubtle bg-paper-card dark:bg-chalkboard-card text-xs text-ink dark:text-chalkboard-chalk focus:outline-none focus:border-redpen"
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery('')}
                          aria-label="Clear search"
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="sm:col-span-4">
                      <select
                        value={topicFilter}
                        onChange={(e) => setTopicFilter(e.target.value)}
                        aria-label="Filter by topic"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-ink/25 dark:border-chalkboard-borderSubtle bg-paper-card dark:bg-chalkboard-card text-xs text-ink dark:text-chalkboard-chalk focus:outline-none focus:border-redpen"
                      >
                        <option value="ALL">All Topics</option>
                        {topicOptions.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setGroupMode((m) => (m === 'flat' ? 'topic' : 'flat'))}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-ink/25 dark:border-chalkboard-borderSubtle bg-paper-card dark:bg-chalkboard-card text-[11px] font-mono font-bold text-ink dark:text-chalkboard-chalk hover:border-redpen cursor-pointer"
                        title="Switch between flat list and topic grouping"
                      >
                        {groupMode === 'topic' ? (
                          <>
                            <List className="w-3.5 h-3.5" />
                            Flat List
                          </>
                        ) : (
                          <>
                            <Layers className="w-3.5 h-3.5" />
                            By Topic
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Type & Difficulty Pills */}
                  <div className="flex flex-wrap items-center gap-2 justify-between">
                    <div className="flex flex-wrap items-center gap-1">
                      {[
                        ['ALL', 'All Types'],
                        ['MULTIPLE_CHOICE', 'Multiple Choice'],
                        ['ENUMERATION', 'Enumeration'],
                        ['ESSAY', 'Essay'],
                      ].map(([val, label]) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setTypeFilter(val)}
                          className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold border cursor-pointer transition-colors ${
                            typeFilter === val
                              ? 'bg-ink text-paper-card border-ink dark:bg-chalkboard-chalk dark:text-chalkboard-surface'
                              : 'bg-paper-card dark:bg-chalkboard-card text-ink-muted border-ink/20 hover:border-ink/40'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-1">
                      {[
                        ['ALL', 'All Difficulties'],
                        ['EASY', 'Easy'],
                        ['MEDIUM', 'Medium'],
                        ['HARD', 'Hard'],
                      ].map(([val, label]) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setDifficultyFilter(val)}
                          className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold border cursor-pointer transition-colors ${
                            difficultyFilter === val
                              ? 'bg-redpen text-white border-redpen'
                              : 'bg-paper-card dark:bg-chalkboard-card text-ink-muted border-ink/20 hover:border-ink/40'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Filtered Count & Scoped Selection Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-ink/10 dark:border-chalkboard-borderSubtle text-[11px] font-mono">
                    <span className="text-ink-muted dark:text-chalkboard-muted">
                      Showing <strong className="text-ink dark:text-chalkboard-chalk">{filteredQuestions.length}</strong> of{' '}
                      <strong className="text-ink dark:text-chalkboard-chalk">{activeQuestions.length}</strong> questions
                    </span>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={selectFiltered}
                        disabled={filteredQuestions.length === 0}
                        className="text-redpen hover:underline disabled:opacity-40 cursor-pointer"
                      >
                        Select All Filtered
                      </button>
                      <span className="text-ink-muted">·</span>
                      <button
                        type="button"
                        onClick={deselectFiltered}
                        disabled={filteredQuestions.length === 0}
                        className="text-ink-muted hover:text-ink hover:underline disabled:opacity-40 cursor-pointer"
                      >
                        Deselect Filtered
                      </button>
                      {selectedQuestionIds.length > 0 && (
                        <>
                          <span className="text-ink-muted">·</span>
                          {!confirmClear ? (
                            <button
                              type="button"
                              onClick={() => setConfirmClear(true)}
                              className="text-ink-muted hover:text-redpen hover:underline cursor-pointer"
                            >
                              Clear All
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  onSelectedQuestionIdsChange([]);
                                  setConfirmClear(false);
                                }}
                                className="text-redpen font-bold hover:underline cursor-pointer"
                              >
                                Confirm Clear ({selectedQuestionIds.length})?
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmClear(false)}
                                className="text-ink-muted hover:underline cursor-pointer"
                              >
                                Keep
                              </button>
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Question List */}
                <div className="flex-1 min-h-[14rem] max-h-72 overflow-y-auto space-y-2 p-2 rounded-xl border border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-warm dark:bg-chalkboard-surface">
                  {filteredQuestions.length === 0 ? (
                    <div className="py-10 text-center space-y-2">
                      <p className="text-xs font-medium text-ink-muted dark:text-chalkboard-muted">
                        No questions match your filter.
                      </p>
                      {hasActiveFilters && (
                        <Button type="button" variant="secondary" size="sm" onClick={resetFilters}>
                          Reset Filters
                        </Button>
                      )}
                    </div>
                  ) : groupMode === 'flat' ? (
                    filteredQuestions.map(renderQuestionRow)
                  ) : (
                    groupedTopics.map((group) => {
                      const isCollapsed = Boolean(collapsedTopics[group.key]);
                      const selectedInGroup = group.items.filter((q) => selectedSet.has(q.id)).length;
                      const allInGroupSelected = selectedInGroup === group.items.length;

                      return (
                        <div
                          key={group.key}
                          className="rounded-xl border border-ink/15 dark:border-chalkboard-borderSubtle bg-paper-card/40 dark:bg-chalkboard-card/40 overflow-hidden"
                        >
                          <div className="flex items-center justify-between gap-2 px-3 py-2 bg-paper-card dark:bg-chalkboard-card border-b border-ink/10 dark:border-chalkboard-borderSubtle">
                            <button
                              type="button"
                              aria-expanded={!isCollapsed}
                              onClick={() =>
                                setCollapsedTopics((prev) => ({ ...prev, [group.key]: !prev[group.key] }))
                              }
                              className="flex items-center gap-1.5 text-xs font-bold text-ink dark:text-chalkboard-chalk cursor-pointer focus:outline-none focus:underline"
                            >
                              {isCollapsed ? (
                                <ChevronRight className="w-4 h-4 text-ink-muted" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-ink-muted" />
                              )}
                              <span>{group.label}</span>
                              <span className="text-[10px] font-mono font-normal text-ink-muted">
                                ({selectedInGroup}/{group.items.length})
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => toggleTopicGroup(group.items)}
                              className="text-[11px] font-mono font-semibold text-redpen hover:underline cursor-pointer"
                            >
                              {allInGroupSelected
                                ? `Deselect Topic (${group.items.length})`
                                : `Select Topic (${group.items.length})`}
                            </button>
                          </div>

                          {!isCollapsed && (
                            <div className="p-2 space-y-1.5">{group.items.map(renderQuestionRow)}</div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            ) : (
              /* Selected Questions Review Tab */
              <div className="flex-1 min-h-[14rem] max-h-80 overflow-y-auto space-y-2 p-2 rounded-xl border border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-warm dark:bg-chalkboard-surface">
                {selectedQuestions.length === 0 ? (
                  <div className="py-10 text-center space-y-2">
                    <p className="text-xs text-ink-muted dark:text-chalkboard-muted">
                      No questions selected yet. Switch to All Questions to pick from your bank.
                    </p>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setActiveViewTab('all')}
                    >
                      Browse All Questions
                    </Button>
                  </div>
                ) : (
                  selectedQuestions.map((q, idx) => {
                    const cType = getCanonicalType(q);
                    const typeMeta = TYPE_META[cType] || TYPE_META.MULTIPLE_CHOICE;
                    const pts = formatPoints(getQuestionPoints(q));
                    return (
                      <div
                        key={q.id}
                        className="p-3 rounded-xl border border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-card dark:bg-chalkboard-card flex items-start gap-2.5 text-xs"
                      >
                        <span className="font-mono font-bold text-ink-muted w-5 text-center pt-0.5">
                          {idx + 1}.
                        </span>
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-highlighter-yellow/35 text-ink dark:text-chalkboard-chalk">
                              {q.topicName || 'General'}
                            </span>
                            <span
                              className={`text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border ${typeMeta.badgeClass}`}
                            >
                              {typeMeta.short}
                            </span>
                            <span className="text-[10px] font-mono text-ink-muted">
                              v{q.version} • {q.difficulty} • {pts} {pts === 1 ? 'pt' : 'pts'}
                            </span>
                          </div>
                          <p className="text-ink dark:text-chalkboard-chalk font-medium line-clamp-2">
                            {q.text}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => moveSelected(idx, -1)}
                            disabled={idx === 0}
                            aria-label={`Move question ${idx + 1} up`}
                            className="p-1 rounded hover:bg-paper-warm disabled:opacity-30 text-ink-muted hover:text-ink cursor-pointer"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveSelected(idx, 1)}
                            disabled={idx === selectedQuestions.length - 1}
                            aria-label={`Move question ${idx + 1} down`}
                            className="p-1 rounded hover:bg-paper-warm disabled:opacity-30 text-ink-muted hover:text-ink cursor-pointer"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleQuestion(q.id)}
                            aria-label={`Remove question ${idx + 1}`}
                            className="p-1 rounded hover:bg-redpen-soft text-ink-muted hover:text-redpen cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-ink/10 dark:border-chalkboard-borderSubtle flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
            <div className="text-xs text-ink-muted dark:text-chalkboard-muted">
              {selectedQuestionIds.length === 0 && (
                <span className="text-redpen font-medium">
                  Select at least 1 question to create a quiz
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 ml-auto">
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={loading || selectedQuestionIds.length === 0}
                title={
                  selectedQuestionIds.length === 0
                    ? 'Select at least 1 question to create a quiz'
                    : undefined
                }
                className="shadow-notebook"
              >
                {loading ? 'Saving…' : 'Save Quiz'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
