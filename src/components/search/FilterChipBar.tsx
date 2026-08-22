'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import type { SearchFilters } from '@/lib/search';

interface GroupMeta {
  id: string;
  name: string;
  franchise: 'sakamichi' | 'akb48g';
}

// Static group list — matches data/groups.json order
const ALL_GROUPS: GroupMeta[] = [
  { id: 'nogizaka46', franchise: 'sakamichi', name: '乃木坂46' },
  { id: 'sakurazaka46', franchise: 'sakamichi', name: '櫻坂46' },
  { id: 'hinatazaka46', franchise: 'sakamichi', name: '日向坂46' },
  { id: 'akb48', franchise: 'akb48g', name: 'AKB48' },
  { id: 'ske48', franchise: 'akb48g', name: 'SKE48' },
  { id: 'nmb48', franchise: 'akb48g', name: 'NMB48' },
  { id: 'hkt48', franchise: 'akb48g', name: 'HKT48' },
  { id: 'ngt48', franchise: 'akb48g', name: 'NGT48' },
  { id: 'stu48', franchise: 'akb48g', name: 'STU48' },
  { id: 'jkt48', franchise: 'akb48g', name: 'JKT48' },
  { id: 'bnk48', franchise: 'akb48g', name: 'BNK48' },
  { id: 'cgm48', franchise: 'akb48g', name: 'CGM48' },
  { id: 'mnl48', franchise: 'akb48g', name: 'MNL48' },
  { id: 'akb48-team-sh', franchise: 'akb48g', name: 'AKB48 Team SH' },
  { id: 'akb48-team-tp', franchise: 'akb48g', name: 'AKB48 Team TP' },
  { id: 'klp48', franchise: 'akb48g', name: 'KLP48' },
];

interface ChipProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function Chip({ active, onClick, children }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
        active
          ? 'bg-[var(--g-brand)] text-white shadow-xs'
          : 'bg-[var(--white-veil)] text-[var(--ink-soft)] border border-[color-mix(in_oklab,var(--g-ink)_12%,transparent)] hover:border-[var(--g-brand)]'
      }`}
    >
      {children}
    </button>
  );
}

interface FilterChipBarProps {
  filters: SearchFilters;
  onChange: (filters: SearchFilters) => void;
}

export function FilterChipBar({ filters, onChange }: FilterChipBarProps) {
  const t = useTranslations('search');

  const franchiseOptions: Array<{ value: 'sakamichi' | 'akb48g' | null; label: string }> = [
    { value: null, label: t('filterAll') },
    { value: 'sakamichi', label: t('franchiseSakamichi') },
    { value: 'akb48g', label: t('franchiseAkb48g') },
  ];

  const statusOptions: Array<{ value: 'active' | 'graduated' | 'trainee' | null; label: string }> = [
    { value: null, label: t('filterAll') },
    { value: 'active', label: t('statusActive') },
    { value: 'graduated', label: t('statusGraduated') },
    { value: 'trainee', label: t('statusTrainee') },
  ];

  const visibleGroups = filters.franchise
    ? ALL_GROUPS.filter((g) => g.franchise === filters.franchise)
    : ALL_GROUPS;

  function setFranchise(franchise: 'sakamichi' | 'akb48g' | null) {
    // Reset group if it doesn't belong to the new franchise
    const newGroupId =
      franchise == null || (filters.groupId && visibleGroups.find((g) => g.id === filters.groupId)?.franchise === franchise)
        ? filters.groupId
        : null;
    onChange({ ...filters, franchise, groupId: newGroupId ?? null });
  }

  function setStatus(status: 'active' | 'graduated' | 'trainee' | null) {
    onChange({ ...filters, status });
  }

  function setGroupId(groupId: string | null) {
    onChange({ ...filters, groupId });
  }

  return (
    <div className="flex flex-col gap-2 mt-4 mb-2 font-[family-name:var(--font-zen-kaku)]">
      {/* Franchise row */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] uppercase tracking-wider text-[var(--ink-faint)] w-12 shrink-0">
          {t('filterFranchise')}
        </span>
        <div className="flex gap-1.5 flex-wrap">
          {franchiseOptions.map((opt) => (
            <Chip
              key={String(opt.value)}
              active={filters.franchise === opt.value || (opt.value === null && filters.franchise == null)}
              onClick={() => setFranchise(opt.value)}
            >
              {opt.label}
            </Chip>
          ))}
        </div>
      </div>

      {/* Status row */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] uppercase tracking-wider text-[var(--ink-faint)] w-12 shrink-0">
          {t('filterStatus')}
        </span>
        <div className="flex gap-1.5 flex-wrap">
          {statusOptions.map((opt) => (
            <Chip
              key={String(opt.value)}
              active={filters.status === opt.value || (opt.value === null && filters.status == null)}
              onClick={() => setStatus(opt.value)}
            >
              {opt.label}
            </Chip>
          ))}
        </div>
      </div>

      {/* Group row — only shown when franchise is selected */}
      {filters.franchise != null && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] uppercase tracking-wider text-[var(--ink-faint)] w-12 shrink-0">
            {t('filterGroup')}
          </span>
          <div className="flex gap-1.5 flex-wrap">
            <Chip
              active={filters.groupId == null}
              onClick={() => setGroupId(null)}
            >
              {t('filterAll')}
            </Chip>
            {visibleGroups.map((g) => (
              <Chip
                key={g.id}
                active={filters.groupId === g.id}
                onClick={() => setGroupId(g.id)}
              >
                {g.name}
              </Chip>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
