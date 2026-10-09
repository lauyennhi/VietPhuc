/**
 * Garment rendering with 3-tone layering:
 *  1. base fill (directional gradient) + silk weave / brocade texture,
 *  2. soft fold shadows (blurred darker paths),
 *  3. highlight strokes and a sheen band that read as raw silk.
 * Structure (collar, closure side, button count, sleeve, hem) comes from garment data.
 */

import React from 'react';
import type { FigureGeometry, GarmentLayout } from './geometry';
import type { Ids } from './Defs';
import { fabricTones, mix, shade } from './palette';

const n = (v: number) => v.toFixed(1);

interface GarmentProps {
  g: FigureGeometry;
  L: GarmentLayout;
  ids: Ids;
  fabric: string;
  brocade: boolean;
  closureType?: string;
  innerColor?: string;
  yemColor?: string;
}

/* ---------- outline helpers ---------- */

function bodyOutline(g: FigureGeometry, L: GarmentLayout): string {
  const { cx } = g;
  const sh = g.shoulderHalf;
  const nL = cx - g.neckHalf - 3 - L.neckOpen;
  const nR = cx + g.neckHalf + 3 + L.neckOpen;
  const ny = g.neckBase - 3;
  const hipX = g.hipHalf + 4;
  const frontHem = L.hemHalf * 0.82;
  const lowerSide = (side: -1 | 1) => {
    if (g.seated) {
      // Seated: the robe spreads over the thighs (foreshortened lap) to the knees, then hangs.
      const knee = Math.min(g.lapY, L.hemY);
      return [
        `${n(cx + side * (g.waistHalf + 5))} ${n(g.waistY)}`,
        `${n(cx + side * (hipX + 10))} ${n(g.hipY + 4)}`,
        `${n(cx + side * (hipX + 14))} ${n(knee)}`,
        `${n(cx + side * Math.max(hipX + 6, frontHem))} ${n(Math.max(L.hemY, knee + 1))}`,
      ];
    }
    return [
      `${n(cx + side * (g.waistHalf + 5))} ${n(g.waistY)}`,
      `${n(cx + side * hipX)} ${n(L.slitY)}`,
      `${n(cx + side * frontHem)} ${n(L.hemY)}`,
    ];
  };
  const left = lowerSide(-1);
  const right = lowerSide(1).reverse();
  return [
    `M${n(nL)} ${n(ny)}`,
    `Q${n(cx - sh * 0.6)} ${n(ny + 2)} ${n(cx - sh)} ${n(g.shoulderY + 3)}`,
    `L${n(cx - sh + 7)} ${n(g.chestY - 2)}`,
    `Q${n(cx - g.waistHalf - 9)} ${n(g.chestY + 30)} ${left[0]}`,
    ...left.slice(1).map((p) => `L${p}`),
    `Q${n(cx)} ${n(L.hemY + 6)} ${right[0]}`,
    ...right.slice(1, -1).map((p) => `L${p}`),
    `L${right[right.length - 1]}`,
    `Q${n(cx + g.waistHalf + 9)} ${n(g.chestY + 30)} ${n(cx + sh - 7)} ${n(g.chestY - 2)}`,
    `L${n(cx + sh)} ${n(g.shoulderY + 3)}`,
    `Q${n(cx + sh * 0.6)} ${n(ny + 2)} ${n(nR)} ${n(ny)}`,
    `Q${n(cx)} ${n(ny + 10 + L.neckOpen)} ${n(nL)} ${n(ny)} Z`,
  ].join(' ');
}

function sleevePath(g: FigureGeometry, L: GarmentLayout, side: -1 | 1): string {
  const { cx } = g;
  const sh = g.shoulderHalf;
  const wrist = side < 0 ? g.wristL : g.wristR;
  const top = `${n(cx + side * (sh - 8))} ${n(g.shoulderY + 1)}`;
  const shoulder = `${n(cx + side * (sh + 6))} ${n(g.shoulderY + 14)}`;
  const armpit = `${n(cx + side * (sh - 10))} ${n(g.chestY + 6)}`;
  if (L.wideSleeve) {
    const outer = wrist.x + side * L.cuffHalf;
    const inner = wrist.x - side * L.cuffHalf * 0.7;
    return `M${top} Q${n(cx + side * (sh + 10))} ${n(g.shoulderY + 4)} ${shoulder} Q${n(outer + side * 2)} ${n(L.cuffY - 40)} ${n(outer)} ${n(L.cuffY)} Q${n(wrist.x)} ${n(L.cuffY + 18)} ${n(inner)} ${n(L.cuffY - 4)} Q${n(cx + side * (sh - 4))} ${n(g.waistY - 10)} ${armpit} Z`;
  }
  const t = Math.min(1, (L.cuffY - g.shoulderY) / Math.max(1, wrist.y - g.shoulderY));
  const cuffX = cx + side * (sh + 6) + (wrist.x - (cx + side * (sh + 6))) * t;
  return `M${top} Q${n(cx + side * (sh + 8))} ${n(g.shoulderY + 3)} ${shoulder} L${n(cuffX + side * L.cuffHalf)} ${n(L.cuffY)} L${n(cuffX - side * L.cuffHalf)} ${n(L.cuffY + 1.5)} Q${n(cx + side * (sh - 6))} ${n(g.chestY + 40)} ${armpit} Z`;
}

/** Point at fraction t along a polyline. */
function along(points: Array<{ x: number; y: number }>, t: number) {
  const segs = points.slice(1).map((p, i) => Math.hypot(p.x - points[i].x, p.y - points[i].y));
  const total = segs.reduce((a, b) => a + b, 0);
  let d = t * total;
  for (let i = 0; i < segs.length; i += 1) {
    if (d <= segs[i]) {
      const k = d / segs[i];
      return { x: points[i].x + (points[i + 1].x - points[i].x) * k, y: points[i].y + (points[i + 1].y - points[i].y) * k };
    }
    d -= segs[i];
  }
  return points[points.length - 1];
}

/* ---------- components ---------- */

/** Back panel (tà sau) — drawn behind the legs. */
export const BackPanel: React.FC<{ g: FigureGeometry; L: GarmentLayout; ids: Ids }> = ({ g, L, ids }) => {
  const { cx } = g;
  const top = g.seated ? g.hipY + 2 : L.slitY;
  const hipX = g.hipHalf + (g.seated ? 10 : 4);
  const hem = g.seated ? Math.min(L.hemY, g.lapY + 30) : L.hemY + 3;
  return (
    <path
      d={`M${n(cx - hipX)} ${n(top)} L${n(cx - L.backHemHalf)} ${n(hem)} Q${n(cx)} ${n(hem + 8)} ${n(cx + L.backHemHalf)} ${n(hem)} L${n(cx + hipX)} ${n(top)} Z`}
      fill={`url(#${ids.fabricBack})`}
    />
  );
};

export const Garment: React.FC<GarmentProps> = ({ g, L, ids, fabric, brocade, closureType, innerColor = '#F4EFE6', yemColor = '#C9485B' }) => {
  const f = fabricTones(fabric);
  const { cx } = g;
  const st = L.structure;
  const outline = bodyOutline(g, L);
  const trim = st.collar === 'NHAT_BINH' ? `url(#${ids.gold})` : shade(fabric, -0.2);

  /* Fold shadows: long vertical drapes in the tà, under-bust and armpit creases. */
  const folds = [
    `M${n(cx - 10)} ${n(g.waistY + 8)} Q${n(cx - 14)} ${n((g.waistY + L.hemY) / 2)} ${n(cx - 18)} ${n(L.hemY - 4)}`,
    `M${n(cx + 12)} ${n(g.waistY + 12)} Q${n(cx + 16)} ${n((g.waistY + L.hemY) / 2)} ${n(cx + 24)} ${n(L.hemY - 6)}`,
    `M${n(cx - g.shoulderHalf + 10)} ${n(g.chestY)} Q${n(cx - g.waistHalf)} ${n(g.chestY + 30)} ${n(cx - g.waistHalf - 2)} ${n(g.waistY)}`,
    `M${n(cx + g.shoulderHalf - 10)} ${n(g.chestY)} Q${n(cx + g.waistHalf)} ${n(g.chestY + 30)} ${n(cx + g.waistHalf + 2)} ${n(g.waistY)}`,
  ];

  const sleeves = ([-1, 1] as const).map((side) => {
    const d = sleevePath(g, L, side);
    const wrist = side < 0 ? g.wristL : g.wristR;
    return (
      <g key={side}>
        <path d={d} fill={`url(#${ids.fabric})`} />
        <path d={d} fill={`url(#${brocade ? ids.brocade : ids.silk})`} />
        <path d={d} fill="none" stroke={f.highlight} strokeWidth="0.9" opacity="0.45" />
        {/* elbow fold */}
        <path d={`M${n(wrist.x - side * 4)} ${n((g.shoulderY + L.cuffY) / 2)} q${n(side * 6)} 6 ${n(side * 10)} 2`} stroke={f.deep} strokeWidth="2.2" fill="none" opacity="0.35" filter={`url(#${ids.fold})`} />
        {/* cuff trim / ngũ sắc bands on Nhật Bình */}
        {st.collar === 'NHAT_BINH' ? (
          ['#9B2335', '#D4A338', '#2B5C8F', '#3D6B35', '#F4EFE6'].map((c, i) => (
            <path key={c} d={`M${n(wrist.x - side * L.cuffHalf * 0.7)} ${n(L.cuffY - 10 - i * 4.2)} L${n(wrist.x + side * L.cuffHalf)} ${n(L.cuffY - 6 - i * 4.2)}`} stroke={c} strokeWidth="3.4" opacity="0.9" />
          ))
        ) : (
          <path d={`M${n(wrist.x - side * L.cuffHalf * (L.wideSleeve ? 0.7 : 1))} ${n(L.cuffY + (L.wideSleeve ? -4 : 1.5))} L${n(wrist.x + side * L.cuffHalf)} ${n(L.cuffY)}`} stroke={f.deep} strokeWidth="1.6" opacity="0.7" />
        )}
      </g>
    );
  });

  /* Closure */
  let closure: React.ReactNode = null;
  if (st.closure === 'HUU_NHAM') {
    const path = L.closure;
    const d = `M${path.map((p) => `${n(p.x)} ${n(p.y)}`).join(' L')}`;
    const count = Math.max(0, st.buttonCount);
    const buttons = Array.from({ length: count }, (_, i) => along(path, count === 1 ? 0 : i / (count - 1)));
    closure = (
      <g>
        {/* overlapping edge of the outer (left) panel, closing towards the wearer's right */}
        <path d={d} stroke={f.deep} strokeWidth="2.4" fill="none" opacity="0.4" filter={`url(#${ids.fold})`} />
        <path d={d} stroke={f.highlight} strokeWidth="0.8" fill="none" opacity="0.7" />
        {closureType === 'ZIPPER' && (
          <path d={`M${n(cx - g.waistHalf - 6)} ${n(g.waistY - 6)} L${n(cx - g.hipHalf - 3)} ${n(L.slitY - 2)}`} stroke={shade(fabric, -0.3)} strokeWidth="1.4" strokeDasharray="1.6 1.4" />
        )}
        {buttons.map((b, i) => (
          <g key={i} filter={`url(#${ids.drop})`}>
            <circle cx={b.x} cy={b.y} r="2.6" fill={`url(#${ids.gold})`} />
            <circle cx={b.x - 0.7} cy={b.y - 0.8} r="0.8" fill="#FFF6D8" opacity="0.9" />
          </g>
        ))}
      </g>
    );
  } else if (st.closure === 'CENTER') {
    closure = Array.from({ length: st.buttonCount }, (_, i) => (
      <circle key={i} cx={cx} cy={g.neckBase + 10 + i * ((g.hipY - g.neckBase) / st.buttonCount)} r="2.2" fill={`url(#${ids.gold})`} />
    ));
  }

  /* Collar */
  let collar: React.ReactNode = null;
  if (st.collar === 'LAP_LINH') {
    collar = (
      <g>
        <path d={`M${n(cx - g.neckHalf - 3 - L.neckOpen)} ${n(g.neckBase - 3 - L.collarH)} Q${n(cx)} ${n(g.neckBase - L.collarH - 1)} ${n(cx + g.neckHalf + 3 + L.neckOpen)} ${n(g.neckBase - 3 - L.collarH)} L${n(cx + g.neckHalf + 3 + L.neckOpen)} ${n(g.neckBase - 2)} Q${n(cx)} ${n(g.neckBase + 6)} ${n(cx - g.neckHalf - 3 - L.neckOpen)} ${n(g.neckBase - 2)} Z`} fill={shade(fabric, -0.08)} />
        <path d={`M${n(cx - g.neckHalf - 3 - L.neckOpen)} ${n(g.neckBase - 3 - L.collarH)} Q${n(cx)} ${n(g.neckBase - L.collarH - 1)} ${n(cx + g.neckHalf + 3 + L.neckOpen)} ${n(g.neckBase - 3 - L.collarH)}`} stroke={innerColor} strokeWidth="1.3" fill="none" />
      </g>
    );
  } else if (st.collar === 'GIAO_LINH') {
    // Outer collar band crosses from the wearer's left shoulder to the wearer's right waist.
    const band = `M${n(cx + g.neckHalf + 4)} ${n(g.neckBase - 4)} L${n(cx + g.neckHalf + 11)} ${n(g.neckBase - 2)} L${n(cx - g.waistHalf + 6)} ${n(g.waistY - 18)} L${n(cx - g.waistHalf - 2)} ${n(g.waistY - 26)} Z`;
    collar = (
      <g>
        <path d={`M${n(cx - g.neckHalf - 4)} ${n(g.neckBase - 4)} L${n(cx + 4)} ${n(g.chestY - 6)} L${n(cx - 4)} ${n(g.chestY + 2)} L${n(cx - g.neckHalf - 10)} ${n(g.neckBase - 2)} Z`} fill={innerColor} />
        <path d={band} fill={innerColor} filter={`url(#${ids.drop})`} />
        <path d={band} fill="none" stroke={shade(innerColor, -0.12)} strokeWidth="0.6" />
      </g>
    );
  } else if (st.collar === 'DOI_KHAM' || st.collar === 'NHAT_BINH') {
    collar = (
      <g>
        <path d={`M${n(cx - 6)} ${n(g.neckBase)} L${n(cx + 6)} ${n(g.neckBase)} L${n(cx + 7)} ${n(L.hemY - 2)} L${n(cx - 7)} ${n(L.hemY - 2)} Z`} fill={innerColor} />
        {[-1, 1].map((side) => (
          <path key={side} d={`M${n(cx + side * (g.neckHalf + 3))} ${n(g.neckBase - 4)} Q${n(cx + side * 9)} ${n(g.neckBase + 8)} ${n(cx + side * 8)} ${n(g.chestY)} L${n(cx + side * 9)} ${n(L.hemY - 2)}`} stroke={trim} strokeWidth={st.collar === 'NHAT_BINH' ? 7 : 4} fill="none" />
        ))}
      </g>
    );
  } else if (st.collar === 'OPEN_V') {
    // Áo tứ thân: open V over the yếm, sash knotted at the waist, front panels hanging.
    collar = (
      <g>
        <path d={`M${n(cx - g.neckHalf - 4)} ${n(g.neckBase - 4)} L${n(cx)} ${n(g.waistY - 6)} L${n(cx + g.neckHalf + 4)} ${n(g.neckBase - 4)} Z`} fill={yemColor} />
        <path d={`M${n(cx - 13)} ${n(g.chestY - 12)} L${n(cx)} ${n(g.chestY - 24)} L${n(cx + 13)} ${n(g.chestY - 12)}`} stroke={shade(yemColor, 0.25)} strokeWidth="0.8" fill="none" opacity="0.7" />
        {[-1, 1].map((side) => <path key={side} d={`M${n(cx + side * (g.neckHalf + 4))} ${n(g.neckBase - 4)} L${n(cx + side * 3)} ${n(g.waistY - 4)}`} stroke={shade(fabric, -0.25)} strokeWidth="2.2" />)}
        <path d={`M${n(cx - 6)} ${n(g.waistY)} L${n(cx - 2)} ${n(L.hemY - 6)} L${n(cx + 2)} ${n(L.hemY - 6)} L${n(cx + 6)} ${n(g.waistY)} Z`} fill={shade(fabric, -0.2)} opacity="0.6" />
      </g>
    );
  }

  /* Nhật Bình: square "chữ Nhật" collar cape over the shoulders with hanging bands. */
  const nhatBinh = st.collar === 'NHAT_BINH' ? (
    <g filter={`url(#${ids.drop})`}>
      <path
        d={`M${n(cx - g.shoulderHalf - 6)} ${n(g.shoulderY + 4)} L${n(cx + g.shoulderHalf + 6)} ${n(g.shoulderY + 4)} L${n(cx + g.shoulderHalf - 2)} ${n(g.chestY + 26)} L${n(cx + 14)} ${n(g.chestY + 26)} L${n(cx + 14)} ${n(g.neckBase + 6)} L${n(cx - 14)} ${n(g.neckBase + 6)} L${n(cx - 14)} ${n(g.chestY + 26)} L${n(cx - g.shoulderHalf + 2)} ${n(g.chestY + 26)} Z`}
        fill={`url(#${ids.gold})`}
      />
      <path
        d={`M${n(cx - g.shoulderHalf - 6)} ${n(g.shoulderY + 4)} L${n(cx + g.shoulderHalf + 6)} ${n(g.shoulderY + 4)} L${n(cx + g.shoulderHalf - 2)} ${n(g.chestY + 26)} L${n(cx + 14)} ${n(g.chestY + 26)} L${n(cx + 14)} ${n(g.neckBase + 6)} L${n(cx - 14)} ${n(g.neckBase + 6)} L${n(cx - 14)} ${n(g.chestY + 26)} L${n(cx - g.shoulderHalf + 2)} ${n(g.chestY + 26)} Z`}
        fill={`url(#${ids.brocade})`}
      />
      {[-1, 1].map((side) => (
        <g key={side}>
          <rect x={cx + side * 20 - 6} y={g.chestY + 26} width="12" height={Math.max(20, L.hemY - g.chestY - 40)} fill={`url(#${ids.gold})`} />
          <rect x={cx + side * 20 - 6} y={g.chestY + 26} width="12" height={Math.max(20, L.hemY - g.chestY - 40)} fill={`url(#${ids.brocade})`} />
        </g>
      ))}
    </g>
  ) : null;

  return (
    <g>
      {sleeves}
      {/* 1. base + texture */}
      <path d={outline} fill={`url(#${ids.fabric})`} />
      <path d={outline} fill={`url(#${brocade ? ids.brocade : ids.silk})`} />
      {/* 2. fold shadows */}
      <g opacity="0.42" filter={`url(#${ids.fold})`}>
        {folds.map((d) => <path key={d} d={d} stroke={f.deep} strokeWidth="5" fill="none" strokeLinecap="round" />)}
      </g>
      {g.seated && (
        <path d={`M${n(cx - g.hipHalf - 14)} ${n(g.hipY + 8)} Q${n(cx)} ${n(g.hipY - 2)} ${n(cx + g.hipHalf + 14)} ${n(g.hipY + 8)} L${n(cx + g.hipHalf + 16)} ${n(Math.min(g.lapY, L.hemY) - 2)} Q${n(cx)} ${n(Math.min(g.lapY, L.hemY) + 6)} ${n(cx - g.hipHalf - 16)} ${n(Math.min(g.lapY, L.hemY) - 2)} Z`} fill={f.light} opacity="0.35" />
      )}
      {g.seated && L.hemY > g.lapY + 4 && (
        <path d={`M${n(cx - g.hipHalf - 14)} ${n(g.lapY)} Q${n(cx)} ${n(g.lapY + 8)} ${n(cx + g.hipHalf + 14)} ${n(g.lapY)}`} stroke={f.deep} strokeWidth="3" fill="none" opacity="0.4" filter={`url(#${ids.fold})`} />
      )}
      {/* 3. highlight strokes + sheen */}
      <path d={outline} fill="none" stroke={f.highlight} strokeWidth="1" opacity="0.5" />
      <path d={outline} fill={`url(#${ids.fabricSheen})`} />
      {[-1, 1].map((side) => (
        <path key={side} d={`M${n(cx + side * 6)} ${n(g.waistY + 18)} Q${n(cx + side * 8)} ${n((g.waistY + L.hemY) / 2)} ${n(cx + side * 12)} ${n(L.hemY - 10)}`} stroke={f.sheen} strokeWidth="1.1" fill="none" opacity="0.4" />
      ))}
      {/* hem edge */}
      <path d={`M${n(cx - L.hemHalf * 0.82)} ${n(L.hemY)} Q${n(cx)} ${n(L.hemY + 6)} ${n(cx + L.hemHalf * 0.82)} ${n(L.hemY)}`} stroke={mix(f.deep, '#000000', 0.15)} strokeWidth="1.4" fill="none" opacity="0.55" />
      {collar}
      {nhatBinh}
      {closure}
    </g>
  );
};
