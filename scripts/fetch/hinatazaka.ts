import { safeFetch } from '../lib/fetcher';
import { kanaToHepburn, formatPersonRomaji, toSlug } from '../lib/romaji';
import { kanaToHangul } from '../lib/hangul';
import { generateAvatar } from '../lib/avatar';
import type { Member, MemberLink, LocalizedText } from '../../src/lib/schema';

const HINATA_GEN_MAP: Record<string, { genId: string; joinedOn: string; joinedUnder: string }> = {
  // 1期生
  '1': { genId: 'hina-g1', joinedOn: '2016-05-08', joinedUnder: 'hiragana-keyaki' },
  '2': { genId: 'hina-g1', joinedOn: '2016-05-08', joinedUnder: 'hiragana-keyaki' },
  '4': { genId: 'hina-g1', joinedOn: '2016-05-08', joinedUnder: 'hiragana-keyaki' },
  '7': { genId: 'hina-g1', joinedOn: '2016-05-08', joinedUnder: 'hiragana-keyaki' },
  '8': { genId: 'hina-g1', joinedOn: '2016-05-08', joinedUnder: 'hiragana-keyaki' },
  '10': { genId: 'hina-g1', joinedOn: '2016-05-08', joinedUnder: 'hiragana-keyaki' },
  // 2期生
  '12': { genId: 'hina-g2', joinedOn: '2017-08-13', joinedUnder: 'hiragana-keyaki' },
  '13': { genId: 'hina-g2', joinedOn: '2017-08-13', joinedUnder: 'hiragana-keyaki' },
  '14': { genId: 'hina-g2', joinedOn: '2017-08-13', joinedUnder: 'hiragana-keyaki' },
  '15': { genId: 'hina-g2', joinedOn: '2017-08-13', joinedUnder: 'hiragana-keyaki' },
  '16': { genId: 'hina-g2', joinedOn: '2017-08-13', joinedUnder: 'hiragana-keyaki' },
  '17': { genId: 'hina-g2', joinedOn: '2017-08-13', joinedUnder: 'hiragana-keyaki' },
  '18': { genId: 'hina-g2', joinedOn: '2017-08-13', joinedUnder: 'hiragana-keyaki' },
  // 3期生
  '20': { genId: 'hina-g3', joinedOn: '2018-11-29', joinedUnder: 'hinatazaka46' },
  '21': { genId: 'hina-g3', joinedOn: '2020-02-16', joinedUnder: 'hinatazaka46' },
  '22': { genId: 'hina-g3', joinedOn: '2020-02-16', joinedUnder: 'hinatazaka46' },
  '23': { genId: 'hina-g3', joinedOn: '2020-02-16', joinedUnder: 'hinatazaka46' },
  // 4期生 (25 ~ 36)
  '25': { genId: 'hina-g4', joinedOn: '2022-09-21', joinedUnder: 'hinatazaka46' },
  '26': { genId: 'hina-g4', joinedOn: '2022-09-21', joinedUnder: 'hinatazaka46' },
  '27': { genId: 'hina-g4', joinedOn: '2022-09-21', joinedUnder: 'hinatazaka46' },
  '28': { genId: 'hina-g4', joinedOn: '2022-09-21', joinedUnder: 'hinatazaka46' },
  '29': { genId: 'hina-g4', joinedOn: '2022-09-21', joinedUnder: 'hinatazaka46' },
  '30': { genId: 'hina-g4', joinedOn: '2022-09-21', joinedUnder: 'hinatazaka46' },
  '31': { genId: 'hina-g4', joinedOn: '2022-09-21', joinedUnder: 'hinatazaka46' },
  '32': { genId: 'hina-g4', joinedOn: '2022-09-21', joinedUnder: 'hinatazaka46' },
  '33': { genId: 'hina-g4', joinedOn: '2022-09-21', joinedUnder: 'hinatazaka46' },
  '34': { genId: 'hina-g4', joinedOn: '2022-09-21', joinedUnder: 'hinatazaka46' },
  '35': { genId: 'hina-g4', joinedOn: '2022-09-21', joinedUnder: 'hinatazaka46' },
  '36': { genId: 'hina-g4', joinedOn: '2022-09-21', joinedUnder: 'hinatazaka46' },
  // 5期生 (37 ~ 46)
  '37': { genId: 'hina-g5', joinedOn: '2025-03-01', joinedUnder: 'hinatazaka46' },
  '38': { genId: 'hina-g5', joinedOn: '2025-03-01', joinedUnder: 'hinatazaka46' },
  '39': { genId: 'hina-g5', joinedOn: '2025-03-01', joinedUnder: 'hinatazaka46' },
  '40': { genId: 'hina-g5', joinedOn: '2025-03-01', joinedUnder: 'hinatazaka46' },
  '41': { genId: 'hina-g5', joinedOn: '2025-03-01', joinedUnder: 'hinatazaka46' },
  '42': { genId: 'hina-g5', joinedOn: '2025-03-01', joinedUnder: 'hinatazaka46' },
  '43': { genId: 'hina-g5', joinedOn: '2025-03-01', joinedUnder: 'hinatazaka46' },
  '44': { genId: 'hina-g5', joinedOn: '2025-03-01', joinedUnder: 'hinatazaka46' },
  '45': { genId: 'hina-g5', joinedOn: '2025-03-01', joinedUnder: 'hinatazaka46' },
  '46': { genId: 'hina-g5', joinedOn: '2025-03-01', joinedUnder: 'hinatazaka46' },
};

export async function fetchHinatazaka(): Promise<Member[]> {
  console.log('Fetching Hinatazaka46 artist search page...');
  const res = await safeFetch('https://www.hinatazaka46.com/s/official/search/artist?ima=0000');
  if (!res.ok) {
    throw new Error(`Failed to fetch Hinatazaka search page: ${res.status}`);
  }

  // Find all unique data-member
  const matches = Array.from(res.text.matchAll(/<li class="p-member__item" data-member="([^"]+)">([\s\S]*?)<\/li>/g));
  const uniqueItems = new Map<string, string>();
  for (const m of matches) {
    const code = m[1];
    if (code && !uniqueItems.has(code)) {
      uniqueItems.set(code, m[2] || '');
    }
  }

  const members: Member[] = [];
  const seenSlugs = new Set<string>();

  for (const [code, html] of Array.from(uniqueItems.entries())) {
    const nameMatch = html.match(/<div class="c-member__name">([\s\S]*?)<\/div>/);
    const kanaMatch = html.match(/<div class="c-member__kana">([\s\S]*?)<\/div>/);
    const imgMatch = html.match(/<div class="c-member__thumb"[^>]*>[\s\S]*?<img [^>]*src="([^"]+)"/) || html.match(/<img [^>]*src="([^"]+)"/);

    let imageUrl: string | null = null;
    if (imgMatch && imgMatch[1]) {
      const rawImg = imgMatch[1];
      imageUrl = rawImg.startsWith('http') ? rawImg : `https://www.hinatazaka46.com${rawImg}`;
    }

    const rawKanji = nameMatch && nameMatch[1] ? nameMatch[1].replace(/\s+/g, ' ').trim() : '';
    let rawKana = kanaMatch && kanaMatch[1] ? kanaMatch[1].replace(/\s+/g, ' ').trim() : '';

    const profileUrl = `https://www.hinatazaka46.com/s/official/artist/${code}?ima=0000`;
    let birthDate: string | null = null;
    let birthplace: LocalizedText | null = null;
    const personalLinks: MemberLink[] = [];

    try {
      const pRes = await safeFetch(profileUrl);
      if (pRes.ok) {
        if (!rawKana) {
          const pKanaMatch = pRes.text.match(/<div class="c-member__kana">([\s\S]*?)<\/div>/);
          if (pKanaMatch && pKanaMatch[1]) {
            rawKana = pKanaMatch[1].replace(/\s+/g, ' ').trim();
          }
        }
        const bMatch = pRes.text.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
        if (bMatch && bMatch[1] && bMatch[2] && bMatch[3]) {
          birthDate = `${bMatch[1]}-${bMatch[2].padStart(2, '0')}-${bMatch[3].padStart(2, '0')}`;
        }
        const bpMatch = pRes.text.match(/出身地<\/dt>\s*<dd[^>]*>([^<]+)<\/dd>/) ||
                        pRes.text.match(/出身地[\s\S]*?<div class="c-member__info-text">([^<]+)<\/div>/);
        if (bpMatch && bpMatch[1]) {
          const bpJa = bpMatch[1].trim();
          birthplace = {
            ja: bpJa,
            ko: bpJa,
            en: bpJa,
          };
        }
        // Extract personal Instagram / X (exclude official group accounts)
        const allLinks = Array.from(pRes.text.matchAll(/href="(https:\/\/(?:www\.)?(?:instagram\.com|x\.com)\/[^"]+)"/g));
        for (const al of allLinks) {
          const u = al[1];
          if (u && !u.includes('hinatazaka46') && !u.includes('hinatazakanew')) {
            const isInsta = u.includes('instagram');
            personalLinks.push({
              type: isInsta ? 'instagram' : 'x',
              url: u,
              label: null,
              isOfficial: true,
              status: 'unverified',
              lastCheckedAt: null,
              lastStatusCode: null,
            });
          }
        }
      }
    } catch (e) {
      console.warn(`[hinatazaka46] Could not fetch profile details for ${code}: ${e}`);
    }

    if (!rawKanji || !rawKana) continue;
    const kanjiClean = rawKanji.replace(/\s+/g, '');
    const kanaClean = rawKana.trim();

    let slug = toSlug('hina', kanaClean);
    if (seenSlugs.has(slug)) {
      slug = `${slug}-2`;
    }
    seenSlugs.add(slug);

    const genInfo = HINATA_GEN_MAP[code] || {
      genId: parseInt(code, 10) >= 37 ? 'hina-g5' : parseInt(code, 10) >= 25 ? 'hina-g4' : 'hina-g3',
      joinedOn: '2022-09-21',
      joinedUnder: 'hinatazaka46',
    };

    const links: MemberLink[] = [
      {
        type: 'official_profile',
        url: profileUrl,
        label: null,
        isOfficial: true,
        status: 'unverified',
        lastCheckedAt: null,
        lastStatusCode: null,
      },
      {
        type: 'official_blog',
        url: `https://www.hinatazaka46.com/s/official/diary/member/list?ima=0000&ct=${code}`,
        label: null,
        isOfficial: true,
        status: 'unverified',
        lastCheckedAt: null,
        lastStatusCode: null,
      },
      ...personalLinks,
    ];

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
        aliases: [rawKanji],
      },
      primaryGroupId: 'hinatazaka46',
      primaryGenerationId: genInfo.genId,
      status: 'active',
      memberships: [
        {
          groupId: 'hinatazaka46',
          generationId: genInfo.genId,
          joinedOn: genInfo.joinedOn,
          leftOn: null,
          isConcurrent: false,
          endReason: null,
        },
      ],
      birthDate,
      birthplace,
      officialCode: code,
      imageUrl,
      links,
      provenance: {
        source: 'official',
        sourceUrl: 'https://www.hinatazaka46.com/s/official/search/artist?ima=0000',
        checkedAt: new Date().toISOString().slice(0, 10),
        note: 'auto-converted, needs human review for hangul',
      },
      avatar: generateAvatar(slug, kanjiClean),
    };

    members.push(member);
  }

  console.log(`[hinatazaka46] Collected ${members.length} members (All active from official search page)`);
  return members;
}
