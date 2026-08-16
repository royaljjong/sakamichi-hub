import type { Member } from './schema';

export interface SearchIndexItem {
  id: string;
  groupId: string;
  genId: string;
  status: string;
  kanji: string;
  kana: string;
  hangul: string;
  hangulChoseong: string;
  romaji: string;
  aliases: string[];
  glyph: string;
  hueShift: number;
  imageUrl?: string | null;
}

const CHOSEONG = [
  'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ',
  'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ',
];

export function extractChoseong(str: string): string {
  let result = '';
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code >= 0xac00 && code <= 0xd7a3) {
      const choseongIndex = Math.floor((code - 0xac00) / 588);
      result += CHOSEONG[choseongIndex] || '';
    } else {
      result += str.charAt(i);
    }
  }
  return result;
}

export function normalizeQuery(q: string): string {
  return q
    .toLowerCase()
    .trim()
    .replace(/[\u30a1-\u30f6]/g, (match) => {
      // Katakana to hiragana
      return String.fromCharCode(match.charCodeAt(0) - 0x60);
    })
    .replace(/\s+/g, '');
}

export function searchMembers(
  items: SearchIndexItem[],
  query: string,
): SearchIndexItem[] {
  if (!query || query.trim() === '') return [];

  const rawNorm = normalizeQuery(query);
  const isChoseongQuery = /^[ㄱ-ㅎ]+$/.test(query.trim());

  return items.filter((item) => {
    if (isChoseongQuery) {
      const cleanChoseong = item.hangulChoseong.replace(/\s+/g, '');
      if (cleanChoseong.includes(query.trim())) return true;
    }

    const kanjiNorm = item.kanji.toLowerCase().replace(/\s+/g, '');
    const kanaNorm = item.kana.toLowerCase().replace(/\s+/g, '');
    const hangulNorm = item.hangul.toLowerCase().replace(/\s+/g, '');
    const romajiNorm = item.romaji.toLowerCase().replace(/\s+/g, '');

    if (kanjiNorm.includes(rawNorm)) return true;
    if (kanaNorm.includes(rawNorm)) return true;
    if (hangulNorm.includes(rawNorm)) return true;
    if (romajiNorm.includes(rawNorm)) return true;

    for (const alias of item.aliases) {
      if (alias.toLowerCase().replace(/\s+/g, '').includes(rawNorm)) return true;
    }

    return false;
  });
}
