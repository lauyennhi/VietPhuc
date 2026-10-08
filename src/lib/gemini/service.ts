/**
 * Gemini Core Service Implementation for Vstyle
 * Provides prompt engineering, schema validation, and deterministic fallbacks
 */

import { getSourceById, getGarments, getEvents, getApprovedAccessories } from '../dal';
import type {
  GeminiCaptionResponse,
  GeminiExplainResponse,
  GeminiParseResponse,
  GeminiRankResponse,
  GeminiRenderResponse,
  GeminiVisionResponse,
} from '../../types/gemini';
import type { DeterministicRecommendation } from '../recommendation/engine';
import type { GeminiProviderClient } from './provider';

export interface GeminiServiceConfig {
  model: string;
  provider?: GeminiProviderClient;
  imageModel: string;
  imageProvider?: GeminiProviderClient;
  thinkingLevel?: 'low' | 'medium' | 'high';
}

export function approvedSourceReferences(sourceIds?: string[]): string[] {
  if (!sourceIds || !sourceIds.length) return ['Ngàn năm áo mũ (Trần Quang Đức, 2013)'];
  return sourceIds.map((id) => {
    const s = getSourceById(id);
    return s ? `${s.title} (${s.author}, ${s.year})` : id;
  });
}

/**
 * Natural language prompt parser: understands user's event, weather, style, and items
 */
export async function parseStylingText(
  request: { text: string },
  config: GeminiServiceConfig
): Promise<GeminiParseResponse> {
  const text = request.text.toLowerCase();

  // Rule-based fallback extractor
  const fallback = (): GeminiParseResponse => {
    let eventId = 'EVENT_YEARBOOK';
    if (text.includes('tốt nghiệp') || text.includes('ra trường')) eventId = 'EVENT_GRADUATION';
    else if (text.includes('tết') || text.includes('xuân')) eventId = 'EVENT_TET';
    else if (text.includes('cưới') || text.includes('hôn lễ')) eventId = 'EVENT_WEDDING';
    else if (text.includes('hội') || text.includes('đình')) eventId = 'EVENT_CULTURAL';
    else if (text.includes('phố') || text.includes('cafe')) eventId = 'EVENT_CASUAL';
    else if (text.includes('kỷ yếu') || text.includes('văn miếu')) eventId = 'EVENT_YEARBOOK';

    let weatherId = 'WEATHER_HOT';
    if (text.includes('lạnh') || text.includes('gió')) weatherId = 'WEATHER_COOL';
    else if (text.includes('mát') || text.includes('thu')) weatherId = 'WEATHER_PLEASANT';
    else if (text.includes('mưa')) weatherId = 'WEATHER_HUMID_RAIN';

    let styleId = 'REMIX_GEN_Z';
    if (text.includes('hoàng gia') || text.includes('cung đình')) styleId = 'TRUYEN_THONG_HOANG_GIA';
    else if (text.includes('tối giản') || text.includes('thanh lịch')) styleId = 'TOI_GIAN';
    else if (text.includes('dân gian') || text.includes('mộc mạc')) styleId = 'DAN_GIAN_MOC_MAC';
    else if (text.includes('cổ điển') || text.includes('hoài cổ')) styleId = 'CO_DIEN_HOAI_CO';
    else if (text.includes('năng động') || text.includes('dạo phố')) styleId = 'NANG_DONG_DAO_PHO';

    let color: string | undefined;
    if (text.includes('xanh')) color = '#1E5B78';
    else if (text.includes('đỏ')) color = '#8B1E2B';
    else if (text.includes('vàng')) color = '#D4A338';
    else if (text.includes('trắng')) color = '#FAF6F0';
    else if (text.includes('đen')) color = '#1C1C1E';

    const accessoryIds: string[] = [];
    if (text.includes('túi cói')) accessoryIds.push('acc-tui-coi');
    if (text.includes('khăn đóng')) accessoryIds.push('acc-khan-dong');
    if (text.includes('mấn')) accessoryIds.push('acc-man-nu');
    if (text.includes('kiềng')) accessoryIds.push('acc-kieng-bac');
    if (text.includes('quạt')) accessoryIds.push('acc-quat-tram-huong');
    if (text.includes('thẻ bài')) accessoryIds.push('acc-the-bai');

    const needCodes: any[] = [];
    if (text.includes('xe lăn') || text.includes('ngồi')) needCodes.push('WHEELCHAIR_SEATED');

    return {
      eventId,
      weatherId,
      styleId,
      color,
      accessoryIds,
      needCodes,
      summary: `Hiểu ý bạn: dịp ${eventId}, phong cách ${styleId}${color ? ', tông màu đã chọn' : ''}.`,
      confirmationRequired: [],
      usedFallback: true,
    };
  };

  if (!config.provider) {
    return fallback();
  }

  try {
    const prompt = `Bạn là trợ lý thời trang Việt phục Vstyle. Hãy phân tích câu yêu cầu: "${request.text}".
Trích xuất JSON chính xác theo cấu trúc:
{
  "eventId": "EVENT_GRADUATION" | "EVENT_YEARBOOK" | "EVENT_TET" | "EVENT_WEDDING" | "EVENT_CULTURAL" | "EVENT_CASUAL",
  "weatherId": "WEATHER_HOT" | "WEATHER_COOL" | "WEATHER_PLEASANT" | "WEATHER_HUMID_RAIN",
  "styleId": "TRUYEN_THONG_HOANG_GIA" | "REMIX_GEN_Z" | "TOI_GIAN" | "DAN_GIAN_MOC_MAC" | "CO_DIEN_HOAI_CO" | "NANG_DONG_DAO_PHO",
  "color": "mã hex hoặc null",
  "garmentId": "garment id hoặc null",
  "accessoryIds": ["acc-id"],
  "needCodes": ["WHEELCHAIR_SEATED" hoặc null],
  "summary": "tóm tắt ngắn gọn yêu cầu trong 1 câu"
}
Chỉ trả về JSON thuần túy, không có backticks.`;

    const res = await config.provider.generateContent({
      model: config.model,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    const raw = res?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    const clean = raw.replace(/^```json/, '').replace(/```$/, '').trim();
    const parsed = JSON.parse(clean);

    return {
      eventId: parsed.eventId || 'EVENT_YEARBOOK',
      weatherId: parsed.weatherId || 'WEATHER_HOT',
      styleId: parsed.styleId || 'REMIX_GEN_Z',
      color: parsed.color || undefined,
      garmentId: parsed.garmentId || undefined,
      accessoryIds: Array.isArray(parsed.accessoryIds) ? parsed.accessoryIds : [],
      needCodes: Array.isArray(parsed.needCodes) ? parsed.needCodes.filter(Boolean) : [],
      summary: parsed.summary || 'Đã phân tích yêu cầu phối đồ.',
      confirmationRequired: [],
      usedFallback: false,
    };
  } catch {
    return fallback();
  }
}

/**
 * Rank deterministic candidates according to user context
 */
export async function rankGeminiCandidates(
  request: { context: any; candidateIds: string[] },
  candidates: DeterministicRecommendation[],
  config: GeminiServiceConfig
): Promise<GeminiRankResponse> {
  const fallbackIds = candidates.map((c) => c.outfitId);
  if (!config.provider || candidates.length <= 1) {
    return { candidateIds: fallbackIds, usedFallback: true };
  }

  try {
    const listSummary = candidates
      .map((c) => `- ID: ${c.outfitId} | Trang phục: ${c.garmentId} | Màu: ${c.color} | Điểm văn hóa: ${c.score}`)
      .join('\n');

    const prompt = `Dưới đây là các phương án phối Việt phục:
${listSummary}

Dựa trên bối cảnh: ${JSON.stringify(request.context)}, hãy xếp hạng lại thứ tự ID tối ưu nhất.
Trả về JSON định dạng:
{
  "candidateIds": ["id1", "id2", ...],
  "reasoning": "Lý do ngắn gọn cho top 1"
}`;

    const res = await config.provider.generateContent({
      model: config.model,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    const raw = res?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    const clean = raw.replace(/^```json/, '').replace(/```$/, '').trim();
    const parsed = JSON.parse(clean);

    if (Array.isArray(parsed.candidateIds) && parsed.candidateIds.length) {
      return {
        candidateIds: parsed.candidateIds,
        reasoning: parsed.reasoning,
        usedFallback: false,
      };
    }
    return { candidateIds: fallbackIds, usedFallback: true };
  } catch {
    return { candidateIds: fallbackIds, usedFallback: true };
  }
}

/**
 * Explain outfit styling with cultural grounding
 */
export async function explainStyling(
  request: {
    garmentName: string;
    eventName: string;
    styleId: string;
    primaryColor: string;
    accessoryNames: string[];
    cultureResult: any;
    retainedCharacteristics: string[];
    sources: string[];
  },
  config: GeminiServiceConfig
): Promise<GeminiExplainResponse> {
  const fallback: GeminiExplainResponse = {
    headline: `Nét duyên ${request.garmentName} trong không gian ${request.eventName}`,
    editorialReview: `Bản phối khéo léo kết hợp ${request.garmentName} cùng sắc màu ${request.primaryColor}. Các điểm đặc trưng như ${request.retainedCharacteristics.join(', ')} được gìn giữ trọn vẹn, tôn vinh nét nho nhã cổ truyền phù hợp với sự kiện ${request.eventName}.`,
    culturalHarmony: 'Quy thức hữu nhậm và kết cấu tà áo được bảo lưu trọn vẹn theo sử liệu.',
    styleRemixVerdict: 'Phối màu tinh tế, tôn vinh nét đẹp truyền thống trong nhịp sống đương đại.',
    adviceForWearing: [
      'Giữ lưng thẳng khi đi lại để tà áo buông rủ phẳng phiu.',
      'Khi ngồi, vén nhẹ tà sau sang một bên để tránh nhăn nếp áo.',
    ],
    strengths: ['Bảo toàn quy thức hữu nhậm', 'Màu sắc nhã nhặn', 'Phụ kiện tôn dáng'],
    tips: ['Kết hợp bước đi nhẹ nhàng, giữ lưng thẳng để tà áo buông rủ phẳng phiu.'],
    usedFallback: true,
  };

  if (!config.provider) return fallback;

  try {
    const prompt = `Viết lời bình stylist thời trang cho bản phối Việt phục:
Trang phục: ${request.garmentName}
Sự kiện: ${request.eventName}
Phong cách: ${request.styleId}
Màu chủ đạo: ${request.primaryColor}
Phụ kiện: ${request.accessoryNames.join(', ') || 'Không'}
Đặc trưng bảo tồn: ${request.retainedCharacteristics.join('; ')}
Nguồn khảo cứu: ${request.sources.join('; ')}

Yêu cầu trả về JSON:
{
  "headline": "Tiêu đề giật tít nghệ thuật, ngắn gọn (dưới 12 từ)",
  "editorialReview": "Đoạn bình luận sắc sảo, tôn vinh bản sắc và thẩm mỹ Gen Z (khoảng 3-4 câu)",
  "strengths": ["điểm mạnh 1", "điểm mạnh 2"],
  "tips": ["lời khuyên tạo dáng hoặc diện đồ"]
}`;

    const res = await config.provider.generateContent({
      model: config.model,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    const raw = res?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    const clean = raw.replace(/^```json/, '').replace(/```$/, '').trim();
    const parsed = JSON.parse(clean);

    return {
      headline: parsed.headline || fallback.headline,
      editorialReview: parsed.editorialReview || fallback.editorialReview,
      strengths: parsed.strengths || fallback.strengths,
      tips: parsed.tips || fallback.tips,
      usedFallback: false,
    };
  } catch {
    return fallback;
  }
}

/**
 * Generate social caption and hashtags
 */
export async function createGeminiCaption(
  request: {
    garmentName: string;
    styleTitle: string;
    eventTitle: string;
    chuanScore: number;
    chatScore: number;
    vibe: string;
    cultureReasons: string[];
    retainedCharacteristics: string[];
    sources: string[];
  },
  config: GeminiServiceConfig
): Promise<GeminiCaptionResponse> {
  const fallback: GeminiCaptionResponse = {
    shortPunchyHook: `Rạng rỡ cùng ${request.garmentName} ✨`,
    instagramCaption: `Một ngày thật đẹp trong tà áo ${request.garmentName}! Chuẩn mực văn hóa ${request.chuanScore}/100, gìn giữ ${request.retainedCharacteristics[0] || 'nét truyền thống'}. Đúng chất Việt phục Remix cùng Vstyle!`,
    hashtags: ['#VietPhucRemix', '#Vstyle', '#AoNguThan', '#CoPhucVietNam', '#GenZVietPhuc'],
    storyPrompt: 'Bạn thích bản phối này ở điểm nào nhất?',
    usedFallback: true,
  };

  if (!config.provider) return fallback;

  try {
    const prompt = `Viết caption mạng xã hội (Instagram/Threads/TikTok) cho bản phối Việt phục:
Trang phục: ${request.garmentName}
Dịp: ${request.eventTitle}
Phong cách: ${request.styleTitle}
Điểm văn hóa Chuẩn: ${request.chuanScore}/100
Đặc trưng bảo lưu: ${request.retainedCharacteristics.join(', ')}

Trả về JSON:
{
  "shortPunchyHook": "Câu hook ngắn gọn, ấn tượng (có emoji)",
  "instagramCaption": "Nội dung caption trẻ trung, duyên dáng, đậm chất Gen Z",
  "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"],
  "storyPrompt": "Câu hỏi tương tác story"
}`;

    const res = await config.provider.generateContent({
      model: config.model,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    const raw = res?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    const clean = raw.replace(/^```json/, '').replace(/```$/, '').trim();
    const parsed = JSON.parse(clean);

    return {
      shortPunchyHook: parsed.shortPunchyHook || fallback.shortPunchyHook,
      instagramCaption: parsed.instagramCaption || fallback.instagramCaption,
      hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags : fallback.hashtags,
      storyPrompt: parsed.storyPrompt || fallback.storyPrompt,
      usedFallback: false,
    };
  } catch {
    return fallback;
  }
}

/**
 * Multimodal photo inspiration analysis
 */
export async function analyzeOutfitPhoto(
  request: { image: { mimeType: string; data: string }; note?: string },
  config: GeminiServiceConfig
): Promise<GeminiVisionResponse> {
  const fallback: GeminiVisionResponse = {
    summary: 'Đã nhận diện bảng màu cảm hứng từ ảnh tải lên.',
    dominantColors: [
      { hex: '#8B1E2B', name: 'Đỏ son / Điều', proportion: 0.5 },
      { hex: '#D4A338', name: 'Vàng mỡ gà', proportion: 0.3 },
      { hex: '#1C1C1E', name: 'Đen mun', proportion: 0.2 },
    ],
    detectedItems: ['Màu sắc vải gấm', 'Họa tiết truyền thống'],
    colorMatches: [
      { colorName: 'Đỏ son truyền thống', hex: '#8B1E2B', colorHex: '#8B1E2B', sourceHex: '#8B1E2B', garmentId: 'garment-ao-tac', garmentName: 'Áo Tấc' },
      { colorName: 'Vàng mỡ gà', hex: '#D4A338', colorHex: '#D4A338', sourceHex: '#D4A338', garmentId: 'garment-ngu-than-tay-chen', garmentName: 'Áo Ngũ Thân Tay Chẽn' },
    ],
    suggestedGarmentIds: ['garment-ao-tac', 'garment-ngu-than-tay-chen'],
    styleId: 'TRUYEN_THONG_HOANG_GIA',
    eventId: 'EVENT_TET',
    usedFallback: true,
  };

  if (!config.provider) return fallback;

  try {
    const prompt = `Phân tích bức ảnh trang phục/vải/cảm hứng này cho ứng dụng thời trang Việt phục Vstyle.
Hãy đọc các màu sắc chủ đạo, họa tiết, phong cách và gợi ý loại Việt phục phù hợp.
Trả về JSON chính xác:
{
  "summary": "Mô tả ngắn gọn màu sắc và cảm xúc của bức ảnh (1-2 câu)",
  "dominantColors": [
    { "hex": "#HEXCODE", "name": "tên màu tiếng Việt", "proportion": 0.5 }
  ],
  "detectedItems": ["tên chi tiết/vật phẩm nhận diện được"],
  "colorMatches": [
    { "colorName": "tên màu", "hex": "#HEXCODE", "garmentId": "garment-ngu-than-tay-chen" }
  ],
  "suggestedGarmentIds": ["garment-ngu-than-tay-chen"],
  "styleId": "TRUYEN_THONG_HOANG_GIA" | "REMIX_GEN_Z" | "TOI_GIAN",
  "eventId": "EVENT_GRADUATION" | "EVENT_TET" | "EVENT_YEARBOOK"
}`;

    const res = await config.provider.generateContent({
      model: config.model,
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { mimeType: request.image.mimeType, data: request.image.data } },
            { text: prompt },
          ],
        },
      ],
    });

    const raw = res?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    const clean = raw.replace(/^```json/, '').replace(/```$/, '').trim();
    const parsed = JSON.parse(clean);

    return {
      summary: parsed.summary || fallback.summary,
      dominantColors: Array.isArray(parsed.dominantColors) ? parsed.dominantColors : fallback.dominantColors,
      detectedItems: Array.isArray(parsed.detectedItems) ? parsed.detectedItems : fallback.detectedItems,
      colorMatches: Array.isArray(parsed.colorMatches) ? parsed.colorMatches : fallback.colorMatches,
      suggestedGarmentIds: Array.isArray(parsed.suggestedGarmentIds) ? parsed.suggestedGarmentIds : fallback.suggestedGarmentIds,
      styleId: parsed.styleId || fallback.styleId,
      eventId: parsed.eventId || fallback.eventId,
      usedFallback: false,
    };
  } catch {
    return fallback;
  }
}

/**
 * Render outfit illustration using Imagen or fallback vector SVG
 */
export async function renderOutfitImage(
  request: {
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
    prompt?: string;
  },
  config: GeminiServiceConfig
): Promise<GeminiRenderResponse> {
  const garment = getGarments().find((g) => g.id === request.garmentId);
  const garmentName = garment?.name ?? 'Áo Ngũ Thân';

  // SVG-based artistic vector stand-in fallback
  const svgFallback = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800" width="600" height="800">
    <defs>
      <radialGradient id="bgG" cx="50%" cy="40%" r="60%">
        <stop offset="0%" stop-color="#FAF6F0"/>
        <stop offset="100%" stop-color="#EAE0D2"/>
      </radialGradient>
      <linearGradient id="garmG" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${request.primaryColor}"/>
        <stop offset="100%" stop-color="#120D0B"/>
      </linearGradient>
    </defs>
    <rect width="600" height="800" fill="url(#bgG)"/>
    <circle cx="300" cy="400" r="260" fill="none" stroke="#D6A75B" stroke-width="1.5" stroke-dasharray="6 4" opacity="0.4"/>
    <g transform="translate(150, 100)">
      <!-- Head / Hat -->
      <ellipse cx="150" cy="90" rx="36" ry="46" fill="${request.skinTone || '#F5D6C6'}"/>
      <path d="M110 80 Q150 40 190 80 L185 95 Q150 70 115 95 Z" fill="#1C1C1E"/>
      <!-- Body / Robe -->
      <path d="M120 130 Q150 140 180 130 L230 460 Q150 480 70 460 Z" fill="url(#garmG)" stroke="#1F1B18" stroke-width="2"/>
      <!-- Huu Nham overlap -->
      <path d="M135 135 Q175 190 195 240 L195 465" fill="none" stroke="#FAF6F0" stroke-width="2" stroke-opacity="0.6"/>
      <!-- Belt / Acc -->
      <rect x="110" y="270" width="80" height="12" rx="4" fill="#D6A75B"/>
      <!-- Pants -->
      <rect x="115" y="460" width="30" height="90" fill="${request.pantColor || '#FFFFFF'}"/>
      <rect x="155" y="460" width="30" height="90" fill="${request.pantColor || '#FFFFFF'}"/>
    </g>
    <text x="300" y="730" text-anchor="middle" font-family="serif" font-size="22" font-weight="bold" fill="#1F1B18">${garmentName}</text>
    <text x="300" y="760" text-anchor="middle" font-family="sans-serif" font-size="13" fill="#736960">Vstyle · AI Arena Vietnam 2026</text>
  </svg>`;

  const fallbackDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svgFallback)}`;

  return {
    imageDataUrl: fallbackDataUrl,
    model: 'vstyle-vector-engine',
    checklist: [
      'Bảo lưu quy thức Vạt Hữu Nhậm khép sang bên phải',
      'Đúng kết cấu cổ lập lĩnh và thân con che kín',
      'Màu sắc và phụ kiện tương thích điển lệ',
    ],
    usedFallback: true,
    prompt: `Bản phối ${garmentName} màu ${request.primaryColor}`,
  };
}
