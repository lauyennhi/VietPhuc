/**
 * Style constants, labels, and mapping logic for Vstyle
 */

import type { StyleTag } from '../types/domain';

export interface StyleChoice {
  id: string;
  label: string;
  description: string;
  tag: StyleTag;
}

export const STYLE_CHOICES: StyleChoice[] = [
  {
    id: 'TRUYEN_THONG_HOANG_GIA',
    label: 'Truyền Thống · Hoàng Gia',
    description: 'Trang trọng, chuẩn mực điển chế, gìn giữ trọn vẹn nét tôn nghiêm cổ xưa.',
    tag: 'TRUYEN_THONG',
  },
  {
    id: 'REMIX_GEN_Z',
    label: 'Remix Gen Z',
    description: 'Phá cách, năng động, kết hợp phụ kiện và màu sắc hiện đại trên phom áo cổ.',
    tag: 'REMIX_GEN_Z',
  },
  {
    id: 'TOI_GIAN',
    label: 'Tối Giản',
    description: 'Thanh lịch đương đại, tiết giảm chi tiết, tôn vinh đường cắt và chất liệu.',
    tag: 'TOI_GIAN',
  },
  {
    id: 'DAN_GIAN_MOC_MAC',
    label: 'Dân Gian · Mộc Mạc',
    description: 'Gần gũi, ấm áp, mang đậm hồn quê Việt Nam và hơi thở đồng nội.',
    tag: 'DAN_GIAN',
  },
  {
    id: 'CO_DIEN_HOAI_CO',
    label: 'Cổ Điển · Hoài Cổ',
    description: 'Nét đẹp trầm tích thời gian, màu sắc trầm ấm hoài niệm thế kỷ trước.',
    tag: 'CO_DIEN',
  },
  {
    id: 'NANG_DONG_DAO_PHO',
    label: 'Năng Động · Dạo Phố',
    description: 'Gọn gàng, thoải mái di chuyển, sẵn sàng cho những chuyến dạo chơi phố phường.',
    tag: 'NANG_DONG',
  },
];

export const STYLE_VIBE_BY_TAG: Record<string, string> = {
  TRUYEN_THONG: 'TRUYEN_THONG_HOANG_GIA',
  REMIX_GEN_Z: 'REMIX_GEN_Z',
  TOI_GIAN: 'TOI_GIAN',
  DAN_GIAN: 'DAN_GIAN_MOC_MAC',
  CO_DIEN: 'CO_DIEN_HOAI_CO',
  NANG_DONG: 'NANG_DONG_DAO_PHO',
  LE_NGHI: 'TRUYEN_THONG_HOANG_GIA',
  CUNG_DINH: 'TRUYEN_THONG_HOANG_GIA',
  THANH_LICH: 'TOI_GIAN',
  SANG_TRONG: 'TRUYEN_THONG_HOANG_GIA',
  HOA_NHAP: 'REMIX_GEN_Z',
};

export function styleLabel(idOrTag?: string | null): string {
  if (!idOrTag) return 'Truyền Thống';
  const choice = STYLE_CHOICES.find((c) => c.id === idOrTag || c.tag === idOrTag);
  if (choice) return choice.label;
  const mapped = STYLE_VIBE_BY_TAG[idOrTag];
  if (mapped) {
    const choiceFromMap = STYLE_CHOICES.find((c) => c.id === mapped);
    if (choiceFromMap) return choiceFromMap.label;
  }
  return idOrTag;
}

export function styleTagFor(idOrTag?: string | null): StyleTag {
  if (!idOrTag) return 'TRUYEN_THONG';
  const choice = STYLE_CHOICES.find((c) => c.id === idOrTag);
  if (choice) return choice.tag;
  return (idOrTag as StyleTag) || 'TRUYEN_THONG';
}
