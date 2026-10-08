/**
 * 3-Tone Shading and Fabric Depth Utilities for Vietnamese Traditional Garments
 * Meets high-end editorial fashion illustration requirements
 */

export interface GarmentToneSet {
  base: string;
  shadow: string;
  deepShadow: string;
  highlight: string;
  sheen: string;
}

export interface SkinToneSet {
  base: string;
  shadow: string;
  highlight: string;
}

export interface HairToneSet {
  base: string;
  shadow: string;
  highlight: string;
}

/**
 * Converts a hex color to HSL, modifies lightness, and returns hex
 */
export function adjustHexLightness(hex: string, deltaPercent: number): string {
  let cleanHex = hex.replace('#', '').trim();
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map((c) => c + c).join('');
  }
  if (cleanHex.length !== 6) {
    cleanHex = '8B1E2B';
  }
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  let l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  // Adjust lightness within [0, 1]
  l = Math.max(0.04, Math.min(0.96, l + deltaPercent / 100));

  // Convert back to RGB
  const hue2rgb = (p: number, q: number, t: number) => {
    let tNorm = t;
    if (tNorm < 0) tNorm += 1;
    if (tNorm > 1) tNorm -= 1;
    if (tNorm < 1 / 6) return p + (q - p) * 6 * tNorm;
    if (tNorm < 1 / 2) return q;
    if (tNorm < 2 / 3) return p + (q - p) * (2 / 3 - tNorm) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const newR = Math.round(hue2rgb(p, q, h + 1 / 3) * 255);
  const newG = Math.round(hue2rgb(p, q, h) * 255);
  const newB = Math.round(hue2rgb(p, q, h - 1 / 3) * 255);

  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
}

/**
 * Computes 3-tone shading palette with realistic fabric behavior:
 * - base: main fabric color
 * - shadow: approximately 14-18% darker
 * - deepShadow: approximately 26% darker for structural folds
 * - highlight: approximately 10-14% lighter
 * - sheen: delicate luminous specular tone
 */
export function computeGarmentTones(
  baseHex: string,
  fabricType: 'SILK' | 'BROCADE' | 'COTTON' = 'SILK'
): GarmentToneSet {
  const isSilk = fabricType === 'SILK';
  const shadowDelta = isSilk ? -16 : -14;
  const highlightDelta = isSilk ? 14 : 10;

  return {
    base: baseHex,
    shadow: adjustHexLightness(baseHex, shadowDelta),
    deepShadow: adjustHexLightness(baseHex, -26),
    highlight: adjustHexLightness(baseHex, highlightDelta),
    sheen: adjustHexLightness(baseHex, 24),
  };
}

/**
 * 6 Authentic Skin Tones with 3-tone dimensional shading
 */
export const PRESET_SKIN_TONES: Record<string, SkinToneSet> = {
  // 1. Trắng Ngà (Fair Porcelain)
  '#FAF0E6': {
    base: '#FAF0E6',
    shadow: '#E8D5C2',
    highlight: '#FFFDF9',
  },
  '#FCE5D8': {
    base: '#FCE5D8',
    shadow: '#EAC8B6',
    highlight: '#FFF4EE',
  },
  // 2. Hồng Hào (Rosy Warm)
  '#F5DCD0': {
    base: '#F5DCD0',
    shadow: '#E2BFB0',
    highlight: '#FDF2EC',
  },
  '#F5D6C6': {
    base: '#F5D6C6',
    shadow: '#DEB7A2',
    highlight: '#FEEDDE',
  },
  // 3. Tự Nhiên (Natural Golden Ochre)
  '#EACAB0': {
    base: '#EACAB0',
    shadow: '#D2A78A',
    highlight: '#F6DFCC',
  },
  '#E2B897': {
    base: '#E2B897',
    shadow: '#C59570',
    highlight: '#F0CCAE',
  },
  // 4. Bánh Mật (Honey Amber)
  '#CE9E7C': {
    base: '#CE9E7C',
    shadow: '#B17E5A',
    highlight: '#E2B595',
  },
  '#C68B59': {
    base: '#C68B59',
    shadow: '#A86C38',
    highlight: '#DBA373',
  },
  // 5. Trầm Ấm (Warm Bronze)
  '#9E6E52': {
    base: '#9E6E52',
    shadow: '#7F5237',
    highlight: '#B6876B',
  },
  '#8D5B4C': {
    base: '#8D5B4C',
    shadow: '#6E4133',
    highlight: '#A67364',
  },
  // 6. Nâu Đồng (Deep Copper)
  '#6B4633': {
    base: '#6B4633',
    shadow: '#503020',
    highlight: '#845D48',
  },
  '#5E3A2B': {
    base: '#5E3A2B',
    shadow: '#44261A',
    highlight: '#774F3E',
  },
};

export function getSkinTones(skinHex?: string | null): SkinToneSet {
  if (skinHex && PRESET_SKIN_TONES[skinHex]) {
    return PRESET_SKIN_TONES[skinHex];
  }
  const base = skinHex || '#FCE5D8';
  return {
    base,
    shadow: adjustHexLightness(base, -14),
    highlight: adjustHexLightness(base, 10),
  };
}

/**
 * Hair 3-Tone System for lustrous editorial volume
 */
export function getHairTones(hairColor = '#1F1B18'): HairToneSet {
  return {
    base: hairColor,
    shadow: '#0D0B0A',
    highlight: '#3D342E',
  };
}
