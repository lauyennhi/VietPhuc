/**
 * Deterministic outfit designer.
 * Turns a free-text brief ("chụp kỷ yếu, muốn hiện đại trẻ trung nhưng không mất chất")
 * into a complete outfit built only from approved data, plus the reasons behind each choice.
 * Used as the Gemini fallback on the server and by the Studio quick quiz on the client.
 */

import {
  getAccessoryById,
  getApprovedAccessories,
  getApprovedGarments,
  getEventById,
  getGarmentById,
} from '../dal';
import { STYLE_CHOICES } from '../styles';
import type { Accessory, FunctionalNeedCode, Garment, StyleTag } from '../../types/domain';
import type { OutfitDesign } from '../../types/gemini';

/* ------------------------------------------------------------------ */
/* Vocabulary                                                          */
/* ------------------------------------------------------------------ */

export const COLOR_WORDS: Array<{ words: string[]; hex: string; name: string; meaning: string }> = [
  { words: ['đỏ đô', 'đỏ rượu', 'đỏ mận'], hex: '#7A1C24', name: 'Đỏ đô', meaning: 'trầm ấm, sang trọng' },
  { words: ['đỏ son', 'đỏ tươi', 'đỏ'], hex: '#A92228', name: 'Đỏ son', meaning: 'may mắn, hỷ sự' },
  { words: ['hồng pastel', 'hồng phấn', 'hồng nhạt'], hex: '#E8B4BC', name: 'Hồng phấn', meaning: 'dịu dàng, trẻ trung' },
  { words: ['hồng đào', 'cam đào'], hex: '#E89A8C', name: 'Hồng đào', meaning: 'tươi tắn, rạng rỡ' },
  { words: ['hồng'], hex: '#C95A72', name: 'Hồng sen', meaning: 'nữ tính, dịu dàng' },
  { words: ['cam'], hex: '#D9733B', name: 'Cam đất', meaning: 'năng động, ấm áp' },
  { words: ['vàng nghệ', 'vàng mù tạt', 'vàng đồng'], hex: '#C8963E', name: 'Vàng nghệ', meaning: 'ấm áp, cổ điển' },
  { words: ['vàng'], hex: '#D4A338', name: 'Vàng hoàng thổ', meaning: 'sung túc, trang trọng' },
  { words: ['xanh navy', 'xanh than', 'xanh đen', 'xanh chàm', 'chàm'], hex: '#1E2A38', name: 'Xanh chàm', meaning: 'điềm tĩnh, học thức' },
  { words: ['xanh pastel', 'xanh baby', 'xanh nhạt', 'xanh da trời'], hex: '#A9C4D8', name: 'Xanh pastel', meaning: 'nhẹ nhàng, tươi mát' },
  { words: ['xanh ngọc', 'xanh mint', 'xanh bạc hà'], hex: '#5FA59A', name: 'Xanh ngọc', meaning: 'tươi mát, hiện đại' },
  { words: ['xanh rêu', 'xanh olive'], hex: '#3D5A45', name: 'Xanh rêu', meaning: 'trầm tĩnh, gần thiên nhiên' },
  { words: ['xanh lá', 'xanh cốm', 'xanh lục'], hex: '#4D6B53', name: 'Xanh lá', meaning: 'tươi trẻ, sinh sôi' },
  { words: ['xanh dương', 'xanh lam', 'xanh biển', 'xanh'], hex: '#2B5C8F', name: 'Xanh lam', meaning: 'thanh lịch, tin cậy' },
  { words: ['tím than'], hex: '#4C2B4E', name: 'Tím than', meaning: 'hoài cổ, chung thủy' },
  { words: ['tím pastel', 'tím lavender', 'tím nhạt'], hex: '#B9A6D0', name: 'Tím lavender', meaning: 'mơ mộng, nhẹ nhàng' },
  { words: ['tím'], hex: '#53335A', name: 'Tím mộng mơ', meaning: 'chung thủy, hoài cổ' },
  { words: ['nâu'], hex: '#6C4B35', name: 'Nâu đất', meaning: 'mộc mạc, dân gian' },
  { words: ['kem', 'màu be', ' be ', 'be nhạt', 'nude'], hex: '#EBE5D8', name: 'Kem', meaning: 'nhã nhặn, tối giản' },
  { words: ['trắng'], hex: '#F4F0E8', name: 'Trắng ngà', meaning: 'tinh khôi, trong trẻo' },
  { words: ['đen'], hex: '#1C1C1E', name: 'Đen tuyền', meaning: 'trang nghiêm, cá tính' },
  { words: ['xám', 'ghi'], hex: '#616870', name: 'Xám tro', meaning: 'hiện đại, tối giản' },
];

const STYLE_WORDS: Record<string, string[]> = {
  REMIX_GEN_Z: ['hiện đại', 'trẻ trung', 'gen z', 'genz', 'cá tính', 'cách tân', 'phá cách', 'cool', 'ngầu', 'street', 'remix', 'trendy', 'mới lạ'],
  TOI_GIAN: ['tối giản', 'đơn giản', 'nhẹ nhàng', 'thanh lịch', 'basic', 'tinh tế', 'nhã nhặn', 'kín đáo'],
  TRUYEN_THONG_HOANG_GIA: ['sang trọng', 'quý phái', 'hoàng gia', 'cung đình', 'trang trọng', 'lộng lẫy', 'quyền quý', 'điển chế'],
  DAN_GIAN_MOC_MAC: ['dân gian', 'mộc mạc', 'làng quê', 'quê', 'giản dị', 'quan họ', 'bình dị'],
  CO_DIEN_HOAI_CO: ['cổ điển', 'hoài cổ', 'vintage', 'xưa', 'retro', 'cổ trang', 'thơ mộng'],
  NANG_DONG_DAO_PHO: ['năng động', 'dạo phố', 'thoải mái', 'dễ di chuyển', 'đi chơi', 'thể thao', 'du lịch', 'cafe', 'check-in'],
};
const KEEP_IDENTITY_WORDS = ['không mất chất', 'giữ chất', 'giữ bản sắc', 'vẫn truyền thống', 'vẫn đúng', 'nhưng vẫn', 'không lố', 'không quá', 'chuẩn', 'đúng điển'];

const EVENT_WORDS: Array<[string, string[]]> = [
  ['EVENT_YEARBOOK', ['kỷ yếu', 'ky yeu', 'chụp ảnh lớp', 'lưu niệm']],
  ['EVENT_GRADUATION', ['tốt nghiệp', 'ra trường', 'nhận bằng', 'bảo vệ']],
  ['EVENT_WEDDING', ['đám cưới', 'cưới', 'hỷ', 'ăn hỏi', 'dạm ngõ', 'đính hôn']],
  ['EVENT_TET', ['tết', 'du xuân', 'đầu năm', 'chúc tết', 'đi chùa', 'lễ chùa']],
  ['EVENT_FESTIVAL', ['lễ hội', 'hội làng', 'hội lim', 'festival', 'trung thu']],
  ['EVENT_CONCERT', ['hòa nhạc', 'concert', 'đêm nhạc', 'nhạc hội', 'biểu diễn', 'sân khấu']],
  ['EVENT_CULTURAL', ['triển lãm', 'bảo tàng', 'di sản', 'sự kiện văn hóa', 'hội thảo', 'văn miếu']],
  ['EVENT_CASUAL', ['dạo phố', 'đi chơi', 'cafe', 'cà phê', 'du lịch', 'check-in', 'checkin', 'chụp ảnh', 'phố cổ', 'hội an']],
];

const WEATHER_WORDS: Array<[string, string[]]> = [
  ['WEATHER_HUMID_RAIN', ['mưa', 'nồm', 'ẩm']],
  ['WEATHER_COOL', ['lạnh', 'rét', 'gió mùa', 'mùa đông', 'se lạnh']],
  ['WEATHER_HOT', ['nắng', 'nóng', 'mùa hè', 'oi']],
  ['WEATHER_PLEASANT', ['mát', 'mùa thu', 'dễ chịu', 'mùa xuân']],
];

const GARMENT_WORDS: Array<[string, string[]]> = [
  ['garment-ao-dai-ngu-than-remix', ['tân thời', 'ngũ thân cách tân', 'áo dài cách tân', 'cách tân']],
  ['garment-ao-tu-than', ['tứ thân']],
  ['garment-ao-tac', ['áo tấc', 'tấc', 'áo thụng']],
  ['garment-ao-nhat-binh', ['nhật bình']],
  ['garment-ao-giao-linh', ['giao lĩnh', 'giao linh']],
  ['garment-ao-doi-kham', ['đối khâm', 'doi kham']],
  ['garment-ngu-than-tay-chen', ['ngũ thân', 'tay chẽn']],
  ['garment-ao-dai-truyen-thong', ['áo dài']],
];

const PLACES = ['Hội An', 'Huế', 'Hà Nội', 'Sài Gòn', 'Đà Lạt', 'Văn Miếu', 'Hồ Gươm', 'Phố cổ', 'Ninh Bình', 'Đà Nẵng', 'Hoàng thành', 'chùa', 'trường'];

const NEED_WORDS: Array<[FunctionalNeedCode, string[]]> = [
  ['WHEELCHAIR_SEATED', ['xe lăn', 'ngồi xe']],
  ['ONE_HANDED', ['một tay', '1 tay', 'mất tay', 'cụt tay', 'liệt nửa', 'tay giả']],
  ['LIMITED_HAND_MOBILITY', ['khó cài', 'run tay', 'khớp ngón', 'yếu tay']],
  ['LIMITED_MOBILITY', ['khó giơ tay', 'đau vai', 'cứng vai']],
  ['MATERIAL_SENSITIVITY', ['da nhạy cảm', 'dị ứng', 'chàm', 'ngứa']],
  ['LIMITED_STANDING', ['đứng lâu', 'mỏi chân', 'chống nạng', 'gậy']],
];

const EVENT_TIPS: Record<string, string> = {
  EVENT_YEARBOOK: 'Mang kim băng hoặc băng dính hai mặt để cố định tà khi chụp ảnh nhảy, tạo dáng.',
  EVENT_GRADUATION: 'Áo cử nhân khoác ngoài nên chọn áo bên trong gọn vai; mang móc treo để giữ áo phẳng.',
  EVENT_WEDDING: 'Tránh trùng màu với cô dâu chú rể; mang túi nhỏ đựng phong bì mừng.',
  EVENT_TET: 'Mang túi nhỏ đựng lì xì; đi chùa nên chọn giày dễ tháo.',
  EVENT_FESTIVAL: 'Chọn giày đế bằng vì lễ hội đông và phải đi bộ nhiều.',
  EVENT_CONCERT: 'Chọn chất liệu ít nhăn khi ngồi lâu; phụ kiện kim loại nhỏ bắt ánh đèn sân khấu đẹp.',
  EVENT_CULTURAL: 'Không gian di sản: giữ trang phục kín đáo, tránh phụ kiện quá phô trương.',
  EVENT_CASUAL: 'Mang túi đeo chéo nhỏ để rảnh tay khi chụp ảnh, check-in.',
};

const WEATHER_TIPS: Record<string, string> = {
  WEATHER_HOT: 'Trời nắng: ưu tiên lụa, đũi mỏng; mang quạt hoặc ô nhỏ và kem chống nắng.',
  WEATHER_HUMID_RAIN: 'Trời mưa: mang áo mưa trong suốt, giày chống trơn; kẹp tà gọn khi di chuyển.',
  WEATHER_COOL: 'Trời lạnh: mặc áo giữ nhiệt mỏng bên trong, khoác khăn choàng tối màu bên ngoài.',
  WEATHER_PLEASANT: 'Thời tiết dễ chịu: có thể chọn gấm hoặc lụa dày hơn để lên ảnh có độ rủ đẹp.',
};

const STYLE_ACCESSORY_PREFS: Record<string, string[]> = {
  REMIX_GEN_Z: ['acc-sneaker-retro', 'acc-tui-coi', 'acc-kinh-ram', 'acc-tui-da', 'acc-that-lung-da'],
  NANG_DONG_DAO_PHO: ['acc-sneaker-retro', 'acc-tui-da', 'acc-kinh-ram', 'acc-tui-coi'],
  TOI_GIAN: ['acc-the-bai', 'acc-tui-coi', 'acc-tram-cai-toc', 'acc-kieng-bac'],
  TRUYEN_THONG_HOANG_GIA: ['acc-khan-dong', 'acc-man-nu', 'acc-kieng-bac', 'acc-hai-sen', 'acc-chuoi-ngoc', 'acc-the-bai'],
  DAN_GIAN_MOC_MAC: ['acc-khan-mo-qua', 'acc-non-quai-thao', 'acc-yem-co-truyen', 'acc-that-lung-lua', 'acc-guoc-moc'],
  CO_DIEN_HOAI_CO: ['acc-tram-cai-toc', 'acc-quat-tram-huong', 'acc-chuoi-ngoc', 'acc-quat-xep-giay-do', 'acc-guoc-moc'],
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function hexToLab(hex: string): [number, number, number] {
  const n = Number.parseInt(hex.slice(1), 16);
  const lin = (c: number) => {
    const v = c / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  const r = lin((n >> 16) & 255);
  const g = lin((n >> 8) & 255);
  const b = lin(n & 255);
  const x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
  const y = r * 0.2126 + g * 0.7152 + b * 0.0722;
  const z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
}

export function colorDistance(a: string, b: string): number {
  const [l1, a1, b1] = hexToLab(a);
  const [l2, a2, b2] = hexToLab(b);
  return Math.hypot(l1 - l2, a1 - a2, b1 - b2);
}

const isDark = (hex: string) => hexToLab(hex)[0] < 45;

export function colorNameFor(hex: string, garment?: Garment): string {
  const base = garment?.baseColors.find((c) => c.hex.toLowerCase() === hex.toLowerCase());
  if (base) return base.name;
  let best = COLOR_WORDS[0];
  let bestD = Infinity;
  for (const c of COLOR_WORDS) {
    const d = colorDistance(hex, c.hex);
    if (d < bestD) {
      bestD = d;
      best = c;
    }
  }
  return best.name;
}

function colorMeaning(hex: string): string {
  let best = COLOR_WORDS[0];
  let bestD = Infinity;
  for (const c of COLOR_WORDS) {
    const d = colorDistance(hex, c.hex);
    if (d < bestD) {
      bestD = d;
      best = c;
    }
  }
  return best.meaning;
}

const STYLE_TAG_BY_ID: Record<string, StyleTag> = Object.fromEntries(STYLE_CHOICES.map((s) => [s.id, s.tag]));
const styleLabel = (id: string) => STYLE_CHOICES.find((s) => s.id === id)?.label ?? id;
const shortName = (g: Garment) => g.name.replace(/\s*\(.*\)$/, '');
const firstSentence = (text: string) => (text.match(/^[^.!?]+[.!?]/)?.[0] ?? text).trim();

export function isAccessoryAllowedFor(accessory: Accessory, garment: Garment, eventId: string): boolean {
  return garment.compatibleAccessoryIds.includes(accessory.id) &&
    accessory.compatibleGarmentIds.includes(garment.id) &&
    (!accessory.compatibleEventIds.length || accessory.compatibleEventIds.includes(eventId));
}

/* ------------------------------------------------------------------ */
/* Brief parsing                                                       */
/* ------------------------------------------------------------------ */

export interface DesignBrief {
  text?: string;
  eventId?: string;
  weatherId?: string;
  styleId?: string;
  colorHex?: string;
  garmentId?: string;
  accessoryIds?: string[];
  needCodes?: FunctionalNeedCode[];
  keepIdentity?: boolean;
  photoColors?: string[];
}

export interface ParsedBrief extends Required<Pick<DesignBrief, 'accessoryIds' | 'needCodes'>> {
  eventId?: string;
  weatherId?: string;
  styleId?: string;
  styleScores: Record<string, number>;
  colorHex?: string;
  colorWord?: string;
  garmentId?: string;
  garmentWord?: string;
  keepIdentity: boolean;
  location?: string;
  gender?: 'MALE' | 'FEMALE';
  cues: Array<{ kind: 'event' | 'style' | 'color' | 'garment' | 'weather' | 'need' | 'identity' | 'place' | 'accessory'; word: string }>;
}

export function parseBrief(brief: DesignBrief): ParsedBrief {
  const raw = ` ${(brief.text ?? '').toLowerCase().replace(/\s+/g, ' ')} `;
  const cues: ParsedBrief['cues'] = [];
  const has = (w: string) => raw.includes(w);

  let eventId = brief.eventId;
  if (!eventId) {
    for (const [id, words] of EVENT_WORDS) {
      const w = words.find(has);
      if (w) {
        eventId = id;
        cues.push({ kind: 'event', word: w });
        break;
      }
    }
  }

  let weatherId = brief.weatherId;
  if (!weatherId) {
    for (const [id, words] of WEATHER_WORDS) {
      const w = words.find(has);
      if (w) {
        weatherId = id;
        cues.push({ kind: 'weather', word: w });
        break;
      }
    }
  }

  const styleScores: Record<string, number> = {};
  for (const [id, words] of Object.entries(STYLE_WORDS)) {
    const hits = words.filter(has);
    if (hits.length) {
      styleScores[id] = hits.length;
      hits.slice(0, 2).forEach((w) => cues.push({ kind: 'style', word: w }));
    }
  }
  const styleId = brief.styleId ?? Object.entries(styleScores).sort((a, b) => b[1] - a[1])[0]?.[0];

  const identityWord = KEEP_IDENTITY_WORDS.find(has);
  if (identityWord) cues.push({ kind: 'identity', word: identityWord });

  let colorHex = brief.colorHex;
  let colorWord: string | undefined;
  if (!colorHex) {
    for (const c of COLOR_WORDS) {
      const w = c.words.find((word) => has(word));
      if (w) {
        colorHex = c.hex;
        colorWord = w.trim();
        cues.push({ kind: 'color', word: colorWord });
        break;
      }
    }
  }
  if (!colorHex && brief.photoColors?.length) colorHex = brief.photoColors[0];

  let garmentId = brief.garmentId;
  let garmentWord: string | undefined;
  if (!garmentId) {
    for (const [id, words] of GARMENT_WORDS) {
      const w = words.find(has);
      if (w) {
        garmentId = id;
        garmentWord = w;
        cues.push({ kind: 'garment', word: w });
        break;
      }
    }
  }
  // "áo dài" + modern wording → the modern ngũ thân remix rather than the formal áo dài.
  if (garmentId === 'garment-ao-dai-truyen-thong' && styleId === 'REMIX_GEN_Z') garmentId = 'garment-ao-dai-ngu-than-remix';

  const accessoryIds = [...(brief.accessoryIds ?? [])];
  for (const acc of getApprovedAccessories()) {
    const key = acc.name.split('(')[0].trim().toLowerCase();
    const short = key.split(' ').slice(0, 2).join(' ');
    if ((has(key) || (short.length > 4 && has(short))) && !accessoryIds.includes(acc.id)) {
      accessoryIds.push(acc.id);
      cues.push({ kind: 'accessory', word: short });
    }
  }

  const needCodes = [...(brief.needCodes ?? [])];
  for (const [code, words] of NEED_WORDS) {
    const w = words.find(has);
    if (w && !needCodes.includes(code)) {
      needCodes.push(code);
      cues.push({ kind: 'need', word: w });
    }
  }

  const location = PLACES.find((p) => has(p.toLowerCase()));
  if (location) cues.push({ kind: 'place', word: location });
  const gender = /\b(nam|con trai|anh ấy|chàng)\b/.test(raw) ? 'MALE' : /\b(nữ|con gái|cô ấy|nàng)\b/.test(raw) ? 'FEMALE' : undefined;

  return {
    eventId,
    weatherId,
    styleId,
    styleScores,
    colorHex,
    colorWord,
    garmentId,
    garmentWord,
    accessoryIds,
    needCodes,
    keepIdentity: Boolean(brief.keepIdentity || identityWord),
    location,
    gender,
    cues,
  };
}

/* ------------------------------------------------------------------ */
/* Design                                                              */
/* ------------------------------------------------------------------ */

function scoreGarment(g: Garment, p: ParsedBrief, eventId: string, styleId: string): number {
  let score = 0;
  if (p.garmentId === g.id) score += 200;
  const tag = STYLE_TAG_BY_ID[styleId];
  if (tag && g.styleTags.includes(tag)) score += 40;
  if (styleId === 'REMIX_GEN_Z' && (g.styleTags.includes('NANG_DONG' as StyleTag) || g.styleTags.includes('HOA_NHAP' as StyleTag))) score += 12;
  if (styleId === 'NANG_DONG_DAO_PHO' && g.styleTags.includes('REMIX_GEN_Z' as StyleTag)) score += 15;
  if (g.occasions.includes(eventId)) score += 25;
  const event = getEventById(eventId);
  if (event?.recommendedStyleTags.some((t) => g.styleTags.includes(t))) score += 8;
  if (p.keepIdentity && (g.styleTags.includes('TRUYEN_THONG' as StyleTag) || g.styleTags.includes('THANH_LICH' as StyleTag))) score += 10;
  if (p.colorHex) {
    const best = Math.min(...g.baseColors.map((c) => colorDistance(c.hex, p.colorHex!)));
    if (best < 18) score += 12;
  }
  if (event?.formality === 'HIGH_FORMAL' && g.formalityLevel === 'CASUAL_SMART') score -= 20;
  if (p.needCodes.includes('WHEELCHAIR_SEATED') && ['garment-ao-nhat-binh', 'garment-ao-tac'].includes(g.id)) score -= 6;
  return score;
}

function pickColor(g: Garment, p: ParsedBrief, eventId: string): string {
  if (p.colorHex) {
    const nearest = [...g.baseColors].sort((a, b) => colorDistance(a.hex, p.colorHex!) - colorDistance(b.hex, p.colorHex!))[0];
    // Keep the user's exact colour when the garment has nothing close (custom fabric).
    return nearest && colorDistance(nearest.hex, p.colorHex) < 14 ? nearest.hex : p.colorHex.toUpperCase();
  }
  if (eventId === 'EVENT_TET' || eventId === 'EVENT_WEDDING') {
    const warm = g.baseColors.find((c) => /đỏ|son|điều|vàng|hồng/i.test(c.name));
    if (warm) return warm.hex;
  }
  return g.baseColors[0].hex;
}

function pickPant(g: Garment, primary: string, styleId: string): string {
  if (g.svgTemplate === 'AO_TU_THAN') return '#2A211C';
  if (styleId === 'REMIX_GEN_Z' || styleId === 'NANG_DONG_DAO_PHO') return isDark(primary) ? '#EBE5D8' : '#1C1C1E';
  return '#F4F0E8';
}

function pickAccessories(g: Garment, p: ParsedBrief, eventId: string, styleId: string, weatherId: string): Accessory[] {
  const allowed = getApprovedAccessories().filter((a) => isAccessoryAllowedFor(a, g, eventId));
  const prefs = STYLE_ACCESSORY_PREFS[styleId] ?? [];
  const tag = STYLE_TAG_BY_ID[styleId];
  const scored = allowed.map((a) => {
    let s = 0;
    if (p.accessoryIds.includes(a.id)) s += 100;
    const rank = prefs.indexOf(a.id);
    if (rank >= 0) s += 30 - rank * 3;
    if (tag && a.styleTags.includes(tag)) s += 10;
    if (weatherId === 'WEATHER_HOT' && (a.type === 'HANDHELD' || a.id === 'acc-kinh-ram')) s += 6;
    if (g.id === 'garment-ao-tac' && a.type === 'HEADWEAR' && a.id !== 'acc-kinh-ram') s += 40; // áo tấc requires khăn vấn/mấn
    if (g.svgTemplate === 'AO_TU_THAN' && a.id === 'acc-yem-co-truyen') s += 40;
    return { a, s };
  }).filter((x) => x.s > 0).sort((x, y) => y.s - x.s);

  const picked: Accessory[] = [];
  const usedTypes = new Set<string>();
  for (const { a } of scored) {
    const slot = a.id === 'acc-kinh-ram' ? 'EYEWEAR' : a.type;
    if (usedTypes.has(slot)) continue;
    usedTypes.add(slot);
    picked.push(a);
    if (picked.length >= 3) break;
  }
  return picked;
}

function accessoryReason(a: Accessory, styleId: string, eventId: string): string {
  const purpose: Record<string, string> = {
    HEADWEAR: 'hoàn thiện phần đầu đúng quy thức và tạo điểm nhấn khi chụp ảnh',
    HAIR_ACCESSORY: 'giữ tóc gọn gàng, thêm nét thanh nhã',
    JEWELRY: 'tạo điểm sáng nơi cổ áo mà không lấn át trang phục',
    PENDANT: 'thêm chiều sâu cho vạt trước, gợi nét nho nhã',
    BELT_SASH: 'định hình eo và tạo nhịp điệu cho tà áo',
    HANDHELD: 'vừa làm đạo cụ tạo dáng vừa tiện khi trời nóng',
    FOOTWEAR: styleId === 'REMIX_GEN_Z' || styleId === 'NANG_DONG_DAO_PHO' ? 'đi lại thoải mái cả ngày, phá cách vừa đủ' : 'đồng bộ với tinh thần truyền thống',
    BAG: 'đựng đồ cá nhân, giữ tay rảnh khi tạo dáng',
  };
  const lead = a.id === 'acc-kinh-ram' ? 'chắn nắng và thêm chất Gen Z' : purpose[a.type] ?? 'hoàn thiện bản phối';
  return `${a.name.split('(')[0].trim()} — ${lead}${eventId === 'EVENT_CULTURAL' && a.type === 'JEWELRY' ? ', vẫn đủ trang nhã cho không gian di sản' : ''}.`;
}

export function designFromBrief(brief: DesignBrief): OutfitDesign {
  const p = parseBrief(brief);
  const eventId = p.eventId ?? 'EVENT_CASUAL';
  const weatherId = p.weatherId ?? 'WEATHER_PLEASANT';
  const styleId = p.styleId ?? (getEventById(eventId)?.recommendedStyleTags.includes('REMIX_GEN_Z' as StyleTag) ? 'REMIX_GEN_Z' : 'TOI_GIAN');
  const event = getEventById(eventId);

  const ranked = getApprovedGarments()
    .map((g) => ({ g, s: scoreGarment(g, p, eventId, styleId) }))
    .sort((a, b) => b.s - a.s);
  const garment = ranked[0].g;
  const primaryColor = pickColor(garment, p, eventId);
  const pantColor = pickPant(garment, primaryColor, styleId);
  const accessories = pickAccessories(garment, p, eventId, styleId, weatherId);
  const remix = styleId === 'REMIX_GEN_Z' ? (p.keepIdentity ? 50 : 75) : styleId === 'NANG_DONG_DAO_PHO' ? 55 : styleId === 'TOI_GIAN' ? 30 : 12;
  const colorName = colorNameFor(primaryColor, garment);
  const customColor = !garment.baseColors.some((c) => c.hex.toLowerCase() === primaryColor.toLowerCase());

  const matched: OutfitDesign['matched'] = [];
  // Group same-kind cues ("hiện đại", "trẻ trung") into a single line.
  const grouped = new Map<string, { kind: ParsedBrief['cues'][number]['kind']; words: string[] }>();
  for (const cue of p.cues) {
    const key = cue.kind === 'accessory' || cue.kind === 'need' ? `${cue.kind}:${cue.word}` : cue.kind;
    const entry = grouped.get(key) ?? { kind: cue.kind, words: [] };
    if (!entry.words.includes(cue.word)) entry.words.push(cue.word);
    grouped.set(key, entry);
  }
  for (const { kind, words } of grouped.values()) {
    const cue = { kind, word: words.join(', ') };
    const howMet: Record<string, string> = {
      event: `Chọn ${shortName(garment)} hợp dịp ${event?.name ?? 'của bạn'}.`,
      style: styleId === 'REMIX_GEN_Z'
        ? `Phom ${shortName(garment)} gọn, phối ${accessories.find((a) => a.type === 'FOOTWEAR')?.name.split('(')[0].trim().toLowerCase() ?? 'phụ kiện hiện đại'} để trẻ trung.`
        : `Theo tinh thần ${styleLabel(styleId)}.`,
      identity: 'Giữ nguyên kết cấu, vạt hữu nhậm và cổ áo; chỉ hiện đại hóa ở màu, phụ kiện và độ dài tà.',
      color: customColor ? `Dùng đúng màu ${colorName.toLowerCase()} bạn muốn (đặt may vải màu này).` : `Chọn màu ${colorName.toLowerCase()} gần nhất trong bảng màu của áo.`,
      garment: `Dùng ${shortName(garment)} như bạn yêu cầu.`,
      weather: WEATHER_TIPS[weatherId]?.split(':')[1]?.trim() ?? 'Đã tính đến thời tiết.',
      need: 'Đã thêm điều chỉnh may đo thích ứng — xem trong Adaptive Fashion.',
      place: `Màu sắc và phom dáng lên ảnh đẹp ở ${cue.word}.`,
      accessory: `Đã thêm ${cue.word} vào bản phối.`,
    };
    matched.push({ asked: cue.word, howMet: howMet[cue.kind] });
  }

  const whyThis = [
    firstSentence(garment.description),
    garment.occasions.includes(eventId) ? `Phù hợp ${event?.name ?? 'dịp này'}${event?.culturalAdvice ? ` — ${firstSentence(event.culturalAdvice).replace(/\.$/, '')}` : ''}.` : `Hợp tinh thần ${styleLabel(styleId)}.`,
    p.keepIdentity || styleId !== 'REMIX_GEN_Z'
      ? `Giữ trọn đặc trưng: ${garment.characteristics.slice(0, 2).join('; ').replace(/\.$/, '')}.`
      : `Đủ hiện đại để mặc hằng ngày nhưng vẫn giữ vạt hữu nhậm và phom ngũ thân.`,
  ];

  const alternatives = ranked.slice(1, 3).map(({ g }) => ({
    garmentId: g.id,
    primaryColor: pickColor(g, p, eventId),
    reason: `${shortName(g)} — ${g.styleTags.map((t) => STYLE_CHOICES.find((s) => s.tag === t)?.label.split('·')[0].trim()).filter(Boolean).slice(0, 2).join(', ').toLowerCase() || 'phương án khác'}.`,
  }));

  return {
    garmentId: garment.id,
    primaryColor,
    colorName,
    pantColor,
    accessoryIds: accessories.map((a) => a.id),
    eventId,
    weatherId,
    styleId,
    remixLevel: remix,
    characterId: p.needCodes.includes('WHEELCHAIR_SEATED') ? 'char-hoa-nhap-xe-lan' : p.gender === 'MALE' ? 'char-nam-nho-nha' : p.gender === 'FEMALE' ? 'char-nu-duyen-dang' : undefined,
    needCodes: p.needCodes,
    location: p.location,
    title: `${shortName(garment)} ${colorName.toLowerCase()} · ${styleLabel(styleId)}`,
    concept: `${shortName(garment)} màu ${colorName.toLowerCase()} (${colorMeaning(primaryColor)})${accessories.length ? ` phối ${accessories.map((a) => a.name.split('(')[0].trim().toLowerCase()).join(', ')}` : ''} — ${styleId === 'REMIX_GEN_Z' ? 'trẻ trung mà không mất chất Việt phục' : `đúng tinh thần ${styleLabel(styleId).toLowerCase()}`}.`,
    whyThis,
    colorStory: `${colorName} gợi cảm giác ${colorMeaning(primaryColor)}${customColor ? '; đây là màu đặt may theo ý bạn' : ''}. Quần ${colorNameFor(pantColor).toLowerCase()} giúp ${isDark(primaryColor) === isDark(pantColor) ? 'tổng thể liền mạch' : 'tạo tương phản rõ, lên ảnh nổi bật'}.`,
    accessoryNotes: accessories.map((a) => ({ id: a.id, reason: accessoryReason(a, styleId, eventId) })),
    packingTips: [WEATHER_TIPS[weatherId], EVENT_TIPS[eventId]].filter(Boolean),
    stylingTips: [
      styleId === 'REMIX_GEN_Z' ? 'Xắn nhẹ cổ tay áo, tạo dáng bước đi tự nhiên để tà áo bay.' : 'Giữ lưng thẳng, bước chậm để tà áo buông đều.',
      'Chụp ảnh ở góc nghiêng 45° để thấy rõ vạt hữu nhậm và hàng cúc.',
    ],
    avoid: garment.nonNegotiables.slice(0, 2),
    matched,
    alternatives,
    usedFallback: true,
  };
}

/** Validates a design proposed by Gemini against approved data, repairing what it can. */
export function validateDesign(candidate: Partial<OutfitDesign>, fallback: OutfitDesign): OutfitDesign | null {
  const garment = candidate.garmentId ? getGarmentById(candidate.garmentId) : undefined;
  if (!garment || garment.status !== 'APPROVED') return null;
  const eventId = candidate.eventId && getEventById(candidate.eventId) ? candidate.eventId : fallback.eventId;
  const hex = (v: unknown) => (typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v) ? v.toUpperCase() : undefined);
  const primaryColor = hex(candidate.primaryColor) ?? garment.baseColors[0].hex;
  const accessoryIds = (candidate.accessoryIds ?? []).filter((id, i, all) => {
    const acc = getAccessoryById(id);
    return acc && acc.status === 'APPROVED' && isAccessoryAllowedFor(acc, garment, eventId) && all.indexOf(id) === i;
  }).slice(0, 4);
  return {
    ...fallback,
    ...candidate,
    garmentId: garment.id,
    eventId,
    primaryColor,
    colorName: candidate.colorName || colorNameFor(primaryColor, garment),
    pantColor: hex(candidate.pantColor) ?? fallback.pantColor,
    accessoryIds,
    accessoryNotes: (candidate.accessoryNotes ?? []).filter((n) => accessoryIds.includes(n.id)),
    styleId: STYLE_CHOICES.some((s) => s.id === candidate.styleId) ? candidate.styleId! : fallback.styleId,
    weatherId: candidate.weatherId ?? fallback.weatherId,
    remixLevel: Math.max(0, Math.min(100, Math.round(candidate.remixLevel ?? fallback.remixLevel))),
    needCodes: fallback.needCodes,
    alternatives: (candidate.alternatives ?? fallback.alternatives).filter((a) => getGarmentById(a.garmentId)?.status === 'APPROVED').slice(0, 2),
    usedFallback: false,
  } as OutfitDesign;
}
