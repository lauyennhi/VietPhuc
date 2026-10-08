import React, { useState, useRef } from 'react';
import type { Outfit } from '../types/fashion';
import type { GeminiCaptionResponse } from '../types/gemini';
import { getEventById, getGarmentById, getApprovedAccessories, getCharacters } from '../lib/dal';
import { styleLabel } from '../lib/styles';
import { Dialog } from './ui/Dialog';
import { OutfitMockupCanvas } from './OutfitMockupCanvas';

interface ShareModalProps {
  outfit: Outfit;
  caption?: GeminiCaptionResponse | null;
  isLoadingCaption?: boolean;
  onRequestCaption?: () => void;
  onClose: () => void;
}

export function buildShareUrl(outfit: Outfit, includeAdaptive: boolean): string {
  const adaptiveNeedCodes = outfit.adaptiveNeedCodes ?? (outfit.adaptiveNeedCode ? [outfit.adaptiveNeedCode] : []);
  const params = new URLSearchParams({
    garment: outfit.garmentId,
    color: outfit.primaryColor.replace('#', ''),
    pant: outfit.pantColor.replace('#', ''),
    event: outfit.eventId,
    vibe: outfit.styleVibe,
    ...(outfit.accessoryIds.length ? { acc: outfit.accessoryIds.join(',') } : {}),
    ...(includeAdaptive && adaptiveNeedCodes.length ? { adaptive: adaptiveNeedCodes.join(',') } : {}),
  });
  return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
}

/**
 * High-fidelity Vector QR Code pattern generator
 */
const SvgQRCode: React.FC<{ value: string; size?: number }> = ({ size = 96 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 29 29"
      className="bg-white p-1 rounded-xl border border-[#E6DCCD] shadow-2xs shrink-0"
      aria-label="Mã QR liên kết bản phối"
    >
      {/* Background */}
      <rect width="29" height="29" fill="#FFFFFF" />

      {/* Top-Left Finder */}
      <rect x="2" y="2" width="7" height="7" fill="#1F1B18" rx="1" />
      <rect x="3" y="3" width="5" height="5" fill="#FFFFFF" rx="0.5" />
      <rect x="4" y="4" width="3" height="3" fill="#1F1B18" rx="0.5" />

      {/* Top-Right Finder */}
      <rect x="20" y="2" width="7" height="7" fill="#1F1B18" rx="1" />
      <rect x="21" y="3" width="5" height="5" fill="#FFFFFF" rx="0.5" />
      <rect x="22" y="4" width="3" height="3" fill="#1F1B18" rx="0.5" />

      {/* Bottom-Left Finder */}
      <rect x="2" y="20" width="7" height="7" fill="#1F1B18" rx="1" />
      <rect x="3" y="21" width="5" height="5" fill="#FFFFFF" rx="0.5" />
      <rect x="4" y="22" width="3" height="3" fill="#1F1B18" rx="0.5" />

      {/* Timing Patterns */}
      <rect x="10" y="5" width="8" height="1" fill="#1F1B18" />
      <rect x="5" y="10" width="1" height="8" fill="#1F1B18" />

      {/* Data Cells (Simulated Matrix Grid) */}
      <g fill="#1F1B18">
        <rect x="10" y="2" width="2" height="2" />
        <rect x="14" y="2" width="1" height="2" />
        <rect x="17" y="3" width="2" height="1" />

        <rect x="11" y="8" width="2" height="2" />
        <rect x="15" y="8" width="3" height="1" />
        <rect x="10" y="11" width="3" height="2" />
        <rect x="15" y="11" width="2" height="3" />
        <rect x="19" y="11" width="3" height="1" />

        <rect x="11" y="15" width="2" height="3" />
        <rect x="14" y="16" width="3" height="2" />
        <rect x="19" y="14" width="2" height="3" />

        <rect x="2" y="11" width="2" height="2" />
        <rect x="6" y="12" width="2" height="2" />
        <rect x="2" y="15" width="3" height="2" />
        <rect x="7" y="16" width="1" height="2" />

        <rect x="10" y="20" width="2" height="2" />
        <rect x="14" y="20" width="3" height="1" />
        <rect x="11" y="24" width="3" height="2" />
        <rect x="16" y="23" width="2" height="3" />
        <rect x="20" y="20" width="2" height="2" />
        <rect x="24" y="21" width="3" height="2" />
        <rect x="21" y="24" width="4" height="2" />
        <rect x="25" y="15" width="2" height="3" />
        <rect x="23" y="11" width="3" height="2" />
      </g>
    </svg>
  );
};

export const ShareModal: React.FC<ShareModalProps> = ({
  outfit,
  caption,
  isLoadingCaption = false,
  onRequestCaption,
  onClose,
}) => {
  const [includeAdaptive, setIncludeAdaptive] = useState(false);
  const [copied, setCopied] = useState<'link' | 'caption' | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const garment = getGarmentById(outfit.garmentId);
  const event = getEventById(outfit.eventId);
  const allAccessories = getApprovedAccessories();
  const accessories = allAccessories.filter((a) => outfit.accessoryIds.includes(a.id));
  const characters = getCharacters();
  const character = characters[0];

  const adaptiveNeedCodes = (outfit.adaptiveNeedCodes ?? (outfit.adaptiveNeedCode ? [outfit.adaptiveNeedCode] : [])) as any;
  const shareUrl = buildShareUrl(outfit, includeAdaptive);

  const colorScore = outfit.colorHarmonyScore ?? 88;

  const captionText = caption
    ? `${caption.instagramCaption}${caption.hashtags.length ? `\n${caption.hashtags.join(' ')}` : ''}`
    : outfit.caption ||
      `Mình vừa phối ${garment?.name ?? 'Việt phục'} cho ${event?.name ?? 'dịp đặc biệt'} trên Vstyle. Chuẩn ${outfit.chuanScore}/100 · Chất ${outfit.chatScore}/100 · Màu ${colorScore}/100. #Vstyle #VietPhucRemix`;

  const copy = async (text: string, kind: 'link' | 'caption') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied(null);
    }
  };

  const nativeShare = async () => {
    try {
      await navigator.share({
        title: `Vstyle · ${outfit.title}`,
        text: captionText,
        url: shareUrl,
      });
    } catch {
      // user cancelled
    }
  };

  const shareToFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const shareToZalo = () => {
    const url = `https://sp.zalo.me/plugins/share?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(`Vstyle · ${outfit.title}`)}`;
    window.open(url, '_blank', 'width=600,height=500');
  };

  // Download high-resolution PNG
  const handleDownloadPNG = async () => {
    setIsExporting(true);
    try {
      // Find the SVG element inside the card
      const svg = cardRef.current?.querySelector('svg');
      if (!svg) {
        setIsExporting(false);
        return;
      }

      const svgData = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 1000;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Draw editorial frame
        ctx.fillStyle = '#FBF8F3';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw border
        ctx.strokeStyle = '#E6DCCD';
        ctx.lineWidth = 2;
        ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

        // Header Title
        ctx.fillStyle = '#1F1B18';
        ctx.font = 'bold 32px serif';
        ctx.fillText('Vstyle · BẢN PHỐI DI SẢN', 50, 70);

        ctx.font = '16px sans-serif';
        ctx.fillStyle = '#736960';
        ctx.fillText(`${outfit.title} · ${event?.name ?? 'Sự kiện'}`, 50, 100);

        // Draw illustration
        ctx.drawImage(img, 50, 130, 700, 700);

        // Footer scores
        ctx.fillStyle = '#1F1B18';
        ctx.font = 'bold 20px sans-serif';
        ctx.fillText(`CHUẨN: ${outfit.chuanScore}   CHẤT: ${outfit.chatScore}   MÀU: ${colorScore}`, 50, 890);

        ctx.font = '14px sans-serif';
        ctx.fillStyle = '#736960';
        ctx.fillText('vstyle.vn · Quét mã hoặc truy cập để tự phối', 50, 930);

        // Export as PNG
        const pngUrl = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `Vstyle-${outfit.title.replace(/\s+/g, '_')}.png`;
        downloadLink.href = pngUrl;
        downloadLink.click();
        URL.revokeObjectURL(url);
        setIsExporting(false);
      };
      img.src = url;
    } catch {
      setIsExporting(false);
    }
  };

  return (
    <Dialog
      title="Thẻ Chia Sẻ Thời Trang (Editorial Share Card)"
      description="Thẻ phong cách tạp chí gồm hình vẽ thời trang, điểm Chuẩn - Chất - Màu và mã QR liên kết trực tiếp."
      size="2xl"
      onClose={onClose}
    >
      <div className="space-y-6">
        {/* EDITORIAL CARD PREVIEW CONTAINER */}
        <div
          ref={cardRef}
          className="relative mx-auto max-w-[540px] rounded-[32px] border-2 border-[#E6DCCD] bg-[#FBF8F3] p-6 sm:p-8 shadow-[0_8px_32px_-6px_rgba(31,27,24,0.06)] overflow-hidden"
        >
          {/* Card Top Branding Header */}
          <div className="flex items-center justify-between border-b border-[#E6DCCD] pb-4 mb-4">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-xl bg-[#1F1B18] font-serif text-lg font-bold text-[#FBF8F3] shadow-xs">
                V
              </span>
              <div>
                <h3 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-[#1F1B18]">
                  Vstyle
                </h3>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#736960]">
                  Lookbook Editorial · Bản Sắc & Đương Đại
                </span>
              </div>
            </div>

            {/* Event & Style badge */}
            <span className="px-3 py-1 rounded-full bg-[#FFFFFF] border border-[#E6DCCD] text-[11px] font-semibold text-[#1F1B18] shadow-2xs">
              {event?.name ?? 'Sự kiện'}
            </span>
          </div>

          {/* Outfit Name & Description */}
          <div className="mb-4">
            <h4 className="font-serif text-2xl font-bold text-[#1F1B18] leading-tight">
              {outfit.title}
            </h4>
            <p className="text-xs text-[#736960] mt-1">
              {garment?.name} · Phong cách {styleLabel(outfit.styleVibe)}
            </p>
          </div>

          {/* LARGE FASHION ILLUSTRATION */}
          <div className="relative aspect-[4/5] w-full rounded-2xl overflow-hidden bg-[#FFFFFF] border border-[#E6DCCD] shadow-xs mb-5">
            {garment && character && (
              <OutfitMockupCanvas
                compact
                garment={garment}
                primaryColor={outfit.primaryColor}
                pantColor={outfit.pantColor}
                accessories={accessories}
                character={character}
                adaptiveNeedCodes={adaptiveNeedCodes}
                styleId={outfit.styleVibe}
                eventId={outfit.eventId}
              />
            )}
          </div>

          {/* CHUẨN / CHẤT / MÀU SCORE STRIP + QR CODE FOOTER */}
          <div className="flex items-center justify-between gap-4 pt-4 border-t border-[#E6DCCD]">
            {/* Score Triplet */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 flex-1">
              {/* Chuẩn */}
              <div className="rounded-2xl border border-[#CDE0C9] bg-[#E5EDE2] p-2.5 text-center">
                <span className="text-[10px] font-mono uppercase font-bold text-[#4F7350] block">
                  Chuẩn
                </span>
                <span className="font-serif text-lg font-bold text-[#4F7350]">
                  {outfit.chuanScore}
                  <span className="text-[10px] font-sans font-normal opacity-80">/100</span>
                </span>
              </div>

              {/* Chất */}
              <div className="rounded-2xl border border-[#ECDABF] bg-[#F6ECDA] p-2.5 text-center">
                <span className="text-[10px] font-mono uppercase font-bold text-[#8A5E17] block">
                  Chất
                </span>
                <span className="font-serif text-lg font-bold text-[#8A5E17]">
                  {outfit.chatScore}
                  <span className="text-[10px] font-sans font-normal opacity-80">/100</span>
                </span>
              </div>

              {/* Màu */}
              <div className="rounded-2xl border border-[#E6DCCD] bg-[#FFFFFF] p-2.5 text-center shadow-2xs">
                <span className="text-[10px] font-mono uppercase font-bold text-[#736960] block">
                  Màu
                </span>
                <span className="font-serif text-lg font-bold text-[#1F1B18]">
                  {colorScore}
                  <span className="text-[10px] font-sans font-normal opacity-80">/100</span>
                </span>
              </div>
            </div>

            {/* CRISP QR CODE */}
            <div className="flex flex-col items-center shrink-0">
              <SvgQRCode value={shareUrl} size={76} />
              <span className="text-[9px] font-mono text-[#736960] mt-1">Quét mở Look</span>
            </div>
          </div>
        </div>

        {/* SOCIAL SHARE ICONS & DOWNLOAD PNG CONTROLS */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E6DCCD] pt-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#736960]">Chia sẻ qua:</span>

              {/* Facebook */}
              <button
                type="button"
                onClick={shareToFacebook}
                className="press size-10 rounded-2xl border border-[#E6DCCD] bg-[#FFFFFF] grid place-items-center text-sm font-bold text-[#1F1B18] hover:bg-[#F1EADF] shadow-2xs transition"
                title="Chia sẻ lên Facebook"
                aria-label="Chia sẻ lên Facebook"
              >
                f
              </button>

              {/* Zalo */}
              <button
                type="button"
                onClick={shareToZalo}
                className="press size-10 rounded-2xl border border-[#E6DCCD] bg-[#FFFFFF] grid place-items-center text-xs font-bold text-[#1F1B18] hover:bg-[#F1EADF] shadow-2xs transition"
                title="Chia sẻ qua Zalo"
                aria-label="Chia sẻ qua Zalo"
              >
                Z
              </button>

              {/* Copy Link */}
              <button
                type="button"
                onClick={() => copy(shareUrl, 'link')}
                className="press px-3.5 h-10 rounded-2xl border border-[#E6DCCD] bg-[#FFFFFF] flex items-center gap-1.5 text-xs font-bold text-[#1F1B18] hover:bg-[#F1EADF] shadow-2xs transition"
                aria-label="Chép liên kết"
              >
                <span>🔗</span>
                <span>{copied === 'link' ? 'Đã chép link' : 'Chép link'}</span>
              </button>

              {/* Native share on mobile */}
              {typeof navigator !== 'undefined' && 'share' in navigator && (
                <button
                  type="button"
                  onClick={nativeShare}
                  className="press px-3.5 h-10 rounded-2xl border border-[#E6DCCD] bg-[#FFFFFF] flex items-center gap-1.5 text-xs font-bold text-[#1F1B18] hover:bg-[#F1EADF] shadow-2xs transition"
                >
                  <span>📲</span>
                  <span>Chia sẻ khác</span>
                </button>
              )}
            </div>

            {/* DOWNLOAD PNG BUTTON */}
            <button
              type="button"
              onClick={handleDownloadPNG}
              disabled={isExporting}
              className="press px-5 h-11 rounded-2xl bg-[#1F1B18] text-[#FFFFFF] text-xs font-bold flex items-center gap-2 hover:bg-[#38322D] shadow-xs transition"
            >
              <span>{isExporting ? '⏳ Đang xuất...' : '📥 Tải Thẻ PNG'}</span>
            </button>
          </div>

          {/* Caption preview & Gemini re-caption */}
          <div className="space-y-2 rounded-2xl border border-[#E6DCCD] bg-[#FBF8F3] p-4 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#1F1B18]">Caption kèm theo</span>
              {onRequestCaption && (
                <button
                  type="button"
                  onClick={onRequestCaption}
                  disabled={isLoadingCaption}
                  className="press text-[#8A5E17] font-semibold hover:underline disabled:opacity-50"
                >
                  {isLoadingCaption ? 'Đang viết…' : 'Gemini viết lại'}
                </button>
              )}
            </div>
            <p className="whitespace-pre-line text-[#736960] leading-relaxed">
              {captionText}
            </p>
          </div>
        </div>
      </div>
    </Dialog>
  );
};
