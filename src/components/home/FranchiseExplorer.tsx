'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'motion/react';
import type { Group, Member, FranchiseKind, RegionKind } from '@/lib/schema';
import { GroupCard } from '@/components/group/GroupCard';

interface FranchiseExplorerProps {
  groups: Group[];
  allMembers: Member[];
  locale: string;
}

export function FranchiseExplorer({
  groups,
  allMembers,
  locale,
}: FranchiseExplorerProps) {
  const t = useTranslations('franchise');
  const [activeFranchise, setActiveFranchise] = useState<FranchiseKind>('sakamichi');
  const [activeRegion, setActiveRegion] = useState<RegionKind | 'all'>('domestic');

  const sakamichiGroups = groups.filter((g) => (g.franchise || 'sakamichi') === 'sakamichi');
  const akbGroups = groups.filter((g) => g.franchise === 'akb48g');

  const displayedGroups =
    activeFranchise === 'sakamichi'
      ? sakamichiGroups
      : akbGroups.filter((g) => (activeRegion === 'all' ? true : (g.region || 'domestic') === activeRegion));

  const domesticCount = akbGroups.filter((g) => (g.region || 'domestic') === 'domestic').length;
  const intlCount = akbGroups.filter((g) => g.region === 'international').length;

  const handleFranchiseChange = (franchise: FranchiseKind) => {
    setActiveFranchise(franchise);
    if (franchise === 'sakamichi') {
      document.documentElement.setAttribute('data-group', 'home');
    } else {
      document.documentElement.setAttribute('data-group', 'akb48');
    }
  };

  return (
    <div className="w-full space-y-8">
      {/* 1. Main Franchise Switcher Pill Tabs */}
      <div className="flex flex-col items-center justify-center gap-4">
        <div className="inline-flex p-1.5 rounded-full bg-[var(--white-veil)] border border-[color-mix(in_oklab,var(--g-ink)_12%,transparent)] shadow-[var(--shadow-soft)] backdrop-blur-md">
          <button
            type="button"
            onClick={() => handleFranchiseChange('sakamichi')}
            className={`relative px-6 sm:px-8 py-3 rounded-full text-base font-bold transition-colors duration-200 z-10 ${
              activeFranchise === 'sakamichi'
                ? 'text-[var(--g-ink)]'
                : 'text-[var(--ink-soft)] hover:text-[var(--g-ink)]'
            }`}
          >
            {activeFranchise === 'sakamichi' && (
              <motion.div
                layoutId="franchise-pill"
                className="absolute inset-0 rounded-full bg-white shadow-md border border-[color-mix(in_oklab,var(--g-brand)_20%,transparent)] -z-10"
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              />
            )}
            <span className="flex items-center gap-2">
              <span className="text-lg">🌸</span>
              <span>{t('sakamichiShort')}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--paper-deep)] text-[var(--ink-soft)]">
                {sakamichiGroups.length}
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleFranchiseChange('akb48g')}
            className={`relative px-6 sm:px-8 py-3 rounded-full text-base font-bold transition-colors duration-200 z-10 ${
              activeFranchise === 'akb48g'
                ? 'text-[var(--g-ink)]'
                : 'text-[var(--ink-soft)] hover:text-[var(--g-ink)]'
            }`}
          >
            {activeFranchise === 'akb48g' && (
              <motion.div
                layoutId="franchise-pill"
                className="absolute inset-0 rounded-full bg-white shadow-md border border-[color-mix(in_oklab,var(--g-brand)_20%,transparent)] -z-10"
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              />
            )}
            <span className="flex items-center gap-2">
              <span className="text-lg">🎀</span>
              <span>{t('akb48gShort')}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--paper-deep)] text-[var(--ink-soft)]">
                {akbGroups.length}
              </span>
            </span>
          </button>
        </div>

        {/* Subtitle Description */}
        <p className="text-xs sm:text-sm font-medium text-[var(--ink-soft)] font-[family-name:var(--font-zen-maru)]">
          {activeFranchise === 'sakamichi' ? t('sakamichiDesc') : t('akb48gDesc')}
        </p>
      </div>

      {/* 2. Secondary Region Filter (Only shown when AKB48 Group is active) */}
      {activeFranchise === 'akb48g' && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="flex items-center justify-center gap-2 flex-wrap"
        >
          <button
            type="button"
            onClick={() => setActiveRegion('domestic')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
              activeRegion === 'domestic'
                ? 'bg-[var(--g-brand)] text-white shadow-sm'
                : 'bg-[var(--white-veil)] text-[var(--ink-soft)] hover:text-[var(--g-ink)] border border-[color-mix(in_oklab,var(--g-ink)_10%,transparent)]'
            }`}
          >
            {t('domestic')} ({domesticCount})
          </button>

          <button
            type="button"
            onClick={() => setActiveRegion('international')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
              activeRegion === 'international'
                ? 'bg-[var(--g-brand)] text-white shadow-sm'
                : 'bg-[var(--white-veil)] text-[var(--ink-soft)] hover:text-[var(--g-ink)] border border-[color-mix(in_oklab,var(--g-ink)_10%,transparent)]'
            }`}
          >
            {t('international')} ({intlCount})
          </button>

          <button
            type="button"
            onClick={() => setActiveRegion('all')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
              activeRegion === 'all'
                ? 'bg-[var(--g-brand)] text-white shadow-sm'
                : 'bg-[var(--white-veil)] text-[var(--ink-soft)] hover:text-[var(--g-ink)] border border-[color-mix(in_oklab,var(--g-ink)_10%,transparent)]'
            }`}
          >
            {t('all')} ({akbGroups.length})
          </button>
        </motion.div>
      )}

      {/* 3. Group Cards Grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${activeFranchise}-${activeRegion}`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.28, ease: [0.2, 0.8, 0.2, 1] }}
          className={`grid gap-6 lg:gap-8 items-stretch ${
            activeFranchise === 'sakamichi'
              ? 'grid-cols-1 md:grid-cols-3'
              : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
          }`}
        >
          {displayedGroups.map((group) => {
            const groupMembers = allMembers.filter((m) =>
              m.memberships.some((ms) => ms.groupId === group.id),
            );
            return (
              <GroupCard
                key={group.id}
                group={group}
                members={groupMembers}
                locale={locale}
              />
            );
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
