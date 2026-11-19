import React from 'react';
import { Check } from 'lucide-react';
import PalAvatar from './PalAvatar';
import { PAL_COLORS, PAL_PRESET_NAMES, PAL_STYLES } from '../utils/palEngine';

/**
 * Shared Pal name, style, and highlighter color picker used in Signup and Settings.
 */
export function PalPickerFields({ palName, palStyle, palColor, palAccessory = 'none', onChange, disabled = false }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-3.5 rounded-xl bg-paper-warm/70 dark:bg-chalkboard-surface border-2 border-ink/20 dark:border-chalkboard-border">
        <div className="self-center sm:self-auto shrink-0">
          <PalAvatar
            style={palStyle}
            color={palColor}
            mood="thriving"
            accessory={palAccessory}
            size={72}
            label={`${palName || 'Pip'} preview`}
          />
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <label
              htmlFor="pal-name-input"
              className="block text-xs font-mono font-bold uppercase tracking-wider text-ink-muted dark:text-chalkboard-muted"
            >
              Pal Name
            </label>
            <span className="text-[11px] font-mono text-ink-muted dark:text-chalkboard-muted tabular-nums">
              {(palName || '').length}/30
            </span>
          </div>
          <input
            id="pal-name-input"
            type="text"
            maxLength={30}
            value={palName}
            disabled={disabled}
            onChange={(e) => onChange({ palName: e.target.value, palStyle, palColor })}
            placeholder="Pip"
            className="w-full px-3 py-2 rounded-lg border-2 border-ink/30 dark:border-chalkboard-border bg-paper-card dark:bg-chalkboard-card text-sm font-semibold text-ink dark:text-chalkboard-chalk placeholder:text-ink-light dark:placeholder:text-chalkboard-muted/60 focus:outline-none focus:border-ink dark:focus:border-chalkboard-chalk focus-visible:ring-2 focus-visible:ring-redpen"
          />
          <div className="flex flex-wrap gap-1.5">
            {PAL_PRESET_NAMES.map((preset) => (
              <button
                key={preset}
                type="button"
                disabled={disabled}
                onClick={() => onChange({ palName: preset, palStyle, palColor })}
                className={`min-h-[30px] px-2.5 py-0.5 rounded-md text-xs font-mono border transition cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-redpen ${
                  palName === preset
                    ? 'bg-highlighter-yellow text-ink border-ink font-bold'
                    : 'bg-paper-card dark:bg-chalkboard-card text-ink-muted dark:text-chalkboard-muted border-ink/20 dark:border-chalkboard-border hover:border-ink'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Style selector */}
      <div className="space-y-1.5">
        <span className="block text-xs font-mono font-bold uppercase tracking-wider text-ink-muted dark:text-chalkboard-muted">
          Companion Style
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" role="radiogroup" aria-label="Companion style">
          {PAL_STYLES.map((item) => {
            const active = palStyle === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="radio"
                aria-checked={active}
                disabled={disabled}
                onClick={() => onChange({ palName, palStyle: item.id, palColor })}
                className={`flex flex-col items-center p-2.5 rounded-xl border-2 text-center transition cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-redpen ${
                  active
                    ? 'border-ink dark:border-chalkboard-chalk bg-paper-card dark:bg-chalkboard-card shadow-notebook-sm'
                    : 'border-ink/20 dark:border-chalkboard-border bg-paper-warm/40 dark:bg-chalkboard-surface/50 hover:border-ink/50'
                }`}
              >
                <PalAvatar style={item.id} color={palColor} mood="fresh" size={48} animate={false} label={item.label} />
                <span className="text-xs font-bold text-ink dark:text-chalkboard-chalk mt-1 leading-tight">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Highlighter color selector */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-mono font-bold uppercase tracking-wider text-ink-muted dark:text-chalkboard-muted">
          Highlighter Color
        </span>
        <div className="flex items-center gap-2" role="radiogroup" aria-label="Highlighter color">
          {PAL_COLORS.map((c) => {
            const active = palColor === c.id;
            return (
              <button
                key={c.id}
                type="button"
                role="radio"
                aria-checked={active}
                aria-label={c.label}
                title={c.label}
                disabled={disabled}
                onClick={() => onChange({ palName, palStyle, palColor: c.id })}
                className={`w-9 h-9 rounded-full border-2 flex items-center justify-center transition cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-redpen ${
                  active
                    ? 'border-ink dark:border-chalkboard-chalk scale-110 shadow-notebook-sm'
                    : 'border-ink/30 hover:scale-105'
                }`}
                style={{ backgroundColor: c.fill }}
              >
                {active && <Check className="w-3.5 h-3.5 text-ink" strokeWidth={3} aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
