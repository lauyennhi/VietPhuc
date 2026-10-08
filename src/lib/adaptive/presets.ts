/**
 * Adaptive tailoring design presets.
 * Each functional need (codes from data/adaptive_needs.json) maps to default pattern
 * adjustments and an independent-dressing guide. Several needs can be combined:
 * numeric adjustments take the most accommodating value, closures follow a priority order.
 * These are design defaults for a conversation with a tailor, not medical standards.
 */

import type { FunctionalNeedCode } from '../../types/domain';

export type ClosureType = 'MAGNETIC' | 'VELCRO' | 'ZIPPER' | 'BUTTON';

export interface AdaptiveAdjustments {
  frontHemReduction: number; // cm shorter at the front (0–30)
  slitPosition: number; // cm higher side slit (0–25)
  sleeveLength: number; // cm (−15 … +10)
  sleeveWidth: number; // cm wider (0–15)
  openingWidth: number; // cm wider collar/neck opening (0–15)
  closureType: ClosureType;
}

export interface NeedPreset {
  code: FunctionalNeedCode;
  shortName: string;
  icon: string;
  tagline: string;
  adjustments: AdaptiveAdjustments;
  dressingSteps: string[];
}

export const STANDARD_ADJUSTMENTS: AdaptiveAdjustments = {
  frontHemReduction: 0,
  slitPosition: 0,
  sleeveLength: 0,
  sleeveWidth: 0,
  openingWidth: 0,
  closureType: 'BUTTON',
};

export const NEED_PRESETS: NeedPreset[] = [
  {
    code: 'WHEELCHAIR_SEATED',
    shortName: 'Ngồi xe lăn',
    icon: '♿',
    tagline: 'Tà trước gọn, không chạm bánh xe; xẻ sườn cao để ngồi phẳng.',
    adjustments: { frontHemReduction: 14, slitPosition: 10, sleeveLength: -2, sleeveWidth: 3, openingWidth: 2, closureType: 'MAGNETIC' },
    dressingSteps: [
      'Mặc quần lưng chun khi đang ngồi, kéo lên theo từng bên hông.',
      'Xỏ tay áo khi vẫn ngồi, vạt sau buông xuống lưng ghế.',
      'Kéo vạt phải (vạt con) vào trước, sau đó khép vạt trái đè sang phải — đúng hữu nhậm.',
      'Áp nẹp nam châm giấu dưới hàng cúc trang trí; vuốt tà trước nằm gọn trên đùi.',
    ],
  },
  {
    code: 'LIMITED_HAND_MOBILITY',
    shortName: 'Khó cài cúc',
    icon: '🧲',
    tagline: 'Giữ cúc trang trí bên ngoài, đóng mở bằng nam châm ẩn.',
    adjustments: { frontHemReduction: 0, slitPosition: 4, sleeveLength: 0, sleeveWidth: 2, openingWidth: 4, closureType: 'MAGNETIC' },
    dressingSteps: [
      'Mặc áo như áo khoác: xỏ tay thuận trước, tay còn lại sau.',
      'Khép vạt trái đè sang phải; nam châm tự hút khi hai nẹp gần nhau.',
      'Cúc tết bên ngoài chỉ để trang trí — không cần cài.',
      'Cởi: kéo nhẹ mép nẹp theo chiều ngang, không cần dùng ngón tay bấm.',
    ],
  },
  {
    code: 'LIMITED_MOBILITY',
    shortName: 'Hạn chế cử động vai',
    icon: '🤲',
    tagline: 'Vòng nách hạ sâu, ống tay rộng, khóa sườn mở hoàn toàn.',
    adjustments: { frontHemReduction: 0, slitPosition: 8, sleeveLength: 0, sleeveWidth: 8, openingWidth: 6, closureType: 'ZIPPER' },
    dressingSteps: [
      'Mở hết khóa sườn phải để áo trải phẳng như một tấm.',
      'Xỏ tay bên hạn chế trước, không cần giơ tay qua vai.',
      'Vòng thân áo ra sau, xỏ tay còn lại; người hỗ trợ có thể kéo khóa sườn.',
      'Khép vạt trái đè sang phải và kéo khóa sườn — khóa nằm giấu dưới nẹp.',
    ],
  },
  {
    code: 'LIMITED_STANDING',
    shortName: 'Khó đứng lâu',
    icon: '🪑',
    tagline: 'Đổi tư thế linh hoạt, tà an toàn không vướng chân.',
    adjustments: { frontHemReduction: 8, slitPosition: 10, sleeveLength: 0, sleeveWidth: 2, openingWidth: 2, closureType: 'VELCRO' },
    dressingSteps: [
      'Ngồi khi mặc quần; cạp sau luồn chun giúp kéo lên dễ dàng.',
      'Mặc áo khi ngồi, đứng lên một lần để buông tà rồi ngồi lại.',
      'Khi đứng dậy: vén nhẹ tà trước sang bên để không dẫm gấu.',
    ],
  },
  {
    code: 'MATERIAL_SENSITIVITY',
    shortName: 'Da nhạy cảm',
    icon: '🌿',
    tagline: 'Lót lụa tơ tằm, đường may cuộn lộn, không tem gáy.',
    adjustments: { frontHemReduction: 0, slitPosition: 2, sleeveLength: 0, sleeveWidth: 3, openingWidth: 3, closureType: 'VELCRO' },
    dressingSteps: [
      'Giặt nhẹ áo trước lần mặc đầu để vải mềm hơn.',
      'Mặc áo lót lụa trơn bên trong làm lớp đệm với da.',
      'Kiểm tra nẹp khóa dán đã được bọc lụa, không chạm trực tiếp vào da.',
    ],
  },
];

const CLOSURE_PRIORITY: ClosureType[] = ['ZIPPER', 'MAGNETIC', 'VELCRO', 'BUTTON'];

export const CLOSURE_LABELS: Record<ClosureType, string> = {
  MAGNETIC: 'Cúc nam châm ẩn (tự hút)',
  VELCRO: 'Khóa dán mềm bọc lụa',
  ZIPPER: 'Khóa kéo chìm ở sườn phải',
  BUTTON: 'Cúc tết truyền thống',
};

export function presetFor(code: string): NeedPreset | undefined {
  return NEED_PRESETS.find((preset) => preset.code === code);
}

/** Combines several needs: the most accommodating value per dimension. */
export function combineAdjustments(codes: string[]): AdaptiveAdjustments {
  const presets = codes.map(presetFor).filter((p): p is NeedPreset => Boolean(p));
  if (!presets.length) return { ...STANDARD_ADJUSTMENTS };
  const max = (key: keyof Omit<AdaptiveAdjustments, 'closureType' | 'sleeveLength'>) =>
    Math.max(...presets.map((p) => p.adjustments[key]));
  const sleeveLengths = presets.map((p) => p.adjustments.sleeveLength);
  const closures = presets.map((p) => p.adjustments.closureType);
  return {
    frontHemReduction: max('frontHemReduction'),
    slitPosition: max('slitPosition'),
    sleeveWidth: max('sleeveWidth'),
    openingWidth: max('openingWidth'),
    sleeveLength: Math.min(...sleeveLengths),
    closureType: CLOSURE_PRIORITY.find((c) => closures.includes(c)) ?? 'BUTTON',
  };
}
