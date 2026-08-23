import { safeFetch } from '../lib/fetcher';
import fs from 'fs';
import path from 'path';
import type { Member } from '../../src/lib/schema';
import type { MemberVideo } from '../../src/lib/videos-schema';

/**
 * Parse a Japanese/English relative date string into an approximate ISO timestamp.
 * Examples: "3 週間前", "2 日前", "1 ヶ月前", "5 minutes ago", "2 years ago"
 */
function parseRelativeDate(text: string): string {
  const now = Date.now();
  const t = text.toLowerCase().trim();
  const num = parseInt(t.match(/\d+/)?.[0] ?? '1', 10);

  const unitMs: Record<string, number> = {
    // Japanese
    '秒': 1000,
    '分': 60 * 1000,
    '時間': 3600 * 1000,
    '日': 86400 * 1000,
    '週間': 7 * 86400 * 1000,
    'ヶ月': 30 * 86400 * 1000,
    '年': 365 * 86400 * 1000,
    // English
    'second': 1000,
    'minute': 60 * 1000,
    'hour': 3600 * 1000,
    'day': 86400 * 1000,
    'week': 7 * 86400 * 1000,
    'month': 30 * 86400 * 1000,
    'year': 365 * 86400 * 1000,
  };

  for (const [unit, ms] of Object.entries(unitMs)) {
    if (t.includes(unit)) {
      return new Date(now - num * ms).toISOString();
    }
  }

  return new Date(now).toISOString();
}

async function resolveChannelId(url: string): Promise<string | null> {
  // If URL is https://www.youtube.com/channel/UCxxx, return channel ID directly.
  const direct = url.match(/\/channel\/(UC[a-zA-Z0-9_-]+)/);
  if (direct) return direct[1] ?? null;
  // Otherwise fetch page and extract channelId from HTML
  const res = await safeFetch(url);
  if (!res.ok) return null;
  const idMatch =
    res.text.match(/"channelId":"(UC[a-zA-Z0-9_-]+)"/) ||
    res.text.match(/"browseId":"(UC[a-zA-Z0-9_-]+)"/) ||
    res.text.match(/channel\/(UC[a-zA-Z0-9_-]+)/);
  return idMatch?.[1] ?? null;
}

/** Try YouTube Atom RSS feed (returns empty array if unavailable). */
async function fetchChannelRss(channelId: string) {
  const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
  const res = await safeFetch(url);
  if (!res.ok || !res.text.includes('<entry>')) return [];
  const entries = Array.from(res.text.matchAll(/<entry>([\s\S]*?)<\/entry>/g));
  return entries
    .map((e) => {
      const body = e[1];
      const videoId =
        body?.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1] || '';
      const title = body?.match(/<title>([^<]+)<\/title>/)?.[1] || '';
      const published =
        body?.match(/<published>([^<]+)<\/published>/)?.[1] || '';
      const thumb =
        body?.match(/<media:thumbnail url="([^"]+)"/)?.[1] || '';
      return { videoId, title, published, thumb };
    })
    .filter((v) => v.videoId);
}

/**
 * Fallback: scrape the /videos tab via ytInitialData.
 * Uses the new lockupViewModel structure (YouTube 2025+).
 */
async function scrapeChannelVideos(channelId: string) {
  const res = await safeFetch(
    `https://www.youtube.com/channel/${channelId}/videos`,
  );
  if (!res.ok) return [];

  const t = res.text;
  const dataStart = t.indexOf('var ytInitialData =');
  if (dataStart === -1) return [];
  const dataEnd = t.indexOf(';</script>', dataStart);
  const raw = t.substring(dataStart + 'var ytInitialData = '.length, dataEnd);

  let data: any;
  try {
    data = JSON.parse(raw);
  } catch {
    return [];
  }

  // Check for channel-not-found alert
  const alerts: any[] = data?.alerts ?? [];
  for (const a of alerts) {
    const type = a?.alertRenderer?.type;
    if (type === 'ERROR') {
      console.warn(
        `    channel error: ${a.alertRenderer?.text?.simpleText}`,
      );
      return [];
    }
  }

  const tabs: any[] =
    data?.contents?.twoColumnBrowseResultsRenderer?.tabs ?? [];

  for (const tab of tabs) {
    const title: string = tab?.tabRenderer?.title ?? '';
    // Match both English "Videos" and Japanese "動画"
    if (title !== 'Videos' && title !== '動画') continue;

    const items: any[] =
      tab.tabRenderer.content?.richGridRenderer?.contents ?? [];

    return items
      .map((item: any) => {
        const vm = item?.richItemRenderer?.content?.lockupViewModel;
        if (!vm) return null;
        const videoId: string = vm.contentId ?? '';
        const title: string =
          vm.metadata?.lockupMetadataViewModel?.title?.content ?? '';
        const thumb: string =
          vm.contentImage?.thumbnailViewModel?.image?.sources?.[0]?.url ?? '';
        // Relative date is in the last metadata part row
        const metaRows: any[] =
          vm.metadata?.lockupMetadataViewModel?.metadata
            ?.contentMetadataViewModel?.metadataRows ?? [];
        const lastRow = metaRows[metaRows.length - 1];
        const parts: any[] = lastRow?.metadataParts ?? [];
        const relDate: string =
          parts.find((p: any) => p?.accessibilityLabel)
            ?.text?.content ?? '';
        const published = relDate
          ? parseRelativeDate(relDate)
          : new Date().toISOString();
        return { videoId, title, published, thumb };
      })
      .filter((v): v is NonNullable<typeof v> => v !== null && !!v.videoId);
  }

  return [];
}

async function fetchChannelVideos(channelId: string) {
  // Try RSS first (no scraping needed if it works)
  const rssVideos = await fetchChannelRss(channelId);
  if (rssVideos.length > 0) {
    console.log(`    ${rssVideos.length} videos via RSS`);
    return rssVideos;
  }
  // Fallback to HTML scraping
  const scraped = await scrapeChannelVideos(channelId);
  console.log(`    ${scraped.length} videos via page scrape`);
  return scraped;
}

// ──────────────────────────────────────────────────────────────
// TikTok video fetching
// ──────────────────────────────────────────────────────────────

const RSSHUB_INSTANCES = [
  'https://rsshub.app',
  'https://rsshub.rssforever.com',
  'https://rss.itggg.cn',
];

interface TikTokVideo {
  videoId: string;
  title: string;
  published: string;
  thumb: string;
  url: string;
}

/** Try RSSHub public instances for a TikTok user handle. */
async function fetchTikTokViaRSSHub(handle: string): Promise<TikTokVideo[]> {
  for (const base of RSSHUB_INSTANCES) {
    const url = `${base}/tiktok/user/@${handle}`;
    console.log(`    trying RSSHub: ${url}`);
    let res: Awaited<ReturnType<typeof safeFetch>>;
    try {
      res = await safeFetch(url);
    } catch {
      console.warn(`    RSSHub instance ${base} unreachable`);
      continue;
    }
    if (!res.ok) {
      console.warn(`    RSSHub ${base} returned ${res.status}`);
      continue;
    }
    const text = res.text;
    // Must contain RSS/Atom item entries
    if (!text.includes('<item>') && !text.includes('<entry>')) {
      console.warn(`    RSSHub ${base}: no RSS items in response`);
      continue;
    }

    // Parse <item> blocks
    const itemMatches = Array.from(text.matchAll(/<item>([\s\S]*?)<\/item>/g));
    if (itemMatches.length === 0) continue;

    const results: TikTokVideo[] = itemMatches
      .map((m) => {
        const body = m[1] ?? '';
        const titleMatch = body.match(/<title><!\[CDATA\[([^\]]*)\]\]><\/title>/) ||
          body.match(/<title>([^<]*)<\/title>/);
        const title = titleMatch?.[1]?.trim() || '';
        const linkMatch = body.match(/<link>([^<]+)<\/link>/) ||
          body.match(/<link[^>]*href="([^"]+)"/);
        const linkUrl = linkMatch?.[1]?.trim() || '';
        const pubMatch = body.match(/<pubDate>([^<]+)<\/pubDate>/);
        const pubDate = pubMatch?.[1]?.trim() || '';
        const published = pubDate ? new Date(pubDate).toISOString() : new Date().toISOString();
        // Enclosure for video, or image in description
        const encMatch = body.match(/<enclosure[^>]+url="([^"]+)"[^>]*type="video\/mp4"/);
        const imgMatch = body.match(/<img[^>]+src="([^"]+)"/);
        const thumb = encMatch?.[1] || imgMatch?.[1] || '';
        // Extract video ID from URL (/@handle/video/NNNN)
        const vidIdMatch = linkUrl.match(/\/video\/(\d+)/);
        const videoId = vidIdMatch?.[1] || linkUrl.split('/').pop() || '';
        return { videoId, title, published, thumb, url: linkUrl };
      })
      .filter((v) => v.videoId && v.url);

    if (results.length > 0) {
      console.log(`    ${results.length} videos via RSSHub (${base})`);
      return results;
    }
  }
  return [];
}

/** Playwright fallback: load TikTok profile page and extract video posts from DOM. */
async function fetchTikTokViaPlaywright(handle: string): Promise<TikTokVideo[]> {
  let chromium: any;
  try {
    const pw = await import('playwright');
    chromium = pw.chromium;
  } catch {
    console.warn('    Playwright not available');
    return [];
  }

  let browser: any;
  try {
    browser = await chromium.launch({ headless: true });
  } catch (e: any) {
    console.warn(`    Playwright launch failed: ${e.message}`);
    return [];
  }

  try {
    const page = await browser.newPage();
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });
    const profileUrl = `https://www.tiktok.com/@${handle}`;
    await page.goto(profileUrl, { waitUntil: 'networkidle', timeout: 30000 });

    // Extract video links and thumbnails
    const videos = await page.evaluate(() => {
      const results: Array<{ videoId: string; title: string; url: string; thumb: string }> = [];
      // Look for video links: <a href="/@handle/video/NNNN">
      const links = document.querySelectorAll<HTMLAnchorElement>('a[href*="/video/"]');
      for (const link of links) {
        const href = link.href;
        const vidMatch = href.match(/\/video\/(\d+)/);
        if (!vidMatch?.[1]) continue;
        const videoId = vidMatch[1];
        const img = link.querySelector('img');
        const thumb = img?.src || img?.getAttribute('src') || '';
        const title = img?.alt || link.getAttribute('aria-label') || '';
        results.push({ videoId, title, url: href, thumb });
        if (results.length >= 5) break;
      }
      return results;
    });

    await browser.close();
    console.log(`    ${videos.length} videos via Playwright`);
    const now = new Date();
    return (videos as Array<{ videoId: string; title: string; url: string; thumb: string }>).map((v, i) => ({
      ...v,
      // No reliable published date from DOM; approximate by index (newest first)
      published: new Date(now.getTime() - i * 7 * 86400 * 1000).toISOString(),
    }));
  } catch (e: any) {
    console.warn(`    Playwright scrape failed: ${e.message}`);
    try { await browser.close(); } catch { /* ignore */ }
    return [];
  }
}

async function fetchTikTokVideos(handle: string): Promise<TikTokVideo[]> {
  // Approach A: RSSHub
  const rssVideos = await fetchTikTokViaRSSHub(handle);
  if (rssVideos.length > 0) return rssVideos;

  // Approach B: Playwright
  console.log(`    Falling back to Playwright for @${handle}`);
  return fetchTikTokViaPlaywright(handle);
}

// ──────────────────────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────────────────────

async function main() {
  const members: Member[] = JSON.parse(
    fs.readFileSync(path.resolve('data/members.json'), 'utf-8'),
  );

  const groups = JSON.parse(
    fs.readFileSync(path.resolve('data/groups.json'), 'utf-8'),
  );
  const groupMap = new Map<string, any>();
  for (const g of groups.groups) groupMap.set(g.id, g);

  // ── YouTube ──────────────────────────────────────────────────
  const withYt = members.filter(
    (m) => m.links?.some((l) => l.type === 'youtube' && l.status !== 'dead'),
  );
  console.log(`Members with youtube: ${withYt.length}`);

  const videos: MemberVideo[] = [];
  for (const m of withYt) {
    const ytLink = m.links.find((l) => l.type === 'youtube');
    if (!ytLink) continue;
    console.log(`  ${m.id}: ${ytLink.url}`);
    const channelId = await resolveChannelId(ytLink.url);
    if (!channelId) {
      console.warn(`    could not resolve channelId`);
      continue;
    }
    const entries = await fetchChannelVideos(channelId);
    const group = groupMap.get(m.primaryGroupId);
    for (const v of entries.slice(0, 5)) {
      videos.push({
        id: `yt-${v.videoId}`,
        platform: 'youtube',
        videoId: v.videoId,
        memberId: m.id,
        memberName: {
          ja: m.name.ja.kanji,
          ko: m.name.ko.hangul,
          en: m.name.en.romaji,
        },
        memberGlyph: m.avatar.glyph,
        memberHueShift: m.avatar.hueShift,
        memberImage: m.imageUrl || null,
        groupId: m.primaryGroupId,
        franchise: (
          group?.franchise === 'sakamichi' ? 'sakamichi' : 'akb48g'
        ) as 'sakamichi' | 'akb48g',
        title: v.title,
        publishedAt: v.published,
        url: `https://www.youtube.com/watch?v=${v.videoId}`,
        thumbnailUrl: v.thumb,
        channelUrl: ytLink.url,
      });
    }
    await new Promise((r) => setTimeout(r, 1500));
  }

  // ── TikTok ───────────────────────────────────────────────────
  const withTt = members.filter(
    (m) => m.links?.some((l) => l.type === 'tiktok' && l.status !== 'dead'),
  );
  console.log(`\nMembers with tiktok: ${withTt.length}`);

  let ttFetchedCount = 0;
  let ttFailedCount = 0;

  for (const m of withTt) {
    const ttLink = m.links.find((l) => l.type === 'tiktok');
    if (!ttLink) continue;
    // Extract handle from URL: https://www.tiktok.com/@handle
    const handleMatch = ttLink.url.match(/tiktok\.com\/@([^/?#]+)/);
    if (!handleMatch?.[1]) {
      console.warn(`  ${m.id}: could not extract handle from ${ttLink.url}`);
      continue;
    }
    const handle = handleMatch[1];
    console.log(`  ${m.id}: @${handle}`);

    let entries: TikTokVideo[] = [];
    try {
      entries = await fetchTikTokVideos(handle);
    } catch (e: any) {
      console.warn(`    fetch error: ${e.message}`);
    }

    if (entries.length === 0) {
      ttFailedCount++;
      console.warn(`    no videos fetched for @${handle}`);
    } else {
      ttFetchedCount += entries.length;
    }

    const group = groupMap.get(m.primaryGroupId);
    for (const v of entries.slice(0, 5)) {
      videos.push({
        id: `tt-${v.videoId}`,
        platform: 'tiktok',
        videoId: v.videoId,
        memberId: m.id,
        memberName: {
          ja: m.name.ja.kanji,
          ko: m.name.ko.hangul,
          en: m.name.en.romaji,
        },
        memberGlyph: m.avatar.glyph,
        memberHueShift: m.avatar.hueShift,
        memberImage: m.imageUrl || null,
        groupId: m.primaryGroupId,
        franchise: (
          group?.franchise === 'sakamichi' ? 'sakamichi' : 'akb48g'
        ) as 'sakamichi' | 'akb48g',
        title: v.title,
        publishedAt: v.published,
        url: v.url,
        thumbnailUrl: v.thumb,
        channelUrl: ttLink.url,
      });
    }
    await new Promise((r) => setTimeout(r, 1500));
  }

  if (ttFetchedCount === 0 && withTt.length > 0) {
    console.warn(`\nWARNING: All RSSHub instances failed and Playwright could not fetch TikTok videos. TikTok section is empty.`);
  } else {
    console.log(`\nTikTok: fetched ${ttFetchedCount} videos across ${withTt.length - ttFailedCount}/${withTt.length} members`);
  }

  videos.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  const top = videos.slice(0, 60);
  fs.writeFileSync(
    path.resolve('data/latest-videos.json'),
    JSON.stringify(top, null, 2) + '\n',
  );
  console.log(`\nSaved ${top.length} latest videos to data/latest-videos.json`);
}

if (require.main === module)
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
