/**
 * Vstyle Studio - Tự tay phối như một game thời trang
 * Implements the editorial 3-column layout matching the design prototype:
 * 1. Left Tool Rail (Trang phục, Phụ kiện, Bối cảnh, Nhân vật)
 * 2. Center Stage (Editorial Canvas with interactive callout tooltip + Accessories shelf)
 * 3. Right Control Panel (Traditional <-> Remix slider with "Ngưỡng mất đặc trưng" badge,
 *    quick sliders for Độ dài tà, Độ rộng tay, Độ xẻ tà, and Gợi ý phối thumbnails)
 */

import React, { useState, useMemo, useRef } from 'react';
import { Garment, Accessory, CharacterItem, Outfit } from '../types/fashion';
import { OutfitMockupCanvas } from './OutfitMockupCanvas';
import { checkCulture } from '../lib/culture/ruleEngine';
import { evaluateColorHarmony } from '../lib/color/harmony';
import { getApprovedGarments, getApprovedAccessories, getCharacters } from '../lib/dal';
import { SKIN_TONES, BODY_SHAPES, HAIR_SILHOUETTES, POSES } from './CharacterSelector';
import { GarmentDetailModal } from './GarmentDetailModal';

interface StudioProps {
  onSaveOutfit: (outfit: Outfit) => void;
  onOpenCompare?: () => void;
  onOpenTailoringSheet?: (needCode: string) => void;
  showToast: (msg: string) => void;
  onBackToHome?: () => void;
}

type StudioToolTab = 'GARMENT' | 'ACCESSORIES' | 'BACKGROUND' | 'CHARACTER';

const BACKGROUND_THEMES: { id: 'MINIMAL_STUDIO' | 'HERITAGE_PALACE' | 'GARDEN_SPRING'; label: string; icon: string }[] = [
  { id: 'MINIMAL_STUDIO', label: 'Studio Tối Giản', icon: '🏛️' },
  { id: 'HERITAGE_PALACE', label: 'Cung Điện Cố Đô', icon: '🏯' },
  { id: 'GARDEN_SPRING', label: 'Vườn Xuân Dân Gian', icon: '🌸' },
];

export const Studio: React.FC<StudioProps> = ({
  onSaveOutfit,
  onOpenCompare,
  onOpenTailoringSheet,
  showToast,
  onBackToHome,
}) => {
  const allGarments = useMemo(() => getApprovedGarments(), []);
  const allAccessories = useMemo(() => getApprovedAccessories(), []);
  const allCharacters = useMemo(() => getCharacters(), []);

  // Active Tool Modal / Drawer
  const [activeToolTab, setActiveToolTab] = useState<StudioToolTab | null>(null);

  // Model & Garment State
  const [selectedGarment, setSelectedGarment] = useState<Garment>(allGarments[0]);
  const [primaryColorHex, setPrimaryColorHex] = useState<string>(allGarments[0].baseColors[0].hex);
  const [pantColorHex, setPantColorHex] = useState<string>('#F4F0E8');
  const [selectedAccessoryIds, setSelectedAccessoryIds] = useState<string[]>(['acc-khan-dong', 'acc-the-bai']);
  const [backgroundTheme, setBackgroundTheme] = useState<'MINIMAL_STUDIO' | 'HERITAGE_PALACE' | 'GARDEN_SPRING'>('MINIMAL_STUDIO');

  // Character customization
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterItem>(allCharacters[0]);
  const [skinToneHex, setSkinToneHex] = useState<string>(allCharacters[0].defaultSkinTone ?? '#F3D9C7');
  const [selectedHair, setSelectedHair] = useState<string>('TOC_VAN');
  const [selectedPose, setSelectedPose] = useState<string>('STANDING');
  const [selectedShape, setSelectedShape] = useState<string>('BALANCED');

  // Traditional ↔ Remix Slider (0 to 100)
  const [remixRatio, setRemixRatio] = useState<number>(35);

  // Quick Adjustment Sliders (Chỉnh nhanh)
  const [hemLengthPercent, setHemLengthPercent] = useState<number>(70); // 30% to 100%
  const [sleeveWidthPercent, setSleeveWidthPercent] = useState<number>(80); // 30% to 100%
  const [slitHeightPercent, setSlitHeightPercent] = useState<number>(40); // 10% to 80%

  // Inspect Garment details modal
  const [inspectedGarment, setInspectedGarment] = useState<Garment | null>(null);

  // Scroll ref for horizontal accessory shelf
  const shelfScrollRef = useRef<HTMLDivElement>(null);

  // Drag & drop state for accessory shelf
  const [draggedItem, setDraggedItem] = useState<Accessory | null>(null);

  // Character with applied skin tone & pose
  const activeCharacter = useMemo<CharacterItem>(() => ({
    ...selectedCharacter,
    skinTone: skinToneHex,
    defaultSkinTone: skinToneHex,
    posture: selectedPose === 'WHEELCHAIR' ? 'WHEELCHAIR_SEATED' : 'STANDING',
  }), [selectedCharacter, skinToneHex, selectedPose]);

  // Active equipped accessories list
  const activeAccessories = useMemo(() => (
    allAccessories.filter((acc) => selectedAccessoryIds.includes(acc.id))
  ), [allAccessories, selectedAccessoryIds]);

  // Real-time cultural check
  const cultureResult = useMemo(() => checkCulture({
    garmentId: selectedGarment.id,
    accessoryIds: selectedAccessoryIds,
    eventId: 'EVENT_GRADUATION',
    primaryColor: primaryColorHex,
    adaptiveNeedCode: selectedPose === 'WHEELCHAIR' ? 'WHEELCHAIR_SEATED' : undefined,
  }), [selectedGarment.id, selectedAccessoryIds, primaryColorHex, selectedPose]);

  // Real-time color harmony check
  const harmonyResult = useMemo(() => evaluateColorHarmony({
    primaryColor: primaryColorHex,
    pantColor: pantColorHex,
    accessoryColors: activeAccessories.map((a) => a.colors[0]).filter(Boolean),
  }), [primaryColorHex, pantColorHex, activeAccessories]);

  // Toggle accessory equipped state
  const handleToggleAccessory = (acc: Accessory) => {
    setSelectedAccessoryIds((prev) => {
      const isEquipped = prev.includes(acc.id);
      if (isEquipped) {
        showToast(`Đã tháo: ${acc.name}`);
        return prev.filter((id) => id !== acc.id);
      } else {
        showToast(`Đã trang bị: ${acc.name}`);
        return [...prev, acc.id];
      }
    });
  };

  // Scroll shelf left / right
  const scrollShelf = (direction: 'left' | 'right') => {
    if (shelfScrollRef.current) {
      const offset = direction === 'left' ? -220 : 220;
      shelfScrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  // Interactive Callout Tooltip for Canvas
  const canvasTooltip = useMemo(() => {
    const hasHeadwear = selectedAccessoryIds.some((id) => id.includes('khan') || id.includes('man'));
    if (hasHeadwear) {
      return {
        title: 'Khăn vấn / Khăn đóng',
        subtitle: 'Giúp cố định tóc, tạo nét truyền thống điển chế thời Nguyễn.',
        actionLabel: 'Xem chi tiết →',
        onAction: () => setInspectedGarment(selectedGarment),
      };
    }
    return {
      title: selectedGarment.name,
      subtitle: `${selectedGarment.era || 'Việt phục truyền thống'}. Khép vạt hữu nhậm trang nhã.`,
      actionLabel: 'Xem chi tiết →',
      onAction: () => setInspectedGarment(selectedGarment),
    };
  }, [selectedAccessoryIds, selectedGarment]);

  // 4 AI Style Preset Variations (Gợi ý phối)
  const AI_STYLE_PRESETS = [
    {
      id: 'TOI_GIAN',
      title: 'Tối Giản',
      subtitle: 'Thanh lịch mộc mạc',
      imageAsset: 'garment_ngu_than_tay_chen',
      apply: () => {
        const nguThan = allGarments.find((g) => g.id === 'garment-ngu-than-tay-chen') ?? allGarments[0];
        setSelectedGarment(nguThan);
        setPrimaryColorHex(nguThan.baseColors[0].hex);
        setPantColorHex('#F4F0E8');
        setSelectedAccessoryIds(['acc-the-bai']);
        setRemixRatio(15);
        setHemLengthPercent(85);
        setSleeveWidthPercent(65);
        setSlitHeightPercent(30);
        showToast('Đã áp dụng: Tối Giản Thanh Lịch');
      },
    },
    {
      id: 'SOFT_GEN_Z',
      title: 'Soft Gen Z',
      subtitle: 'Pastel & sneaker',
      imageAsset: 'garment_ao_dai_remix',
      apply: () => {
        const remixG = allGarments.find((g) => g.id === 'garment-ao-dai-ngu-than-remix') ?? allGarments[0];
        setSelectedGarment(remixG);
        setPrimaryColorHex('#4A7C9B');
        setPantColorHex('#F4F0E8');
        setSelectedAccessoryIds(['acc-sneaker-retro', 'acc-tui-coi', 'acc-kinh-ram']);
        setRemixRatio(75);
        setHemLengthPercent(55);
        setSleeveWidthPercent(50);
        setSlitHeightPercent(60);
        showToast('Đã áp dụng: Soft Gen Z Remix');
      },
    },
    {
      id: 'HERITAGE_REMIX',
      title: 'Heritage Remix',
      subtitle: 'Giao thoa cá tính',
      imageAsset: 'garment_ao_tac',
      apply: () => {
        const aoTac = allGarments.find((g) => g.id === 'garment-ao-tac') ?? allGarments[0];
        setSelectedGarment(aoTac);
        setPrimaryColorHex('#2B5C8F');
        setPantColorHex('#1C1C1E');
        setSelectedAccessoryIds(['acc-khan-dong', 'acc-tui-da', 'acc-sneaker-retro']);
        setRemixRatio(50);
        setHemLengthPercent(70);
        setSleeveWidthPercent(85);
        setSlitHeightPercent(45);
        showToast('Đã áp dụng: Heritage Remix');
      },
    },
    {
      id: 'HOANG_GIA',
      title: 'Cổ Điển',
      subtitle: 'Hoàng tộc điển lễ',
      imageAsset: 'garment_ao_nhat_binh',
      apply: () => {
        const nhatBinh = allGarments.find((g) => g.id === 'garment-ao-nhat-binh') ?? allGarments[0];
        setSelectedGarment(nhatBinh);
        setPrimaryColorHex('#8B1E2B');
        setPantColorHex('#F4F0E8');
        setSelectedAccessoryIds(['acc-man-nu', 'acc-kieng-bac', 'acc-hai-sen']);
        setRemixRatio(5);
        setHemLengthPercent(95);
        setSleeveWidthPercent(90);
        setSlitHeightPercent(20);
        showToast('Đã áp dụng: Cổ Điển Hoàng Gia');
      },
    },
  ];

  // Apply & Save Outfit
  const handleApplyOutfit = () => {
    const newOutfit: Outfit = {
      id: `studio-${Date.now()}`,
      title: `${selectedGarment.name} · Studio (${remixRatio >= 65 ? 'Remix Gen Z' : remixRatio >= 35 ? 'Giao Thoa' : 'Cổ Điển'})`,
      garmentId: selectedGarment.id,
      primaryColor: primaryColorHex,
      pantColor: pantColorHex,
      accessoryIds: selectedAccessoryIds,
      characterId: activeCharacter.id,
      hairStyle: selectedHair,
      footwear: remixRatio >= 65 ? 'acc-sneaker-retro' : 'acc-hai-sen',
      adaptiveNeedCode: selectedPose === 'WHEELCHAIR' ? 'WHEELCHAIR_SEATED' : undefined,
      eventId: 'EVENT_GRADUATION',
      weatherId: 'WEATHER_HOT',
      styleVibe: remixRatio >= 65 ? 'REMIX_GEN_Z' : 'TOI_GIAN',
      chuanScore: cultureResult.score,
      chatScore: 88,
      colorHarmonyScore: harmonyResult.score,
      cultureStatus: cultureResult.status,
      retainedCharacteristics: cultureResult.retainedCharacteristics,
      sources: cultureResult.sourceIds,
      createdAt: new Date().toISOString(),
    };
    onSaveOutfit(newOutfit);
    showToast(`✓ Đã áp dụng và lưu bộ phối: ${newOutfit.title}`);
  };

  return (
    <div className="space-y-6 pb-12 font-sans animate-fade-in text-[#1F1B18]">
      {/* 1. TOP BREADCRUMB */}
      <div className="flex items-center justify-between text-xs text-[#736960] border-b border-[#E6DCCD] pb-3">
        <div className="flex items-center gap-2">
          {onBackToHome && (
            <button
              type="button"
              onClick={onBackToHome}
              className="hover:text-[#1F1B18] transition flex items-center gap-1 font-medium"
            >
              Trang chủ
            </button>
          )}
          {!onBackToHome && <span>Trang chủ</span>}
          <span>/</span>
          <span className="font-bold text-[#1F1B18]">Studio</span>
          <span className="text-[10px] text-[#8A5E17] bg-[#F6ECDA] px-2 py-0.5 rounded-full font-mono font-semibold ml-1">
            Game Phối Thời Trang
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-3 font-mono text-[11px]">
            <span>Chuẩn: <strong className="text-[#4F7350]">{cultureResult.score}/100</strong></span>
            <span>Sắc màu: <strong className="text-[#8A5E17]">{harmonyResult.score}/100</strong></span>
          </div>
          {onOpenCompare && (
            <button
              type="button"
              onClick={onOpenCompare}
              className="press text-xs font-semibold px-3 py-1 rounded-xl border border-[#E6DCCD] bg-[#FFFFFF] hover:bg-[#F1EADF] transition"
            >
              ⚖️ So sánh
            </button>
          )}
        </div>
      </div>

      {/* 2. MAIN 3-COLUMN STUDIO LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ========================================================================= */}
        {/* COLUMN 1: LEFT TOOL RAIL (lg:col-span-1 / w-20 flex-col on desktop)       */}
        {/* ========================================================================= */}
        <div className="lg:col-span-1 flex lg:flex-col gap-2 justify-center lg:justify-start">
          <div className="bg-[#FFFFFF] border border-[#E6DCCD] rounded-[24px] p-2.5 shadow-sm flex lg:flex-col gap-2 w-full">
            {[
              { id: 'GARMENT' as StudioToolTab, label: 'Trang phục', icon: '👘' },
              { id: 'ACCESSORIES' as StudioToolTab, label: 'Phụ kiện', icon: '💎' },
              { id: 'BACKGROUND' as StudioToolTab, label: 'Bối cảnh', icon: '🖼️' },
              { id: 'CHARACTER' as StudioToolTab, label: 'Nhân vật', icon: '👤' },
            ].map((tool) => {
              const isActive = activeToolTab === tool.id;
              return (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => setActiveToolTab(isActive ? null : tool.id)}
                  className={`press flex flex-col items-center justify-center p-2.5 rounded-2xl transition w-full min-h-[58px] ${
                    isActive
                      ? 'bg-[#1F1B18] text-[#FFFFFF] shadow-sm'
                      : 'hover:bg-[#F1EADF] text-[#736960] hover:text-[#1F1B18]'
                  }`}
                  title={tool.label}
                  aria-label={tool.label}
                >
                  <span className="text-xl leading-none">{tool.icon}</span>
                  <span className="text-[10px] font-semibold mt-1 tracking-tight text-center">
                    {tool.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick theme trigger badge */}
          <div className="hidden lg:block text-center mt-2">
            <span className="text-[9px] font-mono text-[#736960] uppercase block">
              {backgroundTheme === 'MINIMAL_STUDIO' ? 'Tối giản' : backgroundTheme === 'HERITAGE_PALACE' ? 'Cố đô' : 'Vườn xuân'}
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* COLUMN 2: CENTER STAGE - CANVAS & ACCESSORY SHELF (lg:col-span-7)          */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 space-y-4">
          {/* Sân Khấu Canvas Card */}
          <div className="rounded-[30px] border border-[#E6DCCD] bg-[#FFFFFF] p-5 sm:p-6 shadow-[0_4px_24px_-4px_rgba(31,27,24,0.04)] relative">
            {/* Stage Header Info */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E6DCCD] text-xs">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-[#4F7350] animate-pulse" />
                <span className="font-bold text-[#1F1B18]">{selectedGarment.name}</span>
                <span className="text-[10px] text-[#736960] hidden sm:inline">({selectedGarment.era || 'Cổ phục'})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-[#8A5E17]">
                  {remixRatio >= 65 ? '⚡ Dáng Cách Tân' : remixRatio >= 35 ? '⚖️ Dáng Giao Thoa' : '🏛️ Chuẩn Điển Chế'}
                </span>
                <button
                  type="button"
                  onClick={() => setInspectedGarment(selectedGarment)}
                  className="text-[11px] text-[#736960] hover:text-[#1F1B18] underline ml-1"
                >
                  Chi tiết
                </button>
              </div>
            </div>

            {/* Mannequin Canvas Container with 4:5 aspect ratio */}
            <div className="relative aspect-[4/5] w-full max-w-[420px] mx-auto rounded-3xl overflow-hidden bg-[#FAF6F0] border border-[#E6DCCD] shadow-inner">
              <OutfitMockupCanvas
                garment={selectedGarment}
                primaryColor={primaryColorHex}
                pantColor={pantColorHex}
                accessories={activeAccessories}
                character={activeCharacter}
                adaptiveNeedCode={selectedPose === 'WHEELCHAIR' ? 'WHEELCHAIR_SEATED' : undefined}
                backgroundTheme={backgroundTheme}
                skinTone={skinToneHex}
                hairStyle={selectedHair}
                pose={selectedPose}
                bodyShape={selectedShape}
                remixLevel={remixRatio}
                quickAdjustments={{
                  hemLengthRatio: hemLengthPercent / 100,
                  sleeveWidthRatio: sleeveWidthPercent / 100,
                  slitHeightRatio: slitHeightPercent / 100,
                }}
                activeTooltip={canvasTooltip}
                showHotspots={true}
              />
            </div>

            {/* Quick Color Swatches directly below Canvas */}
            <div className="mt-3 flex items-center justify-between px-2 pt-2 border-t border-[#F1EADF]">
              <span className="text-[11px] text-[#736960] font-medium font-serif">Màu áo chính:</span>
              <div className="flex items-center gap-1.5 overflow-x-auto">
                {selectedGarment.baseColors.map((color) => {
                  const isSelected = color.hex.toLowerCase() === primaryColorHex.toLowerCase();
                  return (
                    <button
                      key={color.hex}
                      type="button"
                      onClick={() => setPrimaryColorHex(color.hex)}
                      className={`press size-5 rounded-full border transition shrink-0 ${
                        isSelected ? 'border-[#1F1B18] ring-2 ring-[#1F1B18]/30 scale-110' : 'border-[#E6DCCD] hover:scale-105'
                      }`}
                      style={{ backgroundColor: color.hex }}
                      title={`${color.name} (${color.hex})`}
                      aria-label={`Chọn màu ${color.name}`}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* DEDICATED ACCESSORIES SHELF (Kéo thả phụ kiện vào nhân vật) */}
          <div className="rounded-[28px] border border-[#E6DCCD] bg-[#FFFFFF] p-4 shadow-[0_4px_20px_-2px_rgba(31,27,24,0.03)] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[#1F1B18] flex items-center gap-1.5">
                  <span>Kéo thả phụ kiện vào nhân vật</span>
                  <span className="text-[10px] text-[#736960] font-normal hidden sm:inline">(hoặc chạm để mặc)</span>
                </span>
              </div>

              {/* Scroll controls */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => scrollShelf('left')}
                  className="press size-7 rounded-xl border border-[#E6DCCD] bg-[#FAF6F0] hover:bg-[#EAE4DC] flex items-center justify-center text-xs text-[#736960]"
                  aria-label="Cuộn sang trái"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={() => scrollShelf('right')}
                  className="press size-7 rounded-xl border border-[#E6DCCD] bg-[#FAF6F0] hover:bg-[#EAE4DC] flex items-center justify-center text-xs text-[#736960]"
                  aria-label="Cuộn sang phải"
                >
                  ›
                </button>
              </div>
            </div>

            {/* Horizontal Shelf Track */}
            <div
              ref={shelfScrollRef}
              className="flex items-center gap-3 overflow-x-auto py-1 scroll-smooth no-scrollbar"
            >
              {allAccessories.map((acc) => {
                const isEquipped = selectedAccessoryIds.includes(acc.id);
                return (
                  <div
                    key={acc.id}
                    draggable
                    onDragStart={() => setDraggedItem(acc)}
                    onDragEnd={() => setDraggedItem(null)}
                    onClick={() => handleToggleAccessory(acc)}
                    className={`press group relative flex-shrink-0 w-24 p-2.5 rounded-2xl border transition cursor-pointer flex flex-col items-center text-center ${
                      isEquipped
                        ? 'border-[#1F1B18] bg-[#FAF6F0] ring-1 ring-[#1F1B18]/30 shadow-xs'
                        : 'border-[#E6DCCD] bg-[#FFFFFF] hover:border-[#1F1B18]/40 hover:bg-[#FAF6F0]'
                    }`}
                  >
                    {/* Equipped Badge */}
                    {isEquipped && (
                      <span className="absolute top-1 right-1 size-4 rounded-full bg-[#1F1B18] text-[#FFFFFF] text-[9px] font-bold flex items-center justify-center">
                        ✓
                      </span>
                    )}

                    {/* Accessory Icon / Representation */}
                    <div className="size-10 rounded-xl bg-[#F4F0E8] border border-[#E6DCCD] flex items-center justify-center text-lg mb-1.5 group-hover:scale-105 transition-transform">
                      {acc.type === 'HEADWEAR' && '🧢'}
                      {acc.type === 'HAIR_ACCESSORY' && '🌸'}
                      {acc.type === 'JEWELRY' && '📿'}
                      {acc.type === 'PENDANT' && '🎖️'}
                      {acc.type === 'HANDHELD' && '🪭'}
                      {acc.type === 'BAG' && '👜'}
                      {acc.type === 'BELT_SASH' && '🎗️'}
                      {acc.type === 'FOOTWEAR' && '👟'}
                    </div>

                    <span className="text-[10px] font-bold text-[#1F1B18] leading-tight line-clamp-1">
                      {acc.name.split('(')[0].trim()}
                    </span>

                    <span className="text-[9px] text-[#736960] mt-0.5">
                      {isEquipped ? 'Đang mặc' : '+ Thêm'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* COLUMN 3: RIGHT CONTROL PANEL (lg:col-span-4)                              */}
        {/* ========================================================================= */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-[30px] border border-[#E6DCCD] bg-[#FFFFFF] p-5 sm:p-6 shadow-[0_4px_24px_-4px_rgba(31,27,24,0.04)] space-y-5">
            {/* 1. TRADITIONAL ↔ REMIX SLIDER */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#1F1B18] tracking-tight">Traditional ⟷ Remix</span>
                <span className="font-mono text-xs font-bold text-[#1F1B18]">
                  {remixRatio}%
                </span>
              </div>

              {/* Slider Track */}
              <div className="relative pt-1 pb-1">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={remixRatio}
                  onChange={(e) => setRemixRatio(Number(e.target.value))}
                  className="w-full h-2.5 bg-[#F1EADF] rounded-lg appearance-none cursor-pointer accent-[#1F1B18]"
                  aria-label="Điều chỉnh Traditional sang Remix"
                />

                <div className="flex justify-between text-[11px] text-[#736960] font-medium mt-1.5">
                  <span className="cursor-pointer hover:text-[#1F1B18]" onClick={() => setRemixRatio(0)}>
                    Truyền thống
                  </span>
                  <span className="cursor-pointer hover:text-[#1F1B18]" onClick={() => setRemixRatio(100)}>
                    Hiện đại
                  </span>
                </div>
              </div>

              {/* Cultural Threshold Warning Badge (Ngưỡng mất đặc trưng khi >= 65%) */}
              {remixRatio >= 65 && (
                <div className="animate-fade-in p-2.5 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] flex items-start gap-2 text-xs">
                  <span className="text-amber-600 text-sm mt-0.5">⚠️</span>
                  <div className="space-y-0.5">
                    <span className="font-bold text-amber-900 block text-[11px]">
                      Ngưỡng mất đặc trưng
                    </span>
                    <p className="text-[10px] text-amber-800 leading-snug">
                      Độ biến tấu cao ({remixRatio}%). Tà áo đã được cắt ngắn dáng lửng, cổ áo mở cách tân và chuyển sang phom quần culottes hiện đại.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* 2. CHỈNH NHANH (QUICK ADJUSTMENTS) */}
            <div className="pt-4 border-t border-[#E6DCCD] space-y-3.5">
              <span className="text-xs font-bold text-[#1F1B18] block tracking-tight">
                Chỉnh nhanh
              </span>

              {/* Slider: Độ dài tà */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-[#736960] font-medium">Độ dài tà</span>
                  <span className="font-mono font-bold text-[#1F1B18]">{hemLengthPercent}%</span>
                </div>
                <input
                  type="range"
                  min={30}
                  max={100}
                  value={hemLengthPercent}
                  onChange={(e) => setHemLengthPercent(Number(e.target.value))}
                  className="w-full h-1.5 bg-[#F1EADF] rounded-lg appearance-none cursor-pointer accent-[#1F1B18]"
                />
              </div>

              {/* Slider: Độ rộng tay */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-[#736960] font-medium">Độ rộng tay</span>
                  <span className="font-mono font-bold text-[#1F1B18]">{sleeveWidthPercent}%</span>
                </div>
                <input
                  type="range"
                  min={30}
                  max={100}
                  value={sleeveWidthPercent}
                  onChange={(e) => setSleeveWidthPercent(Number(e.target.value))}
                  className="w-full h-1.5 bg-[#F1EADF] rounded-lg appearance-none cursor-pointer accent-[#1F1B18]"
                />
              </div>

              {/* Slider: Độ xẻ tà */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-[#736960] font-medium">Độ xẻ tà</span>
                  <span className="font-mono font-bold text-[#1F1B18]">{slitHeightPercent}%</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={80}
                  value={slitHeightPercent}
                  onChange={(e) => setSlitHeightPercent(Number(e.target.value))}
                  className="w-full h-1.5 bg-[#F1EADF] rounded-lg appearance-none cursor-pointer accent-[#1F1B18]"
                />
              </div>
            </div>

            {/* 3. GỢI Ý PHỐI (4 Outfit Preview Thumbnails) */}
            <div className="pt-4 border-t border-[#E6DCCD] space-y-2.5">
              <span className="text-xs font-bold text-[#1F1B18] block tracking-tight">
                Gợi ý phối
              </span>

              <div className="grid grid-cols-4 gap-2">
                {AI_STYLE_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={preset.apply}
                    className="press group p-2 rounded-2xl border border-[#E6DCCD] bg-[#FAF6F0] hover:border-[#1F1B18] hover:bg-[#FFFFFF] transition text-center flex flex-col items-center"
                    title={`${preset.title}: ${preset.subtitle}`}
                  >
                    <div className="size-10 rounded-xl bg-[#FFFFFF] border border-[#E6DCCD] flex items-center justify-center text-sm shadow-2xs group-hover:scale-105 transition-transform mb-1">
                      {preset.id === 'TOI_GIAN' && '🌿'}
                      {preset.id === 'SOFT_GEN_Z' && '👟'}
                      {preset.id === 'HERITAGE_REMIX' && '⚡'}
                      {preset.id === 'HOANG_GIA' && '👑'}
                    </div>
                    <span className="text-[10px] font-bold text-[#1F1B18] truncate w-full">
                      {preset.title}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* 4. PRIMARY ACTION BUTTON: ÁP DỤNG */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleApplyOutfit}
                className="press w-full py-3.5 px-4 rounded-2xl bg-[#1F1B18] text-[#FFFFFF] text-xs font-bold shadow-sm hover:bg-[#332E29] transition flex items-center justify-center gap-2"
              >
                <span>✓</span>
                <span>Áp dụng</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. DRAWER / MODAL: TRANG PHỤC PICKER (When activeToolTab === 'GARMENT')    */}
      {/* ========================================================================= */}
      {activeToolTab === 'GARMENT' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1F1B18]/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-2xl rounded-3xl bg-[#FFFFFF] border border-[#E6DCCD] p-6 shadow-xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6DCCD]">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#1F1B18]">Chọn loại Việt phục</h3>
                <p className="text-xs text-[#736960]">Chọn y phục truyền thống để đưa lên người mẫu sân khấu ảo</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveToolTab(null)}
                className="press size-8 rounded-full border border-[#E6DCCD] hover:bg-[#F1EADF] flex items-center justify-center text-sm"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {allGarments.map((g) => {
                const isSelected = g.id === selectedGarment.id;
                return (
                  <div
                    key={g.id}
                    onClick={() => {
                      setSelectedGarment(g);
                      setPrimaryColorHex(g.baseColors[0].hex);
                      setActiveToolTab(null);
                      showToast(`Đã chọn: ${g.name}`);
                    }}
                    className={`press p-3.5 rounded-2xl border transition cursor-pointer flex items-start gap-3 ${
                      isSelected
                        ? 'border-[#1F1B18] bg-[#FAF6F0] ring-1 ring-[#1F1B18]/30 shadow-xs'
                        : 'border-[#E6DCCD] hover:border-[#1F1B18]/40 hover:bg-[#FBF8F3]'
                    }`}
                  >
                    <div className="size-12 rounded-xl bg-[#EFE9DD] border border-[#E6DCCD] flex items-center justify-center text-xl shrink-0">
                      👘
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-[#1F1B18] truncate">{g.name}</span>
                        {isSelected && <span className="text-[10px] text-[#4F7350] font-bold">✓ Đang chọn</span>}
                      </div>
                      <p className="text-[11px] text-[#736960] line-clamp-2 mt-0.5">{g.description}</p>
                      <div className="flex items-center gap-1 mt-2">
                        {g.baseColors.slice(0, 4).map((c) => (
                          <span
                            key={c.hex}
                            className="size-3 rounded-full border border-[#E6DCCD]"
                            style={{ backgroundColor: c.hex }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. DRAWER / MODAL: BỐI CẢNH (When activeToolTab === 'BACKGROUND')           */}
      {/* ========================================================================= */}
      {activeToolTab === 'BACKGROUND' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1F1B18]/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-[#FFFFFF] border border-[#E6DCCD] p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6DCCD]">
              <h3 className="font-serif text-lg font-bold text-[#1F1B18]">Chọn Bối Cảnh Sân Khấu</h3>
              <button
                type="button"
                onClick={() => setActiveToolTab(null)}
                className="press size-8 rounded-full border border-[#E6DCCD] hover:bg-[#F1EADF] flex items-center justify-center text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5">
              {BACKGROUND_THEMES.map((theme) => {
                const isSelected = backgroundTheme === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => {
                      setBackgroundTheme(theme.id);
                      setActiveToolTab(null);
                      showToast(`Đã đổi bối cảnh: ${theme.label}`);
                    }}
                    className={`press w-full p-4 rounded-2xl border transition text-left flex items-center gap-3.5 ${
                      isSelected
                        ? 'border-[#1F1B18] bg-[#FAF6F0] ring-1 ring-[#1F1B18]/30 font-bold'
                        : 'border-[#E6DCCD] hover:bg-[#FBF8F3]'
                    }`}
                  >
                    <span className="text-2xl">{theme.icon}</span>
                    <span className="text-xs text-[#1F1B18]">{theme.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. DRAWER / MODAL: NHÂN VẬT & TẠO DÁNG (When activeToolTab === 'CHARACTER') */}
      {/* ========================================================================= */}
      {activeToolTab === 'CHARACTER' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1F1B18]/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-[#FFFFFF] border border-[#E6DCCD] p-6 shadow-xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6DCCD]">
              <h3 className="font-serif text-lg font-bold text-[#1F1B18]">Tùy Chỉnh Người Mẫu</h3>
              <button
                type="button"
                onClick={() => setActiveToolTab(null)}
                className="press size-8 rounded-full border border-[#E6DCCD] hover:bg-[#F1EADF] flex items-center justify-center text-sm"
              >
                ✕
              </button>
            </div>

            {/* Tông da */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-[#1F1B18]">Tông da</span>
              <div className="flex items-center gap-2 overflow-x-auto py-1">
                {SKIN_TONES.map((tone) => (
                  <button
                    key={tone.hex}
                    type="button"
                    onClick={() => setSkinToneHex(tone.hex)}
                    className={`press size-7 rounded-full border transition shrink-0 ${
                      skinToneHex === tone.hex ? 'border-[#1F1B18] ring-2 ring-[#1F1B18]/30 scale-110' : 'border-[#E6DCCD]'
                    }`}
                    style={{ backgroundColor: tone.hex }}
                    title={tone.label}
                  />
                ))}
              </div>
            </div>

            {/* Kiểu tóc */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-[#1F1B18]">Kiểu tóc</span>
              <div className="grid grid-cols-2 gap-2">
                {HAIR_SILHOUETTES.map((hair) => (
                  <button
                    key={hair.id}
                    type="button"
                    onClick={() => setSelectedHair(hair.id)}
                    className={`press p-2.5 rounded-xl border text-xs text-left transition ${
                      selectedHair === hair.id ? 'border-[#1F1B18] bg-[#FAF6F0] font-bold' : 'border-[#E6DCCD]'
                    }`}
                  >
                    {hair.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tư thế */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-[#1F1B18]">Tư thế / Vóc dáng</span>
              <div className="grid grid-cols-2 gap-2">
                {POSES.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPose(p.id)}
                    className={`press p-2.5 rounded-xl border text-xs text-left transition ${
                      selectedPose === p.id ? 'border-[#1F1B18] bg-[#FAF6F0] font-bold' : 'border-[#E6DCCD]'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveToolTab(null)}
              className="press w-full py-2.5 rounded-xl bg-[#1F1B18] text-[#FFFFFF] text-xs font-bold"
            >
              Hoàn tất
            </button>
          </div>
        </div>
      )}

      {/* INSPECTED GARMENT MODAL */}
      {inspectedGarment && (
        <GarmentDetailModal
          garment={inspectedGarment}
          onClose={() => setInspectedGarment(null)}
          onSelectForStyling={(g) => {
            setSelectedGarment(g);
            setPrimaryColorHex(g.baseColors[0].hex);
            setInspectedGarment(null);
            showToast(`Đã chọn: ${g.name}`);
          }}
        />
      )}
    </div>
  );
};
