import React from 'react';
import type { GeminiRenderResponse } from '../types/gemini';

export interface RenderState {
  status: 'idle' | 'loading' | 'ready' | 'error';
  result?: GeminiRenderResponse;
  error?: string;
}

interface AiRenderPanelProps {
  state: RenderState;
  garmentName: string;
  canUseReference: boolean;
  useReference: boolean;
  imageRenderAvailable: boolean | null;
  onToggleReference: (value: boolean) => void;
  onGenerate: () => void;
}

export const AiRenderPanel: React.FC<AiRenderPanelProps> = ({
  state,
  garmentName,
  canUseReference,
  useReference,
  imageRenderAvailable,
  onToggleReference,
  onGenerate,
}) => {
  const download = () => {
    if (!state.result) return;
    const link = document.createElement('a');
    link.href = state.result.imageDataUrl;
    const extension = state.result.imageDataUrl.startsWith('data:image/png') ? 'png' : 'jpg';
    link.download = `Vstyle_AI_${garmentName.replace(/\s+/g, '_')}.${extension}`;
    link.click();
  };

  return (
    <div className="overflow-hidden rounded-[28px] border border-[#E6DCCD] bg-[#FFFFFF] shadow-xs">
      <div className="relative aspect-[3/4] w-full bg-[#FBF8F3]">
        {state.status === 'ready' && state.result ? (
          <img
            src={state.result.imageDataUrl}
            alt={`Ảnh minh họa do Gemini tạo: ${garmentName}`}
            className="h-full w-full object-cover animate-rise"
          />
        ) : state.status === 'loading' ? (
          <div role="status" className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
            <span className="relative size-9 animate-spin rounded-full border-3 border-[#E6DCCD] border-t-[#1F1B18]" aria-hidden="true" />
            <p className="relative text-sm font-semibold text-[#1F1B18]">Gemini đang dựng ảnh theo dữ liệu nguồn tham khảo…</p>
            <p className="relative text-xs text-[#736960]">Thường mất 10–30 giây</p>
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
            <svg aria-hidden="true" viewBox="0 0 48 48" className="size-12 text-[#8A5E17]" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M24 5l3.5 9.5L37 18l-9.5 3.5L24 31l-3.5-9.5L11 18l9.5-3.5z" /><path d="M37 30l1.6 4.4L43 36l-4.4 1.6L37 42l-1.6-4.4L31 36l4.4-1.6z" /></svg>
            <div>
              <p className="font-serif text-lg font-bold text-[#1F1B18]">Ảnh AI bản phối</p>
              <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-[#736960]">
                Gemini vẽ ảnh chân dung từ đúng dữ liệu y phục, màu và phụ kiện bạn chọn, kèm các quy tắc không được sai (vạt hữu nhậm, kết cấu thân áo…).
              </p>
            </div>
            {state.status === 'error' && <p role="alert" className="max-w-xs text-xs text-[#8B1E2B] bg-[#F9EBEA] p-2.5 rounded-xl border border-[#F0CDCB]">{state.error}</p>}
            {imageRenderAvailable === false && (
              <p className="max-w-xs text-xs text-[#736960]">Máy chủ chưa cấu hình khóa Gemini — bạn vẫn xem được bản mockup vector.</p>
            )}
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full border border-[#E6DCCD] bg-[#FFFFFF]/90 px-3 py-1 text-[11px] font-semibold text-[#1F1B18] shadow-xs backdrop-blur-xs">
          Ảnh minh họa AI · không phải ảnh thật
        </span>
      </div>

      <div className="space-y-3 border-t border-[#E6DCCD] p-5">
        {canUseReference && (
          <label className="flex cursor-pointer items-center gap-3 text-xs text-[#1F1B18]">
            <input type="checkbox" checked={useReference} onChange={(event) => onToggleReference(event.target.checked)} className="size-4 accent-[#1F1B18]" />
            Dùng ảnh của tôi làm người mẫu (thử phối)
          </label>
        )}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onGenerate}
            disabled={state.status === 'loading'}
            className="press inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-2xl bg-[#1F1B18] px-4 text-xs font-bold text-[#FFFFFF] hover:bg-[#38322D] transition disabled:opacity-40 shadow-xs"
          >
            {state.status === 'ready' ? 'Tạo ảnh khác' : state.status === 'loading' ? 'Đang tạo…' : 'Tạo ảnh AI với Gemini →'}
          </button>
          {state.status === 'ready' && (
            <button
              type="button"
              onClick={download}
              className="press min-h-[44px] rounded-2xl border border-[#E6DCCD] bg-[#FFFFFF] px-4 text-xs font-bold text-[#1F1B18] hover:bg-[#F1EADF] transition"
            >
              Tải ảnh
            </button>
          )}
        </div>

        {state.status === 'ready' && state.result && (
          <details className="rounded-2xl border border-[#E6DCCD] bg-[#FBF8F3] p-3.5 text-xs text-[#1F1B18]" open>
            <summary className="cursor-pointer font-bold text-[#1F1B18]">Đối chiếu ảnh với quy chuẩn tham khảo</summary>
            <p className="mt-2 text-[#736960] text-[11px]">AI có thể vẽ sai chi tiết. Hãy kiểm tra các điểm dưới đây trước khi chia sẻ; thẻ Chuẩn văn hóa mới là kết quả chính thức.</p>
            <ul className="mt-2 space-y-1 text-[#736960]">
              {(state.result.checklist ?? []).map((item: string, index: number) => (
                <li key={index} className="flex gap-2">
                  <span className="text-[#4F7350] font-bold">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </div>
  );
};
