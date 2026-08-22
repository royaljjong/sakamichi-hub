'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { SearchIcon } from '@/components/ui/icons';
import { searchMembers, type SearchIndexItem, type SearchFilters } from '@/lib/search';
import { SearchResults } from './SearchResults';
import { FilterChipBar } from './FilterChipBar';

interface SearchBoxProps {
  locale: string;
}

function SearchBoxInner({ locale }: SearchBoxProps) {
  const t = useTranslations('search');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Derive initial state from URL
  function readFiltersFromParams(): SearchFilters {
    const franchise = searchParams.get('franchise');
    const groupId = searchParams.get('group');
    const status = searchParams.get('status');
    return {
      franchise:
        franchise === 'sakamichi' || franchise === 'akb48g' ? franchise : null,
      groupId: groupId ?? null,
      status:
        status === 'active' || status === 'graduated' || status === 'trainee'
          ? status
          : null,
    };
  }

  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [filters, setFilters] = useState<SearchFilters>(readFiltersFromParams);
  const [indexItems, setIndexItems] = useState<SearchIndexItem[]>([]);
  const [results, setResults] = useState<SearchIndexItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Load search index once
  useEffect(() => {
    fetch('/search-index.json')
      .then((res) => res.json())
      .then((data: SearchIndexItem[]) => {
        // Back-fill franchise if missing (old index without franchise field)
        const filled = data.map((item) => ({
          ...item,
          franchise: item.franchise ?? ('sakamichi' as const),
        }));
        setIndexItems(filled);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load search index:', err);
        setLoading(false);
      });
  }, []);

  // Sync results when query, filters, or index changes
  useEffect(() => {
    const hasQuery = query.trim() !== '';
    const hasFilters =
      filters.franchise != null || filters.groupId != null || filters.status != null;

    if (!hasQuery && !hasFilters) {
      setResults([]);
    } else {
      setResults(searchMembers(indexItems, query, filters));
    }
  }, [query, filters, indexItems]);

  // Persist state to URL
  const pushToUrl = useCallback(
    (nextQuery: string, nextFilters: SearchFilters) => {
      const params = new URLSearchParams();
      if (nextQuery) params.set('q', nextQuery);
      if (nextFilters.franchise) params.set('franchise', nextFilters.franchise);
      if (nextFilters.groupId) params.set('group', nextFilters.groupId);
      if (nextFilters.status) params.set('status', nextFilters.status);
      const search = params.toString();
      router.replace(`${pathname}${search ? `?${search}` : ''}`, { scroll: false });
    },
    [pathname, router],
  );

  function handleQueryChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.value;
    setQuery(next);
    pushToUrl(next, filters);
  }

  function handleQueryClear() {
    setQuery('');
    pushToUrl('', filters);
  }

  function handleFiltersChange(next: SearchFilters) {
    setFilters(next);
    pushToUrl(query, next);
  }

  const hasQuery = query.trim() !== '';
  const hasFilters =
    filters.franchise != null || filters.groupId != null || filters.status != null;
  const showStats = hasQuery || hasFilters;

  // Compute per-group breakdown for summary
  const groupCounts = results.reduce<Record<string, number>>((acc, item) => {
    acc[item.groupId] = (acc[item.groupId] ?? 0) + 1;
    return acc;
  }, {});
  const groupBreakdown = Object.entries(groupCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, count]) => `${id} ${count}`)
    .join(' · ');

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Search Input Bar */}
      <div className="relative flex items-center">
        <div className="absolute left-4 pointer-events-none text-[var(--ink-soft)]">
          <SearchIcon className="w-5 h-5" />
        </div>
        <input
          type="search"
          value={query}
          onChange={handleQueryChange}
          placeholder={hasFilters && !hasQuery ? t('browseByFilterHint') : t('placeholder')}
          className="w-full pl-12 pr-4 py-3.5 text-base sm:text-lg rounded-2xl bg-[var(--white-veil)] border border-[color-mix(in_oklab,var(--g-ink)_15%,transparent)] focus:border-[var(--g-brand)] shadow-[var(--shadow-soft)] focus:shadow-[var(--shadow-lift)] backdrop-blur-md outline-none transition duration-200 text-[var(--ink)] placeholder:text-[var(--ink-faint)]"
          autoFocus
        />
        {query && (
          <button
            type="button"
            onClick={handleQueryClear}
            className="absolute right-4 text-xs font-semibold text-[var(--ink-soft)] hover:text-[var(--ink)] px-2 py-1 rounded-md"
          >
            ✕
          </button>
        )}
      </div>

      {/* Filter chip bar */}
      <FilterChipBar filters={filters} onChange={handleFiltersChange} />

      {/* Result count summary */}
      {showStats && (
        <div className="mt-3 text-xs text-[var(--ink-soft)] px-2 font-[family-name:var(--font-zen-kaku)]">
          {results.length > 0 ? (
            <span>
              {t('resultCount', { count: results.length })}
              {groupBreakdown && (
                <span className="ml-2 text-[var(--ink-faint)]">({groupBreakdown})</span>
              )}
            </span>
          ) : (
            t('noResults')
          )}
        </div>
      )}

      {/* Results List */}
      <div className="mt-6">
        <SearchResults
          results={results}
          query={query}
          locale={locale}
          loading={loading}
          hasFilters={hasFilters}
        />
      </div>
    </div>
  );
}

export function SearchBox({ locale }: SearchBoxProps) {
  return (
    <Suspense>
      <SearchBoxInner locale={locale} />
    </Suspense>
  );
}
