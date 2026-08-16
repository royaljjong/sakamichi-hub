async function testSakamichiGrads() {
  const grads = [
    { name: '平手友梨奈', url: 'https://sakurazaka46.com/images/14/083/c989c92fa3daefaeeb4e3415cf2bc/1000_1000_102400.jpg' },
    { name: '長濱ねる', url: 'https://sakurazaka46.com/images/14/012/6fe2dc2c9f95cb0542387799d1fa7/1000_1000_102400.jpg' },
    { name: '菅井友香', url: 'https://sakurazaka46.com/images/14/067/8df4f52e5a7bfe4239854be7e3c15/1000_1000_102400.jpg' },
    { name: '渡邉理佐', url: 'https://sakurazaka46.com/images/14/011/ff3f7dc57b44783307612f008852d/1000_1000_102400.jpg' },
    { name: '齊藤京子', url: 'https://cdn.hinatazaka46.com/images/14/170/36b80e81c000f2fe829c9fe60da11/1000_1000_102400.jpg' },
    { name: '影山優佳', url: 'https://cdn.hinatazaka46.com/images/14/097/13359d9c223c6f4f25bca253e6dcf/1000_1000_102400.jpg' },
    { name: '加藤史帆', url: 'https://cdn.hinatazaka46.com/images/14/176/4089849fa86196f7c32bf28b29c94/1000_1000_102400.jpg' },
  ];

  for (const g of grads) {
    try {
      const res = await fetch(g.url, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      console.log(`[${res.status}] ${g.name} (${res.headers.get('content-type')})`);
    } catch (e: any) {
      console.log(`[ERR] ${g.name}: ${e.message}`);
    }
  }
}

testSakamichiGrads();
