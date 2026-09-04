import { NextResponse } from 'next/server';
import { callPrivateInquiryRpc, isPrivateInquiryServerEnabled } from '@/lib/supabase/server';

export const runtime = 'nodejs';

type ReadPayload = { privateId?: unknown; password?: unknown };

export async function POST(request: Request) {
  if (!isPrivateInquiryServerEnabled()) return NextResponse.json({ error: 'unavailable' }, { status: 503 });

  let payload: ReadPayload;
  try { payload = await request.json(); }
  catch { return NextResponse.json({ error: 'invalid_request' }, { status: 400 }); }

  const privateId = typeof payload.privateId === 'string' ? payload.privateId.trim() : '';
  const password = typeof payload.password === 'string' ? payload.password : '';
  if (Array.from(privateId).length < 4 || Array.from(privateId).length > 40 || password.length < 8 || password.length > 128) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

  try {
    const response = await callPrivateInquiryRpc('read_private_inquiries', { p_private_id: privateId, p_password: password });
    if (!response.ok) return NextResponse.json({ error: 'upstream_error' }, { status: 502 });
    return NextResponse.json(await response.json());
  } catch {
    return NextResponse.json({ error: 'unavailable' }, { status: 503 });
  }
}
