'use client';

import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { SLOPES } from '@/design/slopes';

interface SlopeLineProps {
  groupId?: string;
}

export function SlopeLine({ groupId = 'home' }: SlopeLineProps) {
  const pathD = SLOPES[groupId] || SLOPES.home!;

  useEffect(() => {
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const norm = (e.clientY / window.innerHeight) - 0.5;
        document.documentElement.style.setProperty('--slope-cursor-y', `${norm * -6}px`);
        raf = 0;
      });
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => { window.removeEventListener('pointermove', onMove); if (raf) cancelAnimationFrame(raf); };
  }, []);

  return (
    <div
      className="absolute bottom-0 left-0 right-0 h-48 md:h-64 pointer-events-none z-0 overflow-hidden"
      style={{ translate: `0 var(--slope-cursor-y, 0)`, transition: 'translate 400ms cubic-bezier(0.33, 0.02, 0.16, 1)' }}
      aria-hidden="true"
    >
      <svg
        className="w-full h-full"
        viewBox="0 0 1440 240"
        preserveAspectRatio="none"
      >
        {/* Back Layer */}
        <motion.path
          animate={{ d: pathD }}
          transition={{ duration: 1.2, ease: [0.33, 0.02, 0.16, 1] }}
          fill="var(--g-blob-b)"
          opacity={0.22}
          style={{
            transform: 'translateY(-14px) scaleY(1.06)',
            transformOrigin: 'bottom',
          }}
        />

        {/* Front Layer */}
        <motion.path
          animate={{ d: pathD }}
          transition={{ duration: 1.2, ease: [0.33, 0.02, 0.16, 1] }}
          fill="var(--g-brand)"
          opacity={0.16}
        />
      </svg>
    </div>
  );
}
