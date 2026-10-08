/**
 * Color Harmony calculation and cultural color advice for Vstyle
 */

export interface HarmonyNote {
  tone: 'good' | 'info' | 'warn';
  text: string;
}

export interface HarmonyResult {
  score: number;
  label: string;
  relationLabel: string;
  contrast: number;
  notes: HarmonyNote[];
}

export interface EvaluateHarmonyInput {
  primaryColor: string;
  pantColor: string;
  accessoryColors?: string[];
  eventAdvice?: string;
  eventName?: string;
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const full = clean.length === 3
    ? clean.split('').map((c) => c + c).join('')
    : clean.padEnd(6, '0').slice(0, 6);
  const num = parseInt(full, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function getLuminance(r: number, g: number, b: number): number {
  const a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function getContrastRatio(hex1: string, hex2: string): number {
  const [r1, g1, b1] = hexToRgb(hex1);
  const [r2, g2, b2] = hexToRgb(hex2);
  const lum1 = getLuminance(r1, g1, b1);
  const lum2 = getLuminance(r2, g2, b2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return Number(((brightest + 0.05) / (darkest + 0.05)).toFixed(1));
}

export function evaluateColorHarmony(input: EvaluateHarmonyInput): HarmonyResult {
  const { primaryColor, pantColor, accessoryColors = [], eventAdvice, eventName } = input;

  const contrast = getContrastRatio(primaryColor, pantColor);
  const [r1, g1, b1] = hexToRgb(primaryColor);
  const [r2, g2, b2] = hexToRgb(pantColor);
  const [h1, s1, l1] = rgbToHsl(r1, g1, b1);
  const [h2, s2, l2] = rgbToHsl(r2, g2, b2);

  const hueDiff = Math.abs(h1 - h2);
  const normalizedHueDiff = hueDiff > 180 ? 360 - hueDiff : hueDiff;

  let relationLabel = 'Phối màu đa sắc';
  let baseScore = 82;
  const notes: HarmonyNote[] = [];

  if (s1 < 15 && s2 < 15) {
    relationLabel = 'Đơn sắc trung tính';
    baseScore = 88;
    notes.push({
      tone: 'good',
      text: 'Bảng màu trung tính tinh tế, tạo diện mạo nho nhã và thanh thoát.',
    });
  } else if (normalizedHueDiff <= 25) {
    relationLabel = 'Đơn sắc / Tương đồng';
    baseScore = 86;
    notes.push({
      tone: 'good',
      text: 'Sắc thái áo và quần chuyển tiếp mượt mà, giúp tôn dáng người mặc.',
    });
  } else if (normalizedHueDiff <= 70) {
    relationLabel = 'Màu tương đồng';
    baseScore = 89;
    notes.push({
      tone: 'good',
      text: 'Phối màu tương đồng tự nhiên, hài hòa và êm dịu thị giác.',
    });
  } else if (normalizedHueDiff >= 140 && normalizedHueDiff <= 200) {
    relationLabel = 'Tương phản / Bổ túc';
    baseScore = 91;
    notes.push({
      tone: 'good',
      text: 'Độ tương phản màu sắc rõ rệt giữa thân áo và quần, tạo điểm nhấn sắc nét.',
    });
  } else {
    relationLabel = 'Phối màu đa sắc';
    baseScore = 84;
    notes.push({
      tone: 'info',
      text: 'Sự kết hợp sắc thái phong phú, thể hiện phong cách cá tính.',
    });
  }

  // Contrast check
  if (contrast >= 3.0) {
    baseScore += 5;
    notes.push({
      tone: 'good',
      text: `Độ tương phản ánh sáng ${contrast}:1 rõ nét, phân định tà áo và quần rất chuẩn xác.`,
    });
  } else if (contrast < 1.6 && Math.abs(l1 - l2) < 15) {
    baseScore -= 4;
    notes.push({
      tone: 'warn',
      text: 'Áo và quần có độ sáng khá gần nhau, có thể cân nhắc tăng độ đậm nhạt để tách lớp tà.',
    });
  }

  // Accessories contribution
  if (accessoryColors.length > 0) {
    notes.push({
      tone: 'good',
      text: `Điểm xuyết thêm ${accessoryColors.length} phụ kiện tạo chiều sâu cho tổng thể bộ trang phục.`,
    });
  }

  // Event context
  if (eventAdvice) {
    notes.push({
      tone: 'info',
      text: `Gợi ý dịp ${eventName ?? 'này'}: ${eventAdvice}`,
    });
  }

  const score = Math.max(65, Math.min(98, baseScore));
  let label = 'Hài hòa xuất sắc';
  if (score < 75) label = 'Phá cách cá tính';
  else if (score < 85) label = 'Cân bằng & Tinh tế';

  return {
    score,
    label,
    relationLabel,
    contrast,
    notes,
  };
}
