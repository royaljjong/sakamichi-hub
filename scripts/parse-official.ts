import * as fs from 'fs';
import * as path from 'path';

const sampleDir = path.join(__dirname, 'samples');

// Parse Nogi API
const nogiRaw = fs.readFileSync(path.join(sampleDir, 'nogizaka_api.json'), 'utf-8');
const nogiJsonMatch = nogiRaw.match(/res\(([\s\S]*)\)/);
if (nogiJsonMatch && nogiJsonMatch[1]) {
  const nogiData = JSON.parse(nogiJsonMatch[1]);
  console.log('Nogi total entries:', nogiData.count);
  const categories = new Set(nogiData.data.map((m: any) => m.cate));
  console.log('Nogi categories:', Array.from(categories));
  console.log('Nogi sample active members:', nogiData.data.filter((m: any) => m.cate !== '卒業生' && m.code !== '10001').slice(0, 5).map((m: any) => ({
    code: m.code, name: m.name, kana: m.kana, cate: m.cate, birthday: m.birthday
  })));
}

// Parse Sakura HTML
const sakuraHtml = fs.readFileSync(path.join(sampleDir, 'sakurazaka46.html'), 'utf-8');
// Check generation groupings or member listings
const sakuraBoxes = sakuraHtml.match(/<li class="box" data-member="([^"]+)">([\s\S]*?)<\/li>/g) || [];
console.log('\nSakura member count on search page:', sakuraBoxes.length);
const sakuraMembers = sakuraBoxes.map(b => {
  const code = b.match(/data-member="([^"]+)"/)?.[1];
  const name = b.match(/<p class="name">([^<]+)<\/p>/)?.[1]?.trim();
  const kana = b.match(/<p class="kana">([^<]+)<\/p>/)?.[1]?.trim();
  return { code, name, kana };
});
console.log('Sakura sample members (first 5 and last 5):', sakuraMembers.slice(0, 5), sakuraMembers.slice(-5));

// Parse Hinata HTML
const hinataHtml = fs.readFileSync(path.join(sampleDir, 'hinatazaka46.html'), 'utf-8');
const hinataItems = hinataHtml.match(/<li class="p-member__item" data-member="([^"]+)">([\s\S]*?)<\/li>/g) || [];
console.log('\nHinata member count on search page:', hinataItems.length);
const hinataMembers = hinataItems.map(b => {
  const code = b.match(/data-member="([^"]+)"/)?.[1];
  const name = b.match(/<div class="c-member__name">([\s\S]*?)<\/div>/)?.[1]?.replace(/\s+/g, ' ')?.trim();
  const kana = b.match(/<div class="c-member__kana">([\s\S]*?)<\/div>/)?.[1]?.replace(/\s+/g, ' ')?.trim();
  return { code, name, kana };
});
console.log('Hinata sample members (first 5 and last 5):', hinataMembers.slice(0, 5), hinataMembers.slice(-5));
