/**
 * "Nhận xét & đánh giá" — shown after every creation flow (AI, Studio, Adaptive).
 * Deterministic scores + optional Gemini review + the user's own rating, then
 * save / draft / post / share.
 */

import React, { useEffect, useState } from 'react';
import { FilePen, Heart, Send, Share2, Sparkles, Star } from 'lucide-react';
import type { Outfit } from '../types/domain';
import type { GeminiExplainResponse } from '../types/gemini';
import { lookToOutfit, type Look, type LookEvaluation } from '../lib/look';
import { explainOutfit } from '../lib/gemini/client';
import { getEventById } from '../lib/dal';
import { saveOutfitToLookbook } from '../lib/storage/lookbook';

interface OutfitReviewProps {
  look: Look;
  evaluation: LookEvaluation;
  showToast: (message: string) => void;
  onSaved?: () => void;
  onPost: (outfit: Outfit) => void;
  onShare: (outfit: Outfit) => void;
}

const QUICK_TAGS = ['Ưng ý', 'Hợp dịp', 'Màu đẹp', 'Muốn thử thêm', 'Dễ mặc'];

const ScoreRing: React.FC<{ value: number; label: string; hint: string; color: string }> = ({ value, label, hint, color }) => {
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <div className="flex items-center gap-3">
      <svg viewBox="0 0 64 64" className="size-16 shrink-0 -rotate-90" aria-hidden="true">
        <circle cx="32" cy="32" r={r} fill="none" stroke="#EFE7DA" strokeWidth="6" />
        <circle cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} />
      </svg>
      <div>
        <p className="font-serif text-xl font-bold leading-none text-[#1E3443]">{value}<span className="text-xs text-[#8A8075]">/100</span></p>
        <p className="mt-1 text-xs font-semibold text-[#1E3443]">{label}</p>
        <p className="text-[11px] text-[#7A6F66]">{hint}</p>
      </div>
    </div>
  );
};

export const OutfitReview: React.FC<OutfitReviewProps> = ({ look, evaluation, showToast, onSaved, onPost, onShare }) => {
  const [rating, setRating] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [ai, setAi] = useState<GeminiExplainResponse | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const { culture, style, harmony, garment, accessories } = evaluation;
  const signature = `${look.garmentId}|${look.primaryColor}|${look.pantColor}|${look.accessoryIds.join(',')}|${look.eventId}|${look.styleId}`;

  useEffect(() => setAi(null), [signature]);

  const buildOutfit = (status: 'SAVED' | 'DRAFT'): Outfit => lookToOutfit(look, evaluation, {
    id: `${look.origin.toLowerCase()}-${Date.now()}`,
    status,
    rating: rating || undefined,
    reviewTags: tags,
    userNote: note.trim() || undefined,
    explanation: ai && !ai.usedFallback ? ai.editorialReview : look.concept,
  });

  const save = (status: 'SAVED' | 'DRAFT') => {
    const ok = saveOutfitToLookbook(buildOutfit(status));
    showToast(ok ? (status === 'SAVED' ? 'Đã lưu vào Lookbook.' : 'Đã lưu bản nháp.') : 'Chưa lưu được — bộ nhớ trình duyệt bị chặn.');
    if (ok) onSaved?.();
  };

  const askAi = async () => {
    setAiLoading(true);
    try {
      const event = getEventById(look.eventId);
      setAi(await explainOutfit({
        garment,
        cultureCheck: culture,
        eventId: look.eventId,
        eventName: event?.name ?? 'dịp của bạn',
        styleVibe: look.styleId,
        primaryColor: look.primaryColor,
        accessoryIds: look.accessoryIds,
        accessoryNames: accessories.map((a) => a.name),
        adaptiveNeedCodes: look.needCodes,
      }));
    } finally {
      setAiLoading(false);
    }
  };

  const cultureHint = culture.status === 'KEEP' ? 'Đúng điển chế' : culture.status === 'CONSIDER' ? 'Nên cân nhắc' : 'Có điểm sai lệch';

  return (
    <section className="space-y-5 rounded-[28px] border border-[#E8DFD3] bg-[#FFFFFF] p-5 shadow-[0_6px_24px_-12px_rgba(30,52,67,0.18)] sm:p-6" aria-labelledby="review-title">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h3 id="review-title" className="font-serif text-2xl font-bold text-[#1E3443]">Nhận xét & đánh giá</h3>
        <span className="text-xs text-[#7A6F66]">Chấm tự động theo quy tắc văn hóa có nguồn</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <ScoreRing value={culture.score} label="Chuẩn văn hóa" hint={cultureHint} color={culture.status === 'KEEP' ? '#4F7350' : culture.status === 'CONSIDER' ? '#B7791F' : '#A33A2B'} />
        <ScoreRing value={style.score} label="Hợp dịp & gu" hint={style.label} color="#1E3443" />
        <ScoreRing value={harmony.score} label="Hài hòa màu" hint={harmony.relationLabel ?? 'Phối màu'} color="#C4553F" />
      </div>

      {culture.reasons.length > 0 && (
        <ul className="space-y-1.5 rounded-2xl bg-[#FAF6F0] p-4 text-xs leading-relaxed text-[#4A423B]">
          {culture.reasons.slice(0, 3).map((reason) => (
            <li key={reason} className="flex gap-2"><span className={culture.status === 'KEEP' ? 'text-[#4F7350]' : 'text-[#B7791F]'} aria-hidden="true">●</span>{reason}</li>
          ))}
        </ul>
      )}

      <div className="rounded-2xl border border-[#E8DFD3] p-4">
        {!ai ? (
          <button type="button" onClick={() => void askAi()} disabled={aiLoading} className="press inline-flex items-center gap-2 text-sm font-semibold text-[#1E3443] disabled:opacity-50">
            <Sparkles className="size-4 text-[#C4553F]" aria-hidden="true" />
            {aiLoading ? 'AI đang nhận xét…' : 'Nhờ AI stylist nhận xét bản phối'}
          </button>
        ) : (
          <div className="space-y-2 animate-rise">
            <p className="font-serif text-lg font-bold italic text-[#1E3443]">“{ai.headline}”</p>
            <p className="text-sm leading-relaxed text-[#4A423B]">{ai.editorialReview}</p>
            {(ai.adviceForWearing ?? ai.tips ?? []).length > 0 && (
              <ul className="space-y-1 text-xs text-[#4A423B]">
                {(ai.adviceForWearing ?? ai.tips ?? []).slice(0, 3).map((tip) => <li key={tip}>✦ {tip}</li>)}
              </ul>
            )}
            <p className="text-[11px] italic text-[#8A8075]">{ai.usedFallback ? 'Nhận xét mẫu (Gemini chưa bật).' : 'Nhận xét bởi Gemini, dựa trên kết quả văn hóa ở trên.'}</p>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-semibold text-[#1E3443]">Bạn chấm:</span>
          <div className="flex" role="radiogroup" aria-label="Chấm điểm bản phối">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} sao`} onClick={() => setRating(n)} className="press p-0.5">
                <Star className={`size-6 ${n <= rating ? 'fill-[#D4A338] text-[#D4A338]' : 'text-[#D8CCBA]'}`} aria-hidden="true" />
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_TAGS.map((tag) => {
            const on = tags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                aria-pressed={on}
                onClick={() => setTags((t) => (on ? t.filter((x) => x !== tag) : [...t, tag]))}
                className={`press rounded-full border px-3 py-1 text-xs font-medium transition ${on ? 'border-[#1E3443] bg-[#1E3443] text-[#FFFFFF]' : 'border-[#E8DFD3] text-[#5C5248] hover:bg-[#FAF6F0]'}`}
              >
                {tag}
              </button>
            );
          })}
        </div>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, 200))}
          placeholder="Ghi chú cho bản thân (tùy chọn)…"
          className="w-full rounded-xl border border-[#E8DFD3] bg-[#FAF6F0] px-3.5 py-2.5 text-sm text-[#1E3443] outline-none focus:border-[#1E3443]"
          aria-label="Ghi chú"
        />
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <button type="button" onClick={() => save('SAVED')} className="press inline-flex min-h-11 items-center justify-center gap-1.5 rounded-2xl bg-[#1E3443] px-3 text-sm font-semibold text-[#FFFFFF] hover:bg-[#2A4658]">
          <Heart className="size-4" aria-hidden="true" /> Lưu Lookbook
        </button>
        <button type="button" onClick={() => save('DRAFT')} className="press inline-flex min-h-11 items-center justify-center gap-1.5 rounded-2xl border border-[#E8DFD3] px-3 text-sm font-semibold text-[#1E3443] hover:bg-[#FAF6F0]">
          <FilePen className="size-4" aria-hidden="true" /> Lưu nháp
        </button>
        <button type="button" onClick={() => onPost(buildOutfit('SAVED'))} className="press inline-flex min-h-11 items-center justify-center gap-1.5 rounded-2xl border border-[#E8DFD3] px-3 text-sm font-semibold text-[#1E3443] hover:bg-[#FAF6F0]">
          <Send className="size-4" aria-hidden="true" /> Đăng bài
        </button>
        <button type="button" onClick={() => onShare(buildOutfit('SAVED'))} className="press inline-flex min-h-11 items-center justify-center gap-1.5 rounded-2xl border border-[#E8DFD3] px-3 text-sm font-semibold text-[#1E3443] hover:bg-[#FAF6F0]">
          <Share2 className="size-4" aria-hidden="true" /> Chia sẻ
        </button>
      </div>
    </section>
  );
};
