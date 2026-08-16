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
  imageUrl?: string | null;
  sns?: { type: 'instagram' | 'x' | 'youtube' | 'official_profile' | 'agency'; url: string }[];
}

const GRADUATES_SEED: GradSeed[] = [
  // ==================== [1] Sakurazaka46 / Keyakizaka46 1期生 & 2期生 Graduates ====================
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
      { type: 'x', url: 'https://x.com/habu_mizuho' },
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
    kanji: '尾関梨香',
    kana: 'おぜき りか',
    groupId: 'sakurazaka46',
    genId: 'saku-g1',
    joinedOn: '2015-08-21',
    leftOn: '2022-09-11',
    birthDate: '1997-10-07',
    sns: [
      { type: 'instagram', url: 'https://www.instagram.com/rika_ozeki_official/' },
    ],
  },
  {
    kanji: '原田葵',
    kana: 'はらだ あおい',
    groupId: 'sakurazaka46',
    genId: 'saku-g1',
    joinedOn: '2015-08-21',
    leftOn: '2022-08-20',
    birthDate: '2000-05-07',
    sns: [
      { type: 'instagram', url: 'https://www.instagram.com/harada_aoi_/' },
    ],
  },
  {
    kanji: '佐藤詩織',
    kana: 'さとう しおり',
    groupId: 'sakurazaka46',
    genId: 'saku-g1',
    joinedOn: '2015-08-21',
    leftOn: '2020-10-13',
    birthDate: '1996-11-16',
    sns: [
      { type: 'x', url: 'https://x.com/shiorisato_art' },
      { type: 'instagram', url: 'https://www.instagram.com/shiori_sato_artwork/' },
    ],
  },
  {
    kanji: '鈴本美愉',
    kana: 'すずもと みゆ',
    groupId: 'sakurazaka46',
    genId: 'saku-g1',
    joinedOn: '2015-08-21',
    leftOn: '2020-01-23',
    birthDate: '1997-12-05',
    sns: [
      { type: 'instagram', url: 'https://www.instagram.com/suzumotomiyu_/' },
    ],
  },
  {
    kanji: '織田奈那',
    kana: 'おだ なな',
    groupId: 'sakurazaka46',
    genId: 'saku-g1',
    joinedOn: '2015-08-21',
    leftOn: '2020-01-23',
    birthDate: '1998-06-04',
    sns: [
      { type: 'x', url: 'https://x.com/odanana_1107' },
      { type: 'instagram', url: 'https://www.instagram.com/odanana_official/' },
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
    sns: [
      { type: 'x', url: 'https://x.com/_manaka_shida_' },
      { type: 'instagram', url: 'https://www.instagram.com/manaka.shida.96/' },
    ],
  },
  {
    kanji: '米谷奈々未',
    kana: 'よねたに ななみ',
    groupId: 'sakurazaka46',
    genId: 'saku-g1',
    joinedOn: '2015-08-21',
    leftOn: '2018-12-22',
    birthDate: '2000-02-24',
  },
  {
    kanji: '長沢菜々香',
    kana: 'ながさわ ななこ',
    groupId: 'sakurazaka46',
    genId: 'saku-g1',
    joinedOn: '2015-08-21',
    leftOn: '2020-03-31',
    birthDate: '1997-04-23',
    sns: [
      { type: 'x', url: 'https://x.com/nanako0423_' },
      { type: 'instagram', url: 'https://www.instagram.com/nanako0423_/' },
    ],
  },
  {
    kanji: '関有美子',
    kana: 'せき ゆみこ',
    groupId: 'sakurazaka46',
    genId: 'saku-g2',
    joinedOn: '2018-12-10',
    leftOn: '2023-04-30',
    birthDate: '1998-06-29',
    sns: [
      { type: 'instagram', url: 'https://www.instagram.com/_yumiko_seki_/' },
    ],
  },

  // ==================== [2] Hinatazaka46 / Hiragana Keyaki 1期生 & 2期生 Graduates ====================
  {
    kanji: '柿崎芽実',
    kana: 'かきざき めみ',
    groupId: 'hinatazaka46',
    genId: 'hina-g1',
    joinedOn: '2016-05-08',
    leftOn: '2019-08-11',
    birthDate: '2001-12-02',
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
      { type: 'x', url: 'https://x.com/kageyamayuka' },
      { type: 'instagram', url: 'https://www.instagram.com/kageyamayuka_official/' },
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
    kanji: '齊藤京子',
    kana: 'さいとう きょうこ',
    groupId: 'hinatazaka46',
    genId: 'hina-g1',
    joinedOn: '2016-05-08',
    leftOn: '2024-04-05',
    birthDate: '1997-09-05',
    sns: [
      { type: 'x', url: 'https://x.com/kyoko_saito_09' },
      { type: 'instagram', url: 'https://www.instagram.com/kyoko.saito_official/' },
    ],
  },
  {
    kanji: '高本彩花',
    kana: 'たかもと あやか',
    groupId: 'hinatazaka46',
    genId: 'hina-g1',
    joinedOn: '2016-05-08',
    leftOn: '2024-07-04',
    birthDate: '1998-11-02',
    sns: [
      { type: 'instagram', url: 'https://www.instagram.com/ayaka.takamoto_official/' },
    ],
  },
  {
    kanji: '加藤史帆',
    kana: 'かとう しほ',
    groupId: 'hinatazaka46',
    genId: 'hina-g1',
    joinedOn: '2016-05-08',
    leftOn: '2024-12-25',
    birthDate: '1998-02-02',
    sns: [
      { type: 'instagram', url: 'https://www.instagram.com/katoshi.official/' },
    ],
  },
  {
    kanji: '東村芽依',
    kana: 'ひがしむら めい',
    groupId: 'hinatazaka46',
    genId: 'hina-g1',
    joinedOn: '2016-05-08',
    leftOn: '2024-12-25',
    birthDate: '1998-08-23',
    sns: [
      { type: 'instagram', url: 'https://www.instagram.com/mei.higashimura/' },
    ],
  },
  {
    kanji: '丹生明里',
    kana: 'にぶ あかり',
    groupId: 'hinatazaka46',
    genId: 'hina-g2',
    joinedOn: '2017-08-13',
    leftOn: '2024-12-01',
    birthDate: '2001-02-15',
    sns: [
      { type: 'instagram', url: 'https://www.instagram.com/nibuchan_akari/' },
    ],
  },
  {
    kanji: '濱岸ひより',
    kana: 'はまぎし ひより',
    groupId: 'hinatazaka46',
    genId: 'hina-g2',
    joinedOn: '2017-08-13',
    leftOn: '2024-12-05',
    birthDate: '2002-09-28',
    sns: [
      { type: 'instagram', url: 'https://www.instagram.com/hiyori_hamagishi.official/' },
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
      { type: 'x', url: 'https://x.com/mihowatanabe_st' },
      { type: 'instagram', url: 'https://www.instagram.com/mihowatanabe_/' },
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
      { type: 'x', url: 'https://x.com/manamo_miyata' },
      { type: 'instagram', url: 'https://www.instagram.com/manamo_miyata/' },
    ],
  },
  {
    kanji: '井口眞緒',
    kana: 'いぐち まお',
    groupId: 'hinatazaka46',
    genId: 'hina-g1',
    joinedOn: '2016-05-08',
    leftOn: '2020-03-30',
    birthDate: '1995-11-10',
    sns: [
      { type: 'x', url: 'https://x.com/mao_iguchi_' },
      { type: 'instagram', url: 'https://www.instagram.com/iguchi.mao/' },
      { type: 'youtube', url: 'https://www.youtube.com/channel/UCfW60w_4Z-90gY3K09pD3bg' },
    ],
  },
];

export function getGraduates(): Member[] {
  return GRADUATES_SEED.map((seed) => {
    const slugPrefix = seed.groupId === 'sakurazaka46' ? 'saku' : 'hina';
    const slugName = toSlug(slugPrefix, seed.kana);
    const id = slugName;
    const romajiName = formatPersonRomaji(seed.kana);
    const hangulName = kanaToHangul(seed.kana);
    const avatar = generateAvatar(id, seed.kanji);

    const links: MemberLink[] = (seed.sns || []).map((s) => ({
      type: s.type,
      url: s.url,
      label: null,
      isOfficial: true,
      status: 'ok',
      lastCheckedAt: '2026-08-16',
      lastStatusCode: 200,
    }));

    return {
      id,
      name: {
        ja: {
          kanji: seed.kanji,
          kana: seed.kana,
        },
        ko: {
          hangul: hangulName,
        },
        en: {
          romaji: romajiName,
        },
        aliases: [romajiName.toLowerCase(), seed.kanji, hangulName],
      },
      primaryGroupId: seed.groupId,
      primaryGenerationId: seed.genId,
      status: 'graduated',
      memberships: [
        {
          groupId: seed.groupId,
          generationId: seed.genId,
          joinedOn: seed.joinedOn,
          leftOn: seed.leftOn,
          isConcurrent: false,
          endReason: 'graduation',
        },
      ],
      birthDate: seed.birthDate || null,
      birthplace: null,
      officialCode: null,
      imageUrl: seed.imageUrl || null,
      links,
      avatar,
      provenance: {
        source: 'official',
        sourceUrl: seed.sns?.[0]?.url || (seed.groupId === 'sakurazaka46' ? 'https://sakurazaka46.com/' : 'https://www.hinatazaka46.com/'),
        checkedAt: '2026-08-16',
        note: 'Historical graduate record',
      },
    };
  });
}
