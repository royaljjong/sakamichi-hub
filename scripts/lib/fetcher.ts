import * as https from 'https';

const DELAY_MS = 1500;
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 SakamichiLinkHub/1.0';
const MAX_RETRY = 2;

let lastFetchTime = 0;

export async function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function safeFetch(
  url: string,
  options: { retries?: number } = {},
): Promise<{ ok: boolean; status: number; text: string; finalUrl: string }> {
  const retries = options.retries ?? MAX_RETRY;

  const now = Date.now();
  const elapsed = now - lastFetchTime;
  if (elapsed < DELAY_MS) {
    await wait(DELAY_MS - elapsed);
  }
  lastFetchTime = Date.now();

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': UA,
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8,ko;q=0.7',
      },
    });

    if (res.status === 429 || res.status === 503) {
      if (retries > 0) {
        console.warn(`[safeFetch] Got ${res.status} for ${url}, backing off...`);
        await wait(3000 * (MAX_RETRY - retries + 1));
        return safeFetch(url, { retries: retries - 1 });
      }
    }

    const text = await res.text();
    return {
      ok: res.ok,
      status: res.status,
      text,
      finalUrl: res.url,
    };
  } catch (err: any) {
    if (retries > 0) {
      console.warn(`[safeFetch] Error fetching ${url}: ${err.message}, retrying...`);
      await wait(2000);
      return safeFetch(url, { retries: retries - 1 });
    }
    throw err;
  }
}
