import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { getGroup, getGroups, getMembers } from '@/lib/data';
import { routing } from '@/i18n/routing';
import { AmbientBackground } from '@/components/background/AmbientBackground';
import { Navigation } from '@/components/ui/Navigation';
import { Footer } from '@/components/ui/Footer';
import { GroupHeader } from '@/components/group/GroupHeader';
import { GroupView } from '@/components/group/GroupView';

interface GroupPageProps {
  params: Promise<{ locale: string; groupId: string }>;
}

export function generateStaticParams() {
  const groups = getGroups();
  return routing.locales.flatMap((locale) =>
    groups.map((g) => ({
      locale,
      groupId: g.id,
    })),
  );
}

export default async function GroupPage({ params }: GroupPageProps) {
  const { locale, groupId } = await params;
  setRequestLocale(locale);

  const group = getGroup(groupId);
  if (!group) {
    notFound();
  }

  const members = getMembers({ groupId });

  return (
    <div className="relative min-h-screen flex flex-col justify-between">
      <AmbientBackground groupId={group.id} motif={group.motif} />
      <Navigation />

      <main id="main-content" className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-8 flex-1">
        <GroupHeader group={group} locale={locale} />
        <GroupView group={group} members={members} locale={locale} />
      </main>

      <Footer />
    </div>
  );
}
