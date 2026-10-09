/**
 * Adaptive Fashion — 3 steps: 1. Tình trạng → 2. Chọn áo → 3. Kết quả.
 * Every adjustment is checked against the garment's cultural identity, with one-tap
 * alternatives; fine-tuning, measurements and the tailoring sheet stay one click away.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Box, Check, ChevronDown, ClipboardList, ShieldCheck, Sparkles } from 'lucide-react';
import type { CharacterItem } from '../types/fashion';
import type { AdaptiveNeed, FunctionalNeedCode, Garment, Outfit } from '../types/domain';
import type { GeminiAdaptiveResponse } from '../types/gemini';
import { OutfitMockupCanvas } from './OutfitMockupCanvas';
import { OutfitReview } from './OutfitReview';
import { PageHeader } from './PageHeader';
import { SealStamp } from './ui/SealStamp';
import { Dialog } from './ui/Dialog';
import { TechPackSheet, MEASUREMENT_FIELDS, type Measurements } from './TechPackSheet';
import { getAdaptiveNeeds, getApprovedAccessories, getApprovedGarments, getCharacters } from '../lib/dal';
import { checkAdaptive } from '../lib/adaptive/ruleEngine';
import { CLOSURE_LABELS, NEED_PRESETS, STANDARD_ADJUSTMENTS, combineAdjustments, presetFor, type AdaptiveAdjustments, type ClosureType } from '../lib/adaptive/presets';
import { applyAllFixes, checkAdaptiveCulture } from '../lib/adaptive/cultureGuard';
import { requestAdaptiveAdvice } from '../lib/gemini/client';
import { evaluateLook, type Look } from '../lib/look';
import { STYLING_KITS, combineKits } from '../lib/adaptive/stylingKits';
import type { Annotation } from '../lib/visualization/editorial/Annotations';

interface AdaptiveStudioProps {
  initialNeedCodes?: FunctionalNeedCode[];
  initialGarmentId?: string;
  eventId?: string;
  showToast: (msg: string) => void;
  onOpen3D?: (look: Look) => void;
  onSaved: () => void;
  onPost: (outfit: Outfit) => void;
  onShare: (outfit: Outfit) => void;
}

type Step = 1 | 2 | 3;

const MEASUREMENTS_KEY = 'vstyle.adaptive.measurements';
const EMPTY_MEASUREMENTS: Measurements = { height: '', chest: '', waist: '', hip: '', sleeve: '', seatedHeight: '', thigh: '', note: '' };

const CLOSURE_SHORT: Record<ClosureType, string> = { MAGNETIC: 'Nam châm ẩn', VELCRO: 'Nẹp dán ẩn', ZIPPER: 'Khóa sườn', BUTTON: 'Cúc' };

const LEVEL = {
  KEEP: { box: 'border-[#CDE0C9] bg-[#F1F6EF]', text: 'text-[#3D6B35]' },
  CONSIDER: { box: 'border-[#E4D1B5] bg-[#FBF4E8]', text: 'text-[#8A5E17]' },
  WARNING: { box: 'border-[#F0CDCB] bg-[#FBEFEE]', text: 'text-[#8B1E2B]' },
} as const;

export const AdaptiveStudio: React.FC<AdaptiveStudioProps> = ({
  initialNeedCodes,
  initialGarmentId,
  eventId = 'EVENT_YEARBOOK',
  showToast,
  onOpen3D,
  onSaved,
  onPost,
  onShare,
}) => {
  const garments = useMemo(() => getApprovedGarments(), []);
  const characters = useMemo(() => getCharacters(), []);
  const allAccessories = useMemo(() => getApprovedAccessories(), []);
  const needByCode = useMemo(() => new Map(getAdaptiveNeeds().map((n) => [n.code, n])), []);

  const [step, setStep] = useState<Step>(initialNeedCodes?.length ? 2 : 1);
  const [needCodes, setNeedCodes] = useState<FunctionalNeedCode[]>(initialNeedCodes ?? []);
  const [garment, setGarment] = useState<Garment>(() => garments.find((g) => g.id === initialGarmentId) ?? garments[0]);
  const [colorHex, setColorHex] = useState<string>(() => (garments.find((g) => g.id === initialGarmentId) ?? garments[0]).baseColors[0].hex);
  const [adj, setAdj] = useState<AdaptiveAdjustments>(() => combineAdjustments(initialNeedCodes ?? []));
  const [guideTab, setGuideTab] = useState<string>('');
  const [showTune, setShowTune] = useState(false);
  const [measurements, setMeasurements] = useState<Measurements>(EMPTY_MEASUREMENTS);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [advice, setAdvice] = useState<GeminiAdaptiveResponse | null>(null);
  const [adviceLoading, setAdviceLoading] = useState(false);
  const [kitOff, setKitOff] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(MEASUREMENTS_KEY);
      if (raw) setMeasurements({ ...EMPTY_MEASUREMENTS, ...JSON.parse(raw) });
    } catch {
      // storage unavailable
    }
  }, []);
  useEffect(() => {
    try {
      window.localStorage.setItem(MEASUREMENTS_KEY, JSON.stringify(measurements));
    } catch {
      // storage unavailable
    }
  }, [measurements]);
  useEffect(() => setAdvice(null), [adj, garment, needCodes]);
  useEffect(() => setKitOff([]), [garment, needCodes]);

  const isSeated = needCodes.includes('WHEELCHAIR_SEATED');
  const selectedNeeds = needCodes.map((c) => needByCode.get(c)).filter((n): n is AdaptiveNeed => Boolean(n));
  const guard = useMemo(() => checkAdaptiveCulture(garment, adj, needCodes.length > 0), [garment, adj, needCodes]);
  const verified = useMemo(() => needCodes.map((c) => checkAdaptive(c, garment.id)), [needCodes, garment]);
  const colorName = garment.baseColors.find((c) => c.hex === colorHex)?.name;
  const guides = needCodes.map(presetFor).filter((p): p is NonNullable<typeof p> => Boolean(p));
  const activeGuide = guides.find((g) => g.code === guideTab) ?? guides[0];
  const flags = guard.items.filter((i) => i.level !== 'KEEP');
  const keeps = guard.items.filter((i) => i.level === 'KEEP');

  const kit = useMemo(() => combineKits(needCodes, garment, allAccessories), [needCodes, garment, allAccessories]);
  const kitAccessories = kit.picks.filter((p) => !kitOff.includes(p.accessoryId)).map((p) => p.accessory);
  const needIcon = (code: FunctionalNeedCode) => presetFor(code)?.icon ?? '';
  const annotations: Annotation[] = [
    adj.frontHemReduction ? { kind: 'hem' as const, label: `−${adj.frontHemReduction} cm` } : null,
    adj.slitPosition && !isSeated ? { kind: 'slit' as const, label: `Xẻ +${adj.slitPosition}` } : null,
    adj.sleeveWidth || adj.sleeveLength ? { kind: 'sleeve' as const, label: adj.sleeveWidth ? `Tay +${adj.sleeveWidth}` : `Tay ${adj.sleeveLength}` } : null,
    adj.closureType !== 'BUTTON' ? { kind: 'closure' as const, label: CLOSURE_SHORT[adj.closureType] } : null,
    adj.openingWidth ? { kind: 'opening' as const, label: `Cổ +${adj.openingWidth}` } : null,
  ].filter((a): a is Annotation => Boolean(a));

  const character = useMemo<CharacterItem>(() => {
    const seatedChar = characters.find((c) => c.heightCategory === 'SEATED') ?? characters[0];
    return isSeated ? { ...seatedChar, posture: 'WHEELCHAIR_SEATED' } : { ...characters[0], posture: 'STANDING' };
  }, [characters, isSeated]);

  const look: Look = useMemo(() => ({
    garmentId: garment.id,
    primaryColor: colorHex,
    pantColor: '#F4F0E8',
    accessoryIds: kitAccessories.map((a) => a.id),
    eventId,
    weatherId: 'WEATHER_PLEASANT',
    styleId: 'TOI_GIAN',
    characterId: character.id,
    needCodes,
    title: `${garment.name.replace(/\s*\(.*\)$/, '')} · May đo thích ứng`,
    concept: `Bản may đo cho: ${guides.map((g) => g.shortName.toLowerCase()).join(', ') || 'phom chuẩn'}.`,
    origin: 'ADAPTIVE',
  }), [garment, colorHex, eventId, character, needCodes, guides, kitAccessories]);
  const evaluation = useMemo(() => evaluateLook(look), [look]);

  const toggleNeed = (code: FunctionalNeedCode) => {
    const next = needCodes.includes(code) ? needCodes.filter((c) => c !== code) : [...needCodes, code];
    setNeedCodes(next);
    setAdj(combineAdjustments(next));
  };
  const update = (patch: Partial<AdaptiveAdjustments>) => setAdj((a) => ({ ...a, ...patch }));

  const changes = [
    adj.frontHemReduction ? { title: `Vạt trước ngắn ${adj.frontHemReduction} cm`, why: isSeated ? 'Không chạm bánh xe, ngồi gọn' : 'Đứng lên ngồi xuống không dẫm tà' } : null,
    adj.slitPosition ? { title: `Xẻ sườn cao thêm ${adj.slitPosition} cm`, why: 'Tà buông đều khi ngồi, hông không bị kéo' } : null,
    adj.sleeveWidth ? { title: `Ống tay / nách rộng thêm ${adj.sleeveWidth} cm`, why: 'Xỏ tay dễ, không cần giơ cao' } : null,
    adj.sleeveLength < 0 ? { title: `Tay áo ngắn ${Math.abs(adj.sleeveLength)} cm`, why: 'Cổ tay rảnh khi đẩy xe, cầm nắm' } : null,
    adj.openingWidth ? { title: `Cổ / vạt mở thêm ${adj.openingWidth} cm`, why: 'Tròng áo nhẹ nhàng' } : null,
    adj.closureType !== 'BUTTON' ? { title: CLOSURE_LABELS[adj.closureType], why: 'Tự mặc độc lập, cúc trang trí vẫn giữ' } : null,
  ].filter((c): c is { title: string; why: string } => Boolean(c));

  const askGemini = async () => {
    setAdviceLoading(true);
    try {
      setAdvice(await requestAdaptiveAdvice({ garmentId: garment.id, needCodes, adjustments: { ...adj }, eventId }));
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Chưa lấy được lời khuyên.');
    } finally {
      setAdviceLoading(false);
    }
  };

  const stepper = (
    <ol className="flex items-center gap-2 text-sm" aria-label="Các bước">
      {([[1, 'Tình trạng'], [2, 'Chọn áo'], [3, 'Kết quả']] as const).map(([n, label], i) => {
        const reachable = n === 1 || (n === 2 && needCodes.length > 0) || (n === 3 && needCodes.length > 0);
        return (
          <li key={n} className="flex items-center gap-2">
            {i > 0 && <span className="h-px w-5 bg-[#D8CCBA] sm:w-8" aria-hidden="true" />}
            <button
              type="button"
              disabled={!reachable}
              onClick={() => setStep(n)}
              aria-current={step === n ? 'step' : undefined}
              className={`press inline-flex items-center gap-2 rounded-full py-1 pl-1 pr-3 font-semibold transition disabled:opacity-40 ${step === n ? 'bg-[#3D6B35] text-[#FFFFFF]' : 'text-[#3D6B35]'}`}
            >
              <span className={`grid size-6 place-items-center rounded-full text-xs ${step === n ? 'bg-[#FFFFFF] text-[#3D6B35]' : step > n ? 'bg-[#3D6B35] text-[#FFFFFF]' : 'border border-[#3D6B35]'}`}>{step > n ? '✓' : n}</span>
              <span className="hidden sm:inline">{label}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );

  const tuneSlider = (id: string, name: string, value: number, min: number, max: number, onChange: (v: number) => void, unit = 'cm') => (
    <label htmlFor={id} className="block space-y-1">
      <span className="flex justify-between text-sm"><span className="text-[#1E3443]">{name}</span><span className="font-mono text-[#7A6F66]">{value > 0 && min < 0 ? '+' : ''}{value} {unit}</span></span>
      <input id={id} type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-[#3D6B35]" />
    </label>
  );

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Khám phá · Adaptive Fashion"
        title="Việt phục vừa với mọi cơ thể"
        subtitle="Chọn tình trạng của bạn — Vstyle điều chỉnh rập áo mà vẫn giữ đúng bản sắc."
        aside={stepper}
      />

      {/* STEP 1 — Needs */}
      {step === 1 && (
        <section className="space-y-5 animate-rise" aria-labelledby="need-title">
          <h2 id="need-title" className="font-serif text-2xl font-bold text-[#1E3443]">Bạn cần hỗ trợ điều gì? <span className="text-base font-normal text-[#7A6F66]">(chọn một hoặc nhiều)</span></h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {NEED_PRESETS.map((p) => {
              const on = needCodes.includes(p.code);
              return (
                <button
                  key={p.code}
                  type="button"
                  role="checkbox"
                  aria-checked={on}
                  onClick={() => toggleNeed(p.code)}
                  className={`press relative flex items-start gap-4 rounded-[24px] border p-5 text-left transition ${on ? 'border-[#3D6B35] bg-[#EEF4EC] ring-1 ring-[#3D6B35]' : 'border-[#E8DFD3] bg-[#FFFFFF] hover:border-[#3D6B35]/40'}`}
                >
                  <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#F1F6EF] text-2xl" aria-hidden="true">{p.icon}</span>
                  <span>
                    <span className="block text-base font-bold text-[#1E3443]">{p.shortName}</span>
                    <span className="mt-1 block text-sm leading-snug text-[#5C5248]">{p.tagline}</span>
                    <span className="mt-2 inline-block rounded-full bg-[#FBF4E8] px-2.5 py-0.5 text-xs font-semibold text-[#8A5E17]">Phối kèm: {STYLING_KITS[p.code].title.toLowerCase()}</span>
                  </span>
                  {on && <Check className="absolute right-4 top-4 size-5 text-[#3D6B35]" aria-hidden="true" />}
                </button>
              );
            })}
          </div>
          <p className="text-sm text-[#7A6F66]">Vstyle chỉ dùng thông tin bạn tự chọn, không suy đoán từ ảnh hay cơ thể.</p>
          <div className="flex justify-end">
            <button type="button" disabled={!needCodes.length} onClick={() => setStep(2)} className="press inline-flex min-h-12 items-center gap-2 rounded-full bg-[#3D6B35] px-7 font-semibold text-[#FFFFFF] disabled:opacity-40">
              Tiếp: chọn áo <ArrowRight className="size-4" aria-hidden="true" />
            </button>
          </div>
        </section>
      )}

      {/* STEP 2 — Garment */}
      {step === 2 && (
        <section className="space-y-5 animate-rise" aria-labelledby="garment-title">
          <h2 id="garment-title" className="font-serif text-2xl font-bold text-[#1E3443]">Bạn muốn mặc áo nào?</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {garments.map((g) => {
              const on = g.id === garment.id;
              return (
                <button
                  key={g.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => {
                    setGarment(g);
                    setColorHex(g.baseColors[0].hex);
                  }}
                  className={`press overflow-hidden rounded-[22px] border text-left transition ${on ? 'border-[#3D6B35] ring-1 ring-[#3D6B35]' : 'border-[#E8DFD3] hover:border-[#3D6B35]/40'} bg-[#FFFFFF]`}
                >
                  <div className="pointer-events-none bg-[#FAF6F0]">
                    <OutfitMockupCanvas garment={g} primaryColor={g.baseColors[0].hex} pantColor="#F4F0E8" accessories={[]} character={character} adaptiveAdjustments={STANDARD_ADJUSTMENTS} compact />
                  </div>
                  <p className="px-3 py-2.5 text-sm font-semibold text-[#1E3443]">{g.name.replace(/\s*\(.*\)$/, '')}</p>
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-[#1E3443]">Màu:</span>
            {garment.baseColors.map((c) => (
              <button key={c.hex} type="button" title={c.name} aria-label={c.name} aria-pressed={c.hex === colorHex} onClick={() => setColorHex(c.hex)} className={`press size-8 rounded-full border-2 ${c.hex === colorHex ? 'border-[#1E3443] ring-2 ring-[#3D6B35]/40 ring-offset-2' : 'border-[#FFFFFF] shadow-[0_0_0_1px_#E8DFD3]'}`} style={{ backgroundColor: c.hex }} />
            ))}
          </div>
          <div className="flex justify-between">
            <button type="button" onClick={() => setStep(1)} className="press inline-flex min-h-12 items-center gap-2 rounded-full px-5 font-semibold text-[#3D6B35]"><ArrowLeft className="size-4" aria-hidden="true" /> Quay lại</button>
            <button type="button" onClick={() => setStep(3)} className="press inline-flex min-h-12 items-center gap-2 rounded-full bg-[#3D6B35] px-7 font-semibold text-[#FFFFFF]">
              Xem bản may đo <ArrowRight className="size-4" aria-hidden="true" />
            </button>
          </div>
        </section>
      )}

      {/* STEP 3 — Result */}
      {step === 3 && (
        <div className="space-y-6 animate-rise">
          <div className="grid gap-6 lg:grid-cols-12">
            <section className="space-y-3 lg:sticky lg:top-24 lg:col-span-6 lg:self-start" aria-label="So sánh trước và sau">
              <div className="grid grid-cols-5 items-end gap-3">
                <figure className="col-span-2 space-y-2">
                  <div className="overflow-hidden rounded-[22px] border border-[#E8DFD3] bg-[#FAF6F0] opacity-90">
                    <OutfitMockupCanvas garment={garment} primaryColor={colorHex} pantColor="#F4F0E8" accessories={[]} character={character} adaptiveAdjustments={STANDARD_ADJUSTMENTS} compact />
                  </div>
                  <figcaption className="text-center text-sm font-semibold text-[#7A6F66]">Phom chuẩn</figcaption>
                </figure>
                <figure className="col-span-3 space-y-2">
                  <div className="overflow-hidden rounded-[22px] border-2 border-[#3D6B35] bg-[#FAF6F0]">
                    <OutfitMockupCanvas garment={garment} primaryColor={colorHex} pantColor="#F4F0E8" accessories={kitAccessories} character={character} adaptiveAdjustments={adj} eventId={eventId} annotations={annotations} compact />
                  </div>
                  <figcaption className="text-center text-sm font-semibold text-[#3D6B35]">May & phối cho bạn</figcaption>
                </figure>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button type="button" onClick={() => setSheetOpen(true)} className="press inline-flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-2xl bg-[#3D6B35] text-xs font-semibold text-[#FFFFFF]">
                  <ClipboardList className="size-4" aria-hidden="true" /> Phiếu may đo
                </button>
                {onOpen3D && (
                  <button type="button" onClick={() => onOpen3D(look)} className="press inline-flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-2xl border border-[#E8DFD3] bg-[#FFFFFF] text-xs font-semibold text-[#1E3443]">
                    <Box className="size-4" aria-hidden="true" /> Xem 3D
                  </button>
                )}
                <button type="button" onClick={() => void askGemini()} disabled={adviceLoading} className="press inline-flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-2xl border border-[#E8DFD3] bg-[#FFFFFF] text-xs font-semibold text-[#1E3443] disabled:opacity-50">
                  <Sparkles className="size-4 text-[#C4553F]" aria-hidden="true" /> {adviceLoading ? 'Đang viết…' : 'Lời khuyên AI'}
                </button>
              </div>
              {advice && (
                <div className="space-y-2 rounded-[22px] border border-[#E8DFD3] bg-[#FFFFFF] p-4 animate-rise">
                  <p className="font-serif text-lg font-bold italic text-[#1E3443]">“{advice.headline}”</p>
                  <p className="text-sm leading-relaxed text-[#4A423B]">{advice.explanation}</p>
                  {advice.tailorQuestions.length > 0 && <p className="text-xs text-[#5C5248]"><strong>Hỏi thợ may:</strong> {advice.tailorQuestions.join(' · ')}</p>}
                  <p className="text-[11px] italic text-[#8A8075]">{advice.usedFallback ? 'Lời khuyên mẫu (Gemini chưa bật).' : 'Viết bởi Gemini dựa trên thông số và kết quả văn hóa.'}</p>
                </div>
              )}
            </section>

            <section className="space-y-4 lg:col-span-6">
              <div className="rounded-[24px] border border-[#E4D1B5] bg-[#FFFDF9] p-5">
                <h2 className="font-serif text-xl font-bold text-[#1E3443]">Phối đồ dành riêng cho bạn</h2>
                <p className="mt-1 text-sm text-[#5C5248]">{kit.tips.map((t) => `${needIcon(t.code)} ${t.title}`).join(' · ')}</p>
                {kit.picks.length > 0 ? (
                  <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                    {kit.picks.map((p) => {
                      const on = !kitOff.includes(p.accessoryId);
                      return (
                        <li key={p.accessoryId}>
                          <button
                            type="button"
                            aria-pressed={on}
                            onClick={() => setKitOff((off) => (on ? [...off, p.accessoryId] : off.filter((id) => id !== p.accessoryId)))}
                            className={`press flex h-full w-full items-start gap-3 rounded-2xl border p-3 text-left transition ${on ? 'border-[#3D6B35] bg-[#F1F6EF]' : 'border-[#E8DFD3] bg-[#FFFFFF] opacity-70'}`}
                          >
                            <span className="mt-0.5 size-4 shrink-0 rounded-full border-2 border-[#FFFFFF] shadow-[0_0_0_1px_#D8CCBA]" style={{ backgroundColor: p.accessory.colors[0] }} aria-hidden="true" />
                            <span className="min-w-0 text-sm">
                              <strong className="block text-[#1E3443]">{p.accessory.name.replace(/\s*\(.*\)$/, '')} <span className="font-normal">{p.needs.map(needIcon).join('')}</span></strong>
                              <span className="text-xs leading-snug text-[#5C5248]">{p.why}</span>
                            </span>
                            {on && <Check className="ml-auto size-4 shrink-0 text-[#3D6B35]" aria-hidden="true" />}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-[#5C5248]">Áo này đẹp nhất khi để tối giản — không cần thêm phụ kiện.</p>
                )}
                {kit.avoid.length > 0 && (
                  <details className="mt-3 rounded-2xl bg-[#FBEFEE] p-3 text-sm">
                    <summary className="cursor-pointer font-semibold text-[#8B1E2B]">Nên để ở nhà ({kit.avoid.length})</summary>
                    <ul className="mt-2 space-y-1.5">
                      {kit.avoid.map((a) => (
                        <li key={a.accessoryId} className="text-xs leading-snug text-[#4A423B]"><strong>{a.accessory.name.replace(/\s*\(.*\)$/, '')}</strong> — {a.why}</li>
                      ))}
                    </ul>
                  </details>
                )}
                {kit.tips.length > 0 && <p className="mt-3 text-xs italic text-[#7A6F66]">💡 {kit.tips.map((t) => t.tip).join(' ')}</p>}
              </div>

              <div className="rounded-[24px] border border-[#E8DFD3] bg-[#FFFFFF] p-5">
                <h2 className="font-serif text-xl font-bold text-[#1E3443]">Đã điều chỉnh cho bạn</h2>
                <ul className="mt-3 space-y-2">
                  {changes.map((c) => (
                    <li key={c.title} className="flex items-start gap-3 rounded-2xl bg-[#F3F6F1] p-3">
                      <Check className="mt-0.5 size-4 shrink-0 text-[#3D6B35]" aria-hidden="true" />
                      <span className="text-sm"><strong className="text-[#1E3443]">{c.title}</strong><span className="text-[#5C5248]"> — {c.why}</span></span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-[24px] border border-[#E8DFD3] bg-[#FFFFFF] p-5" aria-live="polite">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="flex items-center gap-2 font-serif text-xl font-bold text-[#1E3443]"><ShieldCheck className="size-5 text-[#3D6B35]" aria-hidden="true" /> Bản sắc được giữ</h2>
                    <p className="mt-1 text-sm text-[#5C5248]">{keeps.map((k) => k.title).join(' · ') || 'Phom chuẩn nguyên bản'}</p>
                  </div>
                  <SealStamp score={guard.score} status={guard.status} size="sm" />
                </div>
                {flags.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {flags.map((f) => (
                      <div key={f.id} className={`rounded-2xl border p-3 ${LEVEL[f.level].box}`}>
                        <p className={`text-sm font-semibold ${LEVEL[f.level].text}`}>{f.title}</p>
                        <p className="mt-0.5 text-xs leading-relaxed text-[#4A423B]">{f.detail}</p>
                        {f.fix && <button type="button" onClick={() => update(f.fix!)} className="press mt-2 rounded-lg bg-[#FFFFFF] px-2.5 py-1 text-xs font-semibold text-[#1E3443] shadow-2xs">✓ {f.fixLabel}</button>}
                      </div>
                    ))}
                    <button type="button" onClick={() => { setAdj(applyAllFixes(adj, guard)); showToast('Đã chọn phương án giữ bản sắc.'); }} className="press w-full rounded-2xl bg-[#1E3443] py-2.5 text-sm font-semibold text-[#FFFFFF]">Giữ bản sắc tự động</button>
                  </div>
                )}
              </div>

              {activeGuide && (
                <div className="rounded-[24px] border border-[#E8DFD3] bg-[#FFFFFF] p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="font-serif text-xl font-bold text-[#1E3443]">Cách tự mặc</h2>
                    {guides.length > 1 && (
                      <div className="flex flex-wrap gap-1">
                        {guides.map((g) => (
                          <button key={g.code} type="button" aria-pressed={activeGuide.code === g.code} onClick={() => setGuideTab(g.code)} className={`press rounded-full px-2.5 py-1 text-xs font-semibold ${activeGuide.code === g.code ? 'bg-[#3D6B35] text-[#FFFFFF]' : 'border border-[#E8DFD3] text-[#5C5248]'}`}>{g.icon} {g.shortName}</button>
                        ))}
                      </div>
                    )}
                  </div>
                  <ol className="mt-3 space-y-2">
                    {activeGuide.dressingSteps.map((s, i) => (
                      <li key={s} className="flex gap-3 text-sm text-[#1E3443]"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#E5EDE2] text-xs font-bold text-[#3D6B35]">{i + 1}</span><span className="pt-0.5 leading-relaxed">{s}</span></li>
                    ))}
                  </ol>
                </div>
              )}

              <div className="rounded-[24px] border border-[#E8DFD3] bg-[#FFFFFF]">
                <button type="button" onClick={() => setShowTune((v) => !v)} aria-expanded={showTune} className="flex w-full items-center justify-between p-5 text-left">
                  <span className="font-serif text-xl font-bold text-[#1E3443]">Tinh chỉnh thêm & số đo</span>
                  <ChevronDown className={`size-5 text-[#7A6F66] transition ${showTune ? 'rotate-180' : ''}`} aria-hidden="true" />
                </button>
                {showTune && (
                  <div className="space-y-4 border-t border-[#F0E9DF] p-5">
                    {tuneSlider('t-hem', 'Rút vạt trước', adj.frontHemReduction, 0, 30, (v) => update({ frontHemReduction: v }))}
                    {tuneSlider('t-slit', 'Nâng xẻ sườn', adj.slitPosition, 0, 25, (v) => update({ slitPosition: v }))}
                    {tuneSlider('t-sl', 'Độ dài tay', adj.sleeveLength, -15, 10, (v) => update({ sleeveLength: v }))}
                    {tuneSlider('t-sw', 'Nới ống tay / nách', adj.sleeveWidth, 0, 15, (v) => update({ sleeveWidth: v }))}
                    {tuneSlider('t-op', 'Độ mở cổ / vạt', adj.openingWidth, 0, 15, (v) => update({ openingWidth: v }))}
                    <div className="flex flex-wrap gap-1.5">
                      {(Object.keys(CLOSURE_LABELS) as ClosureType[]).map((c) => (
                        <button key={c} type="button" aria-pressed={adj.closureType === c} onClick={() => update({ closureType: c })} className={`press rounded-full border px-3 py-1.5 text-xs font-semibold ${adj.closureType === c ? 'border-[#1E3443] bg-[#1E3443] text-[#FFFFFF]' : 'border-[#E8DFD3] text-[#5C5248]'}`}>{CLOSURE_LABELS[c]}</button>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-2 border-t border-[#F0E9DF] pt-4">
                      {MEASUREMENT_FIELDS.filter((f) => !f.seatedOnly || isSeated).map((f) => (
                        <label key={f.key} className="space-y-1 text-xs text-[#5C5248]">
                          <span className="block">{f.label} (cm)</span>
                          <input inputMode="decimal" value={measurements[f.key]} onChange={(e) => setMeasurements((m) => ({ ...m, [f.key]: e.target.value.replace(/[^0-9.,]/g, '').slice(0, 6) }))} className="w-full rounded-xl border border-[#E8DFD3] bg-[#FAF6F0] px-3 py-2 font-mono text-sm text-[#1E3443] outline-none focus:border-[#1E3443]" placeholder="—" />
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>

          <OutfitReview look={look} evaluation={evaluation} showToast={showToast} onSaved={onSaved} onPost={onPost} onShare={onShare} />
          <p className="text-xs text-[#8A8075]">Thông số hỗ trợ thiết kế cá nhân hóa, không phải tiêu chuẩn y khoa. Hãy thử áo ở tư thế sử dụng thực tế trước khi hoàn thiện.</p>
        </div>
      )}

      {sheetOpen && (
        <Dialog bare size="4xl" title="Phiếu may đo thích ứng" onClose={() => setSheetOpen(false)}>
          <TechPackSheet
            garment={garment}
            colorHex={colorHex}
            colorName={colorName}
            needs={selectedNeeds}
            adjustments={adj}
            guard={guard}
            verified={verified}
            measurements={measurements}
            dressingSteps={guides.map((g) => ({ need: g.shortName, steps: g.dressingSteps }))}
            onClose={() => setSheetOpen(false)}
            onCopy={(text) => void navigator.clipboard?.writeText(text).then(() => showToast('Đã sao chép phiếu may đo.')).catch(() => showToast('Trình duyệt không cho phép sao chép.'))}
          />
        </Dialog>
      )}
    </div>
  );
};
