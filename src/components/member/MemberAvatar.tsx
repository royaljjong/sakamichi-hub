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
    return (
      <div
        className={`relative inline-flex items-center justify-center rounded-full shrink-0 select-none border-2 border-[color-mix(in_oklab,var(--g-brand)_35%,transparent)] shadow-xs overflow-hidden bg-[var(--white-veil)] ${
          isGraduated ? 'filter grayscale-[40%] opacity-90' : ''
        } ${className}`}
        style={{ width: `${size}px`, height: `${size}px` }}
        title={name || glyph}
      >
        <img
          src={groupLogoUrl}
          alt={name || glyph}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setLogoError(true)}
          className="w-[72%] h-[72%] object-contain"
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
