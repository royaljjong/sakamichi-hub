import { setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { Link } from '@/i18n/routing';
import { AmbientBackground } from '@/components/background/AmbientBackground';
import { Navigation } from '@/components/ui/Navigation';
import { Footer } from '@/components/ui/Footer';

interface AboutPageProps {
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function AboutPage({ params }: AboutPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="relative min-h-screen flex flex-col justify-between">
      <AmbientBackground groupId="home" motif="mixed" />
      <Navigation />

      <main id="main-content" className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full">
        <div className="text-center mb-12">
          <span className="text-xs uppercase tracking-widest text-[var(--g-brand)] font-semibold mb-2 block font-[family-name:var(--font-zen-kaku)]">
            About & Disclaimers
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--g-ink)] font-[family-name:var(--font-klee-one)] mb-3">
            このサイトについて / 안내
          </h1>
        </div>

        <div className="space-y-8 bg-[var(--white-veil)] p-6 sm:p-10 rounded-[32px] border border-[color-mix(in_oklab,var(--g-ink)_12%,transparent)] shadow-[var(--shadow-soft)] backdrop-blur-md">
          {/* 1. Unofficial Notice */}
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-[var(--g-ink)] font-[family-name:var(--font-klee-one)] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--g-brand)]" />
              1. 非公式ファンサイト宣言 / 비공식 팬사이트 선언
            </h2>
            <p className="text-xs sm:text-sm text-[var(--ink-soft)] leading-relaxed">
              当サイトはファンが運営する非公式・非営利のリンクハブです。乃木坂46 / 櫻坂46 / 日向坂46 および所属運営会社（株式会社Seed & Flower、株式会社ソニー・ミュージックレーベルズ）とは一切関係がありません。
            </p>
            <p className="text-xs sm:text-sm text-[var(--ink-soft)] leading-relaxed">
              본 사이트는 팬이 운영하는 비공식·비영리 사이트입니다. 乃木坂46 / 櫻坂46 / 日向坂46 및 운영사(株式会社Seed & Flower, 株式会社Sony Music Labels)와 일체 관계가 없습니다.
            </p>
          </section>

          {/* 2. Content Policy */}
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-[var(--g-ink)] font-[family-name:var(--font-klee-one)] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--g-brand)]" />
              2. コンテンツポリシー / 콘텐츠 정책
            </h2>
            <p className="text-xs sm:text-sm text-[var(--ink-soft)] leading-relaxed">
              当サイトは肖像権および著作権を尊重し、メンバーの顔写真、グループ公式ロゴ、音源、ブログ本文の転載・ホスティングを一切行いません。公式プロフィールや公式ブログ等へのリンク情報のみを提供します。
            </p>
            <p className="text-xs sm:text-sm text-[var(--ink-soft)] leading-relaxed">
              본 사이트는 인물 사진, 로고, 음원, 블로그 본문을 일절 게재하지 않습니다. 공식 페이지로의 검증된 링크 정보만을 제공합니다.
            </p>
          </section>

          {/* 3. Sources & Attribution */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[var(--g-ink)] font-[family-name:var(--font-klee-one)] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--g-brand)]" />
              3. 出典・ライセンス / 출처・라이선스
            </h2>
            <p className="text-xs sm:text-sm text-[var(--ink-soft)] leading-relaxed">
              メンバー情報・公式リンクは以下の出典を使用しています。
            </p>
            <ul className="space-y-1.5 text-xs sm:text-sm text-[var(--ink-soft)] leading-relaxed list-none">
              <li className="flex gap-2">
                <span className="text-[var(--g-brand)] shrink-0">·</span>
                <span>乃木坂46 / 櫻坂46 / 日向坂46 各公式サイト</span>
              </li>
              <li className="flex gap-2">
                <span className="text-[var(--g-brand)] shrink-0">·</span>
                <span>AKB48グループ各公式サイト（AKB48 / SKE48 / NMB48 / HKT48 / NGT48 / STU48）</span>
              </li>
              <li className="flex gap-2">
                <span className="text-[var(--g-brand)] shrink-0">·</span>
                <span>
                  <strong>日本語版Wikipedia（jawiki）</strong> —{' '}
                  <a
                    href="https://creativecommons.org/licenses/by-sa/4.0/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-2 hover:text-[var(--g-brand)] transition-colors"
                  >
                    CC BY-SA 4.0
                  </a>{' '}
                  ライセンス。メンバープロフィールデータ、ハングル転写、フォーマット変換を含む。著作権はwikipedia jawiki編集者の皆様に帰属。
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-[var(--g-brand)] shrink-0">·</span>
                <span>Wikimedia Commons — 各ファイルページへリンク（本サイトでホスティング不可）</span>
              </li>
            </ul>
            <p className="text-xs sm:text-sm text-[var(--ink-soft)] leading-relaxed">
              일부 멤버 프로필은 일본어 위키백과(jawiki) 문서를 출처로 하며, 한글 자동 전사 및 포맷 조정이 포함됩니다. CC BY-SA 4.0 라이선스. 저작권은 위키백과 jawiki 편집자 여러분께 귀속됩니다.
            </p>
            <p className="text-xs text-[var(--ink-faint)] font-[family-name:var(--font-zen-kaku)]">
              最終データ確認日: 2026-08-23 ·{' '}
              <Link
                href="/credits"
                className="underline underline-offset-2 hover:text-[var(--g-brand)] transition-colors"
              >
                詳細クレジット / 상세 출처
              </Link>
            </p>
          </section>

          {/* 4. Takedown Requests */}
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-[var(--g-ink)] font-[family-name:var(--font-klee-one)] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--g-brand)]" />
              4. 削除要請・お問い合わせ / 삭제 요청 및 문의
            </h2>
            <p className="text-xs sm:text-sm text-[var(--ink-soft)] leading-relaxed">
              権利者様からの削除要請やお問い合わせには迅速に対応いたします。下記メールアドレスまでご連絡ください。
            </p>
            <p className="text-xs sm:text-sm font-semibold text-[var(--g-brand)] font-mono">
              contact@sakamichi-hub.example.com
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
