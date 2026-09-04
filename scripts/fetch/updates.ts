import { safeFetch } from '../lib/fetcher';
import * as fs from 'fs';
import * as path from 'path';
import crypto from 'node:crypto';
import type { Member } from '../../src/lib/schema';

export interface RecentUpdate {
  id: string;
  groupId: string;
  franchise: 'sakamichi' | 'akb48g';
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

// ─── Helpers ───────────────────────────────────────────────────────────────

/** Strip all HTML tags and decode common HTML entities (including numeric), then trim. */
function stripHtml(s: string): string {
  return s
    .replace(/<[^>]+>/g, '')
    .replace(/&#x([0-9A-Fa-f]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}

/** Parse an RFC-2822 pubDate string (e.g. "Fri, 21 Aug 2026 16:30:00 +0900") → "YYYY-MM-DD". */
function parsePubDate(raw: string): string {
  const d = new Date(raw);
  if (!isNaN(d.getTime())) {
    return d.toISOString().slice(0, 10);
  }
  // fallback
  return new Date().toISOString().slice(0, 10);
}

/** Deterministic short hash of a string (for stable ids). */
function shortHash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36);
}

// ─── AKB48 Group name maps ──────────────────────────────────────────────────

const GROUP_NAME_MAP: Record<
  string,
  { ja: string; ko: string; en: string; glyph: string }
> = {
  akb48: { ja: 'AKB48', ko: 'AKB48', en: 'AKB48', glyph: '秋' },
  ske48: { ja: 'SKE48', ko: 'SKE48', en: 'SKE48', glyph: 'S' },
  nmb48: { ja: 'NMB48', ko: 'NMB48', en: 'NMB48', glyph: 'N' },
  hkt48: { ja: 'HKT48', ko: 'HKT48', en: 'HKT48', glyph: 'H' },
  ngt48: { ja: 'NGT48', ko: 'NGT48', en: 'NGT48', glyph: 'N' },
  stu48: { ja: 'STU48', ko: 'STU48', en: 'STU48', glyph: 'S' },
};

// ─── Ameblo RSS fetcher ─────────────────────────────────────────────────────

/**
 * Fetch an Ameblo group blog via its Ameba RSS feed and return up to `limit`
 * RecentUpdate entries.
 *
 * Ameba RSS URL pattern: http://rssblog.ameba.jp/{amebloHandle}/rss20.xml
 * The feed is standard RSS 2.0, redirected from http → https by CloudFront.
 *
 * Confirmed working handles (2026-08-22):
 *   akihabara48, ske48official, nmb48, hkt48, ngt48
 * Confirmed 404:
 *   official-ngt48  → fallback to ngt48
 */
async function fetchAmebloGroup(
  amebloHandle: string,
  groupId: string,
  limit = 10,
): Promise<RecentUpdate[]> {
  const rssUrl = `http://rssblog.ameba.jp/${amebloHandle}/rss20.xml`;
  const groupInfo = GROUP_NAME_MAP[groupId];
  if (!groupInfo) {
    console.warn(`[fetchAmebloGroup] Unknown groupId: ${groupId}`);
    return [];
  }

  let text: string;
  try {
    const res = await safeFetch(rssUrl);
    if (!res.ok) {
      console.warn(
        `[fetchAmebloGroup] ${groupId} RSS returned HTTP ${res.status}`,
      );
      return [];
    }
    text = res.text;
  } catch (err: any) {
    console.warn(`[fetchAmebloGroup] ${groupId} fetch error: ${err.message}`);
    return [];
  }

  const items = Array.from(text.matchAll(/<item>([\s\S]*?)<\/item>/g));
  const results: RecentUpdate[] = [];

  for (const itemMatch of items.slice(0, limit)) {
    const block = itemMatch[1] ?? '';
    const titleMatch = block.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/);
    const linkMatch = block.match(/<link>([\s\S]*?)<\/link>/);
    const pubDateMatch = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/);

    const rawTitle = titleMatch?.[1] ?? 'ブログ更新';
    const title = stripHtml(rawTitle).replace(/\s+/g, ' ').trim();
    const url = (linkMatch?.[1] ?? '').trim();
    const publishedAt = parsePubDate((pubDateMatch?.[1] ?? '').trim());

    if (!url) continue;

    results.push({
      id: `akb-ameblo-${groupId}-${shortHash(url)}`,
      groupId,
      franchise: 'akb48g',
      memberId: undefined,
      memberName: {
        ja: groupInfo.ja,
        ko: groupInfo.ko,
        en: groupInfo.en,
      },
      memberGlyph: groupInfo.glyph,
      memberHueShift: 0,
      memberImage: null,
      title,
      publishedAt,
      url,
      type: 'official_blog',
    });
  }

  return results;
}

// ─── SKE48 per-member blog scraper ─────────────────────────────────────────
//
// SKE48 Mobile public endpoint: https://ske48.co.jp/blog/list/3/0/
//
// Observed structure (2026-08-22, publicly accessible without login):
//   <a href="/blog/detail/89230/" class="clearfix">
//     <span class="cat name">井田玲音名</span>
//     <p class="date">2026.08.21</p>
//     <p class="tit">花粉</p>
//   </a>
//
// Each <a> block = one post with member name, date, and title.
// The member name is in <span class="cat name"> and matches members.json kanji.
async function fetchSke48MemberBlogs(
  memberNameMap: Map<string, Member>,
  limit = 10,
): Promise<RecentUpdate[]> {
  const groupInfo = GROUP_NAME_MAP['ske48']!;
  const SKE_BASE = 'https://ske48.co.jp';
  const listUrl = `${SKE_BASE}/blog/list/3/0/`;

  let text: string;
  try {
    const res = await safeFetch(listUrl);
    if (!res.ok) {
      console.warn(`[fetchSke48MemberBlogs] HTTP ${res.status}`);
      return [];
    }
    text = res.text;
  } catch (err: any) {
    console.warn(`[fetchSke48MemberBlogs] fetch error: ${err.message}`);
    return [];
  }

  // Match entire <a href="/blog/detail/..."> ... </a> blocks
  const blockRe = /<a\s+href="(\/blog\/detail\/\d+\/)"[^>]*>([\s\S]*?)<\/a>/g;
  const results: RecentUpdate[] = [];

  for (const m of text.matchAll(blockRe)) {
    if (results.length >= limit) break;
    const linkPath = m[1] ?? '';
    const inner = m[2] ?? '';

    const nameMatch = inner.match(/<span class="cat name">([^<]+)<\/span>/);
    const dateMatch = inner.match(/<p class="date">([^<]+)<\/p>/);
    const titMatch = inner.match(/<p class="tit">([\s\S]*?)<\/p>/);

    if (!nameMatch || !titMatch) continue;

    const rawName = stripHtml(nameMatch[1] ?? '').replace(/\s+/g, '');
    const title = stripHtml(titMatch[1] ?? '').replace(/\s+/g, ' ').trim();
    if (!rawName || !title) continue;

    const rawDate = (dateMatch?.[1] ?? '').replace(/\./g, '-');
    const publishedAt =
      rawDate.match(/^\d{4}-\d{2}-\d{2}$/) ? rawDate : new Date().toISOString().slice(0, 10);

    const url = `${SKE_BASE}${linkPath}`;
    const matchedMember = memberNameMap.get(rawName);

    results.push({
      id: `ske-blog-${shortHash(url)}`,
      groupId: 'ske48',
      franchise: 'akb48g',
      memberId: matchedMember?.id,
      memberName: {
        ja: matchedMember?.name.ja.kanji ?? rawName,
        ko: matchedMember?.name.ko.hangul ?? rawName,
        en: matchedMember?.name.en.romaji ?? rawName,
      },
      memberGlyph: matchedMember?.avatar.glyph ?? rawName[0] ?? groupInfo.glyph,
      memberHueShift: matchedMember?.avatar.hueShift ?? 0,
      memberImage: matchedMember?.imageUrl ?? null,
      title,
      publishedAt,
      url,
      type: 'official_blog',
    });
  }

  return results;
}

// ─── STU48 news scraper ─────────────────────────────────────────────────────

/**
 * Fetch STU48 news from https://www.stu48.com/news (HTML-based).
 *
 * Observed structure (2026-08-22):
 *   <a href="/news/detail/XXXXX">
 *     <time datetime="2026.08.21" class="date">2026.08.21</time>
 *     <p class="tit">Title here</p>
 *   </a>
 *
 * Items without a <p class="tit"> (e.g. image-only links) are silently skipped.
 */
async function fetchStu48News(limit = 10): Promise<RecentUpdate[]> {
  const groupInfo = GROUP_NAME_MAP['stu48']!;
  const STU_BASE = 'https://www.stu48.com';
  const newsUrl = `${STU_BASE}/news`;

  let text: string;
  try {
    const res = await safeFetch(newsUrl);
    if (!res.ok) {
      console.warn(`[fetchStu48News] HTTP ${res.status}`);
      return [];
    }
    text = res.text;
  } catch (err: any) {
    console.warn(`[fetchStu48News] fetch error: ${err.message}`);
    return [];
  }

  // Match blocks: <a href="/news/detail/NNNNN">…</a>
  const blockRe = /<a\s+href="(\/news\/detail\/\d+)">([\s\S]*?)<\/a>/g;
  const results: RecentUpdate[] = [];

  for (const m of text.matchAll(blockRe)) {
    if (results.length >= limit) break;
    const linkPath = m[1] ?? '';
    const inner = m[2] ?? '';

    // Must have a title paragraph
    const titMatch = inner.match(/<p class="tit">([\s\S]*?)<\/p>/);
    if (!titMatch) continue;

    const title = stripHtml(titMatch[1] ?? '').replace(/\s+/g, ' ').trim();
    if (!title) continue;

    // Extract datetime from <time datetime="YYYY.MM.DD">
    const dateMatch = inner.match(/<time\s+datetime="([^"]+)"/);
    const rawDate = (dateMatch?.[1] ?? '').replace(/\./g, '-');
    const publishedAt =
      rawDate.match(/^\d{4}-\d{2}-\d{2}$/) ? rawDate : new Date().toISOString().slice(0, 10);

    const url = `${STU_BASE}${linkPath}`;

    results.push({
      id: `akb-ameblo-stu48-${shortHash(url)}`,
      groupId: 'stu48',
      franchise: 'akb48g',
      memberId: undefined,
      memberName: {
        ja: groupInfo.ja,
        ko: groupInfo.ko,
        en: groupInfo.en,
      },
      memberGlyph: groupInfo.glyph,
      memberHueShift: 0,
      memberImage: null,
      title,
      publishedAt,
      url,
      type: 'official_blog',
    });
  }

  return results;
}

// ─── Nitter RSS fetcher ─────────────────────────────────────────────────────

const NITTER_INSTANCES = [
  'https://nitter.privacydev.net',
  'https://nitter.poast.org',
  'https://nitter.net',
  'https://nitter.cz',
];

/**
 * Attempt to fetch a user's X/Twitter posts as RSS via Nitter.
 * Tries each instance in order; returns [] if all fail or return no items.
 *
 * RSS URL: {instance}/{handle}/rss
 * Each <item> contains <title>, <pubDate>, and <link> (Nitter URL).
 * We convert the Nitter link → https://x.com/{handle}/status/{id}.
 */
async function fetchNitterFeed(
  handle: string,
  groupId: string,
  franchise: 'sakamichi' | 'akb48g',
  glyph: string,
  memberName: { ja: string; ko: string; en: string },
  limit = 5,
): Promise<RecentUpdate[]> {
  let text: string | null = null;
  let successInstance = '';

  for (const instance of NITTER_INSTANCES) {
    const url = `${instance}/${handle}/rss`;
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15000);
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'SakamichiBoxBot/1.0' },
      });
      clearTimeout(timer);
      if (res.ok) {
        const body = await res.text();
        if (body && body.includes('<item>')) {
          text = body;
          successInstance = instance;
          break;
        }
        console.warn(`[fetchNitterFeed] ${instance} returned 200 but no <item> blocks`);
      } else {
        console.warn(`[fetchNitterFeed] ${instance} HTTP ${res.status}`);
      }
    } catch (err: any) {
      console.warn(`[fetchNitterFeed] ${instance} failed: ${err.message}`);
    }
  }

  if (!text) {
    console.warn(`[fetchNitterFeed] All Nitter instances failed for @${handle}`);
    return [];
  }

  console.log(`[fetchNitterFeed] @${handle} via ${successInstance}`);

  const items = Array.from(text.matchAll(/<item>([\s\S]*?)<\/item>/g));
  const results: RecentUpdate[] = [];

  for (const itemMatch of items.slice(0, limit)) {
    const block = itemMatch[1] ?? '';
    const titleMatch = block.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/);
    const pubDateMatch = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
    const linkMatch = block.match(/<link>([\s\S]*?)<\/link>/);

    const rawText = stripHtml(titleMatch?.[1] ?? '').replace(/\s+/g, ' ').trim();
    if (!rawText) continue;
    const title = '🐦 ' + rawText.slice(0, 100);

    const publishedAt = parsePubDate((pubDateMatch?.[1] ?? '').trim());

    // Convert Nitter link to x.com canonical URL
    const nitterLink = (linkMatch?.[1] ?? '').trim();
    let xUrl = nitterLink;
    const statusMatch = nitterLink.match(/\/status\/(\d+)/);
    if (statusMatch) {
      xUrl = `https://x.com/${handle}/status/${statusMatch[1]}`;
    }

    if (!xUrl) continue;

    results.push({
      id: `x-${handle}-${shortHash(xUrl)}`,
      groupId,
      franchise,
      memberId: undefined,
      memberName,
      memberGlyph: glyph,
      memberHueShift: 0,
      memberImage: null,
      title,
      publishedAt,
      url: xUrl,
      type: 'official_blog',
    });
  }

  return results;
}

// ─── Normalizer ─────────────────────────────────────────────────────────────

const GROUP_PREFIX: Record<string, string> = {
  nogizaka46: 'nogi', sakurazaka46: 'saku', hinatazaka46: 'hina',
  akb48: 'akb', ske48: 'ske', nmb48: 'nmb', hkt48: 'hkt', ngt48: 'ngt', stu48: 'stu',
  jkt48: 'jkt', bnk48: 'bnk', cgm48: 'cgm', mnl48: 'mnl',
  'akb48-team-sh': 'sh', 'akb48-team-tp': 'tp', klp48: 'klp',
};

function normalizeUpdate(u: RecentUpdate): RecentUpdate | null {
  // Decode HTML entities in title
  let title = u.title.replace(/&#x([0-9A-Fa-f]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  title = title.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
  title = title.trim();

  // Reject bare URL as title
  if (/^https?:\/\//i.test(title)) return null;
  // Reject empty title
  if (!title) return null;

  // Normalize publishedAt to ISO 8601 offset
  let publishedAt = u.publishedAt;
  const asDate = new Date(publishedAt);
  if (isNaN(asDate.getTime())) {
    // Try common non-ISO patterns: "2026.9.4 13:49" or "2026.09.04 19:02"
    const m = publishedAt.match(/^(\d{4})[.\-\/](\d{1,2})[.\-\/](\d{1,2})[\s]+(\d{1,2}):(\d{1,2})/);
    if (m) {
      const y = m[1]!, mo = m[2]!, d = m[3]!, h = m[4]!, mi = m[5]!;
      const iso = new Date(Date.UTC(+y, +mo - 1, +d, +h - 9, +mi)); // assume JST source
      if (!isNaN(iso.getTime())) publishedAt = iso.toISOString();
      else return null;
    } else {
      return null;
    }
  } else {
    publishedAt = asDate.toISOString();
  }

  // Regenerate ID deterministically from url+publishedAt hash
  const prefix = GROUP_PREFIX[u.groupId] ?? u.groupId.slice(0, 4);
  const hash = crypto.createHash('sha1').update(u.url + '|' + publishedAt).digest('hex').slice(0, 12);
  const id = `${prefix}-${hash}`;

  return { ...u, title, publishedAt, id };
}

function normalizeAndDedup(items: RecentUpdate[]): RecentUpdate[] {
  const normalized = items.map((u) => normalizeUpdate(u)).filter((x): x is RecentUpdate => x !== null);
  const seen = new Map<string, RecentUpdate>();
  for (const u of normalized) {
    const existing = seen.get(u.url);
    if (!existing || u.publishedAt > existing.publishedAt) {
      seen.set(u.url, u);
    }
  }
  return [...seen.values()].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

// ─── Main ───────────────────────────────────────────────────────────────────

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

  const sakamichiUpdates: RecentUpdate[] = [];
  const akbUpdates: RecentUpdate[] = [];

  // 1. Nogizaka46 Blogs (Up to 15)
  try {
    console.log('Fetching Nogizaka46 latest blogs...');
    const n = await safeFetch('https://www.nogizaka46.com/s/n46/diary/MEMBER/list?ima=0000');
    if (n.ok) {
      const cards = Array.from(n.text.matchAll(/<a [^>]*href="(\/s\/n46\/diary\/detail\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/g));
      for (const card of cards.slice(0, 15)) {
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

        sakamichiUpdates.push({
          id: `nogi-${linkPath.replace(/[^a-zA-Z0-9]/g, '')}`,
          groupId: 'nogizaka46',
          franchise: 'sakamichi',
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

  // 2. Sakurazaka46 Blogs (Up to 15)
  try {
    console.log('Fetching Sakurazaka46 latest blogs...');
    const s = await safeFetch('https://sakurazaka46.com/s/s46/diary/blog/list?ima=0000');
    if (s.ok) {
      const titles = Array.from(s.text.matchAll(/<h3 class="title">[\s\S]*?<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g));
      const names = Array.from(s.text.matchAll(/<p class="name">([^<]+)<\/p>/g));
      const dates = Array.from(s.text.matchAll(/<p class="date wf-a">([^<]+)<\/p>/g));

      for (let i = 0; i < Math.min(titles.length, 15); i++) {
        const linkPath = titles[i]?.[1] || '';
        const title = titles[i]?.[2]?.replace(/<[^>]+>/g, '').trim() || 'ブログ更新';
        const name = names[i]?.[1]?.trim() || '櫻坂46';
        const date = dates[i]?.[1]?.trim() || new Date().toISOString().slice(0, 10);

        const matchedMember = memberNameMap.get(name.replace(/\s+/g, ''));
        const blogUrl = linkPath.startsWith('http') ? linkPath : `https://sakurazaka46.com${linkPath}`;

        sakamichiUpdates.push({
          id: `saku-${linkPath.replace(/[^a-zA-Z0-9]/g, '')}`,
          groupId: 'sakurazaka46',
          franchise: 'sakamichi',
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

  // 3. Hinatazaka46 Blogs (Up to 15)
  try {
    console.log('Fetching Hinatazaka46 latest blogs...');
    const h = await safeFetch('https://www.hinatazaka46.com/s/official/diary/member/list?ima=0000');
    if (h.ok) {
      const titles = Array.from(h.text.matchAll(/<div class="c-blog-article__title">[\s\S]*?<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g));
      const names = Array.from(h.text.matchAll(/<div class="c-blog-article__name">([^<]+)<\/div>/g));
      const dates = Array.from(h.text.matchAll(/<div class="c-blog-article__date">([^<]+)<\/div>/g));

      for (let i = 0; i < Math.min(titles.length, 15); i++) {
        const linkPath = titles[i]?.[1] || '';
        const title = titles[i]?.[2]?.replace(/<[^>]+>/g, '').trim() || 'ブログ更新';
        const name = names[i]?.[1]?.trim() || '日向坂46';
        const date = dates[i]?.[1]?.trim() || new Date().toISOString().slice(0, 10);

        const matchedMember = memberNameMap.get(name.replace(/\s+/g, ''));
        const blogUrl = linkPath.startsWith('http') ? linkPath : `https://www.hinatazaka46.com${linkPath}`;

        sakamichiUpdates.push({
          id: `hina-${linkPath.replace(/[^a-zA-Z0-9]/g, '')}`,
          groupId: 'hinatazaka46',
          franchise: 'sakamichi',
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

  // 4. AKB48 Group Official Updates (30 members feed)
  // NOTE: akbPostsRaw below is kept as editorial fixture for future fallback.
  //       It is NOT published — only live-fetched entries enter finalAkb.
  const akbPostsRaw = [
    {
      id: 'akb-oguri-yui',
      groupId: 'akb48',
      memberId: 'akb48-oguri-yui',
      name: { ja: '小栗 有以', ko: '오구리 유이', en: 'Yui Oguri' },
      glyph: '小',
      hueShift: 24,
      image: 'https://d2r1lkk9i7row.cloudfront.net/mobile/member/83100622.jpg',
      title: 'AKB48 劇場公演 & 最新シングルのお知らせ',
      publishedAt: '2026.8.16 12:00',
      url: 'https://ameblo.jp/akihabara48/',
    },
    {
      id: 'akb-kuranoo-narumi',
      groupId: 'akb48',
      memberId: 'akb48-kuranoo-narumi',
      name: { ja: '倉野尾 成美', ko: '쿠라노오 나루미', en: 'Narumi Kuranoo' },
      glyph: '倉',
      hueShift: -18,
      image: 'https://d2r1lkk9i7row.cloudfront.net/mobile/member/83100609.jpg',
      title: '総監督よりファンの皆様へメッセージ',
      publishedAt: '2026.8.16 11:30',
      url: 'https://ameblo.jp/akihabara48/',
    },
    {
      id: 'akb-mukaichi-mion',
      groupId: 'akb48',
      memberId: 'akb48-mukaichi-mion',
      name: { ja: '向井地 美音', ko: '무카이치 미온', en: 'Mion Mukaichi' },
      glyph: '向',
      hueShift: 10,
      image: 'https://d2r1lkk9i7row.cloudfront.net/mobile/member/83100588.jpg',
      title: '夏のツアーリハーサル真っ最中です！',
      publishedAt: '2026.8.16 10:15',
      url: 'https://ameblo.jp/akihabara48/',
    },
    {
      id: 'akb-murayama-yuiri',
      groupId: 'akb48',
      memberId: 'akb48-murayama-yuiri',
      name: { ja: '村山 彩希', ko: '무라야마 유이리', en: 'Yuiri Murayama' },
      glyph: '村',
      hueShift: -5,
      image: 'https://d2r1lkk9i7row.cloudfront.net/mobile/member/83100547.jpg',
      title: '劇場公演の感想と最近の出来事 🍎',
      publishedAt: '2026.8.15 22:40',
      url: 'https://ameblo.jp/akihabara48/',
    },
    {
      id: 'akb-chiba-erii',
      groupId: 'akb48',
      memberId: 'akb48-chiba-erii',
      name: { ja: '千葉 恵里', ko: '치바 에리이', en: 'Erii Chiba' },
      glyph: '千',
      hueShift: 30,
      image: 'https://d2r1lkk9i7row.cloudfront.net/mobile/member/83100645.jpg',
      title: 'お気に入りの夏服コーデ紹介 👗',
      publishedAt: '2026.8.15 21:15',
      url: 'https://ameblo.jp/akihabara48/',
    },
    {
      id: 'akb-yamauchi-mizuki',
      groupId: 'akb48',
      memberId: 'akb48-yamauchi-mizuki',
      name: { ja: '山内 瑞葵', ko: '야마우치 미즈키', en: 'Mizuki Yamauchi' },
      glyph: '山',
      hueShift: 18,
      image: 'https://d2r1lkk9i7row.cloudfront.net/mobile/member/83100669.jpg',
      title: 'ラッキーずっきーラジオの裏話 🎀',
      publishedAt: '2026.8.15 20:00',
      url: 'https://ameblo.jp/akihabara48/',
    },
    {
      id: 'akb-sato-airi',
      groupId: 'akb48',
      memberId: 'akb48-sato-airi',
      name: { ja: '佐藤 綺星', ko: '사토 아이리', en: 'Airi Sato' },
      glyph: '佐',
      hueShift: -12,
      image: 'https://d2r1lkk9i7row.cloudfront.net/mobile/member/83100790.jpg',
      title: '17期生公演、ありがとうございました！',
      publishedAt: '2026.8.15 19:30',
      url: 'https://ameblo.jp/akihabara48/',
    },
    {
      id: 'akb-yagi-azuki',
      groupId: 'akb48',
      memberId: 'akb48-yagi-azuki',
      name: { ja: '八木 愛月', ko: '야기 아즈키', en: 'Azuki Yagi' },
      glyph: '八',
      hueShift: 8,
      image: 'https://d2r1lkk9i7row.cloudfront.net/mobile/member/83100816.jpg',
      title: '先輩方とのステージで学んだこと',
      publishedAt: '2026.8.15 18:00',
      url: 'https://ameblo.jp/akihabara48/',
    },
    {
      id: 'ske-kumazaki-haruka',
      groupId: 'ske48',
      memberId: 'ske48-kumazaki-haruka',
      name: { ja: '熊崎 晴香', ko: '쿠마자키 하루카', en: 'Haruka Kumazaki' },
      glyph: '熊',
      hueShift: 15,
      image: 'https://ske48.co.jp/img/profile/detail/kumazaki_haruka.jpg',
      title: 'SKE48 劇場公演と夏のライブツアー！',
      publishedAt: '2026.8.15 17:45',
      url: 'https://ske48.co.jp/blog',
    },
    {
      id: 'ske-suenaga-ouka',
      groupId: 'ske48',
      memberId: 'ske48-suenaga-ouka',
      name: { ja: '末永 桜花', ko: '수에나가 오우카', en: 'Ouka Suenaga' },
      glyph: '末',
      hueShift: -20,
      image: 'https://ske48.co.jp/img/profile/detail/suenaga_ouka.jpg',
      title: 'おーちゃんわーるどへようこそ 🌸',
      publishedAt: '2026.8.15 16:30',
      url: 'https://ske48.co.jp/blog',
    },
    {
      id: 'ske-nomura-miyo',
      groupId: 'ske48',
      memberId: 'ske48-nomura-miyo',
      name: { ja: '野村 実代', ko: '노무라 미요', en: 'Miyo Nomura' },
      glyph: '野',
      hueShift: 5,
      image: 'https://ske48.co.jp/img/profile/detail/nomura_miyo.jpg',
      title: 'みよまるの日常と最近のハマりもの',
      publishedAt: '2026.8.15 15:10',
      url: 'https://ske48.co.jp/blog',
    },
    {
      id: 'nmb-kojima-karin',
      groupId: 'nmb48',
      memberId: 'nmb48-kojima-karin',
      name: { ja: '小嶋 花梨', ko: '코지마 카린', en: 'Karin Kojima' },
      glyph: '小',
      hueShift: 32,
      image: 'https://www.nmb48.com/images/member/kojima_karin.jpg',
      title: 'NMB48 ここにだって天使はある公演',
      publishedAt: '2026.8.15 14:20',
      url: 'https://ameblo.jp/nmb48/',
    },
    {
      id: 'nmb-shiotsuki-keito',
      groupId: 'nmb48',
      memberId: 'nmb48-shiotsuki-keito',
      name: { ja: '塩月 希依音', ko: '시오츠키 케이트', en: 'Keito Shiotsuki' },
      glyph: '塩',
      hueShift: -14,
      image: 'https://www.nmb48.com/images/member/shiotsuki_keito.jpg',
      title: 'けいとの笑顔をお届けします ☀️',
      publishedAt: '2026.8.15 13:00',
      url: 'https://ameblo.jp/nmb48/',
    },
    {
      id: 'nmb-sakata-misaki',
      groupId: 'nmb48',
      memberId: 'nmb48-sakata-misaki',
      name: { ja: '坂田 心咲', ko: '사카타 미사키', en: 'Misaki Sakata' },
      glyph: '坂',
      hueShift: 22,
      image: 'https://www.nmb48.com/images/member/sakata_misaki.jpg',
      title: 'みちゃぴーの全力パフォーマンス！',
      publishedAt: '2026.8.15 12:10',
      url: 'https://ameblo.jp/nmb48/',
    },
    {
      id: 'hkt-toyonaga-aki',
      groupId: 'hkt48',
      memberId: 'hkt48-toyonaga-aki',
      name: { ja: '豊永 阿紀', ko: '토요나가 아키', en: 'Aki Toyonaga' },
      glyph: '豊',
      hueShift: -8,
      image: 'https://www.hkt48.jp/files/99/profile/toyonaga_aki.jpg',
      title: 'HKT48 劇場公演、最高の一日でした！',
      publishedAt: '2026.8.14 21:10',
      url: 'https://ameblo.jp/hkt48/',
    },
    {
      id: 'hkt-ishibashi-ibuki',
      groupId: 'hkt48',
      memberId: 'hkt48-ishibashi-ibuki',
      name: { ja: '石橋 颯', ko: '이시바시 이부키', en: 'Ibuki Ishibashi' },
      glyph: '石',
      hueShift: 16,
      image: 'https://www.hkt48.jp/files/99/profile/ishibashi_ibuki.jpg',
      title: 'いぶいぶの元気パワーチャージ ⚡',
      publishedAt: '2026.8.14 20:25',
      url: 'https://ameblo.jp/hkt48/',
    },
    {
      id: 'hkt-takemoto-kurumi',
      groupId: 'hkt48',
      memberId: 'hkt48-takemoto-kurumi',
      name: { ja: '竹本 くるみ', ko: '타케모토 쿠루미', en: 'Kurumi Takemoto' },
      glyph: '竹',
      hueShift: -24,
      image: 'https://www.hkt48.jp/files/99/profile/takemoto_kurumi.jpg',
      title: 'くるみたんの日常ブログ 🐾',
      publishedAt: '2026.8.14 19:40',
      url: 'https://ameblo.jp/hkt48/',
    },
    {
      id: 'ngt-fujisaki-miyu',
      groupId: 'ngt48',
      memberId: 'ngt48-fujisaki-miyu',
      name: { ja: '藤崎 未夢', ko: '후지사키 미유', en: 'Miyu Fujisaki' },
      glyph: '藤',
      hueShift: 12,
      image: 'https://ngt48.jp/profile/fujisaki_miyu.jpg',
      title: '新潟からの爽やかな風 🌾',
      publishedAt: '2026.8.14 18:50',
      url: 'https://ngt48.jp/profile/detail/fujisaki_miyu',
    },
    {
      id: 'ngt-nishigata-marina',
      groupId: 'ngt48',
      memberId: 'ngt48-nishigata-marina',
      name: { ja: '西潟 茉莉奈', ko: '니시가타 마리나', en: 'Marina Nishigata' },
      glyph: '西',
      hueShift: -16,
      image: 'https://ngt48.jp/profile/nishigata_marina.jpg',
      title: 'ファンのみなさんへの感謝のメッセージ',
      publishedAt: '2026.8.14 18:00',
      url: 'https://ngt48.jp/profile/detail/nishigata_marina',
    },
    {
      id: 'stu-okada-azumi',
      groupId: 'stu48',
      memberId: 'stu48-okada-azumi',
      name: { ja: '岡田 あずみ', ko: '오카다 아즈미', en: 'Azumi Okada' },
      glyph: '岡',
      hueShift: -6,
      image: 'https://sp.stu48.com/img/profile/okada_azumi.jpg',
      title: 'キャプテン就任後の日々と意気込み ⚓',
      publishedAt: '2026.8.14 17:15',
      url: 'https://sp.stu48.com/blog/',
    },
    {
      id: 'stu-nakamura-mai',
      groupId: 'stu48',
      memberId: 'stu48-nakamura-mai',
      name: { ja: '中村 舞', ko: '나카무라 마이', en: 'Mai Nakamura' },
      glyph: '中',
      hueShift: -25,
      image: 'https://sp.stu48.com/img/profile/nakamura_mai.jpg',
      title: '瀬戸内からの風をお届けします 🌊',
      publishedAt: '2026.8.14 16:30',
      url: 'https://sp.stu48.com/blog/',
    },
    {
      id: 'stu-ishida-chiho',
      groupId: 'stu48',
      memberId: 'stu48-ishida-chiho',
      name: { ja: '石田 千穂', ko: '이시다 치호', en: 'Chiho Ishida' },
      glyph: '石',
      hueShift: 28,
      image: 'https://sp.stu48.com/img/profile/ishida_chiho.jpg',
      title: 'ちほちゃんのキラキラ瀬戸内便り ✨',
      publishedAt: '2026.8.14 15:40',
      url: 'https://sp.stu48.com/blog/',
    },
    {
      id: 'jkt-shani',
      groupId: 'jkt48',
      memberId: 'jkt48-shani-indira-natio',
      name: { ja: 'シャニ', ko: '샤니', en: 'Shani Indira Natio' },
      glyph: 'シ',
      hueShift: 14,
      image: 'https://jkt48.com/images/member/shani_indira_natio.jpg',
      title: 'Salam hangat dari Jakarta! 🇮🇩',
      publishedAt: '2026.8.14 14:00',
      url: 'https://jkt48.com/member/detail/id/shani_indira_natio',
    },
    {
      id: 'jkt-feni',
      groupId: 'jkt48',
      memberId: 'jkt48-feni-fitriyanti',
      name: { ja: 'フェニ', ko: '페니', en: 'Feni Fitriyanti' },
      glyph: 'フ',
      hueShift: -18,
      image: 'https://jkt48.com/images/member/feni_fitriyanti.jpg',
      title: 'Semangat theater hari ini ✨',
      publishedAt: '2026.8.14 13:00',
      url: 'https://jkt48.com/member/detail/id/feni_fitriyanti',
    },
    {
      id: 'jkt-freya',
      groupId: 'jkt48',
      memberId: 'jkt48-freya-jayawardana',
      name: { ja: 'フレヤ', ko: '프레야', en: 'Freya Jayawardana' },
      glyph: 'フ',
      hueShift: 20,
      image: 'https://jkt48.com/images/member/freya_jayawardana.jpg',
      title: 'Freya daily vlog update 🎬',
      publishedAt: '2026.8.14 12:00',
      url: 'https://jkt48.com/member/detail/id/freya_jayawardana',
    },
    {
      id: 'bnk-hoop',
      groupId: 'bnk48',
      memberId: 'bnk48-patalee-prasertteerachai',
      name: { ja: 'フープ', ko: '후프', en: 'Patalee Prasertteerachai' },
      glyph: 'フ',
      hueShift: -10,
      image: 'https://www.bnk48.com/images/members/hoop.jpg',
      title: 'BNK48 Captain message from Bangkok 🇹🇭',
      publishedAt: '2026.8.14 11:00',
      url: 'https://www.bnk48.com/bnk48-members/detail/hoop',
    },
    {
      id: 'cgm-aom',
      groupId: 'cgm48',
      memberId: 'cgm48-manichar-aimdilokwong',
      name: { ja: 'オーム', ko: '아옴', en: 'Manichar Aimdilokwong' },
      glyph: 'オ',
      hueShift: 26,
      image: 'https://cgm48official.com/images/members/aom.jpg',
      title: 'CGM48 Chiang Mai theater show recap',
      publishedAt: '2026.8.14 10:00',
      url: 'https://cgm48official.com/members/aom',
    },
    {
      id: 'mnl-sheki',
      groupId: 'mnl48',
      memberId: 'mnl48-shekinah-arzaga',
      name: { ja: 'シェキ', ko: '셰키', en: 'Shekinah Arzaga' },
      glyph: 'シ',
      hueShift: -12,
      image: 'https://mnl48.ph/images/members/sheki.jpg',
      title: 'Mabuhay! Music updates from Manila 🇵🇭',
      publishedAt: '2026.8.14 09:00',
      url: 'https://mnl48.ph/members/sheki',
    },
    {
      id: 'tp-liu-yu-ching',
      groupId: 'akb48-team-tp',
      memberId: 'akb48-team-tp-liu-yu-ching',
      name: { ja: '劉語晴', ko: '류위칭', en: 'Liu Yu-ching' },
      glyph: '劉',
      hueShift: 8,
      image: 'https://www.akb48teamtp.com/upload/members/77_yuqing.jpg',
      title: 'Taipei stage performance memo 🇹🇼',
      publishedAt: '2026.8.14 08:30',
      url: 'https://www.akb48teamtp.com/members/77_yuqing',
    },
    {
      id: 'klp-gyoten-yurina',
      groupId: 'klp48',
      memberId: 'klp48-yurina-gyoten',
      name: { ja: '行天 優莉奈', ko: '교텐 유리나', en: 'Yurina Gyoten' },
      glyph: '行',
      hueShift: -22,
      image: 'https://klp48.my/img/members/yurina_gyoten.jpg',
      title: 'KLP48 クアラルンプールでの新たな挑戦！🇲🇾',
      publishedAt: '2026.8.14 08:00',
      url: 'https://klp48.my/members/yurina_gyoten',
    },
  ];
  // akbPostsRaw is retained for editorial reference ONLY — not published.
  void akbPostsRaw;

  // ── 4a. SKE48 per-member blog (official site, public) ──────────────────
  console.log('Fetching SKE48 per-member blogs...');
  try {
    const skeEntries = await fetchSke48MemberBlogs(memberNameMap, 10);
    console.log(`  ske48 (per-member): ${skeEntries.length} entries`);
    akbUpdates.push(...skeEntries);
  } catch (err) {
    console.warn('  SKE48 per-member blog failed:', err);
  }

  // ── 4b. Ameblo RSS per group (parallel) ────────────────────────────────
  // SKE48 kept as fallback if per-member scrape returns 0 entries.
  console.log('Fetching AKB48 group Ameblo RSS feeds...');
  const amebloSources: Array<[string, string]> = [
    ['akihabara48', 'akb48'],
    // ske48official: per-member scraper above preferred; include as fallback
    ['ske48official', 'ske48'],
    ['nmb48', 'nmb48'],
    ['hkt48', 'hkt48'],
    // official-ngt48 returns 404 → use ngt48 fallback (confirmed 2026-08-22)
    ['ngt48', 'ngt48'],
  ];

  const amebloResults = await Promise.allSettled(
    amebloSources.map(([handle, groupId]) => fetchAmebloGroup(handle, groupId, 10)),
  );

  // Collect seen URLs to deduplicate (prefer per-member entries already added)
  const seenUrls = new Set(akbUpdates.map((u) => u.url));

  for (let i = 0; i < amebloResults.length; i++) {
    const r = amebloResults[i]!;
    const [handle, groupId] = amebloSources[i]!;
    if (r.status === 'fulfilled') {
      // For SKE48: only add Ameblo entries not already covered by per-member fetch
      const newEntries = r.value.filter((e) => !seenUrls.has(e.url));
      console.log(
        `  ${groupId} (ameblo/${handle}): ${r.value.length} entries (${newEntries.length} new after dedup)`,
      );
      for (const e of newEntries) {
        seenUrls.add(e.url);
        akbUpdates.push(e);
      }
    } else {
      console.warn(`  ${groupId} (ameblo/${handle}) rejected:`, r.reason);
    }
  }

  // ── 4b. STU48 news (HTML) ───────────────────────────────────────────────
  console.log('Fetching STU48 news...');
  try {
    const stuEntries = await fetchStu48News(10);
    console.log(`  stu48: ${stuEntries.length} entries`);
    akbUpdates.push(...stuEntries);
  } catch (err) {
    console.warn('  STU48 news failed:', err);
  }

  // ── 5. Nitter / X posts (parallel, best-effort) ─────────────────────────
  console.log('Fetching Nitter RSS feeds...');
  const nitterSources: Array<{
    handle: string;
    groupId: string;
    franchise: 'sakamichi' | 'akb48g';
    glyph: string;
    memberName: { ja: string; ko: string; en: string };
  }> = [
    {
      handle: 'nogizaka46',
      groupId: 'nogizaka46',
      franchise: 'sakamichi',
      glyph: '乃',
      memberName: { ja: '乃木坂46', ko: '노기자카46', en: 'Nogizaka46' },
    },
    {
      handle: 'sakurazaka46',
      groupId: 'sakurazaka46',
      franchise: 'sakamichi',
      glyph: '櫻',
      memberName: { ja: '櫻坂46', ko: '사쿠라자카46', en: 'Sakurazaka46' },
    },
    {
      handle: 'hinatazaka46_com',
      groupId: 'hinatazaka46',
      franchise: 'sakamichi',
      glyph: '日',
      memberName: { ja: '日向坂46', ko: '히나타자카46', en: 'Hinatazaka46' },
    },
    {
      handle: 'akb48',
      groupId: 'akb48',
      franchise: 'akb48g',
      glyph: '秋',
      memberName: { ja: 'AKB48', ko: 'AKB48', en: 'AKB48' },
    },
    {
      handle: 'official_ske48',
      groupId: 'ske48',
      franchise: 'akb48g',
      glyph: 'S',
      memberName: { ja: 'SKE48', ko: 'SKE48', en: 'SKE48' },
    },
    {
      handle: 'nmb48_official',
      groupId: 'nmb48',
      franchise: 'akb48g',
      glyph: 'N',
      memberName: { ja: 'NMB48', ko: 'NMB48', en: 'NMB48' },
    },
    {
      handle: 'hkt48_official',
      groupId: 'hkt48',
      franchise: 'akb48g',
      glyph: 'H',
      memberName: { ja: 'HKT48', ko: 'HKT48', en: 'HKT48' },
    },
    {
      handle: 'official_ngt48',
      groupId: 'ngt48',
      franchise: 'akb48g',
      glyph: 'N',
      memberName: { ja: 'NGT48', ko: 'NGT48', en: 'NGT48' },
    },
    {
      handle: 'stu48_official',
      groupId: 'stu48',
      franchise: 'akb48g',
      glyph: 'S',
      memberName: { ja: 'STU48', ko: 'STU48', en: 'STU48' },
    },
  ];

  const nitterResults = await Promise.allSettled(
    nitterSources.map((s) =>
      fetchNitterFeed(s.handle, s.groupId, s.franchise, s.glyph, s.memberName, 5),
    ),
  );

  for (let i = 0; i < nitterResults.length; i++) {
    const r = nitterResults[i]!;
    const s = nitterSources[i]!;
    if (r.status === 'fulfilled') {
      if (r.value.length > 0) {
        console.log(`  @${s.handle}: ${r.value.length} tweets`);
        if (s.franchise === 'sakamichi') {
          sakamichiUpdates.push(...r.value);
        } else {
          akbUpdates.push(...r.value);
        }
      }
    } else {
      console.warn(`  @${s.handle} Nitter rejected:`, r.reason);
    }
  }

  // Sort both by publishedAt descending
  const sortByDate = (a: RecentUpdate, b: RecentUpdate) => {
    const timeA = new Date(a.publishedAt.replace(/\./g, '-').replace(/\//g, '-')).getTime() || 0;
    const timeB = new Date(b.publishedAt.replace(/\./g, '-').replace(/\//g, '-')).getTime() || 0;
    return timeB - timeA;
  };

  sakamichiUpdates.sort(sortByDate);
  akbUpdates.sort(sortByDate);

  // Take top 30 each
  const finalSakamichi = sakamichiUpdates.slice(0, 30);
  const finalAkb = akbUpdates.slice(0, 30);

  const combined = normalizeAndDedup([...finalSakamichi, ...finalAkb]);

  try {
    const outPath = path.join(process.cwd(), 'data', 'latest-updates.json');
    fs.writeFileSync(outPath, JSON.stringify(combined, null, 2), 'utf-8');
    console.log(
      `Successfully saved ${finalSakamichi.length} Sakamichi & ${finalAkb.length} AKB48G updates to data/latest-updates.json`,
    );
  } catch (e) {
    // Read-only serverless environment fallback
  }

  return combined;
}

if (require.main === module) {
  fetchLatestUpdates().catch(console.error);
}
