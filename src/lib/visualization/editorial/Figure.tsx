/**
 * Editorial fashion figure: 9-head proportions, soft skin modelling, refined facial
 * features, four hairstyles, tapered hands, and standing / seated leg poses.
 */

import React from 'react';
import type { FigureGeometry } from './geometry';
import type { Ids } from './Defs';
import { shade, skinTones } from './palette';

const n = (v: number) => v.toFixed(1);

export type HairStyle = 'TOC_VAN' | 'TOC_BUI' | 'TOC_XOA' | 'TOC_NGAN' | 'NAM';

/* ------------------------------------------------------------------ */
/* Hair behind the body (long hair, bun backs)                         */
/* ------------------------------------------------------------------ */

export const BackHair: React.FC<{ g: FigureGeometry; ids: Ids; style: HairStyle; hair: string }> = ({ g, ids, style, hair }) => {
  const { cx, cy, rx } = g.head;
  if (style === 'TOC_XOA') {
    const end = g.chestY + 40;
    return (
      <g>
        <path
          d={`M${n(cx - rx - 4)} ${n(cy - 8)} Q${n(cx - rx - 16)} ${n(cy + 40)} ${n(cx - rx - 12)} ${n(end)} Q${n(cx)} ${n(end + 14)} ${n(cx + rx + 12)} ${n(end)} Q${n(cx + rx + 16)} ${n(cy + 40)} ${n(cx + rx + 4)} ${n(cy - 8)} Z`}
          fill={`url(#${ids.hair})`}
        />
        <path d={`M${n(cx - rx - 6)} ${n(cy + 20)} Q${n(cx - rx - 10)} ${n(cy + 60)} ${n(cx - rx - 6)} ${n(end - 4)}`} stroke={shade(hair, 0.18)} strokeWidth="0.8" fill="none" opacity="0.5" />
      </g>
    );
  }
  return null;
};

/* ------------------------------------------------------------------ */
/* Legs: wide traditional trousers (quần ống rộng) or skirt (váy)      */
/* ------------------------------------------------------------------ */

export const Legs: React.FC<{ g: FigureGeometry; ids: Ids; pant: string; skirt?: boolean; skin: string; showShoes: boolean }> = ({ g, ids, pant, skirt, skin, showShoes }) => {
  const { cx } = g;
  const shoeColor = '#1F1A17';
  const s = skinTones(skin);
  if (g.seated) {
    const top = g.lapY - 2;
    const legs = [-1, 1].map((side) => {
      const xTop = cx + side * 18;
      const xBot = cx + side * 16;
      return (
        <g key={side}>
          <path d={`M${n(xTop - 14)} ${n(top)} L${n(xTop + 14)} ${n(top)} L${n(xBot + 12)} ${n(g.ankleY)} L${n(xBot - 12)} ${n(g.ankleY)} Z`} fill={skirt ? shade(pant, -0.05) : `url(#${ids.pant})`} />
          <path d={`M${n(xTop + side * 4)} ${n(top + 10)} L${n(xBot + side * 3)} ${n(g.ankleY - 6)}`} stroke={shade(pant, -0.18)} strokeWidth="1" opacity="0.5" />
          {showShoes && <ellipse cx={xBot} cy={g.soleY - 3} rx="13" ry="6" fill={shoeColor} />}
          {!showShoes && <ellipse cx={xBot} cy={g.ankleY + 3} rx="5" ry="3" fill={s.shadow} />}
        </g>
      );
    });
    return <g>{legs}</g>;
  }
  if (skirt) {
    return (
      <g>
        <path d={`M${n(cx - g.hipHalf - 2)} ${n(g.waistY)} Q${n(cx - g.hipHalf - 10)} ${n(g.kneeY)} ${n(cx - g.hipHalf - 12)} ${n(g.ankleY)} L${n(cx + g.hipHalf + 12)} ${n(g.ankleY)} Q${n(cx + g.hipHalf + 10)} ${n(g.kneeY)} ${n(cx + g.hipHalf + 2)} ${n(g.waistY)} Z`} fill={`url(#${ids.pant})`} />
        {[-14, 0, 14].map((dx) => <path key={dx} d={`M${n(cx + dx)} ${n(g.hipY)} L${n(cx + dx * 1.3)} ${n(g.ankleY - 4)}`} stroke={shade(pant, -0.15)} strokeWidth="1" opacity="0.45" />)}
        {showShoes && [-1, 1].map((side) => <ellipse key={side} cx={cx + side * 11} cy={g.soleY - 3} rx="11" ry="5" fill={shoeColor} />)}
      </g>
    );
  }
  const legs = [-1, 1].map((side) => {
    const inner = cx + side * (g.legGap / 2);
    const outerTop = cx + side * (g.hipHalf + 1);
    const outerBot = cx + side * (g.legGap / 2 + 26);
    return (
      <g key={side}>
        <path d={`M${n(inner)} ${n(g.hipY)} L${n(outerTop)} ${n(g.hipY - 18)} Q${n(outerTop + side * 4)} ${n(g.kneeY)} ${n(outerBot)} ${n(g.ankleY)} L${n(inner + side * 3)} ${n(g.ankleY)} Z`} fill={`url(#${ids.pant})`} />
        <path d={`M${n(inner + side * 10)} ${n(g.kneeY - 40)} Q${n(inner + side * 12)} ${n(g.kneeY + 30)} ${n(inner + side * 9)} ${n(g.ankleY - 4)}`} stroke={shade(pant, -0.16)} strokeWidth="1" fill="none" opacity="0.45" />
        <path d={`M${n(inner + side * 3)} ${n(g.ankleY)} L${n(outerBot)} ${n(g.ankleY)}`} stroke={shade(pant, -0.22)} strokeWidth="1.2" opacity="0.6" />
        {showShoes && (
          <path d={`M${n(cx + side * 6)} ${n(g.ankleY + 2)} Q${n(cx + side * 24)} ${n(g.ankleY)} ${n(cx + side * 26)} ${n(g.soleY - 2)} L${n(cx + side * 5)} ${n(g.soleY)} Z`} fill={shoeColor} />
        )}
      </g>
    );
  });
  return <g>{legs}</g>;
};

/* ------------------------------------------------------------------ */
/* Neck                                                                */
/* ------------------------------------------------------------------ */

export const Neck: React.FC<{ g: FigureGeometry; ids: Ids; skin: string }> = ({ g, ids, skin }) => {
  const s = skinTones(skin);
  const { cx } = g;
  return (
    <g>
      <path d={`M${n(cx - g.neckHalf)} ${n(g.neckTop)} L${n(cx - g.neckHalf - 1)} ${n(g.neckBase + 6)} L${n(cx + g.neckHalf + 1)} ${n(g.neckBase + 6)} L${n(cx + g.neckHalf)} ${n(g.neckTop)} Z`} fill={`url(#${ids.skin})`} />
      <path d={`M${n(cx - g.neckHalf)} ${n(g.neckTop + 2)} Q${n(cx)} ${n(g.neckTop + 9)} ${n(cx + g.neckHalf)} ${n(g.neckTop + 2)}`} fill={s.shadow} opacity="0.55" />
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* Head, face and front hair                                           */
/* ------------------------------------------------------------------ */

export const Head: React.FC<{ g: FigureGeometry; ids: Ids; skin: string; hair: string; style: HairStyle }> = ({ g, ids, skin, hair, style }) => {
  const { cx, cy, rx, ry } = g.head;
  const s = skinTones(skin);
  const jaw = g.masculine ? 0.82 : 0.7;
  const face = `M${n(cx - rx)} ${n(cy - 4)} Q${n(cx - rx)} ${n(cy - ry)} ${n(cx)} ${n(cy - ry)} Q${n(cx + rx)} ${n(cy - ry)} ${n(cx + rx)} ${n(cy - 4)} Q${n(cx + rx * 0.98)} ${n(cy + ry * 0.55)} ${n(cx + rx * jaw * 0.6)} ${n(cy + ry * 0.86)} Q${n(cx)} ${n(cy + ry + 2)} ${n(cx - rx * jaw * 0.6)} ${n(cy + ry * 0.86)} Q${n(cx - rx * 0.98)} ${n(cy + ry * 0.55)} ${n(cx - rx)} ${n(cy - 4)} Z`;
  const hl = shade(hair, 0.22);
  const eyeY = cy + 2;
  const brow = g.masculine ? 1.5 : 1;

  const hairCap = (
    <path
      d={`M${n(cx - rx - 2)} ${n(cy + 2)} Q${n(cx - rx - 4)} ${n(cy - ry - 8)} ${n(cx)} ${n(cy - ry - 6)} Q${n(cx + rx + 4)} ${n(cy - ry - 8)} ${n(cx + rx + 2)} ${n(cy + 2)} Q${n(cx + rx - 3)} ${n(cy - 12)} ${n(cx + 2)} ${n(cy - ry + 3)} Q${n(cx - rx + 3)} ${n(cy - 12)} ${n(cx - rx - 2)} ${n(cy + 2)} Z`}
      fill={`url(#${ids.hair})`}
    />
  );

  return (
    <g>
      {/* ears */}
      {[-1, 1].map((side) => <ellipse key={side} cx={cx + side * (rx - 0.5)} cy={cy + 3} rx="2.6" ry="4.4" fill={s.shadow} />)}
      <path d={face} fill={`url(#${ids.skinFace})`} />
      {/* soft modelling */}
      <path d={`M${n(cx + rx * 0.55)} ${n(cy - 6)} Q${n(cx + rx * 0.95)} ${n(cy + 6)} ${n(cx + rx * 0.45)} ${n(cy + ry * 0.8)}`} stroke={s.shadow} strokeWidth="3" fill="none" opacity="0.35" filter={`url(#${ids.fold})`} />
      {[-1, 1].map((side) => <ellipse key={side} cx={cx + side * 9} cy={cy + 9} rx="4.2" ry="2.4" fill={s.blush} opacity="0.35" />)}
      {/* brows */}
      {[-1, 1].map((side) => <path key={side} d={`M${n(cx + side * 3.5)} ${n(eyeY - 7)} Q${n(cx + side * 8.5)} ${n(eyeY - 9.5)} ${n(cx + side * 13)} ${n(eyeY - 6.5)}`} stroke={shade(hair, 0.05)} strokeWidth={brow} fill="none" strokeLinecap="round" opacity="0.85" />)}
      {/* calm downcast eyes with lashes */}
      {[-1, 1].map((side) => (
        <g key={side}>
          <path d={`M${n(cx + side * 4.5)} ${n(eyeY)} Q${n(cx + side * 8.5)} ${n(eyeY + 2.6)} ${n(cx + side * 12.2)} ${n(eyeY - 0.2)}`} stroke="#2A1D18" strokeWidth="1.1" fill="none" strokeLinecap="round" />
          {!g.masculine && <path d={`M${n(cx + side * 11.6)} ${n(eyeY)} l${n(side * 1.6)} -1.2`} stroke="#2A1D18" strokeWidth="0.7" strokeLinecap="round" />}
        </g>
      ))}
      {/* nose & lips */}
      <path d={`M${n(cx + 0.6)} ${n(eyeY + 3)} Q${n(cx + 2.2)} ${n(eyeY + 9)} ${n(cx - 0.8)} ${n(eyeY + 10.5)}`} stroke={s.deep} strokeWidth="0.8" fill="none" opacity="0.55" strokeLinecap="round" />
      <path d={`M${n(cx - 4.2)} ${n(eyeY + 15)} Q${n(cx)} ${n(eyeY + 13.4)} ${n(cx + 4.2)} ${n(eyeY + 15)} Q${n(cx)} ${n(eyeY + 18.4)} ${n(cx - 4.2)} ${n(eyeY + 15)} Z`} fill={g.masculine ? shade(s.lip, 0.1) : s.lip} opacity={g.masculine ? 0.6 : 0.92} />

      {/* hair */}
      {style === 'NAM' && (
        <g>
          {hairCap}
          <ellipse cx={cx} cy={cy - ry - 4} rx="7" ry="5" fill={`url(#${ids.hair})`} />
        </g>
      )}
      {style === 'TOC_NGAN' && (
        <g>
          <path d={`M${n(cx - rx - 4)} ${n(cy + 14)} Q${n(cx - rx - 6)} ${n(cy - ry - 8)} ${n(cx)} ${n(cy - ry - 7)} Q${n(cx + rx + 6)} ${n(cy - ry - 8)} ${n(cx + rx + 4)} ${n(cy + 14)} L${n(cx + rx - 2)} ${n(cy + 12)} Q${n(cx + rx - 2)} ${n(cy - 10)} ${n(cx + 4)} ${n(cy - ry + 5)} Q${n(cx - 10)} ${n(cy - 8)} ${n(cx - rx + 1)} ${n(cy + 12)} Z`} fill={`url(#${ids.hair})`} />
          <path d={`M${n(cx - 6)} ${n(cy - ry - 4)} Q${n(cx - rx)} ${n(cy - 6)} ${n(cx - rx - 2)} ${n(cy + 10)}`} stroke={hl} strokeWidth="0.8" fill="none" opacity="0.6" />
        </g>
      )}
      {(style === 'TOC_VAN' || style === 'TOC_BUI' || style === 'TOC_XOA') && (
        <g>
          {hairCap}
          <path d={`M${n(cx)} ${n(cy - ry - 5)} Q${n(cx - rx + 2)} ${n(cy - ry + 2)} ${n(cx - rx - 1)} ${n(cy)}`} stroke={hl} strokeWidth="0.8" fill="none" opacity="0.55" />
          <path d={`M${n(cx + 2)} ${n(cy - ry - 5)} Q${n(cx + rx - 2)} ${n(cy - ry + 2)} ${n(cx + rx + 1)} ${n(cy)}`} stroke={hl} strokeWidth="0.6" fill="none" opacity="0.4" />
        </g>
      )}
      {style === 'TOC_VAN' && (
        // Vấn tóc: hair wrapped in a dark band around the crown.
        <g>
          <path d={`M${n(cx - rx - 4)} ${n(cy - 8)} Q${n(cx)} ${n(cy - ry - 15)} ${n(cx + rx + 4)} ${n(cy - 8)} Q${n(cx + rx + 1)} ${n(cy - ry - 2)} ${n(cx)} ${n(cy - ry - 6)} Q${n(cx - rx - 1)} ${n(cy - ry - 2)} ${n(cx - rx - 4)} ${n(cy - 8)} Z`} fill={shade(hair, 0.03)} />
          {[0, 1].map((i) => <path key={i} d={`M${n(cx - rx - 2 + i * 2)} ${n(cy - 10 - i * 3)} Q${n(cx)} ${n(cy - ry - 12 + i * 2)} ${n(cx + rx + 2 - i * 2)} ${n(cy - 10 - i * 3)}`} stroke={hl} strokeWidth="0.6" fill="none" opacity="0.45" />)}
        </g>
      )}
      {style === 'TOC_BUI' && (
        <g>
          <circle cx={cx + 6} cy={cy - ry - 10} r="10" fill={`url(#${ids.hair})`} />
          <path d={`M${n(cx - 2)} ${n(cy - ry - 12)} Q${n(cx + 6)} ${n(cy - ry - 22)} ${n(cx + 14)} ${n(cy - ry - 12)}`} stroke={hl} strokeWidth="0.7" fill="none" opacity="0.55" />
        </g>
      )}
      {style === 'TOC_XOA' && (
        <path d={`M${n(cx - rx - 2)} ${n(cy + 2)} Q${n(cx - rx - 6)} ${n(cy + 30)} ${n(cx - rx - 3)} ${n(g.shoulderY + 6)} L${n(cx - rx + 3)} ${n(g.shoulderY + 4)} Q${n(cx - rx)} ${n(cy + 26)} ${n(cx - rx + 1)} ${n(cy + 4)} Z`} fill={`url(#${ids.hair})`} />
      )}
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* Hands                                                               */
/* ------------------------------------------------------------------ */

export const Hand: React.FC<{ x: number; y: number; angle: number; ids: Ids; skin: string; mirror?: boolean }> = ({ x, y, angle, ids, skin, mirror }) => {
  const s = skinTones(skin);
  return (
    <g transform={`translate(${n(x)} ${n(y)}) rotate(${angle}) scale(${mirror ? -1.15 : 1.15} 1.15)`}>
      <path d="M-4.5 -2 Q-6 8 -4.5 16 Q-2 22 1.5 21.5 Q5 20 5 14 Q5.5 6 4.5 -2 Z" fill={`url(#${ids.skin})`} />
      <path d="M4.2 3 Q8.5 7 7 12 Q5.5 13 4.6 10" fill={s.base} stroke={s.shadow} strokeWidth="0.5" />
      {[-2, 0.5, 3].map((fx) => <path key={fx} d={`M${fx} 14 L${fx + 0.2} 20`} stroke={s.shadow} strokeWidth="0.5" opacity="0.7" />)}
    </g>
  );
};
