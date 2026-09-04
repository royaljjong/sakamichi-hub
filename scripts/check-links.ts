import * as fs from 'fs';
import * as path from 'path';
import { safeFetch } from './lib/fetcher';
import type { Member, MemberLink } from '../src/lib/schema';

interface LinkReport {
  checkedAt: string;
  totalLinks: number;
  okCount: number;
  redirectedCount: number;
  deadCount: number;
  unverifiedCount: number;
  deadLinks: { memberId: string; url: string; status: number | null; error?: string }[];
  unverifiedLinks: { memberId: string; url: string; status: number | null; error?: string }[];
}

async function checkAllLinks() {
  console.log('🔍 Starting link health checks across all members...\n');
  const dataPath = path.join(__dirname, '..', 'data', 'members.json');
  if (!fs.existsSync(dataPath)) {
    console.error('❌ data/members.json does not exist');
    process.exit(1);
  }

  const members: Member[] = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  const today = new Date().toISOString().slice(0, 10);

  let totalLinks = 0;
  let okCount = 0;
  let redirectedCount = 0;
  let deadCount = 0;
  let unverifiedCount = 0;
  const deadLinks: LinkReport['deadLinks'] = [];
  const unverifiedLinks: LinkReport['unverifiedLinks'] = [];
  const writeMembers = process.argv.includes('--write-members');

  for (let mIdx = 0; mIdx < members.length; mIdx++) {
    const member = members[mIdx]!;
    for (let lIdx = 0; lIdx < member.links.length; lIdx++) {
      const link = member.links[lIdx]!;
      totalLinks++;
      console.log(`[${totalLinks}] Checking [${member.name.ja.kanji}] (${link.type}): ${link.url}`);

      try {
        const res = await safeFetch(link.url, { retries: 1 });
        let status: MemberLink['status'];
        if (res.ok) {
          if (res.finalUrl && res.finalUrl !== link.url) {
            status = 'redirected';
            redirectedCount++;
          } else {
            status = 'ok';
            okCount++;
          }
        } else if (res.status === 404 || res.status === 410) {
          status = 'dead';
          deadCount++;
          deadLinks.push({ memberId: member.id, url: link.url, status: res.status });
        } else {
          status = 'unverified';
          unverifiedCount++;
          unverifiedLinks.push({ memberId: member.id, url: link.url, status: res.status });
        }
        if (writeMembers) {
          link.lastCheckedAt = today;
          link.lastStatusCode = res.status;
          link.status = status;
        }
      } catch (err: any) {
        console.warn(`⚠️ Error checking link ${link.url}: ${err.message}`);
        unverifiedCount++;
        unverifiedLinks.push({ memberId: member.id, url: link.url, status: null, error: err.message });
        if (writeMembers) {
          link.lastCheckedAt = today;
          link.lastStatusCode = 0;
          link.status = 'unverified';
        }
      }
    }
  }

  if (writeMembers) {
    fs.writeFileSync(dataPath, JSON.stringify(members, null, 2), 'utf-8');
  }

  const report: LinkReport = {
    checkedAt: today,
    totalLinks,
    okCount,
    redirectedCount,
    deadCount,
    unverifiedCount,
    deadLinks,
    unverifiedLinks,
  };

  const reportPath = path.join(__dirname, '..', 'data', 'link-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');

  console.log('\n================ LINK CHECK REPORT ================');
  console.log(`Total Links Checked: ${totalLinks}`);
  console.log(`OK (200): ${okCount} (${Math.round((okCount / (totalLinks || 1)) * 100)}%)`);
  console.log(`Redirected: ${redirectedCount}`);
  console.log(`Dead: ${deadCount}`);
  console.log(`Unverified: ${unverifiedCount}`);
  console.log(`Members data: ${writeMembers ? 'updated by explicit --write-members option' : 'unchanged (report-only mode)'}`);
  console.log(`Report saved to data/link-report.json`);
  console.log('===================================================\n');

  const deadRatio = deadCount / (totalLinks || 1);
  if (deadRatio > 0.1) {
    console.warn(`⚠️ Warning: Dead link ratio is ${(deadRatio * 100).toFixed(1)}% (> 10%)`);
  }
}

checkAllLinks().catch((err) => {
  console.error('Fatal link check error:', err);
  process.exit(1);
});
