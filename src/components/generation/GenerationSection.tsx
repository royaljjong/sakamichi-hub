import React from 'react';
import type { Generation, Member, Group } from '@/lib/schema';
import { MemberGrid } from '@/components/member/MemberGrid';

interface GenerationSectionProps {
  generation: Generation;
  members: Member[];
  group: Group;
  locale: string;
}

export function GenerationSection({
  generation,
  members,
  group,
  locale,
}: GenerationSectionProps) {
  const label =
    generation.label[locale as 'ja' | 'ko' | 'en'] || generation.label.ja;

  const activeCount = members.filter((m) => m.status === 'active').length;
  const gradCount = members.filter((m) => m.status === 'graduated').length;

  return (
    <section className="mb-14 last:mb-0">
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-3 mb-6 border-b border-[color-mix(in_oklab,var(--g-ink)_10%,transparent)]">
        <div className="flex items-baseline gap-3">
          <h2 className="text-xl sm:text-2xl font-bold text-[var(--g-ink)] font-[family-name:var(--font-klee-one)]">
            {label}
          </h2>
          <span className="text-xs text-[var(--ink-soft)] font-[family-name:var(--font-zen-kaku)]">
            {generation.joinedOn && `${generation.joinedOn} 가입 / 加入`}
          </span>
        </div>

        <div className="text-xs text-[var(--ink-soft)] font-medium font-[family-name:var(--font-zen-kaku)]">
          計 {members.length}名 (現役 {activeCount}名 / 卒業 {gradCount}名)
        </div>
      </div>

      <MemberGrid members={members} group={group} locale={locale} />
    </section>
  );
}
