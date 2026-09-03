import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = '坂道シリーズ リンクハブ / Sakamichi Series Link Hub';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #FBF8F3 0%, #EDE3FA 45%, #FDE7EE 75%, #E2F2FB 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: 700,
            height: 380,
            borderRadius: 40,
            background: 'rgba(251, 248, 243, 0.85)',
            border: '2px solid rgba(158, 143, 184, 0.3)',
            boxShadow: '0 20px 50px rgba(58, 54, 48, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 48,
          }}
        >
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#8A6BC1' }} />
            <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#E88AA6' }} />
            <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#5AB4E0' }} />
          </div>
          <h1 style={{ fontSize: 52, fontWeight: 800, color: '#3A3630', margin: 0, letterSpacing: '-0.02em' }}>
            坂道シリーズ リンクハブ
          </h1>
          <p style={{ fontSize: 22, color: '#7A736A', marginTop: 14, marginBottom: 0, textAlign: 'center' }}>
            乃木坂46 • 櫻坂46 • 日向坂46 公式リンク集
          </p>
          <div style={{ marginTop: 28, fontSize: 14, color: '#8A6BC1', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Sakamichi Series Official Link Hub
          </div>
        </div>
      </div>
    ),
    size,
  );
}
