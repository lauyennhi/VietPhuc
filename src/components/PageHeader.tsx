import React from 'react';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  aside?: React.ReactNode;
}

/** Consistent page title block (replaces the old experience switcher bar). */
export const PageHeader: React.FC<PageHeaderProps> = ({ eyebrow, title, subtitle, aside }) => (
  <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div className="space-y-1.5">
      {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#C4553F]">{eyebrow}</p>}
      <h1 className="font-serif text-3xl font-bold leading-tight text-[#1E3443] sm:text-4xl">{title}</h1>
      {subtitle && <p className="max-w-2xl text-[15px] text-[#5C5248]">{subtitle}</p>}
    </div>
    {aside && <div className="shrink-0">{aside}</div>}
  </header>
);
