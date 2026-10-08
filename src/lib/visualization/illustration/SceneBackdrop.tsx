/**
 * Minimal Editorial Scene Backdrop & Weather Lighting System
 * Enhances fashion presentation without distracting from the hero garment.
 */

import React from 'react';

export interface SceneBackdropProps {
  eventId?: string;
  weatherId?: string;
  backgroundTheme?: 'MINIMAL_STUDIO' | 'HERITAGE_PALACE' | 'GARDEN_SPRING';
}

export const SceneBackdrop: React.FC<SceneBackdropProps> = ({
  eventId = 'EVENT_TET',
  weatherId = 'WEATHER_PLEASANT',
  backgroundTheme = 'MINIMAL_STUDIO',
}) => {
  return (
    <g id="editorial-scene-backdrop">
      <defs>
        {/* Soft Sand / Cream Editorial Gradient */}
        <linearGradient id="bg-editorial-sand" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FAF6F0" />
          <stop offset="70%" stopColor="#F5EFE6" />
          <stop offset="100%" stopColor="#EDE4D6" />
        </linearGradient>

        {/* Heritage Warm Tint */}
        <linearGradient id="bg-heritage-tint" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FBF7F2" />
          <stop offset="60%" stopColor="#F7EFE4" />
          <stop offset="100%" stopColor="#ECE0CE" />
        </linearGradient>

        {/* Spring Garden Pale Jade */}
        <linearGradient id="bg-garden-tint" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#F8FAF7" />
          <stop offset="70%" stopColor="#EEF4EC" />
          <stop offset="100%" stopColor="#DFEADE" />
        </linearGradient>

        {/* Weather: Delicate Rain Stroke Pattern */}
        <pattern id="weather-rain-pattern" width="24" height="24" patternUnits="userSpaceOnUse" patternTransform="rotate(22)">
          <line x1="0" y1="0" x2="0" y2="12" stroke="#94A3B8" strokeWidth="0.8" opacity="0.32" strokeLinecap="round" />
        </pattern>

        {/* Warm Sunlight Glow (Nắng Nóng) */}
        <radialGradient id="weather-sun-glow" cx="80%" cy="18%" r="45%">
          <stop offset="0%" stopColor="#FEF3C7" stopOpacity="0.45" />
          <stop offset="50%" stopColor="#FDE68A" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#FAF6F0" stopOpacity="0" />
        </radialGradient>

        {/* Cool Atmospheric Mist (Se Lạnh) */}
        <linearGradient id="weather-cool-mist" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#E2E8F0" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#F8FAFC" stopOpacity="0" />
        </linearGradient>

        {/* Stage Lighting Beams (Concert) */}
        <linearGradient id="stage-beam-1" x1="0%" y1="0%" x2="40%" y2="100%">
          <stop offset="0%" stopColor="#E0E7FF" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="stage-beam-2" x1="100%" y1="0%" x2="60%" y2="100%">
          <stop offset="0%" stopColor="#FCE7F3" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* 1. Base Editorial Backdrop */}
      <rect
        width="400"
        height="500"
        fill={
          backgroundTheme === 'HERITAGE_PALACE'
            ? 'url(#bg-heritage-tint)'
            : backgroundTheme === 'GARDEN_SPRING'
            ? 'url(#bg-garden-tint)'
            : 'url(#bg-editorial-sand)'
        }
      />

      {/* Subtle Curved Horizon */}
      <path
        d="M0 455 Q200 440 400 455 L400 500 L0 500 Z"
        fill="#E8DFD1"
        opacity="0.4"
      />

      {/* 2. Contextual Motifs (2-4 minimal shapes per event) */}
      {/* TẾT: Peach & Apricot Blossom Branch */}
      {eventId === 'EVENT_TET' && (
        <g id="backdrop-tet" opacity="0.8">
          {/* Graceful curving branch */}
          <path d="M40 70 C80 50, 115 65, 145 95" stroke="#78350F" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          <path d="M90 60 C105 45, 115 48, 120 52" stroke="#78350F" strokeWidth="1.2" fill="none" strokeLinecap="round" />
          {/* Peach blossom buds (Hoa đào hồng) */}
          <circle cx="70" cy="58" r="4.5" fill="#FB7185" />
          <circle cx="70" cy="58" r="1.5" fill="#FFE4E6" />
          <circle cx="105" cy="48" r="4" fill="#FB7185" />
          <circle cx="120" cy="72" r="5" fill="#FB7185" />
          <circle cx="145" cy="95" r="4.5" fill="#FB7185" />
          {/* Apricot buds (Hoa mai vàng) */}
          <circle cx="85" cy="70" r="3.8" fill="#FBBF24" />
          <circle cx="132" cy="85" r="4" fill="#FBBF24" />
        </g>
      )}

      {/* TỐT NGHIỆP / KỶ YẾU: Scholarly Arches & Courtyard Columns */}
      {(eventId === 'EVENT_GRADUATION' || eventId === 'EVENT_YEARBOOK') && (
        <g id="backdrop-graduation" opacity="0.35">
          {/* Classical pavilion columns (Khuê Văn Các inspiration) */}
          <line x1="38" y1="40" x2="38" y2="455" stroke="#9A8E7E" strokeWidth="4" />
          <line x1="362" y1="40" x2="362" y2="455" stroke="#9A8E7E" strokeWidth="4" />
          {/* Subtle curved wooden lintel & arch */}
          <path d="M30 75 Q200 45 370 75" stroke="#9A8E7E" strokeWidth="2.5" fill="none" />
          <path d="M38 90 Q200 65 362 90" stroke="#9A8E7E" strokeWidth="1.2" fill="none" />
          {/* Subtle foliage leaves near top corner */}
          <path d="M340 50 Q360 40 375 55 Q360 65 340 50" fill="#65A30D" opacity="0.4" />
          <path d="M350 65 Q370 58 380 72 Q365 80 350 65" fill="#65A30D" opacity="0.4" />
        </g>
      )}

      {/* DẠO PHỐ: Old Town Wall Line & Hanging Lanterns */}
      {eventId === 'EVENT_CASUAL' && (
        <g id="backdrop-casual-hoi-an" opacity="0.65">
          {/* Subtle roofline */}
          <path d="M20 90 L120 70 L200 85 L280 70 L380 90" stroke="#A89F91" strokeWidth="1.2" fill="none" />
          {/* Hanging lantern left */}
          <line x1="65" y1="78" x2="65" y2="100" stroke="#3D322B" strokeWidth="0.8" />
          <ellipse cx="65" cy="112" rx="9" ry="12" fill="#EF4444" opacity="0.85" />
          <circle cx="65" cy="112" r="3" fill="#FDE047" opacity="0.8" />
          {/* Hanging lantern right */}
          <line x1="335" y1="78" x2="335" y2="105" stroke="#3D322B" strokeWidth="0.8" />
          <ellipse cx="335" cy="117" rx="8" ry="11" fill="#F59E0B" opacity="0.85" />
          <circle cx="335" cy="117" r="2.5" fill="#FEF08A" opacity="0.8" />
        </g>
      )}

      {/* ĐÁM CƯỚI: Botanical Floral Wreath Arch */}
      {eventId === 'EVENT_WEDDING' && (
        <g id="backdrop-wedding" opacity="0.45">
          {/* Delicate circular laurel arch */}
          <ellipse cx="200" cy="190" rx="145" ry="155" fill="none" stroke="#D4AF37" strokeWidth="1.2" strokeDasharray="6 8" />
          {/* Floral cluster accents at top of arch */}
          <circle cx="200" cy="35" r="5" fill="#F43F5E" />
          <circle cx="193" cy="38" r="4" fill="#FDE047" />
          <circle cx="207" cy="38" r="4" fill="#FB7185" />
        </g>
      )}

      {/* LỄ HỘI: Traditional Silk Banners & Flags */}
      {eventId === 'EVENT_CULTURAL' && (
        <g id="backdrop-cultural" opacity="0.5">
          {/* Traditional pennant flag string */}
          <path d="M40 70 Q200 110 360 70" stroke="#9A8E7E" strokeWidth="1" fill="none" />
          {/* Triangle festive pennants */}
          <polygon points="90,78 110,80 100,102" fill="#DC2626" />
          <polygon points="140,86 160,88 150,110" fill="#D97706" />
          <polygon points="240,88 260,86 250,110" fill="#047857" />
          <polygon points="290,80 310,78 300,102" fill="#2563EB" />
        </g>
      )}

      {/* 3. Weather Lighting Overlays (Atmospheric, does not alter garment color) */}
      {weatherId === 'WEATHER_HOT' && (
        <g id="weather-overlay-hot">
          <rect width="400" height="500" fill="url(#weather-sun-glow)" />
          {/* Subtle golden sun halo ring */}
          <circle cx="330" cy="80" r="28" fill="none" stroke="#F59E0B" strokeWidth="0.8" opacity="0.4" />
          <circle cx="330" cy="80" r="18" fill="#FEF08A" opacity="0.3" />
        </g>
      )}

      {weatherId === 'WEATHER_COOL' && (
        <g id="weather-overlay-cool">
          <rect width="400" height="500" fill="url(#weather-cool-mist)" />
        </g>
      )}

      {weatherId === 'WEATHER_HUMID_RAIN' && (
        <g id="weather-overlay-rain">
          {/* Delicate diagonal rain lines */}
          <rect width="400" height="500" fill="url(#weather-rain-pattern)" />
        </g>
      )}
    </g>
  );
};
