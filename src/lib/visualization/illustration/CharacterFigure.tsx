/**
 * High-End Editorial Fashion Character Figure Renderer
 * Provides refined silhouettes, anatomically grounded postures, 3-tone skin & hair,
 * and inclusive wheelchair representation without clinical aesthetics.
 */

import React from 'react';
import { getSkinTones, getHairTones } from './tones';

export interface CharacterFigureProps {
  skinToneHex?: string | null;
  hairId?: string;
  bodyShape?: string; // 'BALANCED' | 'TALL' | 'CURVED' | 'SEATED'
  pose?: string;      // 'STANDING' | 'WALKING' | 'SEATED' | 'WHEELCHAIR'
  gender?: string;    // 'FEMALE' | 'MALE' | 'UNISEX'
  isWheelchair?: boolean;
}

export const CharacterFigure: React.FC<CharacterFigureProps> = ({
  skinToneHex,
  hairId = 'TOC_VAN',
  bodyShape = 'BALANCED',
  pose = 'STANDING',
  gender = 'FEMALE',
  isWheelchair = false,
}) => {
  const skin = getSkinTones(skinToneHex);
  const hair = getHairTones('#1F1B18');

  const seated = isWheelchair || pose === 'SEATED' || bodyShape === 'SEATED';
  const isCurvy = bodyShape === 'CURVED';
  const isTall = bodyShape === 'TALL';
  const isMale = gender === 'MALE';

  // Body width scaling factor
  const torsoWidthScale = isCurvy ? 1.08 : isMale ? 1.06 : isTall ? 0.94 : 1.0;
  const hipWidthScale = isCurvy ? 1.14 : isMale ? 0.96 : 1.0;

  return (
    <g id="editorial-character-figure">
      <defs>
        {/* Hair Lustre Gradient */}
        <linearGradient id="hair-luster" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={hair.base} />
          <stop offset="35%" stopColor={hair.highlight} stopOpacity="0.8" />
          <stop offset="65%" stopColor={hair.base} />
          <stop offset="100%" stopColor={hair.shadow} />
        </linearGradient>

        {/* Soft Skin Subsurface Highlight */}
        <linearGradient id="skin-subtle-sheen" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={skin.highlight} stopOpacity="0.5" />
          <stop offset="100%" stopColor={skin.base} stopOpacity="0.1" />
        </linearGradient>

        {/* Minimalist Wheel Rim Gradient */}
        <linearGradient id="wheel-rim" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4A4540" />
          <stop offset="50%" stopColor="#C9B48B" />
          <stop offset="100%" stopColor="#292524" />
        </linearGradient>
      </defs>

      {/* ============================================================== */}
      {/* 1. WHEELCHAIR BASE (Background layer: backrest and rear frame) */}
      {/* ============================================================== */}
      {seated && isWheelchair && (
        <g id="wheelchair-back-frame">
          {/* Back support uprights */}
          <line x1="142" y1="180" x2="142" y2="330" stroke="#38322D" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="136" y1="190" x2="142" y2="190" stroke="#221F1D" strokeWidth="3" strokeLinecap="round" />
          {/* Backrest padded contour */}
          <rect x="138" y="200" width="12" height="110" rx="4" fill="#221F1D" />
          {/* Large Spoke Wheel & Rim */}
          <circle cx="150" cy="380" r="66" fill="none" stroke="url(#wheel-rim)" strokeWidth="3" opacity="0.9" />
          <circle cx="150" cy="380" r="58" fill="none" stroke="#A89F91" strokeWidth="0.9" opacity="0.6" />
          <circle cx="150" cy="380" r="8" fill="#292524" stroke="#C9B48B" strokeWidth="1.5" />
          {/* Fine architectural spokes */}
          {[0, 30, 60, 90, 120, 150].map((angle) => (
            <line
              key={angle}
              x1={150 - 58 * Math.cos((angle * Math.PI) / 180)}
              y1={380 - 58 * Math.sin((angle * Math.PI) / 180)}
              x2={150 + 58 * Math.cos((angle * Math.PI) / 180)}
              y2={380 + 58 * Math.sin((angle * Math.PI) / 180)}
              stroke="#D6CEBE"
              strokeWidth="0.75"
              opacity="0.45"
            />
          ))}
        </g>
      )}

      {/* ============================================================== */}
      {/* 2. HAIR BACK (Behind neck and torso for long hair)             */}
      {/* ============================================================== */}
      <g id="hair-back-layer">
        {(hairId === 'XOA_TU_NHIEN' || hairId === 'LONG_STRAIGHT') && (
          <path
            d="M182 75 C168 110, 162 170, 166 225 C172 232, 178 220, 180 195 C182 145, 185 105, 188 85 Z"
            fill={hair.shadow}
            opacity="0.85"
          />
        )}
        {(hairId === 'TOC_SONG' || hairId === 'LONG_WAVY') && (
          <path
            d="M182 75 C165 110, 168 150, 160 190 C156 215, 164 235, 172 230 C176 195, 182 145, 188 85 Z"
            fill={hair.shadow}
            opacity="0.85"
          />
        )}
        {(hairId === 'DUOI_NGUA' || hairId === 'PONYTAIL') && (
          <path
            d="M204 68 C225 72, 235 95, 230 145 C228 170, 222 195, 220 200 C216 190, 222 150, 218 105 C215 85, 206 75, 204 68 Z"
            fill={hair.shadow}
          />
        )}
      </g>

      {/* ============================================================== */}
      {/* 3. NECK & CLAVICLE (Anatomical elegance)                       */}
      {/* ============================================================== */}
      <g id="character-neck">
        {/* Neck base with soft dimensional shading */}
        <path
          d="M192 98 C192 110, 190 120, 188 126 C196 130, 204 130, 212 126 C210 120, 208 110, 208 98 Z"
          fill={skin.base}
        />
        {/* Soft shadow under jawline */}
        <path
          d="M192 98 C197 106, 203 106, 208 98 C208 108, 192 108, 192 98 Z"
          fill={skin.shadow}
          opacity="0.55"
        />
        {/* Subtle clavicle hint */}
        <path
          d="M189 124 C195 127, 199 127, 200 125 C201 127, 205 127, 211 124"
          stroke={skin.shadow}
          strokeWidth="0.8"
          strokeLinecap="round"
          fill="none"
          opacity="0.4"
        />
      </g>

      {/* ============================================================== */}
      {/* 4. TORSO, ARMS & HANDS (Fashion silhouette)                   */}
      {/* ============================================================== */}
      <g id="character-limbs">
        {!seated ? (
          // STANDING / 3/4 FASHION POSE LIMBS
          <g id="standing-limbs">
            {/* Left Arm (Graceful drape down the side, tapered hand) */}
            <path
              d="M168 132 C152 142, 142 175, 138 215 C136 240, 134 265, 132 285 C134 286, 138 285, 140 282 C143 262, 146 238, 148 215 C152 180, 160 150, 172 138 Z"
              fill={skin.base}
            />
            {/* Left Hand: Delicate fashion illustration fingers */}
            <path
              d="M132 285 C130 292, 128 304, 129 312 C131 315, 133 313, 134 308 C136 304, 136 295, 138 290 C140 295, 142 305, 143 310 C144 311, 145 310, 145 304 C145 295, 142 288, 140 282 Z"
              fill={skin.base}
            />
            {/* Left Hand subtle cast shadow */}
            <path
              d="M132 285 C131 295, 130 305, 132 312"
              stroke={skin.shadow}
              strokeWidth="0.5"
              fill="none"
              opacity="0.5"
            />

            {/* Right Arm (Slightly bent at elbow, poised to hold fan/rest) */}
            <path
              d="M232 132 C248 142, 258 175, 260 215 C261 235, 256 260, 250 280 C248 281, 245 280, 244 278 C248 260, 252 238, 250 215 C248 180, 240 150, 228 138 Z"
              fill={skin.base}
            />
            {/* Right Hand: Graceful tapered fingers */}
            <path
              d="M250 280 C252 288, 256 298, 258 306 C259 308, 260 307, 260 303 C259 296, 256 288, 254 282 C256 286, 260 295, 262 300 C263 301, 264 300, 264 295 C262 288, 258 282, 255 277 Z"
              fill={skin.base}
            />
          </g>
        ) : (
          // SEATED / WHEELCHAIR LIMBS
          <g id="seated-limbs">
            {/* Thighs resting forward (creates natural lap drape support) */}
            <path
              d="M172 255 C190 262, 225 264, 245 260 C248 275, 246 295, 242 310 C220 312, 185 310, 168 298 Z"
              fill={skin.shadow}
              opacity="0.25"
            />
            {/* Left Arm resting on armrest / lap */}
            <path
              d="M168 132 C154 145, 148 175, 150 210 C152 228, 160 245, 175 255 C178 253, 178 248, 174 242 C164 230, 160 215, 158 195 C158 170, 164 148, 174 136 Z"
              fill={skin.base}
            />
            {/* Left Hand resting on lap */}
            <path
              d="M175 255 C182 260, 192 265, 202 264 C204 262, 202 258, 196 256 C190 254, 184 252, 178 248 Z"
              fill={skin.base}
            />
            {/* Right Arm resting along armrest */}
            <path
              d="M232 132 C246 145, 252 175, 250 210 C248 228, 240 245, 225 255 C222 253, 222 248, 226 242 C236 230, 240 215, 242 195 C242 170, 236 148, 226 136 Z"
              fill={skin.base}
            />
            {/* Right Hand resting on lap */}
            <path
              d="M225 255 C218 260, 208 265, 198 264 C196 262, 198 258, 204 256 C210 254, 216 252, 222 248 Z"
              fill={skin.base}
            />
            {/* Calves & Ankles down to footrest */}
            <path
              d="M225 315 C228 345, 232 385, 235 425 L245 425 C242 385, 238 345, 235 315 Z"
              fill={skin.base}
            />
          </g>
        )}
      </g>

      {/* ============================================================== */}
      {/* 5. HEAD & MINIMAL EDITORIAL FACE                               */}
      {/* ============================================================== */}
      <g id="editorial-head">
        {/* Soft rounded head oval with refined jaw contour */}
        <path
          d="M182 82 C181 60, 219 60, 218 82 C218 95, 209 105, 200 106 C191 105, 182 95, 182 82 Z"
          fill={skin.base}
        />
        {/* Subtle dimensional shadow on right/jaw contour */}
        <path
          d="M208 82 C214 88, 215 96, 208 102 C205 104, 202 105, 200 106 C206 104, 212 96, 214 88 C216 82, 212 75, 208 72 Z"
          fill={skin.shadow}
          opacity="0.45"
        />

        {/* Minimal Editorial Face (clean, refined, non-cartoon) */}
        {/* Delicate brow hints */}
        <path d="M188 77 C192 75, 196 76, 198 77" stroke={skin.shadow} strokeWidth="0.9" fill="none" strokeLinecap="round" opacity="0.65" />
        <path d="M202 77 C204 76, 208 75, 212 77" stroke={skin.shadow} strokeWidth="0.9" fill="none" strokeLinecap="round" opacity="0.65" />
        {/* Refined soft eyelid line */}
        <path d="M190 82 C193 81, 196 82, 197 83" stroke="#2A2421" strokeWidth="0.9" fill="none" strokeLinecap="round" opacity="0.5" />
        <path d="M203 83 C204 82, 207 81, 210 82" stroke="#2A2421" strokeWidth="0.9" fill="none" strokeLinecap="round" opacity="0.5" />
        {/* Subtle nose bridge shadow */}
        <path d="M200 82 L200 88 C200 90, 202 90, 203 89" stroke={skin.shadow} strokeWidth="0.75" fill="none" strokeLinecap="round" opacity="0.5" />
        {/* Soft elegant lip contour */}
        <path d="M196 95 C198 94, 200 95, 202 94 C204 95, 205 95, 205 95" stroke="#A84B55" strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.6" />
      </g>

      {/* ============================================================== */}
      {/* 6. HAIR FRONT LAYER (Dimensional silhouette & volume)          */}
      {/* ============================================================== */}
      <g id="hair-front-layer">
        {/* 1. TÓC VẤN NẾP CỔ TRUYỀN (Traditional Rolled Updo) */}
        {(hairId === 'TOC_VAN' || hairId === 'TRADITIONAL_UPDO') && (
          <g id="hair-toc-van">
            {/* Smooth front hairline contour */}
            <path
              d="M180 78 C182 62, 192 56, 200 58 C208 56, 218 62, 220 78 C216 70, 208 67, 200 68 C192 67, 184 70, 180 78 Z"
              fill={hair.base}
            />
            {/* Rolled hair coil at crown */}
            <ellipse cx="200" cy="56" rx="20" ry="8" fill="url(#hair-luster)" />
            {/* Center part line */}
            <path d="M200 58 L200 68" stroke={hair.shadow} strokeWidth="0.75" opacity="0.6" />
            {/* Luster sheen line */}
            <path d="M188 64 C194 61, 206 61, 212 64" stroke={hair.highlight} strokeWidth="1.2" fill="none" opacity="0.45" strokeLinecap="round" />
          </g>
        )}

        {/* 2. BÚI CỦ TỎI CAO (High Bun) */}
        {(hairId === 'BUI_CU_TOI' || hairId === 'BUN' || hairId === 'BUOI_CUBO') && (
          <g id="hair-bui-cu-toi">
            {/* Front swept crown */}
            <path
              d="M181 76 C183 60, 192 56, 200 56 C208 56, 217 60, 219 76 C214 68, 208 65, 200 66 C192 65, 186 68, 181 76 Z"
              fill={hair.base}
            />
            {/* High sculptural top bun */}
            <circle cx="200" cy="46" r="14" fill="url(#hair-luster)" />
            <path d="M192 44 C196 40, 204 40, 208 44" stroke={hair.highlight} strokeWidth="1.5" fill="none" opacity="0.6" strokeLinecap="round" />
            <circle cx="200" cy="46" r="14" fill="none" stroke={hair.shadow} strokeWidth="0.8" opacity="0.5" />
          </g>
        )}

        {/* 3. TÓC DÀI BUÔNG XÕA (Long Straight Silk Hair) */}
        {(hairId === 'XOA_TU_NHIEN' || hairId === 'LONG_STRAIGHT') && (
          <g id="hair-xoa-tu-nhien">
            {/* Parted front hair cascading over shoulders */}
            <path
              d="M181 76 C183 62, 192 58, 200 60 C208 58, 217 62, 219 76 C221 100, 226 145, 224 195 C221 210, 216 200, 216 185 C216 140, 213 95, 208 72 C204 69, 196 69, 192 72 C187 95, 184 140, 184 185 C184 200, 179 210, 176 195 C174 145, 179 100, 181 76 Z"
              fill="url(#hair-luster)"
            />
            {/* Center part & highlights */}
            <path d="M200 60 L200 68" stroke={hair.shadow} strokeWidth="0.75" />
            <path d="M186 90 C185 125, 186 160, 185 180" stroke={hair.highlight} strokeWidth="0.9" fill="none" opacity="0.4" />
            <path d="M214 90 C215 125, 214 160, 215 180" stroke={hair.highlight} strokeWidth="0.9" fill="none" opacity="0.4" />
          </g>
        )}

        {/* 4. TÓC GỢN SÓNG (Long Wavy Hair) */}
        {(hairId === 'TOC_SONG' || hairId === 'LONG_WAVY') && (
          <g id="hair-toc-song">
            <path
              d="M181 76 C183 62, 192 58, 200 60 C208 58, 217 62, 219 76 C222 105, 216 135, 226 165 C230 185, 220 205, 214 195 C212 170, 220 145, 214 120 C210 95, 208 75, 200 68 C192 75, 190 95, 186 120 C180 145, 188 170, 186 195 C180 205, 170 185, 174 165 C184 135, 178 105, 181 76 Z"
              fill="url(#hair-luster)"
            />
            {/* Wave highlights */}
            <path d="M184 110 C188 125, 180 145, 185 160" stroke={hair.highlight} strokeWidth="1" fill="none" opacity="0.5" />
            <path d="M216 110 C212 125, 220 145, 215 160" stroke={hair.highlight} strokeWidth="1" fill="none" opacity="0.5" />
          </g>
        )}

        {/* 5. TÓC BOB HIỆN ĐẠI (Chic Modern Bob) */}
        {(hairId === 'BOB_NGAN' || hairId === 'NGAN_HIEN_DAI' || hairId === 'SHORT_BOB') && (
          <g id="hair-bob-ngan">
            <path
              d="M180 76 C182 58, 192 56, 200 57 C208 56, 218 58, 220 76 C222 92, 221 112, 215 116 C211 118, 208 102, 206 90 C204 82, 196 82, 194 90 C192 102, 189 118, 185 116 C179 112, 178 92, 180 76 Z"
              fill="url(#hair-luster)"
            />
            {/* Clean angled cut edge */}
            <path d="M185 116 L193 95" stroke={hair.shadow} strokeWidth="0.8" opacity="0.6" />
            <path d="M215 116 L207 95" stroke={hair.shadow} strokeWidth="0.8" opacity="0.6" />
            <path d="M188 72 C194 68, 206 68, 212 72" stroke={hair.highlight} strokeWidth="1.2" fill="none" opacity="0.5" strokeLinecap="round" />
          </g>
        )}

        {/* 6. TÓC ĐUÔI NGỰA (High Ponytail) */}
        {(hairId === 'DUOI_NGUA' || hairId === 'PONYTAIL') && (
          <g id="hair-duoi-ngua">
            <path
              d="M181 76 C183 60, 192 56, 200 56 C208 56, 217 60, 219 76 C214 68, 208 65, 200 66 C192 65, 186 68, 181 76 Z"
              fill={hair.base}
            />
            {/* Ponytail tie ring */}
            <ellipse cx="204" cy="65" rx="4" ry="3" fill="#D4AF37" />
          </g>
        )}
      </g>

      {/* ============================================================== */}
      {/* 7. WHEELCHAIR FOREGROUND (Footrest & front casters if seated)  */}
      {/* ============================================================== */}
      {seated && isWheelchair && (
        <g id="wheelchair-front-frame">
          {/* Main vertical frame down to footrest */}
          <path d="M152 335 L225 345 L235 435" stroke="#38322D" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          {/* Ergonomic Footrest plate */}
          <path d="M224 438 L256 438 L250 448 L218 448 Z" fill="#292524" stroke="#4A4540" strokeWidth="1" />
          {/* Front small caster wheel */}
          <circle cx="230" cy="450" r="10" fill="#1C1917" stroke="#8A8071" strokeWidth="1.5" />
          <circle cx="230" cy="450" r="3" fill="#C9B48B" />
          {/* Wheelchair cushion contour */}
          <rect x="156" y="325" width="80" height="12" rx="3" fill="#1C1917" stroke="#38322D" strokeWidth="1" />
        </g>
      )}
    </g>
  );
};
