/**
 * Home: watercolor heritage hero with the AI prompt, and four entry cards.
 */

import React, { useEffect, useState } from 'react';
import { Accessibility, ArrowRight, BookOpen, CheckCircle2, Flower2, Palette, Sparkles } from 'lucide-react';
import { PromptBox } from './PromptBox';
import { OCCASION_CHIPS } from './studio/occasions';
import {
  backdropUrl,
  heroPortraitUrl,
  cardAiStylistUrl,
  cardStudioRedUrl,
  cardAdaptiveUrl,
  cardKnowledgeUrl,
} from '../assets/themeImages';

interface HomeHeroProps {
  onRunStylist: (prompt: string, photo?: File) => void;
  onOpenAi: () => void;
  onOpenStudio: () => void;
  onOpenAdaptive: () => void;
  onOpenKnowledge: () => void;
}

const Ornament: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 32 32" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.4">
    <path d="M16 3c1.6 4.2 4.2 6.8 8.4 8.4-4.2 1.6-6.8 4.2-8.4 8.4-1.6-4.2-4.2-6.8-8.4-8.4C11.8 9.8 14.4 7.2 16 3Z" />
    <path d="M16 12c1.6 4.2 4.2 6.8 8.4 8.4-4.2 1.6-6.8 4.2-8.4 8.4-1.6-4.2-4.2-6.8-8.4-8.4C11.8 18.8 14.4 16.2 16 12Z" opacity=".6" />
    <circle cx="16" cy="16" r="1.6" fill="currentColor" />
  </svg>
);

const CARDS = [
  { key: 'ai', title: 'Phối đồ AI', desc: 'Kể một câu, nhận ngay gợi ý phối và giải thích.', image: cardAiStylistUrl, icon: Sparkles, bg: 'bg-[#E9EDF1]', fade: 'from-[#E9EDF1]', iconBg: 'bg-[#D7E0E9] text-[#1E3443]', arrow: 'bg-[#1E3443]' },
  { key: 'studio', title: 'Studio', desc: 'Tự tay phối, sáng tạo như game thời trang.', image: cardStudioRedUrl, icon: Palette, bg: 'bg-[#F7E8E2]', fade: 'from-[#F7E8E2]', iconBg: 'bg-[#F1D5CB] text-[#C4553F]', arrow: 'bg-[#C4553F]' },
  { key: 'adaptive', title: 'Adaptive Fashion', desc: 'Điều chỉnh theo nhu cầu cơ thể.', image: cardAdaptiveUrl, icon: Accessibility, bg: 'bg-[#EAEEE6]', fade: 'from-[#EAEEE6]', iconBg: 'bg-[#3D6B35] text-[#FFFFFF]', arrow: 'bg-[#3D6B35]' },
  { key: 'knowledge', title: 'Kiến thức', desc: 'Tìm hiểu Việt phục và thử sức với Quiz.', image: cardKnowledgeUrl, icon: BookOpen, bg: 'bg-[#F5E6E5]', fade: 'from-[#F5E6E5]', iconBg: 'bg-[#8E3329] text-[#FFFFFF]', arrow: 'bg-[#8E3329]' },
] as const;

export const HomeHero: React.FC<HomeHeroProps> = ({ onRunStylist, onOpenAi, onOpenStudio, onOpenAdaptive, onOpenKnowledge }) => {
  const [prompt, setPrompt] = useState('');
  const [photo, setPhoto] = useState<{ file: File; url: string } | null>(null);
  useEffect(() => () => {
    if (photo) URL.revokeObjectURL(photo.url);
  }, [photo]);
  const open: Record<(typeof CARDS)[number]['key'], () => void> = {
    ai: onOpenAi,
    studio: onOpenStudio,
    adaptive: onOpenAdaptive,
    knowledge: onOpenKnowledge,
  };

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${backdropUrl})` }} aria-hidden="true" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_40%_45%,rgba(251,247,243,0.92)_0%,rgba(251,247,243,0.7)_45%,rgba(251,247,243,0.15)_80%)]" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-8 sm:py-12">
          <div className="grid items-center gap-8 rounded-[32px] border border-[#FFFFFF]/70 bg-[#FBF7F3]/70 p-6 shadow-[0_30px_60px_-40px_rgba(30,52,67,0.35)] backdrop-blur-[2px] sm:p-10 lg:grid-cols-12 lg:gap-10">
            <div className="space-y-6 lg:col-span-7">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#E8DFD3] bg-[#FFFFFF]/80 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-[#1E3443]">
                <Flower2 className="size-4 text-[#3D6B35]" aria-hidden="true" /> Nền tảng phối Việt phục thông minh
                <Ornament className="size-4 text-[#C9A24A]" />
              </span>
              <h1 className="font-serif text-[44px] font-bold leading-[1.05] tracking-tight text-[#1E3443] sm:text-6xl lg:text-[68px]">
                Mặc <span className="text-[#C4553F]">Việt phục,</span>
                <br />
                theo cách của bạn.
              </h1>
              <p className="max-w-2xl text-base text-[#3F4A52] sm:text-lg">Kể dịp bạn sắp đi. Gemini gợi ý bộ phối và vẽ ảnh cho bạn xem trước.</p>
              <div className="max-w-2xl">
                <PromptBox
                  value={prompt}
                  onChange={setPrompt}
                  onSubmit={() => onRunStylist(prompt, photo?.file)}
                  photoPreviewUrl={photo?.url}
                  onPickPhoto={(file) => setPhoto({ file, url: URL.createObjectURL(file) })}
                  onClearPhoto={() => setPhoto(null)}
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {OCCASION_CHIPS.map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={() => onRunStylist(chip.prompt, photo?.file)}
                    className="press inline-flex items-center gap-1.5 rounded-full border border-[#E8DFD3] bg-[#FFFFFF]/90 px-3 py-1.5 text-[13px] text-[#1E3443] shadow-2xs transition hover:border-[#1E3443]/30"
                  >
                    <chip.icon className="size-4 text-[#1E3443]" aria-hidden="true" /> {chip.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5">
              <figure className="mx-auto max-w-sm rounded-[24px] border border-[#FFFFFF] bg-[#FFFFFF]/90 p-3 shadow-[0_20px_50px_-25px_rgba(30,52,67,0.45)]">
                <img
                  src={heroPortraitUrl}
                  alt="Minh họa áo dài ngũ thân thanh lịch"
                  width={896}
                  height={1200}
                  fetchPriority="high"
                  decoding="async"
                  className="aspect-[4/5] w-full rounded-[18px] object-cover"
                />
                <figcaption className="flex items-center justify-between gap-2 px-2 pb-1 pt-3">
                  <span>
                    <span className="block text-sm font-semibold text-[#1E3443]">Áo dài ngũ thân · Thanh lịch</span>
                    <span className="block text-xs text-[#5C5248]">Chuẩn: 88 · Chất: 86 · Màu: 92</span>
                  </span>
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#CDE0C9] bg-[#EEF4EC] px-2.5 py-1 text-xs font-semibold text-[#3D6B35]">
                    <CheckCircle2 className="size-3.5" aria-hidden="true" /> Chuẩn điển chế
                  </span>
                </figcaption>
              </figure>
            </div>
          </div>
        </div>
      </section>

      {/* ENTRY CARDS */}
      <section className="mx-auto max-w-7xl space-y-6 px-4 py-12 sm:px-8" aria-labelledby="explore-title">
        <div className="space-y-1">
          <h2 id="explore-title" className="flex items-center gap-3 font-serif text-3xl font-bold text-[#1E3443] sm:text-4xl">
            <Ornament className="size-7 shrink-0 text-[#C9A24A] sm:size-8" /> Bạn muốn khám phá gì?
          </h2>
          <p className="text-[15px] text-[#5C5248] sm:pl-11">Chọn cách sáng tạo hợp với phong cách và nhu cầu của bạn.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CARDS.map((card) => (
            <button
              key={card.key}
              type="button"
              onClick={open[card.key]}
              className={`press group relative flex min-h-44 overflow-hidden rounded-[22px] border border-[#FFFFFF] text-left shadow-[0_10px_30px_-20px_rgba(30,52,67,0.4)] transition hover:-translate-y-0.5 ${card.bg}`}
            >
              <div className="relative w-[42%] shrink-0 overflow-hidden">
                <img src={card.image} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover object-top transition duration-500 group-hover:scale-105" />
                <span className={`absolute inset-y-0 right-0 w-10 bg-gradient-to-l ${card.fade} to-transparent`} aria-hidden="true" />
              </div>
              <div className="flex flex-1 flex-col justify-between p-4 pl-2">
                <div className="space-y-2">
                  <span className={`grid size-9 place-items-center rounded-full ${card.iconBg}`}><card.icon className="size-[18px]" aria-hidden="true" /></span>
                  <h3 className="font-serif text-xl font-bold leading-tight text-[#1E3443]">{card.title}</h3>
                  <p className="text-[13px] leading-snug text-[#5C5248]">{card.desc}</p>
                </div>
                <span className={`ml-auto mt-2 grid size-8 shrink-0 place-items-center rounded-full text-[#FFFFFF] transition group-hover:translate-x-0.5 ${card.arrow}`} aria-hidden="true">
                  <ArrowRight className="size-4" />
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};
