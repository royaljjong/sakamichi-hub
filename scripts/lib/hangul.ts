import { katakanaToHiragana } from './romaji';

const HANGUL_MAP: Record<string, string> = {
  あ: '아', い: '이', う: '우', え: '에', お: '오',
  か: '카', き: '키', く: '쿠', け: '케', こ: '코',
  さ: '사', し: '시', す: '스', せ: '세', そ: '소',
  た: '타', ち: '치', つ: '쓰', て: '테', と: '토',
  な: '나', に: '니', ぬ: '누', ね: '네', の: '노',
  は: '하', ひ: '히', ふ: '후', へ: '헤', ほ: '호',
  ま: '마', み: '미', む: '무', め: '메', も: '모',
  や: '야', ゆ: '유', よ: '요',
  ら: '라', り: '리', る: '루', れ: '레', ろ: '로',
  わ: '와', を: '오',
  が: '가', ぎ: '기', ぐ: '구', げ: '게', ご: '고',
  ざ: '자', じ: '지', ず: '즈', ぜ: '제', ぞ: '조',
  だ: '다', ぢ: '지', づ: '즈', で: '데', ど: '도',
  ば: '바', び: '비', 부: '부', べ: '베', ぼ: '보',
  ぱ: '파', ぴ: '피', ぷ: '푸', ぺ: '페', ぽ: '포',
  きゃ: '캬', きゅ: '큐', きょ: '쿄',
  しゃ: '샤', しゅ: '슈', しょ: '쇼',
  ちゃ: '차', ちゅ: '추', ちょ: '초',
  にゃ: '냐', にゅ: '뉴', にょ: '뇨',
  ひゃ: '햐', ひゅ: '휴', ひょ: '효',
  みゃ: '먀', みゅ: '뮤', みょ: '묘',
  りゃ: '랴', りゅ: '류', りょ: '료',
  ぎゃ: '갸', ぎゅ: '규', ぎょ: '교',
  じゃ: '자', じゅ: '주', じょ: '조',
  ぢゃ: '자', ぢゅ: '주', ぢょ: '조',
  びゃ: '뱌', びゅ: '뷰', びょ: '뵤',
  ぴゃ: '퍄', ぴゅ: '퓨', ぴょ: '표',
  てぃ: '티', でぃ: '디', とぅ: '투', どぅ: '두',
  うぃ: '위', うぇ: '웨', うぉ: '워',
  しぇ: '셰', ちぇ: '체', じぇ: '제',
  ふぁ: '파', ふぃ: '피', ふぇ: '페', ふぉ: '포',
};

// Common batchim (final consonant) helpers
const JONGSEONG_N = 0x11ab - 0x11a7; // ㄴ (4)
const JONGSEONG_M = 0x11b7 - 0x11a7; // ㅁ (16)
const JONGSEONG_NG = 0x11bc - 0x11a7; // ㅇ (21)
const JONGSEONG_S = 0x11ba - 0x11a7; // ㅅ (19)

function addBatchim(hangulChar: string, batchimType: 'n' | 'm' | 'ng' | 's'): string {
  if (!hangulChar || hangulChar.length !== 1) return hangulChar;
  const code = hangulChar.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return hangulChar;

  const baseIndex = code - 0xac00;
  const hasJongseong = baseIndex % 28 !== 0;
  if (hasJongseong) return hangulChar;

  let offset = 0;
  if (batchimType === 'n') offset = JONGSEONG_N;
  else if (batchimType === 'm') offset = JONGSEONG_M;
  else if (batchimType === 'ng') offset = JONGSEONG_NG;
  else if (batchimType === 's') offset = JONGSEONG_S;

  return String.fromCharCode(code + offset);
}

export function kanaToHangul(rawKana: string): string {
  const kana = katakanaToHiragana(rawKana).trim().replace(/\s+/g, ' ');
  const words = kana.split(' ');

  return words
    .map((word) => convertWordToHangul(word))
    .join(' ');
}

function convertWordToHangul(word: string): string {
  const syllables: string[] = [];
  let i = 0;

  while (i < word.length) {
    // 2-char youon
    if (i + 1 < word.length) {
      const twoChar = word.substring(i, i + 2);
      if (HANGUL_MAP[twoChar]) {
        syllables.push(HANGUL_MAP[twoChar]!);
        i += 2;
        continue;
      }
    }

    const char = word[i];
    if (!char) {
      i++;
      continue;
    }

    // Sokuon (っ) -> attach 'ㅅ' to previous syllable if possible
    if (char === 'っ') {
      if (syllables.length > 0) {
        const lastIdx = syllables.length - 1;
        syllables[lastIdx] = addBatchim(syllables[lastIdx]!, 's');
      }
      i++;
      continue;
    }

    // Hatsoun (ん)
    if (char === 'ん') {
      const nextChar = word[i + 1] || '';
      let batchim: 'n' | 'm' | 'ng' = 'n';
      if ('まみむめもばびぶべぼぱぴぷぺぽ'.includes(nextChar)) {
        batchim = 'm';
      } else if ('かきくけこがぎぐげご'.includes(nextChar)) {
        batchim = 'ng';
      }

      if (syllables.length > 0) {
        const lastIdx = syllables.length - 1;
        syllables[lastIdx] = addBatchim(syllables[lastIdx]!, batchim);
      } else {
        syllables.push(batchim === 'm' ? '음' : '은');
      }
      i++;
      continue;
    }

    // Long vowel rule in NIKL: typically omitted after o/u/e
    if (char === 'ー') {
      i++;
      continue;
    }

    if (HANGUL_MAP[char]) {
      syllables.push(HANGUL_MAP[char]!);
    } else {
      syllables.push(char);
    }
    i++;
  }

  return syllables.join('');
}
