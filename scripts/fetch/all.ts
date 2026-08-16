import * as fs from 'fs';
import * as path from 'path';
import { fetchNogizaka } from './nogizaka';
import { fetchSakurazaka } from './sakurazaka';
import { fetchHinatazaka } from './hinatazaka';
import { getGraduates } from './graduates';
import { getAKB48GroupMembers } from './akb48g';
import type { Member } from '../../src/lib/schema';

async function fetchAll() {
  console.log('🚀 Starting full Sakamichi & AKB48 Group members data fetch...\n');

  const nogiMembers = await fetchNogizaka();
  const sakuraMembers = await fetchSakurazaka();
  const hinataMembers = await fetchHinatazaka();
  const graduates = getGraduates();
  const akbGroupMembers = getAKB48GroupMembers();

  const allMembers: Member[] = [
    ...nogiMembers,
    ...sakuraMembers,
    ...hinataMembers,
    ...graduates,
    ...akbGroupMembers,
  ];

  // Validate ID uniqueness
  const seenIds = new Set<string>();
  const duplicates: string[] = [];
  for (const m of allMembers) {
    if (seenIds.has(m.id)) {
      duplicates.push(m.id);
    }
    seenIds.add(m.id);
  }

  if (duplicates.length > 0) {
    console.error('❌ Duplicate member IDs found:', duplicates);
    process.exit(1);
  }

  // Write data/members.json
  const dataPath = path.join(__dirname, '..', '..', 'data', 'members.json');
  fs.writeFileSync(dataPath, JSON.stringify(allMembers, null, 2), 'utf-8');

  console.log('\n================ DATA COLLECTION SUMMARY ================');
  console.log(`乃木坂46 total: ${nogiMembers.length} (Active: ${nogiMembers.filter(m => m.status === 'active').length})`);
  console.log(`櫻坂46 total: ${sakuraMembers.length} (Active: ${sakuraMembers.filter(m => m.status === 'active').length})`);
  console.log(`日向坂46 total: ${hinataMembers.length} (Active: ${hinataMembers.filter(m => m.status === 'active').length})`);
  console.log(`Historical Graduates added: ${graduates.length}`);
  console.log(`TOTAL MEMBERS IN DATASET: ${allMembers.length}`);
  console.log('Saved to data/members.json successfully.');
  console.log('=========================================================\n');
}

fetchAll().catch((err) => {
  console.error('Fatal fetch error:', err);
  process.exit(1);
});
