import React from 'react';

interface GlyphAvatarProps {
  glyph: string;
  hueShift?: number;
  size?: number;
  isGraduated?: boolean;
  className?: string;
}

export function GlyphAvatar({
  glyph,
  hueShift = 0,
  size = 56,
  isGraduated = false,
  className = '',
}: GlyphAvatarProps) {
  const fontSize = Math.round(size * 0.44);

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full shrink-0 select-none transition-transform duration-300 font-[family-name:var(--font-klee-one)] font-semibold ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        fontSize: `${fontSize}px`,
        background: `radial-gradient(circle at 35% 35%, color-mix(in oklab, var(--g-blob-a) ${isGraduated ? '40%' : '75%'}, var(--paper)), color-mix(in oklab, var(--g-blob-b) ${isGraduated ? '30%' : '65%'}, var(--paper-deep)))`,
        border: '2px solid color-mix(in oklab, var(--g-brand) 28%, transparent)',
        boxShadow:
          'inset 0 1px 3px rgba(0,0,0,0.06), 0 2px 6px color-mix(in oklab, var(--g-ink) 8%, transparent)',
        color: isGraduated ? 'var(--ink-soft)' : 'var(--g-ink)',
        filter: isGraduated ? 'saturate(0.65) brightness(0.96)' : `hue-rotate(${hueShift}deg)`,
      }}
      aria-hidden="true"
    >
      <span className="leading-none transform translate-y-[-1px]">
        {glyph}
      </span>
    </div>
  );
}
