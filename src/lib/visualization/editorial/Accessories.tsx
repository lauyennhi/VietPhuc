/**
 * Accessories positioned on named anchor slots of the figure, each with its own
 * soft drop shadow so it sits on the body instead of floating.
 */

import React from 'react';
import type { Accessory } from '../../../types/domain';
import type { FigureGeometry } from './geometry';
import type { Ids } from './Defs';
import { lightness, shade } from './palette';

const n = (v: number) => v.toFixed(1);

export type AnchorSlot = 'HEAD' | 'HAIR' | 'EYES' | 'NECK' | 'CHEST' | 'WAIST' | 'HAND_L' | 'HAND_R' | 'FEET';

export function anchors(g: FigureGeometry): Record<AnchorSlot, { x: number; y: number }> {
  const { cx, cy, ry } = g.head;
  return {
    HEAD: { x: cx, y: cy - ry + 2 },
    HAIR: { x: cx + 12, y: cy - ry - 4 },
    EYES: { x: cx, y: cy + 1 },
    NECK: { x: g.cx, y: g.neckBase + 2 },
    CHEST: { x: g.cx - 12, y: g.chestY + 10 },
    WAIST: { x: g.cx, y: g.waistY },
    HAND_L: { x: g.wristL.x, y: g.wristL.y + 18 },
    HAND_R: { x: g.wristR.x, y: g.wristR.y + 18 },
    FEET: { x: g.cx, y: g.soleY },
  };
}

const SLOT_BY_ID: Record<string, AnchorSlot> = {
  'acc-khan-dong': 'HEAD',
  'acc-man-nu': 'HEAD',
  'acc-khan-mo-qua': 'HEAD',
  'acc-non-quai-thao': 'HEAD',
  'acc-khan-ran-nam-bo': 'HEAD',
  'acc-tram-cai-toc': 'HAIR',
  'acc-kinh-ram': 'EYES',
  'acc-kieng-bac': 'NECK',
  'acc-chuoi-ngoc': 'NECK',
  'acc-the-bai': 'CHEST',
  'acc-that-lung-lua': 'WAIST',
  'acc-that-lung-da': 'WAIST',
  'acc-quat-tram-huong': 'HAND_R',
  'acc-quat-xep-giay-do': 'HAND_R',
  'acc-tui-coi': 'HAND_L',
  'acc-tui-da': 'HAND_L',
  'acc-hai-sen': 'FEET',
  'acc-guoc-moc': 'FEET',
  'acc-sneaker-retro': 'FEET',
};

export function hasFootwear(accessories: Accessory[]): boolean {
  return accessories.some((a) => SLOT_BY_ID[a.id] === 'FEET');
}

interface Props {
  g: FigureGeometry;
  ids: Ids;
  accessories: Accessory[];
  layer: 'BACK' | 'FRONT';
}

export const Accessories: React.FC<Props> = ({ g, ids, accessories, layer }) => {
  const A = anchors(g);
  const { cx, cy, rx, ry } = g.head;
  const items: React.ReactNode[] = [];

  for (const acc of accessories) {
    const color = acc.colors[0] ?? '#1C1C1E';
    const dark = shade(color, -0.18);
    const light = shade(color, 0.18);
    switch (acc.id) {
      case 'acc-khan-dong': {
        // Khăn đóng / khăn vấn: layered wrap with the crossed "chữ nhân" folds.
        // Pick a palette colour that reads against the (near-black) hair.
        if (layer !== 'FRONT') break;
        const wrap = acc.colors.find((c) => lightness(c) > 0.22) ?? color;
        const wrapLight = shade(wrap, 0.22);
        const wrapDark = shade(wrap, -0.22);
        const y = cy - ry + 4;
        items.push(
          <g key={acc.id} filter={`url(#${ids.drop})`}>
            <path d={`M${n(cx - rx - 5)} ${n(y + 6)} Q${n(cx - rx - 6)} ${n(y - 16)} ${n(cx)} ${n(y - 18)} Q${n(cx + rx + 6)} ${n(y - 16)} ${n(cx + rx + 5)} ${n(y + 6)} Q${n(cx)} ${n(y - 1)} ${n(cx - rx - 5)} ${n(y + 6)} Z`} fill={wrap} />
            {[0, 1, 2, 3].map((i) => <path key={i} d={`M${n(cx - rx - 4)} ${n(y + 2 - i * 4.5)} Q${n(cx)} ${n(y - 6 - i * 4.5)} ${n(cx + rx + 4)} ${n(y + 2 - i * 4.5)}`} stroke={i % 2 ? wrapDark : wrapLight} strokeWidth="1.1" fill="none" opacity="0.8" />)}
            <path d={`M${n(cx - 7)} ${n(y - 1)} L${n(cx)} ${n(y - 10)} L${n(cx + 7)} ${n(y - 1)}`} stroke={wrapDark} strokeWidth="1.6" fill="none" />
            <path d={`M${n(cx - rx - 5)} ${n(y + 6)} Q${n(cx)} ${n(y - 1)} ${n(cx + rx + 5)} ${n(y + 6)}`} stroke={wrapDark} strokeWidth="1.4" fill="none" opacity="0.7" />
          </g>,
        );
        break;
      }
      case 'acc-man-nu': {
        if (layer !== 'FRONT') break;
        const y = cy - ry + 2;
        items.push(
          <g key={acc.id} filter={`url(#${ids.drop})`}>
            <ellipse cx={cx} cy={y - 4} rx={rx + 16} ry="9" fill={dark} />
            <ellipse cx={cx} cy={y - 7} rx={rx + 13} ry="8" fill={color} />
            <ellipse cx={cx} cy={y - 9} rx={rx + 6} ry="4" fill={light} opacity="0.5" />
            <path d={`M${n(cx - rx - 12)} ${n(y - 6)} Q${n(cx)} ${n(y - 18)} ${n(cx + rx + 12)} ${n(y - 6)}`} stroke={`url(#${ids.gold})`} strokeWidth="1.2" fill="none" />
          </g>,
        );
        break;
      }
      case 'acc-khan-mo-qua': {
        if (layer !== 'FRONT') break;
        items.push(
          <g key={acc.id} filter={`url(#${ids.drop})`}>
            <path d={`M${n(cx - rx - 4)} ${n(cy + 6)} Q${n(cx - rx - 6)} ${n(cy - ry - 6)} ${n(cx)} ${n(cy - ry - 8)} Q${n(cx + rx + 6)} ${n(cy - ry - 6)} ${n(cx + rx + 4)} ${n(cy + 6)} Q${n(cx + rx - 2)} ${n(cy - 12)} ${n(cx)} ${n(cy - ry + 2)} Q${n(cx - rx + 2)} ${n(cy - 12)} ${n(cx - rx - 4)} ${n(cy + 6)} Z`} fill={color} />
            <path d={`M${n(cx - 7)} ${n(cy - ry + 1)} L${n(cx)} ${n(cy - ry - 14)} L${n(cx + 7)} ${n(cy - ry + 1)} Z`} fill={dark} />
          </g>,
        );
        break;
      }
      case 'acc-non-quai-thao': {
        // Nón quai thao: wide flat palm-leaf hat with silk tassel straps; casts a shadow on the face.
        const y = cy - ry - 6;
        if (layer === 'BACK') {
          items.push(<ellipse key={`${acc.id}-shade`} cx={cx} cy={cy - 4} rx={rx + 2} ry="9" fill="#000000" opacity="0.08" />);
          break;
        }
        items.push(
          <g key={acc.id} filter={`url(#${ids.drop})`}>
            <ellipse cx={cx} cy={y} rx="66" ry="14" fill={shade(color, -0.1)} />
            <ellipse cx={cx} cy={y - 3} rx="64" ry="12.5" fill={color} />
            {[18, 34, 50].map((r) => <ellipse key={r} cx={cx} cy={y - 3} rx={r} ry={r * 0.19} fill="none" stroke={shade(color, -0.14)} strokeWidth="0.6" opacity="0.6" />)}
            <ellipse cx={cx} cy={y + 1} rx="22" ry="4" fill={shade(color, -0.25)} opacity="0.55" />
            {[-1, 1].map((side) => (
              <g key={side}>
                <path d={`M${n(cx + side * 16)} ${n(y + 2)} Q${n(cx + side * 22)} ${n(cy + 16)} ${n(cx + side * 4)} ${n(cy + ry + 6)}`} stroke="#7A2E1F" strokeWidth="1.2" fill="none" />
                {[0, 2, 4].map((k) => <path key={k} d={`M${n(cx + side * (3 + k))} ${n(cy + ry + 6)} l${n(side * 0.5)} 9`} stroke="#B8860B" strokeWidth="0.7" />)}
              </g>
            ))}
          </g>,
        );
        break;
      }
      case 'acc-khan-ran-nam-bo': {
        if (layer !== 'FRONT') break;
        items.push(
          <g key={acc.id} filter={`url(#${ids.drop})`}>
            <path d={`M${n(g.cx - 18)} ${n(g.neckBase - 2)} Q${n(g.cx)} ${n(g.neckBase + 10)} ${n(g.cx + 18)} ${n(g.neckBase - 2)} L${n(g.cx + 8)} ${n(g.chestY + 10)} L${n(g.cx - 4)} ${n(g.chestY + 8)} Z`} fill={color} />
            <path d={`M${n(g.cx - 14)} ${n(g.neckBase + 2)} L${n(g.cx + 14)} ${n(g.neckBase + 2)}`} stroke="#F8FAFC" strokeWidth="1.2" strokeDasharray="2 2" />
          </g>,
        );
        break;
      }
      case 'acc-tram-cai-toc': {
        if (layer !== 'FRONT') break;
        items.push(
          <g key={acc.id} filter={`url(#${ids.drop})`}>
            <path d={`M${n(A.HAIR.x - 14)} ${n(A.HAIR.y + 6)} L${n(A.HAIR.x + 16)} ${n(A.HAIR.y - 8)}`} stroke={`url(#${ids.gold})`} strokeWidth="1.6" strokeLinecap="round" />
            <circle cx={A.HAIR.x + 16} cy={A.HAIR.y - 8} r="3.4" fill={`url(#${ids.gold})`} />
            <circle cx={A.HAIR.x + 16} cy={A.HAIR.y - 8} r="1.3" fill="#C9485B" />
          </g>,
        );
        break;
      }
      case 'acc-kinh-ram': {
        if (layer !== 'FRONT') break;
        items.push(
          <g key={acc.id} filter={`url(#${ids.drop})`}>
            {[-1, 1].map((side) => <path key={side} d={`M${n(A.EYES.x + side * 2.5)} ${n(A.EYES.y - 2)} Q${n(A.EYES.x + side * 15)} ${n(A.EYES.y - 6)} ${n(A.EYES.x + side * 14)} ${n(A.EYES.y + 2)} Q${n(A.EYES.x + side * 8)} ${n(A.EYES.y + 6)} ${n(A.EYES.x + side * 3)} ${n(A.EYES.y + 2)} Z`} fill="#15110F" opacity="0.92" />)}
            <path d={`M${n(A.EYES.x - 2.5)} ${n(A.EYES.y - 2)} Q${n(A.EYES.x)} ${n(A.EYES.y - 4)} ${n(A.EYES.x + 2.5)} ${n(A.EYES.y - 2)}`} stroke="#15110F" strokeWidth="1" fill="none" />
            <path d={`M${n(A.EYES.x + 6)} ${n(A.EYES.y - 3)} l3 1`} stroke="#FFFFFF" strokeWidth="0.8" opacity="0.6" />
          </g>,
        );
        break;
      }
      case 'acc-kieng-bac': {
        if (layer !== 'FRONT') break;
        items.push(
          <g key={acc.id} filter={`url(#${ids.drop})`}>
            <path d={`M${n(A.NECK.x - 17)} ${n(A.NECK.y)} Q${n(A.NECK.x)} ${n(A.NECK.y + 16)} ${n(A.NECK.x + 17)} ${n(A.NECK.y)}`} stroke={`url(#${ids.silver})`} strokeWidth="3.6" fill="none" strokeLinecap="round" />
            <circle cx={A.NECK.x} cy={A.NECK.y + 9} r="2.4" fill={`url(#${ids.silver})`} />
          </g>,
        );
        break;
      }
      case 'acc-chuoi-ngoc': {
        if (layer !== 'FRONT') break;
        const beads = Array.from({ length: 17 }, (_, i) => {
          const t = i / 16;
          const x = A.NECK.x - 20 + 40 * t;
          const y = A.NECK.y + 2 + Math.sin(Math.PI * t) * 20;
          return <circle key={i} cx={x} cy={y} r="1.9" fill="#FBF8F2" stroke="#D8CFC2" strokeWidth="0.4" />;
        });
        items.push(<g key={acc.id} filter={`url(#${ids.drop})`}>{beads}</g>);
        break;
      }
      case 'acc-the-bai': {
        if (layer !== 'FRONT') break;
        items.push(
          <g key={acc.id} filter={`url(#${ids.drop})`}>
            <path d={`M${n(A.NECK.x - 9)} ${n(A.NECK.y + 4)} L${n(A.CHEST.x)} ${n(A.CHEST.y - 4)}`} stroke="#5A3A22" strokeWidth="0.8" />
            <rect x={A.CHEST.x - 5} y={A.CHEST.y - 4} width="10" height="15" rx="1.5" fill={color} />
            <rect x={A.CHEST.x - 3.5} y={A.CHEST.y - 2.5} width="7" height="12" rx="1" fill="none" stroke={`url(#${ids.gold})`} strokeWidth="0.7" />
            <path d={`M${n(A.CHEST.x)} ${n(A.CHEST.y + 11)} l0 6`} stroke="#B8860B" strokeWidth="0.8" />
          </g>,
        );
        break;
      }
      case 'acc-that-lung-lua': {
        if (layer !== 'FRONT') break;
        const w = g.waistHalf + 7;
        items.push(
          <g key={acc.id} filter={`url(#${ids.drop})`}>
            <path d={`M${n(A.WAIST.x - w)} ${n(A.WAIST.y - 4)} Q${n(A.WAIST.x)} ${n(A.WAIST.y + 2)} ${n(A.WAIST.x + w)} ${n(A.WAIST.y - 4)} L${n(A.WAIST.x + w)} ${n(A.WAIST.y + 5)} Q${n(A.WAIST.x)} ${n(A.WAIST.y + 11)} ${n(A.WAIST.x - w)} ${n(A.WAIST.y + 5)} Z`} fill={color} />
            <path d={`M${n(A.WAIST.x + 4)} ${n(A.WAIST.y + 4)} q-6 22 -2 46 M${n(A.WAIST.x + 8)} ${n(A.WAIST.y + 4)} q4 20 6 40`} stroke={color} strokeWidth="5" fill="none" strokeLinecap="round" />
            <ellipse cx={A.WAIST.x + 6} cy={A.WAIST.y + 3} rx="5" ry="4" fill={dark} />
          </g>,
        );
        break;
      }
      case 'acc-that-lung-da': {
        if (layer !== 'FRONT') break;
        const w = g.waistHalf + 6;
        items.push(
          <g key={acc.id} filter={`url(#${ids.drop})`}>
            <path d={`M${n(A.WAIST.x - w)} ${n(A.WAIST.y - 1)} Q${n(A.WAIST.x)} ${n(A.WAIST.y + 4)} ${n(A.WAIST.x + w)} ${n(A.WAIST.y - 1)}`} stroke="#1C1C1E" strokeWidth="4" fill="none" />
            <rect x={A.WAIST.x - 4} y={A.WAIST.y - 1} width="8" height="6" rx="1" fill="none" stroke={`url(#${ids.gold})`} strokeWidth="1.4" />
          </g>,
        );
        break;
      }
      case 'acc-quat-tram-huong':
      case 'acc-quat-xep-giay-do': {
        if (layer !== 'FRONT') break;
        const h = A.HAND_R;
        const ribs = Array.from({ length: 9 }, (_, i) => -70 + i * 17.5);
        items.push(
          <g key={acc.id} transform={`translate(${n(h.x)} ${n(h.y - 6)}) rotate(-28)`} filter={`url(#${ids.drop})`}>
            <path d="M0 0 L-28 -22 A36 36 0 0 1 22 -28 Z" fill={color} />
            {ribs.map((a) => <path key={a} d={`M0 0 L${n(Math.sin((a * Math.PI) / 180) * 34)} ${n(-Math.cos((a * Math.PI) / 180) * 34)}`} stroke={dark} strokeWidth="0.5" opacity="0.7" />)}
            <path d="M-28 -22 A36 36 0 0 1 22 -28" stroke={dark} strokeWidth="1" fill="none" />
            {acc.id === 'acc-quat-xep-giay-do' && <path d="M-14 -24 q8 -6 16 -2 q6 -6 12 0" stroke="#3E2723" strokeWidth="0.6" fill="none" opacity="0.7" />}
          </g>,
        );
        break;
      }
      case 'acc-tui-coi': {
        if (layer !== 'FRONT') break;
        const h = A.HAND_L;
        items.push(
          <g key={acc.id} filter={`url(#${ids.drop})`}>
            <path d={`M${n(h.x - 10)} ${n(h.y)} Q${n(h.x)} ${n(h.y - 20)} ${n(h.x + 10)} ${n(h.y)}`} stroke={dark} strokeWidth="1.6" fill="none" />
            <path d={`M${n(h.x - 15)} ${n(h.y)} L${n(h.x + 15)} ${n(h.y)} L${n(h.x + 12)} ${n(h.y + 22)} Q${n(h.x)} ${n(h.y + 26)} ${n(h.x - 12)} ${n(h.y + 22)} Z`} fill={color} />
            {[0, 1, 2, 3].map((i) => <path key={i} d={`M${n(h.x - 14)} ${n(h.y + 4 + i * 5)} L${n(h.x + 14)} ${n(h.y + 4 + i * 5)}`} stroke={dark} strokeWidth="0.6" opacity="0.6" />)}
            {[-8, 0, 8].map((dx) => <path key={dx} d={`M${n(h.x + dx)} ${n(h.y)} L${n(h.x + dx * 0.85)} ${n(h.y + 23)}`} stroke={light} strokeWidth="0.5" opacity="0.6" />)}
          </g>,
        );
        break;
      }
      case 'acc-tui-da': {
        if (layer !== 'FRONT') break;
        const h = { x: g.cx - g.hipHalf - 2, y: g.hipY - 6 };
        items.push(
          <g key={acc.id} filter={`url(#${ids.drop})`}>
            <path d={`M${n(g.cx + g.shoulderHalf - 10)} ${n(g.shoulderY + 4)} L${n(h.x + 6)} ${n(h.y)}`} stroke="#5A3820" strokeWidth="2" />
            <rect x={h.x - 12} y={h.y} width="24" height="18" rx="3" fill={color} />
            <path d={`M${n(h.x - 12)} ${n(h.y + 6)} L${n(h.x + 12)} ${n(h.y + 6)}`} stroke={dark} strokeWidth="0.8" />
            <circle cx={h.x} cy={h.y + 8} r="1.4" fill={`url(#${ids.gold})`} />
          </g>,
        );
        break;
      }
      case 'acc-hai-sen':
      case 'acc-guoc-moc':
      case 'acc-sneaker-retro': {
        if (layer !== 'FRONT') break;
        const shoes = [-1, 1].map((side) => {
          const x = g.cx + side * (g.seated ? 15 : 15);
          const y = A.FEET.y;
          if (acc.id === 'acc-sneaker-retro') {
            return (
              <g key={side}>
                <path d={`M${n(x - 11)} ${n(y - 9)} Q${n(x - 2)} ${n(y - 13)} ${n(x + 12)} ${n(y - 5)} L${n(x + 13)} ${n(y - 1)} L${n(x - 12)} ${n(y - 1)} Z`} fill="#FBFAF7" stroke="#D8D2C6" strokeWidth="0.6" />
                <rect x={x - 12.5} y={y - 2} width="26" height="3.4" rx="1.4" fill="#E2DCCF" />
                <path d={`M${n(x - 4)} ${n(y - 10)} l6 3 M${n(x - 2)} ${n(y - 11)} l6 3`} stroke="#9AA3AE" strokeWidth="0.6" />
              </g>
            );
          }
          if (acc.id === 'acc-guoc-moc') {
            return (
              <g key={side}>
                <rect x={x - 11} y={y - 4} width="22" height="5" rx="1.6" fill="#A87954" />
                <path d={`M${n(x - 8)} ${n(y - 4)} Q${n(x)} ${n(y - 11)} ${n(x + 8)} ${n(y - 4)}`} stroke="#7A2E1F" strokeWidth="2.4" fill="none" />
              </g>
            );
          }
          return (
            <g key={side}>
              <path d={`M${n(x - 10)} ${n(y - 7)} Q${n(x)} ${n(y - 12)} ${n(x + 10)} ${n(y - 7)} Q${n(x + 14)} ${n(y - 11)} ${n(x + 15)} ${n(y - 6)} L${n(x + 10)} ${n(y)} L${n(x - 10)} ${n(y)} Z`} fill={color} />
              <path d={`M${n(x - 4)} ${n(y - 7)} q4 -3 8 0`} stroke={`url(#${ids.gold})`} strokeWidth="0.8" fill="none" />
            </g>
          );
        });
        items.push(<g key={acc.id} filter={`url(#${ids.drop})`}>{shoes}</g>);
        break;
      }
      default:
        break;
    }
  }
  return <g>{items}</g>;
};
