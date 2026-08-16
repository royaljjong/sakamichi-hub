'use client';

import React, { useState, useEffect } from 'react';
import type { Group, Member } from '@/lib/schema';
import { GroupTabs, type TabType } from './GroupTabs';
import { MemberGrid } from '@/components/member/MemberGrid';
import { GenerationSection } from '@/components/generation/GenerationSection';

interface GroupViewProps {
  group: Group;
  members: Member[];
  locale: string;
}

export function GroupView({ group, members, locale }: GroupViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>('current');

  useEffect(() => {
    document.documentElement.setAttribute('data-group', group.id);
  }, [group.id]);

  const activeMembers = members.filter((m) => m.status === 'active');
  const graduatedMembers = members.filter((m) => m.status === 'graduated');

  return (
    <div>
      <GroupTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        groupId={group.id}
        locale={locale}
      />

      {activeTab === 'current' && (
        <MemberGrid members={activeMembers} group={group} locale={locale} />
      )}

      {activeTab === 'graduated' && (
        <MemberGrid members={graduatedMembers} group={group} locale={locale} />
      )}

      {activeTab === 'byGen' && (
        <div className="space-y-12">
          {group.generations.map((gen) => {
            const genMembers = members.filter((m) =>
              m.memberships.some(
                (ms) => ms.groupId === group.id && ms.generationId === gen.id,
              ),
            );
            return (
              <GenerationSection
                key={gen.id}
                generation={gen}
                members={genMembers}
                group={group}
                locale={locale}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
