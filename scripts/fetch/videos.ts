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

async function main() {
  const members: Member[] = JSON.parse(
    fs.readFileSync(path.resolve('data/members.json'), 'utf-8'),
  );
  const withYt = members.filter(
    (m) => m.links?.some((l) => l.type === 'youtube' && l.status !== 'dead'),
  );
  console.log(`Members with youtube: ${withYt.length}`);

  const groups = JSON.parse(
    fs.readFileSync(path.resolve('data/groups.json'), 'utf-8'),
  );
  const groupMap = new Map<string, any>();
  for (const g of groups.groups) groupMap.set(g.id, g);

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
    await new Promise((r) => setTimeout(r, 1200));
  }

  videos.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  const top = videos.slice(0, 40);
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
