import * as fs from 'fs';
import * as path from 'path';

type NogiSchedule = {
  code: string;
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  cate: string;
  link: string;
};

type PortalEvent = {
  id: string;
  groupIds: string[];
  title: { ja: string; ko: string; en: string };
  kind: string;
  startsAt: string;
  endsAt: string | null;
  venueId: string | null;
  posterUrl: string | null;
  price: string | null;
  ticketUrl: string | null;
  officialUrl: string | null;
  provenance: {
    sourceUrl: string;
    checkedAt: string;
    note?: string;
  };
};

type PortalFile = {
  generatedAt: string;
  events: Array<Record<string, unknown> & { id: string; groupIds: string[]; startsAt: string }>;
};

function monthKey(date: Date) {
  return `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

function toIso(dateText: string, timeText: string) {
  const [year, month, day] = dateText.split('/').map(Number);
  let [hour, minute] = (timeText || '12:00').split(':').map(Number);
  const carry = Math.floor((hour || 0) / 24);
  hour = (hour || 0) % 24;
  const utc = Date.UTC(year!, month! - 1, day! + carry, hour! - 9, minute || 0);
  return new Date(utc).toISOString().replace('Z', '+00:00');
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

async function fetchNogizakaLives(now: Date) {
  const months = [now, new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1))];
  const rows: NogiSchedule[] = [];
  for (const month of months) {
    const sourceUrl = `https://www.nogizaka46.com/s/n46/api/list/schedule?dy=${monthKey(month)}`;
    const response = await fetch(sourceUrl, { headers: { 'user-agent': 'SakamichiBox/1.0 (+https://sakamichi-hub.vercel.app)' } });
    if (!response.ok) throw new Error(`Nogizaka schedule returned ${response.status}`);
    const body = await response.text();
    const json = JSON.parse(body.replace(/^res\(/, '').replace(/\);?\s*$/, '')) as { data?: NogiSchedule[] };
    rows.push(...(json.data ?? []));
  }

  const today = now.toISOString().slice(0, 10);
  return rows
    .filter((row) => row.cate === 'live' && row.date.replaceAll('/', '-') >= today)
    .map((row) => ({
      id: `nogi-auto-${row.code}-${row.date.replaceAll('/', '')}`,
      groupIds: ['nogizaka46'],
      title: { ja: row.title, ko: row.title, en: row.title },
      kind: 'concert',
      startsAt: toIso(row.date, row.start_time),
      endsAt: row.end_time ? toIso(row.date, row.end_time) : null,
      venueId: null,
      posterUrl: null,
      price: null,
      ticketUrl: null,
      officialUrl: row.link,
      provenance: {
        sourceUrl: `https://www.nogizaka46.com/s/n46/media/list?dy=${row.date.slice(0, 7).replace('/', '')}`,
        checkedAt: today,
      },
    }));
}

/**
 * Sakurazaka46 schedule: HTML page with modal divs.
 * Modals: class="module-modal js-schedule-detail count_XXXX_YY"
 * Inside: class="cate-event|cate-live|..." + <p class="date">YYYY.MM.DD</p> + <p class="type">...</p> + <h2 class="title">...</h2>
 * Filter: only cate-event modals with type=ライブ or cate-live.
 */
async function fetchSakurazakaEvents(now: Date): Promise<PortalEvent[]> {
  const today = now.toISOString().slice(0, 10);
  const months = [now, new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1))];
  const seen = new Set<string>();
  const results: PortalEvent[] = [];

  for (const month of months) {
    const dy = monthKey(month);
    const sourceUrl = `https://sakurazaka46.com/s/s46/media/list?dy=${dy}`;
    const response = await fetch(sourceUrl, {
      headers: { 'user-agent': 'SakamichiBox/1.0 (+https://sakamichi-hub.vercel.app)' },
    });
    if (!response.ok) {
      console.warn(`  Sakurazaka schedule ${dy} returned ${response.status}, skipping`);
      await sleep(1500);
      continue;
    }
    const html = await response.text();

    // Parse modal divs: class="module-modal js-schedule-detail count_XXXX_YY"
    const modalRe = /class="module-modal js-schedule-detail ([^"]+)">([\s\S]*?)(?=<div class="module-modal|$)/g;
    let match: RegExpExecArray | null;
    while ((match = modalRe.exec(html)) !== null) {
      const countId = (match[1] ?? '').trim();
      const body = match[2] ?? '';

      // Only include cate-event entries
      const catMatch = body.match(/class="(cate-[a-z]+)"/);
      const cate = catMatch?.[1];
      if (!cate || cate === 'cate-media' || cate === 'cate-shakehands' || cate === 'cate-birthday') continue;
      // Only ライブ type or イベント type
      const typeMatch = body.match(/<p class="type">([^<]+)</);
      const eventType = typeMatch?.[1]?.trim();
      if (!eventType || (eventType !== 'ライブ' && eventType !== 'イベント' && cate !== 'cate-live')) continue;

      const dateMatch = body.match(/<p class="date[^"]*">([^<&\s][^<&]*?)(?:&nbsp;|<)/);
      if (!dateMatch?.[1]) continue;
      const rawDate = dateMatch[1].trim(); // e.g. "2026.08.01"
      const isoDate = rawDate.replace(/\./g, '-');
      if (isoDate < today) continue;

      const titleMatch = body.match(/<h2 class="title">([^<]+)</);
      if (!titleMatch?.[1]) continue;
      const title = titleMatch[1].trim();

      // Extract official URL from modal
      const linkMatch = body.match(/href="(https?:\/\/[^"]+)"/);
      const officialUrl = linkMatch?.[1] ?? sourceUrl;

      // Extract start time from date field if present (e.g. "2026.08.01  22:00～")
      const timeMatch = body.match(/<p class="date[^"]*">[^<&\s][^<&]*?(?:&nbsp;)+([0-9]{1,2}:[0-9]{2})[^<]*</);
      const timeStr = timeMatch?.[1];
      const dateParts = isoDate.split('-').map(Number);
      const year = dateParts[0]!;
      const mon = dateParts[1]!;
      const day = dateParts[2]!;
      const timeParts = timeStr ? timeStr.split(':').map(Number) : [12, 0];
      const hr = timeParts[0]!;
      const min = timeParts[1]!;
      const utc = Date.UTC(year, mon - 1, day, hr - 9, min);
      const startsAt = new Date(utc).toISOString().replace('Z', '+00:00');

      // Sanitize id: replace underscores with hyphens for kebab-case compliance
      const id = `saku-auto-${countId.replace(/_/g, '-')}`;
      if (seen.has(id)) continue;
      seen.add(id);

      results.push({
        id,
        groupIds: ['sakurazaka46'],
        title: { ja: title, ko: title, en: title },
        kind: eventType === 'ライブ' ? 'concert' : 'appearance',
        startsAt,
        endsAt: null,
        venueId: null,
        posterUrl: null,
        price: null,
        ticketUrl: null,
        officialUrl,
        provenance: {
          sourceUrl,
          checkedAt: today,
        },
      });
    }

    await sleep(1500);
  }

  return results;
}

/**
 * Hinatazaka46 schedule: HTML page with p-schedule__list-group day blocks.
 * Each group: <div class="p-schedule__list-group">
 *   <div class="c-schedule__date--list"><span>DAY</span><b>WEEKDAY</b></div>
 *   <ul>...<li class="p-schedule__item">
 *     <a href="/s/official/media/detail/ID?ima=0000">
 *       <div class="c-schedule__category category_event|category_live">TYPE</div>
 *       <p class="c-schedule__text">TITLE</p>
 *     </a>
 *   </li>...
 */
async function fetchHinatazakaEvents(now: Date): Promise<PortalEvent[]> {
  const today = now.toISOString().slice(0, 10);
  const months = [now, new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1))];
  const seen = new Set<string>();
  const results: PortalEvent[] = [];

  for (const month of months) {
    const dy = monthKey(month);
    const year = month.getUTCFullYear();
    const mon = month.getUTCMonth() + 1;
    const sourceUrl = `https://www.hinatazaka46.com/s/official/media/list?dy=${dy}`;

    const response = await fetch(sourceUrl, {
      headers: { 'user-agent': 'SakamichiBox/1.0 (+https://sakamichi-hub.vercel.app)' },
    });
    if (!response.ok) {
      console.warn(`  Hinatazaka schedule ${dy} returned ${response.status}, skipping`);
      await sleep(1500);
      continue;
    }
    const html = await response.text();

    // Parse day groups
    const groupRe = /<div class="p-schedule__list-group">([\s\S]*?)(?=<div class="p-schedule__list-group"|<\/ul>\s*<\/div>\s*<\/div>\s*<\/div>)/g;
    let groupMatch: RegExpExecArray | null;
    while ((groupMatch = groupRe.exec(html)) !== null) {
      const groupBody = groupMatch[1] ?? '';

      // Extract day number from <span>DD</span>
      const dayMatch = groupBody.match(/<div class="c-schedule__date--list">\s*<span>(\d+)<\/span>/);
      if (!dayMatch?.[1]) continue;
      const dayNum = parseInt(dayMatch[1], 10);
      const isoDate = `${year}-${String(mon).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      if (isoDate < today) continue;

      // Parse each item
      const itemRe = /<li class="p-schedule__item">([\s\S]*?)<\/li>/g;
      let itemMatch: RegExpExecArray | null;
      while ((itemMatch = itemRe.exec(groupBody)) !== null) {
        const itemBody = itemMatch[1] ?? '';

        // Only event or live categories
        const catMatch = itemBody.match(/category_([a-z]+)/);
        const cat = catMatch?.[1];
        if (!cat || (cat !== 'event' && cat !== 'live')) continue;

        const typeText = itemBody.match(/<div class="c-schedule__category category_[^"]*">\s*([\s\S]*?)\s*<\/div>/)?.[1]?.trim();

        const titleMatch = itemBody.match(/c-schedule__text">\s*([\s\S]*?)\s*<\/p>/);
        if (!titleMatch?.[1]) continue;
        const title = titleMatch[1].replace(/<[^>]+>/g, '').trim();

        const hrefMatch = itemBody.match(/href="(\/s\/official\/media\/detail\/(\d+)[^"]*)"/);
        const detailId = hrefMatch?.[2];
        const hrefPath = hrefMatch?.[1];
        const officialUrl = hrefPath ? `https://www.hinatazaka46.com${hrefPath}` : sourceUrl;

        const timeMatch = itemBody.match(/c-schedule__time--list">\s*([0-9]{1,2}:[0-9]{2})/);
        const timeStr = timeMatch?.[1];
        const timeParts = timeStr ? timeStr.split(':').map(Number) : [12, 0];
        const hr = timeParts[0]!;
        const min = timeParts[1]!;
        const utc = Date.UTC(year, mon - 1, dayNum, hr - 9, min);
        const startsAt = new Date(utc).toISOString().replace('Z', '+00:00');

        const id = `hina-auto-${dy}-${detailId ?? `${dayNum}-${title.slice(0, 10)}`}`;
        if (seen.has(id)) continue;
        seen.add(id);

        results.push({
          id,
          groupIds: ['hinatazaka46'],
          title: { ja: title, ko: title, en: title },
          kind: cat === 'live' || typeText === 'ライブ' ? 'concert' : 'appearance',
          startsAt,
          endsAt: null,
          venueId: null,
          posterUrl: null,
          price: null,
          ticketUrl: null,
          officialUrl,
          provenance: {
            sourceUrl,
            checkedAt: today,
          },
        });
      }
    }

    await sleep(1500);
  }

  return results;
}

/**
 * AKB48 theater schedule: POST API at /public/api/schedule/calendar/
 * Returns calendar data for a given month/year.
 * Theater performances have css_class starting with "scheduleTheater" or "scheduleTeam".
 */
async function fetchAkb48TheaterSchedule(now: Date): Promise<PortalEvent[]> {
  const today = now.toISOString().slice(0, 10);
  const months = [now, new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1))];
  const seen = new Set<string>();
  const results: PortalEvent[] = [];
  const sourceUrl = 'https://www.akb48.co.jp/theater/schedule/';

  for (const month of months) {
    const mon = month.getUTCMonth() + 1;
    const year = month.getUTCFullYear();
    const apiUrl = 'https://www.akb48.co.jp/public/api/schedule/calendar/';

    const formData = new URLSearchParams();
    formData.append('month', String(mon));
    formData.append('year', String(year));
    formData.append('category', '1');

    let response: Response;
    try {
      response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'user-agent': 'SakamichiBox/1.0 (+https://sakamichi-hub.vercel.app)',
          'referer': sourceUrl,
        },
        body: formData.toString(),
      });
    } catch (e: any) {
      console.warn(`  AKB48 theater API fetch error for ${year}/${mon}: ${e.message}`);
      await sleep(1500);
      continue;
    }

    if (!response.ok) {
      console.warn(`  AKB48 theater API returned ${response.status} for ${year}/${mon}`);
      await sleep(1500);
      continue;
    }

    let json: { result: string; data: { thismonth: Record<string, Array<{
      schedule_id: string;
      title: string;
      css_class: string;
      date: string;
      body: string | null;
    }>> } };
    try {
      json = await response.json();
    } catch (e: any) {
      console.warn(`  AKB48 theater API JSON parse error: ${e.message}`);
      await sleep(1500);
      continue;
    }

    if (json.result !== 'ok') {
      console.warn(`  AKB48 theater API result not ok for ${year}/${mon}`);
      await sleep(1500);
      continue;
    }

    const monthData = json.data.thismonth;
    for (const [_key, items] of Object.entries(monthData)) {
      for (const item of items) {
        // Only theater performances: css_class starts with scheduleTheater or scheduleTeam
        if (!item.css_class ||
          (!item.css_class.startsWith('scheduleTheater') && !item.css_class.startsWith('scheduleTeam'))) {
          continue;
        }

        // Parse date from item.date: "YYYY-MM-DD HH:MM:SS"
        const dateParts = item.date.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})/);
        if (!dateParts) continue;
        const y = Number(dateParts[1]);
        const m = Number(dateParts[2]);
        const d = Number(dateParts[3]);
        const hh = Number(dateParts[4]);
        const mm = Number(dateParts[5]);
        const isoDate = `${dateParts[1]}-${dateParts[2]}-${dateParts[3]}`;
        if (isoDate < today) continue;

        // Convert JST to UTC+00:00 (JST = UTC+9)
        const utc = Date.UTC(y, m - 1, d, hh - 9, mm);
        const startsAt = new Date(utc).toISOString().replace('Z', '+00:00');

        const id = `akb48-theater-auto-${item.schedule_id}`;
        if (seen.has(id)) continue;
        seen.add(id);

        const title = item.title.trim();

        results.push({
          id,
          groupIds: ['akb48'],
          title: { ja: title, ko: title, en: title },
          kind: 'theater',
          startsAt,
          endsAt: null,
          venueId: null,
          posterUrl: null,
          price: null,
          ticketUrl: null,
          officialUrl: sourceUrl,
          provenance: {
            sourceUrl,
            checkedAt: today,
          },
        });

        // Limit to 20 upcoming performances
        if (results.length >= 20) break;
      }
      if (results.length >= 20) break;
    }

    await sleep(1500);

    if (results.length >= 20) break;
  }

  return results;
}

async function main() {
  const now = new Date();
  const portalPath = path.join(process.cwd(), 'data', 'portal.json');
  const portal = JSON.parse(fs.readFileSync(portalPath, 'utf8')) as PortalFile;

  console.log('Fetching Nogizaka46 events...');
  const nogizakaLives = await fetchNogizakaLives(now);
  if (!nogizakaLives.length) throw new Error('Official schedule returned no upcoming live events; keeping existing data.');

  await sleep(1500);
  console.log('Fetching Sakurazaka46 events...');
  const sakurazakaEvents = await fetchSakurazakaEvents(now);

  await sleep(1500);
  console.log('Fetching Hinatazaka46 events...');
  const hinatazakaEvents = await fetchHinatazakaEvents(now);

  await sleep(1500);
  console.log('Fetching AKB48 theater schedule...');
  let akb48TheaterEvents: PortalEvent[] = [];
  try {
    akb48TheaterEvents = await fetchAkb48TheaterSchedule(now);
  } catch (e: any) {
    console.warn(`  AKB48 theater fetch failed: ${e.message} — skipping`);
  }

  // SKE48 theater schedule requires JavaScript rendering and member login — skip
  console.log('Skipping SKE48 theater schedule (JS-rendered, requires login)');

  const collected = [...nogizakaLives, ...sakurazakaEvents, ...hinatazakaEvents, ...akb48TheaterEvents];

  const preserved = portal.events.filter(
    (event) =>
      !event.id.startsWith('nogi-auto-') &&
      !event.id.startsWith('saku-auto-') &&
      !event.id.startsWith('hina-auto-') &&
      !event.id.startsWith('akb48-theater-auto-') &&
      event.groupIds?.[0] !== 'nogizaka46' &&
      event.groupIds?.[0] !== 'sakurazaka46' &&
      event.groupIds?.[0] !== 'hinatazaka46',
  );

  portal.events = [...preserved, ...collected].sort((a, b) => String(a.startsAt).localeCompare(String(b.startsAt)));
  portal.generatedAt = now.toISOString().slice(0, 10);
  fs.writeFileSync(portalPath, `${JSON.stringify(portal, null, 2)}\n`, 'utf8');

  console.log(`Saved events:`);
  console.log(`  Nogizaka46: ${nogizakaLives.length} upcoming live events`);
  console.log(`  Sakurazaka46: ${sakurazakaEvents.length} upcoming events`);
  console.log(`  Hinatazaka46: ${hinatazakaEvents.length} upcoming events`);
  console.log(`  AKB48 theater: ${akb48TheaterEvents.length} upcoming theater performances`);
  console.log(`  Total: ${collected.length} events written to portal.json`);
  console.log(`  Total portal events (incl. preserved): ${portal.events.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
