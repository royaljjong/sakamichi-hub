'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';

export type TabType = 'current' | 'graduated' | 'byGen';

interface GroupTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  groupId: string;
  locale: string;
}

export function GroupTabs({
  activeTab,
  onTabChange,
  groupId,
  locale,
}: GroupTabsProps) {
  const t = useTranslations('group');

  const tabs: { id: TabType; label: string }[] = [
    { id: 'current', label: t('tabCurrent') },
    { id: 'graduated', label: t('tabGraduated') },
    { id: 'byGen', label: t('tabByGen') },
  ];

  const archiveInfo =
    groupId === 'sakurazaka46'
      ? {
          name: locale === 'ko' ? '케야키자카46' : locale === 'en' ? 'Keyakizaka46' : '欅坂46',
          href: `/g/${groupId}/archive`,
        }
      : groupId === 'hinatazaka46'
      ? {
          name: locale === 'ko' ? '히라가나 케야키' : locale === 'en' ? 'Hiragana Keyaki' : 'けやき坂46',
          href: `/g/${groupId}/archive`,
        }
      : null;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      {/* ARIA tablist */}
      <div
        role="tablist"
        aria-label="Member Categories"
        className="inline-flex p-1 rounded-full bg-[var(--paper-deep)] border border-[color-mix(in_oklab,var(--g-ink)_10%,transparent)] self-start"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onTabChange(tab.id)}
              className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-full transition-all duration-200 focus-visible:outline-2 ${
                isActive
                  ? 'bg-[var(--white-veil)] text-[var(--g-ink)] shadow-xs font-bold'
                  : 'text-[var(--ink-soft)] hover:text-[var(--ink)]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Archive link for Sakurazaka / Hinatazaka */}
      {archiveInfo && (
        <Link
          href={archiveInfo.href}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[var(--ink-soft)] hover:text-[var(--g-brand)] transition self-end sm:self-auto px-3 py-1.5 rounded-full hover:bg-[var(--white-veil)]"
        >
          <span>{t('archiveLink', { name: archiveInfo.name })}</span>
          <span>→</span>
        </Link>
      )}
    </div>
  );
}
