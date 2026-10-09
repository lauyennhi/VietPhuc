/**
 * Soft watercolour-style event backdrops + weather lighting overlays.
 */

import React from 'react';
import type { Ids } from './Defs';

export type SceneKey =
  | 'STUDIO' | 'TET' | 'WEDDING' | 'SCHOOL' | 'FESTIVAL' | 'CONCERT' | 'MUSEUM' | 'STREET' | 'PALACE' | 'GARDEN';

export function sceneFor(eventId?: string, theme?: string): SceneKey {
  if (theme === 'HERITAGE_PALACE') return 'PALACE';
  if (theme === 'GARDEN_SPRING') return 'GARDEN';
  switch (eventId) {
    case 'EVENT_TET': return 'TET';
    case 'EVENT_WEDDING': return 'WEDDING';
    case 'EVENT_GRADUATION':
    case 'EVENT_YEARBOOK': return 'SCHOOL';
    case 'EVENT_FESTIVAL': return 'FESTIVAL';
    case 'EVENT_CONCERT': return 'CONCERT';
    case 'EVENT_CULTURAL': return 'MUSEUM';
    case 'EVENT_CASUAL': return 'STREET';
    default: return 'STUDIO';
  }
}

const Blossom: React.FC<{ x: number; y: number; flip?: boolean; color?: string }> = ({ x, y, flip, color = '#F2A7B5' }) => (
  <g transform={`translate(${x} ${y}) scale(${flip ? -1 : 1} 1)`}>
    <path d="M0 0 Q40 18 70 14 Q100 10 130 34 M48 16 Q58 -6 82 -10 M92 18 Q104 44 98 62" stroke="#5B3A29" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    {[[30, 10], [62, 12], [80, -10], [104, 22], [126, 32], [98, 60], [52, 4], [88, 6]].map(([bx, by], i) => (
      <g key={i} transform={`translate(${bx} ${by})`}>
        {[0, 72, 144, 216, 288].map((a) => <ellipse key={a} cx="0" cy="-3.2" rx="2.6" ry="3.6" fill={color} transform={`rotate(${a})`} opacity="0.92" />)}
        <circle r="1.3" fill="#E7B53C" />
      </g>
    ))}
  </g>
);

const Lantern: React.FC<{ x: number; y: number; color?: string; s?: number }> = ({ x, y, color = '#C0392B', s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <line x1="0" y1="-30" x2="0" y2="-12" stroke="#5B3A29" strokeWidth="1" />
    <rect x="-5" y="-14" width="10" height="3" fill="#C9A24A" />
    <ellipse cx="0" cy="0" rx="12" ry="13" fill={color} />
    <ellipse cx="-3" cy="-3" rx="5" ry="7" fill="#FFFFFF" opacity="0.18" />
    {[-6, 0, 6].map((dx) => <path key={dx} d={`M${dx} -12 Q${dx * 1.6} 0 ${dx} 12`} stroke="#7A1A10" strokeWidth="0.6" fill="none" opacity="0.6" />)}
    <rect x="-5" y="12" width="10" height="3" fill="#C9A24A" />
    <path d="M-2 15 l0 9 M0 15 l0 11 M2 15 l0 9" stroke="#C9A24A" strokeWidth="0.8" />
  </g>
);

export const Backdrop: React.FC<{ scene: SceneKey; ids: Ids }> = ({ scene, ids }) => {
  const sky: Record<SceneKey, [string, string]> = {
    STUDIO: ['#FBF7F1', '#EFE4D6'],
    TET: ['#FFF4E6', '#F6DCC4'],
    WEDDING: ['#FDF1EE', '#F2D6D1'],
    SCHOOL: ['#EEF3F5', '#E6DED0'],
    FESTIVAL: ['#F5F1E2', '#E3D7BB'],
    CONCERT: ['#1C2333', '#2E2A3A'],
    MUSEUM: ['#F4F0EA', '#E2D9CC'],
    STREET: ['#FBF1DA', '#EED9B0'],
    PALACE: ['#F5EDE2', '#E8D6C2'],
    GARDEN: ['#F3F6EC', '#E5EAD6'],
  };
  const [top, bottom] = sky[scene];
  const floorY = 440;
  return (
    <g>
      <defs>
        <linearGradient id={`${ids.soft}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={top} />
          <stop offset="100%" stopColor={bottom} />
        </linearGradient>
      </defs>
      <rect width="400" height="500" fill={`url(#${ids.soft}-sky)`} />

      {scene === 'STUDIO' && (
        <g>
          <path d="M70 440 L70 170 Q70 70 200 70 Q330 70 330 170 L330 440 Z" fill="#FFFFFF" opacity="0.45" />
          <path d="M84 440 L84 175 Q84 86 200 86 Q316 86 316 175 L316 440" stroke="#D9C7AE" strokeWidth="1.2" fill="none" opacity="0.7" />
        </g>
      )}

      {scene === 'TET' && (
        <g>
          <circle cx="318" cy="96" r="44" fill="#F6B26B" opacity="0.25" filter={`url(#${ids.soft})`} />
          <Blossom x={-6} y={40} color="#F4A6B4" />
          <Blossom x={406} y={70} flip color="#F7C548" />
          <Lantern x={60} y={180} />
          <Lantern x={342} y={200} s={0.85} />
          {[[120, 80], [270, 140], [300, 60], [90, 260]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="5" fill="#F7C548" opacity="0.35" filter={`url(#${ids.soft})`} />)}
        </g>
      )}

      {scene === 'WEDDING' && (
        <g>
          <circle cx="200" cy="230" r="150" fill="none" stroke="#E9B8B2" strokeWidth="16" opacity="0.35" filter={`url(#${ids.soft})`} />
          {Array.from({ length: 22 }, (_, i) => {
            const a = (i / 22) * Math.PI * 2;
            return <circle key={i} cx={200 + Math.cos(a) * 150} cy={230 + Math.sin(a) * 150} r={5 + (i % 3) * 2} fill={i % 2 ? '#F2C2C0' : '#FFFFFF'} opacity="0.85" />;
          })}
          <Lantern x={52} y={150} color="#B83A3A" />
          <Lantern x={348} y={150} color="#B83A3A" />
        </g>
      )}

      {scene === 'SCHOOL' && (
        <g opacity="0.75">
          {/* Khuê Văn Các-inspired gate in the distance */}
          <g transform="translate(200 250)" fill="#A9B7BC">
            <rect x="-54" y="-40" width="18" height="70" />
            <rect x="36" y="-40" width="18" height="70" />
            <rect x="-62" y="-56" width="124" height="16" />
            <rect x="-40" y="-104" width="80" height="48" fill="#B9C5C9" />
            <circle cx="0" cy="-80" r="14" fill="none" stroke="#EEF3F5" strokeWidth="3" />
            <path d="M-74 -100 L74 -100 L54 -122 L-54 -122 Z" fill="#8FA0A6" />
            <path d="M-58 -52 L58 -52 L44 -66 L-44 -66 Z" fill="#8FA0A6" />
          </g>
          {[[60, 300, 46], [340, 290, 52], [24, 330, 34]].map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill="#A8BFA0" opacity="0.6" filter={`url(#${ids.soft})`} />)}
        </g>
      )}

      {scene === 'FESTIVAL' && (
        <g>
          <path d="M0 70 Q100 100 200 76 Q300 52 400 82" stroke="#7A5A3A" strokeWidth="1" fill="none" />
          {Array.from({ length: 12 }, (_, i) => {
            const x = 16 + i * 33;
            const y = 76 + Math.sin(i * 0.9) * 10;
            const colors = ['#C0392B', '#E7B53C', '#2B5C8F', '#3D6B35', '#FFFFFF'];
            return <path key={i} d={`M${x - 9} ${y} L${x + 9} ${y} L${x} ${y + 18} Z`} fill={colors[i % 5]} opacity="0.85" />;
          })}
          <g opacity="0.55" filter={`url(#${ids.soft})`}>
            <ellipse cx="60" cy="250" rx="70" ry="60" fill="#7E9A6A" />
            <ellipse cx="340" cy="270" rx="64" ry="54" fill="#8BA674" />
          </g>
        </g>
      )}

      {scene === 'CONCERT' && (
        <g>
          {[[90, '#F6C177'], [200, '#EAB4D0'], [310, '#9CC3E6']].map(([x, c], i) => (
            <path key={i} d={`M${x} 0 L${Number(x) - 70} 440 L${Number(x) + 70} 440 Z`} fill={c as string} opacity="0.13" />
          ))}
          {Array.from({ length: 16 }, (_, i) => <circle key={i} cx={(i * 53) % 400} cy={40 + ((i * 37) % 200)} r={3 + (i % 4)} fill="#FFFFFF" opacity="0.12" />)}
        </g>
      )}

      {scene === 'MUSEUM' && (
        <g opacity="0.8">
          {[40, 140, 260, 360].map((x) => <rect key={x} x={x - 9} y="60" width="18" height="380" fill="#E7DED1" />)}
          <rect x="70" y="120" width="50" height="64" fill="#D8C7AE" stroke="#B8A27F" strokeWidth="3" />
          <rect x="280" y="110" width="56" height="72" fill="#C9D3CF" stroke="#B8A27F" strokeWidth="3" />
        </g>
      )}

      {scene === 'STREET' && (
        <g>
          <rect x="0" y="80" width="130" height="360" fill="#F2C76E" opacity="0.55" />
          <rect x="270" y="90" width="130" height="350" fill="#E9B85A" opacity="0.55" />
          {[0, 1].map((i) => <rect key={i} x={20 + i * 300} y="170" width="56" height="80" fill="#5E7F6A" opacity="0.55" />)}
          <path d="M0 110 Q200 150 400 108" stroke="#5B3A29" strokeWidth="0.8" fill="none" />
          {[40, 110, 180, 250, 320, 370].map((x, i) => <Lantern key={x} x={x} y={130 + Math.sin(i) * 6} color={['#C0392B', '#E7B53C', '#2B8C7F', '#C95A72'][i % 4]} s={0.6} />)}
        </g>
      )}

      {scene === 'PALACE' && (
        <g opacity="0.85">
          <rect x="0" y="230" width="400" height="210" fill="#C9A98A" opacity="0.35" />
          <path d="M20 230 L380 230 L340 190 L60 190 Z" fill="#8E3B2A" opacity="0.55" />
          {[60, 120, 280, 340].map((x) => <rect key={x} x={x - 5} y="230" width="10" height="210" fill="#A33A2B" opacity="0.55" />)}
          <path d="M0 190 L400 190" stroke="#C9A24A" strokeWidth="2" opacity="0.5" />
        </g>
      )}

      {scene === 'GARDEN' && (
        <g>
          <Blossom x={-10} y={30} />
          <g opacity="0.55" filter={`url(#${ids.soft})`}>
            <ellipse cx="50" cy="330" rx="80" ry="70" fill="#A7C28F" />
            <ellipse cx="360" cy="320" rx="70" ry="64" fill="#B5CC9C" />
          </g>
        </g>
      )}

      {/* floor */}
      <rect y={floorY} width="400" height="60" fill={scene === 'CONCERT' ? '#141925' : '#E9DDCB'} opacity={scene === 'CONCERT' ? 1 : 0.7} />
      <path d={`M0 ${floorY} L400 ${floorY}`} stroke={scene === 'CONCERT' ? '#3A3F52' : '#D6C6AF'} strokeWidth="1" />
    </g>
  );
};

/** Weather light on top of everything: warm sun, cool haze, rain or soft daylight. */
export const WeatherLight: React.FC<{ weatherId?: string; ids: Ids }> = ({ weatherId, ids }) => {
  const id = `${ids.soft}-light`;
  if (weatherId === 'WEATHER_HOT') {
    return (
      <g pointerEvents="none">
        <defs>
          <radialGradient id={id} cx="88%" cy="6%" r="75%">
            <stop offset="0%" stopColor="#FFD58A" stopOpacity="0.55" />
            <stop offset="60%" stopColor="#FFE3B0" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#FFE3B0" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="400" height="500" fill={`url(#${id})`} />
      </g>
    );
  }
  if (weatherId === 'WEATHER_COOL') {
    return (
      <g pointerEvents="none">
        <rect width="400" height="500" fill="#C9D9E8" opacity="0.14" />
        <rect y="380" width="400" height="120" fill="#FFFFFF" opacity="0.12" filter={`url(#${ids.soft})`} />
      </g>
    );
  }
  if (weatherId === 'WEATHER_HUMID_RAIN') {
    return (
      <g pointerEvents="none">
        <rect width="400" height="500" fill="#AEBBC6" opacity="0.16" />
        {Array.from({ length: 40 }, (_, i) => <path key={i} d={`M${(i * 37) % 420} ${(i * 53) % 460} l-6 16`} stroke="#8FA3B5" strokeWidth="0.8" opacity="0.45" />)}
      </g>
    );
  }
  return (
    <g pointerEvents="none">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="400" height="500" fill={`url(#${id})`} />
    </g>
  );
};
