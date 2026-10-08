/**
 * Gemini API Request/Response domain models for Vstyle
 */

import type { FunctionalNeedCode } from './domain';

export interface GeminiDominantColor {
  hex: string;
  name?: string;
  proportion?: number;
}

export interface GeminiColorMatch {
  colorName: string;
  colorHex?: string;
  hex: string;
  sourceHex?: string;
  confidence?: number;
  garmentId?: string;
  garmentName?: string;
}

export interface GeminiVisionResponse {
  summary: string;
  dominantColors: GeminiDominantColor[];
  detectedItems: string[];
  colorMatches: GeminiColorMatch[];
  suggestedGarmentIds: string[];
  styleId?: string;
  eventId?: string;
  usedFallback?: boolean;
}

export interface GeminiExplainResponse {
  headline: string;
  editorialReview: string;
  culturalHarmony?: string;
  styleRemixVerdict?: string;
  adviceForWearing?: string[];
  strengths?: string[];
  tips?: string[];
  usedFallback?: boolean;
}

export interface GeminiCaptionResponse {
  instagramCaption: string;
  shortPunchyHook: string;
  hashtags: string[];
  storyPrompt?: string;
  usedFallback?: boolean;
}

export interface GeminiRankResponse {
  candidateIds: string[];
  reasoning?: string;
  usedFallback?: boolean;
}

export interface GeminiParseResponse {
  eventId?: string;
  weatherId?: string;
  styleId?: string;
  color?: string;
  garmentId?: string;
  accessoryIds?: string[];
  needCodes: FunctionalNeedCode[];
  summary: string;
  confirmationRequired: string[];
  usedFallback?: boolean;
}

export interface GeminiRenderResponse {
  imageDataUrl: string;
  model: string;
  checklist?: string[];
  usedFallback?: boolean;
  prompt?: string;
}

export interface GeminiAdaptiveResponse {
  headline: string;
  explanation: string;
  confidenceTips: string[];
  tailorQuestions: string[];
  usedFallback?: boolean;
}
