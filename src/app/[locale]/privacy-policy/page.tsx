import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { routing } from '@/i18n/routing';
import { AmbientBackground } from '@/components/background/AmbientBackground';
import { Navigation } from '@/components/ui/Navigation';
import { Footer } from '@/components/ui/Footer';
import { Link } from '@/i18n/routing';

interface PrivacyPolicyPageProps {
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: PrivacyPolicyPageProps): Promise<Metadata> {
  const { locale } = await params;
  const isJa = locale === 'ja';
  const isKo = locale === 'ko';

  const title = isJa
    ? 'プライバシーポリシー | 坂道・48グループ リンクハブ'
    : isKo
      ? '개인정보 처리방침 | 사카미치・48그룹 링크 허브'
      : 'Privacy Policy | Sakamichi & 48 Group Link Hub';

  const description = isJa
    ? '当サイトが収集する情報、使用するCookieおよびサードパーティサービスについて説明します。'
    : isKo
      ? '본 사이트가 수집하는 정보, 사용하는 쿠키 및 서드파티 서비스에 대해 안내합니다.'
      : 'Learn about the information we collect, cookies we use, and third-party services on this site.';

  return { title, description };
}

export default async function PrivacyPolicyPage({ params }: PrivacyPolicyPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const isJa = locale === 'ja';
  const isKo = locale === 'ko';

  const t = {
    kicker: 'Privacy Policy',
    pageTitle: isJa ? 'プライバシーポリシー' : isKo ? '개인정보 처리방침' : 'Privacy Policy',
    lastUpdated: isJa ? '最終更新: 2026年8月23日' : isKo ? '최종 업데이트: 2026년 8월 23일' : 'Last updated: August 23, 2026',

    introHeading: isJa ? '1. はじめに' : isKo ? '1. 개요' : '1. Introduction',
    introBody: isJa
      ? '坂道・48グループ リンクハブ（以下「当サイト」）は、ユーザーのプライバシーを尊重します。本ポリシーでは、当サイトが収集する情報（アナリティクス、Cookie、広告）について説明します。当サイトをご利用いただくことで、本ポリシーに同意したものとみなします。'
      : isKo
        ? '사카미치・48그룹 링크 허브(이하 "본 사이트")는 이용자의 개인정보를 존중합니다. 본 방침은 본 사이트가 수집하는 정보(애널리틱스, 쿠키, 광고)에 대해 설명합니다. 본 사이트를 이용하심으로써 본 방침에 동의하신 것으로 간주합니다.'
        : 'Sakamichi & 48 Group Link Hub ("this site") respects your privacy. This policy explains what information we collect — including analytics, cookies, and advertising data. By using this site, you agree to this policy.',

    dataHeading: isJa ? '2. 収集する情報' : isKo ? '2. 수집하는 정보' : '2. Data We Collect',
    dataAnalyticsHeading: isJa ? 'アナリティクス' : isKo ? '애널리틱스' : 'Analytics',
    dataAnalyticsBody: isJa
      ? '当サイトはVercel Analytics および Vercel Speed Insights を使用し、匿名のページビュー、ブラウザ情報、デバイス情報を収集します。これらのデータは個人を特定するものではなく、サイトのパフォーマンス改善のみに使用されます。'
      : isKo
        ? '본 사이트는 Vercel Analytics 및 Vercel Speed Insights를 사용하여 익명의 페이지 조회수, 브라우저 정보, 기기 정보를 수집합니다. 이 데이터는 개인을 특정하지 않으며 사이트 성능 개선에만 사용됩니다.'
        : 'This site uses Vercel Analytics and Vercel Speed Insights to collect anonymous page view data, browser information, and device information. This data does not identify individuals and is used solely to improve site performance.',
    dataCookiesHeading: isJa ? 'Cookie' : isKo ? '쿠키' : 'Cookies',
    dataCookiesBody: isJa
      ? '当サイトは以下の目的でCookieおよびローカルストレージを使用することがあります：セッション管理、言語設定の保存、モーションアニメーション設定の保存。これらはサイトの機能提供に必要なものです。'
      : isKo
        ? '본 사이트는 다음 목적으로 쿠키 및 로컬 스토리지를 사용할 수 있습니다: 세션 관리, 언어 설정 저장, 모션 애니메이션 설정 저장. 이는 사이트 기능 제공에 필요한 항목입니다.'
        : 'This site may use cookies and local storage for: session management, saving your language preference, and saving your motion animation preference. These are necessary for site functionality.',
    dataAdsHeading: isJa ? '広告（有効化時）' : isKo ? '광고(활성화 시)' : 'Advertising (when active)',
    dataAdsBody: isJa
      ? '当サイトでは将来的にGoogle AdSenseによる広告を表示する予定です。広告が有効な場合、Googleはパーソナライズ広告の配信のためにCookieを設定することがあります。'
      : isKo
        ? '본 사이트는 향후 Google AdSense 광고를 표시할 예정입니다. 광고가 활성화된 경우, Google은 개인화 광고 제공을 위해 쿠키를 설정할 수 있습니다.'
        : 'This site may display Google AdSense ads in the future. When ads are active, Google may set cookies to serve personalized advertisements.',

    thirdPartyHeading: isJa ? '3. サードパーティサービス' : isKo ? '3. 서드파티 서비스' : '3. Third-Party Services',
    thirdPartyAdSenseHeading: 'Google AdSense',
    thirdPartyAdSenseBody: isJa
      ? 'Google AdSense（有効化後）はパーソナライズ広告を配信するためにCookieを使用する場合があります。Googleの広告設定ページからパーソナライズ広告をオプトアウトできます。'
      : isKo
        ? 'Google AdSense(활성화 후)는 개인화 광고를 제공하기 위해 쿠키를 사용할 수 있습니다. Google 광고 설정 페이지에서 개인화 광고를 거부할 수 있습니다.'
        : 'Google AdSense (once enabled) may use cookies to serve personalized ads. You can opt out of personalized advertising via Google\'s ad settings page.',
    thirdPartyAdSenseLink: isJa ? 'Google広告設定' : isKo ? 'Google 광고 설정' : 'Google Ad Settings',
    thirdPartyVercelHeading: 'Vercel',
    thirdPartyVercelBody: isJa
      ? '当サイトはVercelによりホスティングされており、Vercel Analyticsおよびインフラサービスを使用しています。詳細はVercelのプライバシーポリシーをご参照ください。'
      : isKo
        ? '본 사이트는 Vercel에 의해 호스팅되며, Vercel Analytics 및 인프라 서비스를 사용합니다. 자세한 내용은 Vercel의 개인정보 처리방침을 참조하세요.'
        : 'This site is hosted by Vercel and uses Vercel Analytics and infrastructure services. See Vercel\'s privacy policy for details.',
    thirdPartyWikimediaHeading: 'Wikimedia',
    thirdPartyWikimediaBody: isJa
      ? '一部の画像はWikimedia Commonsにリンクしています。当サイトはWikipediaの画像をホスティングしておらず、外部リンクのみを提供しています。'
      : isKo
        ? '일부 이미지는 Wikimedia Commons에 링크되어 있습니다. 본 사이트는 Wikipedia 이미지를 직접 호스팅하지 않으며 외부 링크만 제공합니다.'
        : 'Some images are linked to Wikimedia Commons. This site does not host Wikipedia images — we only link to external file pages.',

    rightsHeading: isJa ? '4. ユーザーの権利（GDPR）' : isKo ? '4. 이용자 권리(GDPR)' : '4. User Rights (GDPR)',
    rightsAdsOptOut: isJa
      ? 'パーソナライズ広告のオプトアウト：'
      : isKo
        ? '개인화 광고 거부: '
        : 'Opt out of personalized ads: ',
    rightsAdsOptOutLink: isJa ? 'Google広告設定を開く' : isKo ? 'Google 광고 설정 열기' : 'Open Google Ad Settings',
    rightsCookiesBody: isJa
      ? 'Cookieの無効化：ブラウザの設定からCookieを無効化できます（例：Chrome設定 → プライバシーとセキュリティ → Cookie）。一部の機能が利用できなくなる場合があります。'
      : isKo
        ? '쿠키 비활성화: 브라우저 설정에서 쿠키를 비활성화할 수 있습니다(예: Chrome 설정 → 개인정보 및 보안 → 쿠키). 일부 기능이 제한될 수 있습니다.'
        : 'Disable cookies: You can disable cookies in your browser settings (e.g. Chrome Settings → Privacy and Security → Cookies). Some features may be limited.',

    retentionHeading: isJa ? '5. データ保存について' : isKo ? '5. 데이터 보존' : '5. Data Retention',
    retentionBody: isJa
      ? '当サイトのサーバーには個人データを保存していません。アナリティクスデータはVercelのインフラ上で匿名化された形で処理されます。'
      : isKo
        ? '본 사이트 서버에는 개인 데이터를 저장하지 않습니다. 애널리틱스 데이터는 Vercel 인프라에서 익명화된 형태로 처리됩니다.'
        : 'We do not store personal data on our servers. Analytics data is processed in anonymized form on Vercel\'s infrastructure.',

    contactHeading: isJa ? '6. お問い合わせ' : isKo ? '6. 문의' : '6. Contact',
    contactBody: isJa
      ? 'プライバシーに関するご質問やデータ関連のお問い合わせは、下記メールアドレスまでお送りください。'
      : isKo
        ? '개인정보 관련 질문 또는 데이터 관련 문의는 아래 이메일로 보내주세요.'
        : 'For privacy-related questions or data-related inquiries, please contact us at:',
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

          {/* Introduction */}
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-[var(--g-ink)] font-[family-name:var(--font-klee-one)] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--g-brand)]" />
              {t.introHeading}
            </h2>
            <p className="text-xs sm:text-sm text-[var(--ink-soft)] leading-relaxed">{t.introBody}</p>
          </section>

          {/* Data We Collect */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[var(--g-ink)] font-[family-name:var(--font-klee-one)] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--g-brand)]" />
              {t.dataHeading}
            </h2>
            <div className="space-y-3 pl-4">
              <div>
                <h3 className="text-sm font-semibold text-[var(--g-ink)] mb-1">{t.dataAnalyticsHeading}</h3>
                <p className="text-xs sm:text-sm text-[var(--ink-soft)] leading-relaxed">{t.dataAnalyticsBody}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--g-ink)] mb-1">{t.dataCookiesHeading}</h3>
                <p className="text-xs sm:text-sm text-[var(--ink-soft)] leading-relaxed">{t.dataCookiesBody}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--g-ink)] mb-1">{t.dataAdsHeading}</h3>
                <p className="text-xs sm:text-sm text-[var(--ink-soft)] leading-relaxed">{t.dataAdsBody}</p>
              </div>
            </div>
          </section>

          {/* Third-Party Services */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[var(--g-ink)] font-[family-name:var(--font-klee-one)] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--g-brand)]" />
              {t.thirdPartyHeading}
            </h2>
            <div className="space-y-3 pl-4">
              <div>
                <h3 className="text-sm font-semibold text-[var(--g-ink)] mb-1">{t.thirdPartyAdSenseHeading}</h3>
                <p className="text-xs sm:text-sm text-[var(--ink-soft)] leading-relaxed">
                  {t.thirdPartyAdSenseBody}{' '}
                  <a
                    href="https://adssettings.google.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-2 hover:text-[var(--g-brand)] transition-colors font-medium"
                  >
                    {t.thirdPartyAdSenseLink}
                  </a>
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--g-ink)] mb-1">{t.thirdPartyVercelHeading}</h3>
                <p className="text-xs sm:text-sm text-[var(--ink-soft)] leading-relaxed">
                  {t.thirdPartyVercelBody}{' '}
                  <a
                    href="https://vercel.com/legal/privacy-policy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-2 hover:text-[var(--g-brand)] transition-colors"
                  >
                    vercel.com/legal/privacy-policy
                  </a>
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--g-ink)] mb-1">{t.thirdPartyWikimediaHeading}</h3>
                <p className="text-xs sm:text-sm text-[var(--ink-soft)] leading-relaxed">{t.thirdPartyWikimediaBody}</p>
              </div>
            </div>
          </section>

          {/* User Rights */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[var(--g-ink)] font-[family-name:var(--font-klee-one)] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--g-brand)]" />
              {t.rightsHeading}
            </h2>
            <p className="text-xs sm:text-sm text-[var(--ink-soft)] leading-relaxed">
              {t.rightsAdsOptOut}
              <a
                href="https://adssettings.google.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-[var(--g-brand)] transition-colors font-medium"
              >
                {t.rightsAdsOptOutLink}
              </a>
            </p>
            <p className="text-xs sm:text-sm text-[var(--ink-soft)] leading-relaxed">{t.rightsCookiesBody}</p>
          </section>

          {/* Data Retention */}
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-[var(--g-ink)] font-[family-name:var(--font-klee-one)] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--g-brand)]" />
              {t.retentionHeading}
            </h2>
            <p className="text-xs sm:text-sm text-[var(--ink-soft)] leading-relaxed">{t.retentionBody}</p>
          </section>

          {/* Contact */}
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-[var(--g-ink)] font-[family-name:var(--font-klee-one)] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--g-brand)]" />
              {t.contactHeading}
            </h2>
            <p className="text-xs sm:text-sm text-[var(--ink-soft)] leading-relaxed">{t.contactBody}</p>
            <p>
              <a
                href="mailto:royaljjong@gmail.com"
                className="text-sm font-semibold text-[var(--g-brand)] font-mono hover:underline underline-offset-2 transition-colors"
              >
                royaljjong@gmail.com
              </a>
            </p>
            <p className="text-xs text-[var(--ink-faint)] pt-2">
              <Link href="/contact" className="underline underline-offset-2 hover:text-[var(--g-brand)] transition-colors">
                {isJa ? 'お問い合わせページへ' : isKo ? '문의 페이지로' : 'Go to Contact page'}
              </Link>
            </p>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
}
