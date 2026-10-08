/**
 * Modular Scene Vector Component
 * Connects backdrop, character, garments, accessories, and hotspots
 */

import React from 'react';
import type { Garment, Accessory, CharacterItem } from '../../../types/fashion';
import { GroundShadow } from './GroundShadow';
import { CharacterFigure } from './CharacterFigure';
import { Garments } from './Garments';
import { Accessories } from './Accessories';
import { SceneBackdrop } from './SceneBackdrop';
import { Hotspots } from './Hotspots';

export interface SceneProps {
  garment: Garment;
  primaryColor: string;
  pantColor: string;
  accessories?: Accessory[];
  character: CharacterItem;
  eventId?: string;
  weatherId?: string;
  backgroundTheme?: 'MINIMAL_STUDIO' | 'HERITAGE_PALACE' | 'GARDEN_SPRING';
  isWheelchair?: boolean;
  showHotspots?: boolean;
  hairStyle?: string;
  skinTone?: string | null;
  bodyShape?: string;
  pose?: string;
  fabricType?: 'SILK' | 'BROCADE' | 'COTTON';
}

export const Scene: React.FC<SceneProps> = ({
  garment,
  primaryColor,
  pantColor,
  accessories = [],
  character,
  eventId = 'EVENT_TET',
  weatherId = 'WEATHER_PLEASANT',
  backgroundTheme = 'MINIMAL_STUDIO',
  isWheelchair = false,
  showHotspots = false,
  hairStyle,
  skinTone,
  bodyShape,
  pose,
  fabricType = 'SILK',
}) => {
  const activeSkinTone = skinTone || character.skinTone || '#FCE5D8';
  const activeHair = hairStyle || (character as any).hairStyle || 'TOC_VAN';
  const activeBodyShape = bodyShape || (character.bodyRepresentation?.includes('Đầy Đặn') ? 'CURVED' : 'BALANCED');

  return (
    <svg
      viewBox="0 0 400 500"
      className="w-full h-full select-none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={`Bản phối thời trang ${garment.name} - ${character.name}`}
    >
      {/* 1. Backdrop */}
      <SceneBackdrop eventId={eventId} weatherId={weatherId} backgroundTheme={backgroundTheme} />

      {/* 2. Ground Shadow */}
      <GroundShadow isSeated={isWheelchair} />

      {/* 3. Accessories Back */}
      <Accessories accessories={accessories} layer="BACK" isWheelchair={isWheelchair} />

      {/* 4. Character Figure */}
      <CharacterFigure
        skinToneHex={activeSkinTone}
        hairId={activeHair}
        bodyShape={activeBodyShape}
        pose={pose}
        gender={character.gender}
        isWheelchair={isWheelchair}
      />

      {/* 5. Authentic Garment */}
      <Garments
        garment={garment}
        primaryColor={primaryColor}
        pantColor={pantColor}
        fabricType={fabricType}
        isWheelchair={isWheelchair}
      />

      {/* 6. Accessories Front */}
      <Accessories accessories={accessories} layer="FRONT" isWheelchair={isWheelchair} />

      {/* 7. Accessories Handheld */}
      <Accessories accessories={accessories} layer="HANDHELD" isWheelchair={isWheelchair} />

      {/* 8. Accessories Footwear */}
      <Accessories accessories={accessories} layer="FOOTWEAR" isWheelchair={isWheelchair} />

      {/* 9. Hotspots */}
      {showHotspots && <Hotspots garmentId={garment.id} isWheelchair={isWheelchair} />}
    </svg>
  );
};
