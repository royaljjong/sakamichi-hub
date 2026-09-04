import { NextResponse } from 'next/server';
import { getLatestUpdates } from '@/lib/data';

export const runtime = 'nodejs';

// Cache for 15 minutes
export const revalidate = 900;

export async function GET() {
  try {
    const updates = getLatestUpdates();
    return NextResponse.json(updates, {
      headers: {
        'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=3600',
      },
    });
  } catch (err: any) {
    console.error('Failed to get updates in API route:', err);
    return NextResponse.json({ error: 'Failed to get updates' }, { status: 500 });
  }
}
