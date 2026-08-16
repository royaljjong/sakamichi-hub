import { NextResponse } from 'next/server';
import { getMembers } from '@/lib/data';
import { fetchLatestUpdates } from '../../../../scripts/fetch/updates';

// Revalidate cache every 15 minutes (900 seconds)
export const revalidate = 900;

export async function GET() {
  try {
    const members = getMembers();
    const updates = await fetchLatestUpdates(members);
    return NextResponse.json(updates, {
      headers: {
        'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=3600',
      },
    });
  } catch (err: any) {
    console.error('Failed to fetch updates in API route:', err);
    return NextResponse.json({ error: 'Failed to fetch updates' }, { status: 500 });
  }
}
