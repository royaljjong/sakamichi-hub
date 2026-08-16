import * as fs from 'fs';

async function checkAllImages() {
  const members = JSON.parse(fs.readFileSync('data/members.json', 'utf-8'));
  const grads = members.filter((m: any) => m.status === 'graduated');
  console.log(`Checking ${grads.length} graduates images...`);

  let okCount = 0;
  let failCount = 0;
  const fails: any[] = [];

  for (const m of grads) {
    if (!m.imageUrl) {
      console.log(`[NO IMAGE] ${m.primaryGroupId} - ${m.name.ja.kanji}`);
      failCount++;
      fails.push({ name: m.name.ja.kanji, group: m.primaryGroupId, error: 'NO_IMAGE' });
      continue;
    }

    try {
      const res = await fetch(m.imageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'Referer': m.imageUrl.includes('nogizaka46') ? 'https://www.nogizaka46.com/' : m.imageUrl.includes('sakurazaka46') ? 'https://sakurazaka46.com/' : m.imageUrl.includes('hinatazaka46') ? 'https://www.hinatazaka46.com/' : 'https://www.akb48.co.jp/',
        }
      });
      if (res.ok && res.status === 200) {
        okCount++;
      } else {
        console.log(`[HTTP ${res.status}] ${m.primaryGroupId} - ${m.name.ja.kanji}: ${m.imageUrl}`);
        failCount++;
        fails.push({ name: m.name.ja.kanji, group: m.primaryGroupId, status: res.status, url: m.imageUrl });
      }
    } catch (e: any) {
      console.log(`[FETCH ERR] ${m.primaryGroupId} - ${m.name.ja.kanji}: ${e.message}`);
      failCount++;
      fails.push({ name: m.name.ja.kanji, group: m.primaryGroupId, error: e.message, url: m.imageUrl });
    }
  }

  console.log(`========================================`);
  console.log(`Total Graduates: ${grads.length}`);
  console.log(`OK: ${okCount}`);
  console.log(`FAIL: ${failCount}`);
  console.log(`Failed list:`, fails);
}

checkAllImages();
