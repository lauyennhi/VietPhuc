/**
 * "Thử sức" quiz built from the approved garment data (no invented facts):
 * every correct answer and explanation comes from data/garments.json.
 */

import React, { useMemo, useState } from 'react';
import { Award, Check, RotateCcw, X } from 'lucide-react';
import { getApprovedGarments } from '../../lib/dal';
import type { Garment } from '../../types/domain';

interface Question {
  prompt: string;
  options: string[];
  answer: number;
  explain: string;
}

const MYTHS = [
  'Cài vạt sang bên trái (tả nhậm) cho lạ mắt',
  'Bỏ thân con bên trong cho nhẹ',
  'Cắt ngắn ống tay thụng cho gọn',
  'Khoét cổ thật sâu cho thoáng',
  'Mặc không cần lớp lót bên trong',
];

function shuffle<T>(items: T[], seed: number): T[] {
  const a = [...items];
  let s = seed;
  for (let i = a.length - 1; i > 0; i -= 1) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const short = (g: Garment) => g.name.replace(/\s*\(.*\)$/, '');
const redact = (text: string, g: Garment) => {
  const first = (text.match(/^[^.!?]+[.!?]/)?.[0] ?? text).trim();
  return short(g).split(' ').filter((w) => w.length > 2).reduce((t, w) => t.replace(new RegExp(w, 'gi'), '…'), first);
};

function buildQuiz(seed: number): Question[] {
  const garments = getApprovedGarments();
  const picked = shuffle(garments, seed);
  const firstOptions = shuffle(['Bên phải (hữu nhậm)', 'Bên trái (tả nhậm)', 'Chính giữa', 'Tùy người mặc'], seed + 1);
  const questions: Question[] = [
    {
      prompt: 'Vạt áo Việt phục truyền thống cài sang bên nào?',
      options: firstOptions,
      answer: firstOptions.indexOf('Bên phải (hữu nhậm)'),
      explain: 'Vạt trái đè sang phải — "hữu nhậm" — là quy tắc xuyên suốt của áo ngũ thân, áo tấc, giao lĩnh.',
    },
  ];

  // Identify a garment from its description.
  for (const g of picked.slice(0, 3)) {
    const options = shuffle([g, ...shuffle(garments.filter((x) => x.id !== g.id), seed + 7).slice(0, 3)], seed + g.id.length);
    questions.push({
      prompt: `Mô tả nào nói về áo này: “${redact(g.description, g)}”`,
      options: options.map(short),
      answer: options.findIndex((o) => o.id === g.id),
      explain: `${short(g)}: ${(g.description.match(/^[^.!?]+[.!?]/)?.[0] ?? g.description).trim()}`,
    });
  }

  // Which rule keeps the garment authentic.
  for (const g of picked.slice(3, 6)) {
    const rule = g.nonNegotiables[0];
    if (!rule) continue;
    const options = shuffle([rule, ...shuffle(MYTHS, seed + 3).slice(0, 3)], seed + rule.length);
    questions.push({
      prompt: `Mặc ${short(g)} thế nào để giữ đúng đặc trưng?`,
      options,
      answer: options.indexOf(rule),
      explain: `Quy tắc của ${short(g)}: ${g.nonNegotiables.join('; ')}.`,
    });
  }

  // Era.
  for (const g of picked.slice(6, 8)) {
    const eras = [...new Set(garments.map((x) => x.era).filter((e) => e && e !== g.era))];
    const options = shuffle([g.era, ...shuffle(eras, seed + 11).slice(0, 3)], seed + 5);
    questions.push({
      prompt: `${short(g)} gắn với thời kỳ nào?`,
      options,
      answer: options.indexOf(g.era),
      explain: `${short(g)} — ${g.era}.`,
    });
  }
  return questions.slice(0, 8);
}

export const Quiz: React.FC<{ onExplore?: () => void }> = ({ onExplore }) => {
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1000) + 1);
  const questions = useMemo(() => buildQuiz(seed), [seed]);
  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const done = index >= questions.length;
  const q = questions[index];

  const restart = () => {
    setSeed((s) => s + 17);
    setIndex(0);
    setChosen(null);
    setScore(0);
  };

  if (done) {
    const ratio = score / questions.length;
    return (
      <div className="mx-auto max-w-xl space-y-4 rounded-[28px] border border-[#E8DFD3] bg-[#FFFFFF] p-8 text-center animate-rise">
        <Award className="mx-auto size-12 text-[#D4A338]" aria-hidden="true" />
        <p className="font-serif text-4xl font-bold text-[#1E3443]">{score}/{questions.length}</p>
        <p className="text-lg font-semibold text-[#1E3443]">{ratio >= 0.85 ? 'Nhà nghiên cứu Việt phục!' : ratio >= 0.5 ? 'Hiểu biết vững vàng' : 'Cùng tìm hiểu thêm nhé'}</p>
        <div className="flex justify-center gap-2">
          <button type="button" onClick={restart} className="press inline-flex min-h-11 items-center gap-2 rounded-full bg-[#1E3443] px-6 text-sm font-semibold text-[#FFFFFF]"><RotateCcw className="size-4" aria-hidden="true" /> Chơi lại</button>
          {onExplore && <button type="button" onClick={onExplore} className="press min-h-11 rounded-full border border-[#E8DFD3] px-6 text-sm font-semibold text-[#1E3443]">Xem các loại áo</button>}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#EFE7DA]" aria-hidden="true">
          <div className="h-full rounded-full bg-[#C4553F] transition-all" style={{ width: `${(index / questions.length) * 100}%` }} />
        </div>
        <span className="font-mono text-sm text-[#7A6F66]">{index + 1}/{questions.length}</span>
      </div>
      <div className="space-y-4 rounded-[28px] border border-[#E8DFD3] bg-[#FFFFFF] p-6 sm:p-8" key={index}>
        <h2 className="font-serif text-xl font-bold leading-snug text-[#1E3443] sm:text-2xl">{q.prompt}</h2>
        <div className="grid gap-2">
          {q.options.map((option, i) => {
            const isAnswer = i === q.answer;
            const picked = chosen === i;
            const state = chosen === null ? '' : isAnswer ? 'border-[#4F7350] bg-[#EEF4EC]' : picked ? 'border-[#A33A2B] bg-[#FBEFEE]' : 'opacity-60';
            return (
              <button
                key={option}
                type="button"
                disabled={chosen !== null}
                onClick={() => {
                  setChosen(i);
                  if (isAnswer) setScore((s) => s + 1);
                }}
                className={`press flex min-h-12 items-center justify-between gap-3 rounded-2xl border border-[#E8DFD3] px-4 py-3 text-left text-[15px] text-[#1E3443] transition hover:bg-[#FAF6F0] disabled:cursor-default ${state}`}
              >
                {option}
                {chosen !== null && isAnswer && <Check className="size-5 shrink-0 text-[#4F7350]" aria-hidden="true" />}
                {picked && !isAnswer && <X className="size-5 shrink-0 text-[#A33A2B]" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
        {chosen !== null && (
          <div className="space-y-3 animate-rise">
            <p className="rounded-2xl bg-[#FAF6F0] p-3.5 text-sm leading-relaxed text-[#4A423B]" role="status">
              <strong className={chosen === q.answer ? 'text-[#4F7350]' : 'text-[#A33A2B]'}>{chosen === q.answer ? 'Chính xác! ' : 'Chưa đúng. '}</strong>{q.explain}
            </p>
            <button type="button" onClick={() => { setIndex((i) => i + 1); setChosen(null); }} className="press min-h-11 w-full rounded-full bg-[#1E3443] text-sm font-semibold text-[#FFFFFF]">
              {index + 1 === questions.length ? 'Xem kết quả' : 'Câu tiếp theo'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
