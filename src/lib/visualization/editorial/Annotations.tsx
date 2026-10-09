/**
 * Tailoring callouts drawn on the adapted figure: what changed and where.
 */

import React from 'react';
import type { FigureGeometry, GarmentLayout } from './geometry';

export interface Annotation {
  kind: 'hem' | 'slit' | 'sleeve' | 'closure' | 'opening';
  label: string;
}

const Pill: React.FC<{ x: number; y: number; text: string; anchor?: 'start' | 'end' }> = ({ x, y, text, anchor = 'start' }) => {
  const w = text.length * 4.6 + 12;
  const left = anchor === 'start' ? x : x - w;
  return (
    <g>
      <rect x={left} y={y - 8} width={w} height="15" rx="7.5" fill="#3D6B35" />
      <text x={left + w / 2} y={y + 2.6} textAnchor="middle" fontSize="8.4" fontWeight="700" fill="#FFFFFF" fontFamily="Be Vietnam Pro, Arial, sans-serif">{text}</text>
    </g>
  );
};

export const Annotations: React.FC<{ g: FigureGeometry; L: GarmentLayout; items: Annotation[] }> = ({ g, L, items }) => {
  const { cx } = g;
  return (
    <g pointerEvents="none">
      {items.map((item) => {
        if (item.kind === 'hem') {
          const x = cx + L.hemHalf * 0.82 + 4;
          return (
            <g key={item.kind}>
              <path d={`M${x} ${L.hemY} L${x + 22} ${L.hemY}`} stroke="#3D6B35" strokeWidth="1" strokeDasharray="2 2" />
              <path d={`M${x + 12} ${L.hemY + 14} L${x + 12} ${L.hemY + 2} M${x + 9} ${L.hemY + 5} L${x + 12} ${L.hemY + 1} L${x + 15} ${L.hemY + 5}`} stroke="#3D6B35" strokeWidth="1.2" fill="none" />
              <Pill x={x + 24} y={L.hemY} text={item.label} />
            </g>
          );
        }
        if (item.kind === 'slit') {
          const x = cx - g.hipHalf - 5;
          return (
            <g key={item.kind}>
              <circle cx={x} cy={L.slitY} r="3" fill="none" stroke="#3D6B35" strokeWidth="1.2" />
              <path d={`M${x - 3} ${L.slitY} L${x - 18} ${L.slitY}`} stroke="#3D6B35" strokeWidth="1" strokeDasharray="2 2" />
              <Pill x={x - 20} y={L.slitY} text={item.label} anchor="end" />
            </g>
          );
        }
        if (item.kind === 'sleeve') {
          const x = g.wristR.x + L.cuffHalf + 4;
          return (
            <g key={item.kind}>
              <path d={`M${x - 4} ${L.cuffY} L${x + 10} ${L.cuffY - 14}`} stroke="#3D6B35" strokeWidth="1" strokeDasharray="2 2" />
              <Pill x={Math.min(x + 10, 330)} y={L.cuffY - 16} text={item.label} />
            </g>
          );
        }
        if (item.kind === 'closure') {
          return (
            <g key={item.kind}>
              {L.closure.slice(1).map((p, i) => (
                <g key={i}>
                  <circle cx={p.x} cy={p.y} r="4.2" fill="#FFFFFF" opacity="0.85" />
                  <path d={`M${p.x - 2.4} ${p.y + 1.6} L${p.x - 2.4} ${p.y - 0.6} A2.4 2.4 0 0 1 ${p.x + 2.4} ${p.y - 0.6} L${p.x + 2.4} ${p.y + 1.6}`} stroke="#C0392B" strokeWidth="1.3" fill="none" />
                </g>
              ))}
              <path d={`M${L.closure[2].x - 5} ${L.closure[2].y} L${L.closure[2].x - 26} ${L.closure[2].y - 8}`} stroke="#3D6B35" strokeWidth="1" strokeDasharray="2 2" />
              <Pill x={L.closure[2].x - 28} y={L.closure[2].y - 10} text={item.label} anchor="end" />
            </g>
          );
        }
        return (
          <g key={item.kind}>
            <path d={`M${cx + g.neckHalf + 6} ${g.neckBase - 4} L${cx + g.neckHalf + 26} ${g.neckBase - 16}`} stroke="#3D6B35" strokeWidth="1" strokeDasharray="2 2" />
            <Pill x={cx + g.neckHalf + 27} y={g.neckBase - 18} text={item.label} />
          </g>
        );
      })}
    </g>
  );
};
