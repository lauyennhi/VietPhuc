/**
 * Gemini Provider configuration and SDK factory using @google/genai.
 * Every call tries the primary model first and falls back to the secondary model
 * when the primary is unavailable (404 / retired / overloaded / quota).
 */

import { GoogleGenAI } from '@google/genai';

export type ThinkingSetting = 'off' | 'minimal' | 'low' | 'medium' | 'high';

export interface GeminiSettings {
  apiKey?: string;
  textModel: string;
  textFallbackModel: string;
  imageModel: string;
  imageFallbackModel: string;
  thinkingLevel: ThinkingSetting;
  renderHourlyCap: number;
}

export interface GeminiProviderClient {
  generateContent: (request: {
    model?: string;
    contents: any;
    config?: any;
  }) => Promise<any>;
}

export interface GeminiProviders {
  text?: GeminiProviderClient;
  image?: GeminiProviderClient;
}

/** Stable defaults (Gemini 2.5 and Imagen 3 are retired on the Gemini API). */
export const DEFAULT_TEXT_MODEL = 'gemini-3.5-flash';
export const DEFAULT_TEXT_FALLBACK_MODEL = 'gemini-3.1-flash-lite';
export const DEFAULT_IMAGE_MODEL = 'gemini-3.1-flash-image';
export const DEFAULT_IMAGE_FALLBACK_MODEL = 'gemini-3.1-flash-image-preview';

const clean = (value: string | undefined): string | undefined => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

export function readGeminiSettings(env: Record<string, string | undefined>): GeminiSettings {
  const apiKey = clean(env.GEMINI_API_KEY) ?? clean(env.GOOGLE_API_KEY) ?? clean(env.API_KEY);
  const textModel = clean(env.GEMINI_MODEL) ?? clean(env.GEMINI_TEXT_MODEL) ?? DEFAULT_TEXT_MODEL;
  const textFallbackModel = clean(env.GEMINI_FALLBACK_MODEL) ?? DEFAULT_TEXT_FALLBACK_MODEL;
  const imageModel = clean(env.GEMINI_IMAGE_MODEL) ?? DEFAULT_IMAGE_MODEL;
  const imageFallbackModel = clean(env.GEMINI_IMAGE_FALLBACK_MODEL) ?? DEFAULT_IMAGE_FALLBACK_MODEL;
  const rawThinking = clean(env.GEMINI_THINKING_LEVEL)?.toLowerCase();
  const thinkingLevel: ThinkingSetting =
    rawThinking === 'minimal' || rawThinking === 'low' || rawThinking === 'medium' || rawThinking === 'high'
      ? rawThinking
      : 'off';
  const cap = Number.parseInt(clean(env.VSTYLE_RENDER_HOURLY_CAP) ?? '', 10);

  return {
    apiKey,
    textModel,
    textFallbackModel,
    imageModel,
    imageFallbackModel,
    thinkingLevel,
    renderHourlyCap: Number.isFinite(cap) && cap > 0 ? cap : 120,
  };
}

/** Errors worth retrying on the fallback model (model missing/retired, overloaded, rate limited). */
function shouldTryFallback(error: unknown): boolean {
  const status = (error as { status?: number })?.status;
  if (status === 404 || status === 429 || status === 500 || status === 503) return true;
  const message = error instanceof Error ? error.message : String(error);
  return /not found|not supported|unavailable|overloaded|deprecated|RESOURCE_EXHAUSTED|UNAVAILABLE/i.test(message);
}

function createClient(ai: GoogleGenAI, primaryModel: string, fallbackModel: string): GeminiProviderClient {
  return {
    async generateContent(req) {
      const first = req.model || primaryModel;
      const models = [first, fallbackModel].filter((model, index, all) => model && all.indexOf(model) === index);
      let lastError: unknown;
      for (const model of models) {
        try {
          return await ai.models.generateContent({ model, contents: req.contents, config: req.config });
        } catch (error) {
          lastError = error;
          if (!shouldTryFallback(error)) break;
          console.warn(`Gemini model ${model} failed, trying fallback.`, error instanceof Error ? error.message : error);
        }
      }
      throw lastError;
    },
  };
}

export function createGeminiProviders(settings: GeminiSettings): GeminiProviders {
  if (!settings.apiKey) {
    return { text: undefined, image: undefined };
  }

  const ai = new GoogleGenAI({ apiKey: settings.apiKey });

  return {
    text: createClient(ai, settings.textModel, settings.textFallbackModel),
    image: createClient(ai, settings.imageModel, settings.imageFallbackModel),
  };
}
