import fs from 'node:fs';
import path from 'node:path';
import type { Member, MemberLink } from '../src/lib/schema';

type GroupId = 'akb48' | 'ske48' | 'hkt48' | 'ngt48';
type Candidate = { name: string; profileUrl: string; imageUrl: string };
type Detail = Candidate & { birthDate?: string; links: Partial<Record<MemberLink['type'], string>> };

const TODAY = new Date().toISOString().slice(0, 10);
const WRITE = process.argv.includes('--write');
const USER_AGENT = 'SakamichiBox/1.0 (+https://sakamichi-hub.vercel.app)';
const ACTIVE = new Set(['active', 'trainee', 'graduating']);
const GROUP_ACCOUNT_TOKENS = [
  'x.com/AKB48_staff',
  'instagram.com/akb48/',
  'twitter.com/ske48official',
  'instagram.com/official_ske48',
  'youtube.com/user/SKE48',
  'tiktok.com/@ske48official',
  'x.com/hkt48_official_',
  'instagram.com/official_hkt48',
  'tiktok.com/@hkt48official',
  'twitter.com/official_ngt48',
];

const configs: Record<GroupId, { listUrl: string; parse(html: string): Candidate[] }> = {
  akb48: {
    listUrl: 'https://www.akb48.co.jp/about/members/',
    parse: (html) => collect(html, /<a href="(\/about\/members\/detail\?mid=\d+)"[\s\S]*?<img src="(https:\/\/d2r1lkk9i7row\.cloudfront\.net\/[^"?]+)[^"]*" alt="([^"]+)"/g, 'https://www.akb48.co.jp'),
  },
  ske48: {
    listUrl: 'https://ske48.co.jp/feature/profile',
    parse: (html) => collect(html, /<figure class="thumb"><img src="(https:\/\/ske48\.co\.jp\/image\/profile\/member_[^"?]+)[^"]*"[^>]*alt="([^"]+)"[\s\S]*?<li><a href="(https:\/\/ske48\.co\.jp\/feature\/[^"]+)"[^>]*>PROFILE<\/a>/g, '', true),
  },
  hkt48: {
    listUrl: 'https://www.hkt48.jp/profile/',
    parse: (html) => collect(html, /<a href="(\/profile\/\d+)"><img src="(https:\/\/cf-pc\.c-hkt48\.com\/img\/profile\/images\/[^"?]+)[^"]*" alt="([^"]+)"/g, 'https://www.hkt48.jp'),
  },
  ngt48: {
    listUrl: 'https://ngt48.jp/profile',
    parse: (html) => collect(html, /<a href="(\/profile\/detail\/\d+)"><img src="(https:\/\/img\.ngt48\.com\/artist\/[^"?]+)[^"]*" alt="([^"]+)"/g, 'https://ngt48.jp'),
  },
};

function cleanName(value: string) {
  return decodeHtml(value).replace(/[\s　]+/g, '').normalize('NFKC');
}

function decodeHtml(value: string) {
  return value.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"');
}

function collect(html: string, regex: RegExp, base: string, skeOrder = false): Candidate[] {
  const out: Candidate[] = [];
  for (const match of html.matchAll(regex)) {
    const profile = skeOrder ? match[3] : match[1];
    const image = skeOrder ? match[1] : match[2];
    const name = skeOrder ? match[2] : match[3];
    if (!profile || !image || !name) continue;
    out.push({ name: cleanName(name), profileUrl: new URL(decodeHtml(profile), base || undefined).toString(), imageUrl: decodeHtml(image) });
  }
  return out;
}

async function get(url: string) {
  const response = await fetch(url, { headers: { 'user-agent': USER_AGENT }, signal: AbortSignal.timeout(20_000) });
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return response.text();
}

function parseBirthDate(html: string): string | undefined {
  const raw = html.match(/(?:生年月日<\/span>|生年月日<\/dt>\s*<dd[^>]*>|生年月日<\/th>\s*<td[^>]*>|生年月日<\/dt>[\s\S]{0,120}?<dd[^>]*>)(\d{4})[年\/]\s*(\d{1,2})[月\/]\s*(\d{1,2})日?/) ??
    html.match(/生年月日[\s\S]{0,160}?(\d{4})[年\/]\s*(\d{1,2})[月\/]\s*(\d{1,2})日?/);
  if (!raw?.[1] || !raw[2] || !raw[3]) return undefined;
  return `${raw[1]}-${raw[2].padStart(2, '0')}-${raw[3].padStart(2, '0')}`;
}

function parseSocialLinks(html: string, groupId: GroupId): Detail['links'] {
  const links: Detail['links'] = {};
  const ignored = GROUP_ACCOUNT_TOKENS;
  const candidates = Array.from(html.matchAll(/href="(https?:\/\/(?:x\.com|twitter\.com|www\.instagram\.com|instagram\.com|www\.tiktok\.com|tiktok\.com|www\.youtube\.com|youtube\.com)\/[^"?#]+[^"#]*)"/g))
    .map((match) => decodeHtml(match[1] ?? '').replace(/^http:\/\//, 'https://'))
    .filter((url) => url && !ignored.some((token) => url.includes(token)));
  for (const url of candidates) {
    const type: MemberLink['type'] | undefined = url.includes('instagram.com') ? 'instagram' : url.includes('tiktok.com') ? 'tiktok' : url.includes('youtube.com') ? 'youtube' : url.includes('x.com') || url.includes('twitter.com') ? 'x' : undefined;
    if (type && !links[type]) links[type] = url.replace('https://twitter.com/', 'https://x.com/');
  }
  return links;
}

function upsertLink(member: Member, type: MemberLink['type'], url: string) {
  const existing = member.links.find((link) => link.type === type);
  const next: MemberLink = {
    type,
    url,
    label: null,
    isOfficial: true,
    status: 'ok',
    lastCheckedAt: TODAY,
    lastStatusCode: 200,
  };
  if (existing) Object.assign(existing, next);
  else member.links.push(next);
}

async function mapLimit<T, R>(items: T[], limit: number, work: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = [];
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await work(items[index]!);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

async function main() {
  const membersPath = path.resolve('data/members.json');
  const members = JSON.parse(fs.readFileSync(membersPath, 'utf8')) as Member[];
  const changes: Array<{ memberId: string; fields: string[]; sourceUrl: string }> = [];
  const groups: Record<string, unknown> = {};

  for (const [groupId, config] of Object.entries(configs) as Array<[GroupId, typeof configs[GroupId]]>) {
    const listHtml = await get(config.listUrl);
    const candidates = config.parse(listHtml);
    const byName = new Map(candidates.map((candidate) => [candidate.name, candidate]));
    const targets = members.filter((member) => member.primaryGroupId === groupId && ACTIVE.has(member.status));
    const matched = targets.flatMap((member) => {
      const candidate = byName.get(cleanName(member.name.ja.kanji));
      return candidate ? [{ member, candidate }] : [];
    });
    const details = await mapLimit(matched, 4, async ({ member, candidate }) => {
      try {
        const html = await get(candidate.profileUrl);
        return { member, detail: { ...candidate, birthDate: parseBirthDate(html), links: parseSocialLinks(html, groupId) } };
      } catch (error) {
        return { member, detail: candidate, error: error instanceof Error ? error.message : String(error) };
      }
    });

    let changed = 0;
    for (const item of details) {
      if (!('links' in item.detail)) continue;
      const fields: string[] = [];
      const personalLinks = item.member.links.filter((link) => !GROUP_ACCOUNT_TOKENS.some((token) => link.url.includes(token)));
      if (personalLinks.length !== item.member.links.length) { item.member.links = personalLinks; fields.push('groupAccountLinksRemoved'); }
      if (item.detail.birthDate && item.member.birthDate !== item.detail.birthDate) { item.member.birthDate = item.detail.birthDate; fields.push('birthDate'); }
      if (item.member.imageUrl !== item.detail.imageUrl) { item.member.imageUrl = item.detail.imageUrl; fields.push('imageUrl'); }
      const before = JSON.stringify(item.member.links);
      upsertLink(item.member, 'official_profile', item.detail.profileUrl);
      for (const [type, url] of Object.entries(item.detail.links) as Array<[MemberLink['type'], string]>) upsertLink(item.member, type, url);
      if (JSON.stringify(item.member.links) !== before) fields.push('links');
      if (fields.length) {
        item.member.provenance = { source: 'official', sourceUrl: item.detail.profileUrl, checkedAt: TODAY, note: 'Verified from current official profile page' };
        changes.push({ memberId: item.member.id, fields, sourceUrl: item.detail.profileUrl });
        changed++;
      }
    }
    const matchedIds = new Set(matched.map(({ member }) => member.id));
    groups[groupId] = {
      source: config.listUrl,
      sourceStatus: 'verified',
      officialList: candidates.length,
      localActive: targets.length,
      matched: matched.length,
      unmatched: targets.filter((member) => !matchedIds.has(member.id)).map((member) => ({ id: member.id, name: member.name.ja.kanji })),
      changed,
    };
  }

  const coverage = Array.from(new Set(members.map((member) => member.primaryGroupId))).sort().map((groupId) => {
    const groupMembers = members.filter((member) => member.primaryGroupId === groupId);
    const active = groupMembers.filter((member) => ACTIVE.has(member.status));
    const hasLink = (member: Member, type: MemberLink['type']) => member.links.some((link) => link.type === type && link.isOfficial && link.status !== 'dead');
    return {
      groupId,
      total: groupMembers.length,
      active: active.length,
      activeMissing: {
        birthDate: active.filter((member) => !member.birthDate).length,
        imageUrl: active.filter((member) => !member.imageUrl).length,
        officialProfile: active.filter((member) => !hasLink(member, 'official_profile')).length,
        instagram: active.filter((member) => !hasLink(member, 'instagram')).length,
        x: active.filter((member) => !hasLink(member, 'x')).length,
        youtube: active.filter((member) => !hasLink(member, 'youtube')).length,
        tiktok: active.filter((member) => !hasLink(member, 'tiktok')).length,
      },
      liveSourceAudit: groupId in configs ? 'verified' : 'not-supported-or-blocked',
    };
  });
  const report = { checkedAt: TODAY, mode: WRITE ? 'write' : 'preview', totalMembers: members.length, groups, coverage, changes };
  fs.writeFileSync(path.resolve('data/profile-audit-report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  if (WRITE) fs.writeFileSync(membersPath, `${JSON.stringify(members, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify({ ...report, changes: changes.length }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
