/**
 * "Hỗ trợ tiếp cận" — per-viewer display preferences (text size, contrast, motion).
 * Preferences are stored in localStorage and applied as data attributes on <html>,
 * which index.css uses to scale text, strengthen contrast and stop animations.
 */

import React, { useEffect, useRef, useState } from 'react';

type TextSize = 'base' | 'lg' | 'xl';

export interface A11yPrefs {
  text: TextSize;
  contrast: boolean;
  reduceMotion: boolean;
}

const KEY = 'vstyle.a11y';
const DEFAULT_PREFS: A11yPrefs = { text: 'base', contrast: false, reduceMotion: false };

export function readA11yPrefs(): A11yPrefs {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
}

export function applyA11yPrefs(prefs: A11yPrefs): void {
  const root = document.documentElement;
  if (prefs.text === 'base') root.removeAttribute('data-text');
  else root.setAttribute('data-text', prefs.text);
  root.toggleAttribute('data-contrast-high', prefs.contrast);
  root.toggleAttribute('data-reduce-motion', prefs.reduceMotion);
}

export const AccessibilityMenu: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState<A11yPrefs>(DEFAULT_PREFS);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => setPrefs(readA11yPrefs()), []);

  useEffect(() => {
    applyA11yPrefs(prefs);
    try {
      window.localStorage.setItem(KEY, JSON.stringify(prefs));
    } catch {
      // storage unavailable: preferences last for this visit only
    }
  }, [prefs]);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: PointerEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const changed = prefs.text !== 'base' || prefs.contrast || prefs.reduceMotion;
  const toggleRow = (label: string, hint: string, value: boolean, onToggle: () => void) => (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={onToggle}
      className="press flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-[#F5EFE6]"
    >
      <span>
        <span className="block text-sm font-semibold text-[#16222E]">{label}</span>
        <span className="block text-[11px] text-[#5C5248]">{hint}</span>
      </span>
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition ${value ? 'bg-[#3D6B35]' : 'bg-[#D8CCBA]'}`} aria-hidden="true">
        <span className={`absolute top-0.5 size-5 rounded-full bg-[#FFFFFF] shadow transition-all ${value ? 'left-[22px]' : 'left-0.5'}`} />
      </span>
    </button>
  );

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Hỗ trợ tiếp cận: cỡ chữ, tương phản, chuyển động"
        title="Hỗ trợ tiếp cận"
        className={`press relative grid size-10 place-items-center rounded-full border transition shadow-2xs ${
          open || changed ? 'border-[#3D6B35] bg-[#EEF4EC] text-[#3D6B35]' : 'border-[#E6DCCD] bg-[#FFFFFF]/80 text-[#5C5248] hover:text-[#16222E]'
        }`}
      >
        <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <circle cx="12" cy="4.5" r="1.8" />
          <path d="M5 8.5l7 1.5 7-1.5M12 10v5m0 0l-3 6m3-6l3 6" />
        </svg>
        {changed && <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full border-2 border-[#FFFFFF] bg-[#3D6B35]" aria-hidden="true" />}
      </button>

      {open && (
        <div role="dialog" aria-label="Hỗ trợ tiếp cận" className="absolute right-0 top-12 z-[60] w-[min(20rem,calc(100vw-2rem))] space-y-1 rounded-2xl border border-[#E6DCCD] bg-[#FFFFFF] p-2 shadow-[0_12px_40px_rgba(22,34,46,0.16)] animate-rise">
          <p className="px-3 pt-2 font-mono text-[10px] font-bold uppercase tracking-wider text-[#3D6B35]">Hỗ trợ tiếp cận</p>
          <div className="px-3 py-2">
            <p className="text-sm font-semibold text-[#16222E]">Cỡ chữ</p>
            <div className="mt-2 grid grid-cols-3 gap-1.5" role="radiogroup" aria-label="Cỡ chữ">
              {([['base', 'A', 'Chuẩn'], ['lg', 'A+', 'Lớn'], ['xl', 'A++', 'Rất lớn']] as const).map(([value, glyph, label]) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={prefs.text === value}
                  aria-label={label}
                  onClick={() => setPrefs((p) => ({ ...p, text: value }))}
                  className={`press rounded-xl border py-2 font-serif font-bold transition ${
                    prefs.text === value ? 'border-[#16222E] bg-[#16222E] text-[#FFFFFF]' : 'border-[#E6DCCD] text-[#16222E] hover:bg-[#F5EFE6]'
                  } ${value === 'base' ? 'text-sm' : value === 'lg' ? 'text-base' : 'text-lg'}`}
                >
                  {glyph}
                </button>
              ))}
            </div>
          </div>
          {toggleRow('Tương phản cao', 'Chữ đậm màu hơn, viền rõ hơn', prefs.contrast, () => setPrefs((p) => ({ ...p, contrast: !p.contrast })))}
          {toggleRow('Giảm chuyển động', 'Tắt hiệu ứng động và xoay tự động', prefs.reduceMotion, () => setPrefs((p) => ({ ...p, reduceMotion: !p.reduceMotion })))}
          {changed && (
            <button type="button" onClick={() => setPrefs(DEFAULT_PREFS)} className="press w-full rounded-xl px-3 py-2 text-left text-xs font-semibold text-[#8A5E17] hover:bg-[#F5EFE6]">
              ↺ Về mặc định
            </button>
          )}
        </div>
      )}
    </div>
  );
};
