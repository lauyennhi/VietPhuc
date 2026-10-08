/**
 * Gemini Core Service Implementation for Vstyle
 * Provides prompt engineering, JSON-schema constrained output, allow-list validation,
 * and deterministic fallbacks for every feature.
 */

import {
  getSourceById,
  getGarments,
  getGarmentById,
  getApprovedGarments,
  getEvents,
  getEventById,
  getApprovedAccessories,
  getAccessoryById,
  getCharacterById,
  getWeatherContexts,
  getAdaptiveNeeds,
} from '../dal';
import { STYLE_CHOICES } from '../styles';
import type {
  GeminiAdaptiveResponse,
  GeminiCaptionResponse,
  GeminiExplainResponse,
  GeminiParseResponse,
  GeminiRankResponse,
  GeminiRenderResponse,
  GeminiVisionResponse,
} from '../../types/gemini';
import type { FunctionalNeedCode } from '../../types/domain';
import type { DeterministicRecommendation } from '../recommendation/engine';
import { CLOSURE_LABELS, presetFor, type AdaptiveAdjustments, type ClosureType } from '../adaptive/presets';
import { checkAdaptiveCulture } from '../adaptive/cultureGuard';
import type { GeminiProviderClient, ThinkingSetting } from './provider';

export interface GeminiServiceConfig {
  model: string;
  provider?: GeminiProviderClient;
  imageModel: string;
  imageProvider?: GeminiProviderClient;
  thinkingLevel?: Exclude<ThinkingSetting, 'off'>;
}

const SYSTEM_INSTRUCTION = `Bạn là Vstyle — stylist Việt phục cho Gen Z, viết tiếng Việt tự nhiên, ấm áp, chính xác.
Quy tắc bắt buộc:
- Chỉ dùng dữ kiện văn hóa/lịch sử được cung cấp trong yêu cầu; KHÔNG bịa thêm sử liệu, niên đại, luật lệ hay nguồn mới.
- Kết quả kiểm tra văn hóa do hệ thống cung cấp là bất biến; không được phủ nhận hay thay đổi.
- Không bình luận về vóc dáng, khuôn mặt, tuổi, giới tính, sắc tộc của người dùng.
- Chỉ chọn ID trong danh sách cho phép; nếu không chắc chắn, dùng "NONE".
- Trả về đúng JSON theo schema, không kèm markdown.`;

export function approvedSourceReferences(sourceIds?: string[]): string[] {
  if (!sourceIds || !sourceIds.length) return ['Ngàn năm áo mũ (Trần Quang Đức, 2013)'];
  return sourceIds.map((id) => {
    const s = getSourceById(id);
    return s ? `${s.title} (${s.author}, ${s.year})` : id;
  });
}

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

const HEX_RE = /^#[0-9a-f]{6}$/i;
const NONE = 'NONE';

function normalizeHex(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const v = value.trim();
  if (HEX_RE.test(v)) return v.toUpperCase();
  if (/^#[0-9a-f]{3}$/i.test(v)) {
    return `#${v[1]}${v[1]}${v[2]}${v[2]}${v[3]}${v[3]}`.toUpperCase();
  }
  return undefined;
}

function pick<T extends string>(value: unknown, allowed: readonly T[]): T | undefined {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value) ? (value as T) : undefined;
}

function strings(value: unknown, max = 8, maxLen = 400): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .map((item) => (item.length > maxLen ? `${item.slice(0, maxLen - 1)}…` : item.trim()))
    .slice(0, max);
}

function text(value: unknown, maxLen = 1200): string | undefined {
  if (typeof value !== 'string' || !value.trim()) return undefined;
  const v = value.trim();
  return v.length > maxLen ? `${v.slice(0, maxLen - 1)}…` : v;
}

function responseText(res: any): string {
  if (typeof res?.text === 'string') return res.text;
  const parts: any[] = res?.candidates?.[0]?.content?.parts ?? [];
  return parts.map((part) => (typeof part?.text === 'string' && !part.thought ? part.text : '')).join('');
}

function parseJson(raw: string): any {
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1));
    throw new Error('Gemini trả về JSON không hợp lệ.');
  }
}

/** Calls Gemini with a JSON schema and returns the parsed object. Throws on any failure. */
async function generateJson(
  config: GeminiServiceConfig,
  parts: any[],
  schema: Record<string, unknown>,
  temperature = 0.7
): Promise<any> {
  if (!config.provider) throw new Error('Gemini chưa được cấu hình.');
  const res = await config.provider.generateContent({
    model: config.model,
    contents: [{ role: 'user', parts }],
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: 'application/json',
      responseJsonSchema: schema,
      temperature,
      ...(config.thinkingLevel ? { thinkingConfig: { thinkingLevel: config.thinkingLevel.toUpperCase() } } : {}),
    },
  });
  return parseJson(responseText(res));
}

const enumWithNone = (values: string[]) => ({ type: 'string', enum: [...values, NONE] });

/* ------------------------------------------------------------------ */
/* Parse                                                               */
/* ------------------------------------------------------------------ */

const NEED_CODES = (): FunctionalNeedCode[] => getAdaptiveNeeds().map((need) => need.code);

/**
 * Natural language prompt parser: understands user's event, weather, style, and items
 */
export async function parseStylingText(
  request: { text: string },
  config: GeminiServiceConfig
): Promise<GeminiParseResponse> {
  const userText = request.text.slice(0, 1000);
  const lower = userText.toLowerCase();

  // Rule-based fallback extractor
  const fallback = (): GeminiParseResponse => {
    let eventId = 'EVENT_YEARBOOK';
    if (lower.includes('tốt nghiệp') || lower.includes('ra trường')) eventId = 'EVENT_GRADUATION';
    else if (lower.includes('tết') || lower.includes('xuân')) eventId = 'EVENT_TET';
    else if (lower.includes('cưới') || lower.includes('hôn lễ')) eventId = 'EVENT_WEDDING';
    else if (lower.includes('hòa nhạc') || lower.includes('concert')) eventId = 'EVENT_CONCERT';
    else if (lower.includes('lễ hội') || lower.includes('festival')) eventId = 'EVENT_FESTIVAL';
    else if (lower.includes('hội') || lower.includes('đình') || lower.includes('triển lãm')) eventId = 'EVENT_CULTURAL';
    else if (lower.includes('phố') || lower.includes('cafe') || lower.includes('du lịch')) eventId = 'EVENT_CASUAL';
    else if (lower.includes('kỷ yếu') || lower.includes('văn miếu')) eventId = 'EVENT_YEARBOOK';

    let weatherId = 'WEATHER_HOT';
    if (lower.includes('lạnh') || lower.includes('gió')) weatherId = 'WEATHER_COOL';
    else if (lower.includes('mưa')) weatherId = 'WEATHER_HUMID_RAIN';
    else if (lower.includes('mát') || lower.includes('thu')) weatherId = 'WEATHER_PLEASANT';

    let styleId = 'REMIX_GEN_Z';
    if (lower.includes('hoàng gia') || lower.includes('cung đình')) styleId = 'TRUYEN_THONG_HOANG_GIA';
    else if (lower.includes('tối giản') || lower.includes('thanh lịch')) styleId = 'TOI_GIAN';
    else if (lower.includes('dân gian') || lower.includes('mộc mạc')) styleId = 'DAN_GIAN_MOC_MAC';
    else if (lower.includes('cổ điển') || lower.includes('hoài cổ')) styleId = 'CO_DIEN_HOAI_CO';
    else if (lower.includes('năng động') || lower.includes('dạo phố')) styleId = 'NANG_DONG_DAO_PHO';

    let color: string | undefined;
    if (lower.includes('xanh lá') || lower.includes('xanh rêu')) color = '#3D5A45';
    else if (lower.includes('xanh')) color = '#1E5B78';
    else if (lower.includes('đỏ')) color = '#8B1E2B';
    else if (lower.includes('vàng')) color = '#D4A338';
    else if (lower.includes('trắng')) color = '#FAF6F0';
    else if (lower.includes('đen')) color = '#1C1C1E';

    const accessoryIds: string[] = [];
    if (lower.includes('túi cói')) accessoryIds.push('acc-tui-coi');
    if (lower.includes('khăn đóng')) accessoryIds.push('acc-khan-dong');
    if (lower.includes('mấn')) accessoryIds.push('acc-man-nu');
    if (lower.includes('kiềng')) accessoryIds.push('acc-kieng-bac');
    if (lower.includes('quạt')) accessoryIds.push('acc-quat-tram-huong');
    if (lower.includes('thẻ bài')) accessoryIds.push('acc-the-bai');
    if (lower.includes('nón quai thao')) accessoryIds.push('acc-non-quai-thao');
    if (lower.includes('sneaker') || lower.includes('giày thể thao')) accessoryIds.push('acc-sneaker-retro');
    if (lower.includes('kính râm')) accessoryIds.push('acc-kinh-ram');

    const needCodes: FunctionalNeedCode[] = [];
    if (lower.includes('xe lăn')) needCodes.push('WHEELCHAIR_SEATED' as FunctionalNeedCode);

    const eventName = getEventById(eventId)?.name ?? eventId;
    const styleName = STYLE_CHOICES.find((s) => s.id === styleId)?.label ?? styleId;

    return {
      eventId,
      weatherId,
      styleId,
      color,
      accessoryIds,
      needCodes: needCodes.filter((code) => NEED_CODES().includes(code)),
      summary: `Hiểu ý bạn: dịp ${eventName}, phong cách ${styleName}${color ? ', tông màu đã chọn' : ''}.`,
      confirmationRequired: [],
      usedFallback: true,
    };
  };

  if (!config.provider || !userText.trim()) return fallback();

  const eventIds = getEvents().map((e) => e.id);
  const weatherIds = getWeatherContexts().map((w) => w.id);
  const styleIds = STYLE_CHOICES.map((s) => s.id);
  const garmentIds = getApprovedGarments().map((g) => g.id);
  const accessoryIds = getApprovedAccessories().map((a) => a.id);
  const needCodes = NEED_CODES();

  try {
    const catalog = [
      `Dịp: ${getEvents().map((e) => `${e.id}=${e.name}`).join('; ')}`,
      `Thời tiết: ${getWeatherContexts().map((w: any) => `${w.id}=${w.name ?? w.id}`).join('; ')}`,
      `Phong cách: ${STYLE_CHOICES.map((s) => `${s.id}=${s.label}`).join('; ')}`,
      `Y phục: ${getApprovedGarments().map((g) => `${g.id}=${g.name}`).join('; ')}`,
      `Phụ kiện: ${getApprovedAccessories().map((a) => `${a.id}=${a.name}`).join('; ')}`,
      `Nhu cầu thích ứng (chỉ chọn khi người dùng TỰ NÓI rõ): ${getAdaptiveNeeds().map((n) => `${n.code}=${n.name}`).join('; ')}`,
    ].join('\n');

    const parsed = await generateJson(
      config,
      [{
        text: `Danh mục cho phép:\n${catalog}\n\nCâu của người dùng: """${userText}"""\n\nHãy trích xuất ý định phối Việt phục. "color" là mã hex #RRGGBB của màu người dùng muốn (hoặc "NONE"). "summary" là 1 câu tiếng Việt tóm tắt bạn đã hiểu gì.`,
      }],
      {
        type: 'object',
        properties: {
          eventId: enumWithNone(eventIds),
          weatherId: enumWithNone(weatherIds),
          styleId: enumWithNone(styleIds),
          garmentId: enumWithNone(garmentIds),
          color: { type: 'string' },
          accessoryIds: { type: 'array', items: { type: 'string', enum: accessoryIds } },
          needCodes: { type: 'array', items: { type: 'string', enum: needCodes } },
          summary: { type: 'string' },
        },
        required: ['eventId', 'weatherId', 'styleId', 'garmentId', 'color', 'accessoryIds', 'needCodes', 'summary'],
      },
      0.2
    );

    const base = fallback();
    const confirmationRequired: string[] = [];
    const chosenNeeds = (Array.isArray(parsed.needCodes) ? parsed.needCodes : [])
      .filter((code: unknown): code is FunctionalNeedCode => typeof code === 'string' && needCodes.includes(code as FunctionalNeedCode));
    if (chosenNeeds.length) confirmationRequired.push('needCodes');

    return {
      eventId: pick(parsed.eventId, eventIds) ?? base.eventId,
      weatherId: pick(parsed.weatherId, weatherIds) ?? base.weatherId,
      styleId: pick(parsed.styleId, styleIds) ?? base.styleId,
      color: normalizeHex(parsed.color) ?? base.color,
      garmentId: pick(parsed.garmentId, garmentIds),
      accessoryIds: [...new Set(strings(parsed.accessoryIds, 6).filter((id) => accessoryIds.includes(id)))],
      needCodes: chosenNeeds,
      summary: text(parsed.summary, 300) ?? base.summary,
      confirmationRequired,
      usedFallback: false,
    };
  } catch (error) {
    console.warn('Gemini parse failed, using fallback.', (error as Error).message);
    return fallback();
  }
}

/* ------------------------------------------------------------------ */
/* Rank                                                                */
/* ------------------------------------------------------------------ */

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
      .slice(0, 12)
      .map((c) => {
        const garment = getGarmentById(c.garmentId);
        const accessoryNames = (c.accessoryIds ?? []).map((id) => getAccessoryById(id)?.name ?? id).join(', ');
        return `- ID: ${c.outfitId} | Y phục: ${garment?.name ?? c.garmentId} | Màu: ${c.color} | Phụ kiện: ${accessoryNames || 'không'} | Điểm tất định: ${c.score}`;
      })
      .join('\n');

    const parsed = await generateJson(
      config,
      [{
        text: `Các bản phối đã qua kiểm tra văn hóa:\n${listSummary}\n\nBối cảnh người dùng: ${JSON.stringify(request.context ?? {}).slice(0, 2000)}\n\nHãy xếp hạng các ID từ phù hợp nhất đến kém nhất với bối cảnh và gu người dùng. "reasoning": 1–2 câu giải thích vì sao bản đứng đầu hợp nhất.`,
      }],
      {
        type: 'object',
        properties: {
          candidateIds: { type: 'array', items: { type: 'string', enum: fallbackIds } },
          reasoning: { type: 'string' },
        },
        required: ['candidateIds', 'reasoning'],
      },
      0.3
    );

    const ranked = [...new Set(strings(parsed.candidateIds, 50).filter((id) => fallbackIds.includes(id)))];
    if (!ranked.length) return { candidateIds: fallbackIds, usedFallback: true };
    // Keep every candidate: append any the model omitted in deterministic order.
    for (const id of fallbackIds) if (!ranked.includes(id)) ranked.push(id);
    return { candidateIds: ranked, reasoning: text(parsed.reasoning, 400), usedFallback: false };
  } catch (error) {
    console.warn('Gemini rank failed, using fallback.', (error as Error).message);
    return { candidateIds: fallbackIds, usedFallback: true };
  }
}

/* ------------------------------------------------------------------ */
/* Explain                                                             */
/* ------------------------------------------------------------------ */

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
    editorialReview: `Bản phối khéo léo kết hợp ${request.garmentName} cùng sắc màu ${request.primaryColor}. Các điểm đặc trưng như ${request.retainedCharacteristics.join(', ') || 'kết cấu truyền thống'} được gìn giữ trọn vẹn, tôn vinh nét nho nhã cổ truyền phù hợp với sự kiện ${request.eventName}.`,
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

  const styleLabel = STYLE_CHOICES.find((s) => s.id === request.styleId)?.label ?? request.styleId;
  const culture = request.cultureResult
    ? JSON.stringify({
        score: request.cultureResult.score ?? request.cultureResult.chuanScore,
        status: request.cultureResult.status ?? request.cultureResult.verdict,
        reasons: request.cultureResult.reasons ?? request.cultureResult.messages,
      }).slice(0, 1500)
    : 'Không có cảnh báo.';

  try {
    const parsed = await generateJson(
      config,
      [{
        text: `Viết lời bình stylist cho bản phối Việt phục (giọng Gen Z, tinh tế, không sáo rỗng):
Trang phục: ${request.garmentName}
Dịp: ${request.eventName}
Phong cách: ${styleLabel}
Màu chủ đạo: ${request.primaryColor} (mô tả bằng tên màu tiếng Việt, đừng ghi mã hex)
Phụ kiện: ${request.accessoryNames.join(', ') || 'Không'}
Đặc trưng được bảo lưu (sự thật bất biến): ${request.retainedCharacteristics.join('; ') || 'kết cấu truyền thống'}
Kết quả kiểm tra văn hóa (bất biến): ${culture}
Nguồn khảo cứu: ${request.sources.join('; ')}

Yêu cầu: headline dưới 12 từ; editorialReview 3–4 câu; culturalHarmony 1–2 câu về phần giữ bản sắc; styleRemixVerdict 1–2 câu về chất Remix; adviceForWearing 2–3 mẹo mặc/tạo dáng; strengths 2–3 ý ngắn.`,
      }],
      {
        type: 'object',
        properties: {
          headline: { type: 'string' },
          editorialReview: { type: 'string' },
          culturalHarmony: { type: 'string' },
          styleRemixVerdict: { type: 'string' },
          adviceForWearing: { type: 'array', items: { type: 'string' } },
          strengths: { type: 'array', items: { type: 'string' } },
        },
        required: ['headline', 'editorialReview', 'culturalHarmony', 'styleRemixVerdict', 'adviceForWearing', 'strengths'],
      }
    );

    const advice = strings(parsed.adviceForWearing, 4, 240);
    return {
      headline: text(parsed.headline, 140) ?? fallback.headline,
      editorialReview: text(parsed.editorialReview, 1200) ?? fallback.editorialReview,
      culturalHarmony: text(parsed.culturalHarmony, 400) ?? fallback.culturalHarmony,
      styleRemixVerdict: text(parsed.styleRemixVerdict, 400) ?? fallback.styleRemixVerdict,
      adviceForWearing: advice.length ? advice : fallback.adviceForWearing,
      strengths: strings(parsed.strengths, 4, 160).length ? strings(parsed.strengths, 4, 160) : fallback.strengths,
      tips: advice.length ? advice : fallback.tips,
      usedFallback: false,
    };
  } catch (error) {
    console.warn('Gemini explain failed, using fallback.', (error as Error).message);
    return fallback;
  }
}

/* ------------------------------------------------------------------ */
/* Caption                                                             */
/* ------------------------------------------------------------------ */

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
    const parsed = await generateJson(
      config,
      [{
        text: `Viết caption mạng xã hội (Instagram/Threads/TikTok) cho bản phối Việt phục:
Trang phục: ${request.garmentName}
Dịp: ${request.eventTitle}
Phong cách: ${request.styleTitle}
Điểm Chuẩn văn hóa: ${request.chuanScore}/100 · Điểm Chất: ${request.chatScore}/100
Đặc trưng bảo lưu: ${request.retainedCharacteristics.join(', ') || 'kết cấu truyền thống'}

Yêu cầu: shortPunchyHook ngắn, có 1 emoji; instagramCaption 2–4 câu trẻ trung, đúng chính tả tiếng Việt; hashtags 5–7 thẻ bắt đầu bằng #, không dấu cách; storyPrompt là 1 câu hỏi tương tác.`,
      }],
      {
        type: 'object',
        properties: {
          shortPunchyHook: { type: 'string' },
          instagramCaption: { type: 'string' },
          hashtags: { type: 'array', items: { type: 'string' } },
          storyPrompt: { type: 'string' },
        },
        required: ['shortPunchyHook', 'instagramCaption', 'hashtags', 'storyPrompt'],
      },
      0.9
    );

    const hashtags = strings(parsed.hashtags, 8, 40)
      .map((tag) => `#${tag.replace(/^#+/, '').replace(/\s+/g, '')}`)
      .filter((tag) => tag.length > 1);

    return {
      shortPunchyHook: text(parsed.shortPunchyHook, 120) ?? fallback.shortPunchyHook,
      instagramCaption: text(parsed.instagramCaption, 900) ?? fallback.instagramCaption,
      hashtags: hashtags.length ? hashtags : fallback.hashtags,
      storyPrompt: text(parsed.storyPrompt, 200) ?? fallback.storyPrompt,
      usedFallback: false,
    };
  } catch (error) {
    console.warn('Gemini caption failed, using fallback.', (error as Error).message);
    return fallback;
  }
}

/* ------------------------------------------------------------------ */
/* Vision                                                              */
/* ------------------------------------------------------------------ */

function hexToLab(hex: string): [number, number, number] {
  const n = Number.parseInt(hex.slice(1), 16);
  const toLinear = (c: number) => {
    const v = c / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  const r = toLinear((n >> 16) & 255);
  const g = toLinear((n >> 8) & 255);
  const b = toLinear(n & 255);
  const x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
  const y = r * 0.2126 + g * 0.7152 + b * 0.0722;
  const z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
}

function deltaE(a: string, b: string): number {
  const [l1, a1, b1] = hexToLab(a);
  const [l2, a2, b2] = hexToLab(b);
  return Math.hypot(l1 - l2, a1 - a2, b1 - b2);
}

/** Matches a detected colour to the closest approved garment colour (ΔE in Lab space). */
function closestApprovedColor(hex: string) {
  let best: { garmentId: string; garmentName: string; colorName: string; colorHex: string; distance: number } | undefined;
  for (const garment of getApprovedGarments()) {
    for (const color of garment.baseColors) {
      const colorHex = normalizeHex(color.hex);
      if (!colorHex) continue;
      const distance = deltaE(hex, colorHex);
      if (!best || distance < best.distance) {
        best = { garmentId: garment.id, garmentName: garment.name, colorName: color.name || colorHex, colorHex, distance };
      }
    }
  }
  return best;
}

/**
 * Multimodal photo inspiration analysis
 */
export async function analyzeOutfitPhoto(
  request: { image: { mimeType: string; data: string }; note?: string },
  config: GeminiServiceConfig
): Promise<GeminiVisionResponse> {
  const fallback: GeminiVisionResponse = {
    summary: 'Chưa đọc được ảnh bằng Gemini — gợi ý tạm bảng màu Việt phục kinh điển.',
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
  if (!/^image\/(jpeg|png|webp|heic|heif)$/i.test(request.image.mimeType)) return fallback;

  const garmentIds = getApprovedGarments().map((g) => g.id);
  const styleIds = STYLE_CHOICES.map((s) => s.id);
  const eventIds = getEvents().map((e) => e.id);

  try {
    const parsed = await generateJson(
      config,
      [
        { inlineData: { mimeType: request.image.mimeType, data: request.image.data } },
        {
          text: `Đây là ảnh cảm hứng (trang phục, vải, khung cảnh…) người dùng tải lên cho ứng dụng phối Việt phục.
Chỉ mô tả trang phục, chất liệu, họa tiết và màu sắc — KHÔNG nhận xét về người trong ảnh (vóc dáng, khuôn mặt, tuổi, giới tính, sắc tộc).
${request.note ? `Ghi chú của người dùng: """${String(request.note).slice(0, 300)}"""\n` : ''}
Trả về: summary (1–2 câu), dominantColors (3–5 màu chủ đạo, hex #RRGGBB, tên màu tiếng Việt, proportion 0–1), detectedItems (tối đa 6 chi tiết), suggestedGarmentIds (1–3 y phục hợp nhất từ danh sách: ${getApprovedGarments().map((g) => `${g.id}=${g.name}`).join('; ')}), styleId, eventId.`,
        },
      ],
      {
        type: 'object',
        properties: {
          summary: { type: 'string' },
          dominantColors: {
            type: 'array',
            items: {
              type: 'object',
              properties: { hex: { type: 'string' }, name: { type: 'string' }, proportion: { type: 'number' } },
              required: ['hex', 'name', 'proportion'],
            },
          },
          detectedItems: { type: 'array', items: { type: 'string' } },
          suggestedGarmentIds: { type: 'array', items: { type: 'string', enum: garmentIds } },
          styleId: enumWithNone(styleIds),
          eventId: enumWithNone(eventIds),
        },
        required: ['summary', 'dominantColors', 'detectedItems', 'suggestedGarmentIds', 'styleId', 'eventId'],
      },
      0.3
    );

    const dominantColors = (Array.isArray(parsed.dominantColors) ? parsed.dominantColors : [])
      .map((c: any) => ({
        hex: normalizeHex(c?.hex) ?? '',
        name: text(c?.name, 60),
        proportion: typeof c?.proportion === 'number' ? Math.min(1, Math.max(0, c.proportion)) : undefined,
      }))
      .filter((c: { hex: string }) => c.hex)
      .slice(0, 5);

    if (!dominantColors.length) return fallback;

    // Colour matches are computed deterministically from approved data, never invented by the model.
    const colorMatches = dominantColors
      .map((c: { hex: string; name?: string; proportion?: number }) => {
        const match = closestApprovedColor(c.hex);
        if (!match) return undefined;
        return {
          colorName: match.colorName,
          hex: match.colorHex,
          colorHex: match.colorHex,
          sourceHex: c.hex,
          confidence: Math.max(0, Math.min(1, 1 - match.distance / 60)),
          garmentId: match.garmentId,
          garmentName: match.garmentName,
        };
      })
      .filter(Boolean);

    const suggested = [...new Set([
      ...strings(parsed.suggestedGarmentIds, 3).filter((id) => garmentIds.includes(id)),
      ...colorMatches.map((m: any) => m.garmentId as string),
    ])].slice(0, 3);

    return {
      summary: text(parsed.summary, 400) ?? 'Đã đọc bảng màu từ ảnh của bạn.',
      dominantColors,
      detectedItems: strings(parsed.detectedItems, 6, 80),
      colorMatches: colorMatches as GeminiVisionResponse['colorMatches'],
      suggestedGarmentIds: suggested.length ? suggested : fallback.suggestedGarmentIds,
      styleId: pick(parsed.styleId, styleIds) ?? fallback.styleId,
      eventId: pick(parsed.eventId, eventIds) ?? fallback.eventId,
      usedFallback: false,
    };
  } catch (error) {
    console.warn('Gemini vision failed, using fallback.', (error as Error).message);
    return fallback;
  }
}

/* ------------------------------------------------------------------ */
/* Render                                                              */
/* ------------------------------------------------------------------ */

const escapeXml = (value: string) =>
  value.replace(/[<>&'"]/g, (ch) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[ch] as string);

function buildRenderChecklist(garment: ReturnType<typeof getGarmentById>): string[] {
  const items = [
    ...(garment?.nonNegotiables ?? []),
    ...(garment?.characteristics ?? []).slice(0, 2),
  ].filter(Boolean);
  return items.length
    ? items.slice(0, 6)
    : [
        'Bảo lưu quy thức vạt hữu nhậm khép sang bên phải',
        'Đúng kết cấu cổ lập lĩnh và thân con che kín',
        'Màu sắc và phụ kiện tương thích điển lệ',
      ];
}

/**
 * Render outfit illustration with the Gemini image model, falling back to a vector stand-in.
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
  const garment = getGarmentById(request.garmentId) ?? getGarments()[0];
  const garmentName = garment?.name ?? 'Áo Ngũ Thân';
  const primaryColor = normalizeHex(request.primaryColor) ?? '#1E2A38';
  const pantColor = normalizeHex(request.pantColor) ?? '#F4F0E8';
  const skinTone = normalizeHex(request.skinTone) ?? '#F5D6C6';
  const checklist = buildRenderChecklist(garment);

  const accessories = (request.accessoryIds ?? [])
    .map((id) => getApprovedAccessories().find((a) => a.id === id))
    .filter((a): a is NonNullable<typeof a> => Boolean(a));
  const event = request.eventId ? getEventById(request.eventId) : undefined;
  const style = STYLE_CHOICES.find((s) => s.id === request.styleId);
  const character = request.characterId ? getCharacterById(request.characterId) : undefined;
  const needs = getAdaptiveNeeds().filter((n) => (request.adaptiveNeedCodes ?? []).includes(n.code));
  const seated = character?.heightCategory === 'SEATED' || needs.some((n) => n.code === ('WHEELCHAIR_SEATED' as FunctionalNeedCode));

  const prompt = [
    `Tranh minh họa thời trang biên tập (editorial fashion illustration), phong cách màu nước tinh tế, nền cảnh ${event?.name ?? 'studio tối giản tông kem'}, khung dọc 3:4, toàn thân.`,
    `Nhân vật mặc ${garmentName} (${garment?.vietnameseTitle ?? ''}) — Việt phục, KHÔNG phải trang phục Trung Hoa, Hàn Quốc hay Nhật Bản.`,
    `Màu áo chủ đạo ${primaryColor}; quần ${pantColor}.`,
    garment?.characteristics?.length ? `Đặc trưng kết cấu bắt buộc: ${garment.characteristics.join('; ')}.` : '',
    garment?.nonNegotiables?.length ? `Quy tắc tuyệt đối không được sai: ${garment.nonNegotiables.join('; ')}.` : 'Vạt áo khép sang phải (hữu nhậm).',
    accessories.length ? `Phụ kiện: ${accessories.map((a) => a.name).join(', ')}.` : 'Không thêm phụ kiện ngoài danh sách.',
    style ? `Tinh thần phối: ${style.label} — ${style.description}` : '',
    character ? `Người mẫu: ${character.bodyRepresentation}; tư thế: ${character.description}.` : '',
    `Tông da tham chiếu ${skinTone}.`,
    seated ? 'Người mẫu ngồi xe lăn tự tin, tà áo được may ngắn gọn không chạm bánh xe, thể hiện tôn trọng và tự nhiên.' : '',
    needs.length ? `Điều chỉnh may đo thích ứng: ${needs.map((n) => n.name).join(', ')}.` : '',
    request.referenceImage && request.consentToUseReference
      ? 'Dùng ảnh tham chiếu đính kèm làm người mẫu (giữ nét mặt, dáng người); chỉ thay trang phục theo mô tả trên.'
      : 'Nhân vật hư cấu, không giống người thật nổi tiếng.',
    'Không chèn chữ, logo hay watermark vào ảnh.',
  ].filter(Boolean).join('\n');

  const svgFallback = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800" width="600" height="800">
    <defs>
      <radialGradient id="bgG" cx="50%" cy="40%" r="60%">
        <stop offset="0%" stop-color="#FAF6F0"/>
        <stop offset="100%" stop-color="#EAE0D2"/>
      </radialGradient>
      <linearGradient id="garmG" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${primaryColor}"/>
        <stop offset="100%" stop-color="#120D0B"/>
      </linearGradient>
    </defs>
    <rect width="600" height="800" fill="url(#bgG)"/>
    <circle cx="300" cy="400" r="260" fill="none" stroke="#D6A75B" stroke-width="1.5" stroke-dasharray="6 4" opacity="0.4"/>
    <g transform="translate(150, 100)">
      <ellipse cx="150" cy="90" rx="36" ry="46" fill="${skinTone}"/>
      <path d="M110 80 Q150 40 190 80 L185 95 Q150 70 115 95 Z" fill="#1C1C1E"/>
      <path d="M120 130 Q150 140 180 130 L230 460 Q150 480 70 460 Z" fill="url(#garmG)" stroke="#1F1B18" stroke-width="2"/>
      <path d="M135 135 Q175 190 195 240 L195 465" fill="none" stroke="#FAF6F0" stroke-width="2" stroke-opacity="0.6"/>
      <rect x="110" y="270" width="80" height="12" rx="4" fill="#D6A75B"/>
      <rect x="115" y="460" width="30" height="90" fill="${pantColor}"/>
      <rect x="155" y="460" width="30" height="90" fill="${pantColor}"/>
    </g>
    <text x="300" y="730" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="22" font-weight="bold" fill="#1F1B18">${escapeXml(garmentName)}</text>
    <text x="300" y="760" text-anchor="middle" font-family="Be Vietnam Pro, Arial, sans-serif" font-size="13" fill="#736960">Vstyle · AI Arena Vietnam 2026</text>
  </svg>`;

  const fallbackResult: GeminiRenderResponse = {
    imageDataUrl: `data:image/svg+xml;utf8,${encodeURIComponent(svgFallback)}`,
    model: 'vstyle-vector-engine',
    checklist,
    usedFallback: true,
    prompt,
  };

  if (!config.imageProvider) return fallbackResult;

  const parts: any[] = [];
  if (request.referenceImage?.data && request.consentToUseReference) {
    parts.push({ inlineData: { mimeType: request.referenceImage.mimeType || 'image/jpeg', data: request.referenceImage.data } });
  }
  parts.push({ text: prompt });

  const res = await config.imageProvider.generateContent({
    model: config.imageModel,
    contents: [{ role: 'user', parts }],
    config: {
      responseModalities: ['TEXT', 'IMAGE'],
      imageConfig: { aspectRatio: '3:4' },
    },
  });

  const outParts: any[] = res?.candidates?.[0]?.content?.parts ?? [];
  const imagePart = outParts.find((part) => part?.inlineData?.data);
  if (!imagePart) {
    const reason = res?.candidates?.[0]?.finishReason ?? res?.promptFeedback?.blockReason;
    throw new Error(
      reason && reason !== 'STOP'
        ? `Gemini không tạo được ảnh (${reason}). Hãy thử lại hoặc bỏ ảnh tham chiếu.`
        : 'Gemini không trả về ảnh. Hãy thử lại sau ít phút.'
    );
  }

  return {
    imageDataUrl: `data:${imagePart.inlineData.mimeType || 'image/png'};base64,${imagePart.inlineData.data}`,
    model: res?.modelVersion ?? config.imageModel,
    checklist,
    usedFallback: false,
    prompt,
  };
}

/* ------------------------------------------------------------------ */
/* Adaptive tailoring advice                                           */
/* ------------------------------------------------------------------ */

const clampNumber = (value: unknown, min: number, max: number): number => {
  const n = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  return Math.min(max, Math.max(min, Math.round(n)));
};

export function sanitizeAdjustments(raw: any): AdaptiveAdjustments {
  const closures: ClosureType[] = ['MAGNETIC', 'VELCRO', 'ZIPPER', 'BUTTON'];
  return {
    frontHemReduction: clampNumber(raw?.frontHemReduction, 0, 30),
    slitPosition: clampNumber(raw?.slitPosition, 0, 25),
    sleeveLength: clampNumber(raw?.sleeveLength, -15, 10),
    sleeveWidth: clampNumber(raw?.sleeveWidth, 0, 15),
    openingWidth: clampNumber(raw?.openingWidth, 0, 15),
    closureType: pick(raw?.closureType, closures) ?? 'BUTTON',
  };
}

/**
 * Warm, practical explanation of an adaptive outfit. The adjustments and the culture
 * guardrail result are computed on the server and passed to Gemini as immutable facts.
 */
export async function adaptiveAdvice(
  request: { garmentId: string; needCodes: string[]; adjustments: unknown; eventId?: string },
  config: GeminiServiceConfig
): Promise<GeminiAdaptiveResponse> {
  const garment = getGarmentById(request.garmentId) ?? getApprovedGarments()[0];
  const needs = getAdaptiveNeeds().filter((n) => request.needCodes.includes(n.code));
  const adj = sanitizeAdjustments(request.adjustments);
  const guard = checkAdaptiveCulture(garment, adj, needs.length > 0);
  const event = request.eventId ? getEventById(request.eventId) : undefined;

  const changes = [
    adj.frontHemReduction ? `rút vạt trước ${adj.frontHemReduction} cm` : '',
    adj.slitPosition ? `nâng xẻ sườn ${adj.slitPosition} cm` : '',
    adj.sleeveWidth ? `nới ống tay ${adj.sleeveWidth} cm` : '',
    adj.sleeveLength ? `${adj.sleeveLength < 0 ? 'rút' : 'nối dài'} tay áo ${Math.abs(adj.sleeveLength)} cm` : '',
    adj.openingWidth ? `nới độ mở cổ/vạt ${adj.openingWidth} cm` : '',
    `đóng mở bằng ${CLOSURE_LABELS[adj.closureType].toLowerCase()}`,
  ].filter(Boolean);
  const kept = guard.items.filter((i) => i.level === 'KEEP').map((i) => i.title);
  const flagged = guard.items.filter((i) => i.level !== 'KEEP').map((i) => `${i.title}: ${i.detail}`);

  const fallback: GeminiAdaptiveResponse = {
    headline: !needs.length
      ? `${garment.name} phom chuẩn nguyên bản`
      : flagged.length
        ? `${garment.name} may theo cơ thể bạn — còn ${flagged.length} điểm nên chỉnh để giữ bản sắc`
        : `${garment.name} may theo cơ thể bạn — vẫn trọn bản sắc`,
    explanation: needs.length
      ? `Với nhu cầu ${needs.map((n) => n.name.toLowerCase()).join(', ')}, bản rập ${changes.join(', ')}. ${kept.length ? `Những điểm bản sắc được giữ: ${kept.join('; ')}.` : ''}${flagged.length ? ` Cần cân nhắc: ${flagged.length} điểm (xem thẻ Bản sắc).` : ''}`
      : 'Chưa chọn nhu cầu thích ứng nào — áo giữ đúng tỷ lệ truyền thống.',
    confidenceTips: needs.flatMap((n) => presetFor(n.code)?.dressingSteps.slice(0, 1) ?? []).slice(0, 3),
    tailorQuestions: [
      'Có thể đặt nẹp nam châm/khóa giấu dưới vạt phải mà vẫn giữ cúc trang trí không?',
      'Vải lót nào mềm nhất cho vùng tiếp xúc nhiều (lưng, đùi, nách)?',
      'Có cần một buổi thử áo ở tư thế ngồi/thực tế sử dụng trước khi hoàn thiện?',
    ],
    usedFallback: true,
  };

  if (!config.provider) return fallback;

  try {
    const parsed = await generateJson(
      config,
      [{
        text: `Viết lời giải thích cho bản may đo Việt phục thích ứng (adaptive fashion). Giọng ấm áp, tôn trọng, trao quyền; không thương hại, không dùng từ ngữ y khoa nặng nề, không chẩn đoán.
Y phục: ${garment.name}
Dịp: ${event?.name ?? 'không nêu'}
Nhu cầu người dùng TỰ CHỌN: ${needs.map((n) => `${n.name} — ${n.description}`).join(' | ') || 'không có'}
Điều chỉnh rập (sự thật bất biến): ${changes.join('; ')}
Đặc trưng văn hóa được giữ (bất biến): ${kept.join('; ') || 'không có'}
Điểm cần cân nhắc (bất biến): ${flagged.join(' | ') || 'không có'}
Quy tắc không được sai của y phục: ${garment.nonNegotiables.join('; ')}

Trả về: headline (dưới 14 từ); explanation 3–4 câu nói rõ mỗi điều chỉnh giúp gì cho trải nghiệm mặc và vì sao bản sắc vẫn được giữ; confidenceTips 2–3 mẹo để tự tin, tự chủ khi mặc dự sự kiện; tailorQuestions 2–3 câu hỏi nên hỏi thợ may.`,
      }],
      {
        type: 'object',
        properties: {
          headline: { type: 'string' },
          explanation: { type: 'string' },
          confidenceTips: { type: 'array', items: { type: 'string' } },
          tailorQuestions: { type: 'array', items: { type: 'string' } },
        },
        required: ['headline', 'explanation', 'confidenceTips', 'tailorQuestions'],
      }
    );
    const tips = strings(parsed.confidenceTips, 3, 240);
    const questions = strings(parsed.tailorQuestions, 3, 240);
    return {
      headline: text(parsed.headline, 140) ?? fallback.headline,
      explanation: text(parsed.explanation, 1200) ?? fallback.explanation,
      confidenceTips: tips.length ? tips : fallback.confidenceTips,
      tailorQuestions: questions.length ? questions : fallback.tailorQuestions,
      usedFallback: false,
    };
  } catch (error) {
    console.warn('Gemini adaptive advice failed, using fallback.', (error as Error).message);
    return fallback;
  }
}
