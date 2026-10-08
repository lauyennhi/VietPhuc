import React from 'react';
import { checkAdaptive } from '../lib/adaptive/ruleEngine';

interface AdaptiveTailoringSheetProps {
  needCode?: string;
  garmentName: string;
  onClose?: () => void;
}

export const AdaptiveTailoringSheet: React.FC<AdaptiveTailoringSheetProps> = ({
  needCode,
  garmentName,
  onClose,
}) => {
  const result = checkAdaptive(needCode);

  return (
    <div className="bg-[#FFFFFF] border border-[#E6DCCD] rounded-[28px] p-6 sm:p-7 shadow-[0_4px_24px_-4px_rgba(31,27,24,0.04)] space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-[#E6DCCD] pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-[#E5EDE2] text-[#4F7350] rounded-2xl">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
              </svg>
            </span>
            <h3 className="font-serif text-xl font-bold text-[#1F1B18]">
              Cẩm Nang Kỹ Thuật May Đo Thích Ứng
            </h3>
          </div>
          <p className="text-xs text-[#736960] mt-1.5">
            Dành cho thợ may, nhà thiết kế và người mặc y phục truyền thống Việt Nam
          </p>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="press text-[#736960] hover:text-[#1F1B18] text-base p-1.5 rounded-xl hover:bg-[#F1EADF]"
            aria-label="Đóng"
          >
            ✕
          </button>
        )}
      </div>

      {/* When no adaptive need is selected */}
      {!result.hasAdaptiveNeed && (
        <div className="bg-[#FBF8F3] p-5 rounded-2xl border border-[#E6DCCD] text-[#736960] text-xs leading-relaxed">
          Bạn chưa chọn thông số thích ứng nào. Bạn có thể chọn các chức năng hỗ trợ (ngồi xe lăn, giới hạn vận động tay, da nhạy cảm...) để xem hướng dẫn may đo kỹ thuật chi tiết.
        </div>
      )}

      {/* When adaptive need is not validated */}
      {result.hasAdaptiveNeed && !result.validated && (
        <div className="bg-[#F6ECDA] p-4.5 rounded-2xl border border-[#E4D1B5] text-[#8A5E17] text-xs space-y-1">
          <p className="font-bold">Lưu ý kiểm định:</p>
          <p>{result.message}</p>
        </div>
      )}

      {/* Validated Technical Tailoring Sheet */}
      {result.hasAdaptiveNeed && result.validated && result.tailoringSpecs && (
        <div className="space-y-5">
          <div className="bg-[#FBF8F3] p-4.5 rounded-[22px] border border-[#E6DCCD] flex items-center justify-between">
            <div>
              <span className="text-[11px] text-[#736960] font-semibold uppercase tracking-wider font-mono block">
                Nhu cầu chức năng:
              </span>
              <p className="text-base font-bold text-[#1F1B18] mt-0.5">{result.needName}</p>
              <p className="text-xs text-[#736960] mt-0.5">Áp dụng cho: <span className="font-semibold text-[#1F1B18]">{garmentName}</span></p>
            </div>
            <span className="px-3 py-1 bg-[#E5EDE2] text-[#4F7350] text-xs rounded-full border border-[#CDE0C9] font-semibold">
              ✓ Đã Kiểm Định
            </span>
          </div>

          {/* Rationale */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-[#1F1B18] uppercase tracking-wider font-mono">
              Mục đích & Cơ sở khoa học:
            </h4>
            <p className="text-xs text-[#736960] leading-relaxed bg-[#FBF8F3] p-4 rounded-2xl border border-[#E6DCCD]">
              {result.reason}
            </p>
          </div>

          {/* Technical Tailoring Specifications Grid */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-[#1F1B18] uppercase tracking-wider font-mono">
              Thông số cắt may kỹ thuật cho xưởng may:
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {result.tailoringSpecs.frontHemReduction && (
                <div className="bg-[#FBF8F3] p-3.5 rounded-2xl border border-[#E6DCCD]">
                  <span className="text-[#736960] block font-medium mb-1">Độ dài tà trước (Front Hem):</span>
                  <span className="text-[#1F1B18] font-bold">{result.tailoringSpecs.frontHemReduction}</span>
                </div>
              )}

              {result.tailoringSpecs.slitRaise && (
                <div className="bg-[#FBF8F3] p-3.5 rounded-2xl border border-[#E6DCCD]">
                  <span className="text-[#736960] block font-medium mb-1">Điểm xẻ tà (Slit Raise):</span>
                  <span className="text-[#1F1B18] font-bold">{result.tailoringSpecs.slitRaise}</span>
                </div>
              )}

              {result.tailoringSpecs.closureType && (
                <div className="bg-[#FBF8F3] p-3.5 rounded-2xl border border-[#E6DCCD]">
                  <span className="text-[#736960] block font-medium mb-1">Cơ chế đóng mở (Closures):</span>
                  <span className="text-[#1F1B18] font-medium">{result.tailoringSpecs.closureType}</span>
                </div>
              )}

              {result.tailoringSpecs.innerFabric && (
                <div className="bg-[#FBF8F3] p-3.5 rounded-2xl border border-[#E6DCCD]">
                  <span className="text-[#736960] block font-medium mb-1">Vải lót tiếp xúc da:</span>
                  <span className="text-[#1F1B18] font-medium">{result.tailoringSpecs.innerFabric}</span>
                </div>
              )}

              {result.tailoringSpecs.seamTechnique && (
                <div className="bg-[#FBF8F3] p-3.5 rounded-2xl border border-[#E6DCCD]">
                  <span className="text-[#736960] block font-medium mb-1">Kỹ thuật đường may:</span>
                  <span className="text-[#1F1B18] font-medium">{result.tailoringSpecs.seamTechnique}</span>
                </div>
              )}

              {result.tailoringSpecs.tagging && (
                <div className="bg-[#FBF8F3] p-3.5 rounded-2xl border border-[#E6DCCD]">
                  <span className="text-[#736960] block font-medium mb-1">Quy cách tem mác:</span>
                  <span className="text-[#1F1B18] font-medium">{result.tailoringSpecs.tagging}</span>
                </div>
              )}

              {result.tailoringSpecs.waistband && (
                <div className="bg-[#FBF8F3] p-3.5 rounded-2xl border border-[#E6DCCD]">
                  <span className="text-[#736960] block font-medium mb-1">Cạp quần thích ứng:</span>
                  <span className="text-[#1F1B18] font-medium">{result.tailoringSpecs.waistband}</span>
                </div>
              )}

              {result.tailoringSpecs.armhole && (
                <div className="bg-[#FBF8F3] p-3.5 rounded-2xl border border-[#E6DCCD]">
                  <span className="text-[#736960] block font-medium mb-1">Hạ nách & Vòng nách:</span>
                  <span className="text-[#1F1B18] font-medium">{result.tailoringSpecs.armhole}</span>
                </div>
              )}

              {result.tailoringSpecs.sideOpening && (
                <div className="bg-[#FBF8F3] p-3.5 rounded-2xl border border-[#E6DCCD]">
                  <span className="text-[#736960] block font-medium mb-1">Đường mở sườn trợ giúp:</span>
                  <span className="text-[#1F1B18] font-medium">{result.tailoringSpecs.sideOpening}</span>
                </div>
              )}
            </div>
          </div>

          {/* Source reference */}
          {result.source && (
            <div className="pt-3 border-t border-[#E6DCCD] text-[11px] text-[#736960] flex items-center justify-between">
              <span>Tiêu chuẩn: <strong className="text-[#1F1B18]">{result.source.title}</strong></span>
              <span className="text-[#4F7350] font-semibold">Thẩm định bởi {result.source.reviewedBy}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
