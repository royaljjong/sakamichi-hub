'use client';

import React from 'react';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import type { Group, Member } from '@/lib/schema';
import { MemberAvatar } from '@/components/member/MemberAvatar';

interface GroupCardProps {
  group: Group;
  members: Member[];
  locale: string;
}

export function GroupCard({ group, members, locale }: GroupCardProps) {
  const t = useTranslations('group');
  const tCommon = useTranslations('common');

  const activeMembers = members.filter((m) => m.status === 'active');
  const gradMembers = members.filter((m) => m.status === 'graduated');

  // Last generation preview (up to 3 avatars)
  const previewMembers = activeMembers.slice(0, 3);
  const remainingCount = activeMembers.length - previewMembers.length;

  const latestGen = group.generations[group.generations.length - 1];
  const latestGenLabel =
    latestGen?.label[locale as 'ja' | 'ko' | 'en'] || latestGen?.label.ja || '';

  const groupName =
    group.name[locale as 'ja' | 'ko' | 'en'] || group.name.ja;

  const handleMouseEnter = () => {
    document.documentElement.setAttribute('data-group', group.id);
  };

  const handleMouseLeave = () => {
    document.documentElement.setAttribute('data-group', 'home');
  };

  return (
    <Link
      href={`/g/${group.id}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
      className="group relative flex flex-col justify-between p-6 sm:p-8 rounded-[28px] bg-[var(--white-veil)] hover:bg-white/95 border border-[color-mix(in_oklab,var(--g-ink)_12%,transparent)] hover:border-[var(--g-brand)] shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-lift)] backdrop-blur-md transition-all duration-420 ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:-translate-y-1.5 focus-visible:outline-2"
    >
      <div>
        {/* Color accent pill indicator */}
        <div
          className="w-8 h-1.5 rounded-full mb-6 transition-all duration-300 group-hover:w-16"
          style={{ backgroundColor: group.palette.brand }}
        />

        {/* Group Name & Subtitles */}
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--g-ink)] font-[family-name:var(--font-klee-one)]">
            {group.name.ja}
          </h2>
          {group.baseLocation && (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-[color-mix(in_oklab,var(--g-brand)_14%,transparent)] text-[var(--g-brand)] border border-[color-mix(in_oklab,var(--g-brand)_25%,transparent)]">
              {group.baseLocation[locale as 'ja' | 'ko' | 'en'] || group.baseLocation.ja}
            </span>
          )}
        </div>
        {locale !== 'ja' && (
          <p className="text-sm font-medium text-[var(--ink-soft)] mb-2">
            {groupName}
          </p>
        )}

        {/* Formed Date & Stats */}
        <div className="mt-4 space-y-1 text-xs text-[var(--ink-soft)] font-[family-name:var(--font-zen-kaku)]">
          <p>
            {group.debutedOn} —
          </p>
          <p className="font-medium text-[var(--ink)]">
            {latestGenLabel} • {t('currentCount', { count: activeMembers.length })} • {t('graduatedCount', { count: gradMembers.length })}
          </p>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-[color-mix(in_oklab,var(--g-ink)_10%,transparent)] flex items-center justify-between">
        {/* 3 Avatars Preview */}
        <div className="flex items-center -space-x-2.5">
          {previewMembers.map((m) => (
            <MemberAvatar
              key={m.id}
              glyph={m.avatar.glyph}
              hueShift={m.avatar.hueShift}
              imageUrl={m.imageUrl}
              name={m.name.ja.kanji}
              size={36}
              className="ring-2 ring-white/90"
            />
          ))}
          {remainingCount > 0 && (
            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-[var(--paper-deep)] text-[11px] font-semibold text-[var(--ink-soft)] ring-2 ring-white/90">
              +{remainingCount}
            </div>
          )}
        </div>

        {/* CTA Button */}
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--g-brand)] group-hover:translate-x-1 transition-transform duration-200">
          {tCommon('view')} →
        </span>
      </div>
    </Link>
  );
}
