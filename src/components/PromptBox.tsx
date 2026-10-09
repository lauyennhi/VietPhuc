/**
 * The "Kể dịp của bạn" prompt box (Home hero and Studio › AI tạo).
 */

import React, { useRef } from 'react';
import { ArrowRight, ImagePlus, Mic, Sparkles, X } from 'lucide-react';
import { useVoiceInput } from '../lib/useVoiceInput';

interface PromptBoxProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  busy?: boolean;
  photoPreviewUrl?: string | null;
  onPickPhoto?: (file: File) => void;
  onClearPhoto?: () => void;
  placeholder?: string;
  submitLabel?: string;
  autoFocus?: boolean;
}

export const PromptBox: React.FC<PromptBoxProps> = ({
  value,
  onChange,
  onSubmit,
  busy = false,
  photoPreviewUrl,
  onPickPhoto,
  onClearPhoto,
  placeholder = 'Ví dụ: Chụp kỷ yếu ở Hội An, trời nắng, thích màu xanh, muốn hiện đại nhưng không mất chất…',
  submitLabel = 'Phối giúp mình',
  autoFocus,
}) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const voice = useVoiceInput(value, onChange);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (value.trim() && !busy) onSubmit();
      }}
      className="rounded-[22px] border border-[#E8DFD3] bg-[#FFFFFF] p-3 shadow-[0_10px_30px_-18px_rgba(30,52,67,0.35)] transition focus-within:border-[#1E3443]/40 sm:p-4"
    >
      <div className="flex items-start gap-3 px-1">
        <Sparkles className="mt-1 size-5 shrink-0 text-[#1E3443]" aria-hidden="true" />
        <textarea
          rows={2}
          value={value}
          autoFocus={autoFocus}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (value.trim() && !busy) onSubmit();
            }
          }}
          placeholder={placeholder}
          aria-label="Mô tả dịp và gu của bạn"
          className="w-full resize-none bg-transparent text-[15px] leading-relaxed text-[#1E3443] outline-none placeholder:text-[#9A9089]"
        />
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-[#F0E9DF] pt-3">
        <div className="flex flex-wrap items-center gap-1">
          {onPickPhoto && (
            <>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onPickPhoto(file);
                  e.target.value = '';
                }}
              />
              {photoPreviewUrl ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-[#E8DFD3] py-1 pl-1 pr-2 text-xs text-[#1E3443]">
                  <img src={photoPreviewUrl} alt="Ảnh cảm hứng" className="size-6 rounded-full object-cover" />
                  Ảnh cảm hứng
                  {onClearPhoto && (
                    <button type="button" onClick={onClearPhoto} aria-label="Bỏ ảnh" className="press text-[#7A6F66] hover:text-[#1E3443]"><X className="size-3.5" /></button>
                  )}
                </span>
              ) : (
                <button type="button" onClick={() => fileRef.current?.click()} className="press inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-[#4A423B] hover:bg-[#FAF6F0]">
                  <ImagePlus className="size-4" aria-hidden="true" /> Thêm ảnh
                </button>
              )}
            </>
          )}
          {voice.supported && (
            <button
              type="button"
              onClick={voice.toggle}
              aria-pressed={voice.listening}
              className={`press inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition ${voice.listening ? 'bg-[#C4553F] text-[#FFFFFF]' : 'text-[#4A423B] hover:bg-[#FAF6F0]'}`}
            >
              <Mic className="size-4" aria-hidden="true" /> {voice.listening ? 'Đang nghe…' : 'Nói'}
            </button>
          )}
        </div>
        <button
          type="submit"
          disabled={busy || !value.trim()}
          className="press inline-flex min-h-11 items-center gap-2 rounded-full bg-[#1E3443] px-6 text-sm font-semibold text-[#FFFFFF] shadow-sm transition hover:bg-[#2A4658] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? (
            <>
              <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden="true" /> Đang phối…
            </>
          ) : (
            <>
              {submitLabel} <ArrowRight className="size-4" aria-hidden="true" />
            </>
          )}
        </button>
      </div>
    </form>
  );
};
