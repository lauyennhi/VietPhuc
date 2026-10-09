/**
 * One outfit representation shared by every creation flow (AI, Studio, Adaptive),
 * plus its deterministic evaluation (culture rules, style fit, colour harmony).
 */

import { getApprovedAccessories, getEventById, getGarmentById, getApprovedGarments } from './dal';
import { checkCulture } from './culture/ruleEngine';
import { calculateStyleScore } from './recommendation/engine';
import { evaluateColorHarmony } from './color/harmony';
import { STYLE_CHOICES } from './styles';
import type { Accessory, CultureCheckResult, FunctionalNeedCode, Garment, Outfit, StyleScoreResult } from '../types/domain';
import type { OutfitDesign } from '../types/gemini';

export type LookOrigin = 'AI' | 'STUDIO' | 'ADAPTIVE';

export interface Look {
  garmentId: string;
  primaryColor: string;
  pantColor: string;
  accessoryIds: string[];
  eventId: string;
  weatherId: string;
  styleId: string;
  characterId: string;
  skinTone?: string;
  needCodes: FunctionalNeedCode[];
  remixLevel?: number;
  title?: string;
  concept?: string;
  origin: LookOrigin;
}

export interface LookEvaluation {
  garment: Garment;
  accessories: Accessory[];
  culture: CultureCheckResult;
  style: StyleScoreResult;
  harmony: ReturnType<typeof evaluateColorHarmony>;
}

export function evaluateLook(look: Look): LookEvaluation {
  const garment = getGarmentById(look.garmentId) ?? getApprovedGarments()[0];
  const accessories = getApprovedAccessories().filter((a) => look.accessoryIds.includes(a.id));
  const event = getEventById(look.eventId);
  return {
    garment,
    accessories,
    culture: checkCulture({
      garmentId: garment.id,
      accessoryIds: look.accessoryIds,
      eventId: look.eventId,
      primaryColor: look.primaryColor,
      adaptiveNeedCode: look.needCodes[0],
    }),
    style: calculateStyleScore(garment, look.primaryColor, look.accessoryIds, look.eventId, look.styleId),
    harmony: evaluateColorHarmony({
      primaryColor: look.primaryColor,
      pantColor: look.pantColor,
      accessoryColors: accessories.map((a) => a.colors[0]).filter(Boolean),
      eventAdvice: event?.culturalAdvice,
      eventName: event?.name,
    }),
  };
}

const styleName = (id: string) => STYLE_CHOICES.find((s) => s.id === id)?.label ?? id;

export function lookTitle(look: Look, garment?: Garment): string {
  return look.title ?? `${(garment ?? getGarmentById(look.garmentId))?.name.replace(/\s*\(.*\)$/, '') ?? 'Việt phục'} · ${styleName(look.styleId)}`;
}

export function lookToOutfit(
  look: Look,
  evaluation: LookEvaluation,
  extras: Partial<Outfit> = {},
): Outfit {
  return {
    id: extras.id ?? `look-${Date.now()}`,
    title: lookTitle(look, evaluation.garment),
    garmentId: look.garmentId,
    primaryColor: look.primaryColor,
    pantColor: look.pantColor,
    accessoryIds: look.accessoryIds,
    characterId: look.characterId,
    hairStyle: 'TRUYEN_THONG',
    footwear: look.accessoryIds.find((id) => ['acc-sneaker-retro', 'acc-hai-sen', 'acc-guoc-moc'].includes(id)) ?? 'HAI_SEN',
    adaptiveNeedCode: look.needCodes[0],
    adaptiveNeedCodes: look.needCodes,
    eventId: look.eventId,
    weatherId: look.weatherId,
    styleVibe: look.styleId,
    chuanScore: evaluation.culture.score,
    chatScore: evaluation.style.score,
    colorHarmonyScore: evaluation.harmony.score,
    cultureStatus: evaluation.culture.status,
    retainedCharacteristics: evaluation.culture.retainedCharacteristics,
    sources: evaluation.culture.sourceIds,
    explanation: look.concept,
    createdAt: new Date().toISOString(),
    origin: look.origin,
    remixLevel: look.remixLevel,
    skinTone: look.skinTone,
    ...extras,
  };
}

export function outfitToLook(outfit: Outfit): Look {
  return {
    garmentId: outfit.garmentId,
    primaryColor: outfit.primaryColor,
    pantColor: outfit.pantColor,
    accessoryIds: outfit.accessoryIds,
    eventId: outfit.eventId,
    weatherId: outfit.weatherId,
    styleId: outfit.styleVibe,
    characterId: outfit.characterId,
    skinTone: outfit.skinTone,
    needCodes: outfit.adaptiveNeedCodes ?? (outfit.adaptiveNeedCode ? [outfit.adaptiveNeedCode as FunctionalNeedCode] : []),
    remixLevel: outfit.remixLevel,
    title: outfit.title,
    concept: outfit.explanation,
    origin: outfit.origin ?? 'STUDIO',
  };
}

export function lookFromDesign(design: OutfitDesign, characterId: string): Look {
  return {
    garmentId: design.garmentId,
    primaryColor: design.primaryColor,
    pantColor: design.pantColor,
    accessoryIds: design.accessoryIds,
    eventId: design.eventId,
    weatherId: design.weatherId,
    styleId: design.styleId,
    characterId: design.characterId ?? characterId,
    needCodes: design.needCodes,
    remixLevel: design.remixLevel,
    title: design.title,
    concept: design.concept,
    origin: 'AI',
  };
}
