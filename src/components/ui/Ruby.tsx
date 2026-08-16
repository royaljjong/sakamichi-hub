import React from 'react';

interface RubyProps {
  kanji: string;
  kana: string;
  locale: string;
  className?: string;
  subClassName?: string;
}

export function Ruby({
  kanji,
  kana,
  locale,
  className = '',
  subClassName = 'text-xs text-[var(--ink-soft)]',
}: RubyProps) {
  if (locale === 'ja') {
    return (
      <ruby className={className}>
        {kanji}
        <rt className="text-[0.6em] text-[var(--ink-soft)] font-normal tracking-normal select-none">
          {kana}
        </rt>
      </ruby>
    );
  }

  return (
    <span className={`inline-flex flex-col ${className}`}>
      <span>{kanji}</span>
      <span className={subClassName}>{kana}</span>
    </span>
  );
}
