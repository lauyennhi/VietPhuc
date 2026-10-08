import React from 'react';
import type { HarmonyResult } from '../lib/color/harmony';

interface ColorHarmonyCardProps {
  result: HarmonyResult;
  swatches: Array<{ label: string; hex: string }>;
}

export const ColorHarmonyCard: React.FC<ColorHarmonyCardProps> = ({ result, swatches }) => {
  return (
    <div className="bg-[#FFFFFF] border border-[#E6DCCD] rounded-[28px] p-6 sm:p-7 shadow-[0_4px_24px_-4px_rgba(31,27,24,0.04)] space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-[#F1EADF] text-[#8B1E2B] rounded-xl text-base">🎨</span>
            <h3 className="font-serif text-xl font-bold text-[#1F1B18]">
              Hòa Sắc & Ngũ Hành Truyền Thống
            </h3>
          </div>
          <p className="text-xs text-[#736960] mt-1">
            Quy tắc phối màu tương sinh - tương khắc và độ tương phản thị giác trong cổ phục.
          </p>
        </div>

        <span className="px-3 py-1 bg-[#F1EADF] text-[#1F1B18] border border-[#E6DCCD] rounded-full text-xs font-bold">
          {result.relationLabel || 'Hài hòa'}
        </span>
      </div>

      {/* Swatches Visual Bar */}
      <div className="bg-[#FBF8F3] p-4.5 rounded-2xl border border-[#E6DCCD] space-y-3">
        <span className="text-[11px] font-mono uppercase text-[#736960] tracking-wider block">
          Bảng màu hiện tại:
        </span>
        <div className="flex flex-wrap items-center gap-3">
          {swatches.map((swatch, idx) => (
            <div key={idx} className="flex items-center gap-2 bg-[#FFFFFF] px-3 py-1.5 rounded-xl border border-[#E6DCCD]">
              <span
                className="w-5 h-5 rounded-full border border-black/15 shadow-2xs shrink-0"
                style={{ backgroundColor: swatch.hex }}
              />
              <div className="text-left">
                <span className="block text-xs font-bold text-[#1F1B18]">{swatch.label}</span>
                <span className="block text-[10px] font-mono text-[#736960] uppercase">{swatch.hex}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Harmony Score and Contrast */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="bg-[#FBF8F3] p-4 rounded-2xl border border-[#E6DCCD]">
          <span className="text-[#736960] block font-medium mb-1">Điểm hòa sắc:</span>
          <div className="flex items-baseline gap-1">
            <span className="font-serif text-2xl font-extrabold text-[#1F1B18]">
              {result.score}
            </span>
            <span className="text-xs text-[#736960]">/ 100</span>
          </div>
          <span className="text-[11px] text-[#4F7350] font-semibold mt-1 block">
            {result.label}
          </span>
        </div>

        <div className="bg-[#FBF8F3] p-4 rounded-2xl border border-[#E6DCCD]">
          <span className="text-[#736960] block font-medium mb-1">Độ tương phản quang học:</span>
          <div className="flex items-baseline gap-1">
            <span className="font-serif text-2xl font-extrabold text-[#1F1B18]">
              {typeof result.contrast === 'number' ? result.contrast.toFixed(1) : result.contrast}
            </span>
            <span className="text-xs text-[#736960]">: 1</span>
          </div>
          <span className="text-[11px] text-[#736960] mt-1 block">
            {result.contrast >= 4.5 ? '✓ Tương phản rõ nét (Đạt chuẩn)' : 'Hài hòa dịu mắt'}
          </span>
        </div>
      </div>

      {/* Color Notes */}
      {result.notes && result.notes.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-[#E6DCCD]/60">
          <h4 className="text-xs font-bold text-[#1F1B18] uppercase tracking-wider font-mono">
            Ghi chú mỹ cảm & ngũ hành:
          </h4>
          <div className="space-y-1.5">
            {result.notes.map((note, idx) => (
              <div
                key={idx}
                className={`text-xs p-3 rounded-xl border flex items-start gap-2.5 leading-relaxed ${
                  note.tone === 'good'
                    ? 'bg-[#E5EDE2]/40 border-[#CDE0C9] text-[#2F5332]'
                    : note.tone === 'warn'
                    ? 'bg-[#FDF5E6] border-[#F3DFC1] text-[#8A5E17]'
                    : 'bg-[#FBF8F3] border-[#E6DCCD] text-[#736960]'
                }`}
              >
                <span className="font-bold mt-0.5">
                  {note.tone === 'good' ? '✦' : note.tone === 'warn' ? '▲' : 'ℹ'}
                </span>
                <span>{note.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
