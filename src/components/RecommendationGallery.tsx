import React from 'react';
import type { CharacterItem, FunctionalNeedCode } from '../types/fashion';
import { getApprovedAccessories, getApprovedGarments } from '../lib/dal';
import type { DeterministicRecommendation } from '../lib/recommendation/engine';
import { checkCulture } from '../lib/culture/ruleEngine';
import { STYLE_VIBE_BY_TAG, styleLabel } from '../lib/styles';
import { OutfitMockupCanvas } from './OutfitMockupCanvas';
import { SealStamp } from './ui/SealStamp';

interface RecommendationGalleryProps {
  candidates: DeterministicRecommendation[];
  character: CharacterItem;
  pantColor: string;
  adaptiveNeedCodes: FunctionalNeedCode[];
  rankedByGemini: boolean;
  onSelect: (candidate: DeterministicRecommendation) => void;
}

const garmentsById = new Map(getApprovedGarments().map((garment) => [garment.id, garment]));
const accessoriesById = new Map(getApprovedAccessories().map((accessory) => [accessory.id, accessory]));

export const RecommendationGallery: React.FC<RecommendationGalleryProps> = ({
  candidates,
  character,
  pantColor,
  adaptiveNeedCodes,
  rankedByGemini,
  onSelect,
}) => (
  <div className="space-y-4">
    <p className="text-xs text-[#736960]">
      {rankedByGemini
        ? 'Thứ tự do Gemini xếp hạng theo bối cảnh của bạn; mọi bản phối đều đã qua bộ quy tắc văn hóa.'
        : 'Thứ tự theo điểm của bộ quy tắc Vstyle (Gemini chưa sẵn sàng); mọi bản phối đều đã qua kiểm tra văn hóa.'}
    </p>
    <ol className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {candidates.map((candidate, index) => {
        const garment = garmentsById.get(candidate.garmentId);
        if (!garment) return null;
        const color = garment.baseColors.find((item) => item.hex.toLowerCase() === candidate.color.toLowerCase());
        const accessories = candidate.accessoryIds.flatMap((id) => {
          const accessory = accessoriesById.get(id);
          return accessory ? [accessory] : [];
        });
        const culture = checkCulture({
          garmentId: candidate.garmentId,
          accessoryIds: candidate.accessoryIds,
          eventId: candidate.eventId,
          primaryColor: candidate.color,
          adaptiveNeedCode: adaptiveNeedCodes[0],
        });
        const styleId = STYLE_VIBE_BY_TAG[candidate.style] ?? candidate.style;

        return (
          <li
            key={candidate.outfitId}
            className="flex flex-col overflow-hidden rounded-[26px] border border-[#E6DCCD] bg-[#FFFFFF] shadow-xs animate-rise"
            style={{ animationDelay: `${index * 70}ms` }}
          >
            <div className="relative bg-[#FBF8F3]">
              <OutfitMockupCanvas
                garment={garment}
                primaryColor={candidate.color}
                pantColor={pantColor}
                accessories={accessories}
                character={character}
                adaptiveNeedCodes={adaptiveNeedCodes}
                eventId={candidate.eventId}
                styleId={styleId}
                compact
              />
              <span className="absolute left-3 top-3 rounded-full border border-[#E6DCCD] bg-[#FFFFFF]/90 px-3 py-1 text-[11px] font-semibold text-[#1F1B18] shadow-xs backdrop-blur-xs">
                {rankedByGemini ? `Gemini đề xuất #${index + 1}` : `Gợi ý #${index + 1}`}
              </span>
              <div className="absolute right-3 top-3">
                <SealStamp score={culture.score} status={culture.status} size="sm" />
              </div>
            </div>

            <div className="flex flex-1 flex-col gap-3 p-5">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#1F1B18]">{garment.name}</h3>
                <p className="mt-1 flex items-center gap-2 text-xs text-[#736960]">
                  <span aria-hidden="true" className="size-3.5 rounded-full border border-[#E6DCCD]" style={{ backgroundColor: candidate.color }} />
                  {color?.name ?? candidate.color} · {styleLabel(styleId)}
                </p>
              </div>
              <p className="text-xs leading-relaxed text-[#736960] line-clamp-2">
                {accessories.length ? accessories.map((accessory) => accessory.name).join(' · ') : 'Không thêm phụ kiện'}
              </p>
              <ul className="space-y-1 border-t border-[#E6DCCD] pt-3 text-xs leading-relaxed text-[#736960]">
                {candidate.reasons.slice(0, 2).map((reason) => <li key={reason}>· {reason}</li>)}
              </ul>
              <button
                type="button"
                onClick={() => onSelect(candidate)}
                className="press mt-auto min-h-[44px] w-full rounded-2xl bg-[#1F1B18] px-4 text-xs font-bold text-[#FFFFFF] hover:bg-[#38322D] transition shadow-xs"
              >
                Chọn bản phối này →
              </button>
            </div>
          </li>
        );
      })}
    </ol>
  </div>
);
