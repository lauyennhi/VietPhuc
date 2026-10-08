/**
 * Fashion domain re-exports and aliases for Vstyle
 */

export * from './domain';

import type {
  Character,
  CultureSource,
  AdaptiveAdjustment,
  FunctionalNeedCode,
} from './domain';

export type Source = CultureSource;
export type CharacterItem = Character;
export type AdaptiveRule = AdaptiveAdjustment;
export type { FunctionalNeedCode };
