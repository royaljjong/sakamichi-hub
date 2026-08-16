import React from 'react';

interface PillProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'outline' | 'subtle';
  size?: 'sm' | 'md';
}

export function Pill({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  ...props
}: PillProps) {
  let baseStyle = 'inline-flex items-center gap-1.5 font-medium rounded-full transition';
  const sizeStyle = size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3.5 py-1 text-sm';

  let variantStyle = 'bg-[var(--white-veil)] text-[var(--ink)] border border-[color-mix(in_oklab,var(--g-ink)_15%,transparent)] shadow-sm';
  if (variant === 'outline') {
    variantStyle = 'border border-[var(--ink-faint)] text-[var(--ink-soft)] hover:text-[var(--ink)]';
  } else if (variant === 'subtle') {
    variantStyle = 'bg-[color-mix(in_oklab,var(--g-brand)_12%,var(--paper))] text-[var(--g-ink)]';
  }

  return (
    <div
      className={`${baseStyle} ${sizeStyle} ${variantStyle} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
