import React, { useState, useMemo } from 'react';
import type { Garment, GarmentCategory } from '../types/fashion';
import { getApprovedGarments, getAllGarments } from '../lib/dal';

export interface GarmentDiscoveryProps {
  selectedGarmentId?: string;
  onSelectGarment: (garment: Garment) => void;
  onViewDetails?: (garment: Garment) => void;
  approvedOnly?: boolean;
}

const CATEGORY_TABS: { id: string; label: string }[] = [
  { id: 'ALL', label: 'Tất cả' },
  { id: 'AO_DAI', label: 'Áo Dài' },
  { id: 'AO_NGU_THAN', label: 'Ngũ Thân' },
  { id: 'AO_TAC', label: 'Áo Tấc' },
  { id: 'AO_NHAT_BINH', label: 'Nhật Bình' },
  { id: 'AO_TU_THAN', label: 'Tứ Thân' },
  { id: 'AO_GIAO_LINH', label: 'Giao Lĩnh' },
];

export const GarmentDiscovery: React.FC<GarmentDiscoveryProps> = ({
  selectedGarmentId,
  onSelectGarment,
  onViewDetails,
  approvedOnly = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const allGarments = useMemo(() => {
    return approvedOnly ? getApprovedGarments() : getAllGarments();
  }, [approvedOnly]);

  const filteredGarments = useMemo(() => {
    return allGarments.filter((g) => {
      // Category filter
      if (selectedCategory !== 'ALL' && g.category !== selectedCategory) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = g.name.toLowerCase().includes(query);
        const matchDesc = g.description.toLowerCase().includes(query);
        const matchEra = (g.era || '').toLowerCase().includes(query);
        return matchName || matchDesc || matchEra;
      }
      return true;
    });
  }, [allGarments, selectedCategory, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-[#1F1B18]">
            Bách Khoa Y Phục
          </h2>
          <p className="text-xs text-[#736960] mt-0.5">
            Khám phá quy thức cổ phục Việt Nam qua các thời kỳ lịch sử
          </p>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên, thời kỳ…"
            className="w-full rounded-2xl border border-[#E6DCCD] bg-[#FFFFFF] px-4 py-2 text-xs text-[#1F1B18] placeholder-[#736960] focus:border-[#1F1B18] focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-xs text-[#736960] hover:text-[#1F1B18]"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {CATEGORY_TABS.map((tab) => {
          const isActive = selectedCategory === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedCategory(tab.id)}
              className={`press shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition ${
                isActive
                  ? 'bg-[#1F1B18] text-[#FFFFFF] shadow-2xs'
                  : 'bg-[#FFFFFF] border border-[#E6DCCD] text-[#736960] hover:text-[#1F1B18] hover:bg-[#F1EADF]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Garments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredGarments.map((garment) => {
          const isSelected = garment.id === selectedGarmentId;
          const isApproved = garment.status === 'APPROVED' && garment.verified;

          return (
            <div
              key={garment.id}
              className={`rounded-[28px] border transition bg-[#FFFFFF] p-5 shadow-xs flex flex-col justify-between space-y-4 ${
                isSelected
                  ? 'border-[#1F1B18] ring-2 ring-[#1F1B18]/20 bg-[#FAF6F0]'
                  : 'border-[#E6DCCD] hover:border-[#1F1B18]/40 hover:shadow-sm'
              }`}
            >
              <div className="space-y-3">
                {/* Status & Era */}
                <div className="flex items-center justify-between text-xs">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isApproved
                        ? 'bg-[#E5EDE2] text-[#4F7350] border border-[#CDE0C9]'
                        : 'bg-[#F6ECDA] text-[#8A5E17] border border-[#E4D1B5]'
                    }`}
                  >
                    {isApproved ? '✓ Đã thẩm định' : '⏳ Đang thẩm định'}
                  </span>
                  <span className="font-mono text-[11px] text-[#736960]">
                    {garment.era || 'Cổ phong'}
                  </span>
                </div>

                {/* Garment Title */}
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#1F1B18]">
                    {garment.name}
                  </h3>
                  {garment.vietnameseTitle && (
                    <p className="text-xs text-[#736960] font-serif italic mt-0.5">
                      {garment.vietnameseTitle}
                    </p>
                  )}
                </div>

                {/* Description */}
                <p className="text-xs text-[#736960] line-clamp-3 leading-relaxed">
                  {garment.description}
                </p>

                {/* Color swatches preview */}
                {garment.baseColors && garment.baseColors.length > 0 && (
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="text-[11px] text-[#736960] font-medium mr-1">Màu:</span>
                    {garment.baseColors.slice(0, 5).map((color) => (
                      <span
                        key={color.hex}
                        className="size-4 rounded-full border border-black/10 shrink-0"
                        style={{ backgroundColor: color.hex }}
                        title={color.name}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-[#E6DCCD] gap-2">
                {onViewDetails && (
                  <button
                    type="button"
                    onClick={() => onViewDetails(garment)}
                    className="press text-xs font-semibold text-[#8A5E17] hover:underline"
                  >
                    Xem chi tiết →
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => onSelectGarment(garment)}
                  className={`press px-4 py-1.5 rounded-xl text-xs font-bold transition ml-auto ${
                    isSelected
                      ? 'bg-[#1F1B18] text-[#FFFFFF]'
                      : 'bg-[#FAF6F0] border border-[#E6DCCD] text-[#1F1B18] hover:bg-[#1F1B18] hover:text-[#FFFFFF]'
                  }`}
                >
                  {isSelected ? '✓ Đang chọn' : 'Chọn y phục'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredGarments.length === 0 && (
        <div className="text-center py-12 rounded-3xl border border-[#E6DCCD] bg-[#FFFFFF] space-y-2">
          <p className="text-sm font-semibold text-[#1F1B18]">Không tìm thấy y phục phù hợp</p>
          <p className="text-xs text-[#736960]">Hãy thử đổi từ khóa tìm kiếm hoặc danh mục</p>
        </div>
      )}
    </div>
  );
};
