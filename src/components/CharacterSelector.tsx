import React from 'react';
import type { CharacterItem } from '../types/fashion';
import { getCharacters } from '../lib/dal';

export interface CharacterSelectorProps {
  selectedCharacterId: string;
  onSelect: (character: CharacterItem) => void;
  skinTone?: string | null;
  onSkinToneChange?: (tone: string) => void;
}

export const SKIN_TONES = [
  { hex: '#FCE5D8', label: 'Trắng Sáng (Bạch Ngọc)' },
  { hex: '#F3D9C7', label: 'Tự Nhiên (Vàng Nhạt)' },
  { hex: '#E8C6AA', label: 'Mật Ong (Bánh Mật)' },
  { hex: '#D2A679', label: 'Nâu Trầm (Rám Nắng)' },
  { hex: '#A8764E', label: 'Ngăm Đậm (Gỗ Mun)' },
];

export const BODY_SHAPES = [
  { id: 'BALANCED', label: 'Cân Đối (Chuẩn Mực)', desc: 'Phù hợp đa dạng phom dáng cổ điển' },
  { id: 'CURVED', label: 'Đầy Đặn (Phúc Hậu)', desc: 'Tôn vinh nét đoan trang áo ngũ thân' },
  { id: 'SLENDER', label: 'Mảnh Khảnh (Thanh Thoát)', desc: 'Hợp tà áo dập dờn thướt tha' },
  { id: 'PETITE', label: 'Nhỏ Nhắn (Duyên Dáng)', desc: 'Tỷ lệ áo gọn gàng' },
];

export const HAIR_SILHOUETTES = [
  { id: 'TOC_VAN', label: 'Tóc Vấn Khăn', icon: '🧕', desc: 'Kiểu vấn tóc cổ điển của phụ nữ' },
  { id: 'TOC_BUI', label: 'Tóc Búi Củ Tỏi', icon: '💇', desc: 'Gọn gàng trang trọng' },
  { id: 'TOC_XOA', label: 'Tóc Dài Xõa Tự Nhiên', icon: '👩', desc: 'Thanh thuần hiện đại' },
  { id: 'TOC_NGAN', label: 'Tóc Ngắn Cá Tính', icon: '🧑', desc: 'Gen Z Remix' },
];

export const POSES = [
  { id: 'STANDING', label: 'Đứng Thẳng Trang Trọng', icon: '🧍' },
  { id: 'WHEELCHAIR', label: 'Ngồi Xe Lăn (Adaptive)', icon: '♿' },
];

export const CharacterSelector: React.FC<CharacterSelectorProps> = ({
  selectedCharacterId,
  onSelect,
  skinTone,
  onSkinToneChange,
}) => {
  const characters = getCharacters();

  return (
    <div className="space-y-6">
      {/* Character Cards */}
      <div className="space-y-2">
        <h3 className="font-serif text-sm font-bold text-[#1F1B18]">
          Chọn Hình Mẫu Người Mặc
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {characters.map((char) => {
            const isSelected = char.id === selectedCharacterId;
            return (
              <button
                key={char.id}
                type="button"
                onClick={() => onSelect(char)}
                className={`press p-4 rounded-[24px] border text-left transition flex items-start gap-3.5 ${
                  isSelected
                    ? 'border-[#1F1B18] bg-[#FAF6F0] ring-1 ring-[#1F1B18]/30 shadow-xs'
                    : 'border-[#E6DCCD] bg-[#FFFFFF] hover:border-[#1F1B18]/40'
                }`}
              >
                <div className="size-12 rounded-2xl bg-[#F1EADF] border border-[#E6DCCD] flex items-center justify-center text-2xl shrink-0">
                  {char.gender === 'FEMALE' ? '👩' : '👨'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-serif text-sm font-bold text-[#1F1B18]">{char.name}</span>
                    {isSelected && <span className="text-[10px] text-[#4F7350] font-bold">✓ Đang chọn</span>}
                  </div>
                  <p className="text-xs text-[#736960] mt-0.5 line-clamp-1">
                    {char.bodyRepresentation || char.posture}
                  </p>
                  <span className="inline-block px-2 py-0.5 rounded-full bg-[#EFE9DD] text-[10px] font-mono text-[#736960] mt-1.5">
                    {char.gender === 'FEMALE' ? 'Nữ' : 'Nam'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Skin Tone Palette */}
      {onSkinToneChange && (
        <div className="space-y-2 pt-2 border-t border-[#E6DCCD]">
          <h3 className="font-serif text-sm font-bold text-[#1F1B18]">
            Tông Sắc Tố Da
          </h3>
          <div className="flex flex-wrap items-center gap-3">
            {SKIN_TONES.map((tone) => {
              const isSelected = skinTone === tone.hex;
              return (
                <button
                  key={tone.hex}
                  type="button"
                  onClick={() => onSkinToneChange(tone.hex)}
                  className={`press flex items-center gap-2 px-3 py-1.5 rounded-full border transition ${
                    isSelected
                      ? 'border-[#1F1B18] bg-[#FAF6F0] ring-2 ring-[#1F1B18]/20 font-bold'
                      : 'border-[#E6DCCD] bg-[#FFFFFF] hover:bg-[#FBF8F3]'
                  }`}
                >
                  <span
                    className="size-4 rounded-full border border-black/15 shrink-0"
                    style={{ backgroundColor: tone.hex }}
                  />
                  <span className="text-xs text-[#1F1B18]">{tone.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
