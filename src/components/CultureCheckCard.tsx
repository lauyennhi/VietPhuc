import React from 'react';
import type { CultureCheckResult } from '../types/fashion';
import { getSourceById } from '../lib/dal';
import { SealStamp } from './ui/SealStamp';

interface CultureCheckCardProps {
  result: CultureCheckResult;
}

export const CultureCheckCard: React.FC<CultureCheckCardProps> = ({ result }) => {
  const isApproved = result.status === 'KEEP';
  const isConsider = result.status === 'CONSIDER';

  const statusBadge = isApproved ? (
    <span className="px-3 py-1 bg-[#E5EDE2] text-[#4F7350] border border-[#CDE0C9] rounded-full text-xs font-bold inline-flex items-center gap-1.5">
      <span>✓</span> Chuẩn Quy Thức
    </span>
  ) : isConsider ? (
    <span className="px-3 py-1 bg-[#FDF5E6] text-[#A66700] border border-[#F3DFC1] rounded-full text-xs font-bold inline-flex items-center gap-1.5">
      <span>⚠️</span> Cần Cân Nhắc
    </span>
  ) : (
    <span className="px-3 py-1 bg-[#F9EBEA] text-[#8B1E2B] border border-[#F0CDCB] rounded-full text-xs font-bold inline-flex items-center gap-1.5">
      <span>✗</span> Cảnh Báo Quy Thức
    </span>
  );

  return (
    <div className="bg-[#FFFFFF] border border-[#E6DCCD] rounded-[28px] p-6 sm:p-7 shadow-[0_4px_24px_-4px_rgba(31,27,24,0.04)] relative overflow-hidden space-y-5">
      {/* Top Bar with Seal Stamp */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-[#F1EADF] text-[#8B1E2B] rounded-xl text-base">📜</span>
            <h3 className="font-serif text-xl font-bold text-[#1F1B18]">
              Thẩm Định Văn Hóa & Lịch Sử
            </h3>
          </div>
          <p className="text-xs text-[#736960] mt-1">
            Đối chiếu tự động với nguồn nghiên cứu cổ phục Đại Việt & triều Nguyễn.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {statusBadge}
          {isApproved && (
            <div className="hidden sm:block">
              <SealStamp score={result.score} status={result.status} size="sm" />
            </div>
          )}
        </div>
      </div>

      {/* Cultural Score Progress */}
      <div className="bg-[#FBF8F3] p-4.5 rounded-2xl border border-[#E6DCCD] flex items-center justify-between">
        <div>
          <span className="text-[11px] font-mono uppercase text-[#736960] tracking-wider block">
            Điểm Hòa Hợp Di Sản
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="font-serif text-3xl font-extrabold text-[#8B1E2B]">
              {result.score}
            </span>
            <span className="text-xs text-[#736960]">/ 100</span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs font-medium text-[#1F1B18] block">
            Quy chuẩn bất di bất dịch:
          </span>
          <span className={`text-xs font-bold ${result.nonNegotiablesSatisfied ? 'text-[#4F7350]' : 'text-[#8B1E2B]'}`}>
            {result.nonNegotiablesSatisfied ? '✓ Đạt yêu cầu nghiêm ngặt' : '⚠️ Vi phạm quy chuẩn'}
          </span>
        </div>
      </div>

      {/* Reasons & Cultural Advices */}
      {result.reasons && result.reasons.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-[#1F1B18] uppercase tracking-wider font-mono">
            Nhận định & Khuyến nghị chuyên môn:
          </h4>
          <ul className="space-y-2">
            {result.reasons.map((reason, idx) => (
              <li
                key={idx}
                className="text-xs text-[#1F1B18] bg-[#FBF8F3] border border-[#E6DCCD] p-3.5 rounded-xl flex items-start gap-2.5 leading-relaxed"
              >
                <span className="text-[#8B1E2B] font-bold mt-0.5">•</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Retained Traditional Characteristics */}
      {result.retainedCharacteristics && result.retainedCharacteristics.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-[#E6DCCD]/60">
          <h4 className="text-xs font-bold text-[#1F1B18] uppercase tracking-wider font-mono">
            Đặc trưng cốt lõi được bảo lưu:
          </h4>
          <div className="flex flex-wrap gap-2">
            {result.retainedCharacteristics.map((char, idx) => (
              <span
                key={idx}
                className="px-3 py-1.5 bg-[#F1EADF] text-[#1F1B18] rounded-xl text-xs font-medium border border-[#E6DCCD]"
              >
                ✓ {char}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Verified Historical Sources Reference */}
      {result.sourceIds && result.sourceIds.length > 0 && (
        <div className="pt-2 border-t border-[#E6DCCD]/60 text-[11px] text-[#736960] flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="font-semibold text-[#1F1B18]">Tài liệu tham chiếu:</span>
          {result.sourceIds.map((srcId) => {
            const src = getSourceById(srcId);
            return (
              <span key={srcId} className="italic underline underline-offset-2">
                {src ? `${src.title} (${src.author})` : srcId}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
};
