/**
 * Figure proportions and garment layout for the editorial illustration (viewBox 400×500).
 * Everything that draws the figure, the garment, the accessories, the annotations and the
 * Studio drag handles reads from here, so they always line up.
 */

import type { GarmentStructure } from '../../../types/domain';

export type BodyShape = 'BALANCED' | 'CURVED' | 'SLENDER' | 'PETITE';

export interface FigureGeometry {
  seated: boolean;
  masculine: boolean;
  cx: number;
  head: { cx: number; cy: number; rx: number; ry: number };
  neckTop: number;
  neckBase: number;
  neckHalf: number;
  shoulderY: number;
  shoulderHalf: number;
  chestY: number;
  waistY: number;
  waistHalf: number;
  hipY: number;
  hipHalf: number;
  kneeY: number;
  ankleY: number;
  soleY: number;
  legGap: number;
  wristL: { x: number; y: number };
  wristR: { x: number; y: number };
  /** Seated: front edge of the lap (top of the knees). */
  lapY: number;
}

export function figureGeometry(opts: { seated?: boolean; masculine?: boolean; shape?: string }): FigureGeometry {
  const seated = Boolean(opts.seated);
  const masculine = Boolean(opts.masculine);
  const shape = (opts.shape ?? 'BALANCED') as BodyShape;
  const dy = seated ? 66 : 0;
  const widen = shape === 'CURVED' ? 1.12 : shape === 'SLENDER' ? 0.9 : 1;
  const shoulderHalf = (masculine ? 46 : 40) * (shape === 'CURVED' ? 1.06 : shape === 'SLENDER' ? 0.94 : 1);
  const waistHalf = (masculine ? 29 : 23) * widen;
  const hipHalf = (masculine ? 33 : 36) * widen;
  const shoulderY = 124 + dy;
  return {
    seated,
    masculine,
    cx: 200,
    head: { cx: 200, cy: 78 + dy, rx: masculine ? 18.5 : 17.5, ry: 22.5 },
    neckTop: 96 + dy,
    neckBase: 116 + dy,
    neckHalf: masculine ? 9 : 7.5,
    shoulderY,
    shoulderHalf,
    chestY: 158 + dy,
    waistY: 212 + dy,
    waistHalf,
    hipY: 248 + dy,
    hipHalf,
    kneeY: seated ? 348 : 352,
    ankleY: seated ? 432 : 448,
    soleY: seated ? 446 : 463,
    legGap: masculine ? 13 : 10,
    wristL: seated ? { x: 200 - 30, y: 318 } : { x: 200 - shoulderHalf - 16, y: 270 },
    wristR: seated ? { x: 200 + 30, y: 318 } : { x: 200 + shoulderHalf + 16, y: 270 },
    lapY: seated ? 346 : 0,
  };
}

export interface CutAdjustments {
  /** 0.3–1 multiplier of the template hem length (Studio slider / drag). */
  hemRatio?: number;
  /** 0.3–1 sleeve width (Studio). */
  sleeveRatio?: number;
  /** 0.1–0.8 slit height (Studio). */
  slitRatio?: number;
  /** Adaptive tailoring in centimetres. */
  frontHemReduction?: number;
  slitPosition?: number;
  sleeveLength?: number;
  sleeveWidth?: number;
  openingWidth?: number;
  closureType?: string;
  remixLevel?: number;
}

export interface GarmentLayout {
  structure: GarmentStructure;
  hemY: number;
  hemHalf: number;
  backHemHalf: number;
  slitY: number;
  sleeveTopHalf: number;
  cuffY: number;
  cuffHalf: number;
  wideSleeve: boolean;
  collarH: number;
  neckOpen: number;
  /** Closure path points (hữu nhậm: viewer's left). */
  closure: Array<{ x: number; y: number }>;
}

const PX_PER_CM = 2.6;
const HEM_RATIO: Record<GarmentStructure['hem'], number> = { HIP: 0.22, KNEE: 0.56, CALF: 0.78, ANKLE: 0.94 };
const SEATED_HEM: Record<GarmentStructure['hem'], number> = { HIP: 330, KNEE: 360, CALF: 396, ANKLE: 418 };

export const DEFAULT_STRUCTURE: GarmentStructure = { closure: 'HUU_NHAM', buttonCount: 5, collar: 'LAP_LINH', sleeve: 'CHEN', hem: 'CALF' };

/** Standing hem y for a hem ratio (used by Studio drag handles). */
export function hemYFor(g: FigureGeometry, ratio: number): number {
  return g.waistY + (g.ankleY - g.waistY) * ratio;
}
export function hemRatioFor(g: FigureGeometry, y: number): number {
  return (y - g.waistY) / (g.ankleY - g.waistY);
}

/** Modernisation (remix 0–100) shortens the hem and slims the sleeve on top of the user's cut. */
export function remixHemFactor(remixLevel = 0): number {
  return 1 - Math.max(0, Math.min(100, remixLevel)) * 0.0028;
}
export function remixSleeveFactor(remixLevel = 0): number {
  return 1 - Math.max(0, Math.min(100, remixLevel)) * 0.0022;
}

export function garmentLayout(g: FigureGeometry, structure: GarmentStructure = DEFAULT_STRUCTURE, adj: CutAdjustments = {}): GarmentLayout {
  const remix = Math.max(0, Math.min(100, adj.remixLevel ?? 0));
  const reduction = (adj.frontHemReduction ?? 0) * PX_PER_CM;

  let hemY: number;
  if (g.seated) {
    const base = SEATED_HEM[structure.hem];
    const ratio = (adj.hemRatio !== undefined ? adj.hemRatio : 1) * remixHemFactor(remix);
    hemY = g.lapY + (base - g.lapY) * Math.max(0.2, ratio) - reduction;
    hemY = Math.max(g.lapY - 4, hemY);
  } else {
    const ratio = (adj.hemRatio ?? HEM_RATIO[structure.hem]) * remixHemFactor(remix);
    hemY = hemYFor(g, Math.max(0.2, Math.min(1.02, ratio))) - reduction;
    hemY = Math.max(g.hipY + 6, hemY);
  }

  const lengthFromWaist = Math.max(0, hemY - g.waistY);
  const flare = structure.sleeve === 'THUNG' ? 0.24 : 0.17;
  const hemHalf = g.hipHalf + 4 + lengthFromWaist * flare * (g.seated ? 0.6 : 1);
  const backHemHalf = hemHalf + (g.seated ? 4 : 5);

  const slitRatio = adj.slitRatio ?? (structure.hem === 'KNEE' || structure.hem === 'HIP' ? 0.55 : 0.4);
  let slitY = g.waistY + 44 - slitRatio * 46 - (adj.slitPosition ?? 0) * 2.1 + remix * 0.12;
  slitY = Math.max(g.waistY - 4, Math.min(hemY - 12, slitY));

  const wide = structure.sleeve === 'THUNG';
  const sleeveRatio = adj.sleeveRatio ?? (wide ? 0.9 : 0.7);
  const extraWidth = (adj.sleeveWidth ?? 0) * 1.2;
  const sleeveTopHalf = (wide ? 17 : 13) + extraWidth * 0.5;
  const cuffHalf = (wide ? 22 + sleeveRatio * 22 : 6 + sleeveRatio * 7) * remixSleeveFactor(remix) + extraWidth;
  const lengthCm = adj.sleeveLength ?? 0;
  const baseCuff = g.seated ? (wide ? 322 : 308) : structure.sleeve === 'LUNG' ? 236 : wide ? 292 : 262;
  const cuffY = baseCuff + lengthCm * PX_PER_CM;

  const collarH = structure.collar === 'LAP_LINH' ? 9 : 0;
  const neckOpen = (adj.openingWidth ?? 0) * 0.8;

  // Hữu nhậm: from the collar centre, across the chest to under the wearer's RIGHT arm
  // (= viewer's LEFT), then down the side seam.
  const L = g.cx - g.shoulderHalf;
  const closure = [
    { x: g.cx - 2, y: g.neckBase + 4 },
    { x: g.cx - 14, y: g.neckBase + 13 },
    { x: L + 15, y: g.chestY - 6 },
    { x: L + 12, y: g.chestY + 22 },
    { x: g.cx - g.waistHalf - 6, y: g.waistY - 6 },
  ];

  return { structure, hemY, hemHalf, backHemHalf, slitY, sleeveTopHalf, cuffY, cuffHalf, wideSleeve: wide, collarH, neckOpen, closure };
}
