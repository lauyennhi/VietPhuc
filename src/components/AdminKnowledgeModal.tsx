import React, { useState } from 'react';
import { getGarments, getCultureRules, getAdaptiveAdjustments, getAllSources } from '../lib/dal';
import { Dialog } from './ui/Dialog';

interface AdminKnowledgeModalProps {
  onClose: () => void;
}

export const AdminKnowledgeModal: React.FC<AdminKnowledgeModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'GARMENTS' | 'RULES' | 'ADAPTIVE' | 'SOURCES'>('GARMENTS');

  const garments = getGarments();
  const rules = getCultureRules();
  const adaptive = getAdaptiveAdjustments();
  const sources = getAllSources();

  return (
    <Dialog bare title="Cơ sở tri thức văn hóa" size="5xl" onClose={onClose}>
      <div className="bg-[#FFFFFF] border border-[#E6DCCD] rounded-t-[30px] sm:rounded-[30px] w-full p-6 sm:p-8 space-y-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E6DCCD] pb-4">
          <div>
            <h3 className="font-serif text-2xl font-bold text-[#1F1B18]">
              Cơ sở tri thức văn hóa
            </h3>
            <p className="text-xs sm:text-sm text-[#736960] mt-1">
              Minh bạch hóa cơ sở dữ liệu văn hóa, quy tắc thẩm định và phân cấp APPROVED / DRAFT
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="press grid size-10 place-items-center rounded-2xl text-[#736960] hover:bg-[#F1EADF] hover:text-[#1F1B18] transition"
          >
            ✕
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-2 border-b border-[#E6DCCD] pb-3 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveTab('GARMENTS')}
            className={`press min-h-[38px] px-3.5 py-1.5 rounded-xl transition ${
              activeTab === 'GARMENTS' ? 'bg-[#1F1B18] text-[#FFFFFF]' : 'bg-[#FBF8F3] text-[#736960] hover:text-[#1F1B18] border border-[#E6DCCD]'
            }`}
          >
            Y Phục ({garments.length})
          </button>
          <button
            onClick={() => setActiveTab('RULES')}
            className={`press min-h-[38px] px-3.5 py-1.5 rounded-xl transition ${
              activeTab === 'RULES' ? 'bg-[#1F1B18] text-[#FFFFFF]' : 'bg-[#FBF8F3] text-[#736960] hover:text-[#1F1B18] border border-[#E6DCCD]'
            }`}
          >
            Bộ Quy Tắc Văn Hóa ({rules.length})
          </button>
          <button
            onClick={() => setActiveTab('ADAPTIVE')}
            className={`press min-h-[38px] px-3.5 py-1.5 rounded-xl transition ${
              activeTab === 'ADAPTIVE' ? 'bg-[#1F1B18] text-[#FFFFFF]' : 'bg-[#FBF8F3] text-[#736960] hover:text-[#1F1B18] border border-[#E6DCCD]'
            }`}
          >
            Quy Chuẩn Thích Ứng ({adaptive.length})
          </button>
          <button
            onClick={() => setActiveTab('SOURCES')}
            className={`press min-h-[38px] px-3.5 py-1.5 rounded-xl transition ${
              activeTab === 'SOURCES' ? 'bg-[#1F1B18] text-[#FFFFFF]' : 'bg-[#FBF8F3] text-[#736960] hover:text-[#1F1B18] border border-[#E6DCCD]'
            }`}
          >
            Thư Tịch & Nguồn Khảo Cứu ({sources.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="space-y-4 text-xs max-h-[60vh] overflow-y-auto pr-1">
          {/* 1. Garments Management */}
          {activeTab === 'GARMENTS' && (
            <div className="space-y-3">
              {garments.map((g) => (
                <div key={g.id} className="bg-[#FBF8F3] p-4.5 rounded-[20px] border border-[#E6DCCD] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#1F1B18] text-sm">{g.name} ({g.id})</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#E5EDE2] text-[#4F7350] border border-[#CDE0C9]">
                      {g.status}
                    </span>
                  </div>
                  <p className="text-[#736960] leading-relaxed">{g.culturalMeaning}</p>
                  <div className="text-[#736960] text-[11px] font-mono">
                    Nguồn thẩm định: {g.sourceIds.join(', ')}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 2. Cultural Rules */}
          {activeTab === 'RULES' && (
            <div className="space-y-3">
              {rules.map((r) => (
                <div key={r.id} className="bg-[#FBF8F3] p-4.5 rounded-[20px] border border-[#E6DCCD] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#1F1B18] text-sm">{r.name}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                      r.severity === 'WARNING'
                        ? 'bg-[#F9EBEA] text-[#8B1E2B] border border-[#F0CDCB]'
                        : 'bg-[#F6ECDA] text-[#8A5E17] border border-[#E4D1B5]'
                    }`}>
                      {r.severity} (Trọng số: {r.weight})
                    </span>
                  </div>
                  <p className="text-[#736960] leading-relaxed">{r.description}</p>
                  <div className="text-[#736960] text-[11px] font-mono">
                    Nguồn khảo cứu: {r.sourceId} • Đã thẩm duyệt: {r.verified ? '✓ ĐÚNG' : 'CHỜ DUYỆT'}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 3. Adaptive Standards */}
          {activeTab === 'ADAPTIVE' && (
            <div className="space-y-3">
              {adaptive.map((a) => (
                <div key={a.id} className="bg-[#FBF8F3] p-4.5 rounded-[20px] border border-[#E6DCCD] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#1F1B18] text-sm">{a.needName} ({a.needCode})</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#E5EDE2] text-[#4F7350] border border-[#CDE0C9]">
                      VALIDATED = {String(a.validated)}
                    </span>
                  </div>
                  <p className="text-[#736960]"><strong>Kỹ thuật điều chỉnh:</strong> {a.adjustment}</p>
                  <p className="text-[#736960]"><strong>Cơ sở chức năng:</strong> {a.reason}</p>
                </div>
              ))}
            </div>
          )}

          {/* 4. Sources */}
          {activeTab === 'SOURCES' && (
            <div className="space-y-3">
              {sources.map((s) => (
                <div key={s.id} className="bg-[#FBF8F3] p-4.5 rounded-[20px] border border-[#E6DCCD] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#1F1B18] text-sm">{s.title}</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#E5EDE2] text-[#4F7350] border border-[#CDE0C9]">
                      ✓ Đã Thẩm Định
                    </span>
                  </div>
                  <div className="text-[#736960]">
                    Tác giả/NXB: <strong className="text-[#1F1B18]">{s.publisher}</strong> ({s.year}) • Thẩm định bởi: <strong className="text-[#1F1B18]">{s.reviewedBy}</strong>
                  </div>
                  {s.note && <div className="text-[#736960] italic leading-relaxed">{s.note}</div>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-[#E6DCCD] flex justify-end">
          <button
            onClick={onClose}
            className="press min-h-[44px] px-5 py-2 bg-[#1F1B18] hover:bg-[#38322D] text-[#FFFFFF] text-xs font-bold rounded-2xl shadow-xs transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </Dialog>
  );
};
