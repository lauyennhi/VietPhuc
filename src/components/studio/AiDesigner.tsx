/**
 * Studio › AI tạo: the user describes the occasion and taste in their own words,
 * the AI designs a complete outfit and explains every choice.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Backpack, Box, Check, Lightbulb, Palette, RefreshCw, SlidersHorizontal, Sparkles, TriangleAlert } from 'lucide-react';
import type { Outfit } from '../../types/domain';
import type { OutfitDesign } from '../../types/gemini';
import { PromptBox } from '../PromptBox';
import { OutfitMockupCanvas } from '../OutfitMockupCanvas';
import { AiRenderPanel, type RenderState } from '../AiRenderPanel';
import { OutfitReview } from '../OutfitReview';
import { OCCASION_CHIPS } from './occasions';
import { analyzeOutfitPhoto, designOutfitFromText, renderOutfitImage } from '../../lib/gemini/client';
import { prepareImageForGemini, type PreparedImage } from '../../lib/image/prepareImage';
import { evaluateLook, lookFromDesign, type Look } from '../../lib/look';
import { getAccessoryById, getCharacters, getGarmentById } from '../../lib/dal';
import { colorNameFor, isAccessoryAllowedFor } from '../../lib/design/designEngine';

interface AiDesignerProps {
  initialPrompt?: string;
  initialPhoto?: File;
  imageRenderAvailable: boolean | null;
  showToast: (message: string) => void;
  onEditLook: (look: Look) => void;
  onOpen3D: (look: Look) => void;
  onSaved: () => void;
  onPost: (outfit: Outfit) => void;
  onShare: (outfit: Outfit) => void;
}

const characters = getCharacters();

export const AiDesigner: React.FC<AiDesignerProps> = ({
  initialPrompt,
  initialPhoto,
  imageRenderAvailable,
  showToast,
  onEditLook,
  onOpen3D,
  onSaved,
  onPost,
  onShare,
}) => {
  const [prompt, setPrompt] = useState(initialPrompt ?? '');
  const [photo, setPhoto] = useState<PreparedImage | null>(null);
  const [photoColors, setPhotoColors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [design, setDesign] = useState<OutfitDesign | null>(null);
  const [look, setLook] = useState<Look | null>(null);
  const [view, setView] = useState<'MOCKUP' | 'AI'>('MOCKUP');
  const [render, setRender] = useState<RenderState>({ status: 'idle' });

  const run = async (text = prompt, colors = photoColors) => {
    if (!text.trim() && !colors.length) return;
    setBusy(true);
    try {
      const result = await designOutfitFromText({ text: text.trim() || 'Phối theo bảng màu ảnh cảm hứng', photoColors: colors });
      setDesign(result);
      setLook(lookFromDesign(result, characters[0].id));
      setRender({ status: 'idle' });
      setView('MOCKUP');
      window.setTimeout(() => document.getElementById('ai-result')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Chưa phối được, bạn thử lại nhé.');
    } finally {
      setBusy(false);
    }
  };

  const pickPhoto = async (file: File): Promise<string[]> => {
    try {
      const prepared = await prepareImageForGemini(file);
      setPhoto(prepared);
      const analysis = await analyzeOutfitPhoto(prepared.image);
      const colors = analysis.usedFallback ? [] : analysis.dominantColors.map((c) => c.hex);
      setPhotoColors(colors);
      showToast(analysis.usedFallback ? 'Đã đính kèm ảnh (Gemini chưa bật nên chưa đọc được màu).' : 'AI đã đọc bảng màu từ ảnh của bạn.');
      return colors;
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Không đọc được ảnh.');
      return [];
    }
  };

  // A prompt (and photo) handed over from the home page runs immediately.
  useEffect(() => {
    void (async () => {
      const colors = initialPhoto ? await pickPhoto(initialPhoto) : [];
      if (initialPrompt?.trim() || colors.length) void run(initialPrompt ?? '', colors);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPrompt, initialPhoto]);

  const evaluation = useMemo(() => (look ? evaluateLook(look) : null), [look]);
  const character = useMemo(() => characters.find((c) => c.id === look?.characterId) ?? characters[0], [look]);

  const useAlternative = (garmentId: string, primaryColor: string) => {
    if (!look) return;
    const garment = getGarmentById(garmentId);
    if (!garment) return;
    setLook({
      ...look,
      garmentId,
      primaryColor,
      title: undefined,
      accessoryIds: look.accessoryIds.filter((id) => {
        const acc = getAccessoryById(id);
        return acc ? isAccessoryAllowedFor(acc, garment, look.eventId) : false;
      }),
    });
    setRender({ status: 'idle' });
  };

  const generateImage = async () => {
    if (!look) return;
    setRender({ status: 'loading' });
    try {
      const result = await renderOutfitImage({
        garmentId: look.garmentId,
        eventId: look.eventId,
        styleId: look.styleId,
        primaryColor: look.primaryColor,
        pantColor: look.pantColor,
        accessoryIds: look.accessoryIds,
        characterId: look.characterId,
        adaptiveNeedCodes: look.needCodes,
      });
      setRender({ status: 'ready', result });
    } catch (error) {
      setRender({ status: 'error', error: error instanceof Error ? error.message : 'Chưa tạo được ảnh AI.' });
    }
  };

  const garment = evaluation?.garment;
  const isOriginal = design && look && look.garmentId === design.garmentId;

  return (
    <div className="space-y-8">
      <div className="mx-auto max-w-3xl space-y-3">
        <PromptBox
          value={prompt}
          onChange={setPrompt}
          onSubmit={() => void run()}
          busy={busy}
          photoPreviewUrl={photo?.previewUrl}
          onPickPhoto={(file) => void pickPhoto(file)}
          onClearPhoto={() => {
            setPhoto(null);
            setPhotoColors([]);
          }}
        />
        <div className="flex flex-wrap justify-center gap-2">
          {OCCASION_CHIPS.map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={() => {
                setPrompt(chip.prompt);
                void run(chip.prompt);
              }}
              className="press inline-flex items-center gap-1.5 rounded-full border border-[#E8DFD3] bg-[#FFFFFF]/90 px-3.5 py-1.5 text-sm text-[#1E3443] shadow-2xs transition hover:border-[#1E3443]/30"
            >
              <chip.icon className="size-4 text-[#C4553F]" aria-hidden="true" /> {chip.label}
            </button>
          ))}
        </div>
      </div>

      {design && look && evaluation && garment && (
        <div id="ai-result" className="scroll-mt-24 space-y-6 animate-rise">
          <div className="grid gap-6 lg:grid-cols-12">
            {/* Visual */}
            <div className="space-y-3 lg:col-span-5">
              <div className="flex rounded-full border border-[#E8DFD3] bg-[#FFFFFF] p-1 text-sm font-semibold" role="tablist">
                {([['MOCKUP', 'Mockup'], ['AI', 'Ảnh AI']] as const).map(([key, label]) => (
                  <button key={key} type="button" role="tab" aria-selected={view === key} onClick={() => setView(key)} className={`press flex-1 rounded-full py-2 transition ${view === key ? 'bg-[#1E3443] text-[#FFFFFF]' : 'text-[#5C5248]'}`}>
                    {label}
                  </button>
                ))}
              </div>
              {view === 'MOCKUP' ? (
                <div className="flex justify-center rounded-[28px] border border-[#E8DFD3] bg-[#FFFFFF] p-3">
                  <OutfitMockupCanvas
                    garment={garment}
                    primaryColor={look.primaryColor}
                    pantColor={look.pantColor}
                    accessories={evaluation.accessories}
                    character={character}
                    adaptiveNeedCodes={look.needCodes}
                    eventId={look.eventId}
                    weatherId={look.weatherId}
                    remixLevel={look.remixLevel}
                    backgroundTheme={look.eventId === 'EVENT_FESTIVAL' || look.eventId === 'EVENT_TET' ? 'GARDEN_SPRING' : look.eventId === 'EVENT_CULTURAL' || look.eventId === 'EVENT_WEDDING' ? 'HERITAGE_PALACE' : 'MINIMAL_STUDIO'}
                    compact
                  />
                </div>
              ) : (
                <AiRenderPanel
                  state={render}
                  garmentName={garment.name}
                  canUseReference={false}
                  useReference={false}
                  imageRenderAvailable={imageRenderAvailable}
                  onToggleReference={() => undefined}
                  onGenerate={() => void generateImage()}
                />
              )}
              <div className="flex items-center gap-2 rounded-2xl border border-[#E8DFD3] bg-[#FFFFFF] p-3">
                <Palette className="size-4 text-[#7A6F66]" aria-hidden="true" />
                {[look.primaryColor, look.pantColor, ...evaluation.accessories.map((a) => a.colors[0])].filter(Boolean).slice(0, 6).map((hex, i) => (
                  <span key={`${hex}-${i}`} className="size-7 rounded-full border border-[#E8DFD3]" style={{ backgroundColor: hex }} title={colorNameFor(hex!)} />
                ))}
                <span className="ml-auto text-xs text-[#7A6F66]">{isOriginal ? design.colorName : colorNameFor(look.primaryColor, garment)}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button type="button" onClick={() => onEditLook(look)} className="press inline-flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-2xl border border-[#E8DFD3] bg-[#FFFFFF] text-xs font-semibold text-[#1E3443] hover:bg-[#FAF6F0]">
                  <SlidersHorizontal className="size-4" aria-hidden="true" /> Chỉnh tiếp
                </button>
                <button type="button" onClick={() => onOpen3D(look)} className="press inline-flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-2xl border border-[#E8DFD3] bg-[#FFFFFF] text-xs font-semibold text-[#1E3443] hover:bg-[#FAF6F0]">
                  <Box className="size-4" aria-hidden="true" /> Xem 3D
                </button>
                <button type="button" onClick={() => void run()} disabled={busy} className="press inline-flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-2xl border border-[#E8DFD3] bg-[#FFFFFF] text-xs font-semibold text-[#1E3443] hover:bg-[#FAF6F0] disabled:opacity-50">
                  <RefreshCw className="size-4" aria-hidden="true" /> Phối lại
                </button>
              </div>
            </div>

            {/* Explanation */}
            <div className="space-y-4 lg:col-span-7">
              <div className="rounded-[28px] border border-[#E8DFD3] bg-[#FFFFFF] p-5 sm:p-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#C4553F]">{design.usedFallback ? 'Vstyle gợi ý' : 'Gemini thiết kế'}</p>
                <h2 className="mt-1 font-serif text-2xl font-bold leading-snug text-[#1E3443] sm:text-3xl">{isOriginal ? design.title : `${garment.name.replace(/\s*\(.*\)$/, '')} · phương án khác`}</h2>
                <p className="mt-2 text-[15px] leading-relaxed text-[#4A423B]">{design.concept}</p>

                {design.matched.length > 0 && (
                  <ul className="mt-4 space-y-2">
                    {design.matched.map((m) => (
                      <li key={m.asked} className="flex gap-3 rounded-2xl bg-[#F3F6F1] p-3 text-sm">
                        <Check className="mt-0.5 size-4 shrink-0 text-[#4F7350]" aria-hidden="true" />
                        <span><strong className="text-[#1E3443]">“{m.asked}”</strong> <span className="text-[#4A423B]">→ {m.howMet}</span></span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[24px] border border-[#E8DFD3] bg-[#FFFFFF] p-5">
                  <h3 className="flex items-center gap-2 font-serif text-lg font-bold text-[#1E3443]"><Sparkles className="size-4 text-[#C4553F]" aria-hidden="true" /> Vì sao nên chọn</h3>
                  <ul className="mt-2 space-y-2 text-sm leading-relaxed text-[#4A423B]">
                    {design.whyThis.map((line) => <li key={line}>• {line}</li>)}
                    <li>• {design.colorStory}</li>
                  </ul>
                </div>
                <div className="rounded-[24px] border border-[#E8DFD3] bg-[#FFFFFF] p-5">
                  <h3 className="flex items-center gap-2 font-serif text-lg font-bold text-[#1E3443]"><Check className="size-4 text-[#4F7350]" aria-hidden="true" /> Phụ kiện nên đi kèm</h3>
                  {evaluation.accessories.length ? (
                    <ul className="mt-2 space-y-2 text-sm leading-relaxed text-[#4A423B]">
                      {evaluation.accessories.map((a) => (
                        <li key={a.id} className="flex gap-2">
                          <span className="mt-1.5 size-3 shrink-0 rounded-full border border-[#E8DFD3]" style={{ backgroundColor: a.colors[0] }} aria-hidden="true" />
                          {design.accessoryNotes.find((n) => n.id === a.id)?.reason ?? a.name}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-[#7A6F66]">Bản phối này đẹp nhất khi để tối giản.</p>
                  )}
                </div>
                <div className="rounded-[24px] border border-[#E8DFD3] bg-[#FFFFFF] p-5">
                  <h3 className="flex items-center gap-2 font-serif text-lg font-bold text-[#1E3443]"><Backpack className="size-4 text-[#1E3443]" aria-hidden="true" /> Nên mang theo</h3>
                  <ul className="mt-2 space-y-2 text-sm leading-relaxed text-[#4A423B]">
                    {design.packingTips.map((tip) => <li key={tip}>• {tip}</li>)}
                  </ul>
                </div>
                <div className="rounded-[24px] border border-[#E8DFD3] bg-[#FFFFFF] p-5">
                  <h3 className="flex items-center gap-2 font-serif text-lg font-bold text-[#1E3443]"><Lightbulb className="size-4 text-[#D4A338]" aria-hidden="true" /> Mẹo mặc đẹp</h3>
                  <ul className="mt-2 space-y-2 text-sm leading-relaxed text-[#4A423B]">
                    {design.stylingTips.map((tip) => <li key={tip}>• {tip}</li>)}
                  </ul>
                  {design.avoid.length > 0 && (
                    <p className="mt-3 flex gap-2 rounded-xl bg-[#FBF1EC] p-2.5 text-xs leading-relaxed text-[#8B3A2B]">
                      <TriangleAlert className="size-4 shrink-0" aria-hidden="true" /> {design.avoid.join(' · ')}
                    </p>
                  )}
                </div>
              </div>

              {design.alternatives.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-[#1E3443]">Phương án khác:</span>
                  {[{ garmentId: design.garmentId, primaryColor: design.primaryColor, reason: 'Bản gốc' }, ...design.alternatives].map((alt) => {
                    const g = getGarmentById(alt.garmentId);
                    const active = look.garmentId === alt.garmentId;
                    return g ? (
                      <button
                        key={alt.garmentId}
                        type="button"
                        title={alt.reason}
                        onClick={() => useAlternative(alt.garmentId, alt.primaryColor)}
                        className={`press inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition ${active ? 'border-[#1E3443] bg-[#1E3443] text-[#FFFFFF]' : 'border-[#E8DFD3] bg-[#FFFFFF] text-[#1E3443] hover:bg-[#FAF6F0]'}`}
                      >
                        <span className="size-3.5 rounded-full border border-white/50" style={{ backgroundColor: alt.primaryColor }} aria-hidden="true" />
                        {g.name.replace(/\s*\(.*\)$/, '')}
                      </button>
                    ) : null;
                  })}
                </div>
              )}
              {design.usedFallback && (
                <p className="text-xs italic text-[#8A8075]">Gemini chưa bật trên máy chủ — kết quả do bộ phối tất định của Vstyle tạo từ chính câu mô tả của bạn.</p>
              )}
            </div>
          </div>

          <OutfitReview look={look} evaluation={evaluation} showToast={showToast} onSaved={onSaved} onPost={onPost} onShare={onShare} />
        </div>
      )}
    </div>
  );
};
