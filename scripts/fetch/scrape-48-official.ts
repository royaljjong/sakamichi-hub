import * as fs from 'fs';

export async function scrape48OfficialImages(): Promise<Record<string, string>> {
  const result: Record<string, string> = {};

  // 1. SKE48
  try {
    const res = await fetch('https://ske48.co.jp/feature/profile', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    if (res.ok) {
      const html = await res.text();
      const matches = Array.from(html.matchAll(/<img [^>]*src="([^"]+)"[^>]*alt="([^"]+)"/g));
      for (const m of matches) {
        const rawUrl = m[1];
        const rawName = m[2];
        if (rawUrl && rawName) {
          const url = rawUrl.startsWith('http') ? rawUrl : `https://ske48.co.jp${rawUrl}`;
          const name = rawName.replace(/\s+/g, '');
          if (url.includes('/profile/member_') && name.length >= 2) {
            result[`ske48_${name}`] = url;
          }
        }
      }
    }
  } catch (err: any) {
    console.warn('SKE error:', err.message);
  }

  // 2. NGT48
  try {
    const res = await fetch('https://ngt48.jp/profile', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    if (res.ok) {
      const html = await res.text();
      const matches = Array.from(html.matchAll(/<img [^>]*src="([^"]+)"[^>]*alt="([^"]+)"/g));
      for (const m of matches) {
        const url = m[1];
        const rawName = m[2];
        if (url && rawName) {
          const name = rawName.replace(/\s+/g, '');
          if (url.includes('img.ngt48.com/artist') && name.length >= 2) {
            result[`ngt48_${name}`] = url;
          }
        }
      }
    }
  } catch (err: any) {
    console.warn('NGT error:', err.message);
  }

  // 3. HKT48
  try {
    const res = await fetch('http://www.hkt48.jp/profile/', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    if (res.ok) {
      const html = await res.text();
      const matches = Array.from(html.matchAll(/<img [^>]*src="([^"]+)"[^>]*alt="([^"]+)"/g));
      for (const m of matches) {
        const rawUrl = m[1];
        const rawName = m[2];
        if (rawUrl && rawName) {
          const url = rawUrl.startsWith('http') ? rawUrl : `https://www.hkt48.jp${rawUrl}`;
          const name = rawName.replace(/\s+/g, '');
          if ((url.includes('/profile/') || url.includes('/member/')) && name.length >= 2 && !name.includes('HKT48')) {
            result[`hkt48_${name}`] = url;
          }
        }
      }
    }
  } catch (err: any) {
    console.warn('HKT error:', err.message);
  }

  // 4. STU48
  try {
    const res = await fetch('https://sp.stu48.com/profile/', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    if (res.ok) {
      const html = await res.text();
      const matches = Array.from(html.matchAll(/<img [^>]*src="([^"]+)"[^>]*alt="([^"]+)"/g));
      for (const m of matches) {
        const rawUrl = m[1];
        const rawName = m[2];
        if (rawUrl && rawName) {
          const url = rawUrl.startsWith('http') ? rawUrl : `https://sp.stu48.com${rawUrl}`;
          const name = rawName.replace(/\s+/g, '');
          if (url.includes('s3-aop.plusmember.jp') || url.includes('/profile/') || url.includes('/artist/')) {
            result[`stu48_${name}`] = url;
          }
        }
      }
    }
  } catch (err: any) {
    console.warn('STU error:', err.message);
  }

  fs.writeFileSync('scripts/fetch/official-48-images.json', JSON.stringify(result, null, 2), 'utf-8');
  return result;
}

if (require.main === module) {
  scrape48OfficialImages();
}
