import { safeFetch } from './lib/fetcher';

async function inspectArticles() {
  // Saku
  const s = await safeFetch('https://sakurazaka46.com/s/s46/diary/blog/list?ima=0000');
  const sArticles = Array.from(s.text.matchAll(/<li class="box" data-member="([^"]+)">([\s\S]*?)<\/li>/g));
  if (sArticles.length === 0) {
    const sCards = Array.from(s.text.matchAll(/<div class="box">([\s\S]*?)<\/div>\s*<\/div>/g));
    console.log('Saku alt divs:', sCards.length);
    const sArticles2 = Array.from(s.text.matchAll(/<div class="box">([\s\S]*?)<div class="box_bottom">/g));
    console.log('Saku box_bottom:', sArticles2.length);
  }

  // Hina
  const h = await safeFetch('https://www.hinatazaka46.com/s/official/diary/member/list?ima=0000');
  const hItems = Array.from(h.text.matchAll(/<div class="p-blog-article">([\s\S]*?)<div class="p-blog-article__foot">/g));
  console.log('Hina articles:', hItems.length);
  const hLinks = Array.from(h.text.matchAll(/<div class="c-blog-article__title">[\s\S]*?<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g));
  console.log('Hina titles/links:', hLinks.length);
  const hNames = Array.from(h.text.matchAll(/<div class="c-blog-article__name">([^<]+)<\/div>/g));
  console.log('Hina names:', hNames.length);
}

inspectArticles().catch(console.error);
