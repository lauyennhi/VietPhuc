import React, { useRef } from 'react';
import type { GeminiVisionResponse } from '../types/gemini';
import { getApprovedGarments, getEventById } from '../lib/dal';
import { styleLabel } from '../lib/styles';

interface PhotoInspirationCardProps {
  previewUrl: string | null;
  analysis: GeminiVisionResponse | null;
  isAnalyzing: boolean;
  error: string | null;
  consentForRender: boolean;
  onPickPhoto: (file: File) => void;
  onAnalyze: () => void;
  onClear: () => void;
  onConsentChange: (value: boolean) => void;
  onApplyMatch: (garmentId: string, colorHex: string) => void;
  onApplyContext: (styleId: string | null, eventId: string | null) => void;
}

const garmentNames = new Map(getApprovedGarments().map((garment) => [garment.id, garment.name]));

export const PhotoInspirationCard: React.FC<PhotoInspirationCardProps> = ({
  previewUrl,
  analysis,
  isAnalyzing,
  error,
  consentForRender,
  onPickPhoto,
  onAnalyze,
  onClear,
  onConsentChange,
  onApplyMatch,
  onApplyContext,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <section aria-labelledby="photo-heading" className="rounded-[28px] border border-[#E6DCCD] bg-[#FFFFFF] p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="photo-heading" className="font-serif text-lg font-bold text-[#1F1B18]">Ảnh cảm hứng</h2>
          <p className="mt-1 max-w-prose text-xs leading-relaxed text-[#736960]">
            Tải ảnh vải, bộ đồ bạn thích hoặc ảnh của chính bạn. Gemini đọc bảng màu và gợi ý Việt phục hợp gu. Vstyle không bình luận về cơ thể hay khuôn mặt.
          </p>
        </div>
        <input
          aria-label="Tải ảnh cảm hứng"
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onPickPhoto(file);
            event.target.value = '';
          }}
        />
      </div>

      {!previewUrl ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="press mt-2 flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#E6DCCD] bg-[#FBF8F3] px-4 py-8 text-xs text-[#736960] hover:border-[#1F1B18] hover:text-[#1F1B18] transition"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="size-8 text-[#736960]" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="11" r="2" /><path d="M21 17l-5-5-6 6" /></svg>
          <span className="font-semibold text-[#1F1B18]">Chọn ảnh tải lên</span>
          <span>(JPG, PNG, WEBP — tối đa 12 MB)</span>
        </button>
      ) : (
        <div className="mt-2 grid gap-4 sm:grid-cols-[140px_1fr]">
          <div className="space-y-2">
            <img src={previewUrl} alt="Ảnh cảm hứng bạn đã tải lên" className="aspect-[3/4] w-full rounded-2xl border border-[#E6DCCD] object-cover shadow-2xs" />
            <div className="flex gap-2">
              <button type="button" onClick={() => inputRef.current?.click()} className="press min-h-9 flex-1 rounded-xl border border-[#E6DCCD] bg-[#FFFFFF] text-xs font-semibold text-[#1F1B18] hover:bg-[#F1EADF] transition">Đổi ảnh</button>
              <button type="button" onClick={onClear} className="press min-h-9 flex-1 rounded-xl border border-[#F0CDCB] bg-[#F9EBEA] text-xs font-semibold text-[#8B1E2B] hover:bg-[#F0CDCB] transition">Xóa</button>
            </div>
          </div>

          <div className="min-w-0 space-y-3">
            {!analysis && !isAnalyzing && (
              <button
                type="button"
                onClick={onAnalyze}
                className="press inline-flex min-h-[44px] items-center gap-2 rounded-2xl bg-[#1F1B18] px-5 text-xs font-bold text-[#FFFFFF] hover:bg-[#38322D] transition shadow-xs"
              >
                Phân tích bằng Gemini →
              </button>
            )}
            {isAnalyzing && (
              <div role="status" className="space-y-2">
                <p className="text-xs font-medium text-[#1F1B18]">Gemini đang đọc màu sắc và chất liệu…</p>
                <div className="h-3 w-3/4 rounded-lg bg-[#E6DCCD]/40 animate-pulse" />
                <div className="h-3 w-1/2 rounded-lg bg-[#E6DCCD]/40 animate-pulse" />
                <div className="flex gap-2 pt-1">{[0, 1, 2, 3].map((index) => <div key={index} className="size-8 rounded-full bg-[#E6DCCD]/50 animate-pulse" />)}</div>
              </div>
            )}
            {error && <p role="alert" className="text-xs text-[#8B1E2B] bg-[#F9EBEA] p-3 rounded-xl border border-[#F0CDCB]">{error}</p>}

            {analysis && (
              <div className="space-y-3 animate-rise">
                <p className="text-xs leading-relaxed text-[#1F1B18] bg-[#FBF8F3] p-3.5 rounded-2xl border border-[#E6DCCD]">{analysis.summary}</p>
                {analysis.dominantColors.length > 0 && (
                  <ul aria-label="Bảng màu từ ảnh" className="flex flex-wrap gap-2">
                    {analysis.dominantColors.map((color) => (
                      <li key={`${color.hex}-${color.name}`} className="flex items-center gap-2 rounded-full border border-[#E6DCCD] bg-[#FFFFFF] py-1 pl-1 pr-3 text-xs text-[#1F1B18] shadow-2xs">
                        <span aria-hidden="true" className="size-5 rounded-full border border-[#E6DCCD]" style={{ backgroundColor: color.hex }} />
                        <span className="font-medium">{color.name}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {analysis.detectedItems.length > 0 && (
                  <p className="text-xs text-[#736960]">Nhận ra: {analysis.detectedItems.join(' · ')}</p>
                )}

                {analysis.colorMatches.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-[#1F1B18]">Màu gần nhất trong bảng màu Việt phục đã duyệt</p>
                    <ul className="space-y-2">
                      {analysis.colorMatches.map((match) => (
                        <li key={`${match.garmentId}-${match.colorHex}`} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[#E6DCCD] bg-[#FBF8F3] p-3">
                          <span className="flex items-center gap-2 text-xs text-[#1F1B18]">
                            <span aria-hidden="true" className="size-5 rounded-full border border-[#E6DCCD]" style={{ backgroundColor: match.sourceHex }} />
                            <span aria-hidden="true" className="text-[#736960]">→</span>
                            <span aria-hidden="true" className="size-5 rounded-full border border-[#E6DCCD]" style={{ backgroundColor: match.colorHex }} />
                            <span><strong className="font-semibold text-[#1F1B18]">{match.colorName}</strong> · {garmentNames.get(match.garmentId || '') || 'Việt phục'}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => onApplyMatch(match.garmentId || '', match.colorHex || match.hex)}
                            className="press min-h-[34px] rounded-xl bg-[#FFFFFF] border border-[#E6DCCD] px-3 text-xs font-bold text-[#1F1B18] hover:bg-[#F1EADF] transition"
                          >
                            Dùng màu này
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {(analysis.styleId || analysis.eventId) && (
                  <button
                    type="button"
                    onClick={() => onApplyContext(analysis.styleId ?? null, analysis.eventId ?? null)}
                    className="press min-h-9 rounded-xl border border-[#E6DCCD] bg-[#FFFFFF] px-3.5 text-xs font-semibold text-[#1F1B18] hover:bg-[#F1EADF] transition"
                  >
                    Áp dụng gợi ý{analysis.styleId ? ` phong cách ${styleLabel(analysis.styleId)}` : ''}{analysis.eventId ? ` · ${getEventById(analysis.eventId)?.name ?? ''}` : ''}
                  </button>
                )}
                {analysis.usedFallback && (
                  <p className="text-xs text-[#736960] italic">Gemini chưa sẵn sàng nên chưa phân tích được ảnh. Bạn vẫn có thể chọn thủ công.</p>
                )}
              </div>
            )}

            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[#E6DCCD] bg-[#FBF8F3] p-3 text-xs leading-relaxed text-[#736960]">
              <input
                type="checkbox"
                checked={consentForRender}
                onChange={(event) => onConsentChange(event.target.checked)}
                className="mt-0.5 size-4 accent-[#1F1B18]"
              />
              <span>
                Cho phép dùng ảnh này làm người mẫu khi tạo <strong className="text-[#1F1B18]">ảnh AI thử phối</strong>. Ảnh chỉ gửi tới Gemini khi bạn bấm tạo ảnh, không lưu trên máy chủ Vstyle.
              </span>
            </label>
          </div>
        </div>
      )}
    </section>
  );
};
