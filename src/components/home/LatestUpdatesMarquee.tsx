'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MemberAvatar } from '@/components/member/MemberAvatar';
import { ExternalLinkIcon } from '@/components/ui/icons';

export interface RecentUpdate {
  id: string;
  groupId: string;
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
  klp48: {
    name: { ja: 'KLP48', ko: 'KLP48', en: 'KLP48' },
    color: '#00897B',
    bg: 'rgba(0, 137, 123, 0.14)',
  },
};

export function LatestUpdatesMarquee({ initialUpdates, locale }: LatestUpdatesMarqueeProps) {
  const [updates, setUpdates] = useState<RecentUpdate[]>(initialUpdates);
  const [isPaused, setIsPaused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const hasMovedRef = useRef(false);
  const animFrameIdRef = useRef<number | null>(null);

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
        console.warn('Background updates check error:', err);
      });
  }, []);

  // Triple items for seamless loop and dragging
  const displayItems = updates.length > 0 ? [...updates, ...updates, ...updates] : [];

  // Gentle, calm auto-scroll (speed ~ 20px / second)
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

  // Robust Pointer-based Drag-to-Scroll Handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = containerRef.current;
    if (!el) return;

    setIsDragging(true);
    hasMovedRef.current = false;
    startXRef.current = e.clientX;
    scrollLeftRef.current = el.scrollLeft;

    // Capture pointer so dragging continues even if cursor leaves container
    try {
      el.setPointerCapture(e.pointerId);
    } catch {
      // Ignore if not supported
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
    // If the user performed a drag gesture, prevent opening the link
    if (hasMovedRef.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  // Manual Previous/Next Step Controls
  const scrollStep = useCallback((direction: 'left' | 'right') => {
    const el = containerRef.current;
    if (!el) return;
    const offset = direction === 'left' ? -360 : 360;
    el.scrollBy({ left: offset, behavior: 'smooth' });
  }, []);

  if (!updates || updates.length === 0) return null;

  const headerTitle =
    locale === 'ko'
      ? '공식 블로그 최신 갱신'
      : locale === 'ja'
      ? '公式ブログ最新更新'
      : 'Latest Official Blog Updates';

  return (
    <section className="relative z-10 w-full mt-12 sm:mt-16 pt-8 pb-4 border-t border-[color-mix(in_oklab,var(--g-ink)_10%,transparent)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 mb-4 flex items-center justify-between flex-wrap gap-3">
        {/* Left: Indicator & Title */}
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-sm" />
          <h2 className="text-xs sm:text-sm font-bold tracking-wide text-[var(--g-ink)] font-[family-name:var(--font-klee-one)]">
            {headerTitle}
          </h2>
          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[var(--paper-deep)] text-[var(--ink-soft)] font-medium">
            {updates.length} updates
          </span>
        </div>

        {/* Right: Controls (Prev, Next, Pause/Play) */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-[var(--ink-faint)] font-mono mr-2 hidden md:inline">
            Drag to scroll • 드래그로 되돌리기
          </span>

          <button
            type="button"
            onClick={() => scrollStep('left')}
            aria-label="Previous updates"
            className="w-8 h-8 rounded-full bg-[var(--white-veil)] hover:bg-white border border-[color-mix(in_oklab,var(--g-ink)_15%,transparent)] hover:border-[var(--g-brand)] text-[var(--ink)] flex items-center justify-center text-sm shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            ←
          </button>

          <button
            type="button"
            onClick={() => setIsPaused((prev) => !prev)}
            aria-label={isPaused ? 'Resume auto scroll' : 'Pause auto scroll'}
            className="px-3 h-8 rounded-full bg-[var(--white-veil)] hover:bg-white border border-[color-mix(in_oklab,var(--g-ink)_15%,transparent)] hover:border-[var(--g-brand)] text-[var(--ink)] flex items-center justify-center text-xs font-mono shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            {isPaused ? '▶ Play' : '⏸ Pause'}
          </button>

          <button
            type="button"
            onClick={() => scrollStep('right')}
            aria-label="Next updates"
            className="w-8 h-8 rounded-full bg-[var(--white-veil)] hover:bg-white border border-[color-mix(in_oklab,var(--g-ink)_15%,transparent)] hover:border-[var(--g-brand)] text-[var(--ink)] flex items-center justify-center text-sm shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            →
          </button>
        </div>
      </div>

      {/* Interactive Drag & Scroll Container */}
      <div
        className="relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_2%,black_98%,transparent)] py-2"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          ref={containerRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className={`flex gap-4 overflow-x-auto no-scrollbar select-none px-4 py-1.5 touch-pan-y ${
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
                className="group relative flex items-center gap-3.5 p-3 sm:p-3.5 min-w-[290px] max-w-[340px] rounded-2xl bg-[var(--white-veil)] hover:bg-white border border-[color-mix(in_oklab,var(--g-ink)_10%,transparent)] hover:border-[var(--g-brand)] shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-lift)] transition-all duration-300 hover:-translate-y-0.5 shrink-0 select-none"
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

                <ExternalLinkIcon className="w-3.5 h-3.5 text-[var(--ink-faint)] group-hover:text-[var(--g-brand)] shrink-0 transition-transform group-hover:translate-x-0.5 pointer-events-none" />
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
