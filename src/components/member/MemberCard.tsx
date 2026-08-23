import React from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import type { Member, Group } from '@/lib/schema';
import { renderableLinks } from '@/lib/schema';
import { MemberAvatar } from './MemberAvatar';
import { Ruby } from '@/components/ui/Ruby';

interface MemberCardProps {
  member: Member;
  group?: Group;
  locale: string;
  size?: 'sm' | 'md';
}

export function MemberCard({
  member,
  group,
  locale,
  size = 'md',
}: MemberCardProps) {
  const t = useTranslations('member');
  const isGraduated = member.status === 'graduated';
  const validLinks = renderableLinks(member.links);

  // Determine generation label
  const gen = group?.generations.find((g) => g.id === member.primaryGenerationId);
  const genLabel = gen?.label[locale as 'ja' | 'ko' | 'en'] || gen?.label.ja || '';

  // Name representation based on locale
  const primaryName =
    locale === 'ko'
      ? member.name.ko.hangul
      : locale === 'en'
      ? member.name.en.romaji
      : member.name.ja.kanji;

  const subName =
    locale === 'ko'
      ? member.name.ja.kanji
      : locale === 'en'
      ? member.name.ja.kanji
      : member.name.ja.kana;

  return (
    <Link
      href={`/m/${member.id}`}
      className="group relative flex flex-col justify-between p-4.5 sm:p-5 rounded-[22px] bg-[var(--white-veil)] hover:bg-white/95 border border-[color-mix(in_oklab,var(--g-ink)_10%,transparent)] hover:border-[var(--g-brand)] shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-lift)] transition-all duration-300 hover:-translate-y-1 focus-visible:outline-2"
    >
      <div className="flex items-start gap-3.5 mb-3">
        <MemberAvatar
          glyph={member.avatar.glyph}
          hueShift={member.avatar.hueShift}
          imageUrl={member.imageUrl}
          groupLogoUrl={group?.logoUrl ?? null}
          name={member.name.ja.kanji}
          size={size === 'sm' ? 46 : 54}
          isGraduated={isGraduated}
          className="group-hover:scale-105 transition-transform duration-300"
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="text-base sm:text-lg font-bold text-[var(--g-ink)] leading-snug truncate font-[family-name:var(--font-klee-one)]">
              {locale === 'ja' ? (
                <Ruby
                  kanji={member.name.ja.kanji}
                  kana={member.name.ja.kana}
                  locale={locale}
                />
              ) : (
                primaryName
              )}
            </h3>
            {isGraduated && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-stone-200/80 text-stone-600 shrink-0">
                {t('gradBadge')}
              </span>
            )}
          </div>

          {locale !== 'ja' && (
            <p className="text-xs text-[var(--ink-soft)] truncate mt-0.5">
              {subName}
            </p>
          )}

          <p className="text-xs text-[var(--ink-soft)] mt-1 font-[family-name:var(--font-zen-kaku)]">
            {genLabel}
          </p>
        </div>
      </div>

      {/* Link dots / count */}
      <div className="flex items-center justify-between pt-2 border-t border-[color-mix(in_oklab,var(--g-ink)_8%,transparent)] text-[11px] text-[var(--ink-faint)]">
        <div className="flex items-center gap-1.5">
          {validLinks.slice(0, 4).map((l, i) => (
            <span
              key={i}
              className="w-2 h-2 rounded-full bg-[var(--g-brand)] opacity-70 group-hover:opacity-100 transition-opacity"
              title={l.type}
            />
          ))}
          {validLinks.length > 4 && (
            <span className="text-[10px] text-[var(--ink-soft)]">
              +{validLinks.length - 4}
            </span>
          )}
        </div>
        <span className="text-[var(--ink-soft)] group-hover:text-[var(--g-brand)] transition-colors">
          →
        </span>
      </div>
    </Link>
  );
}
