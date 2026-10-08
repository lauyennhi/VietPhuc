import React from 'react';
import type { CultureStatus } from '../../types/domain';

export interface SealStampProps {
  score: number;
  status?: CultureStatus;
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
}

export const SealStamp: React.FC<SealStampProps> = ({
  score,
  status = 'KEEP',
  size = 'md',
  animate = false,
}) => {
  const isHigh = score >= 80;
  const isModerate = score >= 50 && score < 80;

  const colorConfig = isHigh
    ? {
        border: 'border-[#4F7350]',
        bg: 'bg-[#E5EDE2]',
        text: 'text-[#4F7350]',
        tag: 'CHUẨN ĐIỂN CHẾ',
      }
    : isModerate
    ? {
        border: 'border-[#8A5E17]',
        bg: 'bg-[#F6ECDA]',
        text: 'text-[#8A5E17]',
        tag: 'GIAO THOA',
      }
    : {
        border: 'border-[#8B1E2B]',
        bg: 'bg-[#F9EBEA]',
        text: 'text-[#8B1E2B]',
        tag: 'CÁCH TÂN',
      };

  const sizeClasses: Record<string, { box: string; score: string; label: string }> = {
    sm: { box: 'size-12 rounded-xl p-1', score: 'text-base font-bold', label: 'text-[8px]' },
    md: { box: 'size-16 rounded-2xl p-1.5', score: 'text-xl font-bold', label: 'text-[9px]' },
    lg: { box: 'size-20 rounded-2xl p-2', score: 'text-2xl font-bold', label: 'text-[10px]' },
  };

  const s = sizeClasses[size] || sizeClasses.md;

  return (
    <div
      className={`border-2 border-dashed ${colorConfig.border} ${colorConfig.bg} ${s.box} flex flex-col items-center justify-center text-center select-none shadow-2xs ${
        animate ? 'animate-stamp' : ''
      }`}
    >
      <span className={`font-serif leading-none ${colorConfig.text} ${s.score}`}>
        {score}
      </span>
      <span className={`font-mono font-bold tracking-tighter uppercase mt-1 leading-none ${colorConfig.text} ${s.label}`}>
        {colorConfig.tag}
      </span>
    </div>
  );
};
