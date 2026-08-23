import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { routing } from '@/i18n/routing';
import { AmbientBackground } from '@/components/background/AmbientBackground';
import { Navigation } from '@/components/ui/Navigation';
import { Footer } from '@/components/ui/Footer';
import { Link } from '@/i18n/routing';

interface ContactPageProps {
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: ContactPageProps): Promise<Metadata> {
  const { locale } = await params;
  const isJa = locale === 'ja';
  const isKo = locale === 'ko';

  const title = isJa
    ? 'お問い合わせ | 坂道・48グループ リンクハブ'
    : isKo
      ? '문의 | 사카미치・48그룹 링크 허브'
      : 'Contact | Sakamichi & 48 Group Link Hub';

  const description = isJa
    ? '削除要請、情報修正、一般的なお問い合わせはこちらからご連絡ください。'
    : isKo
      ? '삭제 요청, 정보 수정, 일반 문의는 여기서 연락해 주세요.'
      : 'For takedown requests, corrections, or general inquiries, please contact us here.';

  return { title, description };
}

export default async function ContactPage({ params }: ContactPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const isJa = locale === 'ja';
  const isKo = locale === 'ko';

  const t = {
    kicker: 'Contact',
    pageTitle: isJa ? 'お問い合わせ' : isKo ? '문의' : 'Contact',
    intro: isJa
      ? '下記メールアドレスよりご連絡ください。'
      : isKo
        ? '아래 이메일로 연락해 주세요.'
        : 'Please reach out via email below.',

    emailLabel: isJa ? 'メールアドレス' : isKo ? '이메일' : 'Email',

    purposesHeading: isJa ? 'お問い合わせ内容' : isKo ? '문의 목적' : 'Purposes',
    purposeTakedown: isJa ? '削除要請（権利者様優先対応）' : isKo ? '삭제 요청 (권리자 우선 대응)' : 'Takedown requests (rights holders receive priority)',
    purposeCorrection: isJa ? '情報の修正・追加' : isKo ? '정보 수정·추가' : 'Data corrections or additions',
    purposeGeneral: isJa ? '一般的なお問い合わせ' : isKo ? '일반 문의' : 'General inquiries',

    responseHeading: isJa ? '返信について' : isKo ? '답변 안내' : 'Response Time',
    responseBody: isJa
      ? '7日以内の返信を目指しています。権利者様（管理会社・アーティスト）からの削除要請は優先的に対応いたします。'
      : isKo
        ? '7일 이내 답변을 목표로 합니다. 권리자(운영사·아티스트)의 삭제 요청은 우선 처리합니다.'
        : 'We aim to respond within 7 days. Takedown requests from rights holders (management companies, artists) will receive priority response.',

    takedownNoteHeading: isJa ? '権利者の方へ' : isKo ? '권리자 분들께' : 'Note for Rights Holders',
    takedownNoteBody: isJa
      ? '当サイトはファンが運営する非営利サイトです。権利侵害のご連絡をいただいた場合、速やかに該当コンテンツを削除または修正いたします。'
      : isKo
        ? '본 사이트는 팬이 운영하는 비영리 사이트입니다. 권리 침해 연락을 받은 경우 해당 콘텐츠를 신속히 삭제 또는 수정하겠습니다.'
        : 'This is a non-commercial fan site. Upon receiving a valid takedown notice, we will promptly remove or correct the relevant content.',

    linksHeading: isJa ? '関連ページ' : isKo ? '관련 페이지' : 'Related Pages',
    linkPrivacy: isJa ? 'プライバシーポリシー' : isKo ? '개인정보 처리방침' : 'Privacy Policy',
    linkTerms: isJa ? '利用規約' : isKo ? '이용약관' : 'Terms of Service',
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
          <p className="text-sm text-[var(--ink-soft)]">{t.intro}</p>
        </div>

        <div className="space-y-8 bg-[var(--white-veil)] p-6 sm:p-10 rounded-[32px] border border-[color-mix(in_oklab,var(--g-ink)_12%,transparent)] shadow-[var(--shadow-soft)] backdrop-blur-md">

          {/* Email */}
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-[var(--g-ink)] font-[family-name:var(--font-klee-one)] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--g-brand)]" />
              {t.emailLabel}
            </h2>
            <p>
              <a
                href="mailto:royaljjong@gmail.com"
                className="text-base font-semibold text-[var(--g-brand)] font-mono hover:underline underline-offset-2 transition-colors"
              >
                royaljjong@gmail.com
              </a>
            </p>
          </section>

          {/* Purposes */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[var(--g-ink)] font-[family-name:var(--font-klee-one)] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--g-brand)]" />
              {t.purposesHeading}
            </h2>
            <ul className="space-y-2">
              <li className="text-xs sm:text-sm text-[var(--ink-soft)] leading-relaxed flex gap-2">
                <span className="text-[var(--g-brand)] shrink-0">·</span>
                <span>{t.purposeTakedown}</span>
              </li>
              <li className="text-xs sm:text-sm text-[var(--ink-soft)] leading-relaxed flex gap-2">
                <span className="text-[var(--g-brand)] shrink-0">·</span>
                <span>{t.purposeCorrection}</span>
              </li>
              <li className="text-xs sm:text-sm text-[var(--ink-soft)] leading-relaxed flex gap-2">
                <span className="text-[var(--g-brand)] shrink-0">·</span>
                <span>{t.purposeGeneral}</span>
              </li>
            </ul>
          </section>

          {/* Response Time */}
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-[var(--g-ink)] font-[family-name:var(--font-klee-one)] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--g-brand)]" />
              {t.responseHeading}
            </h2>
            <p className="text-xs sm:text-sm text-[var(--ink-soft)] leading-relaxed">{t.responseBody}</p>
          </section>

          {/* Takedown Note */}
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-[var(--g-ink)] font-[family-name:var(--font-klee-one)] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--g-brand)]" />
              {t.takedownNoteHeading}
            </h2>
            <p className="text-xs sm:text-sm text-[var(--ink-soft)] leading-relaxed">{t.takedownNoteBody}</p>
          </section>

          {/* Related Links */}
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-[var(--ink-soft)] font-[family-name:var(--font-zen-kaku)]">
              {t.linksHeading}
            </h2>
            <div className="flex gap-4 text-xs">
              <Link
                href="/privacy-policy"
                className="underline underline-offset-2 hover:text-[var(--g-brand)] transition-colors text-[var(--ink-soft)]"
              >
                {t.linkPrivacy}
              </Link>
              <Link
                href="/terms"
                className="underline underline-offset-2 hover:text-[var(--g-brand)] transition-colors text-[var(--ink-soft)]"
              >
                {t.linkTerms}
              </Link>
            </div>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
}
