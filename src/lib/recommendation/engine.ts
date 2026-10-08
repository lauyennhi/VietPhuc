/**
 * Deterministic recommendation engine & style scoring for Vstyle
 */

import { getApprovedGarments, getApprovedAccessories, getEventById } from '../dal';
import type { Garment, StyleScoreResult, StyleTag } from '../../types/domain';
import { styleTagFor } from '../styles';

export interface RecommendationContext {
  eventId: string;
  weatherId?: string;
  location?: string;
  style?: StyleTag | string;
  colorPreferences?: string[];
  accessoryIds?: string[];
  characterId?: string;
  adaptiveNeedCodes?: string[];
  garmentPreferences?: {
    preferredGarmentIds?: string[];
  };
  limit?: number;
}

export interface DeterministicRecommendation {
  outfitId: string;
  title: string;
  garmentId: string;
  color: string;
  accessoryIds: string[];
  eventId: string;
  style: StyleTag;
  score: number;
  reasoning?: string;
  reasons: string[];
}

export function getDeterministicRecommendations(
  context: RecommendationContext
): DeterministicRecommendation[] {
  const garments = getApprovedGarments();
  const accessories = getApprovedAccessories();
  const event = getEventById(context.eventId);
  const targetTag = styleTagFor(context.style);
  const limit = context.limit ?? 6;

  // Filter or prioritize garments based on context
  let candidateGarments = garments;
  if (context.garmentPreferences?.preferredGarmentIds?.length) {
    const preferred = garments.filter((g) =>
      context.garmentPreferences!.preferredGarmentIds!.includes(g.id)
    );
    if (preferred.length > 0) {
      candidateGarments = preferred;
    }
  }

  const results: DeterministicRecommendation[] = [];

  for (const garment of candidateGarments) {
    // Choose base color
    let chosenColor = garment.baseColors[0]?.hex ?? '#1E2A38';
    if (context.colorPreferences?.length) {
      const matched = garment.baseColors.find((c) =>
        context.colorPreferences!.some(
          (pref) => pref.toLowerCase() === c.hex.toLowerCase()
        )
      );
      if (matched) chosenColor = matched.hex;
    }

    // Filter compatible accessories
    const compatibleAccessories = accessories.filter((acc) => {
      const matchGarment = !acc.compatibleGarmentIds || acc.compatibleGarmentIds.includes(garment.id);
      const matchEvent = !acc.compatibleEventIds || acc.compatibleEventIds.includes(context.eventId);
      return matchGarment && matchEvent;
    });

    const chosenAccIds = compatibleAccessories.slice(0, 2).map((a) => a.id);

    // Calculate score
    let score = 80;
    if (event?.recommendedGarments?.includes(garment.id)) score += 10;
    if (garment.styleTags?.includes(targetTag)) score += 8;

    const reasoning = `Bản phối ${garment.name} phù hợp không gian ${event?.name ?? 'sự kiện'}, bảo tồn tinh hoa văn hóa.`;
    results.push({
      outfitId: `rec-${garment.id}-${targetTag.toLowerCase()}`,
      title: `${garment.name} · Phối ${targetTag}`,
      garmentId: garment.id,
      color: chosenColor,
      accessoryIds: chosenAccIds,
      eventId: context.eventId,
      style: targetTag,
      score,
      reasoning,
      reasons: [
        reasoning,
        `Màu sắc thanh lịch, chuẩn mực điển chế cho dịp ${event?.name ?? 'sự kiện'}.`,
      ],
    });
  }

  // Sort by score descending and take top N
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit);
}

export function calculateStyleScore(
  garment: Garment,
  _primaryColorHex: string,
  selectedAccessoryIds: string[],
  selectedEventId: string,
  selectedStyleVibe: string
): StyleScoreResult {
  const event = getEventById(selectedEventId);
  const targetTag = styleTagFor(selectedStyleVibe);

  let score = 85;
  const feedback: string[] = [];

  const isOccasionFit = Boolean(
    event?.recommendedGarments?.includes(garment.id) ||
    garment.occasions?.includes(selectedEventId)
  );

  if (isOccasionFit) {
    score += 8;
    feedback.push(`Lựa chọn ${garment.name} rất ăn ý với bối cảnh ${event?.name ?? 'sự kiện'}.`);
  } else {
    feedback.push(`Sự kết hợp mới lạ giữa ${garment.name} và ${event?.name ?? 'dịp này'}.`);
  }

  if (garment.styleTags?.includes(targetTag)) {
    score += 5;
    feedback.push(`Đúng tinh thần phong cách ${selectedStyleVibe}.`);
  }

  if (selectedAccessoryIds.length >= 1) {
    feedback.push(`Phụ kiện đi kèm tạo điểm xuyết tinh tế, nâng tầm trang phục.`);
  }

  const finalScore = Math.min(98, score);
  let label = 'Bản phối xuất sắc';
  if (finalScore < 85) label = 'Thanh lịch & Hài hòa';
  else if (finalScore >= 92) label = 'Tuyệt tác Phong Cách';

  return {
    score: finalScore,
    label,
    feedback,
    colorHarmony: 'BALANCED',
    occasionFit: isOccasionFit,
  };
}
