import { safeFetch } from './lib/fetcher';

async function inspectSaku() {
  const s = await safeFetch('https://sakurazaka46.com/s/s46/diary/blog/list?ima=0000');
  console.log('Saku content length:', s.text.length);
  const links = Array.from(s.text.matchAll(/href="(\/s\/s46\/diary\/detail\/[^"]+)"/g));
  console.log('Saku detail links found:', links.length);
  if (links.length > 0) {
    console.log('Sample link:', links[0]?.[1]);
  }
  const titles = Array.from(s.text.matchAll(/<h3[^>]*class="[^"]*title[^"]*"[^>]*>([\s\S]*?)<\/h3>/g));
  console.log('Saku titles found:', titles.length);
}

inspectSaku().catch(console.error);
