import { ImageResponse } from 'next/og';
import { getGroup, getMembers } from '@/lib/data';

export const runtime = 'edge';
export const alt = 'Group OG Image';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

interface Props {
  params: Promise<{ locale: string; groupId: string }>;
}

export default async function Image({ params }: Props) {
  const { groupId } = await params;
  const group = getGroup(groupId);

  if (!group) {
    return new ImageResponse(
      <div style={{ width: 1200, height: 630, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a1a1a', color: '#fff', fontSize: 48 }}>
        Sakamichi Box
      </div>,
      { width: 1200, height: 630 },
    );
  }

  const members = getMembers({ groupId });
  const activeCount = members.filter((m) => m.status === 'active' || m.status === 'trainee' || m.status === 'graduating').length;
  const brand = group.palette.brand;
  const wash = group.palette.wash;
  const ink = group.palette.ink;

  // Fetch group logo if available
  let logoData: string | null = null;
  if (group.logoUrl) {
    try {
      const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 3000);
        const res = await fetch(group.logoUrl, { signal: controller.signal });
        clearTimeout(timer);
      if (res.ok) {
        const buf = await res.arrayBuffer();
        const b64 = Buffer.from(buf).toString('base64');
        const ct = res.headers.get('content-type') || 'image/png';
        logoData = `data:${ct};base64,${b64}`;
      }
    } catch {
      // no logo
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: 'flex',
          background: `linear-gradient(135deg, ${wash} 0%, ${brand}22 60%, ${brand}44 100%)`,
          fontFamily: 'sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative accent bar */}
        <div style={{ position: 'absolute', left: 0, top: 0, width: 8, height: 630, background: brand, display: 'flex' }} />

        {/* Left half: logo / glyph */}
        <div
          style={{
            width: 480,
            height: 630,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {logoData ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoData}
              alt={group.name.ja}
              width={280}
              height={280}
              style={{ objectFit: 'contain', borderRadius: 24 }}
            />
          ) : (
            <div
              style={{
                width: 280,
                height: 280,
                borderRadius: 140,
                background: `${brand}33`,
                border: `4px solid ${brand}66`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 80,
                color: brand,
                fontWeight: 800,
              }}
            >
              {group.name.ja.charAt(0)}
            </div>
          )}
        </div>

        {/* Right half: text info */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            paddingRight: 64,
            paddingTop: 48,
            paddingBottom: 48,
            gap: 0,
          }}
        >
          {/* Kicker */}
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: brand,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              marginBottom: 20,
              display: 'flex',
            }}
          >
            SAKAMICHI BOX · OFFICIAL DIRECTORY
          </div>

          {/* Group name JA */}
          <div
            style={{
              fontSize: 56,
              fontWeight: 800,
              color: ink,
              lineHeight: 1.15,
              marginBottom: 12,
              display: 'flex',
            }}
          >
            {group.name.ja}
          </div>

          {/* Group name KO + EN */}
          <div
            style={{
              fontSize: 22,
              color: `${ink}BB`,
              fontWeight: 500,
              marginBottom: 40,
              display: 'flex',
              gap: 12,
            }}
          >
            <span>{group.name.ko}</span>
            <span style={{ opacity: 0.5 }}>·</span>
            <span>{group.name.en}</span>
          </div>

          {/* Debut + member count */}
          <div
            style={{
              display: 'flex',
              gap: 24,
              fontSize: 16,
              color: `${ink}99`,
              fontWeight: 500,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: `${ink}66`, display: 'flex' }}>
                DEBUT
              </span>
              <span style={{ display: 'flex' }}>{group.debutedOn}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: `${ink}66`, display: 'flex' }}>
                ACTIVE MEMBERS
              </span>
              <span style={{ display: 'flex' }}>{activeCount}</span>
            </div>
          </div>
        </div>

        {/* Bottom brand strip */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 8,
            right: 0,
            height: 4,
            background: `linear-gradient(90deg, ${brand} 0%, ${brand}44 100%)`,
            display: 'flex',
          }}
        />
      </div>
    ),
    { ...size },
  );
}
