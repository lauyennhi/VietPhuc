/**
 * Vstyle Domain Models
 * Strictly typed domain contracts for Vietnamese Traditional Fashion Knowledge Base
 */

// 1. Categorical Enums & Unions
export type DataStatus = 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';

export type Region = 'BAC_BO' | 'TRUNG_BO' | 'NAM_BO' | 'TOAN_QUOC';

export type HistoricalPeriod = 'LY' | 'TRAN' | 'LE' | 'NGUYEN' | 'DUONG_DAI';

export type GarmentCategory =
  | 'AO_DAI'
  | 'AO_TU_THAN'
  | 'AO_NGU_THAN'
  | 'AO_TAC'
  | 'AO_NHAT_BINH'
  | 'AO_GIAO_LINH'
  | 'AO_DOI_KHAM'
  | 'AO_DAI_REMIX';

export type FormalityLevel = 'CASUAL_SMART' | 'SEMI_FORMAL' | 'FORMAL' | 'HIGH_FORMAL';

export type WeatherSensitivity = 'LOW' | 'MEDIUM' | 'HIGH';

export type CultureStatus = 'KEEP' | 'CONSIDER' | 'WARNING';

export type StyleTag =
  | 'TRUYEN_THONG'
  | 'LE_NGHI'
  | 'CUNG_DINH'
  | 'DAN_GIAN'
  | 'TOI_GIAN'
  | 'REMIX_GEN_Z'
  | 'SANG_TRONG'
  | 'THANH_LICH'
  | 'NANG_DONG'
  | 'HOA_NHAP'
  | 'CO_DIEN';

export type AccessoryType =
  | 'HEADWEAR'
  | 'HAIR_ACCESSORY'
  | 'JEWELRY'
  | 'PENDANT'
  | 'HANDHELD'
  | 'FOOTWEAR'
  | 'BAG'
  | 'BELT_SASH';

export type AdaptiveNeedCategory = 'MOBILITY' | 'DEXTERITY' | 'SENSORY' | 'POSTURE';

export type FunctionalNeedCode =
  | 'WHEELCHAIR_SEATED'
  | 'LIMITED_HAND_MOBILITY'
  | 'MATERIAL_SENSITIVITY'
  | 'LIMITED_STANDING'
  | 'LIMITED_MOBILITY';

// 2. User & Authentication Domain Model
export interface User {
  id: string;
  name: string;
  email?: string;
  role: 'GUEST' | 'COMMUNITY_USER' | 'CULTURAL_RESEARCHER' | 'ADMIN';
  savedLookIds: string[];
  createdAt: string;
}

// 3. Culture Source (Thư tịch & Nguồn kiểm chứng)
export interface CultureSource {
  id: string;
  title: string;
  publisher: string;
  author?: string;
  year?: number;
  url: string | null;
  verified: boolean;
  reviewedBy: string | null;
  reviewedAt: string | null;
  notes: string;
  note?: string;
}

// 4. Color Specification
export interface GarmentColor {
  name: string;
  hex: string;
}

// 5. Garment Domain Model
export interface Garment {
  id: string;
  name: string;
  vietnameseTitle: string;
  category: GarmentCategory;
  region: Region;
  period: HistoricalPeriod;
  era: string;
  occasions: string[];
  description: string;
  characteristics: string[];
  styleTags: StyleTag[];
  nonNegotiables: string[];
  baseColors: GarmentColor[];
  compatibleAccessoryIds: string[];
  sourceIds: string[];
  imageAsset: string;
  status: DataStatus;
  verified: boolean;
  svgTemplate: string;
  // Backward compatibility aliases
  occasion?: string[];
  compatibleAccessories?: string[];
  culturalMeaning?: string;
  formalityLevel?: FormalityLevel;
  genderCompatibility?: ('MALE' | 'FEMALE' | 'UNISEX')[];
}

// 6. Accessory Domain Model
export interface Accessory {
  id: string;
  name: string;
  type: AccessoryType;
  compatibleGarmentIds: string[];
  compatibleEventIds: string[];
  styleTags: StyleTag[];
  colors: string[];
  imageAsset: string;
  sourceIds: string[];
  status: DataStatus;
  description: string;
  verified: boolean;
  // Backward compatibility aliases
  category?: AccessoryType;
  culturalRole?: string;
  periodCompatibility?: string[];
  sourceId?: string;
}

// 7. Event Domain Model
export interface Event {
  id: string;
  name: string;
  description: string;
  formality: FormalityLevel;
  weatherSensitivity: WeatherSensitivity;
  recommendedStyleTags: StyleTag[];
  recommendedGarments?: string[];
  culturalAdvice?: string;
  formalityLevel?: FormalityLevel;
}

// 8. Culture Rule Domain Model
export type RuleSeverity = 'KEEP' | 'CONSIDER' | 'WARNING';

export type RuleConditionType =
  | 'PRESERVED_STRUCTURE'
  | 'REQUIRE_ACCESSORY_ON_EVENT'
  | 'REQUIRE_ACCESSORY_ALWAYS'
  | 'FORBID_COLOR_ON_EVENT'
  | 'INCOMPATIBLE_ACCESSORY_ON_EVENT'
  | 'ADAPTIVE_PRESERVATION'
  | 'CUSTOM';

export type PreservedTrait =
  | 'HUU_NHAM'
  | 'NGU_THAN_CONSTRUCTION'
  | 'NHAT_BINH_RECTANGULAR_COLLAR';

export interface RuleCondition {
  type: RuleConditionType;
  targetGarments?: string[];
  targetEvents?: string[];
  requiredAccessoryTypes?: AccessoryType[];
  requiredAccessoryIds?: string[];
  forbiddenColors?: string[];
  incompatibleAccessories?: string[];
  requiresPreservedTrait?: PreservedTrait;
}

export interface CultureRule {
  id: string;
  name: string;
  description: string;
  condition: RuleCondition;
  severity: RuleSeverity;
  reason: string;
  sourceIds: string[];
  status: DataStatus;
  // Backward compatibility aliases
  weight?: number;
  applicableGarments?: string[];
  checkType?: string;
  sourceId?: string;
  verified?: boolean;
}

export interface GeminiCultureContext {
  cultureResult: CultureCheckResult;
  ruleIds: string[];
  reasons: string[];
  retainedCharacteristics: string[];
  sourceIds: string[];
}

// 9. Adaptive Need Domain Model
export interface AdaptiveNeed {
  code: FunctionalNeedCode;
  name: string;
  category: AdaptiveNeedCategory;
  description: string;
  rationale: string;
}

// 10. Tailoring Specifications & Adaptive Adjustment
export interface TailoringSheet {
  frontHemReduction?: string;
  slitRaise?: string;
  closureType?: string;
  seatReinforcement?: string;
  decorativeButtons?: string;
  collarOpening?: string;
  innerFabric?: string;
  seamTechnique?: string;
  tagging?: string;
  thread?: string;
  waistband?: string;
  hemClearance?: string;
  trouserLeg?: string;
  armhole?: string;
  sideOpening?: string;
  shoulderEase?: string;
}

export interface AdaptiveAdjustment {
  id: string;
  needCode: FunctionalNeedCode;
  needName: string;
  garmentId: string; // 'ALL' or specific garmentId
  adjustment: string;
  reason: string;
  tailoringSpecs: TailoringSheet;
  validated: boolean;
  sourceId: string;
}

// 11. Representative Character
export interface Character {
  id: string;
  name: string;
  gender: 'MALE' | 'FEMALE' | 'NON_BINARY' | 'UNISEX';
  bodyRepresentation: string;
  skinTone: string;
  pose: string;
  heightCategory: 'REGULAR' | 'SEATED' | 'TALL';
  imageAsset: string;
  description: string;
  // Backward compatibility aliases
  posture?: string;
  defaultSkinTone?: string;
  avatarUrl?: string;
}

// 12. Weather Context
export interface WeatherContext {
  id: string;
  name: string;
  temperatureRange: string;
  fabricAdvice: string;
  accessoryAdvice: string;
  suggestedGarments: string[];
}

// 13. Outfit & OutfitItem
export interface OutfitItem {
  garmentId: string;
  primaryColor: string;
  pantColor: string;
  accessoryIds: string[];
}

export interface Outfit {
  id: string;
  title: string;
  garmentId: string;
  primaryColor: string;
  pantColor: string;
  accessoryIds: string[];
  characterId: string;
  hairStyle: string;
  footwear: string;
  adaptiveNeedCode?: string;
  adaptiveNeedCodes?: FunctionalNeedCode[];
  includeAdaptiveInShare?: boolean;
  eventId: string;
  eventDate?: string;
  location?: string;
  weatherId: string;
  styleVibe: string;
  chuanScore: number;
  chatScore: number;
  colorHarmonyScore?: number;
  cultureStatus: CultureStatus;
  retainedCharacteristics: string[];
  sources: string[];
  explanation?: string;
  caption?: string;
  createdAt: string;
  isFavorite?: boolean;
}

// 14. Lookbook Item
export interface LookbookItem {
  id: string;
  userId?: string;
  outfit: Outfit;
  tags: string[];
  savedAt: string;
  customNotes?: string;
}

// 15. Cultural and Style Evaluation Results
export interface CultureCheckResult {
  status: CultureStatus;
  score: number;
  ruleIds: string[];
  reasons: string[];
  retainedCharacteristics: string[];
  sourceIds: string[];
  nonNegotiablesSatisfied: boolean;
}

export interface StyleScoreResult {
  score: number;
  label: string;
  feedback: string[];
  colorHarmony: 'PERFECT' | 'BALANCED' | 'BOLD' | 'MUTED';
  occasionFit: boolean;
}
