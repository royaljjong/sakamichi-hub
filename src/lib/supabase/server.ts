type InquiryRpc = 'create_private_inquiry' | 'read_private_inquiries';

export function isPrivateInquiryServerEnabled() {
  return process.env.PRIVATE_INQUIRY_ENABLED === 'true';
}

export async function callPrivateInquiryRpc(rpc: InquiryRpc, payload: Record<string, string>) {
  const url = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secretKey) {
    throw new Error('Private inquiry server configuration is missing.');
  }

  return fetch(`${url}/rest/v1/rpc/${rpc}`, {
    method: 'POST',
    headers: {
      apikey: secretKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });
}
