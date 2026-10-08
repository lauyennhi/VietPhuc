import { AccessibilityMenu } from './AccessibilityMenu';
import React, { useState } from 'react';

export type MainNavTab = 'HOME' | 'DISCOVERY' | 'LOOKBOOK';

interface NavbarProps {
  activeTab: MainNavTab;
  onSelectTab: (tab: MainNavTab) => void;
  lookbookCount: number;
  onOpenSearch?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  lookbookCount,
  onOpenSearch,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { id: MainNavTab; label: string }[] = [
    { id: 'HOME', label: 'Trang chủ' },
    { id: 'DISCOVERY', label: 'Khám phá' },
    { id: 'LOOKBOOK', label: 'Lookbook' },
  ];

  return (
    <header className="sticky top-0 z-40 h-[72px] border-b border-[#E6DCCD] bg-[#FBF8F3]/95 backdrop-blur-md transition-colors">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-4 px-5 sm:px-8 lg:px-12">
        {/* Brand Logo in Fraunces */}
        <button
          type="button"
          onClick={() => {
            onSelectTab('HOME');
            setMobileMenuOpen(false);
          }}
          className="flex items-center gap-3.5 py-1 text-left min-h-[44px] focus-visible:outline-[#1F1B18]"
          aria-label="Vstyle — Về trang chủ"
        >
          <span
            aria-hidden="true"
            className="grid size-11 place-items-center rounded-full bg-[#16222E] font-serif text-2xl font-bold text-[#FAF7F2] shadow-sm ring-2 ring-[#EAE2D5]"
          >
            V
          </span>
          <div className="leading-tight">
            <span className="block font-serif text-2xl font-bold tracking-tight text-[#16222E]">
              Vstyle
            </span>
            <div className="hidden sm:block text-[11px] font-medium text-[#736960] space-y-0.5">
              <span className="block text-[#16222E] font-semibold text-[10px]">Việt phục Remix</span>
              <span className="block text-[10px] text-[#736960]">— 🌿 Ứng dụng bản sắc, vừa mới cơ thể</span>
            </div>
          </div>
        </button>

        {/* Desktop Navigation */}
        <nav aria-label="Điều hướng chính" className="hidden md:flex items-center gap-6 h-full">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`relative flex flex-col items-center justify-center h-full px-2 text-sm font-semibold transition min-h-[44px] focus-visible:outline-[#1F1B18] ${
                  isActive
                    ? 'text-[#16222E] font-bold'
                    : 'text-[#736960] hover:text-[#16222E]'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className={isActive ? 'font-serif text-base' : ''}>{item.label}</span>
                  {item.id === 'LOOKBOOK' && lookbookCount > 0 && (
                    <span
                      className="grid min-w-4.5 h-4.5 place-items-center rounded-full bg-[#16222E] px-1 text-[10px] font-bold text-[#FFFFFF] tabular"
                      aria-label={`${lookbookCount} bản phối đã lưu`}
                    >
                      {lookbookCount}
                    </span>
                  )}
                </div>

                {/* Classical Vietnamese Ornament underline on active tab */}
                {isActive && (
                  <div className="absolute bottom-2 flex items-center justify-center w-full">
                    <div className="h-[2px] w-12 bg-[#16222E] rounded-full relative">
                      <span className="absolute left-1/2 -translate-x-1/2 -top-1.5 text-[8px] text-[#C5A265] leading-none">
                        ✦
                      </span>
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Search Circular Button */}
          {onOpenSearch && (
            <button
              type="button"
              onClick={onOpenSearch}
              className="press grid size-10 place-items-center rounded-full border border-[#E6DCCD] bg-[#FFFFFF]/80 hover:bg-[#FFFFFF] text-[#736960] hover:text-[#16222E] hover:border-[#D8CCBA] transition shadow-2xs"
              aria-label="Tìm kiếm y phục hoặc bối cảnh"
              title="Tìm kiếm"
            >
              <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </button>
          )}

          {/* Lookbook Button Pill */}
          <button
            type="button"
            onClick={() => onSelectTab('LOOKBOOK')}
            className={`press min-h-[40px] hidden sm:flex items-center gap-2 rounded-full px-4 text-xs font-bold border transition ${
              activeTab === 'LOOKBOOK'
                ? 'bg-[#16222E] text-[#FFFFFF] border-[#16222E] shadow-sm'
                : 'bg-[#FFFFFF] text-[#16222E] border-[#E6DCCD] hover:bg-[#F5EFE6]'
            }`}
          >
            <span>Lookbook</span>
            {lookbookCount > 0 && (
              <span className="size-4.5 rounded-full bg-[#16222E] text-[#FFFFFF] text-[10px] font-bold inline-flex items-center justify-center">
                {lookbookCount}
              </span>
            )}
          </button>

          {/* Accessibility preferences */}
          <AccessibilityMenu />

          {/* Mobile Menu Hamburger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="press md:hidden grid size-10 place-items-center rounded-full border border-[#E6DCCD] bg-[#FFFFFF] text-[#16222E]"
            aria-label="Mở menu"
          >
            {mobileMenuOpen ? (
              <span className="text-xl font-bold">✕</span>
            ) : (
              <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[#E6DCCD] bg-[#FBF8F3] px-5 py-3 shadow-lg space-y-1 animate-fadeIn">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-4 py-3 rounded-2xl text-sm font-semibold transition flex items-center justify-between min-h-[44px] ${
                  isActive
                    ? 'bg-[#F1EADF] text-[#1F1B18] font-bold'
                    : 'text-[#736960] hover:bg-[#FFFFFF] hover:text-[#1F1B18]'
                }`}
              >
                <span>{item.label}</span>
                {item.id === 'LOOKBOOK' && (
                  <span className="rounded-full bg-[#1F1B18] px-2 py-0.5 text-xs text-[#FFFFFF] font-bold">
                    {lookbookCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
