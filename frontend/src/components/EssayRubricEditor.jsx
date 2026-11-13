import React from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';

/**
 * Editor for ESSAY question rubric criteria (1 to 8 criteria).
 * Question total points equal the sum of criterion maxPoints.
 */
export default function EssayRubricEditor({ criteria, onChange }) {
  const rows =
    criteria && criteria.length > 0
      ? criteria
      : [{ name: '', description: '', maxPoints: 1 }];

  const totalPoints = rows.reduce((sum, r) => sum + (parseInt(r.maxPoints, 10) || 0), 0);

  const handleFieldChange = (index, field, value) => {
    const next = rows.map((row, i) =>
      i === index ? { ...row, [field]: value } : row
    );
    onChange(next);
  };

  const handleAddRow = () => {
    if (rows.length >= 8) return;
    onChange([...rows, { name: '', description: '', maxPoints: 1 }]);
  };

  const handleRemoveRow = (index) => {
    if (rows.length <= 1) return;
    onChange(rows.filter((_, i) => i !== index));
  };

  const handleMove = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= rows.length) return;
    const next = [...rows];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <label className="text-xs font-mono font-bold uppercase tracking-wider text-ink dark:text-chalkboard-chalk block">
            Grading Rubric Criteria (1–8) <span className="text-redpen">*</span>
          </label>
          <span className="text-[11px] text-ink-muted dark:text-chalkboard-muted">
            Total essay points are automatically calculated from the sum of criteria points.
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 rounded-lg bg-highlighter-yellow/40 border border-ink/20 text-xs font-mono font-bold text-ink">
            Total: {totalPoints} pts
          </span>
          {rows.length < 8 && (
            <button
              type="button"
              onClick={handleAddRow}
              className="text-xs font-mono text-redpen hover:underline font-bold flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Criterion</span>
            </button>
          )}
        </div>
      </div>

      <div className="space-y-2.5">
        {rows.map((row, index) => (
          <div
            key={index}
            className="p-3 rounded-xl border border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-warm/50 dark:bg-chalkboard-surface/50 space-y-2"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono font-bold text-ink-muted dark:text-chalkboard-muted w-5">
                #{index + 1}
              </span>
              <input
                type="text"
                required
                maxLength={100}
                value={row.name}
                onChange={(e) => handleFieldChange(index, 'name', e.target.value)}
                placeholder="Criterion name (e.g., Technical Accuracy)"
                className="flex-1 min-w-[180px] px-3 py-1.5 rounded-xl border border-ink/30 dark:border-chalkboard-border bg-paper-card dark:bg-chalkboard-card text-ink dark:text-chalkboard-chalk text-xs focus:outline-none focus:border-redpen"
              />
              <div className="flex items-center gap-1.5">
                <label className="text-[11px] font-mono text-ink-muted dark:text-chalkboard-muted">
                  Max pts:
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={100}
                  step={1}
                  value={row.maxPoints}
                  onChange={(e) =>
                    handleFieldChange(index, 'maxPoints', Math.max(1, parseInt(e.target.value, 10) || 1))
                  }
                  className="w-16 px-2 py-1.5 rounded-xl border border-ink/30 dark:border-chalkboard-border bg-paper-card dark:bg-chalkboard-card text-ink dark:text-chalkboard-chalk text-xs font-mono text-center focus:outline-none focus:border-redpen"
                />
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => handleMove(index, -1)}
                  className="p-1 text-ink-muted hover:text-ink disabled:opacity-30 cursor-pointer"
                  title="Move up"
                  aria-label={`Move criterion ${index + 1} up`}
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={index === rows.length - 1}
                  onClick={() => handleMove(index, 1)}
                  className="p-1 text-ink-muted hover:text-ink disabled:opacity-30 cursor-pointer"
                  title="Move down"
                  aria-label={`Move criterion ${index + 1} down`}
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                {rows.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveRow(index)}
                    className="p-1 text-ink-muted hover:text-redpen cursor-pointer"
                    title="Remove criterion"
                    aria-label={`Remove criterion ${index + 1}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <input
              type="text"
              maxLength={500}
              value={row.description || ''}
              onChange={(e) => handleFieldChange(index, 'description', e.target.value)}
              placeholder="Optional description of what earns full points (max 500 chars)"
              className="w-full px-3 py-1.5 rounded-xl border border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-card dark:bg-chalkboard-card text-ink dark:text-chalkboard-chalk text-xs focus:outline-none focus:border-redpen"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
