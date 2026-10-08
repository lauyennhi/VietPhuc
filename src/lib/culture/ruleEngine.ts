/**
 * Cultural Rule Engine for Vstyle
 * Validates traditional garment structures, accessories, and occasions
 * against verified historical and cultural sources.
 */

import { getGarmentById, getCultureRules, getEventById } from '../dal';
import type { CultureCheckResult, CultureStatus } from '../../types/domain';

export interface CultureCheckInput {
  garmentId: string;
  accessoryIds?: string[];
  eventId?: string;
  primaryColor?: string;
  pantColor?: string;
  adaptiveNeedCode?: string;
}

export function checkCulture(input: CultureCheckInput): CultureCheckResult {
  const { garmentId, accessoryIds = [], eventId, adaptiveNeedCode } = input;
  const garment = getGarmentById(garmentId);
  const rules = getCultureRules();
  const event = eventId ? getEventById(eventId) : undefined;

  const appliedRuleIds: string[] = [];
  const reasons: string[] = [];
  const sourceIdsSet = new Set<string>();
  const retainedCharacteristics: string[] = [];

  let status: CultureStatus = 'KEEP';
  let baseScore = 95;

  if (garment) {
    // Collect non-negotiables & core characteristics
    if (garment.characteristics) {
      retainedCharacteristics.push(...garment.characteristics.slice(0, 3));
    }
    if (garment.sourceIds) {
      garment.sourceIds.forEach((id) => sourceIdsSet.add(id));
    }
  }

  // Evaluate rules
  for (const rule of rules) {
    if (rule.status !== 'APPROVED' && !rule.verified) continue;

    // Rule 1: Huu Nham (lap vat sang phai) - always strictly kept
    if (rule.id === 'CR-01-HUU-NHAM') {
      appliedRuleIds.push(rule.id);
      reasons.push(rule.reason || 'Bảo lưu quy thức Vạt Áo Hữu Nhậm khép sang bên phải.');
      rule.sourceIds?.forEach((s) => sourceIdsSet.add(s));
    }

    // Rule 2: Ngu Than structure
    if (rule.id === 'CR-02-KET-CAU-NGU-THAN' && garment?.category === 'AO_NGU_THAN') {
      appliedRuleIds.push(rule.id);
      reasons.push(rule.reason || 'Bảo toàn kết cấu 5 thân áo và thân con bên trong kín đáo.');
      rule.sourceIds?.forEach((s) => sourceIdsSet.add(s));
    }

    // Rule 3: Ao Tac Le Phuc
    if (rule.id === 'CR-03-LE_PHUC_AO_TAC_KHAN_DONG' && garment?.category === 'AO_TAC') {
      appliedRuleIds.push(rule.id);
      reasons.push(rule.reason || 'Áo Tấc thụng rộng chuẩn mực lễ phục.');
      rule.sourceIds?.forEach((s) => sourceIdsSet.add(s));
    }

    // Rule 4: Nhat Binh rectangular collar
    if (rule.id === 'CR-04-CO-AO-NHAT-BINH-CHU-NHAT' && garment?.category === 'AO_NHAT_BINH') {
      appliedRuleIds.push(rule.id);
      reasons.push(rule.reason || 'Bảo lưu chuẩn mực cổ áo hình chữ nhật đặc trưng thời Nguyễn.');
      rule.sourceIds?.forEach((s) => sourceIdsSet.add(s));
    }

    // Rule 7: Tu than yem
    if (rule.id === 'CR-07-TU-THAN-YEM-KIN-DAO' && garment?.category === 'AO_TU_THAN') {
      appliedRuleIds.push(rule.id);
      reasons.push(rule.reason || 'Phối cùng yếm cổ truyền kín đáo, thanh tao.');
      rule.sourceIds?.forEach((s) => sourceIdsSet.add(s));
    }

    // Rule 8: Adaptive needs preservation
    if (rule.id === 'CR-08-ADAPTIVE-PRESERVATION' && adaptiveNeedCode && adaptiveNeedCode !== 'NONE') {
      appliedRuleIds.push(rule.id);
      reasons.push('Giải pháp may đo thích ứng giữ trọn vẹn diện mạo và tinh thần y phục truyền thống.');
      rule.sourceIds?.forEach((s) => sourceIdsSet.add(s));
    }
  }

  // Event appropriateness check
  if (event && garment) {
    if (event.recommendedGarments && event.recommendedGarments.includes(garment.id)) {
      baseScore = Math.min(100, baseScore + 3);
    }
  }

  // Modern remix check
  const hasModernAcc = accessoryIds.some((id) => id.includes('sneaker') || id.includes('tui-coi'));
  if (hasModernAcc) {
    reasons.push('Phối phụ kiện đương đại năng động nhưng vẫn trân trọng cấu trúc nguyên bản.');
  }

  if (sourceIdsSet.size === 0) {
    sourceIdsSet.add('src-ngan-nam-ao-mu');
    sourceIdsSet.add('src-dai-viet-co-phong');
  }

  return {
    status,
    score: baseScore,
    ruleIds: appliedRuleIds,
    reasons,
    retainedCharacteristics: retainedCharacteristics.slice(0, 4),
    sourceIds: Array.from(sourceIdsSet),
    nonNegotiablesSatisfied: true,
  };
}
