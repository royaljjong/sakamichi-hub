import { safeFetch } from '../lib/fetcher';
import { kanaToHepburn, formatPersonRomaji, toSlug } from '../lib/romaji';
import { kanaToHangul } from '../lib/hangul';
import { generateAvatar } from '../lib/avatar';
import type { Member, MemberLink, LocalizedText } from '../../src/lib/schema';

// Member generation mapping table for Sakurazaka46
const SAKURA_GEN_MAP: Record<string, { genId: string; joinedOn: string; joinedUnder: string }> = {
  // 1期生
  '03': { genId: 'saku-g1', joinedOn: '2015-08-21', joinedUnder: 'keyakizaka46' }, // 上村
  '06': { genId: 'saku-g1', joinedOn: '2015-08-21', joinedUnder: 'keyakizaka46' }, // 小池
  '08': { genId: 'saku-g1', joinedOn: '2015-08-21', joinedUnder: 'keyakizaka46' }, // 齋藤冬
  // 2期生
  '43': { genId: 'saku-g2', joinedOn: '2018-11-29', joinedUnder: 'keyakizaka46' }, // 井上
  '45': { genId: 'saku-g2', joinedOn: '2018-11-29', joinedUnder: 'keyakizaka46' }, // 武元
  '46': { genId: 'saku-g2', joinedOn: '2018-11-29', joinedUnder: 'keyakizaka46' }, // 田村
  '47': { genId: 'saku-g2', joinedOn: '2018-11-29', joinedUnder: 'keyakizaka46' }, // 藤吉
  '48': { genId: 'saku-g2', joinedOn: '2018-11-29', joinedUnder: 'keyakizaka46' }, // 松田
  '50': { genId: 'saku-g2', joinedOn: '2018-11-29', joinedUnder: 'keyakizaka46' }, // 森田
  '51': { genId: 'saku-g2', joinedOn: '2018-11-29', joinedUnder: 'keyakizaka46' }, // 山﨑
  // 新2期生
  '53': { genId: 'saku-g2-new', joinedOn: '2020-02-16', joinedUnder: 'keyakizaka46' }, // 遠藤光
  '54': { genId: 'saku-g2-new', joinedOn: '2020-02-16', joinedUnder: 'keyakizaka46' }, // 大園
  '55': { genId: 'saku-g2-new', joinedOn: '2020-02-16', joinedUnder: 'keyakizaka46' }, // 大沼
  '56': { genId: 'saku-g2-new', joinedOn: '2020-02-16', joinedUnder: 'keyakizaka46' }, // 幸阪
  '57': { genId: 'saku-g2-new', joinedOn: '2020-02-16', joinedUnder: 'keyakizaka46' }, // 増本
  '58': { genId: 'saku-g2-new', joinedOn: '2020-02-16', joinedUnder: 'keyakizaka46' }, // 守屋麗
  // 3期生 (59~69)
  '59': { genId: 'saku-g3', joinedOn: '2023-01-05', joinedUnder: 'sakurazaka46' }, // 石森
  '60': { genId: 'saku-g3', joinedOn: '2023-01-05', joinedUnder: 'sakurazaka46' }, // 遠藤理
  '61': { genId: 'saku-g3', joinedOn: '2023-01-05', joinedUnder: 'sakurazaka46' }, // 小田倉
  '62': { genId: 'saku-g3', joinedOn: '2023-01-05', joinedUnder: 'sakurazaka46' }, // 小島
  '63': { genId: 'saku-g3', joinedOn: '2023-01-05', joinedUnder: 'sakurazaka46' }, // 谷口
  '64': { genId: 'saku-g3', joinedOn: '2023-01-05', joinedUnder: 'sakurazaka46' }, // 中嶋
  '65': { genId: 'saku-g3', joinedOn: '2023-01-05', joinedUnder: 'sakurazaka46' }, // 的野
  '66': { genId: 'saku-g3', joinedOn: '2023-01-05', joinedUnder: 'sakurazaka46' }, // 向井
  '67': { genId: 'saku-g3', joinedOn: '2023-01-05', joinedUnder: 'sakurazaka46' }, // 村井
  '68': { genId: 'saku-g3', joinedOn: '2023-01-05', joinedUnder: 'sakurazaka46' }, // 村山
  '69': { genId: 'saku-g3', joinedOn: '2023-01-05', joinedUnder: 'sakurazaka46' }, // 山下瞳
  // 4期生 (70~78)
  '70': { genId: 'saku-g4', joinedOn: '2025-03-01', joinedUnder: 'sakurazaka46' }, // 浅井
  '71': { genId: 'saku-g4', joinedOn: '2025-03-01', joinedUnder: 'sakurazaka46' }, // 稲熊
  '72': { genId: 'saku-g4', joinedOn: '2025-03-01', joinedUnder: 'sakurazaka46' }, // 勝又
  '73': { genId: 'saku-g4', joinedOn: '2025-03-01', joinedUnder: 'sakurazaka46' }, // 佐藤
  '74': { genId: 'saku-g4', joinedOn: '2025-03-01', joinedUnder: 'sakurazaka46' }, // 中川
  '76': { genId: 'saku-g4', joinedOn: '2025-03-01', joinedUnder: 'sakurazaka46' }, // 松本
  '77': { genId: 'saku-g4', joinedOn: '2025-03-01', joinedUnder: 'sakurazaka46' }, // 山川
  '78': { genId: 'saku-g4', joinedOn: '2025-03-01', joinedUnder: 'sakurazaka46' }, // 山田
};

export async function fetchSakurazaka(): Promise<Member[]> {
  console.log('Fetching Sakurazaka46 artist search page...');
  const res = await safeFetch('https://sakurazaka46.com/s/s46/search/artist?ima=0000');
  if (!res.ok) {
    throw new Error(`Failed to fetch Sakurazaka search page: ${res.status}`);
  }

  const boxes = res.text.match(/<li class="box" data-member="([^"]+)">([\s\S]*?)<\/li>/g) || [];
  const members: Member[] = [];
  const seenSlugs = new Set<string>();

  for (const box of boxes) {
    const codeMatch = box.match(/data-member="([^"]+)"/);
    if (!codeMatch || !codeMatch[1]) continue;
    const code = codeMatch[1]; // preserve string '03', '53', etc.

    const nameMatch = box.match(/<p class="name">([^<]+)<\/p>/);
    const kanaMatch = box.match(/<p class="kana">([^<]+)<\/p>/);
    const imgMatch = box.match(/<img [^>]*src="([^"]+)"/);

    let imageUrl: string | null = null;
    if (imgMatch && imgMatch[1]) {
      const rawImg = imgMatch[1];
      imageUrl = rawImg.startsWith('http') ? rawImg : `https://sakurazaka46.com${rawImg}`;
    }

    const rawKanji = nameMatch && nameMatch[1] ? nameMatch[1].trim() : '';
    const rawKana = kanaMatch && kanaMatch[1] ? kanaMatch[1].trim() : '';
    if (!rawKanji || !rawKana) continue;

    const kanjiClean = rawKanji.replace(/\s+/g, '');
    const kanaClean = rawKana.trim();

    let slug = toSlug('saku', kanaClean);
    if (seenSlugs.has(slug)) {
      slug = `${slug}-2`;
    }
    seenSlugs.add(slug);

    const genInfo = SAKURA_GEN_MAP[code] || {
      genId: parseInt(code, 10) >= 70 ? 'saku-g4' : 'saku-g3',
      joinedOn: '2023-01-05',
      joinedUnder: 'sakurazaka46',
    };

    // Fetch individual profile for details and SNS links
    const profileUrl = `https://sakurazaka46.com/s/s46/artist/${code}?ima=0000`;
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
        url: `https://sakurazaka46.com/s/s46/diary/blog/list?ima=0000&ct=${code}`,
        label: null,
        isOfficial: true,
        status: 'unverified',
        lastCheckedAt: null,
        lastStatusCode: null,
      },
    ];

    let birthDate: string | null = null;
    let birthplace: LocalizedText | null = null;

    try {
      const pRes = await safeFetch(profileUrl);
      if (pRes.ok) {
        // Parse birthday: e.g. 生年月日 2001年10月3日 or 2001/10/03
        const bMatch = pRes.text.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
        if (bMatch && bMatch[1] && bMatch[2] && bMatch[3]) {
          birthDate = `${bMatch[1]}-${bMatch[2].padStart(2, '0')}-${bMatch[3].padStart(2, '0')}`;
        }
        // Parse birthplace
        const bpMatch = pRes.text.match(/出身地<\/dt>\s*<dd[^>]*>([^<]+)<\/dd>/);
        if (bpMatch && bpMatch[1]) {
          const bpJa = bpMatch[1].trim();
          birthplace = {
            ja: bpJa,
            ko: bpJa,
            en: bpJa,
          };
        }
        // Parse Instagram link
        const instaMatch = pRes.text.match(/href="(https:\/\/(?:www\.)?instagram\.com\/[^"]+)"/);
        if (instaMatch && instaMatch[1]) {
          links.push({
            type: 'instagram',
            url: instaMatch[1],
            label: null,
            isOfficial: true,
            status: 'unverified',
            lastCheckedAt: null,
            lastStatusCode: null,
          });
        }
      }
    } catch (e) {
      console.warn(`[sakurazaka46] Could not fetch profile details for ${code}: ${e}`);
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
        aliases: [rawKanji],
      },
      primaryGroupId: 'sakurazaka46',
      primaryGenerationId: genInfo.genId,
      status: 'active',
      memberships: [
        {
          groupId: 'sakurazaka46',
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
        sourceUrl: 'https://sakurazaka46.com/s/s46/search/artist?ima=0000',
        checkedAt: new Date().toISOString().slice(0, 10),
        note: 'auto-converted, needs human review for hangul',
      },
      avatar: generateAvatar(slug, kanjiClean),
    };

    members.push(member);
  }

  console.log(`[sakurazaka46] Collected ${members.length} members (All active from official search page)`);
  return members;
}
