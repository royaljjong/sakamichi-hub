const wikis: Record<string, string> = {
  前田敦子: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Atsuko_Maeda_at_Opening_Ceremony_of_the_32nd_Tokyo_International_Film_Festival.jpg/500px-Atsuko_Maeda_at_Opening_Ceremony_of_the_32nd_Tokyo_International_Film_Festival.jpg',
  大島優子: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Yuko_Oshima_from_%22Romance%22_at_Opening_Ceremony_of_the_28th_Tokyo_International_Film_Festival_%2822453664539%29.jpg/500px-Yuko_Oshima_from_%22Romance%22_at_Opening_Ceremony_of_the_28th_Tokyo_International_Film_Festival_%2822453664539%29.jpg',
  渡辺麻友: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Watanabe_Mayu_2016.jpg/500px-Watanabe_Mayu_2016.jpg',
  柏木由紀: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Yuki_Kashiwagi_at_the_Kansai_Collection_2024_A_W_02.jpg/500px-Yuki_Kashiwagi_at_the_Kansai_Collection_2024_A_W_02.jpg',
  指原莉乃: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Rino_Sashihara_2016.jpg/500px-Rino_Sashihara_2016.jpg',
  高橋みなみ: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Minami_Takahashi_2016.jpg/500px-Minami_Takahashi_2016.jpg',
  小嶋陽菜: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Haruna_Kojima_2016.jpg/500px-Haruna_Kojima_2016.jpg',
  板野友美: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Tomomi_Itano_at_Asia_Fashion_Award_2018.jpg/500px-Tomomi_Itano_at_Asia_Fashion_Award_2018.jpg',
  篠田麻里子: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/Mariko_Shinoda_2016.jpg/500px-Mariko_Shinoda_2016.jpg',
  峯岸みなみ: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Minami_Minegishi_2016.jpg/500px-Minami_Minegishi_2016.jpg',
  本田仁美: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Hitomi_Honda_at_Kansai_Collection_2023_A_W_01.jpg/500px-Hitomi_Honda_at_Kansai_Collection_2023_A_W_01.jpg',
  岡田奈々: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Nana_Okada_2018.jpg/500px-Nana_Okada_2018.jpg',
  宮脇咲良: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Miyawaki_Sakura_at_Incheon_Airport_on_August_28%2C_2022.jpg/500px-Miyawaki_Sakura_at_Incheon_Airport_on_August_28%2C_2022.jpg',
  矢吹奈子: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Nako_Yabuki_at_the_Kansai_Collection_2024_A_W_02.jpg/500px-Nako_Yabuki_at_the_Kansai_Collection_2024_A_W_02.jpg',
  田中美久: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/Miku_Tanaka_at_the_Kansai_Collection_2024_A_W_01.jpg/500px-Miku_Tanaka_at_the_Kansai_Collection_2024_A_W_01.jpg',
  本間日陽: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Homma_Hinata_2019.jpg/500px-Homma_Hinata_2019.jpg',
  荻野由佳: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Ogino_Yuka_2018.jpg/500px-Ogino_Yuka_2018.jpg',
  中井りか: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Nakai_Rika_2018.jpg/500px-Nakai_Rika_2018.jpg',
  山本彩: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Sayaka_Yamamoto_2017.jpg/500px-Sayaka_Yamamoto_2017.jpg',
  渡辺美優紀: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Miyuki_Watanabe_2016.jpg/500px-Miyuki_Watanabe_2016.jpg',
  白間美瑠: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Miru_Shiroma_2018.jpg/500px-Miru_Shiroma_2018.jpg',
  渋谷凪咲: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Nagisa_Shibuya_2019.jpg/500px-Nagisa_Shibuya_2019.jpg',
  須田亜香里: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Akari_Suda_2018.jpg/500px-Akari_Suda_2018.jpg',
  松井珠理奈: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Jurina_Matsui_2018.jpg/500px-Jurina_Matsui_2018.jpg',
  松井玲奈: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Rena_Matsui_2015.jpg/500px-Rena_Matsui_2015.jpg',
  瀧野由美子: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Yumiko_Takino_2018.jpg/500px-Yumiko_Takino_2018.jpg',
};

async function testAll() {
  for (const [k, v] of Object.entries(wikis)) {
    try {
      const res = await fetch(v, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      console.log(`[${res.status}] ${k}`);
    } catch (e: any) {
      console.log(`[ERR] ${k}: ${e.message}`);
    }
  }
}

testAll();
