/**
 * High-Fidelity Editorial Fashion Accessories Renderer
 * Provides authentic silhouettes, metallic highlights, fabric textures,
 * correct scale, and accurate layering.
 */

import React from 'react';
import type { Accessory } from '../../../types/fashion';

export interface AccessoriesProps {
  accessories: Accessory[];
  layer: 'BACK' | 'FRONT' | 'HANDHELD' | 'FOOTWEAR';
  isWheelchair?: boolean;
}

export const Accessories: React.FC<AccessoriesProps> = ({
  accessories,
  layer,
  isWheelchair = false,
}) => {
  if (!accessories || accessories.length === 0) return null;

  return (
    <g id={`accessories-layer-${layer.toLowerCase()}`}>
      <defs>
        {/* Silver torque metallic gradient (Kiềng Bạc) */}
        <linearGradient id="silver-torque" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#CBD5E1" />
          <stop offset="30%" stopColor="#FFFFFF" />
          <stop offset="70%" stopColor="#94A3B8" />
          <stop offset="100%" stopColor="#64748B" />
        </linearGradient>

        {/* Gold metal gradient (Thẻ bài, trâm vàng) */}
        <linearGradient id="gold-metal" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="35%" stopColor="#FEF3C7" />
          <stop offset="70%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#78350F" />
        </linearGradient>

        {/* Woven straw bag pattern (Túi cói) */}
        <pattern id="woven-straw" width="6" height="6" patternUnits="userSpaceOnUse">
          <rect width="6" height="6" fill="#E2C799" />
          <path d="M0 3 L6 3 M3 0 L3 6" stroke="#C4A470" strokeWidth="0.8" />
        </pattern>
      </defs>

      {accessories.map((acc) => {
        const id = acc.id;
        const color = acc.colors?.[0] || '#D4AF37';

        // ------------------------------------------------------------
        // 1. BACK ACCESSORIES (Ribbons, hanging scarves)
        // ------------------------------------------------------------
        if (layer === 'BACK') {
          // Nón quai thao ribbons hanging behind shoulders
          if (id === 'acc-non-quai-thao') {
            return (
              <g key={id} id="acc-back-quai-thao-ribbons">
                <path d="M165 80 C155 120, 150 180, 152 240" stroke="#1F1B18" strokeWidth="2.5" fill="none" opacity="0.6" strokeLinecap="round" />
                <path d="M235 80 C245 120, 250 180, 248 240" stroke="#1F1B18" strokeWidth="2.5" fill="none" opacity="0.6" strokeLinecap="round" />
              </g>
            );
          }
          return null;
        }

        // ------------------------------------------------------------
        // 2. FRONT ACCESSORIES (Headwear, Jewelry, Pendants, Bodice)
        // ------------------------------------------------------------
        if (layer === 'FRONT') {
          // A. KHĂN ĐÓNG (Khăn vấn nam nếp chữ Nhất chuẩn điển chế)
          if (id === 'acc-khan-dong') {
            return (
              <g key={id} id="acc-khan-dong">
                {/* 5-7 Tiered wrapped fabric folds (Nếp chữ Nhất) */}
                <path
                  d="M174 72 C186 64, 214 64, 226 72 L224 58 C212 50, 188 50, 176 58 Z"
                  fill="#1C1917"
                  stroke="#292524"
                  strokeWidth="0.8"
                />
                {/* Subtle horizontal fold lines */}
                <path d="M175 66 C188 59, 212 59, 225 66" stroke="#44403C" strokeWidth="1" fill="none" />
                <path d="M176 62 C188 55, 212 55, 224 62" stroke="#44403C" strokeWidth="1" fill="none" />
                <path d="M177 58 C188 52, 212 52, 223 58" stroke="#44403C" strokeWidth="1" fill="none" />
                {/* Center front fold notch */}
                <path d="M200 50 L200 70" stroke="#0D0B0A" strokeWidth="0.75" />
              </g>
            );
          }

          // B. MẤN NỮ (Mấn vấn lụa/nhung nữ dáng vòm đầy đặn)
          if (id === 'acc-man-nu') {
            return (
              <g key={id} id="acc-man-nu">
                {/* Voluminous rounded mantle crown */}
                <ellipse cx="200" cy="58" rx="28" ry="12" fill={color} stroke="#000000" strokeWidth="0.5" strokeOpacity="0.2" />
                {/* Velvet/silk sheen */}
                <ellipse cx="200" cy="56" rx="24" ry="8" fill="#FFFFFF" opacity="0.2" />
                {/* Front embroidered crest or golden jewel */}
                <circle cx="200" cy="62" r="3.2" fill="url(#gold-metal)" stroke="#78350F" strokeWidth="0.8" />
                <circle cx="200" cy="62" r="1.2" fill="#8B1E2B" />
              </g>
            );
          }

          // C. KHĂN MỎ QUẠ (Đặc trưng phụ nữ Bắc Bộ)
          if (id === 'acc-khan-mo-qua') {
            return (
              <g key={id} id="acc-khan-mo-qua">
                {/* Black triangular crown covering hair and coming to a point over forehead */}
                <path
                  d="M172 74 C182 60, 192 54, 200 54 C208 54, 218 60, 228 74 L218 84 C210 74, 204 76, 200 81 C196 76, 190 74, 182 84 Z"
                  fill="#18181B"
                  stroke="#27272A"
                  strokeWidth="0.8"
                />
                {/* Mỏ quạ center point */}
                <path d="M200 54 L200 81" stroke="#09090B" strokeWidth="1" />
              </g>
            );
          }

          // D. NÓN QUAI THAO (Nón ba tầm lớn thanh lịch)
          if (id === 'acc-non-quai-thao') {
            return (
              <g key={id} id="acc-non-quai-thao">
                {/* Large flat circular hat floating gracefully behind head */}
                <ellipse cx="200" cy="60" rx="60" ry="16" fill="#F4E9D8" stroke="#D1BEA4" strokeWidth="1.2" />
                <ellipse cx="200" cy="59" rx="55" ry="13" fill="#FAF3E8" />
                <circle cx="200" cy="58" r="8" fill="#D4AF37" stroke="#996515" strokeWidth="0.8" />
                {/* Front chin strap loop */}
                <path d="M175 68 C185 95, 215 95, 225 68" stroke="#D4AF37" strokeWidth="1.2" fill="none" />
              </g>
            );
          }

          // E. KIỀNG BẠC (Traditional silver torque necklace)
          if (id === 'acc-kieng-bac') {
            return (
              <g key={id} id="acc-kieng-bac">
                {/* Silver circular band resting gracefully around collar */}
                <path
                  d="M188 126 C186 138, 214 138, 212 126"
                  stroke="url(#silver-torque)"
                  strokeWidth="3.2"
                  fill="none"
                  strokeLinecap="round"
                />
                {/* Polished highlight shine */}
                <path
                  d="M194 134 C198 136, 202 136, 206 134"
                  stroke="#FFFFFF"
                  strokeWidth="1.2"
                  fill="none"
                  strokeLinecap="round"
                  opacity="0.9"
                />
              </g>
            );
          }

          // E2. KÍNH RÂM MẮT MÈO THỜI THƯỢNG (Modern Cat-Eye Sunglasses)
          if (id === 'acc-kinh-ram') {
            return (
              <g key={id} id="acc-kinh-ram" transform="translate(200, 77)">
                {/* Left cat-eye lens & frame */}
                <path
                  d="M-15 0 C-18 -5, -6 -6, -2 -1 C-4 4, -13 4, -15 0 Z"
                  fill="#1C1C1E"
                  stroke="#292524"
                  strokeWidth="0.8"
                />
                {/* Right cat-eye lens & frame */}
                <path
                  d="M15 0 C18 -5, 6 -6, 2 -1 C4 4, 13 4, 15 0 Z"
                  fill="#1C1C1E"
                  stroke="#292524"
                  strokeWidth="0.8"
                />
                {/* Center bridge */}
                <path d="M-2 -2 L2 -2" stroke="#D4AF37" strokeWidth="1" />
                {/* Lens specular gloss */}
                <path d="M-13 -2 L-6 -2" stroke="#FFFFFF" strokeWidth="0.6" strokeLinecap="round" opacity="0.6" />
                <path d="M5 -2 L12 -2" stroke="#FFFFFF" strokeWidth="0.6" strokeLinecap="round" opacity="0.6" />
              </g>
            );
          }

          // E3. THẮT LƯNG DA MẶT KIM LOẠI
          if (id === 'acc-that-lung-da') {
            return (
              <g key={id} id="acc-that-lung-da">
                <rect x="168" y="233" width="64" height="9" rx="2" fill="#1C1C1E" />
                <rect x="194" y="231" width="12" height="13" rx="2" fill="#D4AF37" stroke="#78350F" strokeWidth="0.8" />
                <circle cx="200" cy="237.5" r="1.5" fill="#1C1C1E" />
              </g>
            );
          }

          // F. CHUỖI NGỌC (Multi-layered pearl necklace)
          if (id === 'acc-chuoi-ngoc') {
            return (
              <g key={id} id="acc-chuoi-ngoc">
                {/* Pearl strand 1 */}
                <path d="M189 127 C188 140, 212 140, 211 127" stroke="#FAF8F5" strokeWidth="2.5" strokeDasharray="3 4" fill="none" strokeLinecap="round" />
                {/* Pearl strand 2 */}
                <path d="M186 128 C185 148, 215 148, 214 128" stroke="#F1EDE4" strokeWidth="2.8" strokeDasharray="3.5 4.5" fill="none" strokeLinecap="round" />
              </g>
            );
          }

          // G. THẺ BÀI (Engraved jade/ivory pendant on red cord)
          if (id === 'acc-the-bai') {
            return (
              <g key={id} id="acc-the-bai">
                {/* Red silk hanging cord from collar button */}
                <path d="M211 138 C213 148, 214 158, 215 168" stroke="#DC2626" strokeWidth="1.2" fill="none" />
                {/* Top jade bead */}
                <circle cx="215" cy="168" r="2.2" fill="#047857" />
                {/* Engraved rectangular pendant plaque */}
                <rect x="211" y="170" width="8" height="18" rx="2" fill="#FEF3C7" stroke="#D97706" strokeWidth="0.8" />
                <line x1="213" y1="175" x2="217" y2="175" stroke="#92400E" strokeWidth="0.6" />
                <line x1="213" y1="179" x2="217" y2="179" stroke="#92400E" strokeWidth="0.6" />
                <line x1="213" y1="183" x2="217" y2="183" stroke="#92400E" strokeWidth="0.6" />
                {/* Red silk fringe tassel */}
                <path d="M215 188 L213 200 M215 188 L215 201 M215 188 L217 200" stroke="#DC2626" strokeWidth="0.8" />
              </g>
            );
          }

          // H. TRÂM CÀI TÓC (Ornamental golden hairpin)
          if (id === 'acc-tram-cai-toc') {
            return (
              <g key={id} id="acc-tram-cai-toc">
                {/* Hairpin shaft */}
                <line x1="210" y1="50" x2="228" y2="40" stroke="url(#gold-metal)" strokeWidth="1.8" strokeLinecap="round" />
                {/* Flower blossom ornament head */}
                <circle cx="228" cy="40" r="4.5" fill="#8B1E2B" stroke="#D4AF37" strokeWidth="1" />
                <circle cx="228" cy="40" r="1.8" fill="#FFFBEB" />
                {/* Dangling pearl drop */}
                <path d="M228 44 L228 52" stroke="#D4AF37" strokeWidth="0.8" />
                <circle cx="228" cy="53" r="2" fill="#FFFFFF" />
              </g>
            );
          }

          return null;
        }

        // ------------------------------------------------------------
        // 3. HANDHELD ITEMS (Fans, Handbags)
        // ------------------------------------------------------------
        if (layer === 'HANDHELD') {
          // A. QUẠT TRẦM HƯƠNG / QUẠT XẾP GIẤY DÓ
          if (id === 'acc-quat-tram-huong' || id === 'acc-quat-xep-giay-do') {
            return (
              <g key={id} id="acc-handheld-fan" transform={isWheelchair ? 'translate(225, 235) rotate(-10)' : 'translate(245, 260) rotate(-15)'}>
                {/* Open pleated fan arc */}
                <path
                  d="M0 0 L-25 -42 A 50 50 0 0 1 25 -42 Z"
                  fill="#FDF6E2"
                  stroke="#C4A470"
                  strokeWidth="0.8"
                />
                {/* Hand-painted plum blossom branch on fan */}
                <path d="M-10 -25 Q0 -35 12 -28" stroke="#78350F" strokeWidth="1" fill="none" />
                <circle cx="-5" cy="-30" r="2.2" fill="#F43F5E" />
                <circle cx="6" cy="-28" r="2" fill="#F43F5E" />
                <circle cx="10" cy="-34" r="1.8" fill="#F43F5E" />
                {/* Bamboo/sandalwood fan ribs */}
                {[-20, -10, 0, 10, 20].map((deg) => (
                  <line
                    key={deg}
                    x1="0"
                    y1="0"
                    x2={-45 * Math.sin((deg * Math.PI) / 180)}
                    y2={-45 * Math.cos((deg * Math.PI) / 180)}
                    stroke="#8B5A2B"
                    strokeWidth="0.8"
                    opacity="0.65"
                  />
                ))}
                {/* Tassel hanging from fan pivot rivet */}
                <circle cx="0" cy="0" r="2.5" fill="#D4AF37" />
                <path d="M0 2 L-1 16 M0 2 L0 18 M0 2 L1 16" stroke="#DC2626" strokeWidth="0.9" />
              </g>
            );
          }

          // B. TÚI CÓI (Woven artisanal basket bag)
          if (id === 'acc-tui-coi') {
            return (
              <g key={id} id="acc-tui-coi" transform={isWheelchair ? 'translate(130, 260)' : 'translate(120, 275)'}>
                {/* Leather shoulder/hand strap */}
                <path d="M12 0 C12 -45, 24 -45, 24 0" stroke="#78350F" strokeWidth="1.8" fill="none" strokeLinecap="round" />
                {/* Woven straw bag body */}
                <rect x="0" y="0" width="36" height="34" rx="6" fill="url(#woven-straw)" stroke="#A88B58" strokeWidth="1" />
                {/* Leather trim clasp */}
                <rect x="14" y="0" width="8" height="12" rx="2" fill="#78350F" />
                <circle cx="18" cy="8" r="1.5" fill="#D4AF37" />
              </g>
            );
          }

          // C. TÚI DA ĐEO CHÉO TỐI GIẢN (Modern Minimalist Leather Crossbody Bag)
          if (id === 'acc-tui-da') {
            return (
              <g key={id} id="acc-tui-da" transform={isWheelchair ? 'translate(130, 260)' : 'translate(120, 275)'}>
                {/* Long leather strap across chest */}
                <path d="M18 0 C18 -55, 60 -120, 95 -145" stroke="#78350F" strokeWidth="2" fill="none" opacity="0.85" />
                {/* Clean saddle leather bag body */}
                <rect x="0" y="0" width="34" height="28" rx="6" fill="#8B4513" stroke="#5C2E0B" strokeWidth="1" />
                {/* Flap with gold magnetic clasp */}
                <path d="M0 0 L34 0 L34 14 C34 20, 0 20, 0 14 Z" fill="#70360D" />
                <circle cx="17" cy="15" r="1.8" fill="#D4AF37" />
              </g>
            );
          }

          return null;
        }

        // ------------------------------------------------------------
        // 4. FOOTWEAR (Hài sen, Guốc mộc, Sneaker retro)
        // ------------------------------------------------------------
        if (layer === 'FOOTWEAR') {
          const yPos = isWheelchair ? 425 : 448;

          // A. SNEAKER RETRO (Clean contemporary fashion silhouette)
          if (id === 'acc-sneaker-retro') {
            return (
              <g key={id} id="acc-sneaker-retro" transform={isWheelchair ? 'translate(0, -18)' : undefined}>
                {/* Left shoe */}
                <path d={`M154 ${yPos} L192 ${yPos} L190 ${yPos + 8} L152 ${yPos + 8} Z`} fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="0.8" />
                <rect x="152" y={yPos + 6} width="40" height="4" rx="1.5" fill="#E2E8F0" />
                <line x1="168" y1={yPos + 2} x2="182" y2={yPos + 2} stroke="#3B82F6" strokeWidth="1.2" strokeLinecap="round" />
                {/* Right shoe */}
                <path d={`M206 ${yPos} L244 ${yPos} L242 ${yPos + 8} L204 ${yPos + 8} Z`} fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="0.8" />
                <rect x="204" y={yPos + 6} width="40" height="4" rx="1.5" fill="#E2E8F0" />
                <line x1="220" y1={yPos + 2} x2="234" y2={yPos + 2} stroke="#3B82F6" strokeWidth="1.2" strokeLinecap="round" />
              </g>
            );
          }

          // B. GUỐC MỘC (Carved wooden clogs with velvet straps)
          if (id === 'acc-guoc-moc') {
            return (
              <g key={id} id="acc-guoc-moc" transform={isWheelchair ? 'translate(0, -18)' : undefined}>
                {/* Left wooden sole */}
                <path d={`M158 ${yPos + 3} Q175 ${yPos} 190 ${yPos + 3} L188 ${yPos + 9} L156 ${yPos + 9} Z`} fill="#A87954" stroke="#78350F" strokeWidth="0.8" />
                {/* Left velvet strap */}
                <path d={`M166 ${yPos + 3} Q174 ${yPos - 4} 182 ${yPos + 3}`} stroke="#8B1E2B" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                {/* Right wooden sole */}
                <path d={`M206 ${yPos + 3} Q223 ${yPos} 238 ${yPos + 3} L236 ${yPos + 9} L204 ${yPos + 9} Z`} fill="#A87954" stroke="#78350F" strokeWidth="0.8" />
                {/* Right velvet strap */}
                <path d={`M214 ${yPos + 3} Q222 ${yPos - 4} 230 ${yPos + 3}`} stroke="#8B1E2B" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              </g>
            );
          }

          // C. HÀI SEN (Pointed ceremonial embroidered slippers)
          if (id === 'acc-hai-sen' || !id) {
            return (
              <g key={id} id="acc-hai-sen" transform={isWheelchair ? 'translate(0, -18)' : undefined}>
                {/* Left lotus slipper with turned-up toe tip */}
                <path
                  d={`M158 ${yPos + 4} C168 ${yPos + 2}, 184 ${yPos + 1}, 190 ${yPos - 2} C192 ${yPos - 1}, 192 ${yPos + 7}, 188 ${yPos + 7} L156 ${yPos + 7} Z`}
                  fill="#8B1E2B"
                  stroke="#581C24"
                  strokeWidth="0.8"
                />
                <circle cx="190" cy={yPos - 1} r="1.5" fill="#D4AF37" />
                {/* Right lotus slipper */}
                <path
                  d={`M208 ${yPos + 4} C218 ${yPos + 2}, 234 ${yPos + 1}, 240 ${yPos - 2} C242 ${yPos - 1}, 242 ${yPos + 7}, 238 ${yPos + 7} L206 ${yPos + 7} Z`}
                  fill="#8B1E2B"
                  stroke="#581C24"
                  strokeWidth="0.8"
                />
                <circle cx="240" cy={yPos - 1} r="1.5" fill="#D4AF37" />
              </g>
            );
          }

          return null;
        }

        return null;
      })}
    </g>
  );
};
