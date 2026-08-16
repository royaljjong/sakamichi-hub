'use client';

import React from 'react';
import { usePathname, useRouter } from '@/i18n/routing';
import { routing, type Locale } from '@/i18n/routing';
import { useLocale } from 'next-intl';

export function LocaleSwitcher() {
  const currentLocale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const handleSwitch = (newLocale: Locale) => {
    router.replace(pathname, { locale: newLocale });
  };

  const labels: Record<Locale, string> = {
    ja: '日本語',
    ko: '한국어',
    en: 'EN',
  };

  return (
    <div
      role="group"
      aria-label="Language Selector"
      className="inline-flex p-0.5 rounded-full bg-[var(--paper-deep)] border border-[color-mix(in_oklab,var(--g-ink)_12%,transparent)]"
    >
      {routing.locales.map((loc) => {
        const isActive = currentLocale === loc;
        return (
          <button
            key={loc}
            onClick={() => handleSwitch(loc)}
            className={`px-2.5 py-1 text-xs font-semibold rounded-full transition-all duration-200 focus-visible:outline-2 ${
              isActive
                ? 'bg-[var(--white-veil)] text-[var(--g-ink)] shadow-xs'
                : 'text-[var(--ink-soft)] hover:text-[var(--ink)]'
            }`}
            aria-current={isActive ? 'true' : undefined}
          >
            {labels[loc]}
          </button>
        );
      })}
    </div>
  );
}
