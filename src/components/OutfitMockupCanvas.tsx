/**
 * Vstyle Master Editorial Fashion Outfit Canvas
 * High-fidelity vector illustration system combining data-driven historical authenticity,
 * three-tone fabric depth, refined character silhouettes, and layered accessories.
 */

import React, { useRef, useState, useMemo } from 'react';
import type { Garment, Accessory, CharacterItem, FunctionalNeedCode } from '../types/fashion';
import { CharacterFigure } from '../lib/visualization/illustration/CharacterFigure';
import { Garments } from '../lib/visualization/illustration/Garments';
import { Accessories } from '../lib/visualization/illustration/Accessories';
import { SceneBackdrop } from '../lib/visualization/illustration/SceneBackdrop';
import { GroundShadow } from '../lib/visualization/illustration/GroundShadow';
import { Hotspots } from '../lib/visualization/illustration/Hotspots';

export interface AdaptiveAdjustmentsState {
  frontHemReduction?: number; // 0 to 30 cm
  sleeveLength?: number;      // -15 to +10 cm
  sleeveWidth?: number;       // 0 to 15 cm
  slitPosition?: number;      // 0 to 25 cm
  openingWidth?: number;      // 0 to 15 cm
  closureType?: string;       // 'MAGNETIC' | 'VELCRO' | 'BUTTON' | 'ZIPPER'
}

export interface OutfitMockupCanvasProps {
  garment: Garment;
  primaryColor: string;
  pantColor: string;
  accessories?: Accessory[];
  character: CharacterItem;
  adaptiveNeedCode?: string;
  adaptiveNeedCodes?: FunctionalNeedCode[];
  styleId?: string;
  eventId?: string;
  weatherId?: string;
  onColorChange?: (colorHex: string) => void;
  backgroundTheme?: 'MINIMAL_STUDIO' | 'HERITAGE_PALACE' | 'GARDEN_SPRING';
  compact?: boolean;
  adaptiveAdjustments?: AdaptiveAdjustmentsState;
  showHotspots?: boolean;
  onHandleDrag?: (handleName: string, deltaY: number) => void;
  hairStyle?: string;
  skinTone?: string | null;
  pose?: string;
  bodyShape?: string;
  fabricType?: 'SILK' | 'BROCADE' | 'COTTON';
  remixLevel?: number; // 0 to 100
  quickAdjustments?: {
    hemLengthRatio?: number;
    sleeveWidthRatio?: number;
    slitHeightRatio?: number;
  };
  /** Uniform scale of the figure around the feet (height preview), 1 = default. */
  figureScale?: number;
  /** Absolutely positioned content drawn over the 400×500 canvas (e.g. drag handles). */
  overlay?: React.ReactNode;
  activeTooltip?: {
    title: string;
    subtitle: string;
    actionLabel?: string;
    onAction?: () => void;
  } | null;
}

export const OutfitMockupCanvas: React.FC<OutfitMockupCanvasProps> = ({
  garment,
  primaryColor,
  pantColor,
  accessories = [],
  character,
  adaptiveNeedCode,
  adaptiveNeedCodes,
  styleId = 'TRUYEN_THONG_HOANG_GIA',
  eventId = 'EVENT_TET',
  weatherId = 'WEATHER_PLEASANT',
  onColorChange,
  backgroundTheme = 'MINIMAL_STUDIO',
  compact = false,
  adaptiveAdjustments,
  showHotspots = false,
  hairStyle,
  skinTone,
  pose,
  bodyShape,
  fabricType = 'SILK',
  remixLevel = 0,
  quickAdjustments,
  activeTooltip,
  figureScale = 1,
  overlay,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [internalHotspotsVisible, setInternalHotspotsVisible] = useState(showHotspots);

  // Check if adaptive needs or wheelchair posture apply
  const isWheelchair = useMemo(() => {
    if (pose === 'WHEELCHAIR' || character.posture === 'WHEELCHAIR_SEATED') return true;
    if (adaptiveNeedCode === 'WHEELCHAIR_SEATED') return true;
    if (adaptiveNeedCodes?.includes('WHEELCHAIR_SEATED' as FunctionalNeedCode)) return true;
    return false;
  }, [pose, character.posture, adaptiveNeedCode, adaptiveNeedCodes]);

  const hasAdaptive = isWheelchair || Boolean(adaptiveNeedCode && adaptiveNeedCode !== 'NONE') || Boolean(adaptiveNeedCodes && adaptiveNeedCodes.length > 0);

  // Effective hair
  const activeHair = hairStyle || (character as any).hairStyle || 'TOC_VAN';
  const activeSkinTone = skinTone || character.skinTone || '#FCE5D8';
  const activeBodyShape = bodyShape || (character.bodyRepresentation?.includes('Đầy Đặn') ? 'CURVED' : 'BALANCED');

  // Filter remix accessories based on remix level
  const effectiveAccessories = useMemo(() => {
    if (!accessories) return [];
    if (remixLevel <= 30) {
      // Classic traditional filter: prioritize traditional accessories
      return accessories.filter((a) => !a.id.includes('sneaker'));
    }
    return accessories;
  }, [accessories, remixLevel]);

  // High-Resolution PNG Export (800x1000)
  const handleDownload = () => {
    if (!svgRef.current) return;
    try {
      const svgData = new XMLSerializer().serializeToString(svgRef.current);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const URL = window.URL || window.webkitURL || window;
      const blobURL = URL.createObjectURL(svgBlob);
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 1000;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#FAF6F0';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
          const pngUrl = canvas.toDataURL('image/png');
          const downloadLink = document.createElement('a');
          downloadLink.href = pngUrl;
          downloadLink.download = `Vstyle-${garment.name.replace(/\s+/g, '_')}-${Date.now()}.png`;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
        }
        URL.revokeObjectURL(blobURL);
      };
      image.src = blobURL;
    } catch {
      // Fallback
    }
  };

  return (
    <div className={`relative flex flex-col items-center w-full ${compact ? '' : 'p-2'}`}>
      {/* Top action toolbar (hidden in compact card mode) */}
      {!compact && (
        <div className="w-full flex flex-wrap items-center justify-between gap-2 mb-2 px-1">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-[#8A5E17] uppercase tracking-wider font-mono flex items-center gap-1.5">
              <span className="size-2 shrink-0 rounded-full bg-[#1F1B18]" />
              {garment.name}
            </span>
            {hasAdaptive && (
              <span className="inline-flex items-center gap-1 whitespace-nowrap text-[10px] font-semibold text-[#4F7350] bg-[#E5EDE2] border border-[#CDE0C9] px-2 py-0.5 rounded-full">
                <span className="text-xs">✓</span> Đã điều chỉnh
              </span>
            )}
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            {/* Hotspots toggle */}
            <button
              type="button"
              onClick={() => setInternalHotspotsVisible((v) => !v)}
              className={`press whitespace-nowrap text-[11px] font-medium px-2.5 py-1 rounded-xl border transition ${
                internalHotspotsVisible
                  ? 'bg-[#1F1B18] text-[#FFFFFF] border-[#1F1B18]'
                  : 'bg-[#FFFFFF] text-[#736960] border-[#E6DCCD] hover:bg-[#F1EADF]'
              }`}
            >
              {internalHotspotsVisible ? 'Ẩn điểm văn hóa' : '✦ Điểm văn hóa'}
            </button>

            {/* PNG Export */}
            <button
              type="button"
              onClick={handleDownload}
              className="press inline-flex items-center gap-1 whitespace-nowrap text-[11px] font-semibold text-[#1F1B18] bg-[#FFFFFF] border border-[#E6DCCD] hover:bg-[#F1EADF] px-2.5 py-1 rounded-xl transition shadow-2xs"
              title="Tải ảnh minh họa PNG chất lượng cao"
            >
              <svg aria-hidden="true" className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Tải PNG
            </button>
          </div>
        </div>
      )}

      {/* Main Vector Canvas: 3:4 aspect ratio, responsive viewBox 0 0 400 500 */}
      <div className="relative w-full aspect-[4/5] max-w-[420px] rounded-3xl overflow-hidden bg-[#FAF6F0] border border-[#E6DCCD] shadow-sm select-none">
        <svg
          ref={svgRef}
          viewBox="0 0 400 500"
          className="w-full h-full select-none"
          role="img"
          aria-label={`Minh họa thời trang ${garment.name} - ${character.name}`}
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* LAYER 1: EDITORIAL SCENE BACKDROP */}
          <SceneBackdrop
            eventId={eventId}
            weatherId={weatherId}
            backgroundTheme={backgroundTheme}
          />

          {/* LAYER 2: SOFT GROUND SHADOW (Anchoring character) */}
          <GroundShadow isSeated={isWheelchair} />

          <g transform={figureScale !== 1 ? `translate(200 470) scale(${figureScale}) translate(-200 -470)` : undefined}>
          {/* LAYER 3: ACCESSORIES BACK (Hanging scarves, ribbons behind shoulders) */}
          <Accessories
            accessories={effectiveAccessories}
            layer="BACK"
            isWheelchair={isWheelchair}
          />

          {/* LAYER 4: REFINED EDITORIAL CHARACTER FIGURE (Anatomy, Skin, Hair) */}
          <CharacterFigure
            skinToneHex={activeSkinTone}
            hairId={activeHair}
            bodyShape={activeBodyShape}
            pose={pose}
            gender={character.gender}
            isWheelchair={isWheelchair}
          />

          {/* LAYER 5: DATA-DRIVEN AUTHENTIC GARMENT (3-Tone, Folds, 5 Buttons, Fabric Depth, Dynamic Remix) */}
          <g id="smooth-garment-layer" style={{ transition: 'all 200ms ease-out' }}>
            <Garments
              garment={garment}
              primaryColor={primaryColor}
              pantColor={pantColor}
              fabricType={fabricType}
              isWheelchair={isWheelchair}
              adaptiveAdjustments={adaptiveAdjustments}
              remixLevel={remixLevel}
              quickAdjustments={quickAdjustments}
            />
          </g>

          {/* LAYER 6: ACCESSORIES FRONT (Headwear, Kiềng Bạc, Thẻ Bài, Trâm Cài, Kính Râm) */}
          <Accessories
            accessories={effectiveAccessories}
            layer="FRONT"
            isWheelchair={isWheelchair}
          />

          {/* LAYER 7: ACCESSORIES HANDHELD (Quạt trầm hương, Túi cói, Túi da) */}
          <Accessories
            accessories={effectiveAccessories}
            layer="HANDHELD"
            isWheelchair={isWheelchair}
          />

          {/* LAYER 8: ACCESSORIES FOOTWEAR (Hài sen, Guốc mộc, Sneaker) */}
          <Accessories
            accessories={effectiveAccessories}
            layer="FOOTWEAR"
            isWheelchair={isWheelchair}
          />

          {/* LAYER 9: CULTURAL HOTSPOTS (Interactive educational pins) */}
          {(internalHotspotsVisible || showHotspots) && (
            <Hotspots garmentId={garment.id} isWheelchair={isWheelchair} />
          )}

          </g>

          {/* LAYER 10: WATERMARK BADGE */}
          <g id="vstyle-editorial-seal" opacity="0.45" transform="translate(18, 478)">
            <text
              fontFamily="Fraunces Variable, Fraunces, Georgia, serif"
              fontSize="9"
              fontWeight="bold"
              fill="#736960"
              letterSpacing="0.8"
            >
              VSTYLE · VIỆT PHỤC REMIX
            </text>
          </g>
        </svg>

        {overlay}

        {/* Interactive Floating Tooltip (As shown in Screen 4 of Vstyle design) */}
        {activeTooltip && (
          <div className="absolute top-[22%] right-4 max-w-[200px] z-20 animate-fade-in pointer-events-auto">
            <div className="rounded-2xl border border-[#E6DCCD] bg-[#FFFFFF]/95 backdrop-blur-md p-3 shadow-lg text-left text-xs space-y-1 relative">
              {/* Pointer indicator tick */}
              <div className="absolute -left-1.5 top-4 size-3 bg-[#FFFFFF] border-l border-b border-[#E6DCCD] -rotate-45" />
              <div className="font-bold text-[#1F1B18] text-[12px] flex items-center justify-between">
                <span>{activeTooltip.title}</span>
                <span className="text-[10px] text-[#8A5E17] font-mono">✦</span>
              </div>
              <p className="text-[10px] text-[#736960] leading-relaxed">
                {activeTooltip.subtitle}
              </p>
              {activeTooltip.onAction && (
                <button
                  type="button"
                  onClick={activeTooltip.onAction}
                  className="press inline-flex items-center gap-1 text-[10px] font-bold text-[#8A5E17] hover:underline pt-0.5"
                >
                  {activeTooltip.actionLabel || 'Xem chi tiết →'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Floating Adaptive Badge if tailored for wheelchair or adaptive need */}
        {hasAdaptive && (
          <div className="absolute bottom-3 right-3 pointer-events-none">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FFFFFF]/90 backdrop-blur-md border border-[#CDE0C9] text-[10px] font-bold text-[#4F7350] shadow-sm">
              <span className="size-1.5 rounded-full bg-[#4F7350]" />
              {isWheelchair ? 'Phom Ngồi Xe Lăn' : 'May Đo Thích Ứng'}
            </div>
          </div>
        )}
      </div>

      {/* Quick Color Swatches below Canvas (if onColorChange provided) */}
      {!compact && onColorChange && garment.baseColors && garment.baseColors.length > 1 && (
        <div className="mt-3 flex items-center gap-2 overflow-x-auto py-1 max-w-full">
          <span className="text-[11px] text-[#736960] font-medium shrink-0 font-serif">Màu áo đã duyệt:</span>
          {garment.baseColors.map((color) => {
            const isSelected = color.hex.toLowerCase() === primaryColor.toLowerCase();
            return (
              <button
                key={color.hex}
                type="button"
                onClick={() => onColorChange(color.hex)}
                className={`press relative size-6 rounded-full border transition shrink-0 ${
                  isSelected ? 'border-[#1F1B18] ring-2 ring-[#1F1B18]/30 scale-110' : 'border-[#E6DCCD] hover:scale-105'
                }`}
                style={{ backgroundColor: color.hex }}
                title={`${color.name} (${color.hex})`}
                aria-label={`Chọn màu ${color.name}`}
              >
                {isSelected && (
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] text-white font-bold drop-shadow-xs">
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
