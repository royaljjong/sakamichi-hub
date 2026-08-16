async function findDirect48Grads() {
  // AKB48 CloudFront hashiranokai archive IDs
  // 83100xxx - 83101xxx
  const targets = [
    { name: '柏木由紀', code: '83100064' },
    { name: '本田仁美', code: '83100808' },
    { name: '岡田奈々', code: '83100620' },
  ];

  for (let i = 83100001; i <= 83100100; i++) {
    const u = `https://d2r1lkk9i7row.cloudfront.net/mobile/member/${i}.jpg`;
    try {
      const res = await fetch(u, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (res.ok) {
        console.log(`FOUND 200: ${i} -> ${u}`);
      }
    } catch {}
  }
}

findDirect48Grads();
