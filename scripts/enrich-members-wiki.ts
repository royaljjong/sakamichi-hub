/**
 * enrich-members-wiki.ts
 * ---------------------------------------------------------------------------
 * Batch-queries jawiki API for member kanji names and extracts infobox fields:
 *   血液型 → bloodType   (A / B / O / AB)
 *   身長   → height      (cm, numeric)
 *   趣味   → hobbies     (string[])
 *   特技   → specialties (string[])
 *
 * Updates data/members.json in-place. Skips members that already have all four
 * fields set. Rate-limits at 1.5 s between API calls.
 *
 * Usage:
 *   pnpm exec tsx scripts/enrich-members-wiki.ts
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
  bloodType?: string | null;
  height?: number | null;
  hobbies?: string[] | null;
  specialties?: string[] | null;
  [key: string]: unknown;
}

interface WikiQueryResponse {
  query?: {
    pages?: Record<
      string,
      {
        pageid?: number;
        title?: string;
        revisions?: Array<{ slots?: { main?: { content?: string } } }>;
        missing?: boolean;
      }
    >;
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DELAY_MS = 1500;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWikitext(title: string): Promise<string | null> {
  const url =
    `https://ja.wikipedia.org/w/api.php` +
    `?action=query&titles=${encodeURIComponent(title)}` +
    `&prop=revisions&rvprop=content&rvslots=main&format=json&formatversion=2`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'SakamichiHubBot/1.0 (https://sakamichi-hub.vercel.app; enrichment script; CC-BY-SA-4.0)',
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      console.warn(`  [wiki] HTTP ${res.status} for "${title}"`);
      return null;
    }

    const data = (await res.json()) as { query?: { pages?: any } };
    // formatversion=2 returns pages as an array
    const pages = data?.query?.pages;
    if (!pages) return null;
    const list = Array.isArray(pages) ? pages : Object.values(pages);
    for (const page of list) {
      if (page.missing || !page.pageid || page.pageid === -1) return null;
      const wikitext = page.revisions?.[0]?.slots?.main?.content ?? page.revisions?.[0]?.slots?.main?.['*'];
      return wikitext ?? null;
    }
    return null;
  } catch (err: any) {
    console.warn(`  [wiki] fetch error for "${title}": ${err.message}`);
    return null;
  }
}

/**
 * Extract a single infobox field value by key.
 * Handles {{仮リンク|...}} and other simple templates by stripping them.
 */
function extractField(wikitext: string, key: string): string | null {
  // Match "| key = value" (with optional spaces / full-width spaces)
  const re = new RegExp(
    `\\|\\s*${key}\\s*=\\s*([^|\\n}]+)`,
    'u',
  );
  const m = wikitext.match(re);
  if (!m) return null;

  let val = m[1]!.trim();

  // Strip wikilinks [[...]] → inner text (last part after |)
  val = val.replace(/\[\[(?:[^\]|]*\|)?([^\]]+)\]\]/g, '$1');
  // Strip {{...}} templates
  val = val.replace(/\{\{[^}]*\}\}/g, '');
  // Strip HTML tags
  val = val.replace(/<[^>]+>/g, '');
  // Strip ref tags
  val = val.replace(/<ref[^/]*(\/|>.*?<\/ref)>/gi, '');
  // Collapse whitespace
  val = val.replace(/\s+/g, ' ').trim();

  return val || null;
}

/**
 * Parse blood type: accepts A/B/O/AB (Japanese or Latin).
 */
function parseBloodType(raw: string): 'A' | 'B' | 'O' | 'AB' | null {
  const cleaned = raw.toUpperCase().replace(/[^ABOO型]/g, '').replace('型', '');
  if (cleaned === 'AB') return 'AB';
  if (cleaned === 'A') return 'A';
  if (cleaned === 'B') return 'B';
  if (cleaned === 'O') return 'O';
  return null;
}

/**
 * Parse height in cm. Input examples: "158", "158cm", "158.0", "158 cm".
 */
function parseHeight(raw: string): number | null {
  const m = raw.match(/(\d{2,3})(?:\.\d+)?/);
  if (!m) return null;
  const n = parseInt(m[1]!, 10);
  // Sanity check: idol heights typically 140–185 cm
  if (n < 140 || n > 185) return null;
  return n;
}

/**
 * Split a comma/読点/中点-separated list into individual strings.
 */
function parseList(raw: string): string[] {
  return raw
    .split(/[、,・\n]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && s !== '-' && s !== '－');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const membersPath = path.join(__dirname, '..', 'data', 'members.json');
  const members: MemberRecord[] = JSON.parse(fs.readFileSync(membersPath, 'utf-8'));

  const stats = {
    total: members.length,
    skipped: 0,
    notFound: 0,
    enriched: 0,
    bloodType: 0,
    height: 0,
    hobbies: 0,
    specialties: 0,
  };

  for (let i = 0; i < members.length; i++) {
    const member = members[i]!;
    const kanji = member.name.ja.kanji;

    // Skip if all four fields are already populated
    const alreadyDone =
      member.bloodType !== undefined &&
      member.height !== undefined &&
      member.hobbies !== undefined &&
      member.specialties !== undefined;

    if (alreadyDone) {
      stats.skipped++;
      continue;
    }

    console.log(`[${i + 1}/${members.length}] ${member.id} (${kanji})`);

    // Rate limit
    await sleep(DELAY_MS);

    const wikitext = await fetchWikitext(kanji);

    if (!wikitext) {
      console.log(`  → no Wikipedia article found`);
      stats.notFound++;
      // Mark fields as null so we don't re-query next run
      if (member.bloodType === undefined) member.bloodType = null;
      if (member.height === undefined) member.height = null;
      if (member.hobbies === undefined) member.hobbies = null;
      if (member.specialties === undefined) member.specialties = null;
      continue;
    }

    let changed = false;

    // Blood type
    if (member.bloodType === undefined) {
      const raw = extractField(wikitext, '血液型');
      const parsed = raw ? parseBloodType(raw) : null;
      member.bloodType = parsed;
      if (parsed) { stats.bloodType++; changed = true; }
    }

    // Height
    if (member.height === undefined) {
      const raw = extractField(wikitext, '身長');
      const parsed = raw ? parseHeight(raw) : null;
      member.height = parsed;
      if (parsed) { stats.height++; changed = true; }
    }

    // Hobbies
    if (member.hobbies === undefined) {
      const raw = extractField(wikitext, '趣味');
      const parsed = raw ? parseList(raw) : null;
      member.hobbies = parsed && parsed.length > 0 ? parsed : null;
      if (member.hobbies) { stats.hobbies++; changed = true; }
    }

    // Specialties
    if (member.specialties === undefined) {
      const raw = extractField(wikitext, '特技');
      const parsed = raw ? parseList(raw) : null;
      member.specialties = parsed && parsed.length > 0 ? parsed : null;
      if (member.specialties) { stats.specialties++; changed = true; }
    }

    if (changed) {
      stats.enriched++;
      console.log(
        `  → bloodType=${member.bloodType} height=${member.height} hobbies=${member.hobbies?.length ?? 0} specialties=${member.specialties?.length ?? 0}`,
      );
    } else {
      console.log(`  → article found but no infobox fields matched`);
      // Set undefined fields to null to avoid re-querying
      if (member.bloodType === undefined) member.bloodType = null;
      if (member.height === undefined) member.height = null;
      if (member.hobbies === undefined) member.hobbies = null;
      if (member.specialties === undefined) member.specialties = null;
    }
  }

  // Write updated members.json preserving original array format
  fs.writeFileSync(membersPath, JSON.stringify(members, null, 2) + '\n', 'utf-8');

  console.log('\n=== Enrichment Summary ===');
  console.log(`  Total members:     ${stats.total}`);
  console.log(`  Skipped (already): ${stats.skipped}`);
  console.log(`  Not on Wikipedia:  ${stats.notFound}`);
  console.log(`  Enriched:          ${stats.enriched}`);
  console.log(`  ├── bloodType:     ${stats.bloodType}`);
  console.log(`  ├── height:        ${stats.height}`);
  console.log(`  ├── hobbies:       ${stats.hobbies}`);
  console.log(`  └── specialties:   ${stats.specialties}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
