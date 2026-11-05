import React from 'react';
import { Link } from 'react-router-dom';
import { footerContent, siteMetadata } from '../data/content';
import { LearningPalLogo } from './Doodles';

export default function Footer() {
  return (
    <footer
      aria-label="Notebook Back Cover Footer"
      className="border-t-4 border-ink dark:border-chalkboard-border bg-paper-warm dark:bg-chalkboard-surface text-ink dark:text-chalkboard-chalk"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Brand Wordmark & Notebook Tagline */}
          <div className="md:col-span-6 space-y-3">
            <a href="#top" className="inline-flex items-center gap-2.5">
              <LearningPalLogo className="w-8 h-8" />
              <span className="font-bold text-xl tracking-tight">
                Learning<span className="font-hand text-2xl text-redpen dark:text-red-400">Pal</span>
              </span>
            </a>

            <p className="text-sm text-ink-muted dark:text-chalkboard-muted leading-relaxed max-w-md">
              {siteMetadata.tagline} Connecting everyday assessments to topic-level progress and targeted study activities.
            </p>

            <div className="inline-block p-2.5 rounded-lg border border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-card dark:bg-chalkboard-card font-mono text-[11px] text-ink-muted dark:text-chalkboard-muted">
              {footerContent.backCoverNote}
            </div>
          </div>

          {/* Clean Navigation & Auth Links */}
          <div className="md:col-span-6 grid grid-cols-2 gap-6 sm:justify-items-end">
            {footerContent.links.map((group) => (
              <div key={group.group} className="space-y-3">
                <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-redpen dark:text-red-400">
                  {group.group}
                </h3>
                <ul className="space-y-2 text-sm">
                  {group.items.map((link) => (
                    <li key={link.label}>
                      {link.href.startsWith('/') ? (
                        <Link
                          to={link.href}
                          className="text-ink-muted dark:text-chalkboard-muted hover:text-ink dark:hover:text-chalkboard-chalk font-medium underline-offset-4 hover:underline"
                        >
                          {link.label}
                        </Link>
                      ) : (
                        <a
                          href={link.href}
                          className="text-ink-muted dark:text-chalkboard-muted hover:text-ink dark:hover:text-chalkboard-chalk font-medium underline-offset-4 hover:underline"
                        >
                          {link.label}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-ink/15 dark:border-chalkboard-borderSubtle flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-ink-muted dark:text-chalkboard-muted">
          <p>{footerContent.copyright}</p>
          <p>Accessible • Lightweight • Responsive</p>
        </div>
      </div>
    </footer>
  );
}
