import type {
  Group,
  Member,
  Generation,
  LineageEntry,
  MemberStatus,
  FranchiseKind,
  RegionKind,
} from './schema';
import groupsData from '../../data/groups.json';
import membersData from '../../data/members.json';
import latestUpdatesData from '../../data/latest-updates.json';
import portalData from '../../data/portal.json';
import latestVideosData from '../../data/latest-videos.json';
import { PortalDataset } from './portal-schema';
import type { RecentUpdate } from '@/lib/updates-schema';
import type { MemberVideo } from './videos-schema';
import type { Single } from './discography-schema';

// Discography — optional; file may not exist yet (manual fetch step)
function loadDiscography(): Single[] {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const raw = require('../../data/discography.json') as { singles?: Single[] };
    return Array.isArray(raw.singles) ? raw.singles : [];
  } catch {
    return [];
  }
}

const discographySingles: Single[] = loadDiscography();

const groups: Group[] = (groupsData as { groups: Group[] }).groups;
const members: Member[] = (membersData as Member[]) || [];
const latestUpdates: RecentUpdate[] = (latestUpdatesData as RecentUpdate[]) || [];
const portal = PortalDataset.parse(portalData);

export function getGroups(options?: {
  franchise?: FranchiseKind;
  region?: RegionKind;
}): Group[] {
  let result = [...groups].sort((a, b) => a.order - b.order);
  if (options?.franchise) {
    result = result.filter((g) => (g.franchise || 'sakamichi') === options.franchise);
  }
  if (options?.region) {
    result = result.filter((g) => (g.region || 'domestic') === options.region);
  }
  return result;
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
  return latestUpdates.filter((update) => Boolean(update.memberId));
}

export function getPortalData() {
  return portal;
}

export function getLatestVideos(): MemberVideo[] {
  return (latestVideosData as MemberVideo[]) || [];
}

export function getDiscography(): Single[] {
  return discographySingles;
}

export function getGroupSingles(groupId: string, limit?: number): Single[] {
  const filtered = discographySingles
    .filter((s) => s.groupId === groupId)
    .sort((a, b) => b.number - a.number); // latest first
  return limit !== undefined ? filtered.slice(0, limit) : filtered;
}
