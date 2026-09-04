import * as fs from 'fs';
import * as path from 'path';
import { searchMembers, type SearchIndexItem } from '../src/lib/search';

const indexPath = path.join(__dirname, '..', 'public', 'search-index.json');
const items = JSON.parse(fs.readFileSync(indexPath, 'utf-8')) as SearchIndexItem[];

const checks = [
  { query: '矢田', memberId: 'nogi-yada-moeka', kind: 'Japanese surname' },
  { query: '야다', memberId: 'nogi-yada-moeka', kind: 'Korean surname' },
  { query: 'Yada', memberId: 'nogi-yada-moeka', kind: 'Romanized surname' },
  { query: 'やだ', memberId: 'nogi-yada-moeka', kind: 'Kana surname' },
  { query: 'ㅇㄷ', memberId: 'nogi-yada-moeka', kind: 'Korean choseong' },
  { query: 'Yada-Moeka', memberId: 'nogi-yada-moeka', kind: 'Romanized hyphen variant' },
  { query: '乃木坂46', groupId: 'nogizaka46', kind: 'Japanese group name' },
  { query: '노기자카46', groupId: 'nogizaka46', kind: 'Korean group name' },
  { query: 'Nogizaka46', groupId: 'nogizaka46', kind: 'English group name' },
];

for (const check of checks) {
  const results = searchMembers(items, check.query);
  const passed = check.memberId
    ? results.some((item) => item.id === check.memberId)
    : results.some((item) => item.groupId === check.groupId);
  if (!passed) throw new Error(`${check.kind} search failed: ${check.query}`);
  console.log(`✓ ${check.kind}: ${check.query} (${results.length} results)`);
}

const aliasItem = items.find((item) => item.aliases.length > 0);
if (aliasItem) {
  const alias = aliasItem.aliases[0];
  if (alias && !searchMembers(items, alias).some((item) => item.id === aliasItem.id)) {
    throw new Error(`Alias search failed: ${alias}`);
  }
  if (alias) console.log(`✓ Alias: ${alias}`);
}

console.log(`Search discovery verification passed for ${items.length} members.`);
