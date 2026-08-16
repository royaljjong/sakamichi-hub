'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MemberAvatar } from '@/components/member/MemberAvatar';
import { ExternalLinkIcon } from '@/components/ui/icons';

export interface RecentUpdate {
  id: string;
  groupId: string;
  franchise?: 'sakamichi' | 'akb48g';
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

const GROUP_BADGES: Record<
  string,
  { name: { ja: string; ko: string; en: string }; color: string; bg: string }
> = {
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
  akb48: {
    name: { ja: 'AKB48', ko: 'AKB48', en: 'AKB48' },
    color: '#E53975',
    bg: 'rgba(229, 57, 117, 0.14)',
  },
  ske48: {
    name: { ja: 'SKE48', ko: 'SKE48', en: 'SKE48' },
    color: '#E87722',
    bg: 'rgba(232, 119, 34, 0.14)',
  },
  nmb48: {
    name: { ja: 'NMB48', ko: 'NMB48', en: 'NMB48' },
    color: '#C59B27',
    bg: 'rgba(197, 155, 39, 0.15)',
  },
  hkt48: {
    name: { ja: 'HKT48', ko: 'HKT48', en: 'HKT48' },
    color: '#4A5568',
    bg: 'rgba(74, 85, 104, 0.14)',
  },
  ngt48: {
    name: { ja: 'NGT48', ko: 'NGT48', en: 'NGT48' },
    color: '#D32F2F',
    bg: 'rgba(211, 47, 47, 0.14)',
  },
  stu48: {
    name: { ja: 'STU48', ko: 'STU48', en: 'STU48' },
    color: '#0277BD',
    bg: 'rgba(2, 119, 189, 0.14)',
  },
  jkt48: {
    name: { ja: 'JKT48', ko: 'JKT48', en: 'JKT48' },
    color: '#D32F2F',
    bg: 'rgba(211, 47, 47, 0.14)',
  },
  bnk48: {
    name: { ja: 'BNK48', ko: 'BNK48', en: 'BNK48' },
    color: '#BA68C8',
    bg: 'rgba(186, 104, 200, 0.14)',
  },
  cgm48: {
    name: { ja: 'CGM48', ko: 'CGM48', en: 'CGM48' },
    color: '#26A69A',
    bg: 'rgba(38, 166, 154, 0.14)',
  },
  mnl48: {
    name: { ja: 'MNL48', ko: 'MNL48', en: 'MNL48' },
    color: '#3949AB',
    bg: 'rgba(57, 73, 171, 0.14)',
  },
  'akb48-team-sh': {
    name: { ja: 'Team SH', ko: 'Team SH', en: 'Team SH' },
    color: '#E53935',
    bg: 'rgba(229, 57, 53, 0.14)',
  },
  'akb48-team-tp': {
    name: { ja: 'Team TP', ko: 'Team TP', en: 'Team TP' },
    color: '#FB8C00',
    bg: 'rgba(251, 140, 0, 0.14)',
  },
  klp48: {
    name: { ja: 'KLP48', ko: 'KLP48', en: 'KLP48' },
    color: '#00897B',
    bg: 'rgba(0, 137, 123, 0.14)',
  },
};

interface MarqueeRowProps {
  title: string;
  badgeEmoji: string;
  items: RecentUpdate[];
  locale: string;
}

function MarqueeRow({ title, badgeEmoji, items, locale }: MarqueeRowProps) {
  const [isPaused, setIsPaused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const hasMovedRef = useRef(false);
  const animFrameIdRef = useRef<number | null>(null);

  // Triple items for seamless loop and dragging
  const displayItems = items.length > 0 ? [...items, ...items, ...items] : [];

  // Calm auto-scroll (~ 20px / sec)
  useEffect(() => {
    const el = containerRef.current;
    if (!el || displayItems.length === 0) return;

    let lastTimestamp = performance.now();
    const speed = 20;

    const loop = (timestamp: number) => {
      const delta = (timestamp - lastTimestamp) / 1000;
      lastTimestamp = timestamp;

      if (!isPaused && !isHovered && !isDragging && el) {
        el.scrollLeft += speed * delta;

        const maxScroll = el.scrollWidth / 3;
        if (el.scrollLeft >= maxScroll * 2) {
          el.scrollLeft -= maxScroll;
        } else if (el.scrollLeft <= 0) {
          el.scrollLeft += maxScroll;
        }
      }

      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    animFrameIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [isPaused, isHovered, isDragging, displayItems.length]);

  // Pointer drag handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = containerRef.current;
    if (!el) return;

    setIsDragging(true);
    hasMovedRef.current = false;
    startXRef.current = e.clientX;
    scrollLeftRef.current = el.scrollLeft;

    try {
      el.setPointerCapture(e.pointerId);
    } catch {
      // Ignore
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const el = containerRef.current;
    if (!el) return;

    const diff = e.clientX - startXRef.current;
    if (Math.abs(diff) > 5) {
      hasMovedRef.current = true;
    }

    el.scrollLeft = scrollLeftRef.current - diff;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = containerRef.current;
    if (el) {
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {
        // Ignore
      }
    }
    setIsDragging(false);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (hasMovedRef.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const scrollStep = useCallback((direction: 'left' | 'right') => {
    const el = containerRef.current;
    if (!el) return;
    const offset = direction === 'left' ? -360 : 360;
    el.scrollBy({ left: offset, behavior: 'smooth' });
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="w-full">
      {/* Header bar */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 mb-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <span className="text-base leading-none">{badgeEmoji}</span>
          <h3 className="text-xs sm:text-sm font-bold tracking-wide text-[var(--g-ink)] font-[family-name:var(--font-klee-one)]">
            {title}
          </h3>
          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[var(--paper-deep)] text-[var(--ink-soft)] font-medium">
            {items.length} posts
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-[var(--ink-faint)] font-mono mr-2 hidden md:inline">
            Drag to scroll • 되감기
          </span>

          <button
            type="button"
            onClick={() => scrollStep('left')}
            aria-label="Previous posts"
            className="w-7 h-7 rounded-full bg-[var(--white-veil)] hover:bg-white border border-[color-mix(in_oklab,var(--g-ink)_15%,transparent)] hover:border-[var(--g-brand)] text-[var(--ink)] flex items-center justify-center text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            ←
          </button>

          <button
            type="button"
            onClick={() => setIsPaused((prev) => !prev)}
            aria-label={isPaused ? 'Resume auto scroll' : 'Pause auto scroll'}
            className="px-2.5 h-7 rounded-full bg-[var(--white-veil)] hover:bg-white border border-[color-mix(in_oklab,var(--g-ink)_15%,transparent)] hover:border-[var(--g-brand)] text-[var(--ink)] flex items-center justify-center text-[11px] font-mono shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            {isPaused ? '▶ Play' : '⏸ Pause'}
          </button>

          <button
            type="button"
            onClick={() => scrollStep('right')}
            aria-label="Next posts"
            className="w-7 h-7 rounded-full bg-[var(--white-veil)] hover:bg-white border border-[color-mix(in_oklab,var(--g-ink)_15%,transparent)] hover:border-[var(--g-brand)] text-[var(--ink)] flex items-center justify-center text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            →
          </button>
        </div>
      </div>

      {/* Row scroll viewport */}
      <div
        className="relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_2%,black_98%,transparent)] py-1.5"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          ref={containerRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className={`flex gap-3.5 overflow-x-auto no-scrollbar select-none px-4 py-1 touch-pan-y ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {displayItems.map((item, idx) => {
            const groupInfo = GROUP_BADGES[item.groupId] || {
              name: { ja: item.groupId, ko: item.groupId, en: item.groupId },
              color: '#8A6BC1',
              bg: 'rgba(138, 107, 193, 0.12)',
            };
            const groupLabel = groupInfo.name[locale as 'ja' | 'ko' | 'en'] || groupInfo.name.ja;
            const nameLabel = item.memberName[locale as 'ja' | 'ko' | 'en'] || item.memberName.ja;

            return (
              <a
                key={`${item.id}-${idx}`}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
                onClick={handleCardClick}
                className="group relative flex items-center gap-3 p-3 min-w-[280px] max-w-[330px] rounded-2xl bg-[var(--white-veil)] hover:bg-white border border-[color-mix(in_oklab,var(--g-ink)_10%,transparent)] hover:border-[var(--g-brand)] shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-lift)] transition-all duration-300 hover:-translate-y-0.5 shrink-0 select-none"
              >
                <MemberAvatar
                  glyph={item.memberGlyph}
                  hueShift={item.memberHueShift}
                  imageUrl={item.memberImage}
                  name={item.memberName.ja}
                  size={42}
                  className="shrink-0 pointer-events-none"
                />

                <div className="min-w-0 flex-1 pointer-events-none">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
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

                <ExternalLinkIcon className="w-3.5 h-3.5 text-[var(--ink-faint)] group-hover:text-[var(--g-brand)] shrink-0 transition-transform group-hover:translate-x-0.5 pointer-events-none" />
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function LatestUpdatesMarquee({ initialUpdates, locale }: LatestUpdatesMarqueeProps) {
  const [updates, setUpdates] = useState<RecentUpdate[]>(initialUpdates);

  useEffect(() => {
    if (initialUpdates && initialUpdates.length > 0) {
      setUpdates(initialUpdates);
    }
  }, [initialUpdates]);

  if (!updates || updates.length === 0) return null;

  // Split into Sakamichi vs AKB48 Group (Up to 30 each)
  const sakamichiGroupIds = new Set(['nogizaka46', 'sakurazaka46', 'hinatazaka46']);
  const sakamichiUpdates = updates
    .filter((u) => u.franchise === 'sakamichi' || sakamichiGroupIds.has(u.groupId))
    .slice(0, 30);

  const akbUpdates = updates
    .filter((u) => u.franchise === 'akb48g' || !sakamichiGroupIds.has(u.groupId))
    .slice(0, 30);

  const sakamichiTitle =
    locale === 'ko'
      ? '사카미치 시리즈 공식 블로그 최신 갱신'
      : locale === 'ja'
      ? '坂道シリーズ 公式ブログ最新更新'
      : 'Sakamichi Series Latest Blog Updates';

  const akbTitle =
    locale === 'ko'
      ? 'AKB48 그룹 공식 블로그 최신 갱신'
      : locale === 'ja'
      ? 'AKB48グループ 公式ブログ最新更新'
      : 'AKB48 Group Latest Blog Updates';

  return (
    <section className="relative z-10 w-full mt-12 sm:mt-16 pt-8 pb-4 border-t border-[color-mix(in_oklab,var(--g-ink)_10%,transparent)] space-y-8">
      {/* 1. Sakamichi Series Row (Top - 30 items) */}
      <MarqueeRow
        title={sakamichiTitle}
        badgeEmoji="🌸"
        items={sakamichiUpdates}
        locale={locale}
      />

      {/* 2. AKB48 Group Row (Bottom - 30 items) */}
      <MarqueeRow
        title={akbTitle}
        badgeEmoji="🎀"
        items={akbUpdates}
        locale={locale}
      />
    </section>
  );
}
