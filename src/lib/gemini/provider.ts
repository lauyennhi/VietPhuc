/**
 * Gemini Provider configuration and SDK factory using @google/genai
 */

import { GoogleGenAI } from '@google/genai';

export interface GeminiSettings {
  apiKey?: string;
  textModel: string;
  textFallbackModel: string;
  imageModel: string;
  thinkingLevel: 'off' | 'low' | 'medium' | 'high';
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

export function readGeminiSettings(env: Record<string, string | undefined>): GeminiSettings {
  const apiKey = env.GEMINI_API_KEY?.trim() || undefined;
  const textModel = env.GEMINI_TEXT_MODEL || 'gemini-2.5-flash';
  const textFallbackModel = env.GEMINI_FALLBACK_MODEL || 'gemini-2.5-flash';
  const imageModel = env.GEMINI_IMAGE_MODEL || 'imagen-3.0-generate-002';
  const rawThinking = env.GEMINI_THINKING_LEVEL?.toLowerCase();
  const thinkingLevel: 'off' | 'low' | 'medium' | 'high' =
    rawThinking === 'off' || rawThinking === 'low' || rawThinking === 'medium' || rawThinking === 'high'
      ? rawThinking
      : 'off';

  return {
    apiKey,
    textModel,
    textFallbackModel,
    imageModel,
    thinkingLevel,
  };
}

export function createGeminiProviders(settings: GeminiSettings): GeminiProviders {
  if (!settings.apiKey) {
    return { text: undefined, image: undefined };
  }

  const ai = new GoogleGenAI({ apiKey: settings.apiKey });

  const client: GeminiProviderClient = {
    async generateContent(req) {
      const model = req.model || settings.textModel;
      return await ai.models.generateContent({
        model,
        contents: req.contents,
        config: req.config,
      });
    },
  };

  return {
    text: client,
    image: client,
  };
}
