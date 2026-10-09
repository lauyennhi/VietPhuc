import React, { useState } from 'react';
import { BookOpen, Trophy } from 'lucide-react';
import type { Garment } from '../../types/domain';
import { PageHeader } from '../PageHeader';
import { GarmentDiscovery } from '../GarmentDiscovery';
import { Quiz } from './Quiz';

interface KnowledgePageProps {
  tab: 'GARMENTS' | 'QUIZ';
  onTabChange: (tab: 'GARMENTS' | 'QUIZ') => void;
  onStyleGarment: (garment: Garment) => void;
  onViewDetails: (garment: Garment) => void;
}

export const KnowledgePage: React.FC<KnowledgePageProps> = ({ tab, onTabChange, onStyleGarment, onViewDetails }) => (
  <div className="space-y-8">
    <PageHeader
      eyebrow="Kiến thức"
      title={tab === 'QUIZ' ? 'Thử sức hiểu biết Việt phục' : 'Các loại Việt phục'}
      subtitle={tab === 'QUIZ' ? '8 câu hỏi nhanh, đáp án lấy từ dữ liệu y phục đã thẩm định.' : 'Nguồn gốc, ý nghĩa và quy tắc không được làm sai của từng loại áo.'}
      aside={(
        <div className="flex rounded-full border border-[#E8DFD3] bg-[#FFFFFF] p-1 shadow-2xs" role="tablist">
          {([
            ['GARMENTS', 'Tìm hiểu', BookOpen],
            ['QUIZ', 'Quiz', Trophy],
          ] as const).map(([id, label, Icon]) => (
            <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => onTabChange(id)} className={`press inline-flex min-h-10 items-center gap-2 rounded-full px-5 text-sm font-semibold transition ${tab === id ? 'bg-[#1E3443] text-[#FFFFFF]' : 'text-[#5C5248] hover:text-[#1E3443]'}`}>
              <Icon className="size-4" aria-hidden="true" /> {label}
            </button>
          ))}
        </div>
      )}
    />
    {tab === 'GARMENTS' ? (
      <GarmentDiscovery onSelectGarment={onStyleGarment} onViewDetails={onViewDetails} />
    ) : (
      <Quiz onExplore={() => onTabChange('GARMENTS')} />
    )}
  </div>
);
