import React, { useState, useMemo } from 'react';
import { Garment, CharacterItem } from '../types/fashion';
import { FunctionalNeedCode } from '../types/domain';
import { OutfitMockupCanvas, type AdaptiveAdjustmentsState } from './OutfitMockupCanvas';
import { getApprovedGarments, getCharacters } from '../lib/dal';

interface AdaptiveStudioProps {
  onApplyAdaptiveOutfit?: (garment: Garment, needCodes: FunctionalNeedCode[]) => void;
  showToast: (msg: string) => void;
}

interface AdaptiveNeedItem {
  id: string;
  code: FunctionalNeedCode;
  name: string;
  icon: string;
  desc: string;
  defaultHem: number;
  defaultSlit: number;
  defaultSleeveLength: number;
  defaultSleeveWidth: number;
  defaultOpening: number;
  defaultClosure: string;
  aiExplanation: string;
}

const ADAPTIVE_NEEDS_LIST: AdaptiveNeedItem[] = [
  {
    id: 'need-wheelchair',
    code: 'WHEELCHAIR_SEATED',
    name: 'Xe lăn',
    icon: '♿',
    desc: 'Cần tà áo gọn gàng chống chạm bánh xe và đường xẻ sườn thoải mái khi ngồi.',
    defaultHem: 15,
    defaultSlit: 12,
    defaultSleeveLength: -2,
    defaultSleeveWidth: 3,
    defaultOpening: 2,
    defaultClosure: 'MAGNETIC',
    aiExplanation: 'Điều chỉnh này giúp thu gọn phần tà chạm bánh xe lăn, nâng điểm xẻ sườn để tà áo buông đều hai bên đùi không bị đùn gập.',
  },
  {
    id: 'need-hand-mobility',
    code: 'LIMITED_HAND_MOBILITY',
    name: 'Hạn chế vận động tay',
    icon: '🤲',
    desc: 'Cần nới rộng vòng nách, ống tay và cơ chế đóng mở tự hít trợ lực.',
    defaultHem: 5,
    defaultSlit: 8,
    defaultSleeveLength: 0,
    defaultSleeveWidth: 8,
    defaultOpening: 6,
    defaultClosure: 'MAGNETIC',
    aiExplanation: 'Mở rộng biên độ nách và tay áo giúp mặc áo dễ dàng hơn mà không cần giơ tay quá cao; nẹp nam châm tự hút hỗ trợ thao tác một tay.',
  },
  {
    id: 'need-closure-dexterity',
    code: 'DEXTERITY_CLOSURE' as any,
    name: 'Khó cài cúc',
    icon: '🧲',
    desc: 'Khó thao tác với cúc bấm nhỏ truyền thống hoặc khuy vải tết chặt.',
    defaultHem: 0,
    defaultSlit: 5,
    defaultSleeveLength: 0,
    defaultSleeveWidth: 2,
    defaultOpening: 4,
    defaultClosure: 'MAGNETIC',
    aiExplanation: 'Thay thế hàng cúc bấm hạt truyền thống bằng dải cúc nam châm ẩn dưới nẹp tà hữu nhậm, giữ nguyên diện mạo cổ điển nhưng dễ cài.',
  },
  {
    id: 'need-standing',
    code: 'LIMITED_STANDING' as any,
    name: 'Khó đứng lâu',
    icon: '🪑',
    desc: 'Thường xuyên cần ngồi nghỉ, trọng tâm thân dưới cần độ co giãn và xẻ tà linh hoạt.',
    defaultHem: 8,
    defaultSlit: 10,
    defaultSleeveLength: 0,
    defaultSleeveWidth: 2,
    defaultOpening: 2,
    defaultClosure: 'VELCRO',
    aiExplanation: 'Nâng điểm xẻ tà giải tỏa lực căng kéo ở thắt lưng khi chuyển đổi giữa tư thế đứng và ngồi liên tục.',
  },
  {
    id: 'need-skin-sensitivity',
    code: 'MATERIAL_SENSITIVITY',
    name: 'Nhạy cảm da',
    icon: '🌿',
    desc: 'Dễ dị ứng với gân chỉ cứng, đường vắt sổ cọ xát hoặc kim loại cúc áo.',
    defaultHem: 0,
    defaultSlit: 4,
    defaultSleeveLength: 0,
    defaultSleeveWidth: 4,
    defaultOpening: 4,
    defaultClosure: 'VELCRO',
    aiExplanation: 'Ứng dụng kỹ thuật may cuộn lộn (French Seam) giấu toàn bộ gân chỉ thô bên trong và lót lụa tơ tằm nguyên bản bảo vệ làn da.',
  },
  {
    id: 'need-other',
    code: 'OTHER_NEEDS' as any,
    name: 'Nhu cầu khác',
    icon: '✨',
    desc: 'Tự do tùy biến riêng theo tỷ lệ cơ thể cá nhân hoặc thiết bị hỗ trợ chuyên biệt.',
    defaultHem: 6,
    defaultSlit: 6,
    defaultSleeveLength: 0,
    defaultSleeveWidth: 4,
    defaultOpening: 4,
    defaultClosure: 'MAGNETIC',
    aiExplanation: 'Tùy biến linh hoạt đa chiều theo kích thước thực tế của bạn, duy trì cấu trúc vạt và sự thanh lịch của cổ phục.',
  },
];

export const AdaptiveStudio: React.FC<AdaptiveStudioProps> = ({
  onApplyAdaptiveOutfit,
  showToast,
}) => {
  const garments = useMemo(() => getApprovedGarments(), []);
  const characters = useMemo(() => getCharacters(), []);

  // State
  const [selectedNeedId, setSelectedNeedId] = useState<string>('need-wheelchair');
  const [selectedGarment, setSelectedGarment] = useState<Garment>(garments[0]);
  const [primaryColorHex, setPrimaryColorHex] = useState<string>(garments[0].baseColors[0].hex);

  const activeNeed = useMemo(() => (
    ADAPTIVE_NEEDS_LIST.find((n) => n.id === selectedNeedId) ?? ADAPTIVE_NEEDS_LIST[0]
  ), [selectedNeedId]);

  // Interactive handles:
  // - độ dài tà (front hem length reduction)
  // - độ dài tay (sleeve length delta)
  // - độ rộng tay (sleeve width delta)
  // - vị trí slit (slit height raise)
  // - độ mở (neck / flap opening width)
  // - vị trí closure (closure type / position)
  const [frontHemReduction, setFrontHemReduction] = useState<number>(activeNeed.defaultHem);
  const [sleeveLength, setSleeveLength] = useState<number>(activeNeed.defaultSleeveLength);
  const [sleeveWidth, setSleeveWidth] = useState<number>(activeNeed.defaultSleeveWidth);
  const [slitPosition, setSlitPosition] = useState<number>(activeNeed.defaultSlit);
  const [openingWidth, setOpeningWidth] = useState<number>(activeNeed.defaultOpening);
  const [closureType, setClosureType] = useState<string>(activeNeed.defaultClosure);

  // Switch need handler
  const handleSelectNeed = (need: AdaptiveNeedItem) => {
    setSelectedNeedId(need.id);
    setFrontHemReduction(need.defaultHem);
    setSlitPosition(need.defaultSlit);
    setSleeveLength(need.defaultSleeveLength);
    setSleeveWidth(need.defaultSleeveWidth);
    setOpeningWidth(need.defaultOpening);
    setClosureType(need.defaultClosure);
  };

  const character = useMemo<CharacterItem>(() => ({
    ...characters[0],
    posture: activeNeed.code === 'WHEELCHAIR_SEATED' ? 'WHEELCHAIR_SEATED' : 'STANDING',
  }), [characters, activeNeed]);

  // Dynamic AI Explanation based on user's current slider positions
  const currentAiExplanation = useMemo(() => {
    const reasons: string[] = [];
    if (frontHemReduction > 0) {
      if (activeNeed.code === 'WHEELCHAIR_SEATED') {
        reasons.push(`Thu ngắn tà trước ${frontHemReduction}cm giúp giảm tối đa phần tà chạm bánh xe lăn và tránh đùn vải khi gập gối.`);
      } else {
        reasons.push(`Thu ngắn tà trước ${frontHemReduction}cm giúp bước đi gọn gàng, tránh dẫm tà khi di chuyển.`);
      }
    }
    if (slitPosition > 0) {
      reasons.push(`Nâng điểm xẻ sườn thêm ${slitPosition}cm giúp tà áo buông đều hai bên, giải phóng khớp hông và đùi.`);
    }
    if (sleeveWidth > 0) {
      reasons.push(`Nới rộng tay áo +${sleeveWidth}cm tạo khoảng thở thông thoáng cho bắp tay và hỗ trợ xỏ áo không bị bó rát.`);
    }
    if (sleeveLength !== 0) {
      reasons.push(sleeveLength < 0 ? `Thu ngắn ống tay ${Math.abs(sleeveLength)}cm giúp thao tác bàn tay và cổ tay không bị vướng víu.` : `Dài tay +${sleeveLength}cm tạo độ rủ che chắn cổ tay kín đáo.`);
    }
    if (openingWidth > 0) {
      reasons.push(`Độ mở cổ nới ${openingWidth}cm giúp tròng áo êm ái, giảm áp lực lên đốt sống cổ.`);
    }
    if (closureType === 'MAGNETIC') {
      reasons.push('Khuy nam châm giấu nẹp tự hít thông minh, dễ dàng tự mặc độc lập mà vẫn giữ trọn nét kín đáo của vạt hữu nhậm.');
    } else if (closureType === 'VELCRO') {
      reasons.push('Khóa dán y tế mềm mại tạo độ phẳng tuyệt đối, không gây cấn đau khi tì đè.');
    }
    return reasons.length > 0 ? reasons.join(' ') : activeNeed.aiExplanation;
  }, [frontHemReduction, slitPosition, sleeveWidth, sleeveLength, openingWidth, closureType, activeNeed]);

  // Adjustments bundle for SVG canvas
  const adaptiveAdjustments: AdaptiveAdjustmentsState = useMemo(() => ({
    frontHemReduction,
    slitPosition,
    sleeveLength,
    sleeveWidth,
    openingWidth,
    closureType,
  }), [frontHemReduction, slitPosition, sleeveLength, sleeveWidth, openingWidth, closureType]);

  // Export Tech Pack
  const handleExportTechPack = () => {
    const text = `
======================================================
PHIẾU THÔNG SỐ KỸ THUẬT MAY ĐO THÍCH ỨNG (TECH PACK)
Nền tảng: Vstyle · May Đo Thích Ứng & Hòa Nhập
======================================================
1. THÔNG TIN CHUNG:
- Y phục: ${selectedGarment.name} (${selectedGarment.era})
- Nhu cầu thích ứng: ${activeNeed.name}
- Màu sắc chủ đạo: ${primaryColorHex}

2. CÁC THÔNG SỐ TÙY CHỈNH KỸ THUẬT (INTERACTIVE SPECS):
- Thu ngắn tà áo trước: -${frontHemReduction} cm (an toàn, tránh vướng bánh xe/bước đi)
- Nâng điểm xẻ sườn (Slit position): +${slitPosition} cm (giải phóng cử động khi ngồi/di chuyển)
- Độ dài tay áo: ${sleeveLength >= 0 ? `+${sleeveLength}` : sleeveLength} cm
- Độ rộng ống tay: +${sleeveWidth} cm (nới lỏng vòng nách và bắp tay)
- Độ mở cổ/vạt áo: +${openingWidth} cm
- Cơ chế cài đóng mở: ${
      closureType === 'MAGNETIC' ? 'Khuy nam châm giấu kín nẹp áo (tự hút trợ lực)' :
      closureType === 'VELCRO' ? 'Khóa dán y tế siêu mềm giấu viền' :
      closureType === 'ZIPPER' ? 'Khóa kéo trơn chìm giấu đường may' : 'Cúc bấm hạt truyền thống bọc đệm êm'
    }

3. GIẢI THÍCH TỪ AI STYLIST:
${currentAiExplanation}

* LƯU Ý PHÁP LÝ & TRUNG THỰC DỮ LIỆU:
Các gợi ý và thông số may đo trên đây mang tính chất hỗ trợ tùy biến cá nhân hóa trải nghiệm mặc cho người dùng; không cấu thành tiêu chuẩn y khoa hay quy chuẩn may đo đã được cơ quan chuyên môn xác nhận chính thức.
======================================================
    `.trim();

    navigator.clipboard.writeText(text).then(() => {
      showToast('Đã sao chép Phiếu Thông Số May Đo vào bộ nhớ tạm! Bạn có thể gửi cho thợ may.');
    }).catch(() => {
      showToast('Đã chuẩn bị thông số kỹ thuật may đo.');
    });
  };

  return (
    <div className="space-y-8">
      {/* Editorial Header Banner */}
      <div className="rounded-[30px] border border-[#E6DCCD] bg-[#FFFFFF] p-6 lg:p-8 shadow-[0_4px_24px_-4px_rgba(31,27,24,0.04)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="grid size-10 place-items-center rounded-2xl bg-[#E5EDE2] text-[#4F7350] text-lg font-bold">
              ♿
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1F1B18]">
              ADAPTIVE FASHION
            </h2>
            <span className="rounded-full bg-[#E5EDE2] px-2.5 py-0.5 text-[11px] font-semibold text-[#4F7350] border border-[#CDE0C9]">
              May Đo Hòa Nhập
            </span>
          </div>
          <p className="font-serif italic text-base sm:text-lg text-[#1F1B18] mt-1 font-semibold">
            “Việt phục theo nhu cầu của từng cơ thể”
          </p>
          <p className="text-xs sm:text-sm text-[#736960] mt-1 max-w-2xl leading-relaxed">
            Mỗi cơ thể đều có quyền diện cổ phục tự tin và đoan trang. Tự tay kéo chỉnh độ dài tà, tay áo, điểm xẻ sườn và cơ chế cài để tạo nên bản rập hoàn hảo nhất cho bạn.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleExportTechPack}
            className="press px-5 py-2.5 rounded-2xl bg-[#1F1B18] hover:bg-[#38322D] text-[#FFFFFF] text-xs font-bold shadow-xs flex items-center gap-2 transition"
          >
            <span>📋 Xuất Phiếu May Đo (Tech Pack)</span>
          </button>
        </div>
      </div>

      {/* 2-Column Responsive Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Chọn Nhu Cầu & Giải Thích AI */}
        <div className="lg:col-span-5 space-y-6">
          {/* 1. Chọn Nhu Cầu */}
          <div className="rounded-[30px] border border-[#E6DCCD] bg-[#FFFFFF] p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#1F1B18] font-mono uppercase tracking-wider">
                1. Chọn Nhu Cầu Cơ Thể:
              </span>
              <span className="text-xs text-[#736960]">6 nhóm nhu cầu</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5">
              {ADAPTIVE_NEEDS_LIST.map((need) => {
                const isSelected = need.id === selectedNeedId;
                return (
                  <button
                    key={need.id}
                    type="button"
                    onClick={() => handleSelectNeed(need)}
                    className={`press text-left p-3.5 rounded-[22px] border transition relative flex items-start gap-3 ${
                      isSelected
                        ? 'bg-[#E5EDE2] border-[#4F7350] ring-1 ring-[#4F7350]'
                        : 'bg-[#FBF8F3] border-[#E6DCCD] hover:border-[#D8CCBA]'
                    }`}
                  >
                    <span className="text-xl p-2 rounded-xl bg-[#FFFFFF] shadow-2xs border border-[#E6DCCD]">
                      {need.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-xs text-[#1F1B18]">{need.name}</h4>
                        {isSelected && <span className="text-[#4F7350] font-bold text-xs">✓ Đang chọn</span>}
                      </div>
                      <p className="text-[11px] text-[#736960] mt-0.5 leading-relaxed">{need.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Chọn Y Phục Áp Dụng */}
          <div className="rounded-[30px] border border-[#E6DCCD] bg-[#FFFFFF] p-6 space-y-3 shadow-xs">
            <span className="text-xs font-bold text-[#1F1B18] font-mono uppercase tracking-wider block">
              2. Chọn Y Phục Cần Tùy Biến:
            </span>
            <div className="grid grid-cols-2 gap-2">
              {garments.slice(0, 4).map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => {
                    setSelectedGarment(g);
                    setPrimaryColorHex(g.baseColors[0].hex);
                  }}
                  className={`press p-3 rounded-2xl border text-xs text-left transition ${
                    selectedGarment.id === g.id
                      ? 'bg-[#F1EADF] border-[#1F1B18] text-[#1F1B18] font-bold'
                      : 'bg-[#FBF8F3] border-[#E6DCCD] text-[#736960] hover:text-[#1F1B18]'
                  }`}
                >
                  <span className="block font-bold truncate">{g.name}</span>
                  <span className="text-[10px] text-[#736960] block mt-0.5">{g.era}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 3. AI Giải Thích Thay Đổi (Cập nhật theo từng điều chỉnh) */}
          <div className="rounded-[28px] border border-[#E6DCCD] bg-[#F1EADF] p-5 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-[#1F1B18] font-bold">
              <span>💡 Gemini Stylist giải thích điều chỉnh:</span>
            </div>
            <p className="text-[#1F1B18] leading-relaxed text-xs">
              {currentAiExplanation}
            </p>
          </div>

          {/* 4. Honesty Disclaimer */}
          <div className="rounded-2xl border border-[#E6DCCD] bg-[#FBF8F3] p-4 text-[11px] text-[#736960] leading-relaxed">
            <strong className="text-[#1F1B18] block mb-0.5">⚠️ Cam kết trung thực (Data Honesty):</strong>
            Hệ thống không tự tuyên bố đây là tiêu chuẩn y khoa hoặc may đo đã được chuyên gia y tế / hội đồng chuyên môn xác nhận chính thức. Mọi thông số mang tính hỗ trợ thiết kế cá nhân hóa.
          </div>
        </div>

        {/* Right Column: Fashion Illustration với Interactive Handles */}
        <div className="lg:col-span-7 space-y-6">
          {/* Canvas Card */}
          <div className="rounded-[30px] border border-[#E6DCCD] bg-[#FFFFFF] p-5 sm:p-6 shadow-[0_4px_24px_-4px_rgba(31,27,24,0.04)] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6DCCD] text-xs">
              <span className="font-bold text-[#1F1B18] flex items-center gap-2">
                <span className="size-2 rounded-full bg-[#4F7350] animate-pulse" />
                Fashion Illustration (Kéo chỉnh trực tiếp)
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] bg-[#E5EDE2] text-[#4F7350] border border-[#CDE0C9] font-medium">
                {activeNeed.name}
              </span>
            </div>

            {/* Live Interactive SVG Canvas */}
            <div className="w-full max-w-[380px] mx-auto rounded-2xl overflow-hidden bg-[#FBF8F3] border border-[#E6DCCD] shadow-inner">
              <OutfitMockupCanvas
                garment={selectedGarment}
                primaryColor={primaryColorHex}
                pantColor="#F4F0E8"
                accessories={[]}
                character={character}
                adaptiveNeedCode={activeNeed.code}
                adaptiveAdjustments={adaptiveAdjustments}
                showHotspots={true}
              />
            </div>

            {/* Interactive Handles Panel */}
            <div className="space-y-4 pt-3 border-t border-[#E6DCCD]">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#1F1B18] font-mono uppercase tracking-wider">
                  Interactive Handles (Kéo chỉnh kích thước):
                </h4>
                <button
                  type="button"
                  onClick={() => handleSelectNeed(activeNeed)}
                  className="press text-[11px] font-semibold text-[#8A5E17] hover:underline"
                >
                  ↺ Khôi phục mặc định
                </button>
              </div>

              {/* Slider 1: Độ dài tà áo (Hem length) */}
              <div className="bg-[#FBF8F3] p-4 rounded-2xl border border-[#E6DCCD] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="hem-slider" className="font-semibold text-[#1F1B18] flex items-center gap-1.5">
                    <span>📏 Độ dài tà áo:</span>
                    <span className="text-[#736960] font-normal">(Kéo lên để áo ngắn hơn)</span>
                  </label>
                  <span className="font-mono font-bold text-[#8A5E17]">
                    -{frontHemReduction} cm
                  </span>
                </div>
                <input
                  id="hem-slider"
                  type="range"
                  min="0"
                  max="30"
                  step="1"
                  value={frontHemReduction}
                  onChange={(e) => setFrontHemReduction(Number(e.target.value))}
                  className="w-full accent-[#8A5E17] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-[#736960] font-mono">
                  <span>Dài trùm gối (0cm)</span>
                  <span>Lửng ngang đùi (-15cm)</span>
                  <span>Ngắn an toàn (-30cm)</span>
                </div>
              </div>

              {/* Slider 2: Vị trí xẻ tà (Slit position) */}
              <div className="bg-[#FBF8F3] p-4 rounded-2xl border border-[#E6DCCD] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="slit-slider" className="font-semibold text-[#1F1B18] flex items-center gap-1.5">
                    <span>✂️ Vị trí xẻ sườn (Slit):</span>
                    <span className="text-[#736960] font-normal">(Thay đổi độ mở sườn áo)</span>
                  </label>
                  <span className="font-mono font-bold text-[#4F7350]">
                    +{slitPosition} cm
                  </span>
                </div>
                <input
                  id="slit-slider"
                  type="range"
                  min="0"
                  max="25"
                  step="1"
                  value={slitPosition}
                  onChange={(e) => setSlitPosition(Number(e.target.value))}
                  className="w-full accent-[#4F7350] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-[#736960] font-mono">
                  <span>Chuẩn hông (0cm)</span>
                  <span>Nâng nhẹ (+12cm)</span>
                  <span>Nâng cao ngang eo (+25cm)</span>
                </div>
              </div>

              {/* Slider 3: Độ dài tay & Độ rộng tay */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-[#FBF8F3] p-4 rounded-2xl border border-[#E6DCCD] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <label htmlFor="sleeve-len-slider" className="font-semibold text-[#1F1B18]">
                      Độ dài tay áo:
                    </label>
                    <span className="font-mono font-bold text-[#1F1B18]">
                      {sleeveLength >= 0 ? `+${sleeveLength}` : sleeveLength} cm
                    </span>
                  </div>
                  <input
                    id="sleeve-len-slider"
                    type="range"
                    min="-15"
                    max="10"
                    step="1"
                    value={sleeveLength}
                    onChange={(e) => setSleeveLength(Number(e.target.value))}
                    className="w-full accent-[#1F1B18] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-[#736960] font-mono">
                    <span>Ngắn (-15cm)</span>
                    <span>Chuẩn (0cm)</span>
                    <span>Thụng (+10cm)</span>
                  </div>
                </div>

                <div className="bg-[#FBF8F3] p-4 rounded-2xl border border-[#E6DCCD] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <label htmlFor="sleeve-width-slider" className="font-semibold text-[#1F1B18]">
                      Độ rộng ống tay:
                    </label>
                    <span className="font-mono font-bold text-[#2E4A6B]">
                      +{sleeveWidth} cm
                    </span>
                  </div>
                  <input
                    id="sleeve-width-slider"
                    type="range"
                    min="0"
                    max="15"
                    step="1"
                    value={sleeveWidth}
                    onChange={(e) => setSleeveWidth(Number(e.target.value))}
                    className="w-full accent-[#2E4A6B] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-[#736960] font-mono">
                    <span>Ôm tay chẽn (0cm)</span>
                    <span>Rộng vừa (+8cm)</span>
                    <span>Cực rộng (+15cm)</span>
                  </div>
                </div>
              </div>

              {/* Slider 4: Độ mở cổ/vạt & Vị trí Closure */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-[#FBF8F3] p-4 rounded-2xl border border-[#E6DCCD] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <label htmlFor="opening-slider" className="font-semibold text-[#1F1B18]">
                      Độ mở cổ / tà:
                    </label>
                    <span className="font-mono font-bold text-[#1F1B18]">
                      +{openingWidth} cm
                    </span>
                  </div>
                  <input
                    id="opening-slider"
                    type="range"
                    min="0"
                    max="15"
                    step="1"
                    value={openingWidth}
                    onChange={(e) => setOpeningWidth(Number(e.target.value))}
                    className="w-full accent-[#1F1B18] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-[#736960] font-mono">
                    <span>Khép kín (0cm)</span>
                    <span>Thoáng (+8cm)</span>
                    <span>Mở rộng (+15cm)</span>
                  </div>
                </div>

                <div className="bg-[#FBF8F3] p-4 rounded-2xl border border-[#E6DCCD] space-y-2">
                  <label htmlFor="closure-select" className="text-xs font-semibold text-[#1F1B18] block">
                    Cơ chế & Vị trí đóng mở:
                  </label>
                  <select
                    id="closure-select"
                    value={closureType}
                    onChange={(e) => setClosureType(e.target.value)}
                    className="w-full rounded-xl border border-[#E6DCCD] bg-[#FFFFFF] px-3 py-2 text-xs font-semibold text-[#1F1B18] focus:border-[#1F1B18] focus:outline-none"
                  >
                    <option value="MAGNETIC">🧲 Cúc nam châm ẩn (tự hút)</option>
                    <option value="VELCRO">🩹 Khóa dán y tế siêu mềm</option>
                    <option value="ZIPPER">⚡ Khóa kéo trơn chìm</option>
                    <option value="BUTTON">🔘 Cúc bấm hạt truyền thống</option>
                  </select>
                  <p className="text-[10px] text-[#736960]">Giấu phẳng dưới nẹp vạt hữu nhậm</p>
                </div>
              </div>
            </div>

            {/* Apply Action CTA */}
            {onApplyAdaptiveOutfit && (
              <div className="pt-3 border-t border-[#E6DCCD] flex justify-end">
                <button
                  type="button"
                  onClick={() => onApplyAdaptiveOutfit(selectedGarment, [activeNeed.code])}
                  className="press min-h-[44px] px-6 py-2.5 rounded-2xl bg-[#1F1B18] hover:bg-[#38322D] text-[#FFFFFF] text-xs font-bold shadow-xs transition"
                >
                  Áp dụng bản phối may đo này →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
