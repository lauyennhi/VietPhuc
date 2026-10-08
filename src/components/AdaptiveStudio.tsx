/**
 * Adaptive Fashion studio — "Việt phục vừa với mọi cơ thể, không đánh đổi bản sắc".
 * Users pick one or more functional needs (self-declared), a garment and colour, fine-tune
 * the pattern, and every adjustment is checked live against the garment's cultural identity.
 */

import React, { useEffect, useMemo, useState } from 'react';
import type { CharacterItem } from '../types/fashion';
import type { AdaptiveNeed, FunctionalNeedCode, Garment } from '../types/domain';
import type { GeminiAdaptiveResponse } from '../types/gemini';
import { OutfitMockupCanvas } from './OutfitMockupCanvas';
import { SealStamp } from './ui/SealStamp';
import { Dialog } from './ui/Dialog';
import { TechPackSheet, MEASUREMENT_FIELDS, type Measurements } from './TechPackSheet';
import { getAdaptiveNeeds, getApprovedGarments, getCharacters } from '../lib/dal';
import { checkAdaptive } from '../lib/adaptive/ruleEngine';
import {
  CLOSURE_LABELS,
  NEED_PRESETS,
  STANDARD_ADJUSTMENTS,
  combineAdjustments,
  presetFor,
  type AdaptiveAdjustments,
  type ClosureType,
} from '../lib/adaptive/presets';
import { applyAllFixes, checkAdaptiveCulture, type GuardItem } from '../lib/adaptive/cultureGuard';
import { requestAdaptiveAdvice } from '../lib/gemini/client';

interface AdaptiveStudioProps {
  initialNeedCodes?: FunctionalNeedCode[];
  initialGarmentId?: string;
  eventId?: string;
  onApplyAdaptiveOutfit?: (garment: Garment, needCodes: FunctionalNeedCode[], colorHex: string) => void;
  onOpen3D?: (garment: Garment, colorHex: string, needCodes: FunctionalNeedCode[]) => void;
  showToast: (msg: string) => void;
}

const MEASUREMENTS_KEY = 'vstyle.adaptive.measurements';
const EMPTY_MEASUREMENTS: Measurements = { height: '', chest: '', waist: '', hip: '', sleeve: '', seatedHeight: '', thigh: '', note: '' };

function loadMeasurements(): Measurements {
  try {
    const raw = window.localStorage.getItem(MEASUREMENTS_KEY);
    return raw ? { ...EMPTY_MEASUREMENTS, ...JSON.parse(raw) } : EMPTY_MEASUREMENTS;
  } catch {
    return EMPTY_MEASUREMENTS;
  }
}

const LEVEL_STYLE = {
  KEEP: { box: 'border-[#CDE0C9] bg-[#F1F6EF]', dot: 'bg-[#4F7350]', text: 'text-[#3D6B35]', label: 'Giữ trọn' },
  CONSIDER: { box: 'border-[#E4D1B5] bg-[#FBF4E8]', dot: 'bg-[#B7791F]', text: 'text-[#8A5E17]', label: 'Cân nhắc' },
  WARNING: { box: 'border-[#F0CDCB] bg-[#FBEFEE]', dot: 'bg-[#8B1E2B]', text: 'text-[#8B1E2B]', label: 'Cảnh báo' },
} as const;

/* Which guard items relate to which control, to flag the slider itself. */
const CONTROL_FLAGS: Record<string, string[]> = {
  hem: ['hem-too-short'],
  slit: ['slit-high'],
  sleeveLength: ['sleeve-cut', 'sleeve-short', 'sleeve-cropped'],
  sleeveWidth: ['sleeve-chen'],
  opening: ['collar-open', 'nhat-binh-collar'],
  closure: ['closure-zipper', 'closure-parallel'],
};

interface SliderProps {
  id: string;
  label: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  display: string;
  ticks: [string, string, string];
  flag?: GuardItem;
  onChange: (value: number) => void;
}

const AdjustSlider: React.FC<SliderProps> = ({ id, label, hint, value, min, max, display, ticks, flag, onChange }) => {
  const tone = flag ? LEVEL_STYLE[flag.level] : null;
  return (
    <div className={`space-y-2 rounded-2xl border p-4 transition ${tone ? tone.box : 'border-[#E6DCCD] bg-[#FBF8F3]'}`}>
      <div className="flex items-start justify-between gap-3 text-xs">
        <label htmlFor={id} className="font-semibold text-[#1F1B18]">
          {label}
          <span className="mt-0.5 block font-normal text-[#736960]">{hint}</span>
        </label>
        <span className="shrink-0 rounded-lg bg-[#FFFFFF] px-2 py-1 font-mono text-sm font-bold text-[#1F1B18] shadow-2xs">{display}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full cursor-pointer accent-[#4F7350]"
        aria-describedby={flag ? `${id}-flag` : undefined}
      />
      <div className="flex justify-between gap-2 font-mono text-[10px] text-[#736960]">
        <span>{ticks[0]}</span>
        <span className="text-center">{ticks[1]}</span>
        <span className="text-right">{ticks[2]}</span>
      </div>
      {flag && tone && (
        <p id={`${id}-flag`} className={`flex items-start gap-1.5 text-[11px] font-semibold ${tone.text}`}>
          <span className={`mt-1 size-1.5 shrink-0 rounded-full ${tone.dot}`} aria-hidden="true" />
          {flag.title}
        </p>
      )}
    </div>
  );
};

export const AdaptiveStudio: React.FC<AdaptiveStudioProps> = ({
  initialNeedCodes,
  initialGarmentId,
  eventId,
  onApplyAdaptiveOutfit,
  onOpen3D,
  showToast,
}) => {
  const garments = useMemo(() => getApprovedGarments(), []);
  const characters = useMemo(() => getCharacters(), []);
  const needsData = useMemo(() => getAdaptiveNeeds(), []);
  const needByCode = useMemo(() => new Map(needsData.map((n) => [n.code, n])), [needsData]);

  const startNeeds = initialNeedCodes?.length ? initialNeedCodes : (['WHEELCHAIR_SEATED'] as FunctionalNeedCode[]);
  const [needCodes, setNeedCodes] = useState<FunctionalNeedCode[]>(startNeeds);
  const [garment, setGarment] = useState<Garment>(() => garments.find((g) => g.id === initialGarmentId) ?? garments[0]);
  const [colorHex, setColorHex] = useState<string>(() => (garments.find((g) => g.id === initialGarmentId) ?? garments[0]).baseColors[0].hex);
  const [adj, setAdj] = useState<AdaptiveAdjustments>(() => combineAdjustments(startNeeds));
  const [view, setView] = useState<'ADAPTED' | 'COMPARE'>('COMPARE');
  const [guideTab, setGuideTab] = useState<string>(startNeeds[0]);
  const [measurements, setMeasurements] = useState<Measurements>(EMPTY_MEASUREMENTS);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [advice, setAdvice] = useState<GeminiAdaptiveResponse | null>(null);
  const [adviceLoading, setAdviceLoading] = useState(false);

  useEffect(() => setMeasurements(loadMeasurements()), []);
  useEffect(() => {
    try {
      window.localStorage.setItem(MEASUREMENTS_KEY, JSON.stringify(measurements));
    } catch {
      // storage unavailable — measurements stay in memory only
    }
  }, [measurements]);

  const isSeated = needCodes.includes('WHEELCHAIR_SEATED');
  const selectedNeeds = needCodes.map((code) => needByCode.get(code)).filter((n): n is AdaptiveNeed => Boolean(n));
  const guard = useMemo(() => checkAdaptiveCulture(garment, adj, needCodes.length > 0), [garment, adj, needCodes]);
  const verified = useMemo(() => needCodes.map((code) => checkAdaptive(code, garment.id)), [needCodes, garment]);
  const colorName = garment.baseColors.find((c) => c.hex === colorHex)?.name;
  const dressingSteps = needCodes
    .map((code) => presetFor(code))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .map((p) => ({ need: p.shortName, code: p.code, steps: p.dressingSteps }));
  const activeGuide = dressingSteps.find((d) => d.code === guideTab) ?? dressingSteps[0];

  const flagFor = (control: keyof typeof CONTROL_FLAGS) =>
    guard.items.find((item) => item.level !== 'KEEP' && CONTROL_FLAGS[control].includes(item.id));

  // Any edit invalidates a previous Gemini answer.
  useEffect(() => setAdvice(null), [adj, garment, needCodes]);

  const toggleNeed = (code: FunctionalNeedCode) => {
    const next = needCodes.includes(code) ? needCodes.filter((c) => c !== code) : [...needCodes, code];
    setNeedCodes(next);
    setAdj(combineAdjustments(next));
    if (!next.includes(guideTab as FunctionalNeedCode) && next[0]) setGuideTab(next[0]);
    if (next.includes(code)) setGuideTab(code);
  };

  const update = (patch: Partial<AdaptiveAdjustments>) => setAdj((current) => ({ ...current, ...patch }));

  const fixAll = () => {
    setAdj(applyAllFixes(adj, guard));
    showToast('Đã áp dụng phương án giữ bản sắc mà vẫn đáp ứng nhu cầu.');
  };

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

  const explanation = useMemo(() => {
    const parts: string[] = [];
    if (adj.frontHemReduction > 0) {
      parts.push(isSeated
        ? `Rút vạt trước ${adj.frontHemReduction} cm để tà nằm gọn trên đùi, không chạm bánh xe; vạt sau giữ dài buông theo lưng ghế.`
        : `Rút vạt trước ${adj.frontHemReduction} cm giúp bước đi, đứng lên ngồi xuống không dẫm tà.`);
    }
    if (adj.slitPosition > 0) parts.push(`Nâng xẻ sườn ${adj.slitPosition} cm để tà buông đều hai bên khi ngồi, hông và đùi không bị kéo căng.`);
    if (adj.sleeveWidth > 0) parts.push(`Nới ống tay/nách ${adj.sleeveWidth} cm để xỏ tay không cần giơ cao.`);
    if (adj.sleeveLength < 0) parts.push(`Rút tay áo ${Math.abs(adj.sleeveLength)} cm để cổ tay và bàn tay thao tác (đẩy bánh xe, cầm nắm) không vướng.`);
    if (adj.openingWidth > 0) parts.push(`Nới độ mở cổ/vạt ${adj.openingWidth} cm để tròng áo nhẹ nhàng.`);
    if (adj.closureType !== 'BUTTON') parts.push(`${CLOSURE_LABELS[adj.closureType]} giúp tự mặc độc lập; bên ngoài vẫn giữ diện mạo truyền thống.`);
    return parts.length ? parts : ['Áo đang ở phom chuẩn nguyên bản. Chọn nhu cầu để hệ thống gợi ý điều chỉnh.'];
  }, [adj, isSeated]);

  const changeChips = [
    adj.frontHemReduction ? `Vạt trước −${adj.frontHemReduction} cm` : '',
    adj.slitPosition ? `Xẻ sườn +${adj.slitPosition} cm` : '',
    adj.sleeveLength ? `Tay áo ${adj.sleeveLength > 0 ? '+' : '−'}${Math.abs(adj.sleeveLength)} cm` : '',
    adj.sleeveWidth ? `Ống tay +${adj.sleeveWidth} cm` : '',
    adj.openingWidth ? `Độ mở cổ +${adj.openingWidth} cm` : '',
    adj.closureType !== 'BUTTON' ? CLOSURE_LABELS[adj.closureType] : '',
  ].filter(Boolean);

  const seatedCharacter = characters.find((c) => c.heightCategory === 'SEATED');
  const baseCharacter = characters[0];
  const adaptedCharacter = useMemo<CharacterItem>(() => (
    isSeated ? { ...(seatedCharacter ?? baseCharacter), posture: 'WHEELCHAIR_SEATED' } : { ...baseCharacter, posture: 'STANDING' }
  ), [isSeated, seatedCharacter, baseCharacter]);

  const sectionTitle = (step: string, title: string, aside?: React.ReactNode) => (
    <div className="flex items-center justify-between gap-3">
      <h3 className="flex items-center gap-2 text-sm font-bold text-[#1F1B18]">
        <span className="grid size-6 place-items-center rounded-full bg-[#1F1B18] font-mono text-[11px] text-[#FFFFFF]">{step}</span>
        {title}
      </h3>
      {aside}
    </div>
  );

  const closureOptions: Array<{ value: ClosureType; icon: string }> = [
    { value: 'MAGNETIC', icon: '🧲' },
    { value: 'VELCRO', icon: '🩹' },
    { value: 'ZIPPER', icon: '↕' },
    { value: 'BUTTON', icon: '🔘' },
  ];
  const closureFlag = flagFor('closure');

  return (
    <div className="space-y-8 animate-rise">
      {/* ===================== HERO ===================== */}
      <section className="relative overflow-hidden rounded-[32px] border border-[#CDE0C9] bg-[linear-gradient(135deg,#F1F6EF_0%,#FFFFFF_55%,#FBF4E8_100%)] p-6 shadow-[0_4px_24px_-4px_rgba(31,27,24,0.05)] sm:p-8">
        <span aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 size-72 rounded-full border border-[#4F7350]/15" />
        <span aria-hidden="true" className="pointer-events-none absolute -right-4 -top-8 size-44 rounded-full border border-[#4F7350]/10" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#CDE0C9] bg-[#FFFFFF] px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-[#3D6B35]">
              ♿ Adaptive Fashion · May đo hòa nhập
            </span>
            <h2 className="font-serif text-3xl font-bold leading-tight text-[#1F1B18] sm:text-4xl">
              Việt phục vừa với mọi cơ thể —<br className="hidden sm:block" /> <span className="italic text-[#3D6B35]">không đánh đổi bản sắc.</span>
            </h2>
            <p className="text-sm leading-relaxed text-[#5C5248]">
              Chọn nhu cầu của bạn, tinh chỉnh rập áo và xem ngay: mỗi điều chỉnh được đối chiếu với quy tắc văn hóa của từng loại áo — vạt hữu nhậm, cổ đứng, tay thụng, 5 cúc áo tấc… Kết quả là một phiếu may đo mang thẳng đến thợ may.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setIsSheetOpen(true)} className="btn-primary text-xs">📋 Phiếu may đo</button>
            {onOpen3D && (
              <button
                type="button"
                onClick={() => onOpen3D(garment, colorHex, needCodes)}
                className="press inline-flex min-h-11 items-center gap-2 rounded-2xl border border-[#1F1B18] bg-[#FFFFFF] px-4 text-xs font-bold text-[#1F1B18] transition hover:bg-[#F1EADF]"
              >
                🥽 Xem 3D {isSeated ? 'dáng ngồi' : ''}
              </button>
            )}
          </div>
        </div>
        <dl className="relative mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            [String(needsData.length), 'nhóm nhu cầu, chọn nhiều cùng lúc'],
            [String(garments.length), 'loại Việt phục áp dụng được'],
            [String(guard.score), 'điểm bản sắc của bản may đo này'],
            [String(verified.filter((v) => v.validated).length), 'thông số đã kiểm định có nguồn'],
          ].map(([value, label]) => (
            <div key={label} className="rounded-2xl border border-[#E6DCCD] bg-[#FFFFFF]/80 p-3.5 backdrop-blur">
              <dt className="sr-only">{label}</dt>
              <dd className="font-serif text-2xl font-bold text-[#1F1B18]">{value}</dd>
              <dd className="text-[11px] leading-snug text-[#736960]">{label}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12 lg:gap-8">
        {/* ===================== LEFT: NEEDS + GARMENT ===================== */}
        <div className="space-y-6 lg:col-span-5">
          <section className="space-y-4 rounded-[28px] border border-[#E6DCCD] bg-[#FFFFFF] p-5 shadow-xs sm:p-6" aria-labelledby="needs-title">
            {sectionTitle('1', 'Nhu cầu của bạn', <span className="text-[11px] text-[#736960]">Chọn một hoặc nhiều</span>)}
            <p id="needs-title" className="sr-only">Chọn nhu cầu thích ứng</p>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-1">
              {NEED_PRESETS.map((preset) => {
                const data = needByCode.get(preset.code);
                const on = needCodes.includes(preset.code);
                return (
                  <button
                    key={preset.code}
                    type="button"
                    role="checkbox"
                    aria-checked={on}
                    onClick={() => toggleNeed(preset.code)}
                    className={`press flex items-start gap-3 rounded-[20px] border p-3.5 text-left transition ${
                      on ? 'border-[#4F7350] bg-[#EEF4EC] ring-1 ring-[#4F7350]' : 'border-[#E6DCCD] bg-[#FBF8F3] hover:border-[#C9BBA6]'
                    }`}
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-[#E6DCCD] bg-[#FFFFFF] text-xl shadow-2xs" aria-hidden="true">{preset.icon}</span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-[#1F1B18]">{preset.shortName}</span>
                        <span className={`grid size-5 shrink-0 place-items-center rounded-md border text-[11px] font-bold ${on ? 'border-[#4F7350] bg-[#4F7350] text-[#FFFFFF]' : 'border-[#D8CCBA] bg-[#FFFFFF] text-transparent'}`} aria-hidden="true">✓</span>
                      </span>
                      <span className="mt-0.5 block text-[11px] leading-relaxed text-[#736960]">{preset.tagline}</span>
                      {on && data && <span className="mt-1.5 block text-[11px] leading-relaxed text-[#3D6B35]">{data.rationale}</span>}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] leading-relaxed text-[#736960]">
              Vstyle chỉ dùng nhu cầu do bạn tự chọn — không suy đoán từ ảnh hay cơ thể. Bỏ chọn tất cả để xem phom chuẩn.
            </p>
          </section>

          <section className="space-y-4 rounded-[28px] border border-[#E6DCCD] bg-[#FFFFFF] p-5 shadow-xs sm:p-6">
            {sectionTitle('2', 'Y phục & màu')}
            <div className="flex flex-wrap gap-1.5">
              {garments.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  aria-pressed={g.id === garment.id}
                  onClick={() => {
                    setGarment(g);
                    setColorHex(g.baseColors[0].hex);
                  }}
                  className={`press rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
                    g.id === garment.id ? 'border-[#1F1B18] bg-[#1F1B18] text-[#FFFFFF]' : 'border-[#E6DCCD] bg-[#FFFFFF] text-[#5C5248] hover:bg-[#F1EADF]'
                  }`}
                >
                  {g.name.replace(/\s*\(.*\)$/, '')}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {garment.baseColors.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  title={c.name}
                  aria-label={c.name}
                  aria-pressed={c.hex === colorHex}
                  onClick={() => setColorHex(c.hex)}
                  className={`press size-8 rounded-full border-2 transition ${c.hex === colorHex ? 'border-[#1F1B18] ring-2 ring-[#C9A24A] ring-offset-2' : 'border-[#FFFFFF] shadow-[0_0_0_1px_#E6DCCD]'}`}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
              <span className="text-xs text-[#736960]">{colorName}</span>
            </div>
            <div className="rounded-2xl border border-[#E6DCCD] bg-[#FBF8F3] p-3.5">
              <p className="mb-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[#8A5E17]">Đặc trưng không được sai</p>
              <ul className="space-y-1 text-[11px] leading-relaxed text-[#4A423B]">
                {garment.nonNegotiables.map((rule) => (
                  <li key={rule} className="flex gap-1.5"><span className="text-[#8A5E17]" aria-hidden="true">◆</span>{rule}</li>
                ))}
              </ul>
            </div>
          </section>

        </div>

        {/* ===================== RIGHT: PREVIEW + CONTROLS ===================== */}
        <div className="space-y-6 lg:col-span-7 lg:row-span-2">
          <section className="space-y-5 rounded-[28px] border border-[#E6DCCD] bg-[#FFFFFF] p-5 shadow-[0_4px_24px_-4px_rgba(31,27,24,0.05)] sm:p-6">
            {sectionTitle('3', 'Tinh chỉnh rập áo', (
              <div className="flex rounded-xl border border-[#E6DCCD] bg-[#FBF8F3] p-0.5 text-[11px] font-bold" role="tablist" aria-label="Chế độ xem">
                {([['COMPARE', 'Trước / Sau'], ['ADAPTED', 'Bản may đo']] as const).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={view === key}
                    onClick={() => setView(key)}
                    className={`press rounded-lg px-3 py-1.5 transition ${view === key ? 'bg-[#1F1B18] text-[#FFFFFF]' : 'text-[#736960]'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            ))}

            {view === 'COMPARE' ? (
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Phom chuẩn', sub: 'chưa điều chỉnh', adjustments: { ...STANDARD_ADJUSTMENTS }, tone: 'bg-[#F4EFE7] text-[#736960]' },
                  { label: 'May đo cho bạn', sub: `${selectedNeeds.length || 0} nhu cầu`, adjustments: adj, tone: 'bg-[#E5EDE2] text-[#3D6B35]' },
                ].map((panel) => (
                  <figure key={panel.label} className="space-y-2">
                    <div className="overflow-hidden rounded-2xl border border-[#E6DCCD] bg-[#FBF8F3]">
                      <OutfitMockupCanvas
                        garment={garment}
                        primaryColor={colorHex}
                        pantColor="#F4F0E8"
                        accessories={[]}
                        character={adaptedCharacter}
                        adaptiveAdjustments={panel.adjustments}
                        compact
                      />
                    </div>
                    <figcaption className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-bold text-[#1F1B18]">{panel.label}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${panel.tone}`}>{panel.sub}</span>
                    </figcaption>
                  </figure>
                ))}
                {changeChips.length > 0 && (
                  <ul className="col-span-2 flex flex-wrap gap-1.5" aria-label="Khác biệt so với phom chuẩn">
                    {changeChips.map((chip) => (
                      <li key={chip} className="rounded-full border border-[#CDE0C9] bg-[#F1F6EF] px-2.5 py-1 text-[11px] font-semibold text-[#3D6B35]">{chip}</li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <div className="mx-auto w-full max-w-[380px] overflow-hidden rounded-2xl border border-[#E6DCCD] bg-[#FBF8F3]">
                <OutfitMockupCanvas
                  garment={garment}
                  primaryColor={colorHex}
                  pantColor="#F4F0E8"
                  accessories={[]}
                  character={adaptedCharacter}
                  adaptiveNeedCodes={needCodes}
                  adaptiveAdjustments={adj}
                  showHotspots
                />
              </div>
            )}

            <div className="flex items-center justify-between gap-3 border-t border-[#E6DCCD] pt-4">
              <p className="text-xs text-[#736960]">Kéo để chỉnh — thẻ chuyển màu khi chạm giới hạn bản sắc.</p>
              <button type="button" onClick={() => setAdj(combineAdjustments(needCodes))} className="press shrink-0 text-[11px] font-semibold text-[#8A5E17] hover:underline">
                ↺ Về gợi ý ban đầu
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <AdjustSlider id="hem" label="Rút vạt trước" hint="Vạt sau giữ nguyên" value={adj.frontHemReduction} min={0} max={30}
                display={`−${adj.frontHemReduction} cm`} ticks={['0', '15 cm', '30 cm']} flag={flagFor('hem')} onChange={(v) => update({ frontHemReduction: v })} />
              <AdjustSlider id="slit" label="Nâng xẻ sườn" hint="Tà buông đều khi ngồi" value={adj.slitPosition} min={0} max={25}
                display={`+${adj.slitPosition} cm`} ticks={['0', '12 cm', '25 cm']} flag={flagFor('slit')} onChange={(v) => update({ slitPosition: v })} />
              <AdjustSlider id="sleeve-length" label="Độ dài tay áo" hint="Âm = ngắn hơn chuẩn" value={adj.sleeveLength} min={-15} max={10}
                display={`${adj.sleeveLength > 0 ? '+' : ''}${adj.sleeveLength} cm`} ticks={['−15', 'Chuẩn', '+10']} flag={flagFor('sleeveLength')} onChange={(v) => update({ sleeveLength: v })} />
              <AdjustSlider id="sleeve-width" label="Nới ống tay / nách" hint="Xỏ tay không cần giơ cao" value={adj.sleeveWidth} min={0} max={15}
                display={`+${adj.sleeveWidth} cm`} ticks={['0', '8 cm', '15 cm']} flag={flagFor('sleeveWidth')} onChange={(v) => update({ sleeveWidth: v })} />
              <AdjustSlider id="opening" label="Độ mở cổ / vạt" hint="Tròng áo nhẹ nhàng" value={adj.openingWidth} min={0} max={15}
                display={`+${adj.openingWidth} cm`} ticks={['0', '8 cm', '15 cm']} flag={flagFor('opening')} onChange={(v) => update({ openingWidth: v })} />
              <fieldset className={`space-y-2 rounded-2xl border p-4 ${closureFlag ? LEVEL_STYLE[closureFlag.level].box : 'border-[#E6DCCD] bg-[#FBF8F3]'}`}>
                <legend className="sr-only">Cơ chế đóng mở</legend>
                <p className="text-xs font-semibold text-[#1F1B18]">Cơ chế đóng mở<span className="mt-0.5 block font-normal text-[#736960]">Giấu dưới nẹp, giữ cúc trang trí</span></p>
                <div className="grid grid-cols-2 gap-1.5">
                  {closureOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={adj.closureType === option.value}
                      onClick={() => update({ closureType: option.value })}
                      className={`press rounded-xl border px-2 py-2 text-left text-[11px] font-semibold leading-tight transition ${
                        adj.closureType === option.value ? 'border-[#1F1B18] bg-[#1F1B18] text-[#FFFFFF]' : 'border-[#E6DCCD] bg-[#FFFFFF] text-[#5C5248] hover:bg-[#F1EADF]'
                      }`}
                    >
                      <span aria-hidden="true">{option.icon}</span> {CLOSURE_LABELS[option.value]}
                    </button>
                  ))}
                </div>
                {closureFlag && <p className={`text-[11px] font-semibold ${LEVEL_STYLE[closureFlag.level].text}`}>{closureFlag.title}</p>}
              </fieldset>
            </div>
          </section>
        </div>

        <div className="lg:col-span-5">
          <details className="group rounded-[28px] border border-[#E6DCCD] bg-[#FFFFFF] p-5 shadow-xs sm:p-6">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-sm font-bold text-[#1F1B18]">
                <span className="grid size-6 place-items-center rounded-full bg-[#1F1B18] font-mono text-[11px] text-[#FFFFFF]">4</span>
                Số đo cá nhân <span className="font-normal text-[#736960]">(không bắt buộc)</span>
              </span>
              <span className="text-[#736960] transition group-open:rotate-180" aria-hidden="true">▾</span>
            </summary>
            <div className="mt-4 grid grid-cols-2 gap-2.5">
              {MEASUREMENT_FIELDS.filter((f) => !f.seatedOnly || isSeated).map((f) => (
                <label key={f.key} className="space-y-1 text-[11px] font-semibold text-[#5C5248]">
                  <span className="block">{f.label}</span>
                  <span className="flex items-center rounded-xl border border-[#E6DCCD] bg-[#FBF8F3] focus-within:border-[#1F1B18]">
                    <input
                      inputMode="decimal"
                      value={measurements[f.key]}
                      onChange={(e) => setMeasurements((m) => ({ ...m, [f.key]: e.target.value.replace(/[^0-9.,]/g, '').slice(0, 6) }))}
                      className="w-full bg-transparent px-3 py-2 font-mono text-sm text-[#1F1B18] outline-none"
                      placeholder="—"
                    />
                    <span className="pr-3 text-[10px] text-[#736960]">cm</span>
                  </span>
                </label>
              ))}
              <label className="col-span-2 space-y-1 text-[11px] font-semibold text-[#5C5248]">
                <span className="block">Ghi chú cho thợ may</span>
                <textarea
                  value={measurements.note}
                  onChange={(e) => setMeasurements((m) => ({ ...m, note: e.target.value.slice(0, 300) }))}
                  rows={2}
                  className="w-full rounded-xl border border-[#E6DCCD] bg-[#FBF8F3] px-3 py-2 text-xs text-[#1F1B18] outline-none focus:border-[#1F1B18]"
                  placeholder="Ví dụ: dùng xe lăn tay, thích vải mát, cần thử áo tại nhà…"
                />
              </label>
            </div>
            <p className="mt-2 text-[10px] text-[#736960]">Số đo chỉ lưu trên trình duyệt của bạn và in vào phiếu may đo.</p>
          </details>
        </div>
      </div>

      {/* ===================== INSIGHT ROW ===================== */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Culture guardrail */}
        <section className="space-y-4 rounded-[28px] border border-[#E6DCCD] bg-[#FFFFFF] p-5 shadow-xs sm:p-6 lg:col-span-1" aria-live="polite">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#8A5E17]">Thích ứng × Bản sắc</p>
              <h3 className="font-serif text-xl font-bold text-[#1F1B18]">Bản sắc được giữ</h3>
              <p className="mt-0.5 text-[11px] text-[#736960]">Đối chiếu tự động với quy tắc của {garment.name}.</p>
            </div>
            <SealStamp score={guard.score} status={guard.status} size="md" />
          </div>
          <ul className="space-y-2">
            {guard.items.map((item) => {
              const tone = LEVEL_STYLE[item.level];
              return (
                <li key={item.id} className={`rounded-2xl border p-3 ${tone.box}`}>
                  <p className={`flex items-center gap-1.5 text-xs font-bold ${tone.text}`}>
                    <span className={`size-1.5 rounded-full ${tone.dot}`} aria-hidden="true" />
                    <span className="sr-only">{tone.label}: </span>{item.title}
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-[#4A423B]">{item.detail}</p>
                  {item.fix && (
                    <button type="button" onClick={() => update(item.fix!)} className="press mt-2 rounded-lg border border-current/20 bg-[#FFFFFF] px-2.5 py-1 text-[11px] font-bold text-[#1F1B18] hover:bg-[#F1EADF]">
                      ✓ {item.fixLabel}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
          {guard.items.some((i) => i.fix) && (
            <button type="button" onClick={fixAll} className="btn-primary w-full text-xs">Áp dụng tất cả phương án giữ bản sắc</button>
          )}
        </section>

        {/* Explanation + Gemini */}
        <section className="space-y-4 rounded-[28px] border border-[#E6DCCD] bg-[#F7F2EA] p-5 sm:p-6">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#8A5E17]">Vì sao điều chỉnh</p>
            <h3 className="font-serif text-xl font-bold text-[#1F1B18]">Từng thay đổi giúp gì</h3>
          </div>
          <ul className="space-y-2 text-xs leading-relaxed text-[#1F1B18]">
            {explanation.map((line) => (
              <li key={line} className="flex gap-2"><span className="text-[#4F7350]" aria-hidden="true">●</span>{line}</li>
            ))}
          </ul>
          <p className="text-[10px] italic text-[#736960]">Giải thích tất định từ dữ liệu Vstyle.</p>

          <div className="space-y-3 border-t border-[#E6DCCD] pt-4">
            {!advice ? (
              <button type="button" onClick={() => void askGemini()} disabled={adviceLoading} className="press inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-[#1F1B18] bg-[#FFFFFF] px-4 text-xs font-bold text-[#1F1B18] transition hover:bg-[#F1EADF] disabled:opacity-50">
                {adviceLoading ? 'Gemini đang viết…' : '✦ Nhờ Gemini viết lời khuyên riêng'}
              </button>
            ) : (
              <div className="space-y-2.5 rounded-2xl border border-[#E6DCCD] bg-[#FFFFFF] p-4 animate-rise">
                <p className="font-serif text-base font-bold italic text-[#1F1B18]">“{advice.headline}”</p>
                <p className="text-xs leading-relaxed text-[#4A423B]">{advice.explanation}</p>
                {advice.confidenceTips.length > 0 && (
                  <div>
                    <p className="text-[11px] font-bold text-[#3D6B35]">Mặc tự tin</p>
                    <ul className="mt-1 space-y-1 text-[11px] text-[#4A423B]">{advice.confidenceTips.map((tip) => <li key={tip}>✦ {tip}</li>)}</ul>
                  </div>
                )}
                {advice.tailorQuestions.length > 0 && (
                  <div>
                    <p className="text-[11px] font-bold text-[#8A5E17]">Hỏi thợ may</p>
                    <ul className="mt-1 space-y-1 text-[11px] text-[#4A423B]">{advice.tailorQuestions.map((q) => <li key={q}>? {q}</li>)}</ul>
                  </div>
                )}
                <p className="text-[10px] italic text-[#736960]">
                  {advice.usedFallback ? 'Gemini chưa bật trên máy chủ — đây là lời khuyên mẫu từ dữ liệu Vstyle.' : 'Viết bởi Gemini dựa trên thông số và kết quả văn hóa ở trên (không được thay đổi chúng).'}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Verified specs + dressing guide */}
        <section className="space-y-4 rounded-[28px] border border-[#E6DCCD] bg-[#FFFFFF] p-5 shadow-xs sm:p-6">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#8A5E17]">Hướng dẫn tự mặc</p>
            <h3 className="font-serif text-xl font-bold text-[#1F1B18]">Mặc độc lập, từng bước</h3>
          </div>
          {dressingSteps.length ? (
            <>
              {dressingSteps.length > 1 && (
                <div className="no-scrollbar flex gap-1.5 overflow-x-auto" role="tablist" aria-label="Nhu cầu">
                  {dressingSteps.map((d) => (
                    <button
                      key={d.code}
                      type="button"
                      role="tab"
                      aria-selected={activeGuide?.code === d.code}
                      onClick={() => setGuideTab(d.code)}
                      className={`press shrink-0 rounded-full border px-3 py-1 text-[11px] font-semibold ${activeGuide?.code === d.code ? 'border-[#1F1B18] bg-[#1F1B18] text-[#FFFFFF]' : 'border-[#E6DCCD] text-[#5C5248]'}`}
                    >
                      {d.need}
                    </button>
                  ))}
                </div>
              )}
              {activeGuide && (
                <ol className="space-y-2">
                  {activeGuide.steps.map((step, index) => (
                    <li key={step} className="flex gap-3 text-xs leading-relaxed text-[#1F1B18]">
                      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#E5EDE2] font-mono text-[11px] font-bold text-[#3D6B35]">{index + 1}</span>
                      <span className="pt-0.5">{step}</span>
                    </li>
                  ))}
                </ol>
              )}
            </>
          ) : (
            <p className="text-xs text-[#736960]">Chọn nhu cầu để xem hướng dẫn mặc phù hợp.</p>
          )}

          {verified.length > 0 && (
            <div className="space-y-2 border-t border-[#E6DCCD] pt-4">
              <p className="text-[11px] font-bold text-[#1F1B18]">Thông số đã kiểm định</p>
              {verified.map((v) => (
                <div key={v.needName} className="rounded-xl bg-[#FBF8F3] p-2.5 text-[11px] leading-relaxed">
                  <p className="font-semibold text-[#1F1B18]">
                    {v.validated ? <span className="text-[#3D6B35]">✓ </span> : <span className="text-[#8A5E17]">⏳ </span>}
                    {v.needName}
                  </p>
                  {v.source && <p className="text-[10px] text-[#736960]">Nguồn: {v.source.title}</p>}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ===================== CTA ===================== */}
      <section className="flex flex-col gap-4 rounded-[28px] bg-[#1F1B18] p-5 text-[#FFFFFF] sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <p className="font-serif text-lg font-bold">Sẵn sàng mang đi may?</p>
          <p className="text-xs text-[#D9D0C4]">Phiếu may đo gồm thông số rập, số đo, quy tắc bản sắc và hướng dẫn tự mặc — in hoặc lưu PDF.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setIsSheetOpen(true)} className="press inline-flex min-h-11 items-center rounded-2xl bg-[#C9A24A] px-5 text-xs font-bold text-[#1F1B18] transition hover:bg-[#D6B25E]">
            📋 Xuất phiếu may đo
          </button>
          {onApplyAdaptiveOutfit && (
            <button
              type="button"
              onClick={() => onApplyAdaptiveOutfit(garment, needCodes, colorHex)}
              className="press inline-flex min-h-11 items-center rounded-2xl border border-[#FFFFFF]/30 px-5 text-xs font-bold text-[#FFFFFF] transition hover:bg-[#FFFFFF]/10"
            >
              Phối tiếp với bản may đo này →
            </button>
          )}
        </div>
      </section>

      <p className="text-[11px] leading-relaxed text-[#736960]">
        ⚠️ Cam kết trung thực: thông số mang tính hỗ trợ thiết kế cá nhân hóa, không phải tiêu chuẩn y khoa hay quy chuẩn may đo được cơ quan chuyên môn xác nhận. Quy tắc văn hóa lấy từ dữ liệu y phục có nguồn tham khảo.
      </p>

      {isSheetOpen && (
        <Dialog bare size="4xl" title="Phiếu may đo thích ứng" onClose={() => setIsSheetOpen(false)}>
          <TechPackSheet
            garment={garment}
            colorHex={colorHex}
            colorName={colorName}
            needs={selectedNeeds}
            adjustments={adj}
            guard={guard}
            verified={verified}
            measurements={measurements}
            dressingSteps={dressingSteps}
            onClose={() => setIsSheetOpen(false)}
            onCopy={(text) => {
              void navigator.clipboard?.writeText(text)
                .then(() => showToast('Đã sao chép phiếu may đo.'))
                .catch(() => showToast('Trình duyệt không cho phép sao chép.'));
            }}
          />
        </Dialog>
      )}
    </div>
  );
};

