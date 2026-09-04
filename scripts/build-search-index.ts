import * as fs from 'fs';
import * as path from 'path';
import type { Member, Group } from '../src/lib/schema';
import { extractChoseong, type SearchIndexItem } from '../src/lib/search';
import { buildMemberDiscoveryTerms } from '../src/lib/identity';

function buildIndex() {
  const membersPath = path.join(__dirname, '..', 'data', 'members.json');
  if (!fs.existsSync(membersPath)) {
    console.error('❌ members.json does not exist');
    process.exit(1);
  }

  const members: Member[] = JSON.parse(fs.readFileSync(membersPath, 'utf-8'));

  const groupsPath = path.join(__dirname, '..', 'data', 'groups.json');
  const groups: Group[] = fs.existsSync(groupsPath)
    ? (JSON.parse(fs.readFileSync(groupsPath, 'utf-8')) as { groups: Group[] }).groups ?? []
    : [];
  const groupMap = new Map(groups.map((g) => [g.id, g]));
  const franchiseMap = new Map<string, 'sakamichi' | 'akb48g'>(
    groups.map((g) => [g.id, g.franchise as 'sakamichi' | 'akb48g'])
  );

  const indexItems: SearchIndexItem[] = members.map((m) => {
    const group = groupMap.get(m.primaryGroupId);
    return {
      id: m.id,
      groupId: m.primaryGroupId,
      franchise: franchiseMap.get(m.primaryGroupId) ?? 'akb48g',
      genId: m.primaryGenerationId,
      status: m.status,
      kanji: m.name.ja.kanji,
      kana: m.name.ja.kana,
      hangul: m.name.ko.hangul,
      hangulChoseong: extractChoseong(m.name.ko.hangul),
      romaji: m.name.en.romaji,
      aliases: m.name.aliases || [],
      searchTerms: buildMemberDiscoveryTerms(m, group),
      groupName: group?.name ?? { ja: m.primaryGroupId, ko: m.primaryGroupId, en: m.primaryGroupId },
      glyph: m.avatar.glyph,
      hueShift: m.avatar.hueShift,
      imageUrl: m.imageUrl || null,
      groupLogoUrl: group?.logoUrl ?? null,
    };
  });

  const publicDir = path.join(__dirname, '..', 'public');
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

  const targetPath = path.join(publicDir, 'search-index.json');
  fs.writeFileSync(targetPath, JSON.stringify(indexItems), 'utf-8');

  console.log(`✅ Built search index with ${indexItems.length} members at public/search-index.json (${Math.round(fs.statSync(targetPath).size / 1024)} KB)`);
}

buildIndex();
