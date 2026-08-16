import React from 'react';
import { Link } from '@/i18n/routing';
import type { Generation } from '@/lib/schema';

interface GenerationChipProps {
  generation: Generation;
  groupId: string;
  locale: string;
  active?: boolean;
  count?: number;
}

export function GenerationChip({
  generation,
  groupId,
  locale,
  active = false,
  count,
}: GenerationChipProps) {
  const label =
    generation.label[locale as 'ja' | 'ko' | 'en'] || generation.label.ja;

  return (
    <Link
      href={`/g/${groupId}/gen/${generation.id}`}
      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${
        active
          ? 'bg-[var(--g-brand)] text-white border-[var(--g-brand)] shadow-xs'
          : 'bg-[var(--white-veil)] text-[var(--ink)] border-[color-mix(in_oklab,var(--g-ink)_15%,transparent)] hover:bg-white'
      }`}
    >
      <span>{label}</span>
      {count !== undefined && (
        <span
          className={`text-[10px] px-1.5 py-0.2 rounded-full ${
            active ? 'bg-white/30 text-white' : 'bg-[var(--paper-deep)] text-[var(--ink-soft)]'
          }`}
        >
          {count}
        </span>
      )}
    </Link>
  );
}
