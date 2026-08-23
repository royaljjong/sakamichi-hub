/**
 * scripts/fetch/discography.ts
 * ---------------------------------------------------------------------------
 * Fetches singles discography from English Wikipedia [Group]_discography
 * articles. Every group of interest has a dedicated en.wikipedia article
 * (verified 2026-08-23). Rate-limited to 2s between requests.
 *
 * Writes to data/discography.json.
 *
 * Run: pnpm exec tsx scripts/fetch/discography.ts
 * ---------------------------------------------------------------------------
 */

import * as fs from 'fs';
import * as path from 'path';
import type { Single } from '../../src/lib/discography-schema';

const RATE_LIMIT_MS = 6000;
let lastRequest = 0;
function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

interface GroupSpec {
  groupId: string;
  prefix: string;
  article: string; // en.wiki article title
}

interface GroupSpecExt extends GroupSpec {
  fallbackMainArticle?: string;
}
const GROUPS: GroupSpecExt[] = [
  { groupId: 'nogizaka46', prefix: 'nogi', article: 'Nogizaka46_discography' },
  { groupId: 'akb48', prefix: 'akb48', article: 'AKB48_discography' },
  // These are redirects to main articles' Discography section
  { groupId: 'sakurazaka46', prefix: 'saku', article: 'Sakurazaka46', fallbackMainArticle: 'Sakurazaka46' },
  { groupId: 'hinatazaka46', prefix: 'hina', article: 'Hinatazaka46', fallbackMainArticle: 'Hinatazaka46' },
  { groupId: 'ske48', prefix: 'ske48', article: 'SKE48', fallbackMainArticle: 'SKE48' },
  { groupId: 'nmb48', prefix: 'nmb48', article: 'NMB48', fallbackMainArticle: 'NMB48' },
  { groupId: 'hkt48', prefix: 'hkt48', article: 'HKT48', fallbackMainArticle: 'HKT48' },
  { groupId: 'ngt48', prefix: 'ngt48', article: 'NGT48', fallbackMainArticle: 'NGT48' },
  { groupId: 'stu48', prefix: 'stu48', article: 'STU48', fallbackMainArticle: 'STU48' },
];

async function wikiSectionList(article: string, retries = 3): Promise<Array<{ index: string; line: string }>> {
  const now = Date.now();
  if (now - lastRequest < RATE_LIMIT_MS) await sleep(RATE_LIMIT_MS - (now - lastRequest));
  lastRequest = Date.now();
  const url = `https://en.wikipedia.org/w/api.php?action=parse&format=json&page=${encodeURIComponent(article)}&prop=sections&formatversion=2`;
  const res = await fetch(url, { headers: { 'User-Agent': 'SakamichiBox/1.0' } });
  if (res.status === 429 && retries > 0) {
    console.warn(`  429 rate limit, waiting 10s before retry (${retries} left)...`);
    await sleep(10000);
    return wikiSectionList(article, retries - 1);
  }
  if (!res.ok) return [];
  const data = await res.json();
  return data.parse?.sections || [];
}

async function wikiSection(article: string, section: string, retries = 3): Promise<string> {
  const now = Date.now();
  if (now - lastRequest < RATE_LIMIT_MS) await sleep(RATE_LIMIT_MS - (now - lastRequest));
  lastRequest = Date.now();
  const url = `https://en.wikipedia.org/w/api.php?action=parse&format=json&page=${encodeURIComponent(article)}&prop=wikitext&section=${section}&formatversion=2`;
  const res = await fetch(url, { headers: { 'User-Agent': 'SakamichiBox/1.0' } });
  if (res.status === 429 && retries > 0) {
    console.warn(`  429 rate limit, waiting 10s before retry (${retries} left)...`);
    await sleep(10000);
    return wikiSection(article, section, retries - 1);
  }
  if (!res.ok) return '';
  const data = await res.json();
  return data.parse?.wikitext || '';
}

/**
 * Parse "As lead artist" singles section wikitext.
 * Row structure varies but each single has:
 *   ! scope="row" | "[[Title]]" ({{nihongo2|漢字}}) OR "[[Title|漢字]]"
 * And a year column somewhere.
 */
function parseSingles(wikitext: string): Array<{ titleJa: string; titleEn: string; year: string | null }> {
  const singles: Array<{ titleJa: string; titleEn: string; year: string | null }> = [];
  // Split by both !scope="row" (Nogi/AKB/NMB) and |- (HKT/others). Rows without either marker are ignored.
  const rowsA = wikitext.split(/(?=!\s*scope="row")/);
  const rowsB = wikitext.split(/\n\|-/);
  const allRows = [...rowsA, ...rowsB];
  let currentYear: string | null = null;
  const seenTitles = new Set<string>();
  for (const row of allRows) {
    // Must contain a title marker to be considered a data row
    if (!/scope="row"|\{\{nihongo|\{\{lang\|ja/.test(row)) continue;
    // Title extraction
    // Pattern 1: [[Title]] ({{nihongo2|漢字}})
    // Pattern 2: [[Title|Display]]
    // Pattern 3: "[[Title]]" or "Title"
    let titleEn = '';
    let titleJa = '';
    // Try nihongo2 template first (Nogi/AKB style)
    const nihongo = row.match(/\{\{nihongo2\|([^}]+)\}\}/i);
    if (nihongo) titleJa = nihongo[1]!.trim();
    // Fallback: {{lang|ja|漢字}} template (NMB/HKT style)
    if (!titleJa) {
      const lang = row.match(/\{\{lang\|ja\|([^}]+)\}\}/i);
      if (lang) titleJa = lang[1]!.trim();
    }
    // Fallback: {{nihongo|title|漢字|...}} 3-arg template
    if (!titleJa) {
      const nihongo3 = row.match(/\{\{nihongo\|[^|}]*\|([^|}]+)/i);
      if (nihongo3) titleJa = nihongo3[1]!.trim();
    }
    // Wikilink title
    const link = row.match(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/);
    if (link) {
      titleEn = (link[2] || link[1]!).trim();
      if (!titleJa) titleJa = titleEn;
    } else {
      // Plain quoted title
      const quoted = row.match(/"([^"]+)"/);
      if (quoted) {
        titleEn = quoted[1]!;
        if (!titleJa) titleJa = titleEn;
      }
    }
    if (!titleJa) continue;
    if (seenTitles.has(titleJa)) continue; // dedupe (both split strategies may match same row)
    seenTitles.add(titleJa);
    // Year: look for `| YYYY` after the title. Also try full date like "March 20, 2013"
    let year: string | null = null;
    const yearMatch = row.match(/\|\s*(?:rowspan="\d+"\s*\|\s*)?(\d{4})(?!\d)/);
    if (yearMatch) year = yearMatch[1]!;
    else {
      const fullDate = row.match(/\|\s*align="left"\|\s*(?:[A-Za-z]+\s+\d{1,2},\s+)?(\d{4})/);
      if (fullDate) year = fullDate[1]!;
    }
    if (year) currentYear = year;
    singles.push({ titleJa, titleEn, year: currentYear });
  }
  return singles;
}

async function main() {
  const results: Single[] = [];
  const now = new Date().toISOString().slice(0, 10);
  const stats: Record<string, number> = {};

  for (const g of GROUPS) {
    console.log(`\n[${g.groupId}] fetching sections...`);
    const sections = await wikiSectionList(g.article);
    // Prefer "As lead artist" under "Singles"; fallback to first "Singles" section
    let target = sections.find((s) => s.line === 'As lead artist');
    if (!target) target = sections.find((s) => /Singles/i.test(s.line));
    if (!target) {
      console.warn(`  no Singles section found for ${g.article}`);
      stats[g.groupId] = 0;
      continue;
    }
    console.log(`  section ${target.index} (${target.line})`);
    const wikitext = await wikiSection(g.article, target.index);
    const parsed = parseSingles(wikitext);
    let n = 0;
    for (const p of parsed) {
      n++;
      const s: Single = {
        id: `${g.prefix}-single-${String(n).padStart(3, '0')}`,
        groupId: g.groupId,
        number: n,
        title: { ja: p.titleJa, en: p.titleEn },
        releaseDate: p.year ? `${p.year}-01-01` : '1900-01-01', // Year-only, day placeholder
        catalogNumber: null,
        coverUrl: null,
        wikipediaUrl: `https://en.wikipedia.org/wiki/${g.article}`,
        type: 'single',
      };
      results.push(s);
    }
    stats[g.groupId] = n;
    console.log(`  parsed ${n} singles`);
  }

  console.log('\n=== Summary ===');
  for (const g of GROUPS) console.log(`  ${g.groupId}: ${stats[g.groupId] || 0} singles`);
  console.log(`\nTotal: ${results.length} singles`);

  const output = {
    schemaVersion: '1.0.0' as const,
    generatedAt: now,
    singles: results,
  };
  const outPath = path.resolve('data/discography.json');
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2) + '\n', 'utf-8');
  console.log(`Written to ${outPath}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
