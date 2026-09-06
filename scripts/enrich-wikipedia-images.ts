/**
 * enrich-wikipedia-images.ts
 * ---------------------------------------------------------------------------
 * For each member without imageUrl, queries jawiki API to find a Wikimedia
 * Commons infobox image with a verified CC-BY-SA license.
 *
 * Identity check: article body must mention the member's group name to prevent
 * homonym matches (e.g., 川上千尋 voice actress vs NMB48 idol).
 *
 * Usage:
 *   pnpm data:wiki-images          — preview mode (no writes)
 *   pnpm data:wiki-images:write    — write confirmed URLs to members.json
 *
 * Output: data/wikipedia-image-audit.json (always written, regardless of mode)
 */

import * as fs from 'fs';
import * as path from 'path';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MemberRecord {
  id: string;
  name: {
    ja: { kanji: string; kana: string };
    ko: { hangul: string };
    en: { romaji: string };
    aliases: string[];
  };
  primaryGroupId: string;
  imageUrl?: string | null;
  provenance: {
    source: string;
    sourceUrl: string | null;
    checkedAt: string;
    note: string | null;
  };
  [key: string]: unknown;
}

interface AuditResult {
  id: string;
  name: string;
  group: string;
  imageUrl?: string;
  license?: string;
  author?: string;
  wikiPage?: string;
  skipped?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GROUP_NAMES: Record<string, string[]> = {
  akb48: ['AKB48'],
  ske48: ['SKE48'],
  nmb48: ['NMB48'],
  hkt48: ['HKT48'],
  ngt48: ['NGT48'],
  stu48: ['STU48'],
};

const USER_AGENT =
  'SakamichiHubBot/1.0 (https://sakamichi-hub.vercel.app; wikipedia-image-enrichment; CC-BY-SA-4.0)';

const DELAY_MS = 350;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Decode HTML entities in a URL string (handles &amp; etc.) */
function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

/**
 * Fetch the parsed HTML of a jawiki article.
 * Returns null on error or if article doesn't exist.
 */
async function fetchWikiHtml(title: string): Promise<string | null> {
  const url =
    `https://ja.wikipedia.org/w/api.php` +
    `?action=parse&page=${encodeURIComponent(title)}&format=json&prop=text&redirects=1&disablelimitreport=1`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      error?: unknown;
      parse?: { text?: { '*'?: string }; title?: string };
    };
    if (json.error) return null;
    return json.parse?.text?.['*'] ?? null;
  } catch {
    return null;
  }
}

/**
 * Given a Wikimedia Commons file name (without "File:" prefix),
 * fetch its license metadata via the Commons imageinfo API.
 * Returns { license, author } or null if not CC-licensed.
 */
async function fetchImageLicense(
  fileName: string,
): Promise<{ license: string; author: string } | null> {
  const url =
    `https://commons.wikimedia.org/w/api.php` +
    `?action=query&titles=${encodeURIComponent('File:' + fileName)}` +
    `&prop=imageinfo&iiprop=extmetadata&format=json`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      query?: {
        pages?: Record<
          string,
          { imageinfo?: Array<{ extmetadata?: Record<string, { value?: string }> }> }
        >;
      };
    };
    const pages = json.query?.pages;
    if (!pages) return null;
    const page = Object.values(pages)[0];
    if (!page) return null;
    const meta = page.imageinfo?.[0]?.extmetadata;
    if (!meta) return null;
    const license = (meta['LicenseShortName']?.value ?? meta['License']?.value ?? '').trim();
    const authorRaw = (meta['Artist']?.value ?? '').replace(/<[^>]+>/g, '').trim();
    const author = authorRaw || 'Unknown';
    return { license, author };
  } catch {
    return null;
  }
}

/**
 * Known group photos that appear in individual member articles but are NOT
 * member portraits. Keyed on the decoded filename fragment.
 * Add entries here whenever the validator reports a duplicate imageUrl.
 */
const GROUP_PHOTO_BLOCKLIST = new Set([
  // STU48 vessel photo — appears in every STU48 member's Wikipedia article
  'STU48号_2019年3月23日の様子.png',
  'STU48',
  // HKT48 theater photo — appears in multiple HKT48 members' articles
  'HKT48_劇場',
  '⻄日本シティ銀⾏_HKT48_劇場',
]);

/**
 * Returns true if the filename looks like a group photo (not a member portrait).
 * Checks against blocklist and also heuristic checks:
 * - Filename contains a group name followed by a number/year (group event photo)
 * - Filename contains 劇場 (theater) without a person name pattern
 */
function isGroupPhoto(fileName: string): boolean {
  const decoded = decodeURIComponent(fileName);
  // Blocklist check (substring match)
  for (const blocked of GROUP_PHOTO_BLOCKLIST) {
    if (decoded.includes(blocked)) return true;
  }
  // Heuristic: contains group name pattern + year/number suffix
  const groupEventPattern = /(AKB48|SKE48|NMB48|HKT48|NGT48|STU48)[号_\s]\d{4}/;
  if (groupEventPattern.test(decoded)) return true;
  return false;
}

/**
 * Extract the best Commons image URL from Wikipedia article HTML.
 *
 * The Wikipedia API returns parsed HTML where infobox images appear as:
 *   src="//thumb.wikimedia.org/wikipedia/commons/thumb/.../NNpx-Name.jpg?utm_source=..."
 *
 * We decode HTML entities, take the first img pointing to Wikimedia Commons,
 * skip SVG files (icons, flags), group photos, and return the full https URL.
 */
function extractCommonsImageUrl(html: string): string | null {
  // Match src attributes pointing to thumb.wikimedia.org or upload.wikimedia.org commons
  // The HTML entities (&amp;) in query strings must be decoded
  const imgTagPattern = /<img\s[^>]*src="([^"]+)"/gi;
  let match: RegExpExecArray | null;

  while ((match = imgTagPattern.exec(html)) !== null) {
    const rawSrc = match[1] ?? '';
    const src = decodeHtmlEntities(rawSrc);

    // Only care about Wikimedia Commons images (either thumb.wikimedia.org or upload.wikimedia.org)
    if (!src.includes('wikimedia.org/wikipedia/commons')) continue;

    // Skip SVG files (icons, flags, logos)
    if (src.toLowerCase().endsWith('.svg') || src.toLowerCase().includes('.svg/')) continue;

    // Skip PNG files that are group logos/icons (typically small)
    // But allow larger PNG photos

    // Skip tiny icons (width < 100 in the Npx-Name.jpg suffix)
    const pxMatch = src.match(/\/(\d+)px-/);
    if (pxMatch && parseInt(pxMatch[1] ?? '0', 10) < 100) continue;

    // Extract the raw filename part to check blocklist
    const urlParts = src.split('?')[0]?.split('/') ?? [];
    const rawFileName = urlParts[urlParts.length - 1] ?? '';
    if (isGroupPhoto(rawFileName)) continue;

    // Return the full https URL
    if (src.startsWith('//')) return 'https:' + src;
    if (src.startsWith('https://')) return src;
    if (src.startsWith('http://')) return src.replace('http://', 'https://');
  }

  return null;
}

/**
 * Extract the Commons file name from a Wikimedia image URL.
 * Handles both thumb.wikimedia.org and upload.wikimedia.org patterns.
 *
 * Examples:
 *   https://thumb.wikimedia.org/wikipedia/commons/thumb/2/21/%E5%B7%9D%E4%B8%8A.jpg/250px-%E5%B7%9D%E4%B8%8A.jpg?utm_source=...
 *   → 川上千尋.jpg  (decoded from %E5%B7%9D%E4%B8%8A%E5%8D%83%E5%B0%8B.jpg)
 */
function extractFileName(imgUrl: string): string | null {
  try {
    // Strip query string
    const clean = imgUrl.split('?')[0] ?? imgUrl;
    const parts = clean.split('/');
    let fileName = parts[parts.length - 1] ?? '';
    // If thumbnail (e.g. 250px-川上千尋.jpg), strip the Npx- prefix
    const thumbMatch = fileName.match(/^\d+px-(.+)$/);
    if (thumbMatch?.[1]) fileName = thumbMatch[1];
    // URL-decode the filename
    return decodeURIComponent(fileName) || null;
  } catch {
    return null;
  }
}

/**
 * Try to find a CC-licensed Wikimedia Commons image for a member.
 * Returns image metadata or null if nothing suitable found.
 *
 * Tries multiple title variants in order. For each:
 *   1. Fetch parsed HTML
 *   2. Identity check: article must mention member's group name
 *   3. Extract first suitable Commons img URL
 *   4. Verify CC license via Commons API
 */
async function tryFindMemberImage(member: MemberRecord): Promise<{
  url: string;
  license: string;
  author: string;
  wikiPageTitle: string;
  wasHomonymRejected: boolean;
} | null> {
  const groupNames = GROUP_NAMES[member.primaryGroupId] ?? [];
  if (groupNames.length === 0) return null;

  const kanji = member.name.ja.kanji;

  // Try multiple title variants (most to least specific)
  const candidates = [
    kanji,
    `${kanji} (アイドル)`,
    `${kanji} (歌手)`,
    `${kanji} (タレント)`,
    `${kanji} (芸能人)`,
  ];

  let homonymSeen = false;

  for (const title of candidates) {
    await sleep(DELAY_MS);
    const html = await fetchWikiHtml(title);
    if (!html) continue;

    // Identity check: article must mention the member's group
    const mentionsGroup = groupNames.some((g) => html.includes(g));
    if (!mentionsGroup) {
      // Article exists but doesn't mention the group — likely a homonym
      homonymSeen = true;
      continue;
    }

    // Article confirmed as this group's member
    const imgUrl = extractCommonsImageUrl(html);
    if (!imgUrl) continue;

    const fileName = extractFileName(imgUrl);
    if (!fileName) continue;

    // Verify license
    await sleep(DELAY_MS);
    const licenseInfo = await fetchImageLicense(fileName);
    if (!licenseInfo) continue;

    // Must be CC-licensed
    const licLower = licenseInfo.license.toLowerCase();
    if (!licLower.startsWith('cc')) continue;

    return {
      url: imgUrl,
      license: licenseInfo.license,
      author: licenseInfo.author,
      wikiPageTitle: title,
      wasHomonymRejected: homonymSeen,
    };
  }

  // Return partial info to distinguish homonym rejection from not-found
  if (homonymSeen) {
    return { url: '', license: '', author: '', wikiPageTitle: '', wasHomonymRejected: true };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const dataPath = path.join(__dirname, '..', 'data', 'members.json');
  const members: MemberRecord[] = JSON.parse(fs.readFileSync(dataPath, 'utf-8')) as MemberRecord[];
  const writeMode = process.argv.includes('--write');
  const today = new Date().toISOString().slice(0, 10);

  const targets = members.filter((m) => !m.imageUrl);
  console.log(`Mode: ${writeMode ? 'WRITE' : 'preview'}`);
  console.log(`Scanning ${targets.length} members without imageUrl...\n`);

  const results: AuditResult[] = [];
  let matched = 0;
  let homonymRejects = 0;

  for (let i = 0; i < targets.length; i++) {
    const m = targets[i]!;
    process.stdout.write(`[${i + 1}/${targets.length}] ${m.id} (${m.name.ja.kanji})... `);

    const found = await tryFindMemberImage(m);

    if (found && found.url) {
      // Confirmed CC image found
      matched++;
      results.push({
        id: m.id,
        name: m.name.ja.kanji,
        group: m.primaryGroupId,
        imageUrl: found.url,
        license: found.license,
        author: found.author,
        wikiPage: found.wikiPageTitle,
      });
      const homonymNote = found.wasHomonymRejected ? ' [homonym rejected before match]' : '';
      console.log(`✓ ${found.license} by ${found.author}${homonymNote}`);

      if (writeMode) {
        const target = members.find((x) => x.id === m.id);
        if (target) {
          target.imageUrl = found.url;
          target.provenance = {
            ...target.provenance,
            note:
              (target.provenance.note ? target.provenance.note + ' | ' : '') +
              `Image: ${found.license} by ${found.author} via Wikimedia Commons ` +
              `(https://ja.wikipedia.org/wiki/${encodeURIComponent(found.wikiPageTitle)})`,
          };
        }
      }
    } else if (found && found.wasHomonymRejected) {
      // Homonym article(s) found, no group-confirmed article found
      homonymRejects++;
      results.push({
        id: m.id,
        name: m.name.ja.kanji,
        group: m.primaryGroupId,
        skipped: 'homonym-only',
      });
      console.log('— [article found but homonym: no group mention in any variant]');
    } else {
      // No Wikipedia article at all
      results.push({
        id: m.id,
        name: m.name.ja.kanji,
        group: m.primaryGroupId,
        skipped: 'no-wiki-or-image',
      });
      console.log('— (no article / no Commons image / non-CC)');
    }
  }

  // Write data/members.json in write mode
  if (writeMode && matched > 0) {
    fs.writeFileSync(dataPath, JSON.stringify(members, null, 2) + '\n', 'utf-8');
    console.log(`\nWrote ${matched} imageUrl updates to data/members.json`);
  } else if (writeMode && matched === 0) {
    console.log('\nNo updates to write.');
  }

  // Always write audit report
  const reportPath = path.join(__dirname, '..', 'data', 'wikipedia-image-audit.json');
  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      {
        checkedAt: today,
        mode: writeMode ? 'write' : 'preview',
        scanned: targets.length,
        matched,
        homonymRejects,
        results,
      },
      null,
      2,
    ) + '\n',
    'utf-8',
  );

  console.log(`\n=== Wikipedia Image Enrichment Summary ===`);
  console.log(`  Mode:             ${writeMode ? 'write' : 'preview'}`);
  console.log(`  Scanned:          ${targets.length}`);
  console.log(`  Matched:          ${matched}`);
  console.log(`  Homonym rejects:  ${homonymRejects}`);
  console.log(`  No article/image: ${targets.length - matched - homonymRejects}`);
  console.log(`  Report:           data/wikipedia-image-audit.json`);
}

main().catch((err: unknown) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
