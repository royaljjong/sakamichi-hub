import { ImageResponse } from 'next/og';
import { getMember, getGroup } from '@/lib/data';

export const runtime = 'edge';
export const alt = 'Member OG Image';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

interface Props {
  params: Promise<{ locale: string; memberId: string }>;
}

export default async function Image({ params }: Props) {
  const { memberId } = await params;
  const member = getMember(memberId);

  if (!member) {
    return new ImageResponse(
      <div style={{ width: 1200, height: 630, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a1a1a', color: '#fff', fontSize: 48 }}>
        Sakamichi Box
      </div>,
      { width: 1200, height: 630 },
    );
  }

  const group = getGroup(member.primaryGroupId);
  const brand = group?.palette.brand ?? '#8A6BC1';
  const wash = group?.palette.wash ?? '#F3EDFB';
  const ink = group?.palette.ink ?? '#3E3355';

  // Try to fetch member avatar image
  let avatarData: string | null = null;
  const imageUrl = member.imageUrl ?? group?.logoUrl ?? null;
  if (imageUrl) {
    try {
      const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 3000);
        const res = await fetch(imageUrl, { signal: controller.signal });
        clearTimeout(timer);
      if (res.ok) {
        const buf = await res.arrayBuffer();
        const b64 = Buffer.from(buf).toString('base64');
        const ct = res.headers.get('content-type') || 'image/jpeg';
        avatarData = `data:${ct};base64,${b64}`;
      }
    } catch {
      // no avatar
    }
  }

  const groupShortName = group?.shortName.ja ?? group?.name.ja ?? '';
  const isGraduated = member.status === 'graduated' || member.status === 'withdrawn';

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

        {/* Left half: avatar */}
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
          {avatarData ? (
            <div
              style={{
                width: 300,
                height: 300,
                borderRadius: 150,
                overflow: 'hidden',
                border: `4px solid ${brand}66`,
                display: 'flex',
                opacity: isGraduated ? 0.7 : 1,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={avatarData}
                alt={member.name.ja.kanji}
                width={300}
                height={300}
                style={{ objectFit: 'cover', width: '100%', height: '100%' }}
              />
            </div>
          ) : (
            <div
              style={{
                width: 300,
                height: 300,
                borderRadius: 150,
                background: `${brand}33`,
                border: `4px solid ${brand}66`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 100,
                color: brand,
                fontWeight: 800,
              }}
            >
              {member.avatar.glyph}
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
          {/* Group short name */}
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: brand,
              letterSpacing: '0.12em',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            {groupShortName}
            {isGraduated && (
              <span
                style={{
                  fontSize: 11,
                  background: `${ink}22`,
                  color: `${ink}99`,
                  padding: '2px 8px',
                  borderRadius: 4,
                  letterSpacing: '0.1em',
                  display: 'flex',
                }}
              >
                GRADUATED
              </span>
            )}
          </div>

          {/* Member kanji name */}
          <div
            style={{
              fontSize: 64,
              fontWeight: 800,
              color: ink,
              lineHeight: 1.1,
              marginBottom: 16,
              display: 'flex',
            }}
          >
            {member.name.ja.kanji}
          </div>

          {/* Kana + hangul + romaji stacked */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              marginBottom: 40,
            }}
          >
            <div style={{ fontSize: 20, color: `${ink}BB`, fontWeight: 400, display: 'flex' }}>
              {member.name.ja.kana}
            </div>
            <div style={{ fontSize: 20, color: `${ink}99`, fontWeight: 400, display: 'flex', gap: 12 }}>
              <span>{member.name.ko.hangul}</span>
              <span style={{ opacity: 0.4 }}>·</span>
              <span>{member.name.en.romaji}</span>
            </div>
          </div>

          {/* Birth date + blood type if available */}
          <div
            style={{
              display: 'flex',
              gap: 20,
              fontSize: 15,
              color: `${ink}88`,
              fontWeight: 400,
            }}
          >
            {member.birthDate && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: `${ink}55`, display: 'flex' }}>
                  BORN
                </span>
                <span style={{ display: 'flex' }}>{member.birthDate}</span>
              </div>
            )}
            {member.bloodType && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: `${ink}55`, display: 'flex' }}>
                  BLOOD TYPE
                </span>
                <span style={{ display: 'flex' }}>{member.bloodType}</span>
              </div>
            )}
          </div>

          {/* Kicker at bottom */}
          <div
            style={{
              position: 'absolute',
              bottom: 32,
              right: 64,
              fontSize: 12,
              color: `${ink}55`,
              letterSpacing: '0.1em',
              display: 'flex',
            }}
          >
            SAKAMICHI BOX · OFFICIAL DIRECTORY
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
