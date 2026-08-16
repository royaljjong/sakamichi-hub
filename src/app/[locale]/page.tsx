import { setRequestLocale } from 'next-intl/server';
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
      <Navigation showBrand={false} />

      <main id="main-content" className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 flex-1 w-full">
        {/* Centered Title */}
        <div className="text-center max-w-2xl mx-auto my-10 sm:my-16">
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-[var(--g-ink)] font-[family-name:var(--font-klee-one)]">
            坂道シリーズ リンクハブ
          </h1>
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
