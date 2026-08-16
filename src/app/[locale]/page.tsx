import { setRequestLocale } from 'next-intl/server';
import { useTranslations } from 'next-intl';
import { getGroups, getMembers } from '@/lib/data';
import { AmbientBackground } from '@/components/background/AmbientBackground';
import { Navigation } from '@/components/ui/Navigation';
import { Footer } from '@/components/ui/Footer';
import { GroupCard } from '@/components/group/GroupCard';

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const groups = getGroups();
  const allMembers = getMembers();

  return (
    <div className="relative min-h-screen flex flex-col justify-between">
      <AmbientBackground groupId="home" motif="mixed" />
      <Navigation />

      <main id="main-content" className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-8 flex-1">
        {/* Hero Headline */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs uppercase tracking-widest text-[var(--g-brand)] font-semibold mb-2 block font-[family-name:var(--font-zen-kaku)]">
            Sakamichi Series Official Link Hub
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-[var(--g-ink)] font-[family-name:var(--font-klee-one)] mb-4">
            坂道シリーズ リンクハブ
          </h1>
          <p className="text-sm sm:text-base text-[var(--ink-soft)] leading-relaxed">
            乃木坂46・櫻坂46・日向坂46の現役・卒業メンバー公式リンク集。
          </p>
        </div>

        {/* 3 Large Group Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          {groups.map((group) => {
            const groupMembers = allMembers.filter((m) =>
              m.memberships.some((ms) => ms.groupId === group.id),
            );
            return (
              <GroupCard
                key={group.id}
                group={group}
                members={groupMembers}
                locale={locale}
              />
            );
          })}
        </div>
      </main>

      <Footer />
    </div>
  );
}
