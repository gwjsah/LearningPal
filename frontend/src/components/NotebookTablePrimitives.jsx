import React, { useRef } from 'react';
import { Search, X, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

/**
 * Accessible Notebook Tab Navigation (WAI-ARIA compliant tablist with keyboard arrow navigation).
 */
export function NotebookTabs({
  tabs,
  activeTab,
  onTabChange,
  ariaLabel = 'Navigation tabs',
  className = '',
}) {
  const tabRefs = useRef({});

  const handleKeyDown = (e, index) => {
    const tabCount = tabs.length;
    let nextIndex = null;

    if (e.key === 'ArrowRight') {
      nextIndex = (index + 1) % tabCount;
    } else if (e.key === 'ArrowLeft') {
      nextIndex = (index - 1 + tabCount) % tabCount;
    } else if (e.key === 'Home') {
      nextIndex = 0;
    } else if (e.key === 'End') {
      nextIndex = tabCount - 1;
    }

    if (nextIndex !== null) {
      e.preventDefault();
      const nextTab = tabs[nextIndex];
      onTabChange(nextTab.id);
      tabRefs.current[nextTab.id]?.focus();
    }
  };

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-paper-warm dark:bg-chalkboard-surface border-2 border-ink/20 dark:border-chalkboard-borderSubtle ${className}`}
    >
      {tabs.map((tab, idx) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            ref={(el) => (tabRefs.current[tab.id] = el)}
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={isActive}
            aria-controls={`panel-${tab.id}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onTabChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-sans transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-redpen ${
              isActive
                ? 'bg-ink text-white dark:bg-highlighter-mint dark:text-ink font-bold shadow-notebook-sm border-2 border-ink dark:border-chalkboard-border'
                : 'text-ink-muted dark:text-chalkboard-muted hover:text-ink dark:hover:text-chalkboard-chalk hover:bg-paper-card dark:hover:bg-chalkboard-card border-2 border-transparent font-medium'
            }`}
          >
            {Icon && (
              <Icon
                className={`w-4 h-4 shrink-0 ${isActive ? 'text-white dark:text-ink' : ''}`}
                aria-hidden="true"
              />
            )}
            <span>{tab.label}</span>
            {tab.badge != null && (
              <span
                className={`ml-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-bold leading-none ${
                  isActive
                    ? 'bg-white/20 text-white dark:bg-ink/15 dark:text-ink'
                    : 'bg-ink/10 dark:bg-chalkboard-highlight text-ink-muted dark:text-chalkboard-muted'
                }`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Accessible Notebook Tab Panel.
 */
export function NotebookTabPanel({
  id,
  activeTab,
  children,
  className = '',
}) {
  const isActive = activeTab === id;
  if (!isActive) return null;

  return (
    <div
      role="tabpanel"
      id={`panel-${id}`}
      aria-labelledby={`tab-${id}`}
      tabIndex={0}
      className={`focus:outline-none ${className}`}
    >
      {children}
    </div>
  );
}

/**
 * Accessible Search Input with clear button and notebook styling.
 */
export function SearchInput({
  value,
  onChange,
  onClear,
  placeholder = 'Search…',
  ariaLabel = 'Search',
  id,
  className = '',
}) {
  const inputId = id || 'notebook-search-input';

  return (
    <div className={`relative flex items-center ${className}`}>
      <Search
        className="w-4 h-4 absolute left-3.5 text-ink-muted dark:text-chalkboard-muted pointer-events-none"
        aria-hidden="true"
      />
      <input
        id={inputId}
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className="w-full pl-10 pr-9 py-2 rounded-xl text-xs sm:text-sm font-sans bg-paper-card dark:bg-chalkboard-card border-2 border-ink/20 dark:border-chalkboard-borderSubtle text-ink dark:text-chalkboard-chalk placeholder:text-ink-muted/60 dark:placeholder:text-chalkboard-muted/60 focus:outline-none focus:border-ink dark:focus:border-highlighter-mint shadow-xs transition-colors"
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            if (onClear) {
              onClear();
            } else {
              onChange({ target: { value: '' } });
            }
          }}
          aria-label="Clear search text"
          className="absolute right-2.5 p-1 text-ink-muted hover:text-ink dark:text-chalkboard-muted dark:hover:text-chalkboard-chalk rounded-md hover:bg-paper-warm dark:hover:bg-chalkboard-surface cursor-pointer"
        >
          <X className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

/**
 * Accessible Pagination Controls with page size selector and range summary.
 */
export function PaginationControls({
  currentPage,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50],
  className = '',
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(totalItems, currentPage * pageSize);

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 px-2 py-3 text-xs font-mono text-ink-muted dark:text-chalkboard-muted ${className}`}
      aria-label="Table pagination"
    >
      <div className="flex items-center gap-3">
        <span>
          Showing <strong className="text-ink dark:text-chalkboard-chalk">{startItem}</strong>–
          <strong className="text-ink dark:text-chalkboard-chalk">{endItem}</strong> of{' '}
          <strong className="text-ink dark:text-chalkboard-chalk">{totalItems}</strong> entries
        </span>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 ml-2">
            <label htmlFor="pagination-page-size" className="text-[11px] uppercase tracking-wider">
              Rows:
            </label>
            <select
              id="pagination-page-size"
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="px-2 py-1 rounded-lg border border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-card dark:bg-chalkboard-card text-ink dark:text-chalkboard-chalk text-xs font-mono focus:outline-none focus:border-redpen"
              aria-label="Rows per page"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-[11px]">
          Page {currentPage} of {totalPages}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            aria-label="Go to previous page"
            className="p-1.5 rounded-lg border border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-card dark:bg-chalkboard-card text-ink dark:text-chalkboard-chalk disabled:opacity-40 disabled:cursor-not-allowed hover:bg-paper-warm dark:hover:bg-chalkboard-surface transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            aria-label="Go to next page"
            className="p-1.5 rounded-lg border border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-card dark:bg-chalkboard-card text-ink dark:text-chalkboard-chalk disabled:opacity-40 disabled:cursor-not-allowed hover:bg-paper-warm dark:hover:bg-chalkboard-surface transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Responsive Notebook Table with overflow wrapper and styled headers.
 */
export function NotebookTable({ children, className = '', containerClassName = '' }) {
  return (
    <div
      className={`overflow-x-auto rounded-2xl border-2 border-ink dark:border-chalkboard-border bg-paper-card dark:bg-chalkboard-card shadow-notebook-sm ${containerClassName}`}
    >
      <table className={`w-full text-left text-xs font-mono ${className}`}>{children}</table>
    </div>
  );
}

export function NotebookTableHead({ children, className = '' }) {
  return (
    <thead
      className={`bg-paper-warm dark:bg-chalkboard-surface border-b-2 border-ink dark:border-chalkboard-borderSubtle text-ink-muted dark:text-chalkboard-muted ${className}`}
    >
      {children}
    </thead>
  );
}

export function NotebookTableRow({ children, className = '', hover = true }) {
  return (
    <tr
      className={`transition-colors ${
        hover ? 'hover:bg-paper-warm/40 dark:hover:bg-chalkboard-surface/40' : ''
      } ${className}`}
    >
      {children}
    </tr>
  );
}

export function NotebookTableHeaderCell({
  children,
  sortable = false,
  sorted = null, // 'asc' | 'desc' | null
  onSort,
  className = '',
  align = 'left',
}) {
  const alignClass = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';

  if (!sortable) {
    return (
      <th
        scope="col"
        className={`px-4 py-3 font-bold uppercase tracking-wider text-[11px] ${alignClass} ${className}`}
      >
        {children}
      </th>
    );
  }

  return (
    <th
      scope="col"
      aria-sort={sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : 'none'}
      className={`px-4 py-3 font-bold uppercase tracking-wider text-[11px] ${alignClass} ${className}`}
    >
      <button
        type="button"
        onClick={onSort}
        className="inline-flex items-center gap-1.5 hover:text-ink dark:hover:text-chalkboard-chalk transition-colors cursor-pointer group focus:outline-none focus-visible:underline"
      >
        <span>{children}</span>
        {sorted === 'asc' ? (
          <ArrowUp className="w-3.5 h-3.5 text-redpen dark:text-highlighter-mint" aria-hidden="true" />
        ) : sorted === 'desc' ? (
          <ArrowDown className="w-3.5 h-3.5 text-redpen dark:text-highlighter-mint" aria-hidden="true" />
        ) : (
          <ArrowUpDown
            className="w-3.5 h-3.5 opacity-40 group-hover:opacity-80 transition-opacity"
            aria-hidden="true"
          />
        )}
      </button>
    </th>
  );
}

export function NotebookTableCell({ children, className = '', align = 'left' }) {
  const alignClass = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';

  return <td className={`px-4 py-3 ${alignClass} ${className}`}>{children}</td>;
}

/**
 * Accessible Notebook Empty State.
 */
export function EmptyState({ icon: Icon, title, message, action, className = '' }) {
  return (
    <div
      className={`p-8 sm:p-12 text-center space-y-3 rounded-2xl border-2 border-dashed border-ink/25 dark:border-chalkboard-borderSubtle bg-paper-card dark:bg-chalkboard-card ${className}`}
    >
      {Icon && (
        <div className="w-12 h-12 rounded-2xl bg-paper-warm dark:bg-chalkboard-surface border border-ink/20 dark:border-chalkboard-borderSubtle flex items-center justify-center mx-auto text-ink-muted dark:text-chalkboard-muted">
          <Icon className="w-6 h-6" aria-hidden="true" />
        </div>
      )}
      <h4 className="text-base font-bold text-ink dark:text-chalkboard-chalk font-sans">{title}</h4>
      {message && (
        <p className="text-xs text-ink-muted dark:text-chalkboard-muted max-w-md mx-auto leading-relaxed">
          {message}
        </p>
      )}
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}
