/**
 * Japanese Kana to Hepburn Romanization Converter
 */

const KANA_MAP: Record<string, string> = {
  あ: 'a', い: 'i', う: 'u', え: 'e', お: 'o',
  か: 'ka', き: 'ki', く: 'ku', け: 'ke', こ: 'ko',
  さ: 'sa', し: 'shi', す: 'su', せ: 'se', そ: 'so',
  た: 'ta', ち: 'chi', つ: 'tsu', て: 'te', と: 'to',
  な: 'na', に: 'ni', ぬ: 'nu', ね: 'ne', の: 'no',
  は: 'ha', ひ: 'hi', ふ: 'fu', へ: 'he', ほ: 'ho',
  ま: 'ma', み: 'mi', む: 'mu', め: 'me', も: 'mo',
  や: 'ya', ゆ: 'yu', よ: 'yo',
  ら: 'ra', り: 'ri', る: 'ru', れ: 're', ろ: 'ro',
  わ: 'wa', を: 'o', ん: 'n',
  が: 'ga', ぎ: 'gi', ぐ: 'gu', げ: 'ge', ご: 'go',
  ざ: 'za', じ: 'ji', ず: 'zu', ぜ: 'ze', ぞ: 'zo',
  だ: 'da', ぢ: 'ji', づ: 'zu', で: 'de', ど: 'do',
  ば: 'ba', び: 'bi', ぶ: 'bu', べ: 'be', ぼ: 'bo',
  ぱ: 'pa', ぴ: 'pi', ぷ: 'pu', ぺ: 'pe', ぽ: 'po',
  きゃ: 'kya', きゅ: 'kyu', きょ: 'kyo',
  しゃ: 'sha', しゅ: 'shu', しょ: 'sho',
  ちゃ: 'cha', ちゅ: 'chu', ちょ: 'cho',
  にゃ: 'nya', にゅ: 'nyu', にょ: 'nyo',
  ひゃ: 'hya', ひゅ: 'hyu', ひょ: 'hyo',
  みゃ: 'mya', みゅ: 'myu', みょ: 'myo',
  りゃ: 'rya', りゅ: 'ryu', りょ: 'ryo',
  ぎゃ: 'gya', ぎゅ: 'gyu', ぎょ: 'gyo',
  じゃ: 'ja', じゅ: 'ju', じょ: 'jo',
  ぢゃ: 'ja', ぢゅ: 'ju', ぢょ: 'jo',
  びゃ: 'bya', びゅ: 'byu', びょ: 'byo',
  ぴゃ: 'pya', ぴゅ: 'pyu', ぴょ: 'pyo',
  しぇ: 'she', ちぇ: 'che', じぇ: 'je',
  ふぁ: 'fa', ふぃ: 'fi', ふぇ: 'fe', ふぉ: 'fo',
  てぃ: 'ti', でぃ: 'di', とぅ: 'tu', どぅ: 'du',
  うぃ: 'wi', うぇ: 'we', うぉ: 'wo',
  ぁ: 'a', ぃ: 'i', ぅ: 'u', ぇ: 'e', ぉ: 'o',
  ー: '',
};

// Katakana to Hiragana conversion
export function katakanaToHiragana(src: string): string {
  return src.replace(/[\u30a1-\u30f6]/g, (match) => {
    const chr = match.charCodeAt(0) - 0x60;
    return String.fromCharCode(chr);
  });
}

export function kanaToHepburn(rawKana: string): string {
  let kana = katakanaToHiragana(rawKana).trim().replace(/\s+/g, ' ');
  let result = '';
  let i = 0;

  while (i < kana.length) {
    // 2-character combo (youon)
    if (i + 1 < kana.length) {
      const twoChar = kana.substring(i, i + 2);
      if (KANA_MAP[twoChar]) {
        result += KANA_MAP[twoChar];
        i += 2;
        continue;
      }
    }

    const char = kana[i];
    if (!char) {
      i++;
      continue;
    }

    // Sokuon (っ)
    if (char === 'っ') {
      if (i + 1 < kana.length) {
        const nextTwo = kana.substring(i + 1, i + 3);
        const nextOne = kana[i + 1];
        let nextRomaji = KANA_MAP[nextTwo] || (nextOne ? KANA_MAP[nextOne] : '') || '';
        if (nextRomaji.startsWith('ch')) {
          result += 't';
        } else if (nextRomaji.length > 0) {
          result += nextRomaji[0];
        }
      }
      i++;
      continue;
    }

    // Hatsoun (ん)
    if (char === 'ん') {
      const nextChar = kana[i + 1];
      if (nextChar && 'あいうえおやゆよ'.includes(nextChar)) {
        result += "n'";
      } else {
        result += 'n';
      }
      i++;
      continue;
    }

    if (char === 'ー') {
      // Long vowel marker in katakana names
      // Hepburn without macron: retain vowel or ignore
      i++;
      continue;
    }

    if (char === ' ') {
      result += ' ';
      i++;
      continue;
    }

    if (KANA_MAP[char]) {
      result += KANA_MAP[char];
    } else {
      result += char;
    }
    i++;
  }

  return result;
}

export function formatPersonRomaji(kanaName: string): string {
  const parts = kanaName.trim().split(/\s+/);
  if (parts.length === 2 && parts[0] && parts[1]) {
    const family = capitalize(kanaToHepburn(parts[0]));
    const given = capitalize(kanaToHepburn(parts[1]));
    return `${family} ${given}`;
  }
  return capitalize(kanaToHepburn(kanaName));
}

export function toSlug(groupPrefix: string, kanaName: string): string {
  const parts = kanaName.trim().split(/\s+/);
  if (parts.length === 2 && parts[0] && parts[1]) {
    const family = kanaToHepburn(parts[0]).toLowerCase().replace(/[^a-z0-9]/g, '');
    const given = kanaToHepburn(parts[1]).toLowerCase().replace(/[^a-z0-9]/g, '');
    return `${groupPrefix}-${family}-${given}`;
  }
  const clean = kanaToHepburn(kanaName).toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return `${groupPrefix}-${clean}`;
}

function capitalize(str: string): string {
  return str
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
