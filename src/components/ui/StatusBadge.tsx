import React from 'react';
import { useTranslations } from 'next-intl';
import type { MemberStatus } from '@/lib/schema';

interface StatusBadgeProps {
  status: MemberStatus;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const t = useTranslations('member');

  let label = t('statusActive');
  let styleClasses = 'bg-[color-mix(in_oklab,var(--g-brand)_15%,white)] text-[var(--g-ink)] border-[color-mix(in_oklab,var(--g-brand)_30%,transparent)]';

  if (status === 'graduated') {
    label = t('statusGraduated');
    styleClasses = 'bg-[var(--paper-deep)] text-[var(--ink-soft)] border-[color-mix(in_oklab,var(--ink)_15%,transparent)]';
  } else if (status === 'graduating') {
    label = t('statusGraduating');
    styleClasses = 'bg-amber-50 text-amber-800 border-amber-200';
  } else if (status === 'withdrawn') {
    label = t('statusWithdrawn');
    styleClasses = 'bg-stone-100 text-stone-600 border-stone-200';
  } else if (status === 'transferred') {
    label = t('statusTransferred');
    styleClasses = 'bg-sky-50 text-sky-800 border-sky-200';
  }

  const sizeClasses =
    size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${sizeClasses} ${styleClasses}`}
    >
      {label}
    </span>
  );
}
