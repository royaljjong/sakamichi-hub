'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import type { Group } from '@/lib/schema';

interface GroupComparePickerProps {
  groups: Group[];
  selectedA: string;
  selectedB: string;
  selectedC: string;
  locale: string;
}

export function GroupComparePicker({
  groups,
  selectedA,
  selectedB,
  selectedC,
  locale,
}: GroupComparePickerProps) {
  const t = useTranslations('compare');
  const router = useRouter();
  const pathname = usePathname();

  const lang = (['ja', 'ko', 'en'].includes(locale) ? locale : 'ja') as 'ja' | 'ko' | 'en';

  const sakamichi = groups.filter((g) => (g.franchise ?? 'sakamichi') === 'sakamichi');
  const akb48g = groups.filter((g) => g.franchise === 'akb48g');

  function handleChange(slot: 'a' | 'b' | 'c', value: string) {
    const a = slot === 'a' ? value : selectedA;
    const b = slot === 'b' ? value : selectedB;
    const c = slot === 'c' ? value : selectedC;

    const params = new URLSearchParams();
    if (a) params.set('a', a);
    if (b) params.set('b', b);
    if (c) params.set('c', c);
    router.replace(`${pathname}${params.toString() ? `?${params.toString()}` : ''}`, {
      scroll: false,
    });
  }

  function renderOptions(includeEmpty: boolean) {
    return (
      <>
        {includeEmpty && (
          <option value="">{t('selectNone')}</option>
        )}
        <optgroup label={lang === 'ja' ? '坂道シリーズ' : lang === 'ko' ? '사카미치 시리즈' : 'Sakamichi Series'}>
          {sakamichi.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name[lang]}
            </option>
          ))}
        </optgroup>
        <optgroup label={lang === 'ja' ? 'AKB48グループ' : lang === 'ko' ? 'AKB48 그룹' : 'AKB48 Group'}>
          {akb48g.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name[lang]}
            </option>
          ))}
        </optgroup>
      </>
    );
  }

  const selectClass =
    'w-full rounded-2xl border border-[color-mix(in_oklab,var(--g-ink)_12%,transparent)] bg-[var(--white-veil)] px-4 py-2.5 text-sm font-medium text-[var(--ink)] shadow-xs backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[var(--g-brand)] transition cursor-pointer';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
      <div>
        <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--ink-soft)] mb-1.5 pl-1">
          A
        </label>
        <select
          className={selectClass}
          value={selectedA}
          onChange={(e) => handleChange('a', e.target.value)}
          aria-label={`${t('selectGroup')} A`}
        >
          {renderOptions(false)}
        </select>
      </div>
      <div>
        <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--ink-soft)] mb-1.5 pl-1">
          B
        </label>
        <select
          className={selectClass}
          value={selectedB}
          onChange={(e) => handleChange('b', e.target.value)}
          aria-label={`${t('selectGroup')} B`}
        >
          {renderOptions(true)}
        </select>
      </div>
      <div>
        <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--ink-soft)] mb-1.5 pl-1">
          C
        </label>
        <select
          className={selectClass}
          value={selectedC}
          onChange={(e) => handleChange('c', e.target.value)}
          aria-label={`${t('selectGroup')} C`}
        >
          {renderOptions(true)}
        </select>
      </div>
    </div>
  );
}
