import React from 'react';
import { footerContent, siteMetadata } from '../data/content';
import { LearningPalLogo } from './Doodles';

export default function Footer() {
  return (
    <footer
      aria-label="Notebook Back Cover Footer"
      className="border-t-4 border-ink dark:border-white/25 bg-paper-warm dark:bg-chalkboard-surface text-ink dark:text-chalkboard-chalk"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left 4 Cols: Composition Notebook Back Cover Stamp */}
          <div className="lg:col-span-4 space-y-4">
            <a href="#top" className="inline-flex items-center gap-2.5">
              <LearningPalLogo className="w-9 h-9" />
              <span className="font-bold text-xl tracking-tight">
                Learning<span className="font-hand text-2xl text-redpen dark:text-red-400">Pal</span>
              </span>
            </a>

            <p className="text-sm text-ink-muted dark:text-chalkboard-muted leading-relaxed">
              {siteMetadata.tagline} A data-driven learning support notebook that connects everyday assessments to topic-level progress and targeted study activities.
            </p>

            <div className="p-3 rounded-xl border-2 border-ink/25 dark:border-white/20 bg-paper-card dark:bg-chalkboard-card font-mono text-[11px] text-ink-muted dark:text-chalkboard-muted">
              {footerContent.backCoverNote}
            </div>
          </div>

          {/* Middle 4 Cols: Navigation Links */}
          <div className="lg:col-span-4 grid grid-cols-2 gap-6">
            {footerContent.links.map((group) => (
              <div key={group.group} className="space-y-3">
                <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-redpen dark:text-red-400">
                  {group.group}
                </h3>
                <ul className="space-y-2 text-sm">
                  {group.items.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-ink-muted dark:text-chalkboard-muted hover:text-ink dark:hover:text-white font-medium underline-offset-4 hover:underline"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Right 4 Cols: Classic Composition-Notebook Inside Back Cover Reference Table */}
          <div className="lg:col-span-4 rounded-xl border-2 border-ink dark:border-white/25 bg-paper-card dark:bg-chalkboard-card p-4 shadow-sm">
            <div className="text-center border-b-2 border-ink dark:border-white/20 pb-2 mb-2.5">
              <span className="font-mono text-xs font-extrabold uppercase tracking-wider text-ink dark:text-chalkboard-chalk">
                Standard Mastery Conversion Table
              </span>
            </div>
            <table className="w-full text-left font-mono text-[11px]">
              <thead>
                <tr className="border-b border-ink/20 dark:border-white/15 text-ink-muted dark:text-chalkboard-muted">
                  <th className="py-1 pr-2">Zone</th>
                  <th className="py-1 pr-2">Score</th>
                  <th className="py-1">Next Step</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10 dark:divide-white/10">
                {footerContent.referenceTable.map((row) => (
                  <tr key={row.metric}>
                    <td className="py-1.5 pr-2 font-bold text-ink dark:text-chalkboard-chalk">
                      {row.metric}
                    </td>
                    <td className="py-1.5 pr-2 text-redpen dark:text-red-400">{row.formula}</td>
                    <td className="py-1.5 text-ink-muted dark:text-chalkboard-muted">{row.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-ink/15 dark:border-white/15 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-ink-muted dark:text-chalkboard-muted">
          <p>{footerContent.copyright}</p>
          <p>Accessible • Keyboard-Navigable • Respects Reduced Motion</p>
        </div>
      </div>
    </footer>
  );
}

