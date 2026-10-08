import React from 'react';

export interface TraditionalRemixToggleProps {
  value: number; // 0 (100% Traditional) to 100 (100% Remix)
  onChange: (value: number) => void;
  className?: string;
  showDetails?: boolean;
}

export const TraditionalRemixToggle: React.FC<TraditionalRemixToggleProps> = ({
  value,
  onChange,
  className = '',
  showDetails = true,
}) => {
  const isTraditional = value <= 35;
  const isBalanced = value > 35 && value < 65;
  const isRemix = value >= 65;

  return (
    <div className={`rounded-[26px] border border-[#E6DCCD] bg-[#FFFFFF] p-5 shadow-[0_4px_20px_-2px_rgba(31,27,24,0.03)] ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[#1F1B18]">Quang phổ phong cách:</span>
          <span
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-wide transition-colors ${
              isTraditional
                ? 'bg-[#E5EDE2] text-[#4F7350] border border-[#CDE0C9]'
                : isRemix
                  ? 'bg-[#E6ECF3] text-[#2E4A6B] border border-[#CAD9E8]'
                  : 'bg-[#F6ECDA] text-[#8A5E17] border border-[#ECDABF]'
            }`}
          >
            {isTraditional ? '100% Cổ Điển Nguyên Bản' : isRemix ? 'Gen Z Remix Phá Cách' : 'Giao Hòa Cổ Điển & Hiện Đại'}
          </span>
        </div>
        <span className="font-mono text-xs text-[#736960] tabular-nums font-semibold">
          {value}% Remix
        </span>
      </div>

      {/* Slider */}
      <div className="relative my-3">
        <input
          type="range"
          min={0}
          max={100}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-2 bg-[#F1EADF] rounded-lg appearance-none cursor-pointer accent-[#1F1B18] focus:outline-none"
          aria-label="Điều chỉnh tỷ lệ Traditional sang Remix"
        />
        <div className="flex justify-between text-[11px] text-[#736960] mt-1.5 px-0.5">
          <span className="hover:text-[#1F1B18] cursor-pointer font-medium" onClick={() => onChange(0)}>
            🏛️ Truyền Thống (0%)
          </span>
          <span className="hover:text-[#1F1B18] cursor-pointer font-medium" onClick={() => onChange(50)}>
            ⚖️ Cân Bằng (50%)
          </span>
          <span className="hover:text-[#1F1B18] cursor-pointer font-medium" onClick={() => onChange(100)}>
            ⚡ Remix Gen Z (100%)
          </span>
        </div>
      </div>

      {showDetails && (
        <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-[#E6DCCD] text-[11px]">
          <div className={`p-3 rounded-2xl transition border ${isTraditional ? 'bg-[#E5EDE2]/40 border-[#CDE0C9]' : 'bg-[#FBF8F3] border-[#E6DCCD] text-[#736960]'}`}>
            <span className="font-bold block text-[#4F7350]">Chuẩn Văn Hóa ({100 - Math.round(value * 0.3)}%)</span>
            <p className="text-[10px] mt-0.5 leading-snug text-[#736960]">
              Bảo tồn vạt hữu nhậm, khăn đóng/mấn, hài thêu và quy cách điển lễ.
            </p>
          </div>
          <div className={`p-3 rounded-2xl transition border ${isRemix ? 'bg-[#E6ECF3]/40 border-[#CAD9E8]' : 'bg-[#FBF8F3] border-[#E6DCCD] text-[#736960]'}`}>
            <span className="font-bold block text-[#2E4A6B]">Chất Phá Cách ({Math.round(value)}%)</span>
            <p className="text-[10px] mt-0.5 leading-snug text-[#736960]">
              Phối cùng sneaker retro, kính râm, túi canvas và bảng màu tươi mới.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
