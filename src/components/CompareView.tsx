import React, { useState, useMemo } from 'react';
import type { CharacterItem } from '../types/fashion';
import type { FunctionalNeedCode } from '../types/domain';
import { getApprovedGarments, getApprovedAccessories, getEventById } from '../lib/dal';
import { checkCulture } from '../lib/culture/ruleEngine';
import { calculateStyleScore } from '../lib/recommendation/engine';
import { evaluateColorHarmony } from '../lib/color/harmony';
import { OutfitMockupCanvas } from './OutfitMockupCanvas';
import { Dialog } from './ui/Dialog';

export interface LookSnapshot {
  id: string;
  title: string;
  garmentId: string;
  primaryColor: string;
  pantColor: string;
  accessoryIds: string[];
  eventId: string;
  styleVibe: string;
  adaptiveNeedCodes?: FunctionalNeedCode[];
}

export interface CompareViewProps {
  looks: LookSnapshot[];
  character: CharacterItem;
  onClose: () => void;
  onUseLook: (look: LookSnapshot) => void;
}

export const CompareView: React.FC<CompareViewProps> = ({
  looks,
  character,
  onClose,
  onUseLook,
}) => {
  const allGarments = useMemo(() => getApprovedGarments(), []);
  const allAccessories = useMemo(() => getApprovedAccessories(), []);

  const [indexA, setIndexA] = useState(0);
  const [indexB, setIndexB] = useState(Math.min(1, looks.length - 1));

  const lookA = looks[indexA] || looks[0];
  const lookB = looks[indexB] || looks[1] || looks[0];

  const garmentA = allGarments.find((g) => g.id === lookA?.garmentId) || allGarments[0];
  const garmentB = allGarments.find((g) => g.id === lookB?.garmentId) || allGarments[0];

  const accessoriesA = allAccessories.filter((a) => lookA?.accessoryIds.includes(a.id));
  const accessoriesB = allAccessories.filter((a) => lookB?.accessoryIds.includes(a.id));

  // Scores for Look A
  const cultureA = useMemo(() => checkCulture({
    garmentId: lookA.garmentId,
    accessoryIds: lookA.accessoryIds,
    eventId: lookA.eventId,
    primaryColor: lookA.primaryColor,
  }), [lookA]);

  const styleA = useMemo(() => calculateStyleScore(
    garmentA,
    lookA.primaryColor,
    lookA.accessoryIds,
    lookA.eventId,
    lookA.styleVibe,
  ), [garmentA, lookA]);

  const harmonyA = useMemo(() => evaluateColorHarmony({
    primaryColor: lookA.primaryColor,
    pantColor: lookA.pantColor,
    accessoryColors: accessoriesA.map((a) => a.colors[0]).filter(Boolean),
  }), [lookA, accessoriesA]);

  // Scores for Look B
  const cultureB = useMemo(() => checkCulture({
    garmentId: lookB.garmentId,
    accessoryIds: lookB.accessoryIds,
    eventId: lookB.eventId,
    primaryColor: lookB.primaryColor,
  }), [lookB]);

  const styleB = useMemo(() => calculateStyleScore(
    garmentB,
    lookB.primaryColor,
    lookB.accessoryIds,
    lookB.eventId,
    lookB.styleVibe,
  ), [garmentB, lookB]);

  const harmonyB = useMemo(() => evaluateColorHarmony({
    primaryColor: lookB.primaryColor,
    pantColor: lookB.pantColor,
    accessoryColors: accessoriesB.map((a) => a.colors[0]).filter(Boolean),
  }), [lookB, accessoriesB]);

  return (
    <Dialog bare title="So sánh 2 bộ phối" size="4xl" onClose={onClose}>
      <div className="bg-[#FFFFFF] border border-[#E6DCCD] rounded-t-[32px] sm:rounded-[32px] w-full p-6 sm:p-8 space-y-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E6DCCD]">
          <div>
            <h2 className="font-serif text-2xl font-bold text-[#1F1B18]">
              So Sánh 2 Phương Án Phối
            </h2>
            <p className="text-xs text-[#736960] mt-0.5">
              Đặt hai bộ phối cạnh nhau để đối chiếu chuẩn văn hóa, tính ứng dụng và sắc màu
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="press size-9 rounded-full border border-[#E6DCCD] hover:bg-[#F1EADF] text-[#736960] flex items-center justify-center font-bold"
          >
            ✕
          </button>
        </div>

        {/* Comparative Columns: A vs B */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* OPTION A */}
          <div className="rounded-[28px] border border-[#E6DCCD] bg-[#FAF6F0] p-4 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-[#1F1B18] text-[#FFFFFF] text-xs font-bold font-mono">
                  Phương án A
                </span>
                {looks.length > 2 && (
                  <select
                    value={indexA}
                    onChange={(e) => setIndexA(Number(e.target.value))}
                    className="text-xs rounded-xl border border-[#E6DCCD] bg-[#FFFFFF] px-2.5 py-1 text-[#1F1B18]"
                  >
                    {looks.map((l, i) => (
                      <option key={l.id} value={i} disabled={i === indexB}>
                        {l.title}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <h3 className="font-serif text-lg font-bold text-[#1F1B18]">
                {lookA.title}
              </h3>

              {/* Canvas A */}
              <div className="aspect-[4/5] max-w-[280px] mx-auto rounded-2xl overflow-hidden bg-[#FFFFFF] border border-[#E6DCCD] shadow-inner">
                <OutfitMockupCanvas
                  garment={garmentA}
                  primaryColor={lookA.primaryColor}
                  pantColor={lookA.pantColor}
                  accessories={accessoriesA}
                  character={character}
                  compact
                />
              </div>

              {/* Metrics A */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs pt-2">
                <div className="p-2.5 rounded-xl bg-[#FFFFFF] border border-[#E6DCCD]">
                  <span className="text-[10px] text-[#736960] block">Giữ bản sắc</span>
                  <span className="font-bold text-[#4F7350] font-mono text-base">{cultureA.score}/100</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#FFFFFF] border border-[#E6DCCD]">
                  <span className="text-[10px] text-[#736960] block">Hợp với dịp</span>
                  <span className="font-bold text-[#2E4A6B] font-mono text-base">{styleA.score}/100</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#FFFFFF] border border-[#E6DCCD]">
                  <span className="text-[10px] text-[#736960] block">Hòa hợp màu</span>
                  <span className="font-bold text-[#8A5E17] font-mono text-base">{harmonyA.score}/100</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onUseLook(lookA)}
              className="press w-full py-2.5 rounded-xl bg-[#1F1B18] text-[#FFFFFF] text-xs font-bold hover:bg-[#332E29] transition"
            >
              Chọn Phương án A →
            </button>
          </div>

          {/* OPTION B */}
          <div className="rounded-[28px] border border-[#E6DCCD] bg-[#FAF6F0] p-4 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-[#8A5E17] text-[#FFFFFF] text-xs font-bold font-mono">
                  Phương án B
                </span>
                {looks.length > 2 && (
                  <select
                    value={indexB}
                    onChange={(e) => setIndexB(Number(e.target.value))}
                    className="text-xs rounded-xl border border-[#E6DCCD] bg-[#FFFFFF] px-2.5 py-1 text-[#1F1B18]"
                  >
                    {looks.map((l, i) => (
                      <option key={l.id} value={i} disabled={i === indexA}>
                        {l.title}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <h3 className="font-serif text-lg font-bold text-[#1F1B18]">
                {lookB.title}
              </h3>

              {/* Canvas B */}
              <div className="aspect-[4/5] max-w-[280px] mx-auto rounded-2xl overflow-hidden bg-[#FFFFFF] border border-[#E6DCCD] shadow-inner">
                <OutfitMockupCanvas
                  garment={garmentB}
                  primaryColor={lookB.primaryColor}
                  pantColor={lookB.pantColor}
                  accessories={accessoriesB}
                  character={character}
                  compact
                />
              </div>

              {/* Metrics B */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs pt-2">
                <div className="p-2.5 rounded-xl bg-[#FFFFFF] border border-[#E6DCCD]">
                  <span className="text-[10px] text-[#736960] block">Giữ bản sắc</span>
                  <span className="font-bold text-[#4F7350] font-mono text-base">{cultureB.score}/100</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#FFFFFF] border border-[#E6DCCD]">
                  <span className="text-[10px] text-[#736960] block">Hợp với dịp</span>
                  <span className="font-bold text-[#2E4A6B] font-mono text-base">{styleB.score}/100</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#FFFFFF] border border-[#E6DCCD]">
                  <span className="text-[10px] text-[#736960] block">Hòa hợp màu</span>
                  <span className="font-bold text-[#8A5E17] font-mono text-base">{harmonyB.score}/100</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onUseLook(lookB)}
              className="press w-full py-2.5 rounded-xl bg-[#1F1B18] text-[#FFFFFF] text-xs font-bold hover:bg-[#332E29] transition"
            >
              Chọn Phương án B →
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  );
};
