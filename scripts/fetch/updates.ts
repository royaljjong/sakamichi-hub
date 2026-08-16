import { safeFetch } from '../lib/fetcher';
import * as fs from 'fs';
import * as path from 'path';
import type { Member } from '../../src/lib/schema';

export interface RecentUpdate {
  id: string;
  groupId: 'nogizaka46' | 'sakurazaka46' | 'hinatazaka46';
  memberId?: string;
  memberName: {
    ja: string;
    ko: string;
    en: string;
  };
  memberGlyph: string;
  memberHueShift: number;
  memberImage: string | null;
  title: string;
  publishedAt: string;
  url: string;
  type: 'official_blog';
}

export async function fetchLatestUpdates(providedMembers?: Member[]): Promise<RecentUpdate[]> {
  let members: Member[] = providedMembers || [];

  if (members.length === 0) {
    try {
      const p1 = path.join(process.cwd(), 'data', 'members.json');
      if (fs.existsSync(p1)) {
        members = JSON.parse(fs.readFileSync(p1, 'utf-8'));
      } else {
        const p2 = path.join(__dirname, '..', '..', 'data', 'members.json');
        if (fs.existsSync(p2)) {
          members = JSON.parse(fs.readFileSync(p2, 'utf-8'));
        }
      }
    } catch (e) {
      console.warn('Could not read members.json from filesystem:', e);
    }
  }

  const memberNameMap = new Map<string, Member>();
  for (const m of members) {
    memberNameMap.set(m.name.ja.kanji.replace(/\s+/g, ''), m);
  }

  const updates: RecentUpdate[] = [];

  // 1. Nogizaka46 Blogs
  try {
    console.log('Fetching Nogizaka46 latest blogs...');
    const n = await safeFetch('https://www.nogizaka46.com/s/n46/diary/MEMBER/list?ima=0000');
    if (n.ok) {
      const cards = Array.from(n.text.matchAll(/<a [^>]*href="(\/s\/n46\/diary\/detail\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/g));
      for (const card of cards.slice(0, 10)) {
        const linkPath = card[1] || '';
        const html = card[2] || '';

        const titleMatch = html.match(/<p class="bl--card__ttl">([\s\S]*?)<\/p>/) || html.match(/<h4 class="bl--card__ttl">([\s\S]*?)<\/h4>/);
        const nameMatch = html.match(/<p class="bl--card__name"[^>]*>([\s\S]*?)<\/p>/);
        const dateMatch = html.match(/<p class="bl--card__date">([\s\S]*?)<\/p>/);
        const imgMatch = html.match(/data-src="([^"]+)"/);

        const title = titleMatch ? titleMatch[1]!.replace(/<[^>]+>/g, '').trim() : 'ブログ更新';
        const name = nameMatch ? nameMatch[1]!.replace(/<[^>]+>/g, '').trim() : '乃木坂46';
        const date = dateMatch ? dateMatch[1]!.replace(/<[^>]+>/g, '').trim() : new Date().toISOString().slice(0, 10);
        const img = imgMatch && imgMatch[1] ? imgMatch[1] : null;

        const matchedMember = memberNameMap.get(name.replace(/\s+/g, ''));

        updates.push({
          id: `nogi-${linkPath.replace(/[^a-zA-Z0-9]/g, '')}`,
          groupId: 'nogizaka46',
          memberId: matchedMember?.id,
          memberName: {
            ja: name,
            ko: matchedMember?.name.ko.hangul || name,
            en: matchedMember?.name.en.romaji || name,
          },
          memberGlyph: matchedMember?.avatar.glyph || name[0] || '乃',
          memberHueShift: matchedMember?.avatar.hueShift || 0,
          memberImage: matchedMember?.imageUrl || img,
          title,
          publishedAt: date,
          url: `https://www.nogizaka46.com${linkPath}`,
          type: 'official_blog',
        });
      }
    }
  } catch (err) {
    console.warn('Failed to fetch Nogizaka blogs:', err);
  }

  // 2. Sakurazaka46 Blogs
  try {
    console.log('Fetching Sakurazaka46 latest blogs...');
    const s = await safeFetch('https://sakurazaka46.com/s/s46/diary/blog/list?ima=0000');
    if (s.ok) {
      const titles = Array.from(s.text.matchAll(/<h3 class="title">[\s\S]*?<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g));
      const names = Array.from(s.text.matchAll(/<p class="name">([^<]+)<\/p>/g));
      const dates = Array.from(s.text.matchAll(/<p class="date wf-a">([^<]+)<\/p>/g));

      for (let i = 0; i < Math.min(titles.length, 10); i++) {
        const linkPath = titles[i]?.[1] || '';
        const title = titles[i]?.[2]?.replace(/<[^>]+>/g, '').trim() || 'ブログ更新';
        const name = names[i]?.[1]?.trim() || '櫻坂46';
        const date = dates[i]?.[1]?.trim() || new Date().toISOString().slice(0, 10);

        const matchedMember = memberNameMap.get(name.replace(/\s+/g, ''));
        const blogUrl = linkPath.startsWith('http') ? linkPath : `https://sakurazaka46.com${linkPath}`;

        updates.push({
          id: `saku-${linkPath.replace(/[^a-zA-Z0-9]/g, '')}`,
          groupId: 'sakurazaka46',
          memberId: matchedMember?.id,
          memberName: {
            ja: name,
            ko: matchedMember?.name.ko.hangul || name,
            en: matchedMember?.name.en.romaji || name,
          },
          memberGlyph: matchedMember?.avatar.glyph || name[0] || '櫻',
          memberHueShift: matchedMember?.avatar.hueShift || 0,
          memberImage: matchedMember?.imageUrl || null,
          title,
          publishedAt: date,
          url: blogUrl,
          type: 'official_blog',
        });
      }
    }
  } catch (err) {
    console.warn('Failed to fetch Sakurazaka blogs:', err);
  }

  // 3. Hinatazaka46 Blogs
  try {
    console.log('Fetching Hinatazaka46 latest blogs...');
    const h = await safeFetch('https://www.hinatazaka46.com/s/official/diary/member/list?ima=0000');
    if (h.ok) {
      const titles = Array.from(h.text.matchAll(/<div class="c-blog-article__title">[\s\S]*?<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g));
      const names = Array.from(h.text.matchAll(/<div class="c-blog-article__name">([^<]+)<\/div>/g));
      const dates = Array.from(h.text.matchAll(/<div class="c-blog-article__date">([^<]+)<\/div>/g));

      for (let i = 0; i < Math.min(titles.length, 10); i++) {
        const linkPath = titles[i]?.[1] || '';
        const title = titles[i]?.[2]?.replace(/<[^>]+>/g, '').trim() || 'ブログ更新';
        const name = names[i]?.[1]?.trim() || '日向坂46';
        const date = dates[i]?.[1]?.trim() || new Date().toISOString().slice(0, 10);

        const matchedMember = memberNameMap.get(name.replace(/\s+/g, ''));
        const blogUrl = linkPath.startsWith('http') ? linkPath : `https://www.hinatazaka46.com${linkPath}`;

        updates.push({
          id: `hina-${linkPath.replace(/[^a-zA-Z0-9]/g, '')}`,
          groupId: 'hinatazaka46',
          memberId: matchedMember?.id,
          memberName: {
            ja: name,
            ko: matchedMember?.name.ko.hangul || name,
            en: matchedMember?.name.en.romaji || name,
          },
          memberGlyph: matchedMember?.avatar.glyph || name[0] || '日',
          memberHueShift: matchedMember?.avatar.hueShift || 0,
          memberImage: matchedMember?.imageUrl || null,
          title,
          publishedAt: date,
          url: blogUrl,
          type: 'official_blog',
        });
      }
    }
  } catch (err) {
    console.warn('Failed to fetch Hinatazaka blogs:', err);
  }

  // Sort all updates by publishedAt descending
  updates.sort((a, b) => {
    const timeA = new Date(a.publishedAt.replace(/\./g, '-').replace(/\//g, '-')).getTime() || 0;
    const timeB = new Date(b.publishedAt.replace(/\./g, '-').replace(/\//g, '-')).getTime() || 0;
    return timeB - timeA;
  });

  try {
    const outPath = path.join(process.cwd(), 'data', 'latest-updates.json');
    fs.writeFileSync(outPath, JSON.stringify(updates, null, 2), 'utf-8');
    console.log(`✅ Successfully saved ${updates.length} latest updates to data/latest-updates.json`);
  } catch (e) {
    // Read-only serverless environment fallback
  }

  return updates;
}

if (require.main === module) {
  fetchLatestUpdates().catch(console.error);
}
