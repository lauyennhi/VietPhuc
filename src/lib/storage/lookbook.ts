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
