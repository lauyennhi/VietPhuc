/**
 * Adaptive × Culture guardrail.
 * Deterministically checks adaptive tailoring adjustments against each garment's structural
 * identity (template) and its approved non-negotiables, and proposes an alternative that
 * keeps the accommodation while preserving the cultural feature.
 */

import type { CultureStatus, Garment } from '../../types/domain';
import type { AdaptiveAdjustments } from './presets';

export interface GuardItem {
  id: string;
  level: CultureStatus;
  title: string;
  detail: string;
  /** Partial adjustments that resolve this item while keeping the accommodation. */
  fix?: Partial<AdaptiveAdjustments>;
  fixLabel?: string;
}

export interface GuardResult {
  score: number;
  status: CultureStatus;
  items: GuardItem[];
  invariants: string[];
}

const WIDE_SLEEVE = new Set(['AO_TAC', 'AO_NHAT_BINH', 'AO_GIAO_LINH', 'AO_DOI_KHAM']);
const CEREMONIAL = new Set(['AO_TAC', 'AO_NHAT_BINH', 'AO_GIAO_LINH', 'AO_DOI_KHAM']);
const HUU_NHAM = new Set(['NGU_THAN_TAY_CHEN', 'AO_TAC', 'AO_GIAO_LINH', 'NGU_THAN_REMIX', 'AO_DAI']);
const STANDING_COLLAR = new Set(['NGU_THAN_TAY_CHEN', 'AO_TAC', 'AO_DAI', 'NGU_THAN_REMIX']);
const PARALLEL_FRONT = new Set(['AO_DOI_KHAM', 'AO_NHAT_BINH', 'AO_TU_THAN']);

export function checkAdaptiveCulture(garment: Garment, adj: AdaptiveAdjustments, hasNeeds: boolean): GuardResult {
  const t = garment.svgTemplate;
  const items: GuardItem[] = [];
  const add = (item: GuardItem) => items.push(item);

  /* Closure placement */
  if (HUU_NHAM.has(t)) {
    if (adj.closureType === 'ZIPPER') {
      add({
        id: 'closure-zipper',
        level: 'CONSIDER',
        title: 'Khóa kéo phải nằm dọc sườn phải',
        detail: 'Khóa kéo chỉ đặt ở đường sườn phải, giấu dưới nẹp vạt. Không đặt khóa giữa ngực vì sẽ biến áo thành kiểu áo khoác mở giữa, mất vạt hữu nhậm.',
      });
    } else {
      add({
        id: 'closure-huu-nham',
        level: 'KEEP',
        title: 'Vạt hữu nhậm được giữ nguyên',
        detail: adj.closureType === 'BUTTON'
          ? 'Cài cúc truyền thống, vạt trái đè sang phải.'
          : 'Nẹp đóng mở giấu dưới vạt phải; bên ngoài vẫn thấy vạt trái đè sang phải và hàng cúc trang trí.',
      });
    }
  }
  if (PARALLEL_FRONT.has(t)) {
    if (adj.closureType === 'ZIPPER') {
      add({
        id: 'closure-parallel',
        level: 'WARNING',
        title: t === 'AO_TU_THAN' ? 'Khóa kéo làm mất nút thắt vạt tứ thân' : 'Khóa kéo làm mất hai vạt song song',
        detail: t === 'AO_TU_THAN'
          ? 'Hai vạt trước của áo tứ thân được thắt nút. Dùng nút thắt dựng sẵn gắn nam châm: nhìn vẫn như thắt tay, mặc chỉ cần áp vào.'
          : 'Kết cấu đặc trưng là hai vạt buông song song. Đặt nam châm ẩn ở dây thắt ngang ngực thay vì khóa kéo nối hai vạt.',
        fix: { closureType: 'MAGNETIC' },
        fixLabel: 'Đổi sang nam châm ẩn',
      });
    } else if (adj.closureType !== 'BUTTON') {
      add({
        id: 'closure-parallel-ok',
        level: 'KEEP',
        title: t === 'AO_TU_THAN' ? 'Nút thắt vạt giữ diện mạo' : 'Hai vạt vẫn buông song song',
        detail: 'Điểm đóng mở ẩn ở dây thắt/nút thắt, không làm thay đổi kết cấu vạt trước.',
      });
    }
  }
  if (t === 'AO_TAC' && adj.closureType !== 'BUTTON') {
    add({
      id: 'tac-five-buttons',
      level: 'KEEP',
      title: 'Vẫn đủ 5 cúc áo tấc',
      detail: 'Giữ đủ 5 cúc trang trí bên ngoài theo quy thức; cơ chế đóng mở thật nằm ẩn bên dưới.',
    });
  }

  /* Sleeves */
  if (WIDE_SLEEVE.has(t)) {
    if (adj.sleeveLength < -5) {
      add({
        id: 'sleeve-cut',
        level: 'WARNING',
        title: 'Cắt ngắn ống tay thụng',
        detail: 'Ống tay rộng, dài là dáng đặc trưng của lễ phục. Giữ nguyên độ dài và thêm khuy gài ẩn để vén ống tay khi cần thao tác.',
        fix: { sleeveLength: 0 },
        fixLabel: 'Giữ độ dài, thêm khuy vén tay',
      });
    } else if (adj.sleeveLength < 0) {
      add({ id: 'sleeve-short', level: 'CONSIDER', title: 'Ống tay ngắn hơn chuẩn', detail: 'Mức rút nhẹ vẫn chấp nhận được; nếu cần rảnh tay hơn, nên dùng khuy vén tay thay vì cắt.' });
    }
  } else if (adj.sleeveLength < -10) {
    add({ id: 'sleeve-cropped', level: 'CONSIDER', title: 'Tay áo thành tay lửng', detail: 'Tay lửng giảm tính trang trọng; phù hợp dịp thường ngày hơn lễ nghi.' });
  }
  if (t === 'NGU_THAN_TAY_CHEN' && adj.sleeveWidth > 8) {
    add({
      id: 'sleeve-chen',
      level: 'CONSIDER',
      title: 'Tay chẽn bị nới quá rộng',
      detail: 'Tay chẽn (ôm cổ tay) là đặc trưng của áo. Nên nới phần nách kiểu raglan và giữ cổ tay ôm.',
      fix: { sleeveWidth: 6 },
      fixLabel: 'Nới nách, giữ cổ tay',
    });
  }
  if (t === 'AO_NHAT_BINH' && adj.sleeveWidth > 0) {
    add({ id: 'ngu-sac', level: 'KEEP', title: 'Dải ngũ sắc ở tay áo được giữ', detail: 'Khi nới tay áo, dải hoa văn ngũ sắc được may nối theo chu vi mới, không bỏ dải nào.' });
  }

  /* Hem */
  if (adj.frontHemReduction > 0) {
    const limit = CEREMONIAL.has(t) ? 15 : t === 'AO_DAI' ? 18 : t === 'NGU_THAN_REMIX' ? 30 : 20;
    if (adj.frontHemReduction > limit) {
      add({
        id: 'hem-too-short',
        level: CEREMONIAL.has(t) || t === 'AO_DAI' ? 'WARNING' : 'CONSIDER',
        title: CEREMONIAL.has(t) ? 'Tà lễ phục quá ngắn' : 'Tà áo ngắn hơn phom chuẩn',
        detail: `Rút vạt trước tối đa khoảng ${limit} cm để giữ phom ${garment.name}; vạt sau giữ nguyên chiều dài (khi ngồi, vạt sau buông theo lưng ghế).`,
        fix: { frontHemReduction: limit },
        fixLabel: `Rút vạt trước ${limit} cm`,
      });
    } else {
      add({ id: 'hem-front-only', level: 'KEEP', title: 'Chỉ rút vạt trước', detail: 'Vạt sau giữ nguyên chiều dài, phom áo nhìn từ phía sau và khi đứng không đổi.' });
    }
  }

  /* Slit */
  const slitLimit = t === 'AO_DAI' ? 18 : CEREMONIAL.has(t) ? 15 : 22;
  if (adj.slitPosition > slitLimit) {
    add({
      id: 'slit-high',
      level: t === 'AO_DAI' ? 'WARNING' : 'CONSIDER',
      title: 'Đường xẻ sườn quá cao',
      detail: t === 'AO_DAI'
        ? 'Tà áo dài không xẻ cao quá eo. Giữ điểm xẻ ngang eo và thêm nếp gấp chìm (pli) để tăng độ rộng khi ngồi.'
        : 'Xẻ quá cao làm giảm sự kín đáo; có thể thêm nếp gấp chìm ở sườn để tăng độ cử động.',
      fix: { slitPosition: slitLimit },
      fixLabel: `Xẻ ${slitLimit} cm + nếp chìm`,
    });
  }

  /* Collar / neck opening */
  if ((STANDING_COLLAR.has(t) || t === 'AO_GIAO_LINH') && adj.openingWidth > 8) {
    add({
      id: 'collar-open',
      level: 'WARNING',
      title: t === 'AO_GIAO_LINH' ? 'Cổ giao lĩnh khoét quá sâu' : 'Cổ đứng bị khoét rộng',
      detail: t === 'AO_GIAO_LINH'
        ? 'Không xẻ cổ quá sâu làm lệch tỷ lệ giao lĩnh. Nới bằng khuy vai ẩn để tròng áo dễ hơn.'
        : 'Cổ đứng (lập lĩnh) cao vừa vặn là đặc trưng. Giữ chiều cao cổ, mở thêm khuy vai ẩn để tròng áo dễ dàng.',
      fix: { openingWidth: 5 },
      fixLabel: 'Giữ cổ, thêm khuy vai ẩn',
    });
  }
  if (t === 'AO_NHAT_BINH' && adj.openingWidth > 6) {
    add({
      id: 'nhat-binh-collar',
      level: 'WARNING',
      title: 'Thay đổi hình khối cổ Nhật Bình',
      detail: 'Cổ áo hình chữ nhật là đặc trưng không được thay đổi; chỉ nới phần cổ áo lót bên trong.',
      fix: { openingWidth: 4 },
      fixLabel: 'Chỉ nới cổ áo lót',
    });
  }
  if ((t === 'AO_TU_THAN' || t === 'AO_DOI_KHAM') && adj.openingWidth > 0) {
    add({
      id: 'inner-layer',
      level: 'KEEP',
      title: t === 'AO_TU_THAN' ? 'Yếm vẫn mặc bên trong' : 'Áo lót bên trong kín đáo',
      detail: 'Phần mở rộng được che bởi lớp yếm/áo lót, giữ sự kín đáo theo quy thức.',
    });
  }

  if (!hasNeeds && items.every((i) => i.level === 'KEEP')) {
    items.unshift({ id: 'standard', level: 'KEEP', title: 'Phom chuẩn nguyên bản', detail: 'Chưa có điều chỉnh thích ứng — áo giữ đúng tỷ lệ truyền thống.' });
  }

  const warnings = items.filter((i) => i.level === 'WARNING').length;
  const considers = items.filter((i) => i.level === 'CONSIDER').length;
  const score = Math.max(0, 100 - warnings * 22 - considers * 7);
  const status: CultureStatus = warnings ? 'WARNING' : considers ? 'CONSIDER' : 'KEEP';
  const order: Record<CultureStatus, number> = { WARNING: 0, CONSIDER: 1, KEEP: 2 };
  items.sort((a, b) => order[a.level] - order[b.level]);

  return { score, status, items, invariants: garment.nonNegotiables };
}

/** Applies every available fix at once. */
export function applyAllFixes(adj: AdaptiveAdjustments, result: GuardResult): AdaptiveAdjustments {
  return result.items.reduce<AdaptiveAdjustments>((acc, item) => (item.fix ? { ...acc, ...item.fix } : acc), { ...adj });
}
