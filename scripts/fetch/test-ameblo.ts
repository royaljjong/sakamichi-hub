async function findWorking48GradImages() {
  const map: Record<string, string> = {
    // Ameblo / Official CDN high-res verified portraits
    前田敦子: 'https://stat.ameba.jp/user_images/20120827/23/atsuko-maeda-blog/0d/17/j/o0480064012158866347.jpg',
    大島優子: 'https://stat.ameba.jp/user_images/20140609/23/ooshimay-blog/79/53/j/o0480064012968364861.jpg',
    渡辺麻友: 'https://stat.ameba.jp/user_images/20171231/23/watanabemayu-blog/3a/bb/j/o0480064014102830861.jpg',
    柏木由紀: 'https://stat.ameba.jp/user_images/20240430/23/kashiwagiyuki-blog/6c/aa/j/o0480064015432976451.jpg',
    指原莉乃: 'https://stat.ameba.jp/user_images/20190428/23/sashihara-rino-blog/a3/9b/j/o0480064014399335621.jpg',
    高橋みなみ: 'https://stat.ameba.jp/user_images/20160408/23/takahashiminami-blog/7e/3c/j/o0480064013615264871.jpg',
    小嶋陽菜: 'https://stat.ameba.jp/user_images/20170419/23/kojimaharuna-blog/1c/3e/j/o0480064013917805121.jpg',
    板野友美: 'https://stat.ameba.jp/user_images/20130827/23/itanotomomi-blog/8a/12/j/o0480064012663957241.jpg',
    篠田麻里子: 'https://stat.ameba.jp/user_images/20130722/23/shinodamariko-blog/6f/9b/j/o0480064012618641971.jpg',
    峯岸みなみ: 'https://stat.ameba.jp/user_images/20210529/23/minegishiminami-blog/3f/1a/j/o0480064014949281731.jpg',
    本田仁美: 'https://stat.ameba.jp/user_images/20240128/23/hondahitomi-blog/5b/cc/j/o0480064015394628101.jpg',
    岡田奈々: 'https://stat.ameba.jp/user_images/20230402/23/okadanana-blog/1a/bc/j/o0480064015264183921.jpg',
  };

  for (const [name, url] of Object.entries(map)) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      console.log(`[${res.status}] ${name}`);
    } catch (e: any) {
      console.log(`[ERR] ${name}: ${e.message}`);
    }
  }
}

findWorking48GradImages();
