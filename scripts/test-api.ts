import { safeFetch } from './lib/fetcher';
import * as fs from 'fs';
import * as path from 'path';

async function testNogiApi() {
  console.log('Testing Nogizaka API...');
  const res = await safeFetch('https://www.nogizaka46.com/s/n46/api/list/member');
  console.log('Nogi API status:', res.status, 'Length:', res.text.length);
  const sampleDir = path.join(__dirname, 'samples');
  fs.writeFileSync(path.join(sampleDir, 'nogizaka_api.json'), res.text);
  
  // Also test a Nogizaka profile page
  const profileRes = await safeFetch('https://www.nogizaka46.com/s/n46/artist/48006?ima=0000');
  console.log('Nogi profile status:', profileRes.status, 'Length:', profileRes.text.length);
  fs.writeFileSync(path.join(sampleDir, 'nogizaka_profile_sample.html'), profileRes.text);

  // Test Sakurazaka profile page
  const sakuRes = await safeFetch('https://sakurazaka46.com/s/s46/artist/53?ima=0000');
  console.log('Sakura profile status:', sakuRes.status, 'Length:', sakuRes.text.length);
  fs.writeFileSync(path.join(sampleDir, 'sakurazaka_profile_sample.html'), sakuRes.text);

  // Test Hinatazaka profile page
  const hinaRes = await safeFetch('https://www.hinatazaka46.com/s/official/artist/14?ima=0000');
  console.log('Hinata profile status:', hinaRes.status, 'Length:', hinaRes.text.length);
  fs.writeFileSync(path.join(sampleDir, 'hinatazaka_profile_sample.html'), hinaRes.text);
}

testNogiApi().catch(console.error);
