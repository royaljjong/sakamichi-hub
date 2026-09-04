import { NextResponse } from 'next/server';
import { callPrivateInquiryRpc, isPrivateInquiryServerEnabled } from '@/lib/supabase/server';

export const runtime = 'nodejs';

type CreatePayload = { privateId?: unknown; password?: unknown; category?: unknown; title?: unknown; body?: unknown };

export async function POST(request: Request) {
  if (!isPrivateInquiryServerEnabled()) return NextResponse.json({ error: 'unavailable' }, { status: 503 });

  let payload: CreatePayload;
  try { payload = await request.json(); }
  catch { return NextResponse.json({ error: 'invalid_request' }, { status: 400 }); }

  const privateId = typeof payload.privateId === 'string' ? payload.privateId.trim() : '';
  const password = typeof payload.password === 'string' ? payload.password : '';
  const category = typeof payload.category === 'string' ? payload.category : '';
  const title = typeof payload.title === 'string' ? payload.title.trim() : '';
  const body = typeof payload.body === 'string' ? payload.body.trim() : '';
  if (Array.from(privateId).length < 4 || Array.from(privateId).length > 40 || password.length < 8 || password.length > 128 || !['takedown', 'correction', 'general'].includes(category) || Array.from(title).length < 1 || Array.from(title).length > 120 || Array.from(body).length < 1 || Array.from(body).length > 5000) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

  try {
    const response = await callPrivateInquiryRpc('create_private_inquiry', { p_private_id: privateId, p_password: password, p_category: category, p_title: title, p_body: body });
    if (!response.ok) return NextResponse.json({ error: 'upstream_error' }, { status: 502 });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'unavailable' }, { status: 503 });
  }
}
