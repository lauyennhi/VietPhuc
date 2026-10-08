import React, { useState, useEffect } from 'react';
import type { Outfit } from '../types/fashion';
import { getSavedOutfits, deleteOutfitFromLookbook } from '../lib/storage/lookbook';
import { getApprovedGarments, getApprovedAccessories } from '../lib/dal';
import { OutfitMockupCanvas } from './OutfitMockupCanvas';

export interface LookbookDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadOutfit: (outfit: Outfit) => void;
  onShareOutfit?: (outfit: Outfit) => void;
}

export const LookbookDrawer: React.FC<LookbookDrawerProps> = ({
  isOpen,
  onClose,
  onLoadOutfit,
  onShareOutfit,
}) => {
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'TRADITIONAL' | 'REMIX'>('ALL');

  useEffect(() => {
    if (isOpen) {
      setOutfits(getSavedOutfits());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const allGarments = getApprovedGarments();
  const allAccessories = getApprovedAccessories();

  const filteredOutfits = outfits.filter((outfit) => {
    if (activeFilter === 'TRADITIONAL') return outfit.chuanScore >= 95;
    if (activeFilter === 'REMIX') return outfit.title.includes('Remix') || outfit.styleVibe === 'REMIX_GEN_Z';
    return true;
  });

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteOutfitFromLookbook(id);
    setOutfits(getSavedOutfits());
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Bộ sưu tập Lookbook"
      className="fixed inset-0 z-50 flex justify-end bg-[#1F1B18]/40 backdrop-blur-xs animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-xl h-full bg-[#FFFFFF] border-l border-[#E6DCCD] shadow-2xl flex flex-col justify-between overflow-hidden animate-slide-left">
        {/* Drawer Header */}
        <div className="p-6 border-b border-[#E6DCCD] flex items-center justify-between">
          <div>
            <h2 className="font-serif text-2xl font-bold text-[#1F1B18]">
              Lookbook Của Bạn
            </h2>
            <p className="text-xs text-[#736960] mt-0.5">
              {outfits.length} bản phối đã lưu trong bộ sưu tập cá nhân
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="press size-9 rounded-full border border-[#E6DCCD] hover:bg-[#F1EADF] text-[#736960] flex items-center justify-center font-bold text-sm"
          >
            ✕
          </button>
        </div>

        {/* Filter Chips */}
        <div className="px-6 py-3 border-b border-[#F1EADF] bg-[#FAF6F0] flex items-center gap-2">
          {[
            { id: 'ALL' as const, label: 'Tất cả' },
            { id: 'TRADITIONAL' as const, label: 'Chuẩn cổ điển' },
            { id: 'REMIX' as const, label: 'Remix Gen Z' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFilter(tab.id)}
              className={`press px-3.5 py-1 rounded-full text-xs font-semibold transition ${
                activeFilter === tab.id
                  ? 'bg-[#1F1B18] text-[#FFFFFF]'
                  : 'bg-[#FFFFFF] border border-[#E6DCCD] text-[#736960] hover:text-[#1F1B18]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Outfits List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {filteredOutfits.map((outfit) => {
            const garment = allGarments.find((g) => g.id === outfit.garmentId) || allGarments[0];
            const accs = allAccessories.filter((a) => outfit.accessoryIds.includes(a.id));

            return (
              <div
                key={outfit.id}
                className="rounded-[28px] border border-[#E6DCCD] bg-[#FAF6F0] p-4.5 space-y-3.5 transition hover:border-[#1F1B18]/40 shadow-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-serif text-base font-bold text-[#1F1B18]">
                      {outfit.title}
                    </h3>
                    <p className="text-[11px] text-[#736960] mt-0.5">
                      {garment.name} · Lưu lúc {new Date(outfit.createdAt).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="px-2 py-0.5 rounded-full bg-[#E5EDE2] text-[#4F7350] border border-[#CDE0C9] text-[10px] font-bold font-mono">
                      Chuẩn {outfit.chuanScore}/100
                    </span>
                  </div>
                </div>

                {/* Canvas Preview */}
                <div className="aspect-[4/5] max-w-[220px] mx-auto rounded-2xl overflow-hidden bg-[#FFFFFF] border border-[#E6DCCD] shadow-inner">
                  <OutfitMockupCanvas
                    garment={garment}
                    primaryColor={outfit.primaryColor}
                    pantColor={outfit.pantColor}
                    accessories={accs}
                    character={{
                      id: 'model-char',
                      name: 'Người mẫu',
                      gender: 'FEMALE',
                      bodyRepresentation: 'Cân đối',
                      skinTone: '#F5D3B8',
                      pose: outfit.adaptiveNeedCode === 'WHEELCHAIR_SEATED' ? 'WHEELCHAIR' : 'STANDING',
                      heightCategory: outfit.adaptiveNeedCode === 'WHEELCHAIR_SEATED' ? 'SEATED' : 'REGULAR',
                      imageAsset: '',
                      description: 'Người mẫu trình diễn',
                      posture: outfit.adaptiveNeedCode === 'WHEELCHAIR_SEATED' ? 'WHEELCHAIR_SEATED' : 'STANDING',
                    }}
                    compact
                  />
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-[#E6DCCD] gap-2">
                  <button
                    type="button"
                    onClick={(e) => handleDelete(outfit.id, e)}
                    className="press text-xs text-[#8B1E2B] hover:underline"
                  >
                    Xóa
                  </button>

                  <div className="flex items-center gap-2">
                    {onShareOutfit && (
                      <button
                        type="button"
                        onClick={() => onShareOutfit(outfit)}
                        className="press px-3 py-1.5 rounded-xl border border-[#E6DCCD] bg-[#FFFFFF] text-xs font-semibold text-[#736960] hover:text-[#1F1B18]"
                      >
                        Chia sẻ
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        onLoadOutfit(outfit);
                        onClose();
                      }}
                      className="press px-4 py-1.5 rounded-xl bg-[#1F1B18] text-[#FFFFFF] text-xs font-bold hover:bg-[#332E29] transition"
                    >
                      Mặc bản phối này →
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredOutfits.length === 0 && (
            <div className="text-center py-16 space-y-2">
              <span className="text-3xl">👗</span>
              <p className="text-sm font-semibold text-[#1F1B18]">Chưa có bản phối nào</p>
              <p className="text-xs text-[#736960]">Hãy tự tay phối đồ trong Studio hoặc Luồng 9 bước và lưu lại</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
