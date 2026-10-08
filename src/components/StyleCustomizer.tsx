import React from 'react';
import type { Garment } from '../types/fashion';
import { getApprovedAccessories } from '../lib/dal';

interface StyleCustomizerProps {
  garment: Garment;
  selectedColorHex: string;
  selectedPantColorHex: string;
  selectedAccessoryIds: string[];
  eventId?: string;
  showColors?: boolean;
  showPantColors?: boolean;
  showAccessories?: boolean;
  onColorChange: (colorHex: string) => void;
  onPantColorChange: (pantColorHex: string) => void;
  onToggleAccessory: (accId: string) => void;
}

const DEFAULT_PANT_COLORS = [
  { name: 'Trắng Ngà (Lụa Bạch)', hex: '#F4F0E8' },
  { name: 'Đen Tuyển (Lụa Đen)', hex: '#1C1C1E' },
  { name: 'Nâu Củ Nâu', hex: '#6C4B35' },
  { name: 'Xanh Chàm Đậm', hex: '#1E2A38' },
  { name: 'Vàng Mỡ Gà', hex: '#E3C27C' },
  { name: 'Đỏ Đô Trầm', hex: '#8B1E2B' },
];

export const StyleCustomizer: React.FC<StyleCustomizerProps> = ({
  garment,
  selectedColorHex,
  selectedPantColorHex,
  selectedAccessoryIds,
  showColors = true,
  showPantColors = true,
  showAccessories = true,
  onColorChange,
  onPantColorChange,
  onToggleAccessory,
}) => {
  const accessories = getApprovedAccessories();
  const baseColors = garment.baseColors || [
    { name: 'Đỏ Đô Hỷ Sự', hex: '#8B1E2B' },
    { name: 'Xanh Chàm Đậm', hex: '#1E2A38' },
    { name: 'Vàng Mỡ Gà', hex: '#E3C27C' },
    { name: 'Xanh Cốm Trầm', hex: '#4D6B53' },
    { name: 'Trắng Ngà', hex: '#F4F0E8' },
    { name: 'Đen Tuyển', hex: '#1C1C1E' },
  ];

  return (
    <div className="bg-[#FFFFFF] border border-[#E6DCCD] rounded-[28px] p-6 sm:p-7 shadow-[0_4px_24px_-4px_rgba(31,27,24,0.04)] space-y-6">
      {/* Garment Color Swatches */}
      {showColors && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-serif text-base font-bold text-[#1F1B18]">
              Màu Áo Chính (Thân Áo)
            </h4>
            <span className="text-[11px] font-mono text-[#736960] uppercase">
              {baseColors.find((c) => c.hex.toLowerCase() === selectedColorHex.toLowerCase())?.name || selectedColorHex}
            </span>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {baseColors.map((col) => {
              const isSelected = selectedColorHex.toLowerCase() === col.hex.toLowerCase();
              return (
                <button
                  key={col.hex}
                  type="button"
                  onClick={() => onColorChange(col.hex)}
                  title={col.name}
                  className={`press group relative flex items-center gap-2 px-3 py-2 rounded-2xl border text-xs transition ${
                    isSelected
                      ? 'border-[#1F1B18] bg-[#F1EADF] font-bold text-[#1F1B18] shadow-xs'
                      : 'border-[#E6DCCD] bg-[#FBF8F3] text-[#736960] hover:border-[#D8CCBA]'
                  }`}
                >
                  <span
                    className="w-4 h-4 rounded-full border border-black/15 shadow-2xs shrink-0"
                    style={{ backgroundColor: col.hex }}
                  />
                  <span>{col.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Pant Color Swatches */}
      {showPantColors && (
        <div className="space-y-3 pt-3 border-t border-[#E6DCCD]/60">
          <div className="flex items-center justify-between">
            <h4 className="font-serif text-base font-bold text-[#1F1B18]">
              Màu Quần Phối Kèm
            </h4>
            <span className="text-[11px] font-mono text-[#736960] uppercase">
              {DEFAULT_PANT_COLORS.find((c) => c.hex.toLowerCase() === selectedPantColorHex.toLowerCase())?.name || selectedPantColorHex}
            </span>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {DEFAULT_PANT_COLORS.map((col) => {
              const isSelected = selectedPantColorHex.toLowerCase() === col.hex.toLowerCase();
              return (
                <button
                  key={col.hex}
                  type="button"
                  onClick={() => onPantColorChange(col.hex)}
                  title={col.name}
                  className={`press flex items-center gap-2 px-3 py-2 rounded-2xl border text-xs transition ${
                    isSelected
                      ? 'border-[#1F1B18] bg-[#F1EADF] font-bold text-[#1F1B18] shadow-xs'
                      : 'border-[#E6DCCD] bg-[#FBF8F3] text-[#736960] hover:border-[#D8CCBA]'
                  }`}
                >
                  <span
                    className="w-4 h-4 rounded-full border border-black/15 shadow-2xs shrink-0"
                    style={{ backgroundColor: col.hex }}
                  />
                  <span>{col.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Accessories Selection */}
      {showAccessories && (
        <div className="space-y-3 pt-3 border-t border-[#E6DCCD]/60">
          <div className="flex items-center justify-between">
            <h4 className="font-serif text-base font-bold text-[#1F1B18]">
              Phụ Kiện Cổ Truyền & Cách Tân
            </h4>
            <span className="text-[11px] font-mono text-[#736960]">
              Đã chọn: {selectedAccessoryIds.length}
            </span>
          </div>
          <p className="text-xs text-[#736960]">
            Chọn các món đi kèm để kiểm định độ hòa hợp văn hóa và nâng tầm bản phối.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {accessories.map((acc) => {
              const isSelected = selectedAccessoryIds.includes(acc.id);
              return (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => onToggleAccessory(acc.id)}
                  className={`press p-3 rounded-2xl border text-left transition flex items-start gap-2.5 ${
                    isSelected
                      ? 'border-[#1F1B18] bg-[#F1EADF] shadow-xs'
                      : 'border-[#E6DCCD] bg-[#FBF8F3] hover:border-[#D8CCBA]'
                  }`}
                >
                  <span className="text-base shrink-0 mt-0.5">
                    {isSelected ? '✓' : '＋'}
                  </span>
                  <div className="min-w-0">
                    <span className="block text-xs font-bold text-[#1F1B18] truncate">
                      {acc.name}
                    </span>
                    <span className="block text-[11px] text-[#736960] line-clamp-1 mt-0.5">
                      {acc.category}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
