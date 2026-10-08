import React, { useState } from 'react';
import type { GeminiCaptionResponse, GeminiExplainResponse } from '../types/gemini';

interface AIRecommendationPanelProps {
  explanation: GeminiExplainResponse | null;
  caption: GeminiCaptionResponse | null;
  isLoadingExplain: boolean;
  isLoadingCaption: boolean;
  onRefreshExplain: () => void;
  onRequestCaption: () => void;
}

export const AIRecommendationPanel: React.FC<AIRecommendationPanelProps> = ({
  explanation,
  caption,
  isLoadingExplain,
  isLoadingCaption,
  onRefreshExplain,
  onRequestCaption,
}) => {
  const [copiedCaption, setCopiedCaption] = useState(false);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCaption(true);
      window.setTimeout(() => setCopiedCaption(false), 2000);
    } catch {
      setCopiedCaption(false);
    }
  };

  return (
    <section aria-labelledby="stylist-note-heading" aria-busy={isLoadingExplain} className="rounded-[28px] border border-[#E6DCCD] bg-[#FFFFFF] p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex items-start justify-between gap-3 border-b border-[#E6DCCD] pb-3">
        <div>
          <h3 id="stylist-note-heading" className="font-serif text-lg font-bold text-[#1F1B18]">Lời bình của Gemini Stylist</h3>
          <p className="mt-0.5 text-xs text-[#736960]">Chỉ diễn giải kết quả văn hóa đã kiểm chứng, không thêm sử liệu mới.</p>
        </div>
        <button
          type="button"
          onClick={onRefreshExplain}
          disabled={isLoadingExplain}
          className="press min-h-[36px] shrink-0 rounded-xl border border-[#E6DCCD] bg-[#FBF8F3] px-3.5 text-xs font-semibold text-[#1F1B18] hover:bg-[#F1EADF] disabled:opacity-40 transition"
        >
          {isLoadingExplain ? 'Đang viết…' : 'Viết lại'}
        </button>
      </div>

      <div aria-live="polite">
        {isLoadingExplain && (
          <div role="status" className="space-y-2 py-4">
            <span className="sr-only">Gemini đang viết lời bình…</span>
            <div className="h-5 w-2/3 rounded-lg bg-[#E6DCCD]/40 animate-pulse" />
            <div className="h-3 w-full rounded-lg bg-[#E6DCCD]/30 animate-pulse" />
            <div className="h-3 w-11/12 rounded-lg bg-[#E6DCCD]/30 animate-pulse" />
            <div className="h-3 w-4/5 rounded-lg bg-[#E6DCCD]/30 animate-pulse" />
          </div>
        )}

        {!isLoadingExplain && explanation && (
          <div className="space-y-4 pt-2 text-sm animate-rise">
            <div>
              <p className="font-serif text-xl sm:text-2xl font-bold italic leading-snug text-[#1F1B18]">“{explanation.headline}”</p>
              <p className="mt-2 leading-relaxed text-[#736960] text-xs sm:text-sm">{explanation.editorialReview}</p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-[#CDE0C9] bg-[#E5EDE2] p-3.5">
                <p className="mb-1 text-xs font-bold text-[#4F7350]">Giao hòa bản sắc</p>
                <p className="text-xs leading-relaxed text-[#1F1B18]">{explanation.culturalHarmony}</p>
              </div>
              <div className="rounded-2xl border border-[#E4D1B5] bg-[#F6ECDA] p-3.5">
                <p className="mb-1 text-xs font-bold text-[#8A5E17]">Chất Remix</p>
                <p className="text-xs leading-relaxed text-[#1F1B18]">{explanation.styleRemixVerdict}</p>
              </div>
            </div>
            {explanation.adviceForWearing && explanation.adviceForWearing.length > 0 && (
              <div className="bg-[#FBF8F3] p-4 rounded-2xl border border-[#E6DCCD] space-y-1.5">
                <p className="text-xs font-bold text-[#1F1B18] uppercase tracking-wider font-mono">Mẹo mặc đẹp & đoan trang:</p>
                <ul className="space-y-1.5">
                  {explanation.adviceForWearing.map((advice) => (
                    <li key={advice} className="flex gap-2 text-xs leading-relaxed text-[#736960]">
                      <span aria-hidden="true" className="text-[#8A5E17] font-bold">✦</span>
                      <span>{advice}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {explanation.usedFallback && (
              <p className="text-xs text-[#736960] italic">Lời bình mẫu từ dữ liệu Vstyle (Gemini chưa sẵn sàng).</p>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 space-y-2.5 border-t border-[#E6DCCD] pt-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-bold text-[#1F1B18]">Caption mạng xã hội (Instagram, TikTok)</p>
          <button
            type="button"
            onClick={onRequestCaption}
            disabled={isLoadingCaption}
            className="press min-h-[36px] rounded-xl border border-[#E6DCCD] bg-[#FBF8F3] px-3.5 text-xs font-semibold text-[#1F1B18] hover:bg-[#F1EADF] disabled:opacity-40 transition"
          >
            {isLoadingCaption ? 'Đang viết…' : caption ? 'Viết caption khác' : 'Viết caption'}
          </button>
        </div>
        {caption && (
          <div className="space-y-2.5 rounded-2xl border border-[#E6DCCD] bg-[#FBF8F3] p-4 text-sm animate-rise">
            <p className="text-xs font-bold text-[#8A5E17]">“{caption.shortPunchyHook}”</p>
            <p className="whitespace-pre-line leading-relaxed text-xs text-[#1F1B18]">{caption.instagramCaption}</p>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#E6DCCD] pt-2">
              <span className="font-mono text-[11px] text-[#736960]">{caption.hashtags.join(' ')}</span>
              <button
                type="button"
                onClick={() => handleCopy(`${caption.instagramCaption}\n${caption.hashtags.join(' ')}`)}
                className="press min-h-[34px] rounded-xl bg-[#1F1B18] px-3.5 text-xs font-semibold text-[#FFFFFF] hover:bg-[#38322D] transition shadow-xs"
              >
                {copiedCaption ? '✓ Đã chép' : 'Chép caption'}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
