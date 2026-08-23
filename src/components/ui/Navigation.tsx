import React from 'react';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { LocaleSwitcher } from './LocaleSwitcher';
import { SearchIcon } from './icons';

interface NavigationProps {
  showBrand?: boolean;
}

export function Navigation({ showBrand = true }: NavigationProps) {
  const t = useTranslations('common');
  const tNav = useTranslations('nav');
  const tA11y = useTranslations('a11y');

  return (
    <>
      {/* A11y Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 px-4 py-2 bg-[var(--g-brand)] text-white rounded-full shadow-lg text-sm font-semibold"
      >
        {tA11y('skipToContent')}
      </a>

      <nav className="relative z-20 flex items-center justify-between py-6 max-w-6xl mx-auto px-4 sm:px-6 w-full">
        {showBrand ? (
          <Link
            href="/"
            className="group flex items-center gap-2 text-lg sm:text-xl font-bold tracking-tight text-[var(--g-ink)] font-[family-name:var(--font-klee-one)] focus-visible:outline-2"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--g-brand)] group-hover:scale-125 transition-transform" />
            <span>{t('siteName')}</span>
          </Link>
        ) : (
          <div aria-hidden="true" />
        )}

        {/* Top-right Actions: Search & Locales */}
        <div className="flex items-center gap-2.5 ml-auto">
          <Link
            href="/compare"
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[var(--white-veil)] hover:bg-white text-xs font-medium text-[var(--ink)] border border-[color-mix(in_oklab,var(--g-ink)_12%,transparent)] shadow-xs transition hover:scale-105"
            aria-label={tNav('compare')}
          >
            <span>{tNav('compare')}</span>
          </Link>
          <Link
            href="/search"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[var(--white-veil)] hover:bg-white text-xs font-medium text-[var(--ink)] border border-[color-mix(in_oklab,var(--g-ink)_12%,transparent)] shadow-xs transition hover:scale-105"
            aria-label={tNav('search')}
          >
            <SearchIcon className="w-3.5 h-3.5 text-[var(--ink-soft)]" />
            <span>{tNav('search')}</span>
          </Link>

          <LocaleSwitcher />
        </div>
      </nav>
    </>
  );
}
