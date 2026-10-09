/**
 * Studio: two ways to create — "AI tạo" (describe it) and "Tự tạo" (build it yourself).
 */

import React from 'react';
import { PenTool, Sparkles } from 'lucide-react';
import type { Outfit } from '../../types/domain';
import type { Look } from '../../lib/look';
import { AiDesigner } from './AiDesigner';
import { StudioEditor } from './StudioEditor';
import { PageHeader } from '../PageHeader';

export type StudioTab = 'AI' | 'MANUAL';

interface StudioPageProps {
  tab: StudioTab;
  onTabChange: (tab: StudioTab) => void;
  prompt?: { text: string; nonce: number; photo?: File };
  editLook?: { look: Look; nonce: number };
  imageRenderAvailable: boolean | null;
  showToast: (message: string) => void;
  onEditLook: (look: Look) => void;
  onOpen3D: (look: Look) => void;
  onSaved: () => void;
  onPost: (outfit: Outfit) => void;
  onShare: (outfit: Outfit) => void;
}

export const StudioPage: React.FC<StudioPageProps> = ({
  tab,
  onTabChange,
  prompt,
  editLook,
  imageRenderAvailable,
  showToast,
  onEditLook,
  onOpen3D,
  onSaved,
  onPost,
  onShare,
}) => (
  <div className="space-y-8">
    <PageHeader
      eyebrow="Khám phá · Studio"
      title="Studio phối Việt phục"
      subtitle={tab === 'AI' ? 'Kể dịp và gu của bạn — AI thiết kế bộ phối và giải thích từng lựa chọn.' : 'Tự tay chọn nhân vật, áo, màu và kéo chỉnh dáng áo.'}
      aside={(
        <div className="flex rounded-full border border-[#E8DFD3] bg-[#FFFFFF] p-1 shadow-2xs" role="tablist" aria-label="Cách tạo">
          {([
            ['AI', 'AI tạo', Sparkles],
            ['MANUAL', 'Tự tạo', PenTool],
          ] as const).map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => onTabChange(id)}
              className={`press inline-flex min-h-10 items-center gap-2 rounded-full px-5 text-sm font-semibold transition ${tab === id ? 'bg-[#1E3443] text-[#FFFFFF]' : 'text-[#5C5248] hover:text-[#1E3443]'}`}
            >
              <Icon className="size-4" aria-hidden="true" /> {label}
            </button>
          ))}
        </div>
      )}
    />

    {tab === 'AI' ? (
      <AiDesigner
        key={prompt?.nonce ?? 0}
        initialPrompt={prompt?.text}
        initialPhoto={prompt?.photo}
        imageRenderAvailable={imageRenderAvailable}
        showToast={showToast}
        onEditLook={onEditLook}
        onOpen3D={onOpen3D}
        onSaved={onSaved}
        onPost={onPost}
        onShare={onShare}
      />
    ) : (
      <StudioEditor
        key={editLook?.nonce ?? 0}
        initialLook={editLook?.look}
        showToast={showToast}
        onSaved={onSaved}
        onPost={onPost}
        onShare={onShare}
        onOpen3D={onOpen3D}
      />
    )}
  </div>
);
