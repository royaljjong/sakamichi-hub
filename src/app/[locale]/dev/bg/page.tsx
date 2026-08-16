'use client';

import React, { useState, useEffect } from 'react';
import { AmbientBackground } from '@/components/background/AmbientBackground';
import { MotionToggle } from '@/components/ui/MotionToggle';
import type { ParticleMotif } from '@/lib/schema';

const GROUPS = [
  { id: 'home', name: 'Home (Mixed)', motif: 'mixed' as ParticleMotif },
  { id: 'nogizaka46', name: '乃木坂46 (Nogizaka46)', motif: 'bubble' as ParticleMotif },
  { id: 'sakurazaka46', name: '櫻坂46 (Sakurazaka46)', motif: 'petal' as ParticleMotif },
  { id: 'hinatazaka46', name: '日向坂46 (Hinatazaka46)', motif: 'sparkle' as ParticleMotif },
  { id: 'keyakizaka46', name: '欅坂46 Era (Keyakizaka46)', motif: 'leaf' as ParticleMotif },
];

export default function BackgroundDevPage() {
  const [selectedGroup, setSelectedGroup] = useState('home');
  const currentMotif = GROUPS.find((g) => g.id === selectedGroup)?.motif || 'mixed';

  useEffect(() => {
    document.documentElement.setAttribute('data-group', selectedGroup);
  }, [selectedGroup]);

  return (
    <div className="relative min-h-screen z-10 flex flex-col justify-between p-8 md:p-16">
      <AmbientBackground groupId={selectedGroup} motif={currentMotif} />

      <header className="max-w-2xl">
        <span className="text-xs uppercase tracking-widest text-[var(--g-brand)] font-semibold mb-2 block">
          Phase 3 Dev & Verification
        </span>
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 text-[var(--g-ink)] font-[family-name:var(--font-klee-one)]">
          Ambient Background Engine
        </h1>
        <p className="text-[var(--ink-soft)] text-sm md:text-base leading-relaxed">
          5개 상태(홈 + 4개 그룹) 사이의 부드러운 색 보간, SlopeLine 언덕선 모핑,
          캔버스 파티클(비눗방울·꽃잎·빛·나뭇잎) 크로스페이드를 실시간으로 검수합니다.
        </p>
      </header>

      <main className="my-12 max-w-xl">
        <div className="bg-[var(--white-veil)] p-6 rounded-3xl shadow-[var(--shadow-soft)] border border-[color-mix(in_oklab,var(--g-ink)_10%,transparent)] backdrop-blur-md">
          <h2 className="text-sm font-semibold text-[var(--ink)] mb-4">
            그룹 테마 전환 (클릭하여 실시간 보간 확인)
          </h2>
          <div className="flex flex-wrap gap-3">
            {GROUPS.map((g) => (
              <button
                key={g.id}
                onClick={() => setSelectedGroup(g.id)}
                className={`px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                  selectedGroup === g.id
                    ? 'bg-[var(--g-brand)] text-white shadow-md scale-105'
                    : 'bg-white/80 hover:bg-white text-[var(--ink)] border border-[color-mix(in_oklab,var(--g-ink)_15%,transparent)]'
                }`}
              >
                {g.name}
              </button>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-[color-mix(in_oklab,var(--g-ink)_10%,transparent)] flex items-center justify-between text-xs text-[var(--ink-soft)]">
            <span>Current Motif: <strong>{currentMotif}</strong></span>
            <span>Target Group ID: <strong>{selectedGroup}</strong></span>
          </div>
        </div>
      </main>

      <footer className="flex justify-between items-center text-xs text-[var(--ink-soft)]">
        <div>Sakamichi Hub • Background Engine v1.0</div>
        <MotionToggle />
      </footer>
    </div>
  );
}
