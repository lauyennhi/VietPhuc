/**
 * Elegant wheelchair in a three-quarter view, split into a rear layer (behind the figure)
 * and a front layer (armrest, frame, footrest, casters) so the figure sits *in* the chair.
 */

import React from 'react';
import type { FigureGeometry } from './geometry';
import type { Ids } from './Defs';

const Wheel: React.FC<{ cx: number; cy: number; rx: number; ry: number; ids: Ids; faint?: boolean }> = ({ cx, cy, rx, ry, ids, faint }) => (
  <g opacity={faint ? 0.55 : 1}>
    <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke="#24272D" strokeWidth="6" />
    <ellipse cx={cx} cy={cy} rx={rx - 5} ry={ry - 5} fill="none" stroke={`url(#${ids.silver})`} strokeWidth="1.8" />
    {Array.from({ length: 12 }, (_, i) => {
      const a = (i / 12) * Math.PI * 2;
      return <line key={i} x1={cx} y1={cy} x2={cx + Math.cos(a) * (rx - 6)} y2={cy + Math.sin(a) * (ry - 6)} stroke="#8D939B" strokeWidth="0.6" opacity="0.8" />;
    })}
    <circle cx={cx} cy={cy} r="4" fill={`url(#${ids.metal})`} />
  </g>
);

export const WheelchairBack: React.FC<{ g: FigureGeometry; ids: Ids }> = ({ g, ids }) => {
  const { cx } = g;
  return (
    <g>
      <Wheel cx={cx + 70} cy={372} rx={22} ry={60} ids={ids} faint />
      {/* backrest */}
      <path d={`M${cx - g.shoulderHalf - 6} ${g.shoulderY + 12} L${cx + g.shoulderHalf + 6} ${g.shoulderY + 12} L${cx + g.shoulderHalf + 2} ${g.hipY + 14} L${cx - g.shoulderHalf - 2} ${g.hipY + 14} Z`} fill="#2B2F36" />
      {[-1, 1].map((side) => (
        <g key={side}>
          <path d={`M${cx + side * (g.shoulderHalf + 4)} ${g.hipY + 20} L${cx + side * (g.shoulderHalf + 6)} ${g.shoulderY - 6} Q${cx + side * (g.shoulderHalf + 7)} ${g.shoulderY - 14} ${cx + side * (g.shoulderHalf + 16)} ${g.shoulderY - 14}`} stroke={`url(#${ids.metal})`} strokeWidth="3.4" fill="none" strokeLinecap="round" />
          <circle cx={cx + side * (g.shoulderHalf + 17)} cy={g.shoulderY - 14} r="2.6" fill="#1C1C1E" />
        </g>
      ))}
      <Wheel cx={cx - 66} cy={370} rx={60} ry={64} ids={ids} />
    </g>
  );
};

export const WheelchairFront: React.FC<{ g: FigureGeometry; ids: Ids }> = ({ g, ids }) => {
  const { cx } = g;
  const seatY = g.hipY + 22;
  return (
    <g>
      {/* armrest + side frame over the near wheel */}
      <path d={`M${cx - 84} ${g.waistY + 30} L${cx - 40} ${g.waistY + 30}`} stroke="#2B2F36" strokeWidth="5" strokeLinecap="round" />
      <path d={`M${cx - 80} ${g.waistY + 32} L${cx - 76} ${seatY + 8} L${cx - 30} ${seatY + 8}`} stroke={`url(#${ids.metal})`} strokeWidth="2.6" fill="none" />
      {/* leg frame to footrest */}
      {[-1, 1].map((side) => (
        <path key={side} d={`M${cx + side * 30} ${seatY + 8} L${cx + side * 26} ${g.soleY - 2}`} stroke={`url(#${ids.metal})`} strokeWidth="2.4" />
      ))}
      <rect x={cx - 32} y={g.soleY - 1} width="64" height="4" rx="2" fill="#2B2F36" />
      {/* casters */}
      {[-1, 1].map((side) => (
        <g key={side}>
          <ellipse cx={cx + side * 46} cy={g.soleY + 12} rx="6" ry="9" fill="none" stroke="#24272D" strokeWidth="3" />
          <path d={`M${cx + side * 30} ${seatY + 8} Q${cx + side * 44} ${seatY + 40} ${cx + side * 46} ${g.soleY + 4}`} stroke={`url(#${ids.metal})`} strokeWidth="1.6" fill="none" />
        </g>
      ))}
    </g>
  );
};
