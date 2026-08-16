'use client';

import React, { useState } from 'react';
import { GlyphAvatar } from './GlyphAvatar';

interface MemberAvatarProps {
  glyph: string;
  hueShift?: number;
  imageUrl?: string | null;
  name?: string;
  size?: number;
  isGraduated?: boolean;
  className?: string;
}

export function MemberAvatar({
  glyph,
  hueShift = 0,
  imageUrl,
  name = '',
  size = 56,
  isGraduated = false,
  className = '',
}: MemberAvatarProps) {
  const [imgError, setImgError] = useState(false);

  if (imageUrl && !imgError) {
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
