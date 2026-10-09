/**
 * Lookbook local storage repository for Vstyle
 */

import type { Outfit } from '../../types/domain';

const STORAGE_KEY = 'vstyle_saved_lookbooks_v2';

const SEED_OUTFITS: Outfit[] = [
  {
    id: 'seed-outfit-1',
    title: 'Áo Ngũ Thân Tay Chẽn · Tối Giản',
    garmentId: 'garment-ngu-than-tay-chen',
    primaryColor: '#1E2A38',
    pantColor: '#FFFFFF',
    accessoryIds: ['acc-khan-dong', 'acc-the-bai'],
    characterId: 'char-nam-nho-nha',
    hairStyle: 'TRUYEN_THONG',
    footwear: 'HAI_SEN',
    eventId: 'EVENT_GRADUATION',
    weatherId: 'WEATHER_PLEASANT',
    styleVibe: 'TOI_GIAN',
    chuanScore: 98,
    chatScore: 92,
    cultureStatus: 'KEEP',
    retainedCharacteristics: ['Vạt Hữu Nhậm', '5 Thân Áo & Thân Con', 'Cổ Lập Lĩnh'],
    sources: ['src-ngan-nam-ao-mu', 'src-dai-viet-co-phong'],
    explanation: 'Bản phối ngũ thân nam trang nhã, sắc lam chàm thanh lịch cho ngày nhận bằng tốt nghiệp.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'seed-outfit-2',
    title: 'Áo Tấc Lễ Phục · Hoàng Gia',
    garmentId: 'garment-ao-tac',
    primaryColor: '#8B1E2B',
    pantColor: '#FFFFFF',
    accessoryIds: ['acc-man-nu', 'acc-kieng-bac'],
    characterId: 'char-nu-duyen-dang',
    hairStyle: 'TRUYEN_THONG',
    footwear: 'HAI_SEN',
    eventId: 'EVENT_TET',
    weatherId: 'WEATHER_COOL',
    styleVibe: 'TRUYEN_THONG_HOANG_GIA',
    chuanScore: 99,
    chatScore: 96,
    cultureStatus: 'KEEP',
    retainedCharacteristics: ['Tay Thụng Dài', 'Cổ Lập Lĩnh', 'Màu Sắc Lễ Hội'],
    sources: ['src-kham-dinh-dai-nam', 'src-ngan-nam-ao-mu'],
    explanation: 'Sắc đỏ thắm quyền quý cùng mấn nhung đệm vàng, biểu tượng thịnh vượng du xuân.',
    createdAt: new Date().toISOString(),
  },
];

export function getSavedOutfits(): Outfit[] {
  if (typeof window === 'undefined' || !window.localStorage) {
    return SEED_OUTFITS;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_OUTFITS));
      return SEED_OUTFITS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : SEED_OUTFITS;
  } catch {
    return SEED_OUTFITS;
  }
}

export function saveOutfitToLookbook(outfit: Outfit): boolean {
  if (typeof window === 'undefined' || !window.localStorage) return false;
  try {
    const current = getSavedOutfits();
    const updated = [outfit, ...current.filter((o) => o.id !== outfit.id)];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return true;
  } catch {
    return false;
  }
}

export function deleteOutfitFromLookbook(id: string): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const current = getSavedOutfits();
    const filtered = current.filter((o) => o.id !== id);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch {
    // Ignore error
  }
}

export function renameOutfitInLookbook(id: string, newTitle: string): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const current = getSavedOutfits();
    const updated = current.map((o) => (o.id === id ? { ...o, title: newTitle } : o));
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Ignore error
  }
}

/* ------------------------------------------------------------------ */
/* Drafts                                                              */
/* ------------------------------------------------------------------ */

export function getLookbookByStatus(status: 'SAVED' | 'DRAFT'): Outfit[] {
  return getSavedOutfits().filter((o) => (o.status ?? 'SAVED') === status);
}

/* ------------------------------------------------------------------ */
/* Feed posts ("Bảng tin") — stored on this device                     */
/* ------------------------------------------------------------------ */

export interface FeedPost {
  id: string;
  outfit?: Outfit;
  /** Uploaded photo (resized JPEG data URL) — optional. */
  imageDataUrl?: string;
  caption: string;
  hashtags: string[];
  createdAt: string;
  likes: number;
  liked?: boolean;
}

const FEED_KEY = 'vstyle_feed_v1';
const MAX_POSTS = 30;

export function getFeedPosts(): FeedPost[] {
  try {
    const raw = window.localStorage.getItem(FEED_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeFeed(posts: FeedPost[]): boolean {
  try {
    window.localStorage.setItem(FEED_KEY, JSON.stringify(posts.slice(0, MAX_POSTS)));
    return true;
  } catch {
    // Quota exceeded (large photos): retry without the oldest photos.
    try {
      const trimmed = posts.slice(0, MAX_POSTS).map((p, i) => (i > 5 ? { ...p, imageDataUrl: undefined } : p));
      window.localStorage.setItem(FEED_KEY, JSON.stringify(trimmed));
      return true;
    } catch {
      return false;
    }
  }
}

export function addFeedPost(post: Omit<FeedPost, 'id' | 'createdAt' | 'likes'>): FeedPost | null {
  const full: FeedPost = { ...post, id: `post-${Date.now()}`, createdAt: new Date().toISOString(), likes: 0 };
  return writeFeed([full, ...getFeedPosts()]) ? full : null;
}

export function toggleFeedLike(id: string): FeedPost[] {
  const posts = getFeedPosts().map((p) => (p.id === id ? { ...p, liked: !p.liked, likes: Math.max(0, p.likes + (p.liked ? -1 : 1)) } : p));
  writeFeed(posts);
  return posts;
}

export function deleteFeedPost(id: string): FeedPost[] {
  const posts = getFeedPosts().filter((p) => p.id !== id);
  writeFeed(posts);
  return posts;
}
