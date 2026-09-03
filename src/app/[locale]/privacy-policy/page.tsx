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

  return { metadataBase: new URL('https://sakamichi-hub.vercel.app'), title, description };
}

export default async function PrivacyPolicyPage({ params }: PrivacyPolicyPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const isJa = locale === 'ja';
  const isKo = locale === 'ko';

  const t = {
    kicker: 'Privacy Policy',
    pageTitle: isJa ? 'プライバシーポリシー' : isKo ? '개인정보 처리방침' : 'Privacy Policy',
    lastUpdated: isJa ? '最終更新: 2026年8月25日' : isKo ? '최종 업데이트: 2026년 8월 25일' : 'Last updated: August 25, 2026',

    introHeading: isJa ? '1. はじめに' : isKo ? '1. 개요' : '1. Introduction',
    introBody: isJa
      ? '坂道・48グループ リンクハブ（以下「当サイト」）は、ユーザーのプライバシーを尊重します。本ポリシーでは、当サイトが収集する情報（アナリティクス、Cookie、広告）について説明します。当サイトをご利用いただくことで、本ポリシーに同意したものとみなします。'
      : isKo
        ? '사카미치・48그룹 링크 허브(이하 "본 사이트")는 이용자의 개인정보를 존중합니다. 본 방침은 본 사이트가 수집하는 정보(애널리틱스, 쿠키, 광고)에 대해 설명합니다. 본 사이트를 이용하심으로써 본 방침에 동의하신 것으로 간주합니다.'
        : 'Sakamichi & 48 Group Link Hub ("this site") respects your privacy. This policy explains what information we collect — including analytics, cookies, and advertising data. By using this site, you agree to this policy.',

    dataHeading: isJa ? '2. 収集する情報' : isKo ? '2. 수집하는 정보' : '2. Data We Collect',
    dataAccountHeading: isJa ? '非公開お問い合わせ' : isKo ? '비공개 문의' : 'Private inquiries',
    dataAccountBody: isJa
      ? '非公開お問い合わせ機能では、仮IDとパスワードの一方向ハッシュ、投稿内容、処理状態、回答を保存します。IDとパスワードの原文は保存しません。正しい組み合わせを知る投稿者、および運営者のみ閲覧できます。'
      : isKo
        ? '비공개 문의 기능은 임시 아이디와 비밀번호의 단방향 해시, 문의 내용, 처리 상태와 답변을 저장합니다. 아이디와 비밀번호 원문은 저장하지 않습니다. 올바른 조합을 아는 작성자 및 운영자만 열람할 수 있습니다.'
        : 'The private inquiry feature stores one-way hashes of the temporary ID and password, plus the message, status, and replies. Plaintext IDs and passwords are not stored. Only a visitor with the correct pair, and the administrator, can read the inquiries.',
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
    dataAdsHeading: isJa ? '広告' : isKo ? '광고' : 'Advertising',
    dataAdsBody: isJa
      ? '当サイトではGoogle AdSenseによる広告を表示しています。Googleおよびその広告パートナーは、広告の配信・測定・不正防止のためにCookie等を使用する場合があります。表示される広告は、地域・端末設定・同意状況に応じてパーソナライズまたは非パーソナライズされることがあります。'
      : isKo
        ? '본 사이트는 Google AdSense 광고를 표시합니다. Google 및 광고 파트너는 광고 제공·측정·부정행위 방지를 위해 쿠키 등의 기술을 사용할 수 있습니다. 표시되는 광고는 지역, 기기 설정 및 동의 상태에 따라 개인 맞춤 또는 비개인 맞춤 방식일 수 있습니다.'
        : 'This site displays Google AdSense ads. Google and its advertising partners may use cookies or similar technologies for ad delivery, measurement, and fraud prevention. Ads may be personalized or non-personalized depending on your region, device settings, and consent choices.',

    thirdPartyHeading: isJa ? '3. サードパーティサービス' : isKo ? '3. 서드파티 서비스' : '3. Third-Party Services',
    thirdPartyAdSenseHeading: 'Google AdSense',
    thirdPartyAdSenseBody: isJa
      ? 'Google AdSenseは広告の配信および測定のためにCookie等を使用する場合があります。Googleの広告設定ページでパーソナライズ広告を管理できます。'
      : isKo
        ? 'Google AdSense는 광고 제공 및 측정을 위해 쿠키 등을 사용할 수 있습니다. Google 광고 설정 페이지에서 개인 맞춤 광고를 관리할 수 있습니다.'
        : 'Google AdSense may use cookies or similar technologies to deliver and measure ads. You can manage personalized advertising through Google\'s ad settings page.',
    thirdPartyAdSenseLink: isJa ? 'Google広告設定' : isKo ? 'Google 광고 설정' : 'Google Ad Settings',
    thirdPartyVercelHeading: 'Vercel',
    thirdPartyVercelBody: isJa
      ? '当サイトはVercelによりホスティングされており、Vercel Analyticsおよびインフラサービスを使用しています。詳細はVercelのプライバシーポリシーをご参照ください。'
      : isKo
        ? '본 사이트는 Vercel에 의해 호스팅되며, Vercel Analytics 및 인프라 서비스를 사용합니다. 자세한 내용은 Vercel의 개인정보 처리방침을 참조하세요.'
        : 'This site is hosted by Vercel and uses Vercel Analytics and infrastructure services. See Vercel\'s privacy policy for details.',
    thirdPartySupabaseHeading: 'Supabase',
    thirdPartySupabaseBody: isJa
      ? '非公開お問い合わせデータの保存とパスワード照合にSupabaseを使用します。公開ロールにはテーブルの直接閲覧権限を付与しません。'
      : isKo
        ? '비공개 문의 데이터 저장과 비밀번호 확인에 Supabase를 사용합니다. 공개 역할에는 테이블 직접 조회 권한을 부여하지 않습니다.'
        : 'Supabase stores private inquiries and verifies inquiry passwords. Public roles are not granted direct access to the inquiry table.',
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
      ? '仮IDのハッシュと投稿内容は、対応および履歴確認に必要な期間保存します。削除のご要望はお問い合わせページから送信できます。アナリティクスデータはVercelのインフラ上で匿名化された形で処理されます。'
      : isKo
        ? '임시 아이디 해시와 작성 내용은 문의 처리 및 이력 확인에 필요한 기간 동안 보관합니다. 삭제 요청은 문의 페이지에서 제출할 수 있습니다. 애널리틱스 데이터는 Vercel 인프라에서 익명화된 형태로 처리됩니다.'
        : 'Temporary-ID hashes and messages are retained as needed to handle requests and maintain their history. Deletion requests can be submitted through the inquiry page. Analytics data is processed in anonymized form on Vercel\'s infrastructure.',

    contactHeading: isJa ? '6. お問い合わせ' : isKo ? '6. 문의' : '6. Contact',
    contactBody: isJa
      ? 'プライバシーやデータに関するご質問は、非公開お問い合わせページから送信してください。'
      : isKo
        ? '개인정보 또는 데이터 관련 문의는 비공개 문의 페이지에서 제출해 주세요.'
        : 'Submit privacy or data-related questions through the private inquiry page.',
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
                <h3 className="text-sm font-semibold text-[var(--g-ink)] mb-1">{t.dataAccountHeading}</h3>
                <p className="text-xs sm:text-sm text-[var(--ink-soft)] leading-relaxed">{t.dataAccountBody}</p>
              </div>
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
                <h3 className="text-sm font-semibold text-[var(--g-ink)] mb-1">{t.thirdPartySupabaseHeading}</h3>
                <p className="text-xs sm:text-sm text-[var(--ink-soft)] leading-relaxed">{t.thirdPartySupabaseBody}</p>
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
