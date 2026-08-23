'use client';

import { useEffect } from 'react';

// Extend the Window interface with the adsbygoogle global
declare global {
  interface Window {
    adsbygoogle: Record<string, unknown>[];
  }
}

interface AdSlotProps {
  /** AdSense ad slot ID from the AdSense dashboard */
  slot: string;
  format?: 'auto' | 'fluid';
  className?: string;
}

const PUBLISHER_ID =
  process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? 'ca-pub-XXXXXXXXXXXXXXXX';

const IS_PLACEHOLDER =
  !PUBLISHER_ID || PUBLISHER_ID === 'ca-pub-XXXXXXXXXXXXXXXX';

export function AdSlot({ slot, format = 'auto', className }: AdSlotProps) {
  useEffect(() => {
    if (IS_PLACEHOLDER || !slot) return;

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // Silently ignore push errors (e.g. during SSR hydration edge cases)
    }
  }, [slot]);

  // Render nothing when publisher ID or slot is not configured
  if (IS_PLACEHOLDER || !slot) return null;

  return (
    <div className={className}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={PUBLISHER_ID}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
