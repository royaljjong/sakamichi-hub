import { safeFetch } from './lib/fetcher';
import * as fs from 'fs';
import * as path from 'path';

async function testSites() {
  const sites = [
    {
      group: 'nogizaka46',
      url: 'https://www.nogizaka46.com/s/n46/search/artist?ima=0000',
    },
    {
      group: 'sakurazaka46',
      url: 'https://sakurazaka46.com/s/s46/search/artist?ima=0000',
    },
    {
      group: 'hinatazaka46',
      url: 'https://www.hinatazaka46.com/s/official/search/artist?ima=0000',
    },
  ];

  for (const s of sites) {
    console.log(`Fetching ${s.group} from ${s.url}...`);
    const res = await safeFetch(s.url);
    console.log(`[${s.group}] Status: ${res.status}, Length: ${res.text.length}`);

    // save sample html for analysis
    const sampleDir = path.join(__dirname, 'samples');
    if (!fs.existsSync(sampleDir)) fs.mkdirSync(sampleDir, { recursive: true });
    fs.writeFileSync(path.join(sampleDir, `${s.group}.html`), res.text);
    console.log(`Saved sample to samples/${s.group}.html`);
  }
}

testSites().catch(console.error);
