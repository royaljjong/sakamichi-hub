'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

export function MotionToggle() {
  const t = useTranslations('a11y');
  const [reduced, setReduced] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('sakamichi-reduced-motion');
    if (stored !== null) {
      setReduced(stored === 'true');
    } else {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      setReduced(mq.matches);
    }
  }, []);

  const toggle = () => {
    const next = !reduced;
    setReduced(next);
    localStorage.setItem('sakamichi-reduced-motion', String(next));
    window.location.reload();
  };

  if (!mounted) return null;

  return (
    <button
      onClick={toggle}
      className="text-xs text-[var(--ink-soft)] hover:text-[var(--ink)] underline underline-offset-4 transition py-1 px-2 rounded focus-visible:outline-2"
      aria-pressed={reduced}
    >
      {reduced ? t('resumeMotion') : t('reduceMotion')}
    </button>
  );
}
