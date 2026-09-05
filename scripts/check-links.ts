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
  const dataPath = path.join(__dirname, '..', 'data', 'members.json');
  if (!fs.existsSync(dataPath)) {
    console.error('❌ data/members.json does not exist');
    process.exit(1);
  }

  const members: Member[] = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  const today = new Date().toISOString().slice(0, 10);

  let okCount = 0;
  let redirectedCount = 0;
  let deadCount = 0;
  let unverifiedCount = 0;
  const deadLinks: LinkReport['deadLinks'] = [];
  const unverifiedLinks: LinkReport['unverifiedLinks'] = [];
  const writeMembers = process.argv.includes('--write-members');

  // Build flat task list
  type Task = { member: Member; link: MemberLink };
  const tasks: Task[] = [];
  for (const member of members) {
    for (const link of member.links) tasks.push({ member, link });
  }
  const totalLinks = tasks.length;
  console.log(`🔍 Starting ${totalLinks} link checks with concurrency 20...\n`);

  // Worker pool
  const CONCURRENCY = 20;
  let processedCount = 0;

  async function processOne(task: Task): Promise<void> {
    const { member, link } = task;
    const idx = ++processedCount;
    console.log(`[${idx}/${totalLinks}] ${member.name.ja.kanji} (${link.type}): ${link.url}`);
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
      console.warn(`  ⚠️ error: ${err.message}`);
      unverifiedCount++;
      unverifiedLinks.push({ memberId: member.id, url: link.url, status: null, error: err.message });
      if (writeMembers) {
        link.lastCheckedAt = today;
        link.lastStatusCode = 0;
        link.status = 'unverified';
      }
    }
  }

  async function runPool(items: Task[], concurrency: number): Promise<void> {
    const queue = items.slice();
    const workers: Promise<void>[] = [];
    for (let i = 0; i < concurrency; i++) {
      workers.push((async () => {
        while (queue.length > 0) {
          const task = queue.shift();
          if (!task) return;
          await processOne(task);
        }
      })());
    }
    await Promise.all(workers);
  }

  await runPool(tasks, CONCURRENCY);

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
