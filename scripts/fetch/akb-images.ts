/**
 * Playwright-based per-group profile image scraper for AKB48 family.
 * Runs from CI (ubuntu-latest) where Japan-facing sites are reachable.
 * Local execution from restricted networks will skip blocked groups.
 */

import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';

interface Scraped {
  kanji: string;
  imageUrl: string;
  profileUrl?: string;
}

interface GroupConfig {
  groupId: string;
  url: string;
  imgFilterRegex: string; // regex applied to img.src
  timeoutMs: number;
}

const GROUPS: GroupConfig[] = [
  { groupId: 'akb48', url: 'https://www.akb48.co.jp/about/member/', imgFilterRegex: 'cloudfront.net/(?:mobile|hashiranokai)/member/', timeoutMs: 30000 },
  { groupId: 'nmb48', url: 'https://www.nmb48.com/members/', imgFilterRegex: 'nmb48\\.com/images/member', timeoutMs: 30000 },
  { groupId: 'hkt48', url: 'https://www.hkt48.jp/profile/', imgFilterRegex: 'cf-pc.*profile|hkt48.*profile', timeoutMs: 30000 },
];

async function scrapeGroup(g: GroupConfig, browser: any): Promise<Scraped[]> {
  const ctx = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
    locale: 'ja-JP',
    timezoneId: 'Asia/Tokyo',
  });
  const page = await ctx.newPage();
  try {
    console.log(`\n[${g.groupId}] navigating ${g.url}...`);
    const resp = await page.goto(g.url, { waitUntil: 'load', timeout: g.timeoutMs });
    console.log(`  status=${resp?.status()}`);
    if (!resp?.ok()) {
      console.warn(`  non-2xx, skipping`);
      return [];
    }
    await page.waitForTimeout(4000);
    const items: Scraped[] = await page.evaluate((filter: string) => {
      const rx = new RegExp(filter);
      const out: any[] = [];
      const seen = new Set<string>();
      // 1) anchor with img inside
      document.querySelectorAll('a').forEach((a) => {
        const img = a.querySelector('img');
        if (!img) return;
        const src = ((img as HTMLImageElement).src || '').split('?')[0]!;
        if (!rx.test(src)) return;
        const alt = img.getAttribute('alt') || '';
        const kanjiClean = alt.replace(/\s+/g, '');
        if (!/^[一-鿿ぁ-ゖ゠-ヿ]{2,15}$/.test(kanjiClean)) return;
        if (seen.has(kanjiClean)) return;
        seen.add(kanjiClean);
        out.push({ kanji: kanjiClean, imageUrl: src, profileUrl: (a as HTMLAnchorElement).href });
      });
      // 2) fallback: image without anchor wrapper
      if (out.length < 10) {
        document.querySelectorAll('img').forEach((img) => {
          const src = ((img as HTMLImageElement).src || '').split('?')[0]!;
          if (!rx.test(src)) return;
          const alt = img.getAttribute('alt') || '';
          const kanjiClean = alt.replace(/\s+/g, '');
          if (!/^[一-鿿ぁ-ゖ゠-ヿ]{2,15}$/.test(kanjiClean)) return;
          if (seen.has(kanjiClean)) return;
          seen.add(kanjiClean);
          out.push({ kanji: kanjiClean, imageUrl: src });
        });
      }
      return out;
    }, g.imgFilterRegex);
    console.log(`  extracted ${items.length}`);
    return items;
  } catch (err: any) {
    console.warn(`  scrape error: ${err.message?.slice(0, 100)}`);
    return [];
  } finally {
    await ctx.close();
  }
}

async function main() {
  const membersPath = path.resolve('data/members.json');
  const members: any[] = JSON.parse(fs.readFileSync(membersPath, 'utf-8'));
  const now = new Date().toISOString().slice(0, 10);

  const browser = await chromium.launch({ headless: true });
  let totalUpdated = 0;

  try {
    for (const g of GROUPS) {
      const scraped = await scrapeGroup(g, browser);
      let updated = 0, added = 0;
      for (const s of scraped) {
        const target = members.find(
          (mm: any) => mm.primaryGroupId === g.groupId && (mm.name?.ja?.kanji || '').replace(/\s+/g, '') === s.kanji,
        );
        if (!target) continue;
        const currentBase = (target.imageUrl || '').split('?')[0]!;
        if (currentBase === s.imageUrl) continue;
        target.imageUrl = s.imageUrl;
        if (s.profileUrl && !(target.links || []).some((l: any) => l.url === s.profileUrl)) {
          target.links = target.links || [];
          target.links.push({
            type: 'official_profile',
            url: s.profileUrl,
            status: 'ok',
            isOfficial: true,
            lastCheckedAt: now,
            provenance: { source: 'official', sourceUrl: g.url, checkedAt: now, note: null },
          });
        }
        updated++;
      }
      console.log(`  [${g.groupId}] updated ${updated} members`);
      totalUpdated += updated;
    }
  } finally {
    await browser.close();
  }

  if (totalUpdated > 0) {
    fs.writeFileSync(membersPath, JSON.stringify(members, null, 2) + '\n', 'utf-8');
  }
  console.log(`\nTotal updated: ${totalUpdated}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
