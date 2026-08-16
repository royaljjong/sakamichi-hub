import * as fs from 'fs';
import * as path from 'path';
import type { Member } from '../src/lib/schema';
import { extractChoseong, type SearchIndexItem } from '../src/lib/search';

function buildIndex() {
  const membersPath = path.join(__dirname, '..', 'data', 'members.json');
  if (!fs.existsSync(membersPath)) {
    console.error('❌ members.json does not exist');
    process.exit(1);
  }

  const members: Member[] = JSON.parse(fs.readFileSync(membersPath, 'utf-8'));

  const indexItems: SearchIndexItem[] = members.map((m) => ({
    id: m.id,
    groupId: m.primaryGroupId,
    genId: m.primaryGenerationId,
    status: m.status,
    kanji: m.name.ja.kanji,
    kana: m.name.ja.kana,
    hangul: m.name.ko.hangul,
    hangulChoseong: extractChoseong(m.name.ko.hangul),
    romaji: m.name.en.romaji,
    aliases: m.name.aliases || [],
    glyph: m.avatar.glyph,
    hueShift: m.avatar.hueShift,
  }));

  const publicDir = path.join(__dirname, '..', 'public');
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

  const targetPath = path.join(publicDir, 'search-index.json');
  fs.writeFileSync(targetPath, JSON.stringify(indexItems), 'utf-8');

  console.log(`✅ Built search index with ${indexItems.length} members at public/search-index.json (${Math.round(fs.statSync(targetPath).size / 1024)} KB)`);
}

buildIndex();
