'use client';

import React, { useState } from 'react';
import { GlyphAvatar } from './GlyphAvatar';

interface MemberAvatarProps {
  glyph: string;
  hueShift?: number;
  imageUrl?: string | null;
  groupLogoUrl?: string | null;
  name?: string;
  size?: number;
  isGraduated?: boolean;
  className?: string;
}

export function MemberAvatar({
  glyph,
  hueShift = 0,
  imageUrl,
  groupLogoUrl,
  name = '',
  size = 56,
  isGraduated = false,
  className = '',
}: MemberAvatarProps) {
  const [imgError, setImgError] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const isLikelyLogo = imageUrl ? /(?:^|[\/_-])logo(?:[._/-]|$)|83100622\.jpg/i.test(imageUrl) : false;

  if (imageUrl && !imgError && !isLikelyLogo) {
    return (
      <div
        className={`relative inline-block overflow-hidden rounded-full shrink-0 select-none bg-[var(--paper-deep)] border-2 transition-transform duration-300 ${
          isGraduated
            ? 'border-stone-300 filter grayscale-[40%]'
            : 'border-[color-mix(in_oklab,var(--g-brand)_35%,transparent)] shadow-xs'
        } ${className}`}
        style={{
          width: `${size}px`,
          height: `${size}px`,
        }}
      >
        <img
          src={imageUrl}
          alt={name || glyph}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          className="w-full h-full object-cover object-top scale-105"
        />
      </div>
    );
  }

  if (groupLogoUrl && !logoError) {
    // Brand-tinted background fills the circle so a horizontal wordmark
    // logo (AKB48, SKE48, etc.) doesn't leave awkward white space
    // compared to portrait photo avatars in the same grid.
    return (
      <div
        className={`relative inline-flex items-center justify-center rounded-full shrink-0 select-none border-2 border-[color-mix(in_oklab,var(--g-brand)_35%,transparent)] shadow-xs overflow-hidden ${
          isGraduated ? 'filter grayscale-[40%] opacity-90' : ''
        } ${className}`}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          background:
            'radial-gradient(circle at 30% 30%, color-mix(in oklab, var(--g-brand) 22%, white), color-mix(in oklab, var(--g-brand) 12%, white))',
        }}
        title={name || glyph}
      >
        <img
          src={groupLogoUrl}
          alt={name || glyph}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setLogoError(true)}
          className="w-[88%] h-[88%] object-contain drop-shadow-sm"
          style={{ mixBlendMode: 'multiply' }}
        />
      </div>
    );
  }

  return (
    <GlyphAvatar
      glyph={glyph}
      hueShift={hueShift}
      size={size}
      isGraduated={isGraduated}
      className={className}
    />
  );
}
