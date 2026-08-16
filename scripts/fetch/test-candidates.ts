async function testCandidateUrls() {
  const candidates: Record<string, string[]> = {
    前田敦子: [
      'https://www.ohtapro.co.jp/talent/assets_c/2021/01/maedaatsuko-thumb-600xauto-3759.jpg',
      'https://profile.ohtapro.co.jp/assets/img/talent/maedaatsuko/profile.jpg',
    ],
    大島優子: [
      'https://www.ohtapro.co.jp/talent/assets_c/2021/01/oshimayuko-thumb-600xauto-3760.jpg',
      'https://profile.ohtapro.co.jp/assets/img/talent/oshimayuko/profile.jpg',
    ],
    指原莉乃: [
      'https://www.ohtapro.co.jp/talent/assets_c/2021/01/sashihararino-thumb-600xauto-3761.jpg',
      'https://profile.ohtapro.co.jp/assets/img/talent/sashihararino/profile.jpg',
    ],
    柏木由紀: [
      'https://www.watanabepro.co.jp/files/2023/12/3a6e87fbc8ec8bf0245a4a50fe86a41f.jpg',
      'https://www.watanabepro.co.jp/mypage/20000024/',
    ],
    高橋みなみ: [
      'https://production.ogipro.com/talent/takahashiminami/',
    ],
    小嶋陽菜: [
      'https://production.ogipro.com/talent/kojimaharuna/',
    ],
  };

  for (const [name, urls] of Object.entries(candidates)) {
    for (const u of urls) {
      try {
        const res = await fetch(u, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        console.log(`[${res.status}] ${name} -> ${u}`);
      } catch (e: any) {
        console.log(`[ERR] ${name} -> ${u}: ${e.message}`);
      }
    }
  }
}

testCandidateUrls();
