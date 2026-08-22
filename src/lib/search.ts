import type { Member } from './schema';

export interface SearchIndexItem {
  id: string;
  groupId: string;
  franchise: 'sakamichi' | 'akb48g';
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

export interface SearchFilters {
  franchise?: 'sakamichi' | 'akb48g' | null;
  groupId?: string | null;
  status?: 'active' | 'graduated' | 'trainee' | null;
}

const SAKAMICHI_GROUP_IDS = new Set([
  'nogizaka46',
  'sakurazaka46',
  'hinatazaka46',
  'keyakizaka46',
]);

export function deriveFranchise(groupId: string): 'sakamichi' | 'akb48g' {
  return SAKAMICHI_GROUP_IDS.has(groupId) ? 'sakamichi' : 'akb48g';
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

function applyFilters(items: SearchIndexItem[], filters: SearchFilters): SearchIndexItem[] {
  return items.filter((item) => {
    if (filters.franchise && item.franchise !== filters.franchise) return false;
    if (filters.groupId && item.groupId !== filters.groupId) return false;
    if (filters.status) {
      // map filter status values to data status values
      if (filters.status === 'active' && item.status !== 'active') return false;
      if (filters.status === 'graduated' && item.status !== 'graduated') return false;
      if (filters.status === 'trainee' && item.status !== 'trainee') return false;
    }
    return true;
  });
}

export function searchMembers(
  items: SearchIndexItem[],
  query: string,
  filters?: SearchFilters,
): SearchIndexItem[] {
  const hasQuery = query && query.trim() !== '';
  const hasFilters =
    filters &&
    (filters.franchise != null || filters.groupId != null || filters.status != null);

  if (!hasQuery && !hasFilters) return [];

  let pool = hasFilters ? applyFilters(items, filters!) : items;

  if (!hasQuery) return pool;

  const rawNorm = normalizeQuery(query);
  const isChoseongQuery = /^[ㄱ-ㅎ]+$/.test(query.trim());

  return pool.filter((item) => {
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
