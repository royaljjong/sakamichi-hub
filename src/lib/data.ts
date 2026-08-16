import type {
  Group,
  Member,
  Generation,
  LineageEntry,
  MemberStatus,
} from './schema';
import groupsData from '../../data/groups.json';
import membersData from '../../data/members.json';
import latestUpdatesData from '../../data/latest-updates.json';
import type { RecentUpdate } from '@/components/home/LatestUpdatesMarquee';

const groups: Group[] = (groupsData as { groups: Group[] }).groups;
const members: Member[] = (membersData as Member[]) || [];
const latestUpdates: RecentUpdate[] = (latestUpdatesData as RecentUpdate[]) || [];

export function getGroups(): Group[] {
  return [...groups].sort((a, b) => a.order - b.order);
}

export function getGroup(id: string): Group | undefined {
  return groups.find((g) => g.id === id);
}

export function getGenerations(groupId: string): Generation[] {
  const group = getGroup(groupId);
  if (!group) return [];
  return [...group.generations].sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order;
    return a.sortSuffix - b.sortSuffix;
  });
}

export function getGeneration(
  groupId: string,
  genId: string,
): Generation | undefined {
  const generations = getGenerations(groupId);
  return generations.find((gen) => gen.id === genId);
}

export function getLineage(groupId: string): LineageEntry[] {
  const group = getGroup(groupId);
  if (!group) return [];
  return [...group.lineage].sort((a, b) => a.from.localeCompare(b.from));
}

export function getMembers(options?: {
  groupId?: string;
  generationId?: string;
  status?: MemberStatus | MemberStatus[];
}): Member[] {
  let result = members;

  if (options?.groupId) {
    result = result.filter((m) =>
      m.memberships.some((ms) => ms.groupId === options.groupId),
    );
  }

  if (options?.generationId) {
    result = result.filter((m) =>
      m.memberships.some((ms) => ms.generationId === options.generationId),
    );
  }

  if (options?.status) {
    const statuses = Array.isArray(options.status)
      ? options.status
      : [options.status];
    result = result.filter((m) => statuses.includes(m.status));
  }

  return result;
}

export function getMember(id: string): Member | undefined {
  return members.find((m) => m.id === id);
}

export function getSameGenerationMembers(
  memberId: string,
  groupId: string,
  genId: string,
): Member[] {
  return members.filter(
    (m) =>
      m.id !== memberId &&
      m.memberships.some(
        (ms) => ms.groupId === groupId && ms.generationId === genId,
      ),
  );
}

export function getLatestUpdates(): RecentUpdate[] {
  return latestUpdates;
}
