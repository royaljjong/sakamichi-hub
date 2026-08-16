'use client';

import React, { useEffect, useState } from 'react';
import { PaperGrain } from './PaperGrain';
import { BlobField } from './BlobField';
import { SlopeLine } from './SlopeLine';
import { ParticleCanvas } from './ParticleCanvas';
import type { ParticleMotif } from '@/lib/schema';

interface AmbientBackgroundProps {
  groupId?: string;
  motif?: ParticleMotif;
}

export function AmbientBackground({
  groupId = 'home',
  motif = 'mixed',
}: AmbientBackgroundProps) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Check localStorage preference or OS prefers-reduced-motion
    const stored = localStorage.getItem('sakamichi-reduced-motion');
    if (stored !== null) {
      setReducedMotion(stored === 'true');
    } else {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setReducedMotion(mediaQuery.matches);

      const listener = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, []);

  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      aria-hidden="true"
    >
      {/* L0 PaperGrain */}
      <PaperGrain />

      {/* L1 BlobField */}
      {!reducedMotion && <BlobField />}

      {/* L2 SlopeLine (Signature) */}
      <SlopeLine groupId={groupId} />

      {/* L3 ParticleCanvas (Only if reduced motion is disabled) */}
      {isClient && !reducedMotion && <ParticleCanvas motif={motif} />}

      {/* L4 Veil (Top 15% Gradient for Text Readability) */}
      <div
        className="absolute top-0 left-0 right-0 h-32 pointer-events-none z-0"
        style={{
          background:
            'linear-gradient(to bottom, var(--paper) 0%, transparent 100%)',
          opacity: 0.85,
        }}
      />
    </div>
  );
}
