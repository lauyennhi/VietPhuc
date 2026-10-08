/**
 * Data Access Layer (DAL) for Vstyle
 * Sources datasets from verified JSON knowledge bases.
 */

import garmentsData from '../../../data/garments.json';
import accessoriesData from '../../../data/accessories.json';
import eventsData from '../../../data/events.json';
import charactersData from '../../../data/characters.json';
import sourcesData from '../../../data/sources.json';
import cultureRulesData from '../../../data/culture_rules.json';
import adaptiveRulesData from '../../../data/adaptive_rules.json';
import adaptiveNeedsData from '../../../data/adaptive_needs.json';
import weatherContextData from '../../../data/weather_context.json';

import type {
  Garment,
  Accessory,
  Event,
  Character,
  CultureSource,
  CultureRule,
  AdaptiveNeed,
  AdaptiveAdjustment,
  WeatherContext,
} from '../../types/domain';

// Garments
const garments = garmentsData as Garment[];
export function getGarments(): Garment[] {
  return garments;
}
export const getAllGarments = getGarments;
export function getApprovedGarments(): Garment[] {
  return garments.filter((g) => g.status === 'APPROVED' || !g.status);
}
export function getGarmentById(id: string): Garment | undefined {
  return garments.find((g) => g.id === id);
}

// Accessories
const accessories = accessoriesData as Accessory[];
export function getAccessories(): Accessory[] {
  return accessories;
}
export const getAllAccessories = getAccessories;
export function getApprovedAccessories(): Accessory[] {
  return accessories.filter((a) => a.status === 'APPROVED' || a.verified !== false);
}
export function getAccessoryById(id: string): Accessory | undefined {
  return accessories.find((a) => a.id === id);
}

// Events
const events = eventsData as Event[];
export function getEvents(): Event[] {
  return events;
}
export function getEventById(id: string): Event | undefined {
  return events.find((e) => e.id === id);
}

// Sources
const sources = sourcesData as CultureSource[];
export function getAllSources(): CultureSource[] {
  return sources;
}
export function getApprovedSources(): CultureSource[] {
  return sources.filter((s) => s.verified);
}
export function getSourceById(id: string): CultureSource | undefined {
  return sources.find((s) => s.id === id);
}

// Culture Rules
const cultureRules = cultureRulesData as CultureRule[];
export function getCultureRules(): CultureRule[] {
  return cultureRules;
}
export function getApprovedCultureRules(): CultureRule[] {
  return cultureRules.filter((r) => r.status === 'APPROVED' || r.verified);
}

// Adaptive Needs
const adaptiveNeeds = adaptiveNeedsData as AdaptiveNeed[];
export function getAdaptiveNeeds(): AdaptiveNeed[] {
  return adaptiveNeeds;
}

// Adaptive Rules / Adjustments
const adaptiveAdjustments = adaptiveRulesData as AdaptiveAdjustment[];
export function getAdaptiveAdjustments(): AdaptiveAdjustment[] {
  return adaptiveAdjustments;
}
export function getValidatedAdaptiveAdjustments(): AdaptiveAdjustment[] {
  return adaptiveAdjustments.filter((r) => r.validated);
}
export function getAdaptiveAdjustmentByNeed(
  needCode: string,
  garmentId?: string
): AdaptiveAdjustment | undefined {
  if (garmentId) {
    const specific = adaptiveAdjustments.find(
      (r) => r.needCode === needCode && r.garmentId === garmentId
    );
    if (specific) return specific;
  }
  return adaptiveAdjustments.find(
    (r) => r.needCode === needCode && (r.garmentId === 'ALL' || !r.garmentId)
  );
}

// Characters
const characters = charactersData as Character[];
export function getCharacters(): Character[] {
  return characters;
}
export function getCharacterById(id: string): Character | undefined {
  return characters.find((c) => c.id === id);
}

// Weather Context
const weatherContexts = weatherContextData as WeatherContext[];
export function getWeatherContexts(): WeatherContext[] {
  return weatherContexts;
}
export function getWeatherContextById(id: string): WeatherContext | undefined {
  return weatherContexts.find((w) => w.id === id);
}
