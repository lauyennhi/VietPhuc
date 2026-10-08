/**
 * Adaptive Tailoring Rule Engine for Vstyle
 * Validates functional adaptive needs and provides technical tailoring specifications.
 */

import { getAdaptiveAdjustmentByNeed, getSourceById } from '../dal';
import type { TailoringSheet } from '../../types/domain';

export interface AdaptiveCheckResult {
  hasAdaptiveNeed: boolean;
  validated: boolean;
  message?: string;
  needName?: string;
  reason?: string;
  tailoringSpecs?: TailoringSheet;
  source?: {
    title: string;
    reviewedBy: string;
  };
}

export function checkAdaptive(needCode?: string, garmentId?: string): AdaptiveCheckResult {
  if (!needCode) {
    return {
      hasAdaptiveNeed: false,
      validated: false,
      message: 'Chưa chọn nhu cầu thích ứng nào.',
    };
  }

  const adjustment = getAdaptiveAdjustmentByNeed(needCode, garmentId);

  if (!adjustment) {
    return {
      hasAdaptiveNeed: true,
      validated: false,
      needName: needCode,
      message: `Chưa có thông số may đo kiểm định cho mã nhu cầu [${needCode}]. Đang thẩm định bởi hội đồng phục dựng.`,
    };
  }

  const source = adjustment.sourceId ? getSourceById(adjustment.sourceId) : undefined;

  return {
    hasAdaptiveNeed: true,
    validated: adjustment.validated,
    needName: adjustment.needName,
    reason: adjustment.reason,
    tailoringSpecs: adjustment.tailoringSpecs,
    message: adjustment.validated
      ? 'Đã qua kiểm định chuyên gia thời trang thích ứng.'
      : 'Thông số may đo thích ứng đang được thử nghiệm và chưa được phê duyệt chính thức.',
    source: source
      ? {
          title: source.title,
          reviewedBy: source.reviewedBy || 'Hội đồng thẩm định Vstyle',
        }
      : undefined,
  };
}
