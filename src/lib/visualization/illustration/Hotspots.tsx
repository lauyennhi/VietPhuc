/**
 * Cultural Hotspots: Interactive educational markers on authentic garment features
 */

import React, { useState } from 'react';

export interface HotspotDetail {
  id: string;
  name: string;
  x: number;
  y: number;
  number: number;
  feature: string;
  why: string;
  source: string;
}

export interface HotspotsProps {
  garmentId?: string;
  isWheelchair?: boolean;
}

export const Hotspots: React.FC<HotspotsProps> = ({ garmentId, isWheelchair = false }) => {
  const [activeHotspot, setActiveHotspot] = useState<HotspotDetail | null>(null);

  const isNguThan = garmentId?.includes('ngu-than');
  const isTuThan = garmentId?.includes('tu-than');
  const isNhatBinh = garmentId?.includes('nhat-binh');
  const isAoDai = garmentId?.includes('ao-dai');

  const hotspots: HotspotDetail[] = [
    {
      id: 'hs-collar',
      number: 1,
      name: isTuThan ? 'Cổ Yếm & Cổ Nhạn' : isNhatBinh ? 'Cổ Chữ Nhật (Đối Khâm)' : 'Cổ Lập Lĩnh (Cổ Đứng)',
      feature: isTuThan ? 'Lớp yếm cổ nhạn che chắn kín đáo' : 'Cổ đứng cao 2 - 3.5cm viền nẹp thanh nhã',
      x: 200,
      y: 122,
      why: isTuThan
        ? 'Áo yếm lót trong cùng cổ nhạn thể hiện sự đoan trang, kín đáo của phụ nữ vùng đồng bằng Bắc Bộ xưa.'
        : isNhatBinh
        ? 'Bản cổ to hình chữ nhật thêu hoa văn hoa cúc và kim tuyến biểu thị phẩm hàm quý tộc triều Nguyễn.'
        : 'Cổ đứng lập lĩnh giữ cho đầu và cổ người mặc luôn ngay ngắn, thể hiện phong thái đoan chính, nghiêm cẩn.',
      source: 'Ngàn năm áo mũ (Trần Quang Đức)',
    },
    {
      id: 'hs-closure',
      number: 2,
      name: isTuThan ? 'Thắt Lưng Lụa Đào' : isNguThan ? 'Vạt Hữu Nhậm & 5 Cúc' : 'Khép Vạt Sang Phải',
      feature: isNguThan ? '5 cúc kim loại cài chéo sang sườn phải' : 'Quy thức vạt đè từ trái sang phải',
      x: 218,
      y: 160,
      why: isNguThan
        ? 'Năm hạt cúc cài chéo tượng trưng cho Ngũ thường (Nhân, Lễ, Nghĩa, Trí, Tín) và Ngũ luân đạo lý truyền thống.'
        : 'Quy thức hữu nhậm (tà khép sang phải) là ranh giới văn hóa quan trọng, phân biệt y quan Đại Việt với tả nhậm.',
      source: 'Khâm định Đại Nam hội điển sự lệ',
    },
    {
      id: 'hs-panel',
      number: 3,
      name: isNguThan ? 'Thân Con (Tiểu Phẩm)' : isTuThan ? '2 Thân Trước Buông Thả' : 'Tà Áo & Xẻ Sườn',
      feature: isNguThan ? 'Thân áo thứ 5 lót kín bên trong ngực' : 'Tà áo buông rủ xẻ sườn cao thoáng',
      x: 180,
      y: isWheelchair ? 310 : 340,
      why: isNguThan
        ? 'Thân con bên trong tượng trưng cho tình phụ mẫu che chở, bao bọc con cái, đồng thời giữ ngực luôn kín đáo khi cử động.'
        : 'Đường xẻ tà cao vừa tầm thắt lưng tạo độ bay bổng uyển chuyển nhưng vẫn giữ trọn nét tao nhã khi bước đi.',
      source: 'Hồ sơ khảo cứu Áo Ngũ Thân (Đại Việt Cổ Phong)',
    },
  ];

  return (
    <g id="cultural-hotspots-layer">
      {hotspots.map((hs) => {
        const isActive = activeHotspot?.id === hs.id;
        return (
          <g
            key={hs.id}
            transform={`translate(${hs.x}, ${hs.y})`}
            onClick={() => setActiveHotspot(isActive ? null : hs)}
            className="cursor-pointer group"
          >
            {/* Subtle pulsing gold halo */}
            <circle
              r="9"
              fill="#D4AF37"
              opacity="0.3"
              className="animate-ping"
            />
            {/* Solid elegant badge */}
            <circle
              r="7"
              fill="#1F1B18"
              stroke="#D4AF37"
              strokeWidth="1.2"
              className="group-hover:scale-115 transition-transform"
            />
            <text
              y="3"
              textAnchor="middle"
              fill="#FFFFFF"
              fontSize="7.5"
              fontFamily="sans-serif"
              fontWeight="bold"
            >
              {hs.number}
            </text>
          </g>
        );
      })}

      {/* Floating Card Popover */}
      {activeHotspot && (
        <foreignObject
          x="35"
          y={activeHotspot.y > 230 ? activeHotspot.y - 135 : activeHotspot.y + 12}
          width="330"
          height="125"
          className="overflow-visible"
        >
          <div className="bg-[#FFFFFF]/95 backdrop-blur-md border border-[#E6DCCD] rounded-2xl p-3 shadow-xl text-xs space-y-1 animate-rise border-t-2 border-t-[#D4AF37]">
            <div className="flex items-center justify-between border-b border-[#E6DCCD] pb-1">
              <span className="font-serif font-bold text-[#1F1B18] flex items-center gap-1.5">
                <span className="size-4 rounded-full bg-[#1F1B18] text-[#D4AF37] text-[9px] grid place-items-center font-bold">
                  {activeHotspot.number}
                </span>
                {activeHotspot.name}
              </span>
              <button
                type="button"
                onClick={() => setActiveHotspot(null)}
                className="text-[#736960] hover:text-[#1F1B18] text-xs font-bold px-1"
                aria-label="Đóng chi tiết điểm văn hóa"
              >
                ✕
              </button>
            </div>
            <p className="text-[10px] font-semibold text-[#8A5E17]">{activeHotspot.feature}</p>
            <p className="text-[10.5px] text-[#4A4540] leading-snug">{activeHotspot.why}</p>
            <p className="text-[9.5px] text-[#736960] italic pt-1 border-t border-[#E6DCCD]/60">
              Nguồn: {activeHotspot.source}
            </p>
          </div>
        </foreignObject>
      )}
    </g>
  );
};
