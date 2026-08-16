import { kanaToHepburn, formatPersonRomaji, toSlug } from '../lib/romaji';
import { kanaToHangul } from '../lib/hangul';
import { generateAvatar } from '../lib/avatar';
import type { Member, MemberLink } from '../../src/lib/schema';

interface GradSeed {
  kanji: string;
  kana: string;
  groupId: 'sakurazaka46' | 'hinatazaka46';
  genId: string;
  joinedOn: string;
  leftOn: string;
  birthDate?: string;
  sns?: { type: 'instagram' | 'x' | 'youtube' | 'official_profile' | 'agency'; url: string }[];
}

const GRADUATES_SEED: GradSeed[] = [
  // Sakurazaka / Keyakizaka 1期生
  {
    kanji: '平手友梨奈',
    kana: 'ひらて ゆりな',
    groupId: 'sakurazaka46',
    genId: 'saku-g1',
    joinedOn: '2015-08-21',
    leftOn: '2020-01-23',
    birthDate: '2001-06-25',
    sns: [{ type: 'official_profile', url: 'https://cloud9-pro.com/artist/profile/yurinahirate/' }],
  },
  {
    kanji: '長濱ねる',
    kana: 'ながはま ねる',
    groupId: 'sakurazaka46',
    genId: 'saku-g1',
    joinedOn: '2015-11-30',
    leftOn: '2019-07-30',
    birthDate: '1998-09-04',
    sns: [
      { type: 'x', url: 'https://x.com/neru_and_staff' },
      { type: 'instagram', url: 'https://www.instagram.com/nerunagahama_' },
    ],
  },
  {
    kanji: '菅井友香',
    kana: 'すがい ゆうか',
    groupId: 'sakurazaka46',
    genId: 'saku-g1',
    joinedOn: '2015-08-21',
    leftOn: '2022-11-09',
    birthDate: '1995-11-29',
    sns: [
      { type: 'x', url: 'https://x.com/yuuka_s_official' },
      { type: 'instagram', url: 'https://www.instagram.com/yuuka_sugai_official/' },
    ],
  },
  {
    kanji: '渡邉理佐',
    kana: 'わたなべ りさ',
    groupId: 'sakurazaka46',
    genId: 'saku-g1',
    joinedOn: '2015-08-21',
    leftOn: '2022-05-22',
    birthDate: '1998-07-27',
    sns: [
      { type: 'x', url: 'https://x.com/risa_and_staff' },
      { type: 'instagram', url: 'https://www.instagram.com/_risawatanabe_/' },
    ],
  },
  {
    kanji: '小林由依',
    kana: 'こばやし ゆい',
    groupId: 'sakurazaka46',
    genId: 'saku-g1',
    joinedOn: '2015-08-21',
    leftOn: '2024-02-01',
    birthDate: '1999-10-23',
    sns: [
      { type: 'instagram', url: 'https://www.instagram.com/_yui_kobayashi/' },
    ],
  },
  {
    kanji: '土生瑞穂',
    kana: 'はぶ みづほ',
    groupId: 'sakurazaka46',
    genId: 'saku-g1',
    joinedOn: '2015-08-21',
    leftOn: '2023-11-25',
    birthDate: '1997-07-07',
    sns: [
      { type: 'instagram', url: 'https://www.instagram.com/habumizuho/' },
    ],
  },
  {
    kanji: '守屋茜',
    kana: 'もりや あかね',
    groupId: 'sakurazaka46',
    genId: 'saku-g1',
    joinedOn: '2015-08-21',
    leftOn: '2021-12-19',
    birthDate: '1997-11-12',
    sns: [
      { type: 'instagram', url: 'https://www.instagram.com/akane.moriya_official/' },
    ],
  },
  {
    kanji: '渡辺梨加',
    kana: 'わたなべ りか',
    groupId: 'sakurazaka46',
    genId: 'saku-g1',
    joinedOn: '2015-08-21',
    leftOn: '2021-12-19',
    birthDate: '1995-05-16',
    sns: [
      { type: 'instagram', url: 'https://www.instagram.com/watanabe.rika.official/' },
    ],
  },
  {
    kanji: '今泉佑唯',
    kana: 'いまいずみ ゆい',
    groupId: 'sakurazaka46',
    genId: 'saku-g1',
    joinedOn: '2015-08-21',
    leftOn: '2018-11-04',
    birthDate: '1998-09-30',
  },
  {
    kanji: '志田愛佳',
    kana: 'しだ まなか',
    groupId: 'sakurazaka46',
    genId: 'saku-g1',
    joinedOn: '2015-08-21',
    leftOn: '2018-11-16',
    birthDate: '1998-11-23',
    sns: [{ type: 'instagram', url: 'https://www.instagram.com/manaka.shida.98/' }],
  },
  {
    kanji: '鈴本美愉',
    kana: 'すずもと みゆ',
    groupId: 'sakurazaka46',
    genId: 'saku-g1',
    joinedOn: '2015-08-21',
    leftOn: '2020-01-23',
    birthDate: '1997-12-05',
    sns: [{ type: 'instagram', url: 'https://www.instagram.com/suzumoto__miyu/' }],
  },
  {
    kanji: '織田奈那',
    kana: 'おだ なな',
    groupId: 'sakurazaka46',
    genId: 'saku-g1',
    joinedOn: '2015-08-21',
    leftOn: '2020-01-23',
    birthDate: '1998-06-04',
    sns: [{ type: 'instagram', url: 'https://www.instagram.com/odanana924/' }],
  },
  {
    kanji: '原田葵',
    kana: 'はらだ あおい',
    groupId: 'sakurazaka46',
    genId: 'saku-g1',
    joinedOn: '2015-08-21',
    leftOn: '2022-06-11',
    birthDate: '2000-05-07',
    sns: [{ type: 'instagram', url: 'https://www.instagram.com/harada_aoi_/' }],
  },
  {
    kanji: '尾関梨香',
    kana: 'おぜき りか',
    groupId: 'sakurazaka46',
    genId: 'saku-g1',
    joinedOn: '2015-08-21',
    leftOn: '2022-09-11',
    birthDate: '1997-10-07',
    sns: [{ type: 'instagram', url: 'https://www.instagram.com/rika_ozeki97/' }],
  },
  {
    kanji: '関有美子',
    kana: 'せき ゆみこ',
    groupId: 'sakurazaka46',
    genId: 'saku-g2',
    joinedOn: '2018-11-29',
    leftOn: '2023-04-30',
    birthDate: '1998-06-29',
    sns: [{ type: 'instagram', url: 'https://www.instagram.com/_yumiko_seki_/' }],
  },

  // Hinatazaka Graduates
  {
    kanji: '齊藤京子',
    kana: 'さいとう きょうこ',
    groupId: 'hinatazaka46',
    genId: 'hina-g1',
    joinedOn: '2016-05-08',
    leftOn: '2024-04-05',
    birthDate: '1997-09-05',
    sns: [
      { type: 'instagram', url: 'https://www.instagram.com/kyoko.saito_official/' },
      { type: 'x', url: 'https://x.com/saitokyoko_fc' },
    ],
  },
  {
    kanji: '影山優佳',
    kana: 'かげやま ゆうか',
    groupId: 'hinatazaka46',
    genId: 'hina-g1',
    joinedOn: '2016-05-08',
    leftOn: '2023-07-23',
    birthDate: '2001-05-08',
    sns: [
      { type: 'instagram', url: 'https://www.instagram.com/kageyamayuka_official/' },
    ],
  },
  {
    kanji: '渡邉美穂',
    kana: 'わたなべ みほ',
    groupId: 'hinatazaka46',
    genId: 'hina-g2',
    joinedOn: '2017-08-13',
    leftOn: '2022-07-31',
    birthDate: '2000-02-24',
    sns: [
      { type: 'x', url: 'https://x.com/mihowatanabestf' },
      { type: 'instagram', url: 'https://www.instagram.com/mihowatanabe_' },
    ],
  },
  {
    kanji: '潮紗理菜',
    kana: 'うしお さりな',
    groupId: 'hinatazaka46',
    genId: 'hina-g1',
    joinedOn: '2016-05-08',
    leftOn: '2023-12-09',
    birthDate: '1997-12-26',
    sns: [
      { type: 'instagram', url: 'https://www.instagram.com/sarina_ushio/' },
    ],
  },
  {
    kanji: '宮田愛萌',
    kana: 'みやた まなも',
    groupId: 'hinatazaka46',
    genId: 'hina-g2',
    joinedOn: '2017-08-13',
    leftOn: '2023-01-30',
    birthDate: '1998-04-28',
    sns: [
      { type: 'x', url: 'https://x.com/manamumemo' },
      { type: 'instagram', url: 'https://www.instagram.com/manamo_miyatas/' },
    ],
  },
  {
    kanji: '柿崎芽実',
    kana: 'かきざき めみ',
    groupId: 'hinatazaka46',
    genId: 'hina-g1',
    joinedOn: '2016-05-08',
    leftOn: '2019-08-11',
    birthDate: '2001-12-02',
  },
];

export function getGraduates(): Member[] {
  return GRADUATES_SEED.map((g) => {
    const kanjiClean = g.kanji.replace(/\s+/g, '');
    const kanaClean = g.kana.trim();
    const groupPrefix = g.groupId === 'sakurazaka46' ? 'saku' : 'hina';
    const slug = toSlug(groupPrefix, kanaClean);

    const links: MemberLink[] = (g.sns || []).map((s) => ({
      type: s.type as any,
      url: s.url,
      label: null,
      isOfficial: true,
      status: 'unverified',
      lastCheckedAt: null,
      lastStatusCode: null,
    }));

    const member: Member = {
      id: slug,
      name: {
        ja: {
          kanji: kanjiClean,
          kana: kanaClean,
        },
        ko: {
          hangul: kanaToHangul(kanaClean),
        },
        en: {
          romaji: formatPersonRomaji(kanaClean),
        },
        aliases: [g.kanji],
      },
      primaryGroupId: g.groupId,
      primaryGenerationId: g.genId,
      status: 'graduated',
      memberships: [
        {
          groupId: g.groupId,
          generationId: g.genId,
          joinedOn: g.joinedOn,
          leftOn: g.leftOn,
          isConcurrent: false,
          endReason: 'graduation',
        },
      ],
      birthDate: g.birthDate || null,
      birthplace: null,
      officialCode: null,
      imageUrl: null,
      links,
      provenance: {
        source: 'wikipedia_ja',
        sourceUrl: `https://ja.wikipedia.org/wiki/${encodeURIComponent(g.kanji)}`,
        checkedAt: new Date().toISOString().slice(0, 10),
        note: 'graduated member from wikipedia_ja CC BY-SA 4.0',
      },
      avatar: generateAvatar(slug, kanjiClean),
    };

    return member;
  });
}
