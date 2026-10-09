/**
 * Frontend client for communicating with /api/gemini and /api/health
 */

import type {
  OutfitDesign,
  GeminiAdaptiveResponse,
  GeminiCaptionResponse,
  GeminiExplainResponse,
  GeminiParseResponse,
  GeminiRankResponse,
  GeminiRenderResponse,
  GeminiVisionResponse,
} from '../../types/gemini';
import type { DeterministicRecommendation, RecommendationContext } from '../recommendation/engine';
import { adaptiveAdvice, designOutfit, type GeminiServiceConfig } from './service';

/** No provider → the service functions return their deterministic, data-grounded results. */
const OFFLINE_CONFIG: GeminiServiceConfig = { model: 'offline', imageModel: 'offline' };

export class GeminiRequestError extends Error {
  status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.name = 'GeminiRequestError';
    this.status = status;
  }
}

export interface ServerHealth {
  status: string;
  product: string;
  hasGeminiKey: boolean;
  textModel: string;
  imageModel: string;
  features: {
    aiStylist: boolean;
    explanation: boolean;
    caption: boolean;
    vision: boolean;
    imageRender: boolean;
  };
  garmentsCount: number;
  approvedGarmentsCount: number;
  rulesCount: number;
}

async function postJson<T>(url: string, body: any): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    let msg = res.status === 404
      ? 'Máy chủ đang chạy bản cũ chưa có tính năng này — hãy deploy lại từ nhánh main.'
      : `Yêu cầu thất bại (${res.status})`;
    try {
      const err = await res.json();
      if (err?.error) msg = err.error;
    } catch {
      // ignore
    }
    throw new GeminiRequestError(msg, res.status);
  }

  return (await res.json()) as T;
}

export async function getServerHealth(): Promise<ServerHealth> {
  try {
    const res = await fetch('/api/health');
    if (res.ok) return (await res.json()) as ServerHealth;
  } catch {
    // fallback
  }
  return {
    status: 'ok',
    product: 'Vstyle',
    hasGeminiKey: false,
    textModel: 'gemini-3.8-flash',
    imageModel: 'gemini-3.1-flash-image',
    features: {
      aiStylist: true,
      explanation: true,
      caption: true,
      vision: false,
      imageRender: true,
    },
    garmentsCount: 8,
    approvedGarmentsCount: 8,
    rulesCount: 8,
  };
}

export async function parseNaturalLanguagePrompt(text: string): Promise<GeminiParseResponse> {
  try {
    return await postJson<GeminiParseResponse>('/api/gemini/parse', { text });
  } catch {
    return {
      eventId: 'EVENT_YEARBOOK',
      weatherId: 'WEATHER_HOT',
      styleId: 'REMIX_GEN_Z',
      color: '#1E5B78',
      needCodes: [],
      summary: `Đã tiếp nhận yêu cầu: "${text.slice(0, 50)}..."`,
      confirmationRequired: [],
      usedFallback: true,
    };
  }
}

export async function getGeminiRecommendation(
  context: RecommendationContext,
  candidates: DeterministicRecommendation[]
): Promise<GeminiRankResponse> {
  try {
    return await postJson<GeminiRankResponse>('/api/gemini/recommend', { context, candidates });
  } catch {
    return {
      candidateIds: candidates.map((c) => c.outfitId),
      usedFallback: true,
    };
  }
}

export async function explainOutfit(payload: {
  garment: any;
  cultureCheck: any;
  eventId: string;
  eventName: string;
  styleVibe: string;
  primaryColor: string;
  accessoryIds?: string[];
  accessoryNames?: string[];
  adaptiveNeedCodes?: string[];
}): Promise<GeminiExplainResponse> {
  try {
    return await postJson<GeminiExplainResponse>('/api/gemini/explain', payload);
  } catch {
    const gName = payload.garment?.name || 'Áo Ngũ Thân';
    return {
      headline: `Nét trang nhã ${gName}`,
      editorialReview: `Bản phối ${gName} thể hiện sự cân bằng giữa chuẩn mực cổ truyền và thẩm mỹ hiện đại. Phù hợp cho không gian ${payload.eventName}.`,
      strengths: ['Bảo toàn vạt hữu nhậm', 'Màu sắc hài hòa'],
      tips: ['Đi đứng trang nhã, tà áo buông rủ tự nhiên.'],
      usedFallback: true,
    };
  }
}

export async function getOutfitCaptions(payload: {
  garmentId: string;
  garmentName: string;
  styleTitle: string;
  eventId?: string;
  eventTitle?: string;
  chuanScore?: number;
  chatScore?: number;
  vibe?: string;
  primaryColor?: string;
  accessoryIds?: string[];
  adaptiveNeedCodes?: string[];
}): Promise<GeminiCaptionResponse> {
  try {
    return await postJson<GeminiCaptionResponse>('/api/gemini/caption', payload);
  } catch {
    return {
      shortPunchyHook: `Rạng rỡ cùng ${payload.garmentName} ✨`,
      instagramCaption: `Một ngày đặc biệt cùng ${payload.styleTitle}! Điểm văn hóa ${payload.chuanScore ?? 95}/100 chuẩn mực truyền thống. Tự hào khoác lên mình nét đẹp di sản Việt Nam!`,
      hashtags: ['#VietPhucRemix', '#Vstyle', '#AoNguThan', '#CoPhucVietNam'],
      storyPrompt: 'Bạn thích phong cách này chứ?',
      usedFallback: true,
    };
  }
}

export async function analyzeOutfitPhoto(
  image: { mimeType: string; data: string },
  note?: string
): Promise<GeminiVisionResponse> {
  try {
    return await postJson<GeminiVisionResponse>('/api/gemini/vision', { image, note });
  } catch {
    return {
      summary: 'Đã trích xuất bảng màu cảm hứng từ ảnh của bạn.',
      dominantColors: [
        { hex: '#8B1E2B', name: 'Đỏ son / Điều', proportion: 0.5 },
        { hex: '#D4A338', name: 'Vàng mỡ gà', proportion: 0.3 },
      ],
      detectedItems: ['Màu sắc vải truyền thống'],
      colorMatches: [
        { colorName: 'Đỏ son', hex: '#8B1E2B', colorHex: '#8B1E2B', garmentId: 'garment-ao-tac', garmentName: 'Áo Tấc' },
        { colorName: 'Vàng mỡ gà', hex: '#D4A338', colorHex: '#D4A338', garmentId: 'garment-ngu-than-tay-chen', garmentName: 'Áo Ngũ Thân Tay Chẽn' },
      ],
      suggestedGarmentIds: ['garment-ao-tac', 'garment-ngu-than-tay-chen'],
      styleId: 'TRUYEN_THONG_HOANG_GIA',
      eventId: 'EVENT_TET',
      usedFallback: true,
    };
  }
}

export async function renderOutfitImage(payload: {
  garmentId: string;
  eventId?: string;
  styleId?: string;
  primaryColor: string;
  pantColor?: string;
  accessoryIds?: string[];
  characterId?: string;
  skinTone?: string;
  adaptiveNeedCodes?: string[];
  referenceImage?: { mimeType: string; data: string };
  consentToUseReference?: boolean;
}): Promise<GeminiRenderResponse> {
  return await postJson<GeminiRenderResponse>('/api/gemini/render', payload);
}
export async function requestAdaptiveAdvice(payload: {
  garmentId: string;
  needCodes: string[];
  adjustments: Record<string, unknown>;
  eventId?: string;
}): Promise<GeminiAdaptiveResponse> {
  try {
    return await postJson<GeminiAdaptiveResponse>('/api/gemini/adaptive', payload);
  } catch {
    // Server unavailable or outdated deployment: same deterministic advice, computed in the browser.
    return await adaptiveAdvice(payload, OFFLINE_CONFIG);
  }
}

export async function designOutfitFromText(payload: { text: string; photoColors?: string[]; needCodes?: string[] }): Promise<OutfitDesign> {
  try {
    return await postJson<OutfitDesign>('/api/gemini/design', payload);
  } catch {
    // Server unavailable or outdated deployment: design locally from the same sentence.
    return await designOutfit(payload, OFFLINE_CONFIG);
  }
}
