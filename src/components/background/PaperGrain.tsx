import React from 'react';

export function PaperGrain() {
  return (
    <div
      className="absolute inset-0 pointer-events-none z-0"
      style={{
        opacity: 0.045,
        mixBlendMode: 'multiply',
        filter: 'url(#grain)',
      }}
      aria-hidden="true"
    >
      <svg width="0" height="0" className="absolute">
        <filter id="grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.82"
            numOctaves={3}
            seed={7}
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </svg>
      <div className="w-full h-full bg-[#3A3630]" />
    </div>
  );
}
