/**
 * Lookbook: saved looks, drafts, and a "Bảng tin" feed where users post a look
 * (or their own photo) with a caption and share it as an image.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Download, FilePen, Heart, ImagePlus, PenLine, Scale, Send, Share2, Sparkles, Star, Trash2, X } from 'lucide-react';
import type { Outfit } from '../../types/domain';
import { PageHeader } from '../PageHeader';
import { OutfitMockupCanvas } from '../OutfitMockupCanvas';
import { getApprovedAccessories, getCharacters, getEventById, getGarmentById } from '../../lib/dal';
import {
  addFeedPost,
  deleteFeedPost,
  deleteOutfitFromLookbook,
  getFeedPosts,
  getSavedOutfits,
  saveOutfitToLookbook,
  toggleFeedLike,
  type FeedPost,
} from '../../lib/storage/lookbook';
import { getOutfitCaptions } from '../../lib/gemini/client';
import { prepareImageForGemini } from '../../lib/image/prepareImage';

export type LookbookTab = 'SAVED' | 'DRAFT' | 'FEED';

interface LookbookPageProps {
  tab: LookbookTab;
  onTabChange: (tab: LookbookTab) => void;
  composeWith?: { outfit: Outfit; nonce: number };
  onOpenOutfit: (outfit: Outfit) => void;
  onShareOutfit: (outfit: Outfit) => void;
  onCompare?: () => void;
  onChanged: () => void;
  showToast: (message: string) => void;
}

const characters = getCharacters();
const allAccessories = getApprovedAccessories();
const ORIGIN_LABEL: Record<string, string> = { AI: 'AI tạo', STUDIO: 'Tự tạo', ADAPTIVE: 'May đo thích ứng' };

const OutfitThumb: React.FC<{ outfit: Outfit }> = ({ outfit }) => {
  const garment = getGarmentById(outfit.garmentId);
  if (!garment) return <div className="aspect-[4/5] bg-[#FAF6F0]" />;
  const character = characters.find((c) => c.id === outfit.characterId) ?? characters[0];
  const seated = outfit.adaptiveNeedCodes?.includes('WHEELCHAIR_SEATED');
  return (
    <div className="pointer-events-none">
      <OutfitMockupCanvas
        garment={garment}
        primaryColor={outfit.primaryColor}
        pantColor={outfit.pantColor}
        accessories={allAccessories.filter((a) => outfit.accessoryIds.includes(a.id))}
        character={{ ...character, posture: seated ? 'WHEELCHAIR_SEATED' : character.posture }}
        compact
      />
    </div>
  );
};

/** Renders the look's SVG mockup (or the uploaded photo) to a PNG blob for sharing. */
async function postImage(post: FeedPost, element: HTMLElement | null): Promise<Blob | null> {
  if (post.imageDataUrl) return await (await fetch(post.imageDataUrl)).blob();
  const svg = element?.querySelector('svg[viewBox="0 0 400 500"]');
  if (!svg) return null;
  const xml = new XMLSerializer().serializeToString(svg);
  const img = new Image();
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`;
  await img.decode();
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 1000;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, 800, 1000);
  return await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}

export const LookbookPage: React.FC<LookbookPageProps> = ({ tab, onTabChange, composeWith, onOpenOutfit, onShareOutfit, onCompare, onChanged, showToast }) => {
  const [outfits, setOutfits] = useState<Outfit[]>(() => getSavedOutfits());
  const [posts, setPosts] = useState<FeedPost[]>(() => getFeedPosts());
  const [composerOpen, setComposerOpen] = useState(false);
  const [composeOutfitId, setComposeOutfitId] = useState<string>('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState<string[]>(['#VietPhucRemix', '#Vstyle']);
  const [captionLoading, setCaptionLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const postRefs = useRef<Record<string, HTMLElement | null>>({});

  const saved = useMemo(() => outfits.filter((o) => (o.status ?? 'SAVED') === 'SAVED'), [outfits]);
  const drafts = useMemo(() => outfits.filter((o) => o.status === 'DRAFT'), [outfits]);
  const refresh = () => {
    setOutfits(getSavedOutfits());
    onChanged();
  };

  // "Đăng bài" from a creation flow opens the composer with that look.
  useEffect(() => {
    if (!composeWith) return;
    saveOutfitToLookbook(composeWith.outfit);
    setOutfits(getSavedOutfits());
    setComposeOutfitId(composeWith.outfit.id);
    setCaption(composeWith.outfit.caption ?? '');
    setPhoto(null);
    setComposerOpen(true);
    onTabChange('FEED');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [composeWith?.nonce]);

  const composeOutfit = outfits.find((o) => o.id === composeOutfitId);

  const writeCaption = async () => {
    if (!composeOutfit) return;
    const garment = getGarmentById(composeOutfit.garmentId);
    setCaptionLoading(true);
    try {
      const result = await getOutfitCaptions({
        garmentId: composeOutfit.garmentId,
        garmentName: garment?.name ?? 'Việt phục',
        styleTitle: composeOutfit.title,
        eventId: composeOutfit.eventId,
        eventTitle: getEventById(composeOutfit.eventId)?.name,
        chuanScore: composeOutfit.chuanScore,
        chatScore: composeOutfit.chatScore,
        vibe: composeOutfit.styleVibe,
        primaryColor: composeOutfit.primaryColor,
        accessoryIds: composeOutfit.accessoryIds,
      });
      setCaption(`${result.shortPunchyHook}\n${result.instagramCaption}`);
      setHashtags(result.hashtags);
    } finally {
      setCaptionLoading(false);
    }
  };

  const publish = () => {
    if (!composeOutfit && !photo) {
      showToast('Chọn một bản phối hoặc thêm ảnh để đăng.');
      return;
    }
    const post = addFeedPost({ outfit: composeOutfit, imageDataUrl: photo ?? undefined, caption: caption.trim(), hashtags });
    if (!post) {
      showToast('Bộ nhớ trình duyệt đầy — thử ảnh nhỏ hơn.');
      return;
    }
    setPosts(getFeedPosts());
    setComposerOpen(false);
    setPhoto(null);
    setCaption('');
    showToast('Đã đăng lên bảng tin!');
  };

  const sharePost = async (post: FeedPost) => {
    const blob = await postImage(post, postRefs.current[post.id]);
    const text = [post.caption, post.hashtags.join(' ')].filter(Boolean).join('\n');
    const file = blob ? new File([blob], 'vstyle-look.png', { type: blob.type || 'image/png' }) : null;
    try {
      if (file && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text, title: 'Vstyle · Việt phục Remix' });
        return;
      }
      if (navigator.share) {
        await navigator.share({ text, title: 'Vstyle · Việt phục Remix', url: window.location.origin });
        return;
      }
    } catch {
      // user cancelled — fall through to download
    }
    if (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'vstyle-look.png';
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 3000);
      void navigator.clipboard?.writeText(text);
      showToast('Đã tải ảnh và sao chép caption — dán lên mạng xã hội nhé.');
    }
  };

  const tabs: Array<[LookbookTab, string, number]> = [
    ['SAVED', 'Đã lưu', saved.length],
    ['DRAFT', 'Bản nháp', drafts.length],
    ['FEED', 'Bảng tin', posts.length],
  ];

  const outfitCard = (o: Outfit, isDraft: boolean) => (
    <article key={o.id} className="overflow-hidden rounded-[24px] border border-[#E8DFD3] bg-[#FFFFFF] shadow-2xs">
      <div className="bg-[#FAF6F0]"><OutfitThumb outfit={o} /></div>
      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-serif text-base font-bold leading-snug text-[#1E3443]">{o.title}</h3>
          {o.origin && <span className="shrink-0 rounded-full bg-[#F3EEE7] px-2 py-0.5 text-[11px] text-[#5C5248]">{ORIGIN_LABEL[o.origin]}</span>}
        </div>
        <div className="flex items-center gap-2 text-xs text-[#7A6F66]">
          <span>Chuẩn {o.chuanScore}</span><span>·</span><span>Gu {o.chatScore}</span>
          {o.rating ? <span className="ml-auto inline-flex items-center gap-0.5 text-[#B7791F]"><Star className="size-3.5 fill-current" aria-hidden="true" />{o.rating}</span> : null}
        </div>
        {o.userNote && <p className="text-xs italic text-[#5C5248]">“{o.userNote}”</p>}
        <div className="grid grid-cols-4 gap-1 pt-1">
          <button type="button" onClick={() => onOpenOutfit(o)} title={isDraft ? 'Hoàn thiện' : 'Mở chỉnh'} aria-label={isDraft ? 'Hoàn thiện' : 'Mở chỉnh'} className="press grid h-9 place-items-center rounded-xl border border-[#E8DFD3] text-[#1E3443] hover:bg-[#FAF6F0]"><PenLine className="size-4" /></button>
          {isDraft ? (
            <button type="button" title="Chuyển sang Đã lưu" aria-label="Chuyển sang Đã lưu" onClick={() => { saveOutfitToLookbook({ ...o, status: 'SAVED' }); refresh(); showToast('Đã chuyển vào Đã lưu.'); }} className="press grid h-9 place-items-center rounded-xl border border-[#E8DFD3] text-[#1E3443] hover:bg-[#FAF6F0]"><Heart className="size-4" /></button>
          ) : (
            <button type="button" title="Đăng bài" aria-label="Đăng bài" onClick={() => { setComposeOutfitId(o.id); setPhoto(null); setCaption(''); setComposerOpen(true); onTabChange('FEED'); }} className="press grid h-9 place-items-center rounded-xl border border-[#E8DFD3] text-[#1E3443] hover:bg-[#FAF6F0]"><Send className="size-4" /></button>
          )}
          <button type="button" title="Chia sẻ" aria-label="Chia sẻ" onClick={() => onShareOutfit(o)} className="press grid h-9 place-items-center rounded-xl border border-[#E8DFD3] text-[#1E3443] hover:bg-[#FAF6F0]"><Share2 className="size-4" /></button>
          <button type="button" title="Xóa" aria-label="Xóa" onClick={() => { deleteOutfitFromLookbook(o.id); refresh(); }} className="press grid h-9 place-items-center rounded-xl border border-[#E8DFD3] text-[#A33A2B] hover:bg-[#FBEFEE]"><Trash2 className="size-4" /></button>
        </div>
      </div>
    </article>
  );

  const empty = (text: string) => <p className="rounded-[24px] border border-dashed border-[#D8CCBA] p-10 text-center text-[#7A6F66]">{text}</p>;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Lookbook"
        title="Lookbook Việt phục của bạn"
        subtitle="Lưu bản phối, giữ bản nháp và đăng lên bảng tin để chia sẻ."
        aside={(
          <div className="flex gap-2">
            {onCompare && saved.length >= 2 && (
              <button type="button" onClick={onCompare} className="press inline-flex min-h-11 items-center gap-2 rounded-full border border-[#E8DFD3] bg-[#FFFFFF] px-5 text-sm font-semibold text-[#1E3443]">
                <Scale className="size-4" aria-hidden="true" /> So sánh
              </button>
            )}
            <button type="button" onClick={() => { setComposerOpen(true); onTabChange('FEED'); }} className="press inline-flex min-h-11 items-center gap-2 rounded-full bg-[#1E3443] px-5 text-sm font-semibold text-[#FFFFFF]">
              <Send className="size-4" aria-hidden="true" /> Đăng bài
            </button>
          </div>
        )}
      />

      <div className="flex gap-1 border-b border-[#E8DFD3]" role="tablist">
        {tabs.map(([id, label, count]) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => onTabChange(id)} className={`press -mb-px border-b-2 px-4 py-2.5 text-sm font-semibold transition ${tab === id ? 'border-[#1E3443] text-[#1E3443]' : 'border-transparent text-[#7A6F66] hover:text-[#1E3443]'}`}>
            {label} <span className="ml-1 rounded-full bg-[#F3EEE7] px-1.5 text-xs">{count}</span>
          </button>
        ))}
      </div>

      {tab === 'SAVED' && (saved.length ? <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">{saved.map((o) => outfitCard(o, false))}</div> : empty('Chưa có bản phối nào. Tạo một bộ trong Studio rồi bấm “Lưu Lookbook”.'))}
      {tab === 'DRAFT' && (drafts.length ? <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">{drafts.map((o) => outfitCard(o, true))}</div> : empty('Chưa có bản nháp. Bấm “Lưu nháp” khi đang phối dở.'))}

      {tab === 'FEED' && (
        <div className="mx-auto max-w-2xl space-y-5">
          {composerOpen && (
            <section className="space-y-3 rounded-[24px] border border-[#E8DFD3] bg-[#FFFFFF] p-5 animate-rise" aria-label="Đăng bài">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-lg font-bold text-[#1E3443]">Bài đăng mới</h2>
                <button type="button" onClick={() => setComposerOpen(false)} aria-label="Đóng" className="press rounded-lg p-1 text-[#7A6F66] hover:bg-[#FAF6F0]"><X className="size-5" /></button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select value={composeOutfitId} onChange={(e) => setComposeOutfitId(e.target.value)} className="min-h-10 flex-1 rounded-xl border border-[#E8DFD3] bg-[#FAF6F0] px-3 text-sm text-[#1E3443]" aria-label="Chọn bản phối">
                  <option value="">— Chọn bản phối —</option>
                  {saved.map((o) => <option key={o.id} value={o.id}>{o.title}</option>)}
                </select>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  if (!file) return;
                  try {
                    const prepared = await prepareImageForGemini(file);
                    setPhoto(`data:${prepared.image.mimeType};base64,${prepared.image.data}`);
                  } catch (error) {
                    showToast(error instanceof Error ? error.message : 'Không đọc được ảnh.');
                  }
                }} />
                <button type="button" onClick={() => fileRef.current?.click()} className="press inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-[#E8DFD3] px-3 text-sm text-[#1E3443] hover:bg-[#FAF6F0]"><ImagePlus className="size-4" aria-hidden="true" /> {photo ? 'Đổi ảnh' : 'Ảnh của bạn'}</button>
              </div>
              <div className="grid grid-cols-[96px_1fr] gap-3">
                <div className="overflow-hidden rounded-xl border border-[#E8DFD3] bg-[#FAF6F0]">
                  {photo ? <img src={photo} alt="Ảnh đăng" className="aspect-[4/5] w-full object-cover" /> : composeOutfit ? <OutfitThumb outfit={composeOutfit} /> : <div className="aspect-[4/5]" />}
                </div>
                <div className="space-y-2">
                  <textarea value={caption} onChange={(e) => setCaption(e.target.value.slice(0, 500))} rows={4} placeholder="Viết vài dòng về bản phối của bạn…" className="w-full resize-none rounded-xl border border-[#E8DFD3] bg-[#FAF6F0] p-3 text-sm text-[#1E3443] outline-none focus:border-[#1E3443]" />
                  <p className="text-xs text-[#4F7350]">{hashtags.join(' ')}</p>
                </div>
              </div>
              <div className="flex flex-wrap justify-between gap-2">
                <button type="button" onClick={() => void writeCaption()} disabled={!composeOutfit || captionLoading} className="press inline-flex min-h-10 items-center gap-1.5 rounded-full border border-[#E8DFD3] px-4 text-sm font-semibold text-[#1E3443] disabled:opacity-40"><Sparkles className="size-4 text-[#C4553F]" aria-hidden="true" /> {captionLoading ? 'AI đang viết…' : 'AI viết caption'}</button>
                <button type="button" onClick={publish} className="press inline-flex min-h-10 items-center gap-1.5 rounded-full bg-[#1E3443] px-5 text-sm font-semibold text-[#FFFFFF]"><Send className="size-4" aria-hidden="true" /> Đăng</button>
              </div>
            </section>
          )}

          {posts.length === 0 && !composerOpen && empty('Bảng tin còn trống — đăng bản phối đầu tiên của bạn!')}
          {posts.map((post) => (
            <article key={post.id} ref={(el) => { postRefs.current[post.id] = el; }} className="overflow-hidden rounded-[24px] border border-[#E8DFD3] bg-[#FFFFFF]">
              <div className="flex items-center gap-3 p-4">
                <span className="grid size-9 place-items-center rounded-full bg-[#1E3443] font-serif text-sm font-bold text-[#FFFFFF]">V</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[#1E3443]">Bạn</p>
                  <p className="text-xs text-[#7A6F66]">{new Date(post.createdAt).toLocaleString('vi-VN')}{post.outfit ? ` · ${post.outfit.title}` : ''}</p>
                </div>
                <button type="button" aria-label="Xóa bài" onClick={() => setPosts(deleteFeedPost(post.id))} className="press rounded-lg p-2 text-[#7A6F66] hover:bg-[#FBEFEE] hover:text-[#A33A2B]"><Trash2 className="size-4" /></button>
              </div>
              <div className="mx-auto max-w-md bg-[#FAF6F0]">
                {post.imageDataUrl ? <img src={post.imageDataUrl} alt="Ảnh bài đăng" className="w-full object-cover" /> : post.outfit ? <OutfitThumb outfit={post.outfit} /> : null}
              </div>
              <div className="space-y-2 p-4">
                {post.caption && <p className="whitespace-pre-line text-sm leading-relaxed text-[#1E3443]">{post.caption}</p>}
                <p className="text-sm text-[#4F7350]">{post.hashtags.join(' ')}</p>
                <div className="flex gap-2 pt-1">
                  <button type="button" aria-pressed={post.liked} onClick={() => setPosts(toggleFeedLike(post.id))} className={`press inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-sm ${post.liked ? 'border-[#C4553F] text-[#C4553F]' : 'border-[#E8DFD3] text-[#5C5248]'}`}><Heart className={`size-4 ${post.liked ? 'fill-current' : ''}`} aria-hidden="true" /> {post.likes}</button>
                  <button type="button" onClick={() => void sharePost(post)} className="press inline-flex min-h-9 items-center gap-1.5 rounded-full border border-[#E8DFD3] px-3 text-sm text-[#5C5248]"><Share2 className="size-4" aria-hidden="true" /> Chia sẻ ảnh</button>
                  {post.outfit && <button type="button" onClick={() => onOpenOutfit(post.outfit!)} className="press inline-flex min-h-9 items-center gap-1.5 rounded-full border border-[#E8DFD3] px-3 text-sm text-[#5C5248]"><FilePen className="size-4" aria-hidden="true" /> Mặc thử</button>}
                </div>
              </div>
            </article>
          ))}
          {posts.length > 0 && <p className="flex items-center justify-center gap-1.5 text-xs text-[#8A8075]"><Download className="size-3.5" aria-hidden="true" /> Bảng tin lưu trên thiết bị này; dùng “Chia sẻ ảnh” để đăng lên mạng xã hội.</p>}
        </div>
      )}
    </div>
  );
};
