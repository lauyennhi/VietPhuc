/**
 * Visual Asset Registry and Mockup Scene Builder
 */

import visualAssetsData from '../../../data/visual_assets.json';
import type { Garment, Accessory, Character } from '../../types/domain';

export interface VisualAssetReference {
  assetId: string;
  source?: string;
}

export interface MockupSceneParams {
  garment: Garment;
  character: Character;
  accessories?: Accessory[];
  primaryColor: string;
  adaptiveNeedCodes?: string[];
  backgroundId?: string;
  styleId?: string;
}

export interface MockupScene {
  layers: string[];
  style: { dataId: string };
  background: VisualAssetReference & { dataId: string; fallbackKey: string };
  adaptive: { dataId: string; needCodes: string[]; isSeated: boolean };
  character: VisualAssetReference & {
    dataId: string;
    fallbackKey: string;
    poseId: string;
    variant: string;
  };
  hair: { dataId: string; characterId: string; fallbackKey: string };
  garment: VisualAssetReference & {
    dataId: string;
    templateId: string;
    fallbackKey: string;
    hasVectorTemplate: boolean;
  };
  garmentColor: { dataId: string; value: string };
  accessories: Array<
    VisualAssetReference & {
      dataId: string;
      fallbackKey: string;
      type: string;
      variant?: string;
      color?: string;
    }
  >;
  shoes: Array<
    VisualAssetReference & {
      dataId: string;
      fallbackKey: string;
      type: string;
      variant?: string;
      color?: string;
    }
  >;
}

export function createMockupScene(params: MockupSceneParams): MockupScene {
  const {
    garment,
    character,
    accessories = [],
    primaryColor,
    adaptiveNeedCodes = [],
    backgroundId = 'MINIMAL_STUDIO',
    styleId = 'TRUYEN_THONG_HOANG_GIA',
  } = params;

  const bgConfig =
    (visualAssetsData.backgrounds as Record<string, { fallbackKey: string; accent: string }>)[
      backgroundId
    ] || { fallbackKey: 'BACKGROUND_MINIMAL', accent: '#D6A75B' };

  const charVariantMap = visualAssetsData.characterVariants as Record<string, string>;
  const charVariant =
    charVariantMap[character.imageAsset || ''] ||
    (character.gender === 'MALE'
      ? 'CHARACTER_MASCULINE'
      : character.bodyRepresentation?.includes('Đầy Đặn')
      ? 'CHARACTER_CURVY'
      : 'CHARACTER_FEMININE');

  const isSeated =
    character.posture === 'WHEELCHAIR_SEATED' ||
    adaptiveNeedCodes.includes('WHEELCHAIR_SEATED') ||
    charVariant === 'CHARACTER_SEATED';

  // Template mapping
  let templateId = 'NGU_THAN_TAY_CHEN';
  if (garment.category === 'AO_TAC') templateId = 'AO_TAC';
  else if (garment.category === 'AO_NHAT_BINH') templateId = 'AO_NHAT_BINH';
  else if (garment.category === 'AO_GIAO_LINH') templateId = 'AO_GIAO_LINH';
  else if (garment.category === 'AO_DOI_KHAM') templateId = 'AO_DOI_KHAM';
  else if (garment.category === 'AO_DAI_REMIX') templateId = 'NGU_THAN_REMIX';
  else if (garment.category === 'AO_TU_THAN') templateId = 'AO_TU_THAN';
  else if (garment.category === 'AO_DAI') templateId = 'AO_DAI';

  const accVariantMap = visualAssetsData.accessoryVariants as Record<string, string>;

  const shoesList = accessories.filter(
    (a) => a.type === 'FOOTWEAR' || a.id.includes('hai-sen') || a.id.includes('guoc-moc') || a.id.includes('sneaker')
  );
  const otherAccList = accessories.filter((a) => !shoesList.includes(a));

  return {
    layers: ['background', 'adaptive', 'character', 'hair', 'garment', 'accessories', 'shoes'],
    style: { dataId: styleId },
    background: {
      assetId: backgroundId,
      dataId: backgroundId,
      fallbackKey: bgConfig.fallbackKey,
    },
    adaptive: {
      dataId: adaptiveNeedCodes.join('-') || 'standard',
      needCodes: adaptiveNeedCodes,
      isSeated,
    },
    character: {
      assetId: character.id,
      dataId: character.id,
      fallbackKey: charVariant,
      poseId: character.pose || 'STANDING',
      variant: charVariant,
    },
    hair: {
      dataId: `hair-${character.id}`,
      characterId: character.id,
      fallbackKey: 'HAIR_DEFAULT',
    },
    garment: {
      assetId: garment.id,
      dataId: garment.id,
      templateId,
      fallbackKey: templateId,
      hasVectorTemplate: true,
    },
    garmentColor: {
      dataId: `color-${primaryColor}`,
      value: primaryColor,
    },
    accessories: otherAccList.map((acc) => {
      const variant = accVariantMap[acc.imageAsset || acc.id.replace('-', '_')] || 'ACCESSORY';
      return {
        assetId: acc.id,
        dataId: acc.id,
        fallbackKey: variant,
        type: acc.type || 'ACCESSORY',
        variant,
        color: acc.colors?.[0] || '#D6A75B',
      };
    }),
    shoes: shoesList.map((shoe) => {
      const variant = accVariantMap[shoe.imageAsset || shoe.id.replace('-', '_')] || 'SHOES_CEREMONIAL';
      return {
        assetId: shoe.id,
        dataId: shoe.id,
        fallbackKey: variant,
        type: 'FOOTWEAR',
        variant,
        color: shoe.colors?.[0] || '#8B1E2B',
      };
    }),
  };
}
