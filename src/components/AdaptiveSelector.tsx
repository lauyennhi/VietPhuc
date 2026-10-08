import React from 'react';
import { getAdaptiveNeeds } from '../lib/dal';

interface AdaptiveSelectorProps {
  selectedNeedCodes: string[];
  onChange: (codes: string[]) => void;
  onOpenTailoringSheet?: (needCode: string) => void;
  onContinue?: () => void;
  onOpenAdaptiveStudio?: () => void;
}

const ADAPTIVE_ITEMS = [
  {
    code: 'NONE',
    name: 'Không cần điều chỉnh',
    icon: '✨',
    desc: 'Y phục may đo theo phom dáng tiêu chuẩn nguyên bản.',
    explanation: 'Giữ nguyên phom dáng truyền thống với các thông số cắt may chuẩn mực.',
  },
  {
    code: 'WHEELCHAIR_SEATED',
    name: 'Xe lăn / Tư thế ngồi thường xuyên',
    icon: '♿',
    desc: 'Thu ngắn tà trước chống quấn bánh xe, nâng đường xẻ sườn chống căng gập khi ngồi.',
    explanation: 'Hệ thống tự động điều chỉnh tà trước ngắn hơn 10-15cm và nâng cao điểm xẻ sườn để tà áo buông rủ phẳng phiu khi ngồi.',
  },
  {
    code: 'LIMITED_HAND_MOBILITY',
    name: 'Khó cài cúc / Vận động ngón tay',
    icon: '🧲',
    desc: 'Thay cúc cài bấm nhỏ bằng nam châm tự hút hoặc dải khóa dán mềm giấu kín trong nẹp.',
    explanation: 'Bảo lưu cúc tết trang trí bên ngoài trong khi hệ thống khóa nam châm tự hút bên trong giúp người mặc thao tác độc lập 100%.',
  },
  {
    code: 'LIMITED_MOBILITY',
    name: 'Hạn chế vận động khớp tay / vai',
    icon: '🤲',
    desc: 'Vòng nách may hạ sâu, nẹp sườn mở rộng dễ dàng xỏ tay mà không cần giơ cao.',
    explanation: 'Tăng biên độ cử động vòng nách thêm 4-6cm giúp mặc và cởi y phục nhẹ nhàng, không gây đau mỏi khớp.',
  },
  {
    code: 'MATERIAL_SENSITIVITY',
    name: 'Hỗ trợ xúc giác & da nhạy cảm',
    icon: '🌿',
    desc: 'Lớp lót 100% lụa tơ tằm tự nhiên, đường may cuộn lộn French Seam giấu chỉ hoàn toàn.',
    explanation: 'Triệt tiêu 100% gân chỉ cọ xát với da, không tem gáy, in thông số nhiệt êm dịu tối đa.',
  },
  {
    code: 'LIMITED_STANDING',
    name: 'Nhu cầu chuyển đổi tư thế & khác',
    icon: '🚶',
    desc: 'Cạp quần nửa sau luồn chun co giãn mềm mại, gấu áo cách mặt đất khoảng cách an toàn.',
    explanation: 'Tăng sự linh hoạt vùng hông bụng, chống nguy cơ vấp dẫm gấu áo khi đứng lên ngồi xuống.',
  },
];

export const AdaptiveSelector: React.FC<AdaptiveSelectorProps> = ({
  selectedNeedCodes,
  onChange,
  onOpenTailoringSheet,
  onContinue,
  onOpenAdaptiveStudio,
}) => {
  const isNone = selectedNeedCodes.length === 0 || selectedNeedCodes.includes('NONE');

  const handleToggle = (code: string) => {
    if (code === 'NONE') {
      onChange([]);
      return;
    }
    const filtered = selectedNeedCodes.filter((c) => c !== 'NONE');
    if (filtered.includes(code)) {
      onChange(filtered.filter((c) => c !== code));
    } else {
      onChange([...filtered, code]);
    }
  };

  const selectedItem = ADAPTIVE_ITEMS.find((item) => selectedNeedCodes.includes(item.code));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-[24px] border border-[#E6DCCD] bg-[#FBF8F3] p-4 sm:p-5">
        <h4 className="font-serif font-bold text-base text-[#1F1B18]">
          Cá Nhân Hóa Theo Nhu Cầu Cơ Thể
        </h4>
        <p className="text-xs text-[#736960] mt-1 leading-relaxed">
          Vstyle tôn trọng sự đa dạng của mọi cơ thể. Các điều chỉnh kỹ thuật giúp bạn mặc y phục tự chủ, thoải mái nhất mà vẫn bảo lưu trọn vẹn nét tôn nghiêm cổ truyền.
        </p>
      </div>

      {/* Grid of Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {ADAPTIVE_ITEMS.map((item) => {
          const isSelected = item.code === 'NONE' ? isNone : selectedNeedCodes.includes(item.code);

          return (
            <button
              key={item.code}
              type="button"
              onClick={() => handleToggle(item.code)}
              className={`press text-left p-4 rounded-[22px] border transition flex items-start gap-3.5 ${
                isSelected
                  ? 'border-[#1F1B18] bg-[#F1EADF] shadow-xs ring-1 ring-[#1F1B18]'
                  : 'border-[#E6DCCD] bg-[#FFFFFF] hover:border-[#D8CCBA]'
              }`}
            >
              <span className="text-2xl shrink-0">{item.icon}</span>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-serif font-bold text-xs sm:text-sm text-[#1F1B18]">
                    {item.name}
                  </span>
                  {isSelected && (
                    <span className="text-xs font-bold text-[#1F1B18]">✓</span>
                  )}
                </div>
                <p className="text-[11px] text-[#736960] leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* System Explanation after Selection */}
      {!isNone && selectedItem && (
        <div className="rounded-[22px] bg-[#E5EDE2] border border-[#CDE0C9] p-4 text-xs text-[#1F1B18] space-y-1 animate-fadeIn">
          <div className="flex items-center gap-2 font-bold text-[#4F7350]">
            <span>💡 Hệ thống tự điều chỉnh cho y phục của bạn:</span>
          </div>
          <p className="text-xs leading-relaxed text-[#1F1B18]">
            {selectedItem.explanation}
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#E6DCCD]">
        {/* Secondary: Open Tailoring Sheet / Adaptive Studio */}
        {!isNone && (
          <button
            type="button"
            onClick={() => {
              if (onOpenTailoringSheet && selectedNeedCodes[0]) {
                onOpenTailoringSheet(selectedNeedCodes[0]);
              } else if (onOpenAdaptiveStudio) {
                onOpenAdaptiveStudio();
              }
            }}
            className="press px-4 py-2.5 rounded-xl border border-[#E6DCCD] bg-[#FFFFFF] text-xs font-semibold text-[#1F1B18] hover:bg-[#F1EADF] transition flex items-center gap-1.5"
          >
            <span>📋 Chỉnh chi tiết trong Adaptive Fashion →</span>
          </button>
        )}

        <div className="ml-auto">
          {onContinue && (
            <button
              type="button"
              onClick={onContinue}
              className="btn-primary text-xs min-h-[44px] px-6"
            >
              Tiếp tục phối →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
