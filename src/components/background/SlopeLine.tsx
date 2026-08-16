'use client';

import React from 'react';
import { motion } from 'motion/react';
import { SLOPES } from '@/design/slopes';

interface SlopeLineProps {
  groupId?: string;
}

export function SlopeLine({ groupId = 'home' }: SlopeLineProps) {
  const pathD = SLOPES[groupId] || SLOPES.home!;

  return (
    <div
      className="absolute bottom-0 left-0 right-0 h-48 md:h-64 pointer-events-none z-0 overflow-hidden"
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
