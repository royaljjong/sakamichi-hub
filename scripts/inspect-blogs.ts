import { safeFetch } from './lib/fetcher';
import * as fs from 'fs';
import * as path from 'path';

async function inspect() {
  const n = await safeFetch('https://www.nogizaka46.com/s/n46/diary/MEMBER/list?ima=0000');
  const s = await safeFetch('https://sakurazaka46.com/s/s46/diary/blog/list?ima=0000');
  const h = await safeFetch('https://www.hinatazaka46.com/s/official/diary/member/list?ima=0000');

  // Nogi
  const nogiLinks = Array.from(n.text.matchAll(/<a [^>]*href="(\/s\/n46\/diary\/detail\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/g));
  console.log(`Nogizaka blog matches: ${nogiLinks.length}`);
  if (nogiLinks.length > 0) {
    console.log('Nogi sample link:', nogiLinks[0]?.[1]);
    console.log('Nogi sample innerHTML:', nogiLinks[0]?.[2]?.slice(0, 300));
  }

  // Saku
  const sakuBoxes = Array.from(s.text.matchAll(/<li class="box" data-member="([^"]+)">([\s\S]*?)<\/li>/g));
  console.log(`Sakurazaka blog matches: ${sakuBoxes.length}`);
  if (sakuBoxes.length > 0) {
    console.log('Saku sample HTML:', sakuBoxes[0]?.[2]?.slice(0, 300));
  }

  // Hina
  const hinaLinks = Array.from(h.text.matchAll(/<a class="c-button-blog-detail" href="([^"]+)"/g));
  console.log(`Hinatazaka blog matches: ${hinaLinks.length}`);
  const hinaItems = Array.from(h.text.matchAll(/<div class="p-blog-group">([\s\S]*?)<\/div>\s*<\/div>/g));
  console.log(`Hinatazaka group items: ${hinaItems.length}`);
  if (h.text.includes('c-blog-item__title')) {
    console.log('Hinatazaka has c-blog-item__title!');
  }
}

inspect().catch(console.error);
