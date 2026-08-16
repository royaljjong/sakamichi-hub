import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <HomeContent locale={locale} />;
}

function HomeContent({ locale }: { locale: string }) {
  const t = useTranslations('common');
  const tNav = useTranslations('nav');

  return (
    <main className="max-w-4xl mx-auto px-6 py-16">
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          {t('siteName')}
        </h1>
        <p className="text-sm text-[var(--ink-soft)]">
          Current Locale: <span className="font-semibold text-[var(--ink)]">{locale}</span>
        </p>
      </header>

      <nav className="flex justify-center gap-4 mb-8">
        <Link
          href="/"
          locale="ja"
          className="px-4 py-2 rounded-full border border-[var(--ink-faint)] hover:bg-[var(--paper-deep)] transition"
        >
          日本語 (ja)
        </Link>
        <Link
          href="/"
          locale="ko"
          className="px-4 py-2 rounded-full border border-[var(--ink-faint)] hover:bg-[var(--paper-deep)] transition"
        >
          한국어 (ko)
        </Link>
        <Link
          href="/"
          locale="en"
          className="px-4 py-2 rounded-full border border-[var(--ink-faint)] hover:bg-[var(--paper-deep)] transition"
        >
          English (en)
        </Link>
      </nav>

      <section className="bg-[var(--white-veil)] p-8 rounded-3xl shadow-[var(--shadow-soft)] border border-[color-mix(in_oklab,var(--g-ink)_8%,transparent)]">
        <h2 className="text-xl font-semibold mb-4">{tNav('home')}</h2>
        <p className="text-[var(--ink-soft)]">
          Phase 0 Skeleton verified. /ja, /ko, /en i18n routing active.
        </p>
      </section>
    </main>
  );
}
