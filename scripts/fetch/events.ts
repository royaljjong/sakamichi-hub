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

async function main() {
  const now = new Date();
  const portalPath = path.join(process.cwd(), 'data', 'portal.json');
  const portal = JSON.parse(fs.readFileSync(portalPath, 'utf8')) as PortalFile;
  const collected = await fetchNogizakaLives(now);
  if (!collected.length) throw new Error('Official schedule returned no upcoming live events; keeping existing data.');
  const preserved = portal.events.filter((event) => !event.id.startsWith('nogi-auto-') && event.groupIds?.[0] !== 'nogizaka46');
  portal.events = [...preserved, ...collected].sort((a, b) => String(a.startsAt).localeCompare(String(b.startsAt)));
  portal.generatedAt = now.toISOString().slice(0, 10);
  fs.writeFileSync(portalPath, `${JSON.stringify(portal, null, 2)}\n`, 'utf8');
  console.log(`Saved ${collected.length} upcoming Nogizaka46 live events from the official schedule.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
