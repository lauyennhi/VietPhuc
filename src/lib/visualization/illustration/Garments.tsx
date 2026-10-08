/**
 * Data-Driven Authentic Vietnamese Traditional Garment Vector Renderers
 * Implements the 3-tone system, fabric depth, authentic construction,
 * exact button counts, subtle construction fold lines,
 * and dynamic Traditional vs Remix fashion transformations.
 */

import React from 'react';
import type { Garment } from '../../../types/fashion';
import { computeGarmentTones } from './tones';

export interface GarmentsProps {
  garment: Garment;
  primaryColor: string;
  pantColor: string;
  fabricType?: 'SILK' | 'BROCADE' | 'COTTON';
  isWheelchair?: boolean;
  adaptiveAdjustments?: {
    frontHemReduction?: number;
    slitPosition?: number;
    sleeveLength?: number;
    sleeveWidth?: number;
  };
  remixLevel?: number; // 0 (100% Traditional) to 100 (100% Remix)
  quickAdjustments?: {
    hemLengthRatio?: number;   // 0.3 to 1.0 (Độ dài tà)
    sleeveWidthRatio?: number; // 0.3 to 1.0 (Độ rộng tay)
    slitHeightRatio?: number;  // 0.1 to 0.8 (Độ xẻ tà)
  };
}

export const Garments: React.FC<GarmentsProps> = ({
  garment,
  primaryColor,
  pantColor,
  fabricType = 'SILK',
  isWheelchair = false,
  adaptiveAdjustments = {},
  remixLevel = 0,
  quickAdjustments,
}) => {
  const tones = computeGarmentTones(primaryColor, fabricType);

  // Traditional vs Remix thresholds
  const effectiveRemix = Math.max(0, Math.min(100, remixLevel));
  const isRemixHigh = effectiveRemix >= 65;
  const isRemixModerate = effectiveRemix >= 35 && effectiveRemix < 65;

  // Adaptive adjustments in px
  const hemReductionPx = isWheelchair ? 28 : (adaptiveAdjustments.frontHemReduction ?? 0) * 1.6;
  const slitRaisePx = isWheelchair ? 16 : (adaptiveAdjustments.slitPosition ?? 0) * 1.5;
  const sleeveDelta = (adaptiveAdjustments.sleeveLength ?? 0) * 1.2;

  // Hem length ratio:
  // If quickAdjustments.hemLengthRatio is provided (0.3 to 1.0), use it;
  // otherwise smoothly scale based on remixLevel (0% -> 1.0 full ankle length, 100% -> 0.65 modern crop/midi)
  const hemRatio = quickAdjustments?.hemLengthRatio !== undefined
    ? quickAdjustments.hemLengthRatio
    : (1 - (effectiveRemix / 100) * 0.35);

  // Sleeve width ratio:
  // If quickAdjustments.sleeveWidthRatio is provided (0.3 to 1.0), use it;
  // otherwise traditional stays wide or chẽn, remix scales down slightly
  const sleeveWidthRatio = quickAdjustments?.sleeveWidthRatio !== undefined
    ? quickAdjustments.sleeveWidthRatio
    : (1 - (effectiveRemix / 100) * 0.22);

  // Slit height ratio:
  // If quickAdjustments.slitHeightRatio is provided (0.1 to 0.8), use it;
  // otherwise scales higher in remix mode
  const slitRatio = quickAdjustments?.slitHeightRatio !== undefined
    ? quickAdjustments.slitHeightRatio
    : (0.35 + (effectiveRemix / 100) * 0.32);

  // Dynamic standing hem Y:
  // Waist is at y=235, full traditional ankle hem is at y=426.
  // At hemRatio = 1.0 -> y = 426
  // At hemRatio = 0.4 -> y = 235 + 191*0.4 = 311 (short modern tunic / crop)
  const baseHemY = 426;
  const dynamicHemY = isWheelchair
    ? (350 - hemReductionPx)
    : Math.round(235 + (baseHemY - 235) * Math.max(0.35, Math.min(1.05, hemRatio)) - hemReductionPx);

  // Dynamic side slit Y (apex of slit):
  // At low slit: apex at y=260. At high slit: apex rises to y=205.
  const dynamicSlitY = isWheelchair
    ? 250
    : Math.round(265 - 65 * Math.max(0.1, Math.min(0.85, slitRatio)) - slitRaisePx);

  // Dynamic sleeve width delta
  const sleeveFlare = Math.round((sleeveWidthRatio - 0.7) * 28);

  const template = garment.svgTemplate || 'NGU_THAN_TAY_CHEN';

  // Exact 5 button coordinates for traditional Ngũ thân
  const nguThanButtons = [
    { cx: 203, cy: 124 }, // 1. Cúc cổ
    { cx: 211, cy: 138 }, // 2. Cúc xương đòn
    { cx: 221, cy: 156 }, // 3. Cúc nách
    { cx: 226, cy: 182 }, // 4. Cúc sườn trên
    { cx: 228, cy: 212 }, // 5. Cúc sườn dưới
  ];

  return (
    <g id="garment-render-layer" className="transition-all duration-200 ease-out">
      <defs>
        {/* Fabric Sheen (Silk / Satin) */}
        <linearGradient id="garm-silk-sheen" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity={isRemixHigh ? "0.26" : "0.18"} />
          <stop offset="30%" stopColor="#FFFFFF" stopOpacity="0.04" />
          <stop offset="60%" stopColor="#000000" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.22" />
        </linearGradient>

        {/* Brocade Jacquard Pattern */}
        <pattern id="garm-brocade" width="28" height="28" patternUnits="userSpaceOnUse">
          <path
            d="M14 0 C18 6, 22 10, 28 14 C22 18, 18 22, 14 28 C10 22, 6 18, 0 14 C6 10, 10 6, 14 0 Z M14 7 C17 11, 21 14, 14 21 C7 14, 11 11, 14 7 Z"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="0.6"
            opacity="0.16"
          />
        </pattern>

        {/* Nhat Binh Five-Color Rainbow Sleeve Bands */}
        <linearGradient id="nhat-binh-ngu-sac" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#1E3A8A" />
          <stop offset="20%" stopColor="#D97706" />
          <stop offset="40%" stopColor="#F8FAFC" />
          <stop offset="60%" stopColor="#DC2626" />
          <stop offset="80%" stopColor="#047857" />
          <stop offset="100%" stopColor="#1E3A8A" />
        </linearGradient>

        {/* Nhat Binh Gold Embroidered Collar Motif */}
        <linearGradient id="nhat-binh-collar-gold" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#D4AF37" />
          <stop offset="50%" stopColor="#FDF0CD" />
          <stop offset="100%" stopColor="#996515" />
        </linearGradient>
      </defs>

      {/* ============================================================== */}
      {/* 1. TROUSERS / LOWER GARMENT                                    */}
      {/* ============================================================== */}
      {template !== 'AO_TU_THAN' && (
        <g id="garment-trousers">
          {!isWheelchair ? (
            // Standing Trousers: Classic Long vs Modern Ankle Culottes
            <g id="standing-trousers">
              {isRemixHigh ? (
                // Modern Cropped Culottes / Straight Trousers (hem raised to y=418 showing sneakers)
                <g id="remix-culottes">
                  <path
                    d="M174 245 L163 416 C175 420, 185 420, 195 416 L198 290 L202 290 L205 416 C215 420, 225 420, 237 416 L226 245 Z"
                    fill={pantColor}
                  />
                  {/* Clean front press crease */}
                  <line x1="179" y1="290" x2="179" y2="415" stroke="#1F1B18" strokeWidth="0.75" opacity="0.16" />
                  <line x1="221" y1="290" x2="221" y2="415" stroke="#1F1B18" strokeWidth="0.75" opacity="0.16" />
                  <line x1="200" y1="290" x2="200" y2="415" stroke="#1F1B18" strokeWidth="0.8" opacity="0.18" />
                  {/* Modern pants cuff */}
                  <rect x="163" y="411" width="32" height="5" fill="#000000" opacity="0.06" />
                  <rect x="205" y="411" width="32" height="5" fill="#000000" opacity="0.06" />
                </g>
              ) : (
                // Traditional Wide-leg Silk Trousers
                <g id="traditional-trousers">
                  <path
                    d="M174 245 L158 448 C172 452, 188 452, 196 448 L198 290 L202 290 L204 448 C212 452, 228 452, 242 448 L226 245 Z"
                    fill={pantColor}
                  />
                  <path d="M200 290 L200 448" stroke="#1F1B18" strokeWidth="0.8" opacity="0.18" />
                  <path d="M177 305 C175 355, 172 405, 170 445" stroke="#1F1B18" strokeWidth="0.75" fill="none" opacity="0.12" />
                  <path d="M223 305 C225 355, 228 405, 230 445" stroke="#1F1B18" strokeWidth="0.75" fill="none" opacity="0.12" />
                </g>
              )}
            </g>
          ) : (
            // Seated Wheelchair Trousers
            <g id="seated-trousers">
              <path d="M170 255 L245 268 L240 315 L165 305 Z" fill={pantColor} />
              <path d="M226 305 L236 432 L250 432 L242 305 Z" fill={pantColor} />
              <path d="M236 305 C238 318, 240 330, 241 345" stroke="#1F1B18" strokeWidth="1" fill="none" opacity="0.2" />
            </g>
          )}
        </g>
      )}

      {/* ============================================================== */}
      {/* 2. SPECIFIC GARMENT TEMPLATES                                  */}
      {/* ============================================================== */}

      {/* -------------------------------------------------------------- */}
      {/* A. ÁO NGŨ THÂN TAY CHẼN / REMIX                                */}
      {/* -------------------------------------------------------------- */}
      {(template === 'NGU_THAN_TAY_CHEN' || template === 'NGU_THAN_REMIX') && (
        <g id="garment-ngu-than-tay-chen">
          {/* Back Hem Underlay */}
          {!isWheelchair && (
            <path
              d={`M166 235 L158 ${dynamicHemY + 2} C195 ${dynamicHemY + 12}, 205 ${dynamicHemY + 12}, 242 ${dynamicHemY + 2} L234 235 Z`}
              fill={tones.shadow}
            />
          )}

          {/* Thân Con (Inner 5th Panel) */}
          <path
            d="M190 126 L182 245 L196 245 L199 135 Z"
            fill={tones.deepShadow}
            opacity="0.85"
          />
          <path d="M196 135 L196 245" stroke="#FFFFFF" strokeWidth="0.8" opacity="0.3" strokeDasharray="3 3" />

          {/* Main Body & Front Panels (Vạt Hữu Nhậm) */}
          {!isWheelchair ? (
            <path
              d={`M186 124 C196 127, 206 122, 212 118 L223 154 L229 235 L238 ${dynamicHemY} C205 ${dynamicHemY + 12}, 195 ${dynamicHemY + 12}, 162 ${dynamicHemY} L168 235 L174 130 Z`}
              fill={tones.base}
            />
          ) : (
            <path
              d={`M186 124 C196 127, 206 122, 212 118 L223 154 L229 235 L245 270 L242 ${350 - hemReductionPx} C210 ${356 - hemReductionPx}, 190 ${356 - hemReductionPx}, 166 ${348 - hemReductionPx} L168 235 L174 130 Z`}
              fill={tones.base}
            />
          )}

          {/* Fabric Texture */}
          <path
            d={`M186 124 C196 127, 206 122, 212 118 L223 154 L229 235 L238 ${dynamicHemY} C205 ${dynamicHemY + 12}, 195 ${dynamicHemY + 12}, 162 ${dynamicHemY} L168 235 L174 130 Z`}
            fill="url(#garm-silk-sheen)"
          />
          {fabricType === 'BROCADE' && (
            <path
              d={`M186 124 C196 127, 206 122, 212 118 L223 154 L229 235 L238 ${dynamicHemY} C205 ${dynamicHemY + 12}, 195 ${dynamicHemY + 12}, 162 ${dynamicHemY} L168 235 L174 130 Z`}
              fill="url(#garm-brocade)"
            />
          )}

          {/* Vạt Hữu Nhậm Closure Flap */}
          <path
            d={`M204 124 C210 134, 218 148, 222 156 L228 215 L228 ${dynamicHemY - 2}`}
            stroke={tones.shadow}
            strokeWidth={isRemixHigh ? "2.2" : "1.8"}
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M205 125 C211 135, 219 149, 223 157 L229 215"
            stroke={isRemixHigh ? "#FFFFFF" : tones.highlight}
            strokeWidth="0.9"
            fill="none"
            opacity={isRemixHigh ? "0.9" : "0.7"}
          />

          {/* Fold lines */}
          <path d="M174 210 C182 225, 186 245, 185 270" stroke={tones.shadow} strokeWidth="1" fill="none" opacity="0.45" strokeLinecap="round" />
          <path d={`M170 ${dynamicSlitY} C172 270, 168 320, 165 ${dynamicHemY - 15}`} stroke={tones.shadow} strokeWidth="1.1" fill="none" opacity="0.4" strokeLinecap="round" />
          <path d="M218 240 C214 285, 220 340, 222 395" stroke={tones.shadow} strokeWidth="1" fill="none" opacity="0.35" strokeLinecap="round" />
          <path d={`M165 ${dynamicHemY - 2} C195 ${dynamicHemY + 10}, 205 ${dynamicHemY + 10}, 235 ${dynamicHemY - 2}`} stroke={tones.highlight} strokeWidth="1.2" fill="none" opacity="0.65" />

          {/* Sleeves: responds to sleeveFlare and sleeveDelta */}
          <g id="sleeves-tay-chen">
            {/* Left sleeve */}
            <path
              d={`M174 130 L${146 - sleeveFlare * 0.4} 178 L${136 - sleeveFlare} ${270 + sleeveDelta} L${148 + sleeveFlare * 0.5} ${268 + sleeveDelta} L158 185 L168 150 Z`}
              fill={tones.base}
            />
            <path
              d={`M${146 - sleeveFlare * 0.4} 178 C144 205, 140 235, ${137 - sleeveFlare * 0.6} ${268 + sleeveDelta}`}
              stroke={tones.shadow}
              strokeWidth="0.9"
              fill="none"
              opacity="0.45"
            />
            {/* Right sleeve */}
            <path
              d={`M226 130 L${254 + sleeveFlare * 0.4} 178 L${264 + sleeveFlare} ${270 + sleeveDelta} L${252 - sleeveFlare * 0.5} ${268 + sleeveDelta} L242 185 L232 150 Z`}
              fill={tones.base}
            />
            <path
              d={`M${254 + sleeveFlare * 0.4} 178 C256 205, 260 235, ${263 + sleeveFlare * 0.6} ${268 + sleeveDelta}`}
              stroke={tones.shadow}
              strokeWidth="0.9"
              fill="none"
              opacity="0.45"
            />
          </g>

          {/* Cổ Áo: Traditional Cổ Lập Lĩnh vs Modern Mandarin Notch */}
          {isRemixHigh ? (
            <g id="co-ao-remix">
              {/* Modernized Notch Collar */}
              <path
                d="M188 120 C194 128, 206 128, 212 120 L214 125 C206 132, 194 132, 186 125 Z"
                fill={tones.base}
                stroke={tones.shadow}
                strokeWidth="1.2"
              />
              <path d="M190 120 L200 132 L210 120" stroke="#FFFFFF" strokeWidth="1.2" fill="none" opacity="0.85" />
            </g>
          ) : (
            <g id="co-lap-linh">
              <path
                d="M188 118 C196 122, 204 122, 212 118 L213 126 C204 130, 196 130, 187 126 Z"
                fill={tones.base}
                stroke={tones.shadow}
                strokeWidth="1.2"
              />
              <path d="M190 119 C196 122, 204 122, 210 119" stroke="#FFFFFF" strokeWidth="1" fill="none" opacity="0.9" />
            </g>
          )}

          {/* Buttons: 5 buttons in traditional, modern metallic accents in remix */}
          <g id="ngu-cuc-buttons">
            {nguThanButtons.map((btn, index) => (
              <g key={index} id={`button-${index + 1}`}>
                <circle cx={btn.cx + 0.8} cy={btn.cy + 0.8} r={isRemixHigh ? "2.2" : "2.8"} fill={tones.deepShadow} opacity="0.6" />
                <circle cx={btn.cx} cy={btn.cy} r={isRemixHigh ? "2.2" : "2.8"} fill={isRemixHigh ? "#E2E8F0" : "#D4AF37"} stroke={isRemixHigh ? "#475569" : "#8A5E17"} strokeWidth="0.8" />
                <circle cx={btn.cx - 0.7} cy={btn.cy - 0.7} r="0.9" fill="#FFFFFF" />
              </g>
            ))}
          </g>

          {/* Modern Remix Waist Belt Accent */}
          {isRemixHigh && (
            <g id="remix-waist-belt">
              <rect x="168" y="232" width="64" height="10" rx="3" fill="#1C1C1E" />
              <rect x="194" y="230" width="12" height="14" rx="2" fill="#D4AF37" stroke="#8A5E17" strokeWidth="0.8" />
              <circle cx="200" cy="237" r="1.5" fill="#1C1C1E" />
            </g>
          )}
        </g>
      )}

      {/* -------------------------------------------------------------- */}
      {/* B. ÁO TẤC (Tay Thụng Lễ Phục)                                   */}
      {/* -------------------------------------------------------------- */}
      {template === 'AO_TAC' && (
        <g id="garment-ao-tac">
          {/* Back Hem Underlay */}
          <path
            d={`M166 235 L155 ${dynamicHemY + 4} C195 ${dynamicHemY + 16}, 205 ${dynamicHemY + 16}, 245 ${dynamicHemY + 4} L234 235 Z`}
            fill={tones.shadow}
          />

          {/* Main Body */}
          <path
            d={`M186 124 C196 127, 206 122, 212 118 L223 154 L232 235 L242 ${dynamicHemY + 2} C205 ${dynamicHemY + 14}, 195 ${dynamicHemY + 14}, 158 ${dynamicHemY + 2} L168 235 L174 130 Z`}
            fill={tones.base}
          />
          <path
            d={`M186 124 C196 127, 206 122, 212 118 L223 154 L232 235 L242 ${dynamicHemY + 2} C205 ${dynamicHemY + 14}, 195 ${dynamicHemY + 14}, 158 ${dynamicHemY + 2} L168 235 L174 130 Z`}
            fill="url(#garm-silk-sheen)"
          />

          {/* Hữu Nhậm Flap */}
          <path
            d={`M204 124 C210 134, 218 148, 222 156 L228 215 L230 ${dynamicHemY}`}
            stroke={tones.shadow}
            strokeWidth="1.8"
            fill="none"
          />

          {/* Tay Thụng Dài Buông Rộng */}
          <g id="tay-thung-voluminous">
            {/* Left wide sleeve */}
            <path
              d={`M174 130 L132 175 L${110 - sleeveFlare} ${305 + sleeveDelta} C135 315, 160 305, 165 295 L172 165 Z`}
              fill={tones.base}
            />
            <path d={`M125 210 C128 245, 130 275, ${132 - sleeveFlare * 0.5} ${305 + sleeveDelta}`} stroke={tones.shadow} strokeWidth="1" fill="none" opacity="0.4" />
            <path d={`M142 220 C146 255, 148 275, 150 ${302 + sleeveDelta}`} stroke={tones.shadow} strokeWidth="1" fill="none" opacity="0.4" />
            <path d={`M${110 - sleeveFlare} ${305 + sleeveDelta} C125 310, 145 305, 165 295`} stroke={tones.highlight} strokeWidth="1.2" fill="none" opacity="0.6" />

            {/* Right wide sleeve */}
            <path
              d={`M226 130 L268 175 L${290 + sleeveFlare} ${305 + sleeveDelta} C265 315, 240 305, 235 295 L228 165 Z`}
              fill={tones.base}
            />
            <path d={`M275 210 C272 245, 270 275, ${268 + sleeveFlare * 0.5} ${305 + sleeveDelta}`} stroke={tones.shadow} strokeWidth="1" fill="none" opacity="0.4" />
            <path d={`M258 220 C254 255, 252 275, 250 ${302 + sleeveDelta}`} stroke={tones.shadow} strokeWidth="1" fill="none" opacity="0.4" />
            <path d={`M${290 + sleeveFlare} ${305 + sleeveDelta} C275 310, 255 305, 235 295`} stroke={tones.highlight} strokeWidth="1.2" fill="none" opacity="0.6" />
          </g>

          {/* Cổ Lập Lĩnh */}
          <path
            d="M188 118 C196 122, 204 122, 212 118 L213 126 C204 130, 196 130, 187 126 Z"
            fill={tones.base}
            stroke={tones.shadow}
            strokeWidth="1.2"
          />
          <path d="M190 119 C196 122, 204 122, 210 119" stroke="#FFFFFF" strokeWidth="1" fill="none" />

          {/* 5 Cúc */}
          <g id="ngu-cuc-ao-tac">
            {nguThanButtons.map((btn, index) => (
              <g key={index}>
                <circle cx={btn.cx + 0.8} cy={btn.cy + 0.8} r="2.8" fill={tones.deepShadow} opacity="0.6" />
                <circle cx={btn.cx} cy={btn.cy} r="2.8" fill="#D4AF37" stroke="#8A5E17" strokeWidth="0.8" />
                <circle cx={btn.cx - 0.8} cy={btn.cy - 0.8} r="1" fill="#FFFBEB" />
              </g>
            ))}
          </g>

          {/* Modern Remix Belt Accent if in high remix */}
          {isRemixHigh && (
            <g id="ao-tac-remix-belt">
              <rect x="168" y="233" width="64" height="10" rx="3" fill="#1C1C1E" />
              <rect x="194" y="231" width="12" height="14" rx="2" fill="#D4AF37" stroke="#8A5E17" strokeWidth="0.8" />
            </g>
          )}
        </g>
      )}

      {/* -------------------------------------------------------------- */}
      {/* C. ÁO NHẬT BÌNH                                                */}
      {/* -------------------------------------------------------------- */}
      {template === 'AO_NHAT_BINH' && (
        <g id="garment-ao-nhat-binh">
          {/* Main Robe Body */}
          <path
            d={`M182 122 L172 135 L160 235 L155 ${dynamicHemY + 2} C195 ${dynamicHemY + 9}, 205 ${dynamicHemY + 9}, 245 ${dynamicHemY + 2} L240 235 L228 135 L218 122 Z`}
            fill={tones.base}
          />
          <path
            d={`M182 122 L172 135 L160 235 L155 ${dynamicHemY + 2} C195 ${dynamicHemY + 9}, 205 ${dynamicHemY + 9}, 245 ${dynamicHemY + 2} L240 235 L228 135 L218 122 Z`}
            fill="url(#garm-silk-sheen)"
          />

          {/* Inner White Robe Layer */}
          <path d="M192 122 L192 230 L208 230 L208 122 Z" fill="#FAF6F0" />
          <path d={`M200 122 L200 ${dynamicHemY + 2}`} stroke={tones.deepShadow} strokeWidth="1" />

          {/* CỔ NHẬT BÌNH */}
          <g id="co-nhat-binh-chu-nhat">
            <path
              d="M188 120 L188 235 L212 235 L212 120 Z"
              fill="url(#nhat-binh-collar-gold)"
              stroke="#8A5E17"
              strokeWidth="1.2"
            />
            {[135, 155, 175, 195, 215].map((y) => (
              <g key={y} transform={`translate(200, ${y})`}>
                <circle cx="0" cy="0" r="3" fill="#8B1E2B" />
                <circle cx="0" cy="0" r="1.5" fill="#FFFFFF" />
              </g>
            ))}
            <path d="M196 235 C194 255, 192 280, 190 295" stroke="#D4AF37" strokeWidth="1.5" fill="none" />
            <path d="M204 235 C206 255, 208 280, 210 295" stroke="#D4AF37" strokeWidth="1.5" fill="none" />
          </g>

          {/* Tay Áo Nhật Bình with Ngũ Sắc Bands */}
          <g id="tay-ao-nhat-binh">
            <path d={`M174 130 L136 175 L${125 - sleeveFlare * 0.5} 285 L${158 + sleeveFlare * 0.3} 280 L166 180 Z`} fill={tones.base} />
            <rect x={125 - sleeveFlare * 0.5} y="270" width={33 + sleeveFlare * 0.8} height="15" fill="url(#nhat-binh-ngu-sac)" />
            <path d={`M226 130 L264 175 L${275 + sleeveFlare * 0.5} 285 L${242 - sleeveFlare * 0.3} 280 L234 180 Z`} fill={tones.base} />
            <rect x={242 - sleeveFlare * 0.3} y="270" width={33 + sleeveFlare * 0.8} height="15" fill="url(#nhat-binh-ngu-sac)" />
          </g>
        </g>
      )}

      {/* -------------------------------------------------------------- */}
      {/* D. ÁO TỨ THÂN                                                  */}
      {/* -------------------------------------------------------------- */}
      {template === 'AO_TU_THAN' && (
        <g id="garment-ao-tu-than">
          {/* Váy Đụp Lụa Đen */}
          <path
            d={`M170 245 L152 ${dynamicHemY + 24} C185 ${dynamicHemY + 30}, 215 ${dynamicHemY + 30}, 248 ${dynamicHemY + 24} L230 245 Z`}
            fill="#18181B"
          />
          <path d={`M182 255 C178 320, 172 385, 168 ${dynamicHemY + 22}`} stroke="#27272A" strokeWidth="1.2" fill="none" opacity="0.6" />
          <path d={`M200 255 L200 ${dynamicHemY + 26}`} stroke="#27272A" strokeWidth="1.2" fill="none" opacity="0.6" />
          <path d={`M218 255 C222 320, 228 385, 232 ${dynamicHemY + 22}`} stroke="#27272A" strokeWidth="1.2" fill="none" opacity="0.6" />

          {/* Yếm Cổ Nhạn */}
          <path
            d="M190 124 L200 148 L210 124 L216 165 L184 165 Z"
            fill="#8B1E2B"
            stroke="#FEE2E2"
            strokeWidth="0.8"
          />
          <path d="M190 124 C194 118, 196 112, 198 108" stroke="#8B1E2B" strokeWidth="1" fill="none" />
          <path d="M210 124 C206 118, 204 112, 202 108" stroke="#8B1E2B" strokeWidth="1" fill="none" />

          {/* Áo Cánh Trắng Lót Trong */}
          <path d="M180 126 L175 240 L188 240 L190 145 Z" fill="#FAF6F0" />
          <path d="M220 126 L225 240 L212 240 L210 145 Z" fill="#FAF6F0" />

          {/* 2 Thân Sau */}
          <path
            d={`M174 126 L158 ${dynamicHemY} C195 ${dynamicHemY + 6}, 205 ${dynamicHemY + 6}, 242 ${dynamicHemY} L226 126 Z`}
            fill={tones.shadow}
            opacity="0.9"
          />
          <line x1="200" y1="130" x2="200" y2={dynamicHemY + 2} stroke={tones.deepShadow} strokeWidth="1.2" />

          {/* 2 Thân Trước */}
          <path
            d={`M176 126 L164 240 L166 ${dynamicHemY - 2} C178 ${dynamicHemY}, 186 ${dynamicHemY - 7}, 188 ${dynamicHemY - 17} L182 240 L186 138 Z`}
            fill={tones.base}
          />
          <path
            d={`M224 126 L236 240 L234 ${dynamicHemY - 2} C222 ${dynamicHemY}, 214 ${dynamicHemY - 7}, 212 ${dynamicHemY - 17} L218 240 L214 138 Z`}
            fill={tones.base}
          />

          {/* Tay Áo */}
          <path d={`M178 126 L144 180 L${136 - sleeveFlare * 0.5} 265 L${148 + sleeveFlare * 0.3} 262 L158 185 L170 150 Z`} fill={tones.base} />
          <path d={`M222 126 L256 180 L${264 + sleeveFlare * 0.5} 265 L${252 - sleeveFlare * 0.3} 262 L242 185 L230 150 Z`} fill={tones.base} />

          {/* DẢI THẮT LƯNG LỤA / RUỘT TƯỢNG */}
          <g id="that-lung-ruot-tuong">
            <rect x="168" y="235" width="64" height="13" rx="3" fill="#D4AF37" />
            <rect x="170" y="239" width="60" height="5" fill="#047857" opacity="0.8" />
            <ellipse cx="200" cy="241" rx="5" ry="4" fill="#D4AF37" stroke="#8A5E17" strokeWidth="0.8" />
            <path
              d="M198 245 C195 295, 192 340, 190 380 L198 378 C199 340, 201 295, 201 245 Z"
              fill="#D4AF37"
            />
            <path
              d="M202 245 C205 305, 210 355, 214 395 L221 393 C216 350, 210 305, 205 245 Z"
              fill="#8B1E2B"
            />
          </g>
        </g>
      )}

      {/* -------------------------------------------------------------- */}
      {/* E. ÁO DÀI (Truyền Thống & Remix)                               */}
      {/* -------------------------------------------------------------- */}
      {template === 'AO_DAI' && (
        <g id="garment-ao-dai">
          {/* Back Panel (Tà Sau) */}
          {!isWheelchair && (
            <path
              d={`M170 235 L162 ${dynamicHemY + 6} C195 ${dynamicHemY + 16}, 205 ${dynamicHemY + 16}, 238 ${dynamicHemY + 6} L230 235 Z`}
              fill={tones.shadow}
            />
          )}

          {/* Main Front Panel (Tà Trước) */}
          {!isWheelchair ? (
            <path
              d={`M186 124 C196 127, 204 127, 214 124 L226 230 C228 ${dynamicSlitY}, 238 ${dynamicHemY - 80}, 235 ${dynamicHemY} C205 ${dynamicHemY + 10}, 195 ${dynamicHemY + 10}, 165 ${dynamicHemY} C162 ${dynamicHemY - 80}, 172 ${dynamicSlitY}, 174 230 Z`}
              fill={tones.base}
            />
          ) : (
            <path
              d={`M186 124 C196 127, 204 127, 214 124 L226 230 L242 270 L238 ${355 - hemReductionPx} C205 ${362 - hemReductionPx}, 195 ${362 - hemReductionPx}, 166 ${352 - hemReductionPx} L174 230 Z`}
              fill={tones.base}
            />
          )}

          {/* Silk Sheen */}
          <path
            d={`M186 124 C196 127, 204 127, 214 124 L226 230 C228 ${dynamicSlitY}, 238 ${dynamicHemY - 80}, 235 ${dynamicHemY} C205 ${dynamicHemY + 10}, 195 ${dynamicHemY + 10}, 165 ${dynamicHemY} C162 ${dynamicHemY - 80}, 172 ${dynamicSlitY}, 174 230 Z`}
            fill="url(#garm-silk-sheen)"
          />

          {/* Raglan Seam Line */}
          <path d="M194 122 L224 150" stroke={tones.shadow} strokeWidth="1.2" fill="none" />
          <path d="M224 150 L226 230" stroke={tones.shadow} strokeWidth="1.2" fill="none" />

          {/* Fold lines */}
          <path d="M178 225 C186 245, 192 270, 190 300" stroke={tones.shadow} strokeWidth="0.9" fill="none" opacity="0.4" strokeLinecap="round" />
          <path d={`M174 ${dynamicSlitY} C171 270, 168 330, 166 ${dynamicHemY - 17}`} stroke={tones.shadow} strokeWidth="1" fill="none" opacity="0.35" strokeLinecap="round" />
          <path d={`M212 250 C216 310, 218 360, 220 ${dynamicHemY - 12}`} stroke={tones.highlight} strokeWidth="1.1" fill="none" opacity="0.5" strokeLinecap="round" />
          <path d={`M168 ${dynamicHemY} C195 ${dynamicHemY + 10}, 205 ${dynamicHemY + 10}, 232 ${dynamicHemY}`} stroke={tones.highlight} strokeWidth="1.2" fill="none" opacity="0.7" />

          {/* Fitted Sleeves */}
          <path d={`M176 128 L146 178 L${136 - sleeveFlare * 0.4} ${270 + sleeveDelta} L${148 + sleeveFlare * 0.4} ${268 + sleeveDelta} L158 185 L168 150 Z`} fill={tones.base} />
          <path d={`M224 128 L254 178 L${264 + sleeveFlare * 0.4} ${270 + sleeveDelta} L${252 - sleeveFlare * 0.4} ${268 + sleeveDelta} L242 185 L232 150 Z`} fill={tones.base} />

          {/* Cổ Áo */}
          {isRemixHigh ? (
            <g id="ao-dai-remix-collar">
              <path
                d="M189 120 C196 125, 204 125, 211 120 L212 124 C204 129, 196 129, 188 124 Z"
                fill={tones.base}
                stroke={tones.shadow}
                strokeWidth="1.2"
              />
              <path d="M192 121 L200 130 L208 121" stroke="#FFFFFF" strokeWidth="1.1" fill="none" />
            </g>
          ) : (
            <g id="ao-dai-traditional-collar">
              <path
                d="M189 118 C196 122, 204 122, 211 118 L212 125 C204 129, 196 129, 188 125 Z"
                fill={tones.base}
                stroke={tones.shadow}
                strokeWidth="1.2"
              />
              <path d="M190 119 C196 122, 204 122, 210 119" stroke="#FFFFFF" strokeWidth="0.9" fill="none" />
            </g>
          )}

          {/* Modern belt if high remix */}
          {isRemixHigh && (
            <g id="ao-dai-remix-belt">
              <rect x="174" y="230" width="52" height="8" rx="2" fill="#1C1C1E" />
              <rect x="195" y="228" width="10" height="12" rx="2" fill="#D4AF37" stroke="#78350F" strokeWidth="0.8" />
            </g>
          )}
        </g>
      )}

      {/* -------------------------------------------------------------- */}
      {/* F. ÁO GIAO LĨNH / ĐỐI KHÂM                                      */}
      {/* -------------------------------------------------------------- */}
      {(template === 'AO_GIAO_LINH' || template === 'AO_DOI_KHAM') && (
        <g id="garment-giao-linh-doi-kham">
          {/* Back hem */}
          <path
            d={`M166 235 L158 ${dynamicHemY + 2} C195 ${dynamicHemY + 12}, 205 ${dynamicHemY + 12}, 242 ${dynamicHemY + 2} L234 235 Z`}
            fill={tones.shadow}
          />
          {/* Main robe body */}
          <path
            d={`M186 122 C196 126, 206 126, 214 122 L228 150 L236 235 L242 ${dynamicHemY} C205 ${dynamicHemY + 10}, 195 ${dynamicHemY + 10}, 158 ${dynamicHemY} L164 235 L172 150 Z`}
            fill={tones.base}
          />
          <path
            d={`M186 122 C196 126, 206 126, 214 122 L228 150 L236 235 L242 ${dynamicHemY} C205 ${dynamicHemY + 10}, 195 ${dynamicHemY + 10}, 158 ${dynamicHemY} L164 235 L172 150 Z`}
            fill="url(#garm-silk-sheen)"
          />

          {template === 'AO_GIAO_LINH' ? (
            <g id="co-giao-linh">
              <path d="M192 120 L212 155" stroke="#FFFFFF" strokeWidth="2.5" fill="none" />
              <path d="M188 120 L224 165 L228 235" stroke={tones.shadow} strokeWidth="2.5" fill="none" />
              <path d="M224 165 C228 185, 230 205, 226 230" stroke="#D4AF37" strokeWidth="1.5" fill="none" />
            </g>
          ) : (
            <g id="co-doi-kham">
              <path d={`M192 122 L192 ${dynamicHemY}`} stroke={tones.shadow} strokeWidth="2" fill="none" />
              <path d={`M208 122 L208 ${dynamicHemY}`} stroke={tones.shadow} strokeWidth="2" fill="none" />
              <rect x="193" y="122" width="14" height={Math.max(100, dynamicHemY - 125)} fill="#FAF6F0" />
            </g>
          )}

          {/* Sleeves */}
          <path d={`M174 130 L136 175 L${125 - sleeveFlare * 0.7} 295 L${160 + sleeveFlare * 0.4} 290 L168 175 Z`} fill={tones.base} />
          <path d={`M226 130 L264 175 L${275 + sleeveFlare * 0.7} 295 L${240 - sleeveFlare * 0.4} 290 L232 175 Z`} fill={tones.base} />
        </g>
      )}
    </g>
  );
};
