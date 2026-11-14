import React from 'react';
import { Plus, Trash2, Info } from 'lucide-react';

/**
 * Editor for ENUMERATION question accepted answers (1 to 10 variants, max 100 chars each).
 * Shows the rule-based normalization logic in plain language.
 */
export default function EnumerationQuestionEditor({ acceptedAnswers, onChange }) {
  const answers = acceptedAnswers && acceptedAnswers.length > 0 ? acceptedAnswers : [''];

  const handleVariantChange = (index, value) => {
    const next = answers.map((item, i) => (i === index ? value : item));
    onChange(next);
  };

  const handleAddVariant = () => {
    if (answers.length >= 10) return;
    onChange([...answers, '']);
  };

  const handleRemoveVariant = (index) => {
    if (answers.length <= 1) return;
    onChange(answers.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-mono font-bold uppercase tracking-wider text-ink dark:text-chalkboard-chalk">
          Accepted Answers (1–10 variants) <span className="text-redpen">*</span>
        </label>
        {answers.length < 10 && (
          <button
            type="button"
            onClick={handleAddVariant}
            className="text-xs font-mono text-redpen hover:underline font-bold flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Variant</span>
          </button>
        )}
      </div>

      <div className="p-3 rounded-xl border border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-warm/70 dark:bg-chalkboard-surface/70 text-xs text-ink-muted dark:text-chalkboard-muted flex items-start gap-2.5">
        <Info className="w-4 h-4 text-ink dark:text-chalkboard-chalk shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-ink dark:text-chalkboard-chalk">How enumeration is graded:</strong>{' '}
          Student answers are trimmed, extra spaces are collapsed, letter case and surrounding punctuation are ignored, and Unicode characters are normalized—then checked for an exact match against any variant below. Full points or zero (no fuzzy matching). List number words like <span className="font-mono">"one"</span> separately if you want both <span className="font-mono">"1"</span> and <span className="font-mono">"one"</span> accepted.
        </p>
      </div>

      <div className="space-y-2">
        {answers.map((variant, index) => (
          <div key={index} className="flex items-center gap-2">
            <span className="w-6 text-center text-xs font-mono font-bold text-ink-muted dark:text-chalkboard-muted">
              {index + 1}.
            </span>
            <input
              type="text"
              maxLength={100}
              required
              value={variant}
              onChange={(e) => handleVariantChange(index, e.target.value)}
              aria-label={`Accepted answer variant ${index + 1}`}
              placeholder={`Accepted variant ${index + 1} (e.g., stdio.h)`}
              className="flex-1 px-3 py-1.5 rounded-xl border border-ink/30 dark:border-chalkboard-border bg-paper-card dark:bg-chalkboard-card text-ink dark:text-chalkboard-chalk text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-redpen"
            />
            <span className="text-[10px] font-mono text-ink-muted dark:text-chalkboard-muted w-10 text-right">
              {variant.length}/100
            </span>
            {answers.length > 1 && (
              <button
                type="button"
                onClick={() => handleRemoveVariant(index)}
                className="p-1.5 text-ink-muted dark:text-chalkboard-muted hover:text-redpen dark:hover:text-red-400 rounded-lg cursor-pointer"
                title="Remove variant"
                aria-label={`Remove variant ${index + 1}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
