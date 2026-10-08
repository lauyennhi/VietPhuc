/**
 * Printable adaptive tailoring sheet ("Phiếu may đo thích ứng") — what the user hands to a tailor.
 * Prints/saves as PDF through the browser (print CSS isolates `.print-area`).
 */

import React from 'react';
import type { AdaptiveNeed, Garment } from '../types/domain';
import { CLOSURE_LABELS, type AdaptiveAdjustments } from '../lib/adaptive/presets';
import type { GuardResult } from '../lib/adaptive/cultureGuard';
import type { AdaptiveCheckResult } from '../lib/adaptive/ruleEngine';

export interface Measurements {
  height: string;
  chest: string;
  waist: string;
  hip: string;
  sleeve: string;
  seatedHeight: string;
  thigh: string;
  note: string;
}

export const MEASUREMENT_FIELDS: Array<{ key: keyof Measurements; label: string; seatedOnly?: boolean }> = [
  { key: 'height', label: 'Chiều cao' },
  { key: 'chest', label: 'Vòng ngực' },
  { key: 'waist', label: 'Vòng eo' },
  { key: 'hip', label: 'Vòng mông' },
  { key: 'sleeve', label: 'Dài tay (vai → cổ tay)' },
  { key: 'seatedHeight', label: 'Cao vai khi ngồi (vai → mặt ghế)', seatedOnly: true },
  { key: 'thigh', label: 'Dài đùi khi ngồi (hông → gối)', seatedOnly: true },
];

interface TechPackSheetProps {
  garment: Garment;
  colorHex: string;
  colorName?: string;
  needs: AdaptiveNeed[];
  adjustments: AdaptiveAdjustments;
  guard: GuardResult;
  verified: AdaptiveCheckResult[];
  measurements: Measurements;
  dressingSteps: Array<{ need: string; steps: string[] }>;
  onClose: () => void;
  onCopy: (text: string) => void;
}

const fmt = (n: number, unit = 'cm') => `${n > 0 ? '+' : ''}${n} ${unit}`;

export function techPackText(props: Omit<TechPackSheetProps, 'onClose' | 'onCopy'>): string {
  const { garment, colorHex, colorName, needs, adjustments: a, guard, verified, measurements: m, dressingSteps } = props;
  const lines = [
    'PHIẾU MAY ĐO VIỆT PHỤC THÍCH ỨNG — Vstyle',
    `Ngày: ${new Date().toLocaleDateString('vi-VN')}`,
    '',
    `Y phục: ${garment.name} (${garment.era})`,
    `Màu chủ đạo: ${colorName ? `${colorName} ` : ''}${colorHex}`,
    `Nhu cầu: ${needs.map((n) => n.name).join('; ') || 'Không — phom chuẩn'}`,
    '',
    'THÔNG SỐ ĐIỀU CHỈNH RẬP',
    `- Vạt trước: ${a.frontHemReduction ? `rút ${a.frontHemReduction} cm (vạt sau giữ nguyên)` : 'giữ nguyên'}`,
    `- Xẻ sườn: ${a.slitPosition ? `nâng ${a.slitPosition} cm` : 'giữ nguyên'}`,
    `- Dài tay: ${a.sleeveLength ? fmt(a.sleeveLength) : 'giữ nguyên'}`,
    `- Rộng ống tay/nách: ${a.sleeveWidth ? fmt(a.sleeveWidth) : 'giữ nguyên'}`,
    `- Độ mở cổ/vạt: ${a.openingWidth ? fmt(a.openingWidth) : 'giữ nguyên'}`,
    `- Đóng mở: ${CLOSURE_LABELS[a.closureType]}`,
    '',
    'SỐ ĐO (cm)',
    ...MEASUREMENT_FIELDS.filter((f) => m[f.key]).map((f) => `- ${f.label}: ${m[f.key]}`),
    ...(m.note ? [`- Ghi chú: ${m.note}`] : []),
    '',
    `BẢN SẮC VĂN HÓA (điểm ${guard.score}/100)`,
    ...guard.items.map((i) => `- [${i.level}] ${i.title}: ${i.detail}`),
    ...guard.invariants.map((i) => `- Bắt buộc giữ: ${i}`),
    '',
    'THÔNG SỐ ĐÃ KIỂM ĐỊNH',
    ...verified.filter((v) => v.tailoringSpecs).map((v) => `- ${v.needName}: ${Object.values(v.tailoringSpecs ?? {}).join('; ')}${v.source ? ` (Nguồn: ${v.source.title})` : ''}`),
    '',
    'HƯỚNG DẪN TỰ MẶC',
    ...dressingSteps.flatMap((d) => [`${d.need}:`, ...d.steps.map((s, i) => `  ${i + 1}. ${s}`)]),
    '',
    'Lưu ý: thông số mang tính hỗ trợ thiết kế cá nhân hóa, không phải tiêu chuẩn y khoa. Hãy thử áo ở tư thế sử dụng thực tế trước khi hoàn thiện.',
  ];
  return lines.join('\n');
}

/** Clones the sheet to the document root so it prints as normal flowing pages (outside the modal). */
function printSheet(source: HTMLElement | null): void {
  if (!source) return;
  const root = document.createElement('div');
  root.id = 'print-root';
  root.appendChild(source.cloneNode(true));
  document.body.appendChild(root);
  document.documentElement.classList.add('printing');
  const cleanup = () => {
    root.remove();
    document.documentElement.classList.remove('printing');
    window.removeEventListener('afterprint', cleanup);
  };
  window.addEventListener('afterprint', cleanup);
  window.print();
  setTimeout(cleanup, 1000);
}

export const TechPackSheet: React.FC<TechPackSheetProps> = (props) => {
  const sheetRef = React.useRef<HTMLElement>(null);
  const { garment, colorHex, colorName, needs, adjustments: a, guard, verified, measurements: m, dressingSteps, onClose, onCopy } = props;
  const text = techPackText(props);
  const download = () => {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Phieu_may_do_${garment.id}.txt`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 3000);
  };

  const rows: Array<[string, string, boolean]> = [
    ['Vạt trước', a.frontHemReduction ? `Rút ${a.frontHemReduction} cm · vạt sau giữ nguyên` : 'Giữ nguyên', a.frontHemReduction > 0],
    ['Xẻ sườn', a.slitPosition ? `Nâng ${a.slitPosition} cm` : 'Giữ nguyên', a.slitPosition > 0],
    ['Dài tay', a.sleeveLength ? fmt(a.sleeveLength) : 'Giữ nguyên', a.sleeveLength !== 0],
    ['Rộng ống tay / nách', a.sleeveWidth ? fmt(a.sleeveWidth) : 'Giữ nguyên', a.sleeveWidth > 0],
    ['Độ mở cổ / vạt', a.openingWidth ? fmt(a.openingWidth) : 'Giữ nguyên', a.openingWidth > 0],
    ['Cơ chế đóng mở', CLOSURE_LABELS[a.closureType], a.closureType !== 'BUTTON'],
  ];
  const levelStyle = {
    KEEP: 'text-[#3D6B35]',
    CONSIDER: 'text-[#8A5E17]',
    WARNING: 'text-[#8B1E2B]',
  } as const;
  const levelLabel = { KEEP: 'Giữ', CONSIDER: 'Cân nhắc', WARNING: 'Cảnh báo' } as const;
  const filledMeasurements = MEASUREMENT_FIELDS.filter((f) => m[f.key]);

  return (
    <div className="max-h-[88vh] overflow-y-auto rounded-[28px] bg-[#FFFFFF]">
      <div className="no-print sticky top-0 z-10 flex flex-wrap items-center justify-between gap-2 border-b border-[#E6DCCD] bg-[#FFFFFF]/95 px-5 py-3 backdrop-blur">
        <p className="text-sm font-bold text-[#1F1B18]">Phiếu may đo thích ứng</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => printSheet(sheetRef.current)} className="btn-primary text-xs">🖨 In / Lưu PDF</button>
          <button type="button" onClick={() => onCopy(text)} className="press min-h-11 rounded-2xl border border-[#E6DCCD] px-4 text-xs font-bold text-[#1F1B18] hover:bg-[#F1EADF]">Sao chép</button>
          <button type="button" onClick={download} className="press min-h-11 rounded-2xl border border-[#E6DCCD] px-4 text-xs font-bold text-[#1F1B18] hover:bg-[#F1EADF]">Tải .txt</button>
          <button type="button" onClick={onClose} aria-label="Đóng" className="press min-h-11 rounded-2xl px-3 text-lg text-[#736960] hover:bg-[#F1EADF]">×</button>
        </div>
      </div>

      <article ref={sheetRef} className="print-area space-y-6 p-6 text-[#1F1B18] sm:p-8">
        <header className="flex items-start justify-between gap-4 border-b-2 border-[#1F1B18] pb-4">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#8A5E17]">Vstyle · Adaptive Fashion</p>
            <h2 className="font-serif text-2xl font-bold sm:text-3xl">Phiếu May Đo Việt Phục Thích Ứng</h2>
            <p className="mt-1 text-xs text-[#736960]">Ngày lập: {new Date().toLocaleDateString('vi-VN')} · Gửi kèm cho thợ may / nhà may</p>
          </div>
          <div className="grid size-20 shrink-0 place-items-center rounded-2xl border-2 border-dashed border-[#4F7350] bg-[#E5EDE2] text-center">
            <span className="font-serif text-2xl font-bold leading-none text-[#3D6B35]">{guard.score}</span>
            <span className="font-mono text-[8px] font-bold uppercase text-[#3D6B35]">Bản sắc</span>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-[#E6DCCD] p-4">
            <p className="font-mono text-[10px] font-bold uppercase text-[#736960]">Y phục</p>
            <p className="mt-1 font-serif text-lg font-bold">{garment.name}</p>
            <p className="text-xs text-[#736960]">{garment.era}</p>
          </div>
          <div className="rounded-2xl border border-[#E6DCCD] p-4">
            <p className="font-mono text-[10px] font-bold uppercase text-[#736960]">Màu chủ đạo</p>
            <div className="mt-2 flex items-center gap-2.5">
              <span className="size-8 rounded-full border border-[#E6DCCD]" style={{ backgroundColor: colorHex }} />
              <span className="text-sm font-semibold">{colorName ?? colorHex}</span>
            </div>
          </div>
          <div className="rounded-2xl border border-[#E6DCCD] p-4">
            <p className="font-mono text-[10px] font-bold uppercase text-[#736960]">Nhu cầu</p>
            <p className="mt-1 text-sm font-semibold leading-snug">{needs.map((n) => n.name).join(' · ') || 'Phom chuẩn'}</p>
          </div>
        </section>

        <section>
          <h3 className="mb-2 font-serif text-lg font-bold">1. Thông số điều chỉnh rập</h3>
          <table className="w-full border-collapse text-sm">
            <tbody>
              {rows.map(([label, value, changed]) => (
                <tr key={label} className="border-b border-[#EFE7DA]">
                  <td className="w-2/5 py-2 pr-3 text-[#736960]">{label}</td>
                  <td className={`py-2 font-semibold ${changed ? 'text-[#1F1B18]' : 'text-[#A39889]'}`}>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section>
          <h3 className="mb-2 font-serif text-lg font-bold">2. Số đo cá nhân (cm)</h3>
          {filledMeasurements.length ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {filledMeasurements.map((f) => (
                <div key={f.key} className="rounded-xl border border-[#E6DCCD] p-2.5">
                  <p className="text-[10px] text-[#736960]">{f.label}</p>
                  <p className="font-mono text-base font-bold">{m[f.key]}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-[#D8CCBA] p-3 text-xs text-[#736960]">Chưa nhập số đo — thợ may sẽ đo trực tiếp. Ô trống để ghi tay: ................................................</p>
          )}
          {m.note && <p className="mt-2 text-xs"><strong>Ghi chú:</strong> {m.note}</p>}
        </section>

        <section>
          <h3 className="mb-2 font-serif text-lg font-bold">3. Bản sắc văn hóa phải giữ</h3>
          <ul className="space-y-1.5 text-xs leading-relaxed">
            {guard.items.map((item) => (
              <li key={item.id}>
                <strong className={levelStyle[item.level]}>[{levelLabel[item.level]}] {item.title}:</strong> {item.detail}
              </li>
            ))}
            {guard.invariants.map((rule) => (
              <li key={rule}><strong className="text-[#1F1B18]">Bắt buộc:</strong> {rule}</li>
            ))}
          </ul>
        </section>

        {verified.some((v) => v.tailoringSpecs) && (
          <section>
            <h3 className="mb-2 font-serif text-lg font-bold">4. Thông số đã kiểm định</h3>
            <ul className="space-y-2 text-xs leading-relaxed">
              {verified.filter((v) => v.tailoringSpecs).map((v) => (
                <li key={v.needName} className="rounded-xl bg-[#FBF8F3] p-3">
                  <strong>{v.needName}</strong>
                  <ul className="mt-1 list-disc pl-4 text-[#4A423B]">
                    {Object.values(v.tailoringSpecs ?? {}).map((spec) => <li key={String(spec)}>{String(spec)}</li>)}
                  </ul>
                  {v.source && <p className="mt-1 text-[10px] text-[#736960]">Nguồn: {v.source.title} · {v.source.reviewedBy}</p>}
                </li>
              ))}
            </ul>
          </section>
        )}

        {dressingSteps.length > 0 && (
          <section>
            <h3 className="mb-2 font-serif text-lg font-bold">5. Hướng dẫn tự mặc</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {dressingSteps.map((d) => (
                <div key={d.need} className="rounded-xl border border-[#E6DCCD] p-3 text-xs">
                  <p className="mb-1 font-bold">{d.need}</p>
                  <ol className="list-decimal space-y-0.5 pl-4 text-[#4A423B]">
                    {d.steps.map((s) => <li key={s}>{s}</li>)}
                  </ol>
                </div>
              ))}
            </div>
          </section>
        )}

        <footer className="border-t border-[#E6DCCD] pt-3 text-[10px] leading-relaxed text-[#736960]">
          Thông số mang tính hỗ trợ thiết kế cá nhân hóa, không phải tiêu chuẩn y khoa. Hãy thử áo ở tư thế sử dụng thực tế (ngồi, di chuyển) trước khi hoàn thiện. Thông tin văn hóa tổng hợp từ nguồn tham khảo trong dữ liệu Vstyle.
        </footer>
      </article>
    </div>
  );
};
