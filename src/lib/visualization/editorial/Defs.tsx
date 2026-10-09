/**
 * Shared SVG <defs>: fabric 3-tone gradients, silk weave and brocade patterns,
 * skin/hair gradients and soft-shadow filters. IDs are prefixed per canvas.
 */

import React from 'react';
import { fabricTones, mix, shade, skinTones } from './palette';

export interface Ids {
  fabric: string;
  fabricBack: string;
  fabricSheen: string;
  silk: string;
  brocade: string;
  pant: string;
  skin: string;
  skinFace: string;
  hair: string;
  fold: string;
  drop: string;
  soft: string;
  ground: string;
  gold: string;
  silver: string;
  metal: string;
}

export function makeIds(prefix: string): Ids {
  const id = (name: string) => `${prefix}-${name}`;
  return {
    fabric: id('fabric'),
    fabricBack: id('fabric-back'),
    fabricSheen: id('fabric-sheen'),
    silk: id('silk'),
    brocade: id('brocade'),
    pant: id('pant'),
    skin: id('skin'),
    skinFace: id('skin-face'),
    hair: id('hair'),
    fold: id('fold'),
    drop: id('drop'),
    soft: id('soft'),
    ground: id('ground'),
    gold: id('gold'),
    silver: id('silver'),
    metal: id('metal'),
  };
}

interface DefsProps {
  ids: Ids;
  fabric: string;
  pant: string;
  skin: string;
  hair: string;
  brocadeColor: string;
}

export const Defs: React.FC<DefsProps> = ({ ids, fabric, pant, skin, hair, brocadeColor }) => {
  const f = fabricTones(fabric);
  const p = fabricTones(pant);
  const s = skinTones(skin);
  return (
    <defs>
      {/* Garment: base fill with light falling from the upper left. */}
      <linearGradient id={ids.fabric} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor={f.light} />
        <stop offset="45%" stopColor={f.base} />
        <stop offset="100%" stopColor={f.shadow} />
      </linearGradient>
      <linearGradient id={ids.fabricBack} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={f.base} />
        <stop offset="100%" stopColor={f.shadow} />
      </linearGradient>
      <linearGradient id={ids.fabricSheen} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
        <stop offset="35%" stopColor={f.sheen} stopOpacity="0.32" />
        <stop offset="55%" stopColor="#FFFFFF" stopOpacity="0" />
      </linearGradient>
      {/* Raw-silk weave: fine slubbed diagonal threads. */}
      <pattern id={ids.silk} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(28)">
        <line x1="0" y1="0" x2="0" y2="6" stroke={f.highlight} strokeWidth="0.5" opacity="0.35" />
        <line x1="3" y1="0" x2="3" y2="3.5" stroke={f.deep} strokeWidth="0.4" opacity="0.18" />
      </pattern>
      {/* Brocade (gấm) motif: cloud-and-longevity rosettes. */}
      <pattern id={ids.brocade} width="26" height="26" patternUnits="userSpaceOnUse">
        <g fill="none" stroke={brocadeColor} strokeWidth="0.8" opacity="0.5">
          <circle cx="13" cy="13" r="5.2" />
          <circle cx="13" cy="13" r="1.6" fill={brocadeColor} />
          <path d="M5 4c2.4-2 4.6-2 6 0M15 22c2-1.8 4.4-1.8 6 0" />
          <path d="M0 13h3M23 13h3M13 0v3M13 23v3" />
        </g>
      </pattern>
      <linearGradient id={ids.pant} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor={p.shadow} />
        <stop offset="40%" stopColor={p.base} />
        <stop offset="100%" stopColor={p.shadow} />
      </linearGradient>
      <linearGradient id={ids.skin} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor={s.shadow} />
        <stop offset="45%" stopColor={s.light} />
        <stop offset="100%" stopColor={s.shadow} />
      </linearGradient>
      <radialGradient id={ids.skinFace} cx="45%" cy="40%" r="65%">
        <stop offset="0%" stopColor={s.light} />
        <stop offset="70%" stopColor={s.base} />
        <stop offset="100%" stopColor={s.shadow} />
      </radialGradient>
      <linearGradient id={ids.hair} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor={shade(hair, 0.12)} />
        <stop offset="50%" stopColor={hair} />
        <stop offset="100%" stopColor={shade(hair, -0.06)} />
      </linearGradient>
      <linearGradient id={ids.gold} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#F4DE9B" />
        <stop offset="50%" stopColor="#C9A24A" />
        <stop offset="100%" stopColor="#8A6A23" />
      </linearGradient>
      <linearGradient id={ids.silver} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="50%" stopColor="#C9CCD1" />
        <stop offset="100%" stopColor="#8D939B" />
      </linearGradient>
      <linearGradient id={ids.metal} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#2B2F36" />
        <stop offset="50%" stopColor="#5B616B" />
        <stop offset="100%" stopColor="#24272D" />
      </linearGradient>
      <radialGradient id={ids.ground} cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor={mix('#3B2F25', fabric, 0.15)} stopOpacity="0.32" />
        <stop offset="100%" stopColor="#3B2F25" stopOpacity="0" />
      </radialGradient>
      <filter id={ids.fold} x="-10%" y="-10%" width="120%" height="120%">
        <feGaussianBlur stdDeviation="2.2" />
      </filter>
      <filter id={ids.soft} x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="5" />
      </filter>
      <filter id={ids.drop} x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0.8" dy="1.6" stdDeviation="1.3" floodColor="#2A1D15" floodOpacity="0.32" />
      </filter>
    </defs>
  );
};
