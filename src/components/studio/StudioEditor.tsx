/**
 * Studio › Tự tạo: build an outfit by hand.
 * Quick 3-question quiz → instant starting look, then tweak the character, garment,
 * cut (sliders or by dragging the handles on the garment itself) and accessories.
 */

import React, { useMemo, useRef, useState } from 'react';
import { Box, Gem, Ruler, Shirt, Sparkles, User, Wand2 } from 'lucide-react';
import type { Outfit } from '../../types/domain';
import { OutfitMockupCanvas } from '../OutfitMockupCanvas';
import { OutfitReview } from '../OutfitReview';
import { BODY_SHAPES, HAIR_SILHOUETTES, SKIN_TONES } from '../CharacterSelector';
import { getApprovedAccessories, getApprovedGarments, getCharacters, getEvents } from '../../lib/dal';
import { STYLE_CHOICES } from '../../lib/styles';
import { designFromBrief, isAccessoryAllowedFor } from '../../lib/design/designEngine';
import { evaluateLook, type Look } from '../../lib/look';

interface StudioEditorProps {
  initialLook?: Look;
  showToast: (message: string) => void;
  onSaved: () => void;
  onPost: (outfit: Outfit) => void;
  onShare: (outfit: Outfit) => void;
  onOpen3D: (look: Look) => void;
}

const garments = getApprovedGarments();
const accessories = getApprovedAccessories();
const characters = getCharacters();
const events = getEvents();

const QUIZ_EVENTS = ['EVENT_YEARBOOK', 'EVENT_GRADUATION', 'EVENT_TET', 'EVENT_WEDDING', 'EVENT_FESTIVAL', 'EVENT_CASUAL'];
const SHORT_EVENT: Record<string, string> = {
  EVENT_YEARBOOK: 'Kỷ yếu', EVENT_GRADUATION: 'Tốt nghiệp', EVENT_TET: 'Tết', EVENT_WEDDING: 'Đám cưới',
  EVENT_FESTIVAL: 'Lễ hội', EVENT_CASUAL: 'Dạo phố', EVENT_CULTURAL: 'Triển lãm', EVENT_CONCERT: 'Hòa nhạc',
};
const TONES = [
  { id: 'warm', label: 'Ấm', hex: '#A92228' },
  { id: 'cool', label: 'Lạnh', hex: '#2B5C8F' },
  { id: 'pastel', label: 'Pastel', hex: '#E8B4BC' },
  { id: 'deep', label: 'Trầm', hex: '#1E2A38' },
  { id: 'neutral', label: 'Trung tính', hex: '#EBE5D8' },
];
const PANT_COLORS = ['#F4F0E8', '#EBE5D8', '#1C1C1E', '#2B5C8F', '#8B1E2B', '#3D5A45'];
const BACKGROUNDS = [
  { id: 'MINIMAL_STUDIO', label: 'Studio' },
  { id: 'HERITAGE_PALACE', label: 'Cung đình' },
  { id: 'GARDEN_SPRING', label: 'Vườn xuân' },
] as const;

type Tab = 'CHARACTER' | 'GARMENT' | 'CUT' | 'ACCESSORY';

const DEFAULT_LOOK: Look = {
  garmentId: garments[0].id,
  primaryColor: garments[0].baseColors[0].hex,
  pantColor: '#F4F0E8',
  accessoryIds: ['acc-khan-dong'],
  eventId: 'EVENT_YEARBOOK',
  weatherId: 'WEATHER_PLEASANT',
  styleId: 'TOI_GIAN',
  characterId: characters[0].id,
  needCodes: [],
  remixLevel: 30,
  origin: 'STUDIO',
};

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export const StudioEditor: React.FC<StudioEditorProps> = ({ initialLook, showToast, onSaved, onPost, onShare, onOpen3D }) => {
  const [look, setLook] = useState<Look>(() => ({ ...(initialLook ?? DEFAULT_LOOK), origin: 'STUDIO' }));
  const [quiz, setQuiz] = useState({ eventId: '', styleId: '', tone: '' });
  const [quizOpen, setQuizOpen] = useState(!initialLook);
  const [tab, setTab] = useState<Tab>('GARMENT');
  const [skinTone, setSkinTone] = useState(initialLook?.skinTone ?? SKIN_TONES[1].hex);
  const [heightCm, setHeightCm] = useState(160);
  const [bodyShape, setBodyShape] = useState('BALANCED');
  const [hair, setHair] = useState('TOC_VAN');
  const [background, setBackground] = useState<(typeof BACKGROUNDS)[number]['id']>('MINIMAL_STUDIO');
  const [hem, setHem] = useState(0.85);
  const [sleeve, setSleeve] = useState(0.75);
  const [slit, setSlit] = useState(0.4);
  const overlayRef = useRef<HTMLDivElement>(null);

  const evaluation = useMemo(() => evaluateLook({ ...look, skinTone }), [look, skinTone]);
  const garment = evaluation.garment;
  const character = useMemo(() => characters.find((c) => c.id === look.characterId) ?? characters[0], [look.characterId]);
  const seated = character.heightCategory === 'SEATED' || look.needCodes.includes('WHEELCHAIR_SEATED');
  const scale = 1 + (heightCm - 160) * 0.006;
  const remix = look.remixLevel ?? 30;
  const allowed = accessories.filter((a) => isAccessoryAllowedFor(a, garment, look.eventId));

  const update = (patch: Partial<Look>) => setLook((current) => ({ ...current, ...patch, title: undefined }));

  const selectGarment = (id: string) => {
    const g = garments.find((x) => x.id === id);
    if (!g) return;
    update({
      garmentId: id,
      primaryColor: g.baseColors[0].hex,
      pantColor: g.svgTemplate === 'AO_TU_THAN' ? '#2A211C' : look.pantColor,
      accessoryIds: look.accessoryIds.filter((accId) => {
        const acc = accessories.find((a) => a.id === accId);
        return acc ? isAccessoryAllowedFor(acc, g, look.eventId) : false;
      }),
    });
  };

  const runQuiz = () => {
    const tone = TONES.find((t) => t.id === quiz.tone);
    const design = designFromBrief({
      eventId: quiz.eventId || undefined,
      styleId: quiz.styleId || undefined,
      colorHex: tone?.hex,
    });
    setLook((current) => ({
      ...current,
      garmentId: design.garmentId,
      primaryColor: design.primaryColor,
      pantColor: design.pantColor,
      accessoryIds: design.accessoryIds,
      eventId: design.eventId,
      styleId: design.styleId,
      remixLevel: design.remixLevel,
      title: undefined,
    }));
    setHem(design.remixLevel >= 60 ? 0.6 : 0.85);
    setQuizOpen(false);
    showToast(`Đã phối sẵn ${design.title}. Chỉnh tiếp theo ý bạn nhé!`);
  };

  /* ---------- drag handles on the garment ---------- */
  const toCanvas = (clientX: number, clientY: number) => {
    const rect = overlayRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const x = ((clientX - rect.left) / rect.width) * 400;
    const y = ((clientY - rect.top) / rect.height) * 500;
    // Undo the height scale applied around the feet (200, 470).
    return { x: 200 + (x - 200) / scale, y: 470 + (y - 470) / scale };
  };
  const startDrag = (kind: 'hem' | 'slit' | 'sleeve') => (event: React.PointerEvent) => {
    event.preventDefault();
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
    const move = (e: PointerEvent) => {
      const p = toCanvas(e.clientX, e.clientY);
      if (!p) return;
      if (kind === 'hem') setHem(clamp((p.y - 235) / 191, 0.35, 1));
      if (kind === 'slit') setSlit(clamp((265 - p.y) / 65, 0.1, 0.8));
      if (kind === 'sleeve') setSleeve(clamp(0.7 + (p.x - 292) / 28, 0.3, 1));
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  const place = (x: number, y: number) => ({
    left: `${((200 + (x - 200) * scale) / 400) * 100}%`,
    top: `${((470 + (y - 470) * scale) / 500) * 100}%`,
  });
  const handleClass = 'absolute z-10 grid size-7 -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none place-items-center rounded-full border-2 border-[#FFFFFF] bg-[#C4553F] text-[10px] font-bold text-[#FFFFFF] shadow-md active:cursor-grabbing';
  const sleeveFlare = (sleeve - 0.7) * 28;
  const overlay = seated ? null : (
    <div ref={overlayRef} className="absolute inset-0">
      <button type="button" aria-label="Kéo để đổi độ dài tà áo" title="Kéo lên/xuống: độ dài tà" onPointerDown={startDrag('hem')} className={handleClass} style={place(200, 235 + 191 * hem)}>↕</button>
      <button type="button" aria-label="Kéo để đổi điểm xẻ tà" title="Kéo lên/xuống: độ xẻ tà" onPointerDown={startDrag('slit')} className={`${handleClass} bg-[#1E3443]`} style={place(164, 265 - 65 * slit)}>✂</button>
      <button type="button" aria-label="Kéo để đổi độ rộng tay áo" title="Kéo trái/phải: độ rộng tay" onPointerDown={startDrag('sleeve')} className={`${handleClass} bg-[#4F7350]`} style={place(292 + sleeveFlare, 290)}>↔</button>
    </div>
  );

  const chip = (active: boolean) =>
    `press rounded-full border px-3.5 py-1.5 text-sm transition ${active ? 'border-[#1E3443] bg-[#1E3443] text-[#FFFFFF]' : 'border-[#E8DFD3] bg-[#FFFFFF] text-[#1E3443] hover:bg-[#FAF6F0]'}`;
  const swatch = (active: boolean) =>
    `press size-8 rounded-full border-2 transition ${active ? 'border-[#1E3443] ring-2 ring-[#C4553F]/50 ring-offset-2' : 'border-[#FFFFFF] shadow-[0_0_0_1px_#E8DFD3]'}`;
  const label = 'text-xs font-semibold uppercase tracking-wider text-[#7A6F66]';

  const slider = (name: string, value: number, min: number, max: number, step: number, onChange: (v: number) => void, display: string) => (
    <label className="block space-y-1.5">
      <span className="flex justify-between text-sm"><span className="text-[#1E3443]">{name}</span><span className="font-mono text-[#7A6F66]">{display}</span></span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-[#1E3443]" />
    </label>
  );

  return (
    <div className="space-y-6">
      {/* Quick quiz */}
      <section className="rounded-[28px] border border-[#E8DFD3] bg-[#FFFFFF] p-5 sm:p-6">
        <button type="button" onClick={() => setQuizOpen((v) => !v)} className="flex w-full items-center justify-between gap-3 text-left" aria-expanded={quizOpen}>
          <span className="flex items-center gap-2 font-serif text-xl font-bold text-[#1E3443]"><Wand2 className="size-5 text-[#C4553F]" aria-hidden="true" /> Phối nhanh bằng 3 câu hỏi</span>
          <span className="text-sm text-[#7A6F66]">{quizOpen ? 'Thu gọn' : 'Mở'}</span>
        </button>
        {quizOpen && (
          <div className="mt-4 space-y-4">
            <fieldset className="space-y-2">
              <legend className="mb-2 text-sm font-semibold text-[#1E3443]">1. Bạn mặc đi đâu?</legend>
              <div className="flex flex-wrap gap-2">
                {QUIZ_EVENTS.map((id) => <button key={id} type="button" aria-pressed={quiz.eventId === id} onClick={() => setQuiz((q) => ({ ...q, eventId: id }))} className={chip(quiz.eventId === id)}>{SHORT_EVENT[id]}</button>)}
              </div>
            </fieldset>
            <fieldset className="space-y-2">
              <legend className="mb-2 text-sm font-semibold text-[#1E3443]">2. Gu của bạn?</legend>
              <div className="flex flex-wrap gap-2">
                {STYLE_CHOICES.map((s) => <button key={s.id} type="button" aria-pressed={quiz.styleId === s.id} onClick={() => setQuiz((q) => ({ ...q, styleId: s.id }))} className={chip(quiz.styleId === s.id)}>{s.label.split('·')[0].trim()}</button>)}
              </div>
            </fieldset>
            <fieldset className="space-y-2">
              <legend className="mb-2 text-sm font-semibold text-[#1E3443]">3. Tông màu yêu thích?</legend>
              <div className="flex flex-wrap gap-2">
                {TONES.map((t) => (
                  <button key={t.id} type="button" aria-pressed={quiz.tone === t.id} onClick={() => setQuiz((q) => ({ ...q, tone: t.id }))} className={`${chip(quiz.tone === t.id)} inline-flex items-center gap-2`}>
                    <span className="size-3.5 rounded-full border border-black/10" style={{ backgroundColor: t.hex }} aria-hidden="true" /> {t.label}
                  </button>
                ))}
              </div>
            </fieldset>
            <button type="button" onClick={runQuiz} disabled={!quiz.eventId && !quiz.styleId && !quiz.tone} className="press inline-flex min-h-11 items-center gap-2 rounded-full bg-[#1E3443] px-6 text-sm font-semibold text-[#FFFFFF] disabled:opacity-40">
              <Sparkles className="size-4" aria-hidden="true" /> Phối cho tôi
            </button>
          </div>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Canvas */}
        <div className="lg:col-span-5">
          <div className="space-y-3 lg:sticky lg:top-24">
            <div className="flex justify-center rounded-[28px] border border-[#E8DFD3] bg-[#FFFFFF] p-3">
              <OutfitMockupCanvas
                garment={garment}
                primaryColor={look.primaryColor}
                pantColor={look.pantColor}
                accessories={evaluation.accessories}
                character={{ ...character, skinTone, defaultSkinTone: skinTone, posture: seated ? 'WHEELCHAIR_SEATED' : 'STANDING' }}
                skinTone={skinTone}
                hairStyle={hair}
                bodyShape={bodyShape}
                pose={seated ? 'WHEELCHAIR' : 'STANDING'}
                backgroundTheme={background}
                remixLevel={remix}
                quickAdjustments={{ hemLengthRatio: hem, sleeveWidthRatio: sleeve, slitHeightRatio: slit }}
                adaptiveNeedCodes={look.needCodes}
                figureScale={scale}
                overlay={overlay}
                compact
              />
            </div>
            <p className="text-center text-xs text-[#7A6F66]">{seated ? 'Dáng ngồi: chỉnh bằng thanh trượt bên phải.' : 'Kéo các nút trên áo: ↕ dài tà · ✂ xẻ tà · ↔ rộng tay'}</p>
            <div className="flex flex-wrap justify-center gap-2">
              {BACKGROUNDS.map((b) => <button key={b.id} type="button" aria-pressed={background === b.id} onClick={() => setBackground(b.id)} className={chip(background === b.id)}>{b.label}</button>)}
              <button type="button" onClick={() => onOpen3D({ ...look, skinTone })} className={`${chip(false)} inline-flex items-center gap-1.5`}><Box className="size-4" aria-hidden="true" /> 3D</button>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-4 lg:col-span-7">
          <div className="grid grid-cols-4 gap-1 rounded-2xl border border-[#E8DFD3] bg-[#FFFFFF] p-1" role="tablist" aria-label="Công cụ">
            {([
              ['CHARACTER', 'Nhân vật', User],
              ['GARMENT', 'Trang phục', Shirt],
              ['CUT', 'Dáng áo', Ruler],
              ['ACCESSORY', 'Phụ kiện', Gem],
            ] as const).map(([id, name, Icon]) => (
              <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={`press flex flex-col items-center gap-1 rounded-xl py-2.5 text-xs font-semibold transition sm:flex-row sm:justify-center sm:text-sm ${tab === id ? 'bg-[#1E3443] text-[#FFFFFF]' : 'text-[#5C5248] hover:bg-[#FAF6F0]'}`}>
                <Icon className="size-4" aria-hidden="true" /> {name}
              </button>
            ))}
          </div>

          <div className="space-y-5 rounded-[28px] border border-[#E8DFD3] bg-[#FFFFFF] p-5 sm:p-6">
            {tab === 'CHARACTER' && (
              <>
                <div className="space-y-2">
                  <p className={label}>Nhân vật</p>
                  <div className="flex flex-wrap gap-2">
                    {characters.map((c) => (
                      <button key={c.id} type="button" aria-pressed={look.characterId === c.id} onClick={() => update({ characterId: c.id, needCodes: c.heightCategory === 'SEATED' ? ['WHEELCHAIR_SEATED'] : look.needCodes.filter((n) => n !== 'WHEELCHAIR_SEATED') })} className={chip(look.characterId === c.id)}>
                        {c.name.split('(')[0].trim()}{c.heightCategory === 'SEATED' ? ' ♿' : ''}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <p className={label}>Màu da</p>
                  <div className="flex gap-2">
                    {SKIN_TONES.map((t) => <button key={t.hex} type="button" title={t.label} aria-label={t.label} aria-pressed={skinTone === t.hex} onClick={() => setSkinTone(t.hex)} className={swatch(skinTone === t.hex)} style={{ backgroundColor: t.hex }} />)}
                  </div>
                </div>
                {!seated && slider('Chiều cao', heightCm, 145, 175, 1, setHeightCm, `${heightCm} cm`)}
                <div className="space-y-2">
                  <p className={label}>Dáng người</p>
                  <div className="flex flex-wrap gap-2">
                    {BODY_SHAPES.map((b) => <button key={b.id} type="button" aria-pressed={bodyShape === b.id} onClick={() => setBodyShape(b.id)} className={chip(bodyShape === b.id)}>{b.label.split('(')[0].trim()}</button>)}
                  </div>
                </div>
                <div className="space-y-2">
                  <p className={label}>Kiểu tóc</p>
                  <div className="flex flex-wrap gap-2">
                    {HAIR_SILHOUETTES.map((h) => <button key={h.id} type="button" aria-pressed={hair === h.id} onClick={() => setHair(h.id)} className={chip(hair === h.id)}>{h.label}</button>)}
                  </div>
                </div>
              </>
            )}

            {tab === 'GARMENT' && (
              <>
                <div className="space-y-2">
                  <p className={label}>Loại áo</p>
                  <div className="flex flex-wrap gap-2">
                    {garments.map((g) => <button key={g.id} type="button" aria-pressed={look.garmentId === g.id} onClick={() => selectGarment(g.id)} className={chip(look.garmentId === g.id)}>{g.name.replace(/\s*\(.*\)$/, '')}</button>)}
                  </div>
                </div>
                <div className="space-y-2">
                  <p className={label}>Màu áo</p>
                  <div className="flex flex-wrap items-center gap-2">
                    {garment.baseColors.map((c) => <button key={c.hex} type="button" title={c.name} aria-label={c.name} aria-pressed={look.primaryColor === c.hex} onClick={() => update({ primaryColor: c.hex })} className={swatch(look.primaryColor === c.hex)} style={{ backgroundColor: c.hex }} />)}
                    <label className="press relative grid size-8 cursor-pointer place-items-center overflow-hidden rounded-full border border-dashed border-[#B8AC9E] text-xs text-[#7A6F66]" title="Màu tự chọn">
                      +
                      <input type="color" value={look.primaryColor} onChange={(e) => update({ primaryColor: e.target.value.toUpperCase() })} className="absolute inset-0 cursor-pointer opacity-0" aria-label="Chọn màu tự do" />
                    </label>
                  </div>
                </div>
                {garment.svgTemplate !== 'AO_TU_THAN' && (
                  <div className="space-y-2">
                    <p className={label}>Màu quần</p>
                    <div className="flex gap-2">
                      {PANT_COLORS.map((hex) => <button key={hex} type="button" aria-label={`Quần ${hex}`} aria-pressed={look.pantColor === hex} onClick={() => update({ pantColor: hex })} className={swatch(look.pantColor === hex)} style={{ backgroundColor: hex }} />)}
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <p className={label}>Dịp mặc</p>
                  <div className="flex flex-wrap gap-2">
                    {events.map((e) => <button key={e.id} type="button" aria-pressed={look.eventId === e.id} onClick={() => update({ eventId: e.id })} className={chip(look.eventId === e.id)}>{SHORT_EVENT[e.id] ?? e.name}</button>)}
                  </div>
                </div>
              </>
            )}

            {tab === 'CUT' && (
              <>
                {slider('Truyền thống ⟷ Hiện đại', remix, 0, 100, 1, (v) => update({ remixLevel: v }), `${remix}%`)}
                {remix >= 65 && <p className="rounded-xl bg-[#FBF1EC] p-3 text-xs text-[#8B3A2B]">Mức hiện đại cao: vẫn giữ vạt hữu nhậm và cổ áo để không mất đặc trưng.</p>}
                {!seated && slider('Độ dài tà', Math.round(hem * 100), 35, 100, 1, (v) => setHem(v / 100), `${Math.round(hem * 100)}%`)}
                {slider('Độ rộng tay', Math.round(sleeve * 100), 30, 100, 1, (v) => setSleeve(v / 100), `${Math.round(sleeve * 100)}%`)}
                {!seated && slider('Độ xẻ tà', Math.round(slit * 100), 10, 80, 1, (v) => setSlit(v / 100), `${Math.round(slit * 100)}%`)}
                <div className="space-y-2">
                  <p className={label}>Phong cách</p>
                  <div className="flex flex-wrap gap-2">
                    {STYLE_CHOICES.map((s) => <button key={s.id} type="button" aria-pressed={look.styleId === s.id} onClick={() => update({ styleId: s.id })} className={chip(look.styleId === s.id)}>{s.label.split('·')[0].trim()}</button>)}
                  </div>
                </div>
              </>
            )}

            {tab === 'ACCESSORY' && (
              <div className="space-y-2">
                <p className={label}>Phụ kiện hợp với {garment.name.replace(/\s*\(.*\)$/, '')} ({SHORT_EVENT[look.eventId] ?? 'dịp này'})</p>
                {allowed.length ? (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {allowed.map((a) => {
                      const on = look.accessoryIds.includes(a.id);
                      return (
                        <button key={a.id} type="button" aria-pressed={on} onClick={() => update({ accessoryIds: on ? look.accessoryIds.filter((id) => id !== a.id) : [...look.accessoryIds, a.id] })} className={`press flex items-center gap-2 rounded-2xl border p-2.5 text-left text-sm transition ${on ? 'border-[#1E3443] bg-[#F3F1EE]' : 'border-[#E8DFD3] hover:bg-[#FAF6F0]'}`}>
                          <span className="size-6 shrink-0 rounded-full border border-[#E8DFD3]" style={{ backgroundColor: a.colors[0] }} aria-hidden="true" />
                          <span className="leading-tight text-[#1E3443]">{a.name.split('(')[0].trim()}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-[#7A6F66]">Chưa có phụ kiện phù hợp — thử đổi dịp mặc.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <OutfitReview look={{ ...look, skinTone }} evaluation={evaluation} showToast={showToast} onSaved={onSaved} onPost={onPost} onShare={onShare} />
    </div>
  );
};
