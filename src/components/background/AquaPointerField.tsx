'use client';

import { useEffect, useRef } from 'react';

export function AquaPointerField() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const move = (event: PointerEvent) => {
      node.style.setProperty('--aqua-x', `${event.clientX}px`);
      node.style.setProperty('--aqua-y', `${event.clientY}px`);
    };
    window.addEventListener('pointermove', move, { passive: true });
    return () => window.removeEventListener('pointermove', move);
  }, []);

  return (
    <div ref={ref} className="aqua-field" aria-hidden="true">
      <i /><i /><i /><i /><i /><i />
    </div>
  );
}
