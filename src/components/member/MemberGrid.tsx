import React from 'react';
import { useTranslations } from 'next-intl';
import type { Member, Group } from '@/lib/schema';
import { MemberCard } from './MemberCard';

interface MemberGridProps {
  members: Member[];
  group?: Group;
  locale: string;
}

export function MemberGrid({ members, group, locale }: MemberGridProps) {
  const t = useTranslations('member');

  if (members.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-[var(--ink-soft)] bg-[var(--white-veil)] rounded-3xl border border-[color-mix(in_oklab,var(--g-ink)_8%,transparent)]">
        {t('emptyGrid')}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
      {members.map((member) => (
        <MemberCard
          key={member.id}
          member={member}
          group={group}
          locale={locale}
        />
      ))}
    </div>
  );
}
