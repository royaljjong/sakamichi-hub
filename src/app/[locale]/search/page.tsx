import { setRequestLocale } from 'next-intl/server';
import { useTranslations } from 'next-intl';
import { routing } from '@/i18n/routing';
import { AmbientBackground } from '@/components/background/AmbientBackground';
import { Navigation } from '@/components/ui/Navigation';
import { Footer } from '@/components/ui/Footer';
import { SearchBox } from '@/components/search/SearchBox';

interface SearchPageProps {
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function SearchPage({ params }: SearchPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="relative min-h-screen flex flex-col justify-between">
      <AmbientBackground groupId="home" motif="mixed" />
      <Navigation />

      <main id="main-content" className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full">
        <div className="text-center mb-10">
          <span className="text-xs uppercase tracking-widest text-[var(--g-brand)] font-semibold mb-2 block font-[family-name:var(--font-zen-kaku)]">
            Member Search
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--g-ink)] font-[family-name:var(--font-klee-one)] mb-3">
            メンバー検索
          </h1>
          <p className="text-xs sm:text-sm text-[var(--ink-soft)] max-w-md mx-auto leading-relaxed">
            漢字・かな・ローマ字・한글・초성 검색을 지원합니다.
          </p>
        </div>

        <SearchBox locale={locale} />
      </main>

      <Footer />
    </div>
  );
}
