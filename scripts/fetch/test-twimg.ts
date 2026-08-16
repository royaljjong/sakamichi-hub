async function testTwimg() {
  const urls = [
    'https://pbs.twimg.com/profile_images/1344662497672200192/X92BqP27_400x400.jpg',
    'https://pbs.twimg.com/profile_images/1286940898588528640/M3eLhK7a_400x400.jpg',
    'https://pbs.twimg.com/profile_images/1785239103983423488/uQeF_8r__400x400.jpg',
    'https://pbs.twimg.com/profile_images/1642146933580554240/p0X4Zp7J_400x400.jpg',
    'https://pbs.twimg.com/profile_images/1468165609342414848/u4K4O4iS_400x400.jpg',
  ];

  for (const u of urls) {
    try {
      const res = await fetch(u, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      console.log(`[${res.status}] ${u}`);
    } catch (e: any) {
      console.log(`[ERR] ${u}: ${e.message}`);
    }
  }
}

testTwimg();
