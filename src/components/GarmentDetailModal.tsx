import React from 'react';
import { Garment } from '../types/fashion';
import { getAllSources } from '../lib/dal';
import { Dialog } from './ui/Dialog';

export interface GarmentDetailModalProps {
  garment: Garment | null;
  onClose: () => void;
  onSelectForStyling?: (garment: Garment) => void;
}

export const GarmentDetailModal: React.FC<GarmentDetailModalProps> = ({
  garment,
  onClose,
  onSelectForStyling,
}) => {
  if (!garment) return null;

  const sourcesList = getAllSources();
  const sources = sourcesList.filter((s) => garment.sourceIds.includes(s.id));
  const isApproved = garment.status === 'APPROVED' && garment.verified;

  return (
    <Dialog bare title={garment.name} size="2xl" onClose={onClose}>
      <div className="bg-[#FFFFFF] border border-[#E6DCCD] rounded-t-[30px] sm:rounded-[30px] w-full p-6 sm:p-8 space-y-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#E6DCCD] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  isApproved
                    ? 'bg-[#E5EDE2] text-[#4F7350] border border-[#CDE0C9]'
                    : 'bg-[#F6ECDA] text-[#8A5E17] border border-[#E4D1B5]'
                }`}
              >
                {isApproved ? '✓ Đã Thẩm Định Văn Hóa' : '⏳ Đang Thẩm Định'}
              </span>
              <span className="text-xs text-[#736960] font-mono">{garment.era}</span>
            </div>
            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#1F1B18] mt-1.5">
              {garment.name}
            </h3>
            {garment.vietnameseTitle && (
              <p className="text-xs text-[#736960] font-serif italic mt-0.5">
                {garment.vietnameseTitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="press size-9 rounded-full border border-[#E6DCCD] hover:bg-[#F1EADF] text-[#736960] hover:text-[#1F1B18] flex items-center justify-center text-sm font-bold"
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>

        {/* Description & Cultural Meaning */}
        <div className="space-y-3">
          <p className="text-sm text-[#1F1B18] leading-relaxed">
            {garment.description}
          </p>
          {garment.culturalMeaning && (
            <div className="p-3.5 rounded-2xl bg-[#FBF8F3] border border-[#E6DCCD] text-xs text-[#736960] leading-relaxed">
              <span className="font-bold text-[#1F1B18] block mb-1">Ý nghĩa văn hóa:</span>
              {garment.culturalMeaning}
            </div>
          )}
        </div>

        {/* Characteristics (Đặc trưng nhận diện) */}
        {garment.characteristics && garment.characteristics.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-serif text-sm font-bold text-[#1F1B18]">
              Đặc trưng kết cấu & quy cách:
            </h4>
            <ul className="space-y-1.5 text-xs text-[#736960]">
              {garment.characteristics.map((c, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[#8A5E17] font-bold mt-0.5">•</span>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Non-negotiables (Quy chuẩn bất di bất dịch) */}
        {garment.nonNegotiables && garment.nonNegotiables.length > 0 && (
          <div className="p-4 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] space-y-2">
            <h4 className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
              <span>⚠️</span>
              <span>Quy chuẩn bất di bất dịch khi phối đồ:</span>
            </h4>
            <ul className="space-y-1 text-xs text-amber-800">
              {garment.nonNegotiables.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="font-bold">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Base Colors */}
        {garment.baseColors && garment.baseColors.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-serif text-sm font-bold text-[#1F1B18]">
              Bảng màu truyền thống đã kiểm định:
            </h4>
            <div className="flex flex-wrap gap-2">
              {garment.baseColors.map((color) => (
                <div
                  key={color.hex}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#E6DCCD] bg-[#FFFFFF] text-xs text-[#1F1B18]"
                >
                  <span
                    className="size-3.5 rounded-full border border-black/10 shrink-0"
                    style={{ backgroundColor: color.hex }}
                  />
                  <span>{color.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cultural Sources */}
        {sources.length > 0 && (
          <div className="pt-2 border-t border-[#E6DCCD] space-y-1.5 text-xs text-[#736960]">
            <span className="font-semibold text-[#1F1B18] block">Nguồn khảo cứu văn hiến:</span>
            <div className="flex flex-wrap gap-2">
              {sources.map((s) => (
                <span
                  key={s.id}
                  className="px-2.5 py-1 rounded-xl bg-[#F1EADF] border border-[#E6DCCD] text-[11px] font-mono text-[#736960]"
                >
                  📖 {s.title} ({s.author || s.year || 'Di sản'})
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-4 border-t border-[#E6DCCD] flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="press px-5 py-2.5 rounded-2xl border border-[#E6DCCD] bg-[#FFFFFF] text-xs font-semibold text-[#736960] hover:text-[#1F1B18]"
          >
            Đóng
          </button>
          {onSelectForStyling && (
            <button
              type="button"
              onClick={() => {
                onSelectForStyling(garment);
                onClose();
              }}
              className="press px-6 py-2.5 rounded-2xl bg-[#1F1B18] text-[#FFFFFF] text-xs font-bold shadow-xs hover:bg-[#332E29]"
            >
              Chọn y phục này để phối →
            </button>
          )}
        </div>
      </div>
    </Dialog>
  );
};
