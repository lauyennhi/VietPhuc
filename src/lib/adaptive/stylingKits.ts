/**
 * Adaptive styling kits: for each functional need, which accessories make the look easier
 * to put on and wear (and why), which ones to leave at home, and one styling tip.
 * Kits combine across needs; anything one need advises against is dropped from the others.
 */

import type { Accessory, FunctionalNeedCode, Garment } from '../../types/domain';

export interface KitPick {
  accessoryId: string;
  why: string;
}

export interface KitAvoid {
  accessoryId: string;
  why: string;
}

export interface StylingKit {
  code: FunctionalNeedCode;
  title: string;
  picks: KitPick[];
  avoid: KitAvoid[];
  tip: string;
}

export const STYLING_KITS: Record<FunctionalNeedCode, StylingKit> = {
  WHEELCHAIR_SEATED: {
    code: 'WHEELCHAIR_SEATED',
    title: 'Gọn trên xe, rảnh tay đẩy bánh',
    picks: [
      { accessoryId: 'acc-tui-da', why: 'Đeo chéo trước ngực, lấy đồ khi đang ngồi, không treo lủng lẳng vào bánh xe.' },
      { accessoryId: 'acc-tram-cai-toc', why: 'Tóc gọn, không cấn tựa lưng như búi to hay mũ vành rộng.' },
      { accessoryId: 'acc-sneaker-retro', why: 'Đế bám, đặt chắc trên bàn để chân.' },
      { accessoryId: 'acc-quat-xep-giay-do', why: 'Gấp gọn để trên đùi, điểm nhấn khi chụp ảnh ngồi.' },
      { accessoryId: 'acc-hai-sen', why: 'Hài đế mềm, mũi cong nằm gọn trên bàn để chân.' },
      { accessoryId: 'acc-tui-coi', why: 'Túi cói nhỏ đặt trên đùi hoặc móc tay xe, không chạm bánh.' },
      { accessoryId: 'acc-kieng-bac', why: 'Nhấn vào vùng cổ — nơi được nhìn rõ nhất khi ngồi.' },
    ],
    avoid: [
      { accessoryId: 'acc-that-lung-lua', why: 'Dải thắt lưng buông dài dễ cuốn vào nan bánh xe.' },
      { accessoryId: 'acc-non-quai-thao', why: 'Vành nón rộng vướng tựa đầu và người đẩy phía sau.' },
      { accessoryId: 'acc-guoc-moc', why: 'Đế gỗ trơn, dễ tuột khỏi bàn để chân.' },
    ],
    tip: 'Chọn lụa ít nhăn; màu đậm ở tà giúp vết bánh xe không lộ.',
  },
  ONE_HANDED: {
    code: 'ONE_HANDED',
    title: 'Mọi thứ thao tác bằng một tay',
    picks: [
      { accessoryId: 'acc-khan-dong', why: 'Khăn đóng định hình sẵn — đội như mũ, không cần quấn.' },
      { accessoryId: 'acc-kieng-bac', why: 'Kiềng hở đeo từ phía trước, không có khóa cài sau gáy.' },
      { accessoryId: 'acc-tui-da', why: 'Đeo chéo, nắp nam châm mở bằng một tay.' },
      { accessoryId: 'acc-sneaker-retro', why: 'Bản slip-on dây chun — xỏ chân là xong.' },
      { accessoryId: 'acc-tui-coi', why: 'Quai xách to, móc vào cổ tay là đi.' },
      { accessoryId: 'acc-hai-sen', why: 'Hài xỏ chân, không quai cài.' },
      { accessoryId: 'acc-quat-xep-giay-do', why: 'Quạt giấy nhẹ, mở bằng một cú lắc cổ tay.' },
    ],
    avoid: [
      { accessoryId: 'acc-chuoi-ngoc', why: 'Khóa nhỏ sau gáy cần hai tay để cài.' },
      { accessoryId: 'acc-that-lung-lua', why: 'Thắt nút dải lụa cần hai tay.' },
      { accessoryId: 'acc-yem-co-truyen', why: 'Dây yếm buộc sau lưng khó tự làm một tay.' },
    ],
    tip: 'Ưu tiên phụ kiện “đeo vào là xong”: không khóa, không buộc.',
  },
  LIMITED_HAND_MOBILITY: {
    code: 'LIMITED_HAND_MOBILITY',
    title: 'Không khóa nhỏ, không buộc dây',
    picks: [
      { accessoryId: 'acc-kieng-bac', why: 'Thay vòng cổ có khóa: kiềng chỉ cần đặt lên cổ.' },
      { accessoryId: 'acc-khan-dong', why: 'Khăn đóng khâu sẵn nếp, không cần quấn hay ghim.' },
      { accessoryId: 'acc-tui-coi', why: 'Quai to, móc vào cổ tay — không cần nắm chặt.' },
      { accessoryId: 'acc-sneaker-retro', why: 'Quai dán thay dây buộc.' },
      { accessoryId: 'acc-hai-sen', why: 'Hài xỏ chân, không khóa cài.' },
      { accessoryId: 'acc-quat-xep-giay-do', why: 'Quạt giấy nhẹ, cầm bằng cả bàn tay.' },
    ],
    avoid: [
      { accessoryId: 'acc-chuoi-ngoc', why: 'Khóa móc nhỏ khó bấm khi ngón tay yếu.' },
      { accessoryId: 'acc-tram-cai-toc', why: 'Cài trâm cần thao tác ngón tay khéo.' },
      { accessoryId: 'acc-quat-tram-huong', why: 'Quạt nan gỗ nặng, phải nắm chặt để mở.' },
    ],
    tip: 'Phụ kiện to, nhẹ, cầm bằng cả bàn tay thay vì đầu ngón.',
  },
  LIMITED_MOBILITY: {
    code: 'LIMITED_MOBILITY',
    title: 'Không cần giơ tay qua vai',
    picks: [
      { accessoryId: 'acc-khan-dong', why: 'Đội từ trước ra sau, không cần giơ tay quấn vòng.' },
      { accessoryId: 'acc-kieng-bac', why: 'Đeo từ phía trước, không vòng tay ra sau gáy.' },
      { accessoryId: 'acc-tui-coi', why: 'Xách tay thay vì tròng dây qua đầu.' },
      { accessoryId: 'acc-quat-xep-giay-do', why: 'Quạt giấy nhẹ, cầm thấp ngang ngực.' },
      { accessoryId: 'acc-sneaker-retro', why: 'Bản slip-on — không cúi người buộc dây.' },
      { accessoryId: 'acc-hai-sen', why: 'Xỏ chân, không cần cúi người cài quai.' },
    ],
    avoid: [
      { accessoryId: 'acc-man-nu', why: 'Vấn mấn phải giơ tay qua đầu lâu.' },
      { accessoryId: 'acc-yem-co-truyen', why: 'Buộc dây yếm sau lưng cần với tay ra sau.' },
      { accessoryId: 'acc-tui-da', why: 'Tròng dây đeo chéo qua đầu khó khi vai hạn chế.' },
    ],
    tip: 'Chọn phụ kiện đeo từ phía trước; nhờ người hỗ trợ chỉ ở bước cuối.',
  },
  LIMITED_STANDING: {
    code: 'LIMITED_STANDING',
    title: 'Êm chân, nhẹ người khi đứng chờ',
    picks: [
      { accessoryId: 'acc-sneaker-retro', why: 'Đế êm thay guốc gỗ — đứng chụp ảnh lâu không mỏi.' },
      { accessoryId: 'acc-quat-xep-giay-do', why: 'Quạt mát khi đứng chờ ngoài trời.' },
      { accessoryId: 'acc-tui-da', why: 'Đeo chéo, hai tay rảnh để vịn khi đứng lên.' },
      { accessoryId: 'acc-tram-cai-toc', why: 'Nhẹ, không thêm sức nặng lên cổ như nón.' },
      { accessoryId: 'acc-tui-coi', why: 'Túi nhẹ, đặt xuống ghế ngay khi cần ngồi.' },
      { accessoryId: 'acc-kieng-bac', why: 'Điểm nhấn gọn ở cổ, không phải cầm gì thêm.' },
      { accessoryId: 'acc-khan-dong', why: 'Khăn đóng nhẹ, đội cả buổi không mỏi.' },
    ],
    avoid: [
      { accessoryId: 'acc-guoc-moc', why: 'Đế gỗ cứng và cao, nhanh mỏi khi đứng.' },
      { accessoryId: 'acc-hai-sen', why: 'Đế hài mỏng, không đỡ gan bàn chân.' },
      { accessoryId: 'acc-non-quai-thao', why: 'Nón lớn nặng, khó cầm khi cần ngồi xuống.' },
    ],
    tip: 'Mang theo chỗ ngồi gấp gọn; chọn điểm chụp có ghế đá hay bậc thềm.',
  },
  MATERIAL_SENSITIVITY: {
    code: 'MATERIAL_SENSITIVITY',
    title: 'Chất liệu tự nhiên, không kim loại sát da',
    picks: [
      { accessoryId: 'acc-man-nu', why: 'Mấn lụa tơ tằm mềm, thoáng trên trán.' },
      { accessoryId: 'acc-that-lung-lua', why: 'Thắt lưng lụa thay đai da, không cọ hông.' },
      { accessoryId: 'acc-tui-coi', why: 'Cói tự nhiên, không nhuộm hóa chất mạnh.' },
      { accessoryId: 'acc-quat-xep-giay-do', why: 'Giấy dó và tre — không sơn phủ.' },
      { accessoryId: 'acc-hai-sen', why: 'Hài vải thêu lót cotton, không keo dán sát da.' },
      { accessoryId: 'acc-chuoi-ngoc', why: 'Ngọc trai tự nhiên, nên chọn bản khóa bọc lụa.' },
    ],
    avoid: [
      { accessoryId: 'acc-kieng-bac', why: 'Kim loại tiếp xúc cổ lâu dễ kích ứng (niken).' },
      { accessoryId: 'acc-that-lung-da', why: 'Mặt khóa kim loại và da thuộc có thể gây ngứa.' },
      { accessoryId: 'acc-the-bai', why: 'Thẻ bài kim loại chạm da ngực.' },
    ],
    tip: 'Thử phụ kiện trên da cổ tay 30 phút trước buổi chụp.',
  },
};

export interface CombinedKit {
  picks: Array<KitPick & { accessory: Accessory; needs: FunctionalNeedCode[] }>;
  avoid: Array<KitAvoid & { accessory: Accessory; needs: FunctionalNeedCode[] }>;
  tips: Array<{ code: FunctionalNeedCode; title: string; tip: string }>;
}

const ONE_PER_CATEGORY = new Set(['FOOTWEAR', 'HEADWEAR', 'BAG']);

/** Merge the kits of the selected needs into one, filtered to what fits the garment. */
export function combineKits(needCodes: FunctionalNeedCode[], garment: Garment, accessories: Accessory[]): CombinedKit {
  const byId = new Map(accessories.map((a) => [a.id, a]));
  const fits = (a: Accessory) => garment.compatibleAccessoryIds.includes(a.id) && a.compatibleGarmentIds.includes(garment.id);
  const kits = needCodes.map((c) => STYLING_KITS[c]).filter(Boolean);

  const avoid = new Map<string, KitAvoid & { accessory: Accessory; needs: FunctionalNeedCode[] }>();
  for (const kit of kits) {
    for (const item of kit.avoid) {
      const accessory = byId.get(item.accessoryId);
      if (!accessory) continue;
      const existing = avoid.get(item.accessoryId);
      if (existing) existing.needs.push(kit.code);
      else avoid.set(item.accessoryId, { ...item, accessory, needs: [kit.code] });
    }
  }

  const picks = new Map<string, KitPick & { accessory: Accessory; needs: FunctionalNeedCode[] }>();
  const takenCategory = new Set<string>();
  for (const kit of kits) {
    for (const item of kit.picks) {
      const accessory = byId.get(item.accessoryId);
      if (!accessory || avoid.has(item.accessoryId) || !fits(accessory)) continue;
      const existing = picks.get(item.accessoryId);
      if (existing) {
        existing.needs.push(kit.code);
        continue;
      }
      const category = accessory.category ?? accessory.type;
      if (ONE_PER_CATEGORY.has(category) && takenCategory.has(category)) continue;
      takenCategory.add(category);
      picks.set(item.accessoryId, { ...item, accessory, needs: [kit.code] });
    }
  }

  return {
    picks: [...picks.values()],
    avoid: [...avoid.values()],
    tips: kits.map((k) => ({ code: k.code, title: k.title, tip: k.tip })),
  };
}
