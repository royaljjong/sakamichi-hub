import React from 'react';
import { useTranslations } from 'next-intl';
import { renderableLinks, type MemberLink } from '@/lib/schema';
import { LinkTile } from './LinkTile';

interface LinkGridProps {
  links: MemberLink[];
  locale: string;
}

export function LinkGrid({ links, locale }: LinkGridProps) {
  const t = useTranslations('member');
  const validLinks = renderableLinks(links);

  if (validLinks.length === 0) {
    return (
      <div className="p-8 text-center rounded-2xl bg-[var(--white-veil)] border border-[color-mix(in_oklab,var(--g-ink)_8%,transparent)] text-[var(--ink-soft)] text-sm">
        {t('noLinks')}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
      {validLinks.map((link, idx) => (
        <LinkTile key={`${link.type}-${link.url}-${idx}`} link={link} locale={locale} />
      ))}
    </div>
  );
}
