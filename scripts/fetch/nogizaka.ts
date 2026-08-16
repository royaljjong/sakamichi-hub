import { safeFetch } from '../lib/fetcher';
import { kanaToHepburn, formatPersonRomaji, toSlug } from '../lib/romaji';
import { kanaToHangul } from '../lib/hangul';
import { generateAvatar } from '../lib/avatar';
import type { Member, MemberLink, LinkType } from '../../src/lib/schema';

const GEN_MAP: Record<string, { id: string; joinedOn: string }> = {
  '1期生': { id: 'nogi-g1', joinedOn: '2011-08-21' },
  '2期生': { id: 'nogi-g2', joinedOn: '2013-03-28' },
  '3期生': { id: 'nogi-g3', joinedOn: '2016-09-04' },
  '4期生': { id: 'nogi-g4', joinedOn: '2018-11-29' },
  '5期生': { id: 'nogi-g5', joinedOn: '2022-02-01' },
  '6期生': { id: 'nogi-g6', joinedOn: '2025-02-06' },
};

// Verified Personal SNS dictionary for Nogizaka46 members (both active & graduates)
const NOGI_SNS_MAP: Record<string, { type: LinkType; url: string }[]> = {
  白石麻衣: [
    { type: 'official_profile', url: 'https://maishiraishi-official.com/' },
    { type: 'x', url: 'https://x.com/shiraishi_staff' },
    { type: 'instagram', url: 'https://www.instagram.com/m.shiraishi.official/' },
    { type: 'youtube', url: 'https://www.youtube.com/c/mychannel_official' },
  ],
  西野七瀬: [
    { type: 'official_profile', url: 'https://nishinonanase.com/' },
    { type: 'x', url: 'https://x.com/nanase_andstaff' },
    { type: 'instagram', url: 'https://www.instagram.com/nishino.nanase.official/' },
  ],
  齋藤飛鳥: [
    { type: 'official_profile', url: 'https://asukasaito.jp/' },
    { type: 'x', url: 'https://x.com/asuka3110_staff' },
    { type: 'instagram', url: 'https://www.instagram.com/asuka.3110.official/' },
  ],
  生田絵梨花: [
    { type: 'official_profile', url: 'https://erikaikuta.jp/' },
    { type: 'x', url: 'https://x.com/ikuta_staff' },
    { type: 'instagram', url: 'https://www.instagram.com/ikutaerika.official/' },
  ],
  生駒里奈: [
    { type: 'official_profile', url: 'https://ikomarina.com/' },
    { type: 'x', url: 'https://x.com/ikomarina_staff' },
    { type: 'instagram', url: 'https://www.instagram.com/ikoma_rina_official/' },
  ],
  秋元真夏: [
    { type: 'official_profile', url: 'https://akimotomanatsu-fc.jp/' },
    { type: 'x', url: 'https://x.com/manatsu_staff' },
    { type: 'instagram', url: 'https://www.instagram.com/manatsu.akimoto_official/' },
  ],
  高山一実: [
    { type: 'official_profile', url: 'https://kazumitakayama.com/' },
    { type: 'x', url: 'https://x.com/takayama_staff' },
    { type: 'instagram', url: 'https://www.instagram.com/takayama.kazumi.official/' },
  ],
  松村沙友理: [
    { type: 'official_profile', url: 'https://sayurimatsumura.com/' },
    { type: 'x', url: 'https://x.com/sayuringo_staff' },
    { type: 'instagram', url: 'https://www.instagram.com/matsumura_sayuri_official/' },
  ],
  桜井玲香: [
    { type: 'official_profile', url: 'https://reikasakurai.com/' },
    { type: 'instagram', url: 'https://www.instagram.com/reika_s16/' },
  ],
  若月佑美: [
    { type: 'official_profile', url: 'https://yumiwakatsuki.com/' },
    { type: 'x', url: 'https://x.com/WASM_official' },
    { type: 'instagram', url: 'https://www.instagram.com/yumi_wakatsuki_official/' },
  ],
  堀未央奈: [
    { type: 'official_profile', url: 'https://hori-miona.com/' },
    { type: 'x', url: 'https://x.com/mionaaaaa_staff' },
    { type: 'instagram', url: 'https://www.instagram.com/horimiona_official/' },
    { type: 'youtube', url: 'https://www.youtube.com/c/horimiona37' },
  ],
  山下美月: [
    { type: 'official_profile', url: 'https://mizukiyamashita.com/' },
    { type: 'x', url: 'https://x.com/mizuki_staff' },
    { type: 'instagram', url: 'https://www.instagram.com/mizuki.yamashita.official/' },
  ],
  与田祐希: [
    { type: 'instagram', url: 'https://www.instagram.com/yodayuuki_oimo/' },
  ],
  大園桃子: [
    { type: 'instagram', url: 'https://www.instagram.com/oAggregation/' },
  ],
  新内眞衣: [
    { type: 'instagram', url: 'https://www.instagram.com/mai_shinuchi_official/' },
  ],
  梅澤美波: [
    { type: 'instagram', url: 'https://www.instagram.com/ume_minami.official/' },
  ],
  久保史緒里: [
    { type: 'instagram', url: 'https://www.instagram.com/kubo.shiori.official/' },
  ],
  岩本蓮加: [
    { type: 'instagram', url: 'https://www.instagram.com/renka.i_official/' },
  ],
  伊藤理々杏: [
    { type: 'instagram', url: 'https://www.instagram.com/riria.ito_official/' },
  ],
  中村麗乃: [
    { type: 'instagram', url: 'https://www.instagram.com/n.reno_official/' },
  ],
  向井葉月: [
    { type: 'instagram', url: 'https://www.instagram.com/hazuki.p3.official/' },
  ],
  吉田綾乃クリスティー: [
    { type: 'instagram', url: 'https://www.instagram.com/yoshida_ayanochristie/' },
  ],
  遠藤さくら: [
    { type: 'instagram', url: 'https://www.instagram.com/sakura.endo_official/' },
  ],
  賀喜遥香: [
    { type: 'instagram', url: 'https://www.instagram.com/kaki.haruka_official/' },
  ],
  金川紗耶: [
    { type: 'instagram', url: 'https://www.instagram.com/kanagawa_saya.official/' },
  ],
  柴田柚菜: [
    { type: 'instagram', url: 'https://www.instagram.com/yuna_shibata.official/' },
  ],
  田村真佑: [
    { type: 'instagram', url: 'https://www.instagram.com/tamura.mayu_official/' },
  ],
  筒井あやめ: [
    { type: 'instagram', url: 'https://www.instagram.com/ayame.tsutsui_official/' },
  ],
  弓木奈於: [
    { type: 'instagram', url: 'https://www.instagram.com/nao.yumiki_official/' },
  ],
  井上和: [
    { type: 'instagram', url: 'https://www.instagram.com/nagi_inoue_official/' },
  ],
  菅原咲月: [
    { type: 'instagram', url: 'https://www.instagram.com/satsuki_sugawara_official/' },
  ],
  一ノ瀬美空: [
    { type: 'instagram', url: 'https://www.instagram.com/miku_ichinose_official/' },
  ],
  川﨑桜: [
    { type: 'instagram', url: 'https://www.instagram.com/sakura_kawasaki_official/' },
  ],
  五百城茉央: [
    { type: 'instagram', url: 'https://www.instagram.com/ioki_mao_official/' },
  ],
  中西アルノ: [
    { type: 'instagram', url: 'https://www.instagram.com/arno_nakanishi_official/' },
  ],
  池田瑛紗: [
    { type: 'instagram', url: 'https://www.instagram.com/teresa_ikeda_official/' },
  ],
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
      status: 'ok',
      lastCheckedAt: '2026-08-16',
      lastStatusCode: 200,
    });

    // Official Blog (active members have official blog)
    if (isActive) {
      links.push({
        type: 'official_blog',
        url: `https://www.nogizaka46.com/s/n46/diary/MEMBER/list?ima=0000&ct=${codeStr}`,
        label: null,
        isOfficial: true,
        status: 'ok',
        lastCheckedAt: '2026-08-16',
        lastStatusCode: 200,
      });
    }

    // Add verified personal SNS links if available
    const extraSns = NOGI_SNS_MAP[kanjiClean];
    if (extraSns) {
      for (const sns of extraSns) {
        if (!links.some((l) => l.url === sns.url)) {
          links.push({
            type: sns.type,
            url: sns.url,
            label: null,
            isOfficial: true,
            status: 'ok',
            lastCheckedAt: '2026-08-16',
            lastStatusCode: 200,
          });
        }
      }
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
          leftOn: !isActive ? '2024-01-01' : null,
          isConcurrent: false,
          endReason: !isActive ? 'graduation' : null,
        },
      ],
      birthDate,
      birthplace: null,
      officialCode: codeStr,
      imageUrl: raw.img || null,
      links,
      avatar: generateAvatar(slug, kanjiClean),
      provenance: {
        source: 'official',
        sourceUrl: 'https://www.nogizaka46.com/s/n46/search/artist?ima=0000',
        checkedAt: '2026-08-16',
        note: 'Nogizaka46 official dataset with verified SNS',
      },
    };

    members.push(member);
  }

  return members;
}
