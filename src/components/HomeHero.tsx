/**
 * Vstyle Home Hero Component
 * Recreates the exact high-fashion Vietnamese Heritage-Contemporary design:
 * - Ink-wash watercolor backdrop with lotus leaves, ripples, ancient pagoda silhouette, and blossom branches
 * - Editorial typography with "Việt phục" highlighted in lacquer terracotta red
 * - Clean prompt search capsule with photo attachment & "Phối giúp mình →"
 * - Quick occasion chips (Kỷ yếu, Tốt nghiệp, Tết, Lễ hội, Đám cưới, Du lịch)
 * - Hero fashion portrait card with scores and "Chuẩn điển chế" badge
 * - 4 horizontal discovery cards with artwork, icon badges, and colored circular arrow buttons
 */

import React, { useState, useRef, useMemo, useEffect } from 'react';
import { OutfitMockupCanvas } from './OutfitMockupCanvas';
import { NEED_PRESETS } from '../lib/adaptive/presets';
import type { FunctionalNeedCode } from '../types/domain';
import { getApprovedGarments, getApprovedAccessories, getCharacters } from '../lib/dal';
import {
  backdropUrl,
  heroPortraitUrl,
  cardAiStylistUrl,
  cardStudioRedUrl,
  cardAdaptiveUrl,
  cardKnowledgeUrl,
} from '../assets/themeImages';

interface HomeHeroProps {
  onRunStylist: (prompt: string) => void;
  onPickPhoto: (file: File) => void;
  photoPreviewUrl: string | null;
  isParsing?: boolean;
  onSelectStudio: () => void;
  onSelect9Steps: () => void;
  onSelectDiscovery: () => void;
  onSelectAdaptive: () => void;
  onSelectAdaptiveNeed?: (code: FunctionalNeedCode) => void;
  onSelectVirtual?: () => void;
}

/* Minimal typing for the Web Speech API (Chrome/Edge/Safari expose it with a webkit prefix). */
interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  start: () => void;
  stop: () => void;
}

function getSpeechRecognition(): (new () => SpeechRecognitionLike) | undefined {
  if (typeof window === 'undefined') return undefined;
  const w = window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

const ADAPTIVE_PROMISES = [
  { label: 'Nam châm ẩn dưới 5 cúc áo tấc', detail: 'Tự cài một tay — vẫn đủ quy thức 5 cúc' },
  { label: 'Rút vạt trước, giữ vạt sau', detail: 'Ngồi xe lăn gọn gàng — phom áo không đổi' },
  { label: 'Nới nách, giữ cổ tay chẽn', detail: 'Xỏ tay không cần giơ cao — giữ dáng tay chẽn' },
];

const QUICK_TAGS = [
  { label: 'Kỷ yếu', icon: '🎓' },
  { label: 'Tốt nghiệp', icon: '🌿' },
  { label: 'Tết', icon: '🌸' },
  { label: 'Lễ hội', icon: '🏮' },
  { label: 'Đám cưới', icon: '💍' },
  { label: 'Du lịch', icon: '⛵' },
];

export const HomeHero: React.FC<HomeHeroProps> = ({
  onRunStylist,
  onPickPhoto,
  photoPreviewUrl,
  isParsing = false,
  onSelectStudio,
  onSelect9Steps,
  onSelectDiscovery,
  onSelectAdaptive,
  onSelectAdaptiveNeed,
  onSelectVirtual,
}) => {
  const [promptText, setPromptText] = useState('');
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    setVoiceSupported(Boolean(getSpeechRecognition()));
    return () => recognitionRef.current?.stop();
  }, []);

  const toggleVoice = () => {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const Recognition = getSpeechRecognition();
    if (!Recognition) return;
    const recognition = new Recognition();
    recognition.lang = 'vi-VN';
    recognition.interimResults = true;
    recognition.continuous = false;
    const base = promptText.trim();
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results).map((result) => result[0]?.transcript ?? '').join(' ').trim();
      setPromptText(base ? `${base} ${transcript}` : transcript);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  };
  const [showLiveVector, setShowLiveVector] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptText.trim()) return;
    onRunStylist(promptText.trim());
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onPickPhoto(file);
    }
  };

  const heroGarment = useMemo(() => {
    const list = getApprovedGarments();
    return list.find((g) => g.id === 'garment-ngu-than-tay-chen') || list[0];
  }, []);
  const heroCharacter = useMemo(() => getCharacters()[0], []);
  const heroAccessories = useMemo(() => {
    const all = getApprovedAccessories();
    return all.filter((a) => ['acc-khan-dong', 'acc-the-bai'].includes(a.id));
  }, []);

  return (
    <section className="space-y-12 relative">
      {/* ATMOSPHERIC BACKGROUND MURAL: Lotus flowers on left, Pagoda & Blossoms on right */}
      <div
        className="absolute -top-10 inset-x-0 lg:-left-6 lg:-right-6 h-[720px] pointer-events-none opacity-45 sm:opacity-60 bg-contain bg-no-repeat bg-top -z-10 transition-opacity"
        style={{ backgroundImage: `url(${backdropUrl})` }}
        aria-hidden="true"
      />

      {/* ========================================================================= */}
      {/* 1. EDITORIAL HERO BLOCK (2-Column Split matching the design reference)    */}
      {/* ========================================================================= */}
      <div className="relative rounded-[36px] border border-[#EAE2D5] bg-[#FFFFFF]/90 backdrop-blur-md p-6 sm:p-10 lg:p-12 shadow-[0_12px_44px_-8px_rgba(22,34,46,0.06)] overflow-hidden">
        {/* Subtle decorative background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#FDF8F0] rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          {/* LEFT COLUMN: TITLE & NATURAL PROMPT CAPSULE */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="space-y-3">
              {/* Header Badge */}
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#F3ECE1] text-[#7A5B3E] text-xs font-semibold tracking-wider font-mono uppercase shadow-2xs">
                <span>🪡</span>
                <span>NỀN TẢNG PHỐI VIỆT PHỤC THÔNG MINH</span>
                <span className="text-[#C5A265]">⚜</span>
              </div>

              {/* Luxury Serif Title with Terracotta Highlight */}
              <h1 className="font-serif text-4xl sm:text-5xl lg:text-[58px] font-bold text-[#16222E] tracking-tight leading-[1.14]">
                Mặc <span className="text-[#8E3329]">Việt phục,</span><br />
                theo cách của bạn.
              </h1>

              {/* Subtitle */}
              <p className="text-sm sm:text-base text-[#6B6158] max-w-xl leading-relaxed font-sans">
                Kể dịp bạn sắp đi. Gemini gợi ý bộ phối và vẽ ảnh cho bạn xem trước.
              </p>
            </div>

            {/* Prompt Search Capsule */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="relative rounded-[28px] border border-[#E6DCCD] bg-[#FAF7F2] p-3 sm:p-4 space-y-2.5 shadow-inner focus-within:border-[#16222E] focus-within:bg-[#FFFFFF] focus-within:ring-2 focus-within:ring-[#16222E]/10 transition-all">
                {/* Input with Sparkle Icon */}
                <div className="flex items-start gap-2.5">
                  <span className="text-[#16222E] text-base mt-2 select-none">✦</span>
                  <textarea
                    id="hero-prompt-input"
                    rows={2}
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    placeholder="Ví dụ: Chụp kỷ yếu ở Hội An, trời nắng, thích màu xanh, muốn hiện đại..."
                    className="w-full bg-transparent text-sm sm:text-base text-[#16222E] placeholder-[#8A8075]/70 resize-none focus:outline-none font-sans leading-relaxed"
                    aria-label="Nhập mô tả nhu cầu phối đồ"
                  />
                </div>

                {/* Photo preview tag if uploaded */}
                {photoPreviewUrl && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-[#FFFFFF] rounded-xl border border-[#E6DCCD] w-fit text-xs text-[#16222E]">
                    <img src={photoPreviewUrl} alt="Ảnh cảm hứng" className="size-6 rounded-md object-cover" />
                    <span>Đã đính kèm ảnh cảm hứng</span>
                  </div>
                )}

                {/* Capsule Bottom Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#EAE3D6] px-1">
                  {/* Left: Add Photo + voice input */}
                  <div className="flex flex-wrap items-center gap-1">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="press inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-[#6B6158] hover:text-[#16222E] hover:bg-[#FFFFFF] border border-transparent hover:border-[#E6DCCD] transition"
                    >
                      <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <rect width="18" height="18" x="3" y="3" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <path d="M21 15l-5-5L5 21" />
                      </svg>
                      <span>Thêm ảnh</span>
                    </button>
                    {voiceSupported && (
                      <button
                        type="button"
                        onClick={toggleVoice}
                        aria-pressed={listening}
                        title="Nói thay vì gõ (tiếng Việt)"
                        className={`press inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                          listening ? 'bg-[#8E3329] text-[#FFFFFF] border-[#8E3329]' : 'text-[#6B6158] hover:text-[#16222E] hover:bg-[#FFFFFF] border-transparent hover:border-[#E6DCCD]'
                        }`}
                      >
                        <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" aria-hidden="true">
                          <rect x="9" y="3" width="6" height="11" rx="3" />
                          <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
                        </svg>
                        <span>{listening ? 'Đang nghe… bấm để dừng' : 'Nói'}</span>
                      </button>
                    )}
                  </div>

                  {/* Right: Primary Action Button */}
                  <button
                    type="submit"
                    disabled={isParsing || !promptText.trim()}
                    className="press min-h-[42px] px-6 py-2 rounded-full bg-[#1C2E3D] hover:bg-[#253D52] text-[#FFFFFF] text-xs sm:text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-2 shadow-xs"
                  >
                    {isParsing ? (
                      <>
                        <span className="size-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        <span>Gemini đang đọc…</span>
                      </>
                    ) : (
                      <span>Phối giúp mình →</span>
                    )}
                  </button>
                </div>
              </div>

              {/* Quick Tags matching Screen 1 (Kỷ yếu, Tốt nghiệp, Tết, Lễ hội, Đám cưới, Du lịch) */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {QUICK_TAGS.map((tag) => (
                  <button
                    key={tag.label}
                    type="button"
                    onClick={() => setPromptText((prev) => (prev ? `${prev}, dịp ${tag.label}` : `Dịp ${tag.label}`))}
                    className="press inline-flex items-center gap-1.5 text-xs bg-[#FAF7F2] hover:bg-[#FFFFFF] text-[#5C5248] hover:text-[#16222E] px-3.5 py-1.5 rounded-full border border-[#E6DCCD] transition font-medium shadow-2xs"
                  >
                    <span>{tag.icon}</span>
                    <span>{tag.label}</span>
                  </button>
                ))}
              </div>
            </form>
          </div>

          {/* RIGHT COLUMN: EDITORIAL FASHION PORTRAIT CARD */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-[340px] rounded-[32px] overflow-hidden bg-[#FAF6F0] border border-[#E6DCCD] shadow-lg p-3 group transition-transform hover:-translate-y-0.5">
              {/* Image Frame with Arched Courtyard Portrait */}
              <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden bg-[#FAF7F2] border border-[#EAE3D6]">
                {!showLiveVector ? (
                  <img
                    src={heroPortraitUrl}
                    alt="Áo dài ngũ thân truyền thống"
                    width={896}
                    height={1200}
                    fetchPriority="high"
                    decoding="async"
                    className="w-full h-full object-cover select-none transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                ) : (
                  <OutfitMockupCanvas
                    garment={heroGarment}
                    primaryColor="#2B5C8F"
                    pantColor="#F4F0E8"
                    accessories={heroAccessories}
                    character={heroCharacter}
                    compact={true}
                    backgroundTheme="MINIMAL_STUDIO"
                  />
                )}

                {/* Subtle Toggle between Art & Interactive Vector */}
                <button
                  type="button"
                  onClick={() => setShowLiveVector(!showLiveVector)}
                  className="press absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full bg-[#FFFFFF]/90 backdrop-blur-md text-[10px] font-bold text-[#16222E] border border-[#E6DCCD] shadow-xs"
                >
                  {showLiveVector ? 'Xem ảnh họa' : 'Xem mockup vector'}
                </button>
              </div>

              {/* Bottom Card Footer Details matching Screen 1 */}
              <div className="mt-3 p-3 rounded-2xl bg-[#FFFFFF] border border-[#EAE2D5] text-left text-xs space-y-1 shadow-2xs">
                <span className="font-serif font-bold text-[#16222E] block text-[13px]">
                  Áo dài ngũ thân · Thanh lịch
                </span>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[11px] text-[#736960] font-mono pt-0.5 whitespace-nowrap">
                  <span>Chuẩn <b className="text-[#16222E]">88</b></span>
                  <span aria-hidden="true">·</span>
                  <span>Chất <b className="text-[#16222E]">86</b></span>
                  <span aria-hidden="true">·</span>
                  <span>Màu <b className="text-[#16222E]">92</b></span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-sans font-bold text-[#3D6B35] bg-[#EAF3E7] border border-[#CDE0C9] px-2 py-0.5 rounded-full ml-auto">
                    ✓ Chuẩn điển chế
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. SECTION: BẠN MUỐN KHÁM PHÁ GÌ? (4 Horizontal Cards matching image.png) */}
      {/* ========================================================================= */}
      <div className="space-y-5 pt-4">
        {/* Section Heading with Brass Insignia */}
        <div className="text-left space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[#C5A265] text-xl select-none">⚜</span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#16222E] tracking-tight">
              Bạn muốn khám phá gì?
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[#736960]">
            Chọn phương thức sáng tạo phù hợp nhất với phong cách và nhu cầu của bạn.
          </p>
        </div>

        {/* 4 Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Phối đồ AI */}
          <div
            onClick={() => {
              const input = document.getElementById('hero-prompt-input');
              if (input) {
                input.focus();
                input.scrollIntoView({ behavior: 'smooth', block: 'center' });
              } else {
                onSelect9Steps();
              }
            }}
            className="group press rounded-[28px] border border-[#E6DCCD] bg-[#FFFFFF] p-3.5 shadow-[0_4px_20px_-2px_rgba(22,34,46,0.03)] hover:shadow-md hover:border-[#1C2E3D]/30 transition-all cursor-pointer flex items-center gap-3.5"
          >
            {/* Artwork Thumbnail Frame */}
            <div className="w-24 h-28 rounded-2xl overflow-hidden bg-[#FAF7F2] border border-[#EAE3D6] shrink-0">
              <img
                src={cardAiStylistUrl}
                loading="lazy"
                decoding="async"
                alt="Phối đồ AI"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>

            {/* Content & Action */}
            <div className="flex-1 min-w-0 flex flex-col justify-between h-28 py-1">
              <div className="space-y-1">
                <span className="size-6 rounded-full bg-[#E6ECF3] text-[#2E4A6B] inline-flex items-center justify-center text-xs font-bold shadow-2xs">
                  ✦
                </span>
                <h3 className="font-serif text-base font-bold text-[#16222E] group-hover:text-[#2E4A6B] transition-colors">
                  Phối đồ AI
                </h3>
                <p className="text-[11px] text-[#736960] leading-snug line-clamp-2">
                  Kể một câu, nhận ngay gợi ý phối và giải thích.
                </p>
              </div>

              <div className="flex justify-end">
                <span className="size-7 rounded-full bg-[#1C2E3D] text-[#FFFFFF] text-xs font-bold inline-flex items-center justify-center transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Studio */}
          <div
            onClick={onSelectStudio}
            className="group press rounded-[28px] border border-[#E6DCCD] bg-[#FFFFFF] p-3.5 shadow-[0_4px_20px_-2px_rgba(22,34,46,0.03)] hover:shadow-md hover:border-[#8E3329]/30 transition-all cursor-pointer flex items-center gap-3.5"
          >
            {/* Artwork Thumbnail Frame */}
            <div className="w-24 h-28 rounded-2xl overflow-hidden bg-[#FAF7F2] border border-[#EAE3D6] shrink-0">
              <img
                src={cardStudioRedUrl}
                loading="lazy"
                decoding="async"
                alt="Studio thời trang"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>

            {/* Content & Action */}
            <div className="flex-1 min-w-0 flex flex-col justify-between h-28 py-1">
              <div className="space-y-1">
                <span className="size-6 rounded-full bg-[#F9EBE8] text-[#8E3329] inline-flex items-center justify-center text-xs font-bold shadow-2xs">
                  🎨
                </span>
                <h3 className="font-serif text-base font-bold text-[#16222E] group-hover:text-[#8E3329] transition-colors">
                  Studio
                </h3>
                <p className="text-[11px] text-[#736960] leading-snug line-clamp-2">
                  Tự tay phối, sáng tạo như game thời trang.
                </p>
              </div>

              <div className="flex justify-end">
                <span className="size-7 rounded-full bg-[#8E3329] text-[#FFFFFF] text-xs font-bold inline-flex items-center justify-center transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Adaptive Fashion */}
          <div
            onClick={onSelectAdaptive}
            className="group press rounded-[28px] border border-[#E6DCCD] bg-[#FFFFFF] p-3.5 shadow-[0_4px_20px_-2px_rgba(22,34,46,0.03)] hover:shadow-md hover:border-[#43664A]/30 transition-all cursor-pointer flex items-center gap-3.5"
          >
            {/* Artwork Thumbnail Frame */}
            <div className="w-24 h-28 rounded-2xl overflow-hidden bg-[#FAF7F2] border border-[#EAE3D6] shrink-0">
              <img
                src={cardAdaptiveUrl}
                loading="lazy"
                decoding="async"
                alt="Adaptive Fashion"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>

            {/* Content & Action */}
            <div className="flex-1 min-w-0 flex flex-col justify-between h-28 py-1">
              <div className="space-y-1">
                <span className="size-6 rounded-full bg-[#E5EDE2] text-[#43664A] inline-flex items-center justify-center text-xs font-bold shadow-2xs">
                  ♿
                </span>
                <h3 className="font-serif text-base font-bold text-[#16222E] group-hover:text-[#43664A] transition-colors">
                  Adaptive Fashion
                </h3>
                <p className="text-[11px] text-[#736960] leading-snug line-clamp-2">
                  Điều chỉnh theo nhu cầu cơ thể.
                </p>
              </div>

              <div className="flex justify-end">
                <span className="size-7 rounded-full bg-[#43664A] text-[#FFFFFF] text-xs font-bold inline-flex items-center justify-center transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </div>
            </div>
          </div>

          {/* Card 4: Kiến thức */}
          <div
            onClick={onSelectDiscovery}
            className="group press rounded-[28px] border border-[#E6DCCD] bg-[#FFFFFF] p-3.5 shadow-[0_4px_20px_-2px_rgba(22,34,46,0.03)] hover:shadow-md hover:border-[#7A2820]/30 transition-all cursor-pointer flex items-center gap-3.5"
          >
            {/* Artwork Thumbnail Frame */}
            <div className="w-24 h-28 rounded-2xl overflow-hidden bg-[#FAF7F2] border border-[#EAE3D6] shrink-0">
              <img
                src={cardKnowledgeUrl}
                loading="lazy"
                decoding="async"
                alt="Kiến thức Việt phục"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>

            {/* Content & Action */}
            <div className="flex-1 min-w-0 flex flex-col justify-between h-28 py-1">
              <div className="space-y-1">
                <span className="size-6 rounded-full bg-[#F7EBEB] text-[#7A2820] inline-flex items-center justify-center text-xs font-bold shadow-2xs">
                  📖
                </span>
                <h3 className="font-serif text-base font-bold text-[#16222E] group-hover:text-[#7A2820] transition-colors">
                  Kiến thức
                </h3>
                <p className="text-[11px] text-[#736960] leading-snug line-clamp-2">
                  Tìm hiểu Việt phục và thử sức với Quiz.
                </p>
              </div>

              <div className="flex justify-end">
                <span className="size-7 rounded-full bg-[#7A2820] text-[#FFFFFF] text-xs font-bold inline-flex items-center justify-center transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </div>
            </div>
          </div>
        </div>

        {onSelectAdaptiveNeed && (
          <section aria-labelledby="adaptive-spotlight" className="relative overflow-hidden rounded-[32px] border border-[#CDE0C9] bg-[linear-gradient(135deg,#EEF4EC_0%,#FFFFFF_60%,#FBF4E8_100%)] p-5 sm:p-7">
            <span aria-hidden="true" className="pointer-events-none absolute -left-20 -bottom-24 size-72 rounded-full border border-[#4F7350]/15" />
            <div className="relative grid gap-6 lg:grid-cols-12 lg:items-center">
              <div className="space-y-4 lg:col-span-7">
                <span className="inline-flex items-center gap-2 rounded-full border border-[#CDE0C9] bg-[#FFFFFF] px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-[#3D6B35]">
                  ♿ Adaptive Fashion · điểm khác biệt của Vstyle
                </span>
                <h2 id="adaptive-spotlight" className="font-serif text-2xl font-bold leading-tight text-[#16222E] sm:text-3xl">
                  Vừa với mọi cơ thể — <span className="italic text-[#3D6B35]">không đánh đổi bản sắc.</span>
                </h2>
                <p className="max-w-xl text-sm leading-relaxed text-[#5C5248]">
                  Người ngồi xe lăn, khó cài cúc, hạn chế cử động vai hay da nhạy cảm đều có thể diện Việt phục đúng điển chế. Chọn nhu cầu của bạn để bắt đầu:
                </p>
                <div className="flex flex-wrap gap-2">
                  {NEED_PRESETS.map((need) => (
                    <button
                      key={need.code}
                      type="button"
                      onClick={() => onSelectAdaptiveNeed(need.code)}
                      className="press inline-flex min-h-11 items-center gap-2 rounded-2xl border border-[#E6DCCD] bg-[#FFFFFF] px-3.5 text-xs font-bold text-[#16222E] shadow-2xs transition hover:border-[#4F7350] hover:bg-[#F1F6EF]"
                    >
                      <span aria-hidden="true" className="text-base">{need.icon}</span>
                      {need.shortName}
                    </button>
                  ))}
                </div>
              </div>
              <ul className="space-y-2.5 lg:col-span-5">
                {ADAPTIVE_PROMISES.map((item) => (
                  <li key={item.label} className="flex items-start gap-3 rounded-2xl border border-[#E6DCCD] bg-[#FFFFFF]/90 p-3.5 shadow-2xs">
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#4F7350] text-xs font-bold text-[#FFFFFF]" aria-hidden="true">✓</span>
                    <span>
                      <span className="block text-sm font-bold text-[#16222E]">{item.label}</span>
                      <span className="block text-[11px] text-[#736960]">{item.detail}</span>
                    </span>
                  </li>
                ))}
                <li>
                  <button type="button" onClick={onSelectAdaptive} className="press w-full rounded-2xl bg-[#16222E] px-4 py-3 text-sm font-bold text-[#FFFFFF] transition hover:bg-[#253D52]">
                    Mở phòng may đo thích ứng →
                  </button>
                </li>
              </ul>
            </div>
          </section>
        )}

        {onSelectVirtual && (
          <button
            type="button"
            onClick={onSelectVirtual}
            className="group press relative w-full overflow-hidden rounded-[28px] border border-[#2A2420] bg-[#1F1B18] p-5 text-left text-[#FFFFFF] shadow-md transition hover:bg-[#2A2420] sm:p-6"
          >
            <span aria-hidden="true" className="pointer-events-none absolute -right-10 -top-16 size-56 rounded-full border border-[#C9A24A]/30" />
            <span aria-hidden="true" className="pointer-events-none absolute -right-2 -top-6 size-36 rounded-full border border-[#C9A24A]/20" />
            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1.5">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#C9A24A]/20 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[#E9D7B0]">
                  Mới · Virtual Tour · 3D · VR/AR
                </span>
                <h3 className="font-serif text-xl font-bold sm:text-2xl">Phòng 3D & Tham quan ảo</h3>
                <p className="max-w-xl text-xs leading-relaxed text-[#D9D0C4] sm:text-sm">
                  Xoay 360° bản phối dạng mô hình 3D, dạo Văn Miếu, Ngọ Môn Huế, làng quê Bắc Bộ; mở bằng kính VR, đặt vào phòng bằng AR hoặc tải file .glb.
                </p>
              </div>
              <span className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 self-start rounded-2xl bg-[#C9A24A] px-5 text-sm font-bold text-[#1F1B18] transition group-hover:translate-x-0.5 sm:self-auto">
                Vào phòng 3D →
              </span>
            </div>
          </button>
        )}
      </div>
    </section>
  );
};
