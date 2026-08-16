import React from 'react';
import { useTranslations } from 'next-intl';
import type { Group } from '@/lib/schema';
import {
  GlobeIcon,
  BlogIcon,
  XIcon,
  InstagramIcon,
  YouTubeIcon,
  TikTokIcon,
} from '@/components/ui/icons';

interface GroupHeaderProps {
  group: Group;
  locale: string;
}

export function GroupHeader({ group, locale }: GroupHeaderProps) {
  const t = useTranslations('group');
  const tLink = useTranslations('link');

  const groupName = group.name[locale as 'ja' | 'ko' | 'en'] || group.name.ja;

  const officialLinks = [
    { type: 'site', url: group.official.site, label: group.shortName[locale as 'ja' | 'ko' | 'en'] + ' ' + tLink('other'), icon: <GlobeIcon className="w-4 h-4" /> },
    group.official.blogIndex ? { type: 'blog', url: group.official.blogIndex, label: tLink('official_blog'), icon: <BlogIcon className="w-4 h-4" /> } : null,
    group.official.x ? { type: 'x', url: group.official.x, label: 'X', icon: <XIcon className="w-4 h-4" /> } : null,
    group.official.instagram ? { type: 'instagram', url: group.official.instagram, label: 'Instagram', icon: <InstagramIcon className="w-4 h-4" /> } : null,
    group.official.youtube ? { type: 'youtube', url: group.official.youtube, label: 'YouTube', icon: <YouTubeIcon className="w-4 h-4" /> } : null,
    group.official.tiktok ? { type: 'tiktok', url: group.official.tiktok, label: 'TikTok', icon: <TikTokIcon className="w-4 h-4" /> } : null,
  ].filter(Boolean);

  return (
    <header className="mb-10 text-center md:text-left">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[color-mix(in_oklab,var(--g-ink)_10%,transparent)]">
        <div>
          <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
            <span
              className="inline-block w-3 h-3 rounded-full"
              style={{ backgroundColor: group.palette.brand }}
            />
            <span className="text-xs font-semibold tracking-wider text-[var(--ink-soft)] uppercase font-[family-name:var(--font-zen-kaku)]">
              {group.debutedOn} {t('debutedOn')}
            </span>
          </div>

          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-[var(--g-ink)] font-[family-name:var(--font-klee-one)] mb-2">
            {group.name.ja}
          </h1>

          {locale !== 'ja' && (
            <p className="text-lg font-medium text-[var(--ink-soft)]">
              {groupName}
            </p>
          )}

          <p className="text-sm text-[var(--ink-soft)] mt-3 max-w-2xl leading-relaxed">
            {group.description[locale as 'ja' | 'ko' | 'en'] || group.description.ja}
          </p>
        </div>

        {/* Official Links Pills */}
        <div className="flex flex-wrap items-center justify-center md:justify-end gap-2 shrink-0">
          {officialLinks.map((ol: any, idx) => (
            <a
              key={idx}
              href={ol.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--white-veil)] hover:bg-white text-xs font-medium text-[var(--ink)] border border-[color-mix(in_oklab,var(--g-ink)_15%,transparent)] shadow-xs transition hover:scale-105"
            >
              {ol.icon}
              <span>{ol.label}</span>
            </a>
          ))}
        </div>
      </div>
    </header>
  );
}
