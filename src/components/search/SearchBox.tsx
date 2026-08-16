'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { SearchIcon } from '@/components/ui/icons';
import { searchMembers, type SearchIndexItem } from '@/lib/search';
import { SearchResults } from './SearchResults';

interface SearchBoxProps {
  locale: string;
}

export function SearchBox({ locale }: SearchBoxProps) {
  const t = useTranslations('search');
  const [query, setQuery] = useState('');
  const [indexItems, setIndexItems] = useState<SearchIndexItem[]>([]);
  const [results, setResults] = useState<SearchIndexItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/search-index.json')
      .then((res) => res.json())
      .then((data) => {
        setIndexItems(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load search index:', err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
    } else {
      const matches = searchMembers(indexItems, query);
      setResults(matches);
    }
  }, [query, indexItems]);

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
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('placeholder')}
          className="w-full pl-12 pr-4 py-3.5 text-base sm:text-lg rounded-2xl bg-[var(--white-veil)] border border-[color-mix(in_oklab,var(--g-ink)_15%,transparent)] focus:border-[var(--g-brand)] shadow-[var(--shadow-soft)] focus:shadow-[var(--shadow-lift)] backdrop-blur-md outline-none transition duration-200 text-[var(--ink)] placeholder:text-[var(--ink-faint)]"
          autoFocus
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-4 text-xs font-semibold text-[var(--ink-soft)] hover:text-[var(--ink)] px-2 py-1 rounded-md"
          >
            ✕
          </button>
        )}
      </div>

      {/* Query Stats */}
      {query.trim() !== '' && (
        <div className="mt-3 text-xs text-[var(--ink-soft)] px-2 font-[family-name:var(--font-zen-kaku)]">
          {results.length > 0
            ? t('resultCount', { count: results.length })
            : t('noResults')}
        </div>
      )}

      {/* Results List */}
      <div className="mt-6">
        <SearchResults
          results={results}
          query={query}
          locale={locale}
          loading={loading}
        />
      </div>
    </div>
  );
}
