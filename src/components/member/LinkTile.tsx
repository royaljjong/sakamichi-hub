import React from 'react';
import { useTranslations } from 'next-intl';
import type { MemberLink } from '@/lib/schema';
import { isClickable } from '@/lib/schema';
import {
  BlogIcon,
  ProfileIcon,
  XIcon,
  InstagramIcon,
  TikTokIcon,
  YouTubeIcon,
  GlobeIcon,
  ExternalLinkIcon,
} from '@/components/ui/icons';

interface LinkTileProps {
  link: MemberLink;
  locale: string;
}

export function LinkTile({ link, locale }: LinkTileProps) {
  const tLink = useTranslations('link');
  const clickable = isClickable(link);

  let icon = <GlobeIcon className="w-5 h-5" />;
  if (link.type === 'official_blog') icon = <BlogIcon className="w-5 h-5 text-[var(--g-brand)]" />;
  else if (link.type === 'official_profile') icon = <ProfileIcon className="w-5 h-5 text-[var(--g-brand)]" />;
  else if (link.type === 'x') icon = <XIcon className="w-5 h-5" />;
  else if (link.type === 'instagram') icon = <InstagramIcon className="w-5 h-5 text-pink-600" />;
  else if (link.type === 'tiktok') icon = <TikTokIcon className="w-5 h-5" />;
  else if (link.type === 'youtube') icon = <YouTubeIcon className="w-5 h-5 text-red-600" />;

  // Display label
  const labelText =
    link.label?.[locale as 'ja' | 'ko' | 'en'] ||
    (tLink.has(link.type) ? tLink(link.type) : tLink('other'));

  // Extract domain for subtitle
  let domain = '';
  try {
    const parsed = new URL(link.url);
    domain = parsed.hostname.replace(/^www\./, '');
  } catch {
    domain = link.url;
  }

  const containerClasses = `group relative flex items-center justify-between p-4 min-h-[56px] rounded-2xl border transition-all duration-300 ${
    clickable
      ? 'bg-[var(--white-veil)] hover:bg-white/95 text-[var(--ink)] border-[color-mix(in_oklab,var(--g-ink)_12%,transparent)] hover:border-[var(--g-brand)] shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-lift)] hover:-translate-y-0.5'
      : 'bg-[var(--paper-deep)] text-[var(--ink-faint)] border-[color-mix(in_oklab,var(--ink)_10%,transparent)] cursor-not-allowed opacity-70'
  }`;

  if (!clickable) {
    return (
      <div className={containerClasses} aria-disabled="true">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="p-2 rounded-xl bg-white/40 grayscale">{icon}</div>
          <div className="min-w-0">
            <p className="text-sm font-medium leading-tight truncate">
              {labelText}
            </p>
            <p className="text-xs text-[var(--ink-faint)] truncate mt-0.5">
              {domain}
            </p>
          </div>
        </div>
        <span className="shrink-0 text-[10px] px-2 py-0.5 rounded bg-stone-200 text-stone-600">
          {tLink('archived')}
        </span>
      </div>
    );
  }

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className={containerClasses}
    >
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="p-2 rounded-xl bg-white/70 shadow-xs group-hover:scale-105 transition-transform duration-200">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--g-ink)] leading-tight truncate">
            {labelText}
          </p>
          <p className="text-xs text-[var(--ink-soft)] truncate mt-0.5">
            {domain}
          </p>
        </div>
      </div>
      <ExternalLinkIcon className="w-4 h-4 text-[var(--ink-faint)] group-hover:text-[var(--g-brand)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200 shrink-0 ml-2" />
    </a>
  );
}
