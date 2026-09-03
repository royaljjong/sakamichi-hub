import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { routing } from '@/i18n/routing';
import { AmbientBackground } from '@/components/background/AmbientBackground';
import { Navigation } from '@/components/ui/Navigation';
import { Footer } from '@/components/ui/Footer';
import { Link } from '@/i18n/routing';

interface TermsPageProps {
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: TermsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const isJa = locale === 'ja';
  const isKo = locale === 'ko';

  const title = isJa
    ? '利用規約 | 坂道・48グループ リンクハブ'
    : isKo
      ? '이용약관 | 사카미치・48그룹 링크 허브'
      : 'Terms of Service | Sakamichi & 48 Group Link Hub';

  const description = isJa
    ? '坂道・48グループ リンクハブの利用規約です。サイトの目的、コンテンツの所有権、ユーザーの行為規範について説明します。'
    : isKo
      ? '사카미치・48그룹 링크 허브 이용약관입니다. 사이트 목적, 콘텐츠 소유권, 이용자 행동 규범에 대해 안내합니다.'
      : 'Terms of Service for Sakamichi & 48 Group Link Hub. Covers site purpose, content ownership, and user conduct.';

  return { metadataBase: new URL('https://sakamichi-hub.vercel.app'), title, description };
}

export default async function TermsPage({ params }: TermsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const isJa = locale === 'ja';
  const isKo = locale === 'ko';

  const t = {
    kicker: 'Terms of Service',
    pageTitle: isJa ? '利用規約' : isKo ? '이용약관' : 'Terms of Service',
    lastUpdated: isJa ? '最終更新: 2026年8月23日' : isKo ? '최종 업데이트: 2026년 8월 23일' : 'Last updated: August 23, 2026',

    acceptanceHeading: isJa ? '1. 利用規約への同意' : isKo ? '1. 약관 동의' : '1. Acceptance of Terms',
    acceptanceBody: isJa
      ? '当サイトにアクセスまたは利用することで、本規約に同意したものとみなします。同意いただけない場合は、当サイトのご利用をお控えください。'
      : isKo
        ? '본 사이트에 접근하거나 이용함으로써 본 약관에 동의하신 것으로 간주합니다. 동의하지 않으시는 경우 본 사이트 이용을 삼가주세요.'
        : 'By accessing or using this site, you agree to these terms. If you do not agree, please refrain from using the site.',

    purposeHeading: isJa ? '2. サイトの目的' : isKo ? '2. 사이트 목적' : '2. Site Purpose',
    purposeBody: isJa
      ? '当サイトは、坂道シリーズ（乃木坂46・櫻坂46・日向坂46）およびAKB48グループのメンバーと公式リンクをまとめた非公式・非営利のファンディレクトリです。商業目的ではありません。'
      : isKo
        ? '본 사이트는 사카미치 시리즈(노기자카46·사쿠라자카46·히나타자카46) 및 AKB48 그룹 멤버와 공식 링크를 모은 비공식·비영리 팬 디렉토리입니다. 상업적 목적이 아닙니다.'
        : 'This site is an unofficial, non-commercial fan directory aggregating member information and official links for the Sakamichi Series (Nogizaka46, Sakurazaka46, Hinatazaka46) and AKB48 Group.',

    ownershipHeading: isJa ? '3. コンテンツの所有権' : isKo ? '3. 콘텐츠 소유권' : '3. Content Ownership',
    ownershipDataBody: isJa
      ? 'メンバー・グループデータ：各アイドルグループの公式サイトおよびウィキペディア等の公開情報から収集・整理したものです。'
      : isKo
        ? '멤버·그룹 데이터: 각 아이돌 그룹의 공식 사이트 및 Wikipedia 등 공개 정보에서 수집·정리한 것입니다.'
        : 'Member/group data: aggregated from official group websites and public sources such as Wikipedia.',
    ownershipPhotosBody: isJa
      ? '写真・ロゴ：各アイドルグループおよびその運営会社（Seed & Flower株式会社、Sony Music Labels株式会社、AKSなど）に帰属します。当サイトは写真・ロゴをホスティングしていません。'
      : isKo
        ? '사진·로고: 각 아이돌 그룹 및 운영사(Seed & Flower 주식회사, Sony Music Labels 주식회사, AKS 등)에 귀속됩니다. 본 사이트는 사진·로고를 직접 호스팅하지 않습니다.'
        : 'Photos/logos: property of the respective idol groups and management companies (Seed & Flower, Sony Music Labels, AKS, etc.). This site does not host photos or logos.',
    ownershipWikipediaBody: isJa
      ? 'Wikipediaコンテンツ：CC BY-SA 4.0ライセンスに基づきます。詳細は'
      : isKo
        ? 'Wikipedia 콘텐츠: CC BY-SA 4.0 라이선스에 따릅니다. 자세한 내용은 '
        : 'Wikipedia content: licensed under CC BY-SA 4.0. See ',
    ownershipWikipediaLinkText: isJa ? '/クレジットページ' : isKo ? '/출처 페이지' : '/credits',
    ownershipWikipediaSuffix: isJa ? ' をご覧ください。' : isKo ? ' 를 참조하세요.' : ' for details.',

    conductHeading: isJa ? '4. 利用者の行為規範' : isKo ? '4. 이용자 행동 규범' : '4. User Conduct',
    conductBody: isJa
      ? '当サイトのコンテンツの自動収集（スクレイピング）やボットによる大量アクセスは禁止します。当サイトのデータを商業目的で転用することも禁止します。'
      : isKo
        ? '본 사이트 콘텐츠의 자동 수집(스크래핑)이나 봇에 의한 대량 접근을 금지합니다. 본 사이트 데이터를 상업적 목적으로 전용하는 것도 금지합니다.'
        : 'Automated scraping of site content and bot-based bulk access are prohibited. Commercial repurposing of this site\'s data is also prohibited.',

    disclaimerHeading: isJa ? '5. 免責事項' : isKo ? '5. 면책 사항' : '5. Disclaimer',
    disclaimerBody: isJa
      ? '当サイトはデータの正確性を保証しません。メンバーの在籍状況や公式リンクは変更される場合があり、最新情報は各公式サイトにてご確認ください。当サイトは現状のまま提供されます。'
      : isKo
        ? '본 사이트는 데이터의 정확성을 보장하지 않습니다. 멤버 재적 상태나 공식 링크는 변경될 수 있으며, 최신 정보는 각 공식 사이트에서 확인하세요. 본 사이트는 있는 그대로 제공됩니다.'
        : 'This site makes no warranty regarding data accuracy. Member status and official links may change — always check the official sites for the latest information. This site is provided as-is.',

    liabilityHeading: isJa ? '6. 責任の制限' : isKo ? '6. 책임 제한' : '6. Limitation of Liability',
    liabilityBody: isJa
      ? '当サイトの運営者は、当サイトの使用または使用不能から生じるいかなる損害に対しても責任を負いません。外部リンク先のコンテンツについても責任を負いません。'
      : isKo
        ? '본 사이트 운영자는 본 사이트의 사용 또는 사용 불능으로 인해 발생하는 어떠한 손해에 대해서도 책임을 지지 않습니다. 외부 링크의 콘텐츠에 대해서도 책임을 지지 않습니다.'
        : 'The site operator is not liable for any damages arising from use or inability to use this site. We are not responsible for the content of external links.',

    affiliationHeading: isJa ? '7. 関係性の否認' : isKo ? '7. 관계성 부인' : '7. Affiliation Disclaimer',
    affiliationBody: isJa
      ? '当サイトは乃木坂46・櫻坂46・日向坂46・AKB48グループおよびそれらの運営会社とは一切関係がありません。非公式のファンサイトです。'
      : isKo
        ? '본 사이트는 노기자카46·사쿠라자카46·히나타자카46·AKB48 그룹 및 해당 운영사와 일체 관계가 없습니다. 비공식 팬사이트입니다.'
        : 'This site is not affiliated with Nogizaka46, Sakurazaka46, Hinatazaka46, AKB48 Group, or any of their management companies. This is an unofficial fan site.',

    governingLawHeading: isJa ? '8. 準拠法' : isKo ? '8. 준거법' : '8. Governing Law',
    governingLawBody: isJa
      ? '本規約は日本法に準拠し、解釈されます。当サイトは日本語圏のユーザーを主な対象としています。'
      : isKo
        ? '본 약관은 일본 법률에 따라 해석됩니다. 본 사이트는 일본어권 이용자를 주요 대상으로 합니다.'
        : 'These terms shall be governed by and construed in accordance with the laws of Japan. This site primarily serves Japanese-language users.',

    changesHeading: isJa ? '9. 規約の変更' : isKo ? '9. 약관 변경' : '9. Changes to Terms',
    changesBody: isJa
      ? '当サイトは予告なく本規約を変更する場合があります。変更後も当サイトを利用し続けることで、改定された規約に同意したものとみなされます。定期的にご確認ください。'
      : isKo
        ? '본 사이트는 예고 없이 본 약관을 변경할 수 있습니다. 변경 후에도 본 사이트를 계속 이용하시면 개정된 약관에 동의하신 것으로 간주합니다. 정기적으로 확인해 주세요.'
        : 'We may update these terms without notice. Continued use of the site after changes constitutes acceptance of the revised terms. Please review periodically.',
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between">
      <AmbientBackground groupId="home" motif="mixed" />
      <Navigation />

      <main id="main-content" className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full">
        <div className="text-center mb-12">
          <span className="text-xs uppercase tracking-widest text-[var(--g-brand)] font-semibold mb-2 block font-[family-name:var(--font-zen-kaku)]">
            {t.kicker}
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--g-ink)] font-[family-name:var(--font-klee-one)] mb-3">
            {t.pageTitle}
          </h1>
          <p className="text-xs text-[var(--ink-faint)]">{t.lastUpdated}</p>
        </div>

        <div className="space-y-8 bg-[var(--white-veil)] p-6 sm:p-10 rounded-[32px] border border-[color-mix(in_oklab,var(--g-ink)_12%,transparent)] shadow-[var(--shadow-soft)] backdrop-blur-md">

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-[var(--g-ink)] font-[family-name:var(--font-klee-one)] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--g-brand)]" />
              {t.acceptanceHeading}
            </h2>
            <p className="text-xs sm:text-sm text-[var(--ink-soft)] leading-relaxed">{t.acceptanceBody}</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-[var(--g-ink)] font-[family-name:var(--font-klee-one)] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--g-brand)]" />
              {t.purposeHeading}
            </h2>
            <p className="text-xs sm:text-sm text-[var(--ink-soft)] leading-relaxed">{t.purposeBody}</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[var(--g-ink)] font-[family-name:var(--font-klee-one)] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--g-brand)]" />
              {t.ownershipHeading}
            </h2>
            <ul className="space-y-2 pl-4">
              <li className="text-xs sm:text-sm text-[var(--ink-soft)] leading-relaxed flex gap-2">
                <span className="text-[var(--g-brand)] shrink-0">·</span>
                <span>{t.ownershipDataBody}</span>
              </li>
              <li className="text-xs sm:text-sm text-[var(--ink-soft)] leading-relaxed flex gap-2">
                <span className="text-[var(--g-brand)] shrink-0">·</span>
                <span>{t.ownershipPhotosBody}</span>
              </li>
              <li className="text-xs sm:text-sm text-[var(--ink-soft)] leading-relaxed flex gap-2">
                <span className="text-[var(--g-brand)] shrink-0">·</span>
                <span>
                  {t.ownershipWikipediaBody}
                  <Link href="/credits" className="underline underline-offset-2 hover:text-[var(--g-brand)] transition-colors font-medium">
                    {t.ownershipWikipediaLinkText}
                  </Link>
                  {t.ownershipWikipediaSuffix}
                </span>
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-[var(--g-ink)] font-[family-name:var(--font-klee-one)] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--g-brand)]" />
              {t.conductHeading}
            </h2>
            <p className="text-xs sm:text-sm text-[var(--ink-soft)] leading-relaxed">{t.conductBody}</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-[var(--g-ink)] font-[family-name:var(--font-klee-one)] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--g-brand)]" />
              {t.disclaimerHeading}
            </h2>
            <p className="text-xs sm:text-sm text-[var(--ink-soft)] leading-relaxed">{t.disclaimerBody}</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-[var(--g-ink)] font-[family-name:var(--font-klee-one)] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--g-brand)]" />
              {t.liabilityHeading}
            </h2>
            <p className="text-xs sm:text-sm text-[var(--ink-soft)] leading-relaxed">{t.liabilityBody}</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-[var(--g-ink)] font-[family-name:var(--font-klee-one)] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--g-brand)]" />
              {t.affiliationHeading}
            </h2>
            <p className="text-xs sm:text-sm text-[var(--ink-soft)] leading-relaxed">{t.affiliationBody}</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-[var(--g-ink)] font-[family-name:var(--font-klee-one)] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--g-brand)]" />
              {t.governingLawHeading}
            </h2>
            <p className="text-xs sm:text-sm text-[var(--ink-soft)] leading-relaxed">{t.governingLawBody}</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-[var(--g-ink)] font-[family-name:var(--font-klee-one)] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--g-brand)]" />
              {t.changesHeading}
            </h2>
            <p className="text-xs sm:text-sm text-[var(--ink-soft)] leading-relaxed">{t.changesBody}</p>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
}
