import * as fs from 'fs';
import * as path from 'path';

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return [r, g, b];
}

function relativeLuminance(rgb: [number, number, number]): number {
  const [r, g, b] = rgb.map((val) => {
    const s = val / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

function contrastRatio(hex1: string, hex2: string): number {
  const lum1 = relativeLuminance(hexToRgb(hex1));
  const lum2 = relativeLuminance(hexToRgb(hex2));
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

function checkContrast() {
  const groupsPath = path.join(__dirname, '..', 'data', 'groups.json');
  const groupsData = JSON.parse(fs.readFileSync(groupsPath, 'utf-8'));

  console.log('🎨 Checking WCAG AA color contrast (minimum 4.5:1 required)...\n');

  let passed = true;
  const paper = '#FBF8F3';

  for (const group of groupsData.groups) {
    const { id, palette } = group;
    const ratioWash = contrastRatio(palette.ink, palette.wash);
    const ratioPaper = contrastRatio(palette.ink, paper);

    console.log(`[${id}]`);
    console.log(`  ink (${palette.ink}) vs wash (${palette.wash}): ${ratioWash.toFixed(2)}:1 ${ratioWash >= 4.5 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  ink (${palette.ink}) vs paper (${paper}): ${ratioPaper.toFixed(2)}:1 ${ratioPaper >= 4.5 ? '✅ PASS' : '❌ FAIL'}`);

    if (ratioWash < 4.5 || ratioPaper < 4.5) {
      passed = false;
    }
  }

  if (!passed) {
    console.error('\n❌ Contrast check failed for one or more palettes.');
    process.exit(1);
  }

  console.log('\n✅ All color contrast combinations passed WCAG AA 4.5:1 standards.');
}

checkContrast();
