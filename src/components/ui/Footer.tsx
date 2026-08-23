import React from 'react';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { MotionToggle } from './MotionToggle';

export function Footer() {
  const t = useTranslations('common');
  const tNav = useTranslations('nav');
  const tCredits = useTranslations('credits');
  const tFooter = useTranslations('footer');

  return (
    <footer className="relative z-10 mt-20 pt-12 pb-16 border-t border-[color-mix(in_oklab,var(--g-ink)_10%,transparent)] max-w-6xl mx-auto px-4 sm:px-6">
      <div className="flex flex-col gap-4 text-xs text-[var(--ink-soft)]">
        {/* Top row: main nav links */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/about"
              className="hover:text-[var(--ink)] underline underline-offset-4 font-medium transition"
            >
              {tNav('about')}
            </Link>
            <span>•</span>
            <Link
              href="/search"
              className="hover:text-[var(--ink)] underline underline-offset-4 font-medium transition"
            >
              {tNav('search')}
            </Link>
            <span>•</span>
            <Link
              href="/credits"
              className="hover:text-[var(--ink)] underline underline-offset-4 font-medium transition"
            >
              {tCredits('creditsLink')}
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <MotionToggle />
            <span>•</span>
            <span className="font-[family-name:var(--font-zen-kaku)]">
              © {new Date().getFullYear()} {t('siteName')} (Unofficial)
            </span>
          </div>
        </div>

        {/* Bottom row: legal links */}
        <div className="flex items-center gap-3 text-[var(--ink-faint)]">
          <Link
            href="/privacy-policy"
            className="hover:text-[var(--ink-soft)] transition"
          >
            {tFooter('privacyPolicy')}
          </Link>
          <span>·</span>
          <Link
            href="/terms"
            className="hover:text-[var(--ink-soft)] transition"
          >
            {tFooter('terms')}
          </Link>
          <span>·</span>
          <Link
            href="/contact"
            className="hover:text-[var(--ink-soft)] transition"
          >
            {tFooter('contact')}
          </Link>
        </div>
      </div>
    </footer>
  );
}
