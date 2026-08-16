'use client';

import React, { useState, useEffect } from 'react';
import { MemberAvatar } from '@/components/member/MemberAvatar';
import { ExternalLinkIcon } from '@/components/ui/icons';

export interface RecentUpdate {
  id: string;
  groupId: 'nogizaka46' | 'sakurazaka46' | 'hinatazaka46';
  memberId?: string;
  memberName: {
    ja: string;
    ko: string;
    en: string;
  };
  memberGlyph: string;
  memberHueShift: number;
  memberImage: string | null;
  title: string;
  publishedAt: string;
  url: string;
  type: 'official_blog';
}

interface LatestUpdatesMarqueeProps {
  initialUpdates: RecentUpdate[];
  locale: string;
}

const GROUP_BADGES = {
  nogizaka46: {
    name: { ja: '乃木坂46', ko: '노기자카46', en: 'Nogizaka46' },
    color: '#8A6BC1',
    bg: 'rgba(138, 107, 193, 0.12)',
  },
  sakurazaka46: {
    name: { ja: '櫻坂46', ko: '사쿠라자카46', en: 'Sakurazaka46' },
    color: '#E88AA6',
    bg: 'rgba(232, 138, 166, 0.14)',
  },
  hinatazaka46: {
    name: { ja: '日向坂46', ko: '히나타자카46', en: 'Hinatazaka46' },
    color: '#5AB4E0',
    bg: 'rgba(90, 180, 224, 0.14)',
  },
};

export function LatestUpdatesMarquee({ initialUpdates, locale }: LatestUpdatesMarqueeProps) {
  const [updates, setUpdates] = useState<RecentUpdate[]>(initialUpdates);

  // Background auto-refresh from live API
  useEffect(() => {
    fetch('/api/updates')
      .then((res) => {
        if (res.ok) return res.json();
        return null;
      })
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setUpdates(data);
        }
      })
      .catch((err) => {
        // Gracefully keep initialUpdates on network error
        console.warn('Background updates check error:', err);
      });
  }, []);

  if (!updates || updates.length === 0) return null;

  // Duplicate items to ensure seamless infinite scroll
  const displayItems = [...updates, ...updates];

  return (
    <section className="relative z-10 w-full mt-14 sm:mt-20 pt-8 pb-4 border-t border-[color-mix(in_oklab,var(--g-ink)_8%,transparent)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[var(--ink-soft)] font-[family-name:var(--font-zen-kaku)]">
            Latest Official Blog Updates / 公式ブログ最新更新
          </h2>
        </div>
        <span className="text-[11px] text-[var(--ink-faint)] hidden sm:inline font-mono">
          Hover to pause
        </span>
      </div>

      {/* Overflow wrapper with gradient masks on left/right */}
      <div className="relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_4%,black_96%,transparent)] py-2">
        <div className="flex gap-4 w-max animate-marquee hover:[animation-play-state:paused] focus-within:[animation-play-state:paused]">
          {displayItems.map((item, idx) => {
            const groupInfo = GROUP_BADGES[item.groupId] || GROUP_BADGES.nogizaka46;
            const groupLabel = groupInfo.name[locale as 'ja' | 'ko' | 'en'] || groupInfo.name.ja;
            const nameLabel = item.memberName[locale as 'ja' | 'ko' | 'en'] || item.memberName.ja;

            return (
              <a
                key={`${item.id}-${idx}`}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex items-center gap-3.5 p-3 sm:p-3.5 min-w-[280px] max-w-[320px] rounded-2xl bg-[var(--white-veil)] hover:bg-white border border-[color-mix(in_oklab,var(--g-ink)_10%,transparent)] hover:border-[var(--g-brand)] shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-lift)] transition-all duration-300 hover:-translate-y-0.5"
              >
                <MemberAvatar
                  glyph={item.memberGlyph}
                  hueShift={item.memberHueShift}
                  imageUrl={item.memberImage}
                  name={item.memberName.ja}
                  size={42}
                  className="shrink-0"
                />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{
                        color: groupInfo.color,
                        backgroundColor: groupInfo.bg,
                      }}
                    >
                      {groupLabel}
                    </span>
                    <span className="text-xs font-semibold text-[var(--g-ink)] truncate font-[family-name:var(--font-klee-one)]">
                      {nameLabel}
                    </span>
                  </div>

                  <p className="text-xs text-[var(--ink)] font-medium truncate leading-snug group-hover:text-[var(--g-brand)] transition-colors">
                    {item.title}
                  </p>

                  <p className="text-[10px] text-[var(--ink-faint)] mt-0.5 font-[family-name:var(--font-zen-kaku)]">
                    {item.publishedAt}
                  </p>
                </div>

                <ExternalLinkIcon className="w-3.5 h-3.5 text-[var(--ink-faint)] group-hover:text-[var(--g-brand)] shrink-0 transition-transform group-hover:translate-x-0.5" />
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
