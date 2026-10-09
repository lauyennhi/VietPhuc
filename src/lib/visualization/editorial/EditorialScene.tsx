/**
 * Composes the editorial illustration in paint order:
 * backdrop → chair (rear) → back hair → back panel → legs → neck → garment → hands → head
 * → accessories → chair (front) → annotations → weather light.
 */

import React, { useId } from 'react';
import type { Accessory, Garment } from '../../../types/domain';
import { Defs, makeIds } from './Defs';
import { Backdrop, WeatherLight, sceneFor } from './Backdrop';
import { BackHair, Hand, Head, Legs, Neck, type HairStyle } from './Figure';
import { BackPanel, Garment as GarmentShape } from './Garment';
import { Accessories, hasFootwear } from './Accessories';
import { WheelchairBack, WheelchairFront } from './Wheelchair';
import { Annotations, type Annotation } from './Annotations';
import { DEFAULT_STRUCTURE, figureGeometry, garmentLayout, type CutAdjustments } from './geometry';

export interface EditorialSceneProps {
  garment: Garment;
  primaryColor: string;
  pantColor: string;
  accessories: Accessory[];
  skinTone: string;
  hairStyle?: string;
  masculine: boolean;
  seated: boolean;
  bodyShape?: string;
  eventId?: string;
  weatherId?: string;
  backgroundTheme?: string;
  cut: CutAdjustments;
  figureScale?: number;
  annotations?: Annotation[];
  showHotspots?: boolean;
}

const HAIR_COLOR = '#211915';

export const EditorialScene: React.FC<EditorialSceneProps> = ({
  garment,
  primaryColor,
  pantColor,
  accessories,
  skinTone,
  hairStyle,
  masculine,
  seated,
  bodyShape,
  eventId,
  weatherId,
  backgroundTheme,
  cut,
  figureScale = 1,
  annotations = [],
  showHotspots,
}) => {
  const rawId = useId();
  const ids = makeIds(`vs${rawId.replace(/[^a-zA-Z0-9]/g, '')}`);
  const structure = garment.structure ?? DEFAULT_STRUCTURE;
  const g = figureGeometry({ seated, masculine, shape: bodyShape });
  const L = garmentLayout(g, structure, cut);
  const scene = sceneFor(eventId, backgroundTheme);
  const style: HairStyle = (hairStyle as HairStyle) ?? (masculine ? 'NAM' : 'TOC_VAN');
  const remix = cut.remixLevel ?? 0;
  const brocade = remix < 50 && (structure.sleeve === 'THUNG' || garment.formalityLevel === 'HIGH_FORMAL');
  const yem = accessories.find((a) => a.id === 'acc-yem-co-truyen')?.colors[0] ?? '#C9485B';
  const skirt = structure.closure === 'TIED_FRONT';
  const showShoes = !hasFootwear(accessories);
  const pivotY = seated ? g.hipY + 20 : g.soleY;
  const handY = (y: number) => (L.wideSleeve ? Math.max(y, L.cuffY - 8) : Math.max(y, L.cuffY - 2));

  const hotspots = showHotspots ? [
    { x: g.cx, y: g.neckBase - 6, title: structure.collar === 'LAP_LINH' ? 'Cổ lập lĩnh (cổ đứng)' : 'Cổ áo', body: garment.characteristics[0] },
    { x: L.closure[2].x, y: L.closure[2].y, title: structure.closure === 'HUU_NHAM' ? `Vạt hữu nhậm · ${structure.buttonCount} cúc` : 'Kết cấu vạt', body: garment.nonNegotiables[0] },
    { x: g.wristR.x, y: L.cuffY - 8, title: structure.sleeve === 'THUNG' ? 'Tay thụng' : 'Tay chẽn', body: garment.characteristics[1] },
    { x: g.cx, y: L.hemY - 8, title: 'Tà áo', body: garment.characteristics[2] },
  ] : [];

  return (
    <g>
      <Defs ids={ids} fabric={primaryColor} pant={skirt && pantColor === '#F4F0E8' ? '#2A211C' : pantColor} skin={skinTone} hair={HAIR_COLOR} brocadeColor={structure.collar === 'NHAT_BINH' ? '#7A5A12' : '#E8D5A3'} />
      <Backdrop scene={scene} ids={ids} />
      <ellipse cx="200" cy={seated ? 452 : g.soleY + 2} rx={seated ? 120 : 70} ry={seated ? 14 : 9} fill={`url(#${ids.ground})`} />

      <g transform={figureScale !== 1 ? `translate(200 ${pivotY}) scale(${figureScale}) translate(-200 -${pivotY})` : undefined}>
        {seated && <WheelchairBack g={g} ids={ids} />}
        <BackHair g={g} ids={ids} style={style} hair={HAIR_COLOR} />
        <Accessories g={g} ids={ids} accessories={accessories} layer="BACK" />
        <BackPanel g={g} L={L} ids={ids} />
        <Legs g={g} ids={ids} pant={skirt && pantColor === '#F4F0E8' ? '#2A211C' : pantColor} skirt={skirt} skin={skinTone} showShoes={showShoes} />
        <Neck g={g} ids={ids} skin={skinTone} />
        <GarmentShape g={g} L={L} ids={ids} fabric={primaryColor} brocade={brocade} closureType={cut.closureType} yemColor={yem} />
        <Hand x={g.wristL.x} y={seated ? g.wristL.y : handY(g.wristL.y)} angle={seated ? -72 : 6} ids={ids} skin={skinTone} />
        <Hand x={g.wristR.x} y={seated ? g.wristR.y : handY(g.wristR.y)} angle={seated ? 72 : -6} ids={ids} skin={skinTone} mirror />
        <Head g={g} ids={ids} skin={skinTone} hair={HAIR_COLOR} style={style} />
        <Accessories g={g} ids={ids} accessories={accessories} layer="FRONT" />
        {seated && <WheelchairFront g={g} ids={ids} />}
        {annotations.length > 0 && <Annotations g={g} L={L} items={annotations} />}
      </g>

      <WeatherLight weatherId={weatherId} ids={ids} />

      {hotspots.map((h, i) => (
        <g key={i} style={{ cursor: 'help' }}>
          <title>{`${h.title}${h.body ? ` — ${h.body}` : ''}`}</title>
          <circle cx={h.x} cy={h.y} r="7" fill="#FFFFFF" opacity="0.9" />
          <circle cx={h.x} cy={h.y} r="5.5" fill="#1E3443" />
          <text x={h.x} y={h.y + 2.4} textAnchor="middle" fontSize="7" fontWeight="700" fill="#FFFFFF" fontFamily="Be Vietnam Pro, Arial, sans-serif">{i + 1}</text>
        </g>
      ))}
    </g>
  );
};
