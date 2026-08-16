async function checkKoike() {
  const res = await fetch('https://sakurazaka46.com/s/s46/artist/06?ima=0000');
  const text = await res.text();
  const imgs = Array.from(text.matchAll(/<img[^>]+src="([^"]+)"/g));
  for (const m of imgs) {
    console.log('Img:', m[1]);
  }
}

checkKoike();
