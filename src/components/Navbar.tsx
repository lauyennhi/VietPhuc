/**
 * Top navigation: Trang chủ · Khám phá ▾ (Studio, Adaptive Fashion, Phòng 3D) · Kiến thức · Lookbook.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Accessibility, Box, ChevronDown, Menu, Palette, Search, X } from 'lucide-react';
import { AccessibilityMenu } from './AccessibilityMenu';

export type Page = 'home' | 'studio' | 'adaptive' | 'virtual' | 'knowledge' | 'lookbook';

interface NavbarProps {
  page: Page;
  onNavigate: (page: Page) => void;
  lookbookCount: number;
  onOpenSearch?: () => void;
}

const EXPLORE_ITEMS: Array<{ page: Page; label: string; desc: string; icon: React.ElementType; tint: string }> = [
  { page: 'studio', label: 'Studio', desc: 'AI tạo hoặc tự tay phối', icon: Palette, tint: 'bg-[#F7E7E1] text-[#C4553F]' },
  { page: 'adaptive', label: 'Adaptive Fashion', desc: 'May đo cho mọi cơ thể', icon: Accessibility, tint: 'bg-[#E6EEE3] text-[#3D6B35]' },
  { page: 'virtual', label: 'Phòng 3D · VR', desc: 'Xem 3D, tham quan di sản', icon: Box, tint: 'bg-[#E6ECF1] text-[#1E3443]' },
];

const Ornament: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
    <path d="M12 2c1 2.6 2.6 4.2 5.2 5.2C14.6 8.2 13 9.8 12 12.4 11 9.8 9.4 8.2 6.8 7.2 9.4 6.2 11 4.6 12 2Zm0 9.6c1 2.6 2.6 4.2 5.2 5.2-2.6 1-4.2 2.6-5.2 5.2-1-2.6-2.6-4.2-5.2-5.2 2.6-1 4.2-2.6 5.2-5.2Z" opacity=".9" />
  </svg>
);

export const Navbar: React.FC<NavbarProps> = ({ page, onNavigate, lookbookCount, onOpenSearch }) => {
  const [exploreOpen, setExploreOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const exploreRef = useRef<HTMLDivElement>(null);
  const exploreActive = page === 'studio' || page === 'adaptive' || page === 'virtual';

  useEffect(() => {
    if (!exploreOpen) return;
    const close = (e: PointerEvent) => {
      if (!exploreRef.current?.contains(e.target as Node)) setExploreOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setExploreOpen(false);
    window.addEventListener('pointerdown', close);
    window.addEventListener('keydown', esc);
    return () => {
      window.removeEventListener('pointerdown', close);
      window.removeEventListener('keydown', esc);
    };
  }, [exploreOpen]);

  const go = (target: Page) => {
    setExploreOpen(false);
    setMobileOpen(false);
    onNavigate(target);
  };

  const navButton = (target: Page | 'explore', label: string, active: boolean, extra?: React.ReactNode) => (
    <button
      type="button"
      onClick={() => (target === 'explore' ? setExploreOpen((v) => !v) : go(target))}
      aria-expanded={target === 'explore' ? exploreOpen : undefined}
      aria-haspopup={target === 'explore' ? 'menu' : undefined}
      aria-current={active ? 'page' : undefined}
      className={`relative flex h-full items-center gap-1 px-1 text-[15px] transition ${active ? 'font-semibold text-[#1E3443]' : 'text-[#5C5248] hover:text-[#1E3443]'}`}
    >
      {label}
      {extra}
      {active && (
        <span className="absolute inset-x-[-8px] bottom-0 flex flex-col items-center" aria-hidden="true">
          <Ornament className="mb-0.5 size-2.5 text-[#C4553F]" />
          <span className="h-[2px] w-full rounded-full bg-[#1E3443]" />
        </span>
      )}
    </button>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-[#E8DFD3]/80 bg-[#FBF7F3]/85 backdrop-blur-md">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-8">
        <button type="button" onClick={() => go('home')} className="flex items-center gap-3 text-left" aria-label="Vstyle — Trang chủ">
          <span className="grid size-11 place-items-center rounded-full bg-[#1E3443] font-serif text-xl font-bold text-[#FFFFFF] shadow-sm">V</span>
          <span className="font-serif text-[28px] font-bold leading-none tracking-tight text-[#1E3443]">Vstyle</span>
          <span className="ml-1 hidden h-9 w-px bg-[#D8CCBA] lg:block" aria-hidden="true" />
          <span className="hidden text-xs leading-snug text-[#5C5248] lg:block">
            Việt phục Remix
            <span className="block text-[#7A6F66]">Bản sắc Việt, vừa với mọi cơ thể</span>
          </span>
        </button>

        <nav aria-label="Điều hướng chính" className="hidden h-full items-stretch gap-8 md:flex">
          {navButton('home', 'Trang chủ', page === 'home')}
          <div ref={exploreRef} className="relative flex">
            {navButton('explore', 'Khám phá', exploreActive, <ChevronDown className={`size-4 transition ${exploreOpen ? 'rotate-180' : ''}`} aria-hidden="true" />)}
            {exploreOpen && (
              <div role="menu" className="absolute left-1/2 top-[64px] w-80 -translate-x-1/2 space-y-1 rounded-2xl border border-[#E8DFD3] bg-[#FFFFFF] p-2 shadow-[0_18px_40px_-18px_rgba(30,52,67,0.35)] animate-rise">
                {EXPLORE_ITEMS.map((item) => (
                  <button key={item.page} type="button" role="menuitem" onClick={() => go(item.page)} className={`press flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition hover:bg-[#FAF6F0] ${page === item.page ? 'bg-[#FAF6F0]' : ''}`}>
                    <span className={`grid size-10 place-items-center rounded-full ${item.tint}`}><item.icon className="size-5" aria-hidden="true" /></span>
                    <span>
                      <span className="block text-sm font-semibold text-[#1E3443]">{item.label}</span>
                      <span className="block text-xs text-[#7A6F66]">{item.desc}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {navButton('knowledge', 'Kiến thức', page === 'knowledge')}
          {navButton('lookbook', 'Lookbook', page === 'lookbook', lookbookCount > 0 ? (
            <span className="ml-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#1E3443] px-1 text-[11px] font-bold text-[#FFFFFF]">{lookbookCount}</span>
          ) : undefined)}
        </nav>

        <div className="flex items-center gap-2">
          {onOpenSearch && (
            <button type="button" onClick={onOpenSearch} aria-label="Tìm hiểu các loại áo" className="press grid size-10 place-items-center rounded-full border border-[#E8DFD3] bg-[#FFFFFF] text-[#1E3443] shadow-2xs hover:bg-[#FAF6F0]">
              <Search className="size-4" aria-hidden="true" />
            </button>
          )}
          <AccessibilityMenu />
          <button type="button" onClick={() => go('studio')} className="press hidden min-h-10 items-center rounded-full border border-[#1E3443]/80 bg-[#FFFFFF] px-5 text-sm font-semibold text-[#1E3443] hover:bg-[#FAF6F0] lg:inline-flex">
            Phối ngay
          </button>
          <button type="button" onClick={() => setMobileOpen((v) => !v)} aria-label="Mở menu" aria-expanded={mobileOpen} className="press grid size-10 place-items-center rounded-full border border-[#E8DFD3] bg-[#FFFFFF] text-[#1E3443] md:hidden">
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav aria-label="Menu di động" className="space-y-1 border-t border-[#E8DFD3] bg-[#FBF7F3] px-4 py-3 md:hidden">
          {([['home', 'Trang chủ']] as const).map(([p, label]) => (
            <button key={p} type="button" onClick={() => go(p)} className={`press block w-full rounded-xl px-3 py-3 text-left text-base ${page === p ? 'bg-[#FFFFFF] font-semibold text-[#1E3443]' : 'text-[#5C5248]'}`}>{label}</button>
          ))}
          <p className="px-3 pt-2 text-xs font-semibold uppercase tracking-wider text-[#C4553F]">Khám phá</p>
          {EXPLORE_ITEMS.map((item) => (
            <button key={item.page} type="button" onClick={() => go(item.page)} className={`press flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left ${page === item.page ? 'bg-[#FFFFFF]' : ''}`}>
              <span className={`grid size-9 place-items-center rounded-full ${item.tint}`}><item.icon className="size-4" aria-hidden="true" /></span>
              <span className="text-base text-[#1E3443]">{item.label}</span>
            </button>
          ))}
          {([['knowledge', 'Kiến thức'], ['lookbook', `Lookbook${lookbookCount ? ` (${lookbookCount})` : ''}`]] as const).map(([p, label]) => (
            <button key={p} type="button" onClick={() => go(p)} className={`press block w-full rounded-xl px-3 py-3 text-left text-base ${page === p ? 'bg-[#FFFFFF] font-semibold text-[#1E3443]' : 'text-[#5C5248]'}`}>{label}</button>
          ))}
        </nav>
      )}
    </header>
  );
};
