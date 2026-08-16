import * as fs from 'fs';
import * as path from 'path';

function analyzeNogi(html: string) {
  console.log('=== NOGIZAKA46 ===');
  // Look for member cards or links
  // Pattern in nogizaka46 search/artist: usually <a href="/s/n46/artist/detail/..." or diary/MEMBER/list?ct=...
  const links = html.match(/href="([^"]+)"/g) || [];
  const artistLinks = links.filter((l) => l.includes('/artist/detail/') || l.includes('diary/MEMBER/list'));
  console.log('Sample artist/diary links:', artistLinks.slice(0, 10));

  // Let's search for member elements
  const memberMatches = html.match(/<div class="m--all member__box"[^>]*>([\s\S]*?)<\/div>/g) || 
                        html.match(/<div class="[^"]*member[^"]*"[^>]*>([\s\S]*?)<\/div>/g) ||
                        html.match(/<a [^>]*class="[^"]*unit[^"]*"[^>]*>([\s\S]*?)<\/a>/g) ||
                        html.match(/<a [^>]*href="\/s\/n46\/artist\/detail\/[^"]*"[^>]*>([\s\S]*?)<\/a>/g);
  console.log('Member block match count:', memberMatches?.length);
  if (memberMatches && memberMatches[0]) {
    console.log('First member block:\n', memberMatches[0].slice(0, 500));
  }
}

function analyzeSakura(html: string) {
  console.log('=== SAKURAZAKA46 ===');
  const links = html.match(/href="([^"]+)"/g) || [];
  const artistLinks = links.filter((l) => l.includes('/artist/') || l.includes('diary/blog/list'));
  console.log('Sample artist/diary links:', artistLinks.slice(0, 10));

  const memberMatches = html.match(/<li [^>]*class="[^"]*box[^"]*"[^>]*>([\s\S]*?)<\/li>/g) ||
                        html.match(/<li [^>]*class="[^"]*member[^"]*"[^>]*>([\s\S]*?)<\/li>/g) ||
                        html.match(/<div [^>]*class="[^"]*member[^"]*"[^>]*>([\s\S]*?)<\/div>/g) ||
                        html.match(/<a [^>]*href="\/s\/s46\/artist\/[^"]*"[^>]*>([\s\S]*?)<\/a>/g);
  console.log('Member block match count:', memberMatches?.length);
  if (memberMatches && memberMatches[0]) {
    console.log('First member block:\n', memberMatches[0].slice(0, 500));
  }
}

function analyzeHinata(html: string) {
  console.log('=== HINATAZAKA46 ===');
  const links = html.match(/href="([^"]+)"/g) || [];
  const artistLinks = links.filter((l) => l.includes('/artist/') || l.includes('diary/member/list'));
  console.log('Sample artist/diary links:', artistLinks.slice(0, 10));

  const memberMatches = html.match(/<li [^>]*class="[^"]*member[^"]*"[^>]*>([\s\S]*?)<\/li>/g) ||
                        html.match(/<li [^>]*class="[^"]*box[^"]*"[^>]*>([\s\S]*?)<\/li>/g) ||
                        html.match(/<div [^>]*class="[^"]*member[^"]*"[^>]*>([\s\S]*?)<\/div>/g) ||
                        html.match(/<a [^>]*href="\/s\/official\/artist\/[^"]*"[^>]*>([\s\S]*?)<\/a>/g);
  console.log('Member block match count:', memberMatches?.length);
  if (memberMatches && memberMatches[0]) {
    console.log('First member block:\n', memberMatches[0].slice(0, 500));
  }
}

const sampleDir = path.join(__dirname, 'samples');
if (fs.existsSync(path.join(sampleDir, 'nogizaka46.html'))) {
  analyzeNogi(fs.readFileSync(path.join(sampleDir, 'nogizaka46.html'), 'utf-8'));
}
if (fs.existsSync(path.join(sampleDir, 'sakurazaka46.html'))) {
  analyzeSakura(fs.readFileSync(path.join(sampleDir, 'sakurazaka46.html'), 'utf-8'));
}
if (fs.existsSync(path.join(sampleDir, 'hinatazaka46.html'))) {
  analyzeHinata(fs.readFileSync(path.join(sampleDir, 'hinatazaka46.html'), 'utf-8'));
}
