import { safeFetch } from '../lib/fetcher';
import { kanaToHepburn, formatPersonRomaji, toSlug } from '../lib/romaji';
import { kanaToHangul } from '../lib/hangul';
import { generateAvatar } from '../lib/avatar';
import type { Member, MemberLink } from '../../src/lib/schema';

const GEN_MAP: Record<string, { id: string; joinedOn: string }> = {
  '1期生': { id: 'nogi-g1', joinedOn: '2011-08-21' },
  '2期生': { id: 'nogi-g2', joinedOn: '2013-03-28' },
  '3期生': { id: 'nogi-g3', joinedOn: '2016-09-04' },
  '4期生': { id: 'nogi-g4', joinedOn: '2018-11-29' },
  '5期生': { id: 'nogi-g5', joinedOn: '2022-02-01' },
  '6期生': { id: 'nogi-g6', joinedOn: '2025-02-06' },
};

export async function fetchNogizaka(): Promise<Member[]> {
  console.log('Fetching Nogizaka46 member data from API...');
  const res = await safeFetch('https://www.nogizaka46.com/s/n46/api/list/member');
  if (!res.ok) {
    throw new Error(`Failed to fetch Nogizaka API: ${res.status}`);
  }

  const jsonMatch = res.text.match(/res\(([\s\S]*)\)/);
  if (!jsonMatch || !jsonMatch[1]) {
    throw new Error('Failed to parse Nogizaka API response format');
  }

  const data = JSON.parse(jsonMatch[1]);
  const rawList: any[] = data.data || [];

  const members: Member[] = [];
  const seenSlugs = new Set<string>();

  for (const raw of rawList) {
    if (!raw.cate || raw.code === '10001') continue; // skip group entry
    const genInfo = GEN_MAP[raw.cate];
    if (!genInfo) continue;

    const kanjiClean = raw.name.replace(/\s+/g, '');
    const kanaClean = raw.kana.trim();
    let slug = toSlug('nogi', kanaClean);

    if (seenSlugs.has(slug)) {
      slug = `${slug}-2`;
    }
    seenSlugs.add(slug);

    const isActive = raw.graduation !== 'YES';
    const status = isActive ? 'active' : 'graduated';

    let birthDate: string | null = null;
    if (raw.birthday && /^\d{4}\/\d{2}\/\d{2}$/.test(raw.birthday)) {
      birthDate = raw.birthday.replace(/\//g, '-');
    }

    const codeStr = String(raw.code);
    const links: MemberLink[] = [];

    // Official Profile
    links.push({
      type: 'official_profile',
      url: `https://www.nogizaka46.com/s/n46/artist/${codeStr}?ima=0000`,
      label: null,
      isOfficial: true,
      status: 'unverified',
      lastCheckedAt: null,
      lastStatusCode: null,
    });

    // Official Blog (active members have official blog)
    if (isActive) {
      links.push({
        type: 'official_blog',
        url: `https://www.nogizaka46.com/s/n46/diary/MEMBER/list?ima=0000&ct=${codeStr}`,
        label: null,
        isOfficial: true,
        status: 'unverified',
        lastCheckedAt: null,
        lastStatusCode: null,
      });
    }

    const romajiName = formatPersonRomaji(kanaClean);
    const hangulName = kanaToHangul(kanaClean);

    const member: Member = {
      id: slug,
      name: {
        ja: {
          kanji: kanjiClean,
          kana: kanaClean,
        },
        ko: {
          hangul: hangulName,
        },
        en: {
          romaji: romajiName,
        },
        aliases: [raw.english_name || '', raw.name].filter(Boolean),
      },
      primaryGroupId: 'nogizaka46',
      primaryGenerationId: genInfo.id,
      status,
      memberships: [
        {
          groupId: 'nogizaka46',
          generationId: genInfo.id,
          joinedOn: genInfo.joinedOn,
          leftOn: isActive ? null : '2024-01-01',
          isConcurrent: false,
          endReason: isActive ? null : 'graduation',
        },
      ],
      birthDate,
      birthplace: null,
      officialCode: codeStr,
      links,
      provenance: {
        source: 'official',
        sourceUrl: 'https://www.nogizaka46.com/s/n46/search/artist?ima=0000',
        checkedAt: new Date().toISOString().slice(0, 10),
        note: 'auto-converted, needs human review for hangul',
      },
      avatar: generateAvatar(slug, kanjiClean),
    };

    members.push(member);
  }

  console.log(`[nogizaka46] Collected ${members.length} members (Active: ${members.filter(m => m.status === 'active').length})`);
  return members;
}
