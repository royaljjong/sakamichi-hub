import React from 'react';
import type { LineageEntry } from '@/lib/schema';

interface LineageTimelineProps {
  lineage: LineageEntry[];
  locale: string;
}

export function LineageTimeline({ lineage, locale }: LineageTimelineProps) {
  if (lineage.length <= 1) return null;

  return (
    <div className="my-6 p-5 rounded-2xl bg-[var(--white-veil)] border border-[color-mix(in_oklab,var(--g-ink)_10%,transparent)]">
      <h3 className="text-xs font-bold text-[var(--ink-soft)] uppercase tracking-wider mb-4">
        Lineage / 계보 변천사
      </h3>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 relative">
        {lineage.map((item, idx) => {
          const isCurrent = item.to === null;
          const name = item.name[locale as 'ja' | 'ko' | 'en'] || item.name.ja;

          return (
            <div key={item.id} className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span
                  className="w-3.5 h-3.5 rounded-full ring-2 ring-white"
                  style={{ backgroundColor: item.color }}
                />
                <div>
                  <p className="text-sm font-bold text-[var(--ink)]">
                    {name}
                  </p>
                  <p className="text-[11px] text-[var(--ink-soft)] font-[family-name:var(--font-zen-kaku)]">
                    {item.from} ~ {item.to || 'Present'}
                  </p>
                </div>
              </div>
              {idx < lineage.length - 1 && (
                <span className="hidden sm:inline text-xs text-[var(--ink-faint)] font-bold">
                  ➔
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
