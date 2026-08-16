import * as fs from 'fs';
import * as path from 'path';
import type { Member, Group } from '../src/lib/schema';

interface AuditIssue {
  memberId: string;
  name: string;
  group: string;
  field: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
}

async function checkUrl(url: string, timeout = 4000): Promise<{ status: number; ok: boolean; contentType?: string }> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    const res = await fetch(url, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
      },
      signal: controller.signal,
    });
    clearTimeout(timer);
    return {
      status: res.status,
      ok: res.ok || res.status === 301 || res.status === 302,
      contentType: res.headers.get('content-type') || undefined,
    };
  } catch (err: any) {
    return { status: 0, ok: false };
  }
}

async function auditMembers() {
  const membersPath = path.join(__dirname, '..', 'data', 'members.json');
  const groupsPath = path.join(__dirname, '..', 'data', 'groups.json');

  const members: Member[] = JSON.parse(fs.readFileSync(membersPath, 'utf-8'));
  const groupsData: { groups: Group[] } = JSON.parse(fs.readFileSync(groupsPath, 'utf-8'));
  const groupMap = new Map(groupsData.groups.map((g) => [g.id, g]));

  console.log(`\n🔍 Starting comprehensive audit for ${members.length} members...`);
  console.log(`---------------------------------------------------------------`);

  const issues: AuditIssue[] = [];
  const stats = {
    total: members.length,
    activeWithPhoto: 0,
    activeWithoutPhoto: 0,
    graduatesWithPhoto: 0,
    graduatesWithoutPhoto: 0,
    photoCheckPassed: 0,
    photoCheckFailed: 0,
    officialLinksChecked: 0,
    officialLinksFailed: 0,
  };

  // 1. Audit Names & Identity
  for (const m of members) {
    const kanji = m.name.ja.kanji;
    const kana = m.name.ja.kana;
    const hangul = m.name.ko.hangul;
    const romaji = m.name.en.romaji;

    // Kanji check
    if (!kanji || kanji.trim().length === 0) {
      issues.push({
        memberId: m.id,
        name: kanji || m.id,
        group: m.primaryGroupId,
        field: 'name.ja.kanji',
        severity: 'error',
        message: 'Empty kanji name',
      });
    }

    // Kana check (allow hiragana, whitespace, and long vowel mark ー)
    if (!kana || !/^[\u3040-\u309Fー\s]+$/.test(kana)) {
      issues.push({
        memberId: m.id,
        name: kanji,
        group: m.primaryGroupId,
        field: 'name.ja.kana',
        severity: 'warning',
        message: `Kana contains non-hiragana characters: "${kana}"`,
      });
    }

    // Hangul check
    if (!hangul || !/^[가-힣\s]+$/.test(hangul)) {
      issues.push({
        memberId: m.id,
        name: kanji,
        group: m.primaryGroupId,
        field: 'name.ko.hangul',
        severity: 'warning',
        message: `Hangul contains non-hangul characters: "${hangul}"`,
      });
    }

    // Romaji check (allow alphabets, whitespace, and Hepburn apostrophe ')
    if (!romaji || !/^[A-Za-z'\s]+$/.test(romaji)) {
      issues.push({
        memberId: m.id,
        name: kanji,
        group: m.primaryGroupId,
        field: 'name.en.romaji',
        severity: 'warning',
        message: `Romaji contains invalid characters: "${romaji}"`,
      });
    }

    // Group & Generation check
    const group = groupMap.get(m.primaryGroupId);
    if (!group) {
      issues.push({
        memberId: m.id,
        name: kanji,
        group: m.primaryGroupId,
        field: 'primaryGroupId',
        severity: 'error',
        message: `Unknown group: ${m.primaryGroupId}`,
      });
    } else {
      const genExists = group.generations.some((g) => g.id === m.primaryGenerationId);
      if (!genExists) {
        issues.push({
          memberId: m.id,
          name: kanji,
          group: m.primaryGroupId,
          field: 'primaryGenerationId',
          severity: 'error',
          message: `Generation ${m.primaryGenerationId} not found in ${group.id}`,
        });
      }
    }

    // Photo check
    if (m.imageUrl) {
      if (m.status === 'active') stats.activeWithPhoto++;
      else stats.graduatesWithPhoto++;
    } else {
      if (m.status === 'active') stats.activeWithoutPhoto++;
      else stats.graduatesWithoutPhoto++;
    }
  }

  console.log(`\n📸 Checking live profile photos (sampled async check)...`);
  const photoCheckPromises = members
    .filter((m) => m.imageUrl !== null)
    .map(async (m) => {
      const res = await checkUrl(m.imageUrl!);
      if (res.ok) {
        stats.photoCheckPassed++;
      } else {
        stats.photoCheckFailed++;
        issues.push({
          memberId: m.id,
          name: m.name.ja.kanji,
          group: m.primaryGroupId,
          field: 'imageUrl',
          severity: 'warning',
          message: `Image URL returned status ${res.status}: ${m.imageUrl}`,
        });
      }
    });

  await Promise.all(photoCheckPromises);

  // Group Summary
  console.log(`\n================ AUDIT SUMMARY ================`);
  console.log(`Total Members: ${stats.total}`);
  console.log(`Active Members with Photo: ${stats.activeWithPhoto}`);
  console.log(`Active Members without Photo: ${stats.activeWithoutPhoto}`);
  console.log(`Graduates with Photo: ${stats.graduatesWithPhoto}`);
  console.log(`Graduates without Photo (Glyph Avatar): ${stats.graduatesWithoutPhoto}`);
  console.log(`Photo URL Live Check: ${stats.photoCheckPassed} OK, ${stats.photoCheckFailed} Failed`);
  console.log(`Total Issues / Warnings Found: ${issues.length}`);
  console.log(`===============================================\n`);

  if (issues.length > 0) {
    console.log(`Issues details:`);
    for (const iss of issues) {
      console.log(`  [${iss.severity.toUpperCase()}] ${iss.group} | ${iss.name} (${iss.memberId}) -> ${iss.field}: ${iss.message}`);
    }
  } else {
    console.log(`🎉 100% CLEAN: All names, photos, and group associations passed audit!`);
  }

  // Save audit report to JSON for review
  const reportPath = path.join(__dirname, '..', 'data', 'audit-report.json');
  fs.writeFileSync(reportPath, JSON.stringify({ checkedAt: new Date().toISOString(), stats, issues }, null, 2), 'utf-8');
  console.log(`\nSaved audit report to data/audit-report.json`);
}

auditMembers().catch(console.error);
