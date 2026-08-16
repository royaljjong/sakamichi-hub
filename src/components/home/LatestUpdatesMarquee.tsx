'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  const [isPaused, setIsPaused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const hasDraggedRef = useRef(false);
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

  // Triple items to allow smooth continuous wrap-around dragging
  const displayItems = updates.length > 0 ? [...updates, ...updates, ...updates] : [];

  // Smooth Auto-scroll (Very gentle, slow reading speed ~ 0.5px/frame)
  useEffect(() => {
    const el = containerRef.current;
    if (!el || displayItems.length === 0) return;

    let lastTimestamp = performance.now();
    const speedPixelsPerSecond = 24; // Slow, calm reading speed

    const scrollLoop = (timestamp: number) => {
      const delta = (timestamp - lastTimestamp) / 1000;
      lastTimestamp = timestamp;

      if (!isPaused && !isHovered && !isDragging && el) {
        el.scrollLeft += speedPixelsPerSecond * delta;

        // Loop seamlessly when reached 2/3 of content
        const maxScroll = el.scrollWidth / 3;
        if (el.scrollLeft >= maxScroll * 2) {
          el.scrollLeft -= maxScroll;
        } else if (el.scrollLeft <= 0) {
          el.scrollLeft += maxScroll;
        }
      }

      animFrameIdRef.current = requestAnimationFrame(scrollLoop);
    };

    animFrameIdRef.current = requestAnimationFrame(scrollLoop);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [isPaused, isHovered, isDragging, displayItems.length]);

  // Mouse Drag to Scroll handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    const el = containerRef.current;
    if (!el) return;
    setIsDragging(true);
    hasDraggedRef.current = false;
    startXRef.current = e.pageX - el.offsetLeft;
    scrollLeftRef.current = el.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const el = containerRef.current;
    if (!el) return;
    e.preventDefault();
    const x = e.pageX - el.offsetLeft;
    const walk = (x - startXRef.current) * 1.5; // Drag sensitivity
    if (Math.abs(walk) > 4) {
      hasDraggedRef.current = true;
    }
    el.scrollLeft = scrollLeftRef.current - walk;
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  const handleCardClick = (e: React.MouseEvent, url: string) => {
    // If user was dragging, don't trigger the link navigation
    if (hasDraggedRef.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  // Manual Previous/Next Controls
  const scrollStep = useCallback((direction: 'left' | 'right') => {
    const el = containerRef.current;
    if (!el) return;
    const offset = direction === 'left' ? -340 : 340;
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
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--paper-deep)] text-[var(--ink-soft)] font-medium hidden sm:inline">
            {updates.length} posts
          </span>
        </div>

        {/* Right: Navigation Controls (Prev, Next, Pause/Play) */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-[var(--ink-faint)] font-mono mr-2 hidden md:inline">
            Drag to rewind • 드래그로 되돌리기
          </span>

          <button
            type="button"
            onClick={() => scrollStep('left')}
            aria-label="Previous updates"
            className="w-7 h-7 rounded-full bg-[var(--white-veil)] hover:bg-white border border-[color-mix(in_oklab,var(--g-ink)_15%,transparent)] hover:border-[var(--g-brand)] text-[var(--ink)] flex items-center justify-center text-xs shadow-sm transition-all active:scale-95"
          >
            ←
          </button>

          <button
            type="button"
            onClick={() => setIsPaused((prev) => !prev)}
            aria-label={isPaused ? 'Resume auto scroll' : 'Pause auto scroll'}
            className="px-2.5 h-7 rounded-full bg-[var(--white-veil)] hover:bg-white border border-[color-mix(in_oklab,var(--g-ink)_15%,transparent)] hover:border-[var(--g-brand)] text-[var(--ink)] flex items-center justify-center text-xs font-mono shadow-sm transition-all active:scale-95"
          >
            {isPaused ? '▶ Play' : '⏸ Pause'}
          </button>

          <button
            type="button"
            onClick={() => scrollStep('right')}
            aria-label="Next updates"
            className="w-7 h-7 rounded-full bg-[var(--white-veil)] hover:bg-white border border-[color-mix(in_oklab,var(--g-ink)_15%,transparent)] hover:border-[var(--g-brand)] text-[var(--ink)] flex items-center justify-center text-xs shadow-sm transition-all active:scale-95"
          >
            →
          </button>
        </div>
      </div>

      {/* Interactive Drag & Scroll Container */}
      <div
        className="relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_3%,black_97%,transparent)] py-2"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          handleMouseUpOrLeave();
        }}
      >
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          className={`flex gap-4 overflow-x-auto no-scrollbar select-none px-4 py-1 cursor-grab ${
            isDragging ? 'cursor-grabbing' : ''
          }`}
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
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
                onClick={(e) => handleCardClick(e, item.url)}
                className="group relative flex items-center gap-3.5 p-3 sm:p-3.5 min-w-[280px] max-w-[320px] rounded-2xl bg-[var(--white-veil)] hover:bg-white border border-[color-mix(in_oklab,var(--g-ink)_10%,transparent)] hover:border-[var(--g-brand)] shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-lift)] transition-all duration-300 hover:-translate-y-0.5 shrink-0"
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
