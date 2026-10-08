/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navbar, type MainNavTab } from './components/Navbar';
import { HomeHero } from './components/HomeHero';
import { StylingWorkspace, type JourneyStep } from './components/StylingWorkspace';
import { Studio } from './components/Studio';
import { AdaptiveStudio } from './components/AdaptiveStudio';
import { GarmentDiscovery } from './components/GarmentDiscovery';
import { Dialog } from './components/ui/Dialog';
import type { LookSnapshot } from './components/CompareView';
import type {
  Garment,
  CharacterItem,
  Outfit,
  CultureCheckResult,
  StyleScoreResult,
} from './types/fashion';
import type { FunctionalNeedCode } from './types/domain';
import type { GeminiCaptionResponse, GeminiExplainResponse, GeminiVisionResponse } from './types/gemini';
import {
  getApprovedAccessories,
  getApprovedGarments,
  getAdaptiveNeeds,
  getApprovedSources,
  getCharacters,
  getEventById,
  getEvents,
  getValidatedAdaptiveAdjustments,
  getWeatherContexts,
} from './lib/dal';
import { checkCulture } from './lib/culture/ruleEngine';
import {
  calculateStyleScore,
  type DeterministicRecommendation,
  getDeterministicRecommendations,
  type RecommendationContext,
} from './lib/recommendation/engine';
import {
  analyzeOutfitPhoto,
  explainOutfit,
  GeminiRequestError,
  getGeminiRecommendation,
  getOutfitCaptions,
  getServerHealth,
  parseNaturalLanguagePrompt,
  renderOutfitImage,
  type ServerHealth,
} from './lib/gemini/client';
import { evaluateColorHarmony } from './lib/color/harmony';
import { prepareImageForGemini, type PreparedImage } from './lib/image/prepareImage';
import { STYLE_CHOICES, STYLE_VIBE_BY_TAG, styleLabel, styleTagFor } from './lib/styles';
import { getSavedOutfits, saveOutfitToLookbook } from './lib/storage/lookbook';
import type { RenderState } from './components/AiRenderPanel';

const GarmentDetailModal = lazy(() => import('./components/GarmentDetailModal').then((module) => ({ default: module.GarmentDetailModal })));
const CompareView = lazy(() => import('./components/CompareView').then((module) => ({ default: module.CompareView })));
const LookbookDrawer = lazy(() => import('./components/LookbookDrawer').then((module) => ({ default: module.LookbookDrawer })));
const ShareModal = lazy(() => import('./components/ShareModal').then((module) => ({ default: module.ShareModal })));
const AdaptiveTailoringSheet = lazy(() => import('./components/AdaptiveTailoringSheet').then((module) => ({ default: module.AdaptiveTailoringSheet })));
const AdminKnowledgeModal = lazy(() => import('./components/AdminKnowledgeModal').then((module) => ({ default: module.AdminKnowledgeModal })));

type HomeExperience = 'HERO_PROMPT' | 'WORKSPACE' | 'STUDIO' | 'ADAPTIVE';

const garments = getApprovedGarments();
const characters = getCharacters();
const accessories = getApprovedAccessories();
const events = getEvents();
const weatherIds = new Set(getWeatherContexts().map((weather) => weather.id));
const accessoriesById = new Map(accessories.map((accessory) => [accessory.id, accessory]));

function isAccessoryAllowed(accessoryId: string, garment: Garment, eventId: string): boolean {
  const accessory = accessoriesById.get(accessoryId);
  return Boolean(accessory &&
    garment.compatibleAccessoryIds.includes(accessoryId) &&
    accessory.compatibleGarmentIds.includes(garment.id) &&
    (!accessory.compatibleEventIds.length || accessory.compatibleEventIds.includes(eventId)));
}

function defaultPantColor(garment: Garment): string {
  return garment.id === 'garment-ao-tac' || garment.id === 'garment-ao-nhat-binh' || garment.id === 'garment-ao-dai-truyen-thong'
    ? '#F4F0E8'
    : '#1C1C1E';
}

function scrollToId(id: string) {
  window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
}

export default function App() {
  // Navigation tabs
  const [mainNavTab, setMainNavTab] = useState<MainNavTab>('HOME');
  const [homeExperience, setHomeExperience] = useState<HomeExperience>('HERO_PROMPT');

  // Outfit state
  const [selectedGarment, setSelectedGarment] = useState<Garment>(garments[0]);
  const [primaryColorHex, setPrimaryColorHex] = useState<string>(garments[0].baseColors[0].hex);
  const [pantColorHex, setPantColorHex] = useState<string>('#F4F0E8');
  const [selectedAccessoryIds, setSelectedAccessoryIds] = useState<string[]>(['acc-khan-dong', 'acc-the-bai']);
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterItem>(characters[0]);
  const [skinTone, setSkinTone] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string>('EVENT_GRADUATION');
  const [selectedWeatherId, setSelectedWeatherId] = useState<string>('WEATHER_HOT');
  const [selectedStyleVibe, setSelectedStyleVibe] = useState<string>('TOI_GIAN');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedEventDate, setSelectedEventDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedAdaptiveNeedCodes, setSelectedAdaptiveNeedCodes] = useState<FunctionalNeedCode[]>([]);
  const [remixRatio, setRemixRatio] = useState<number>(30); // 0 (Traditional) to 100 (Remix)
  const adaptiveNeedCode = selectedAdaptiveNeedCodes[0];

  // Journey + recommendations
  const [journeyStep, setJourneyStep] = useState<JourneyStep>('CONTEXT');
  const [recommendations, setRecommendations] = useState<DeterministicRecommendation[]>([]);
  const [recommendationState, setRecommendationState] = useState<'IDLE' | 'LOADING' | 'READY' | 'EMPTY' | 'UNSUPPORTED' | 'ERROR'>('IDLE');
  const [recommendationError, setRecommendationError] = useState<string | null>(null);
  const [recommendationUsedFallback, setRecommendationUsedFallback] = useState(true);
  const [selectedRecommendationId, setSelectedRecommendationId] = useState<string | null>(null);

  // Gemini
  const [health, setHealth] = useState<ServerHealth | null>(null);
  const [healthChecked, setHealthChecked] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<GeminiExplainResponse | null>(null);
  const [aiCaption, setAiCaption] = useState<{ key: string; caption: GeminiCaptionResponse } | null>(null);
  const [isLoadingExplain, setIsLoadingExplain] = useState(false);
  const [isLoadingCaption, setIsLoadingCaption] = useState(false);
  const [isAiParsing, setIsAiParsing] = useState(false);
  const explainRequestRef = useRef(0);
  const [explainNonce, setExplainNonce] = useState(0);

  // Photo (Gemini Vision) + AI render
  const [photo, setPhoto] = useState<PreparedImage | null>(null);
  const [photoAnalysis, setPhotoAnalysis] = useState<GeminiVisionResponse | null>(null);
  const [isAnalyzingPhoto, setIsAnalyzingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [photoConsent, setPhotoConsent] = useState(false);
  const [useReferenceForRender, setUseReferenceForRender] = useState(false);
  const [renderStates, setRenderStates] = useState<Record<string, RenderState>>({});
  const [visualTab, setVisualTab] = useState<'MOCKUP' | 'AI'>('MOCKUP');

  // UI Modals & Drawers
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);
  const [isLookbookOpen, setIsLookbookOpen] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [isTailoringSheetOpen, setIsTailoringSheetOpen] = useState(false);
  const [tailoringNeedCode, setTailoringNeedCode] = useState<string>('WHEELCHAIR_SEATED');
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [shareTarget, setShareTarget] = useState<Outfit | null>(null);
  const [inspectedGarment, setInspectedGarment] = useState<Garment | null>(null);
  const [lookbookCount, setLookbookCount] = useState(0);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToastMessage(null), 4200);
  }, []);

  const displayCharacter = useMemo<CharacterItem>(() => (
    skinTone ? { ...selectedCharacter, skinTone, defaultSkinTone: skinTone } : selectedCharacter
  ), [selectedCharacter, skinTone]);

  // Mount: health check, lookbook count, shared-link hydration
  useEffect(() => {
    setLookbookCount(getSavedOutfits().length);
    getServerHealth().then((result) => {
      setHealth(result);
      setHealthChecked(true);
    });

    const params = new URLSearchParams(window.location.search);
    const garment = garments.find((item) => item.id === params.get('garment'));
    if (!garment) return;
    const color = garment.baseColors.find((item) => item.hex.toLowerCase() === `#${params.get('color') ?? ''}`.toLowerCase());
    const eventId = getEventById(params.get('event') ?? '')?.id ?? 'EVENT_GRADUATION';
    const pant = params.get('pant');
    const vibe = params.get('vibe');
    const accessoryIds = (params.get('acc') ?? '').split(',').filter((id) => isAccessoryAllowed(id, garment, eventId));
    const adaptiveCodes = (params.get('adaptive') ?? '').split(',').filter((code) =>
      getAdaptiveNeeds().some((need) => need.code === code)) as FunctionalNeedCode[];

    setSelectedGarment(garment);
    setPrimaryColorHex(color?.hex ?? garment.baseColors[0].hex);
    if (pant && /^[0-9a-fA-F]{6}$/.test(pant)) setPantColorHex(`#${pant}`);
    setSelectedEventId(eventId);
    if (vibe && STYLE_CHOICES.some((style) => style.id === vibe)) setSelectedStyleVibe(vibe);
    setSelectedAccessoryIds(accessoryIds);
    setSelectedAdaptiveNeedCodes(adaptiveCodes);
    setHomeExperience('WORKSPACE');
    setJourneyStep('RESULT');
    showToast(`Đã mở bản phối được chia sẻ: ${garment.name}`);
    scrollToId('workspace-root');
  }, [showToast]);

  const activeAccessories = useMemo(
    () => accessories.filter((accessory) => selectedAccessoryIds.includes(accessory.id)),
    [selectedAccessoryIds],
  );
  const currentEvent = getEventById(selectedEventId);
  const currentEventName = currentEvent?.name ?? 'Sự kiện đã chọn';

  const cultureResult: CultureCheckResult = useMemo(() => checkCulture({
    garmentId: selectedGarment.id,
    accessoryIds: selectedAccessoryIds,
    eventId: selectedEventId,
    primaryColor: primaryColorHex,
    adaptiveNeedCode,
  }), [selectedGarment.id, selectedAccessoryIds, selectedEventId, primaryColorHex, adaptiveNeedCode]);

  const styleResult: StyleScoreResult = useMemo(() => calculateStyleScore(
    selectedGarment,
    primaryColorHex,
    selectedAccessoryIds,
    selectedEventId,
    selectedStyleVibe,
  ), [selectedGarment, primaryColorHex, selectedAccessoryIds, selectedEventId, selectedStyleVibe]);

  const harmonyResult = useMemo(() => evaluateColorHarmony({
    primaryColor: primaryColorHex,
    pantColor: pantColorHex,
    accessoryColors: activeAccessories.map((accessory) => accessory.colors[0]).filter(Boolean),
    eventAdvice: currentEvent?.culturalAdvice,
    eventName: currentEvent?.name,
  }), [primaryColorHex, pantColorHex, activeAccessories, currentEvent]);

  const harmonySwatches = useMemo(() => {
    const colorName = selectedGarment.baseColors.find((color) => color.hex.toLowerCase() === primaryColorHex.toLowerCase())?.name ?? 'Tà áo';
    return [
      { label: colorName, hex: primaryColorHex },
      { label: 'Quần / váy', hex: pantColorHex },
      ...activeAccessories.slice(0, 4).map((accessory) => ({ label: accessory.name, hex: accessory.colors[0] ?? '#888888' })),
    ];
  }, [selectedGarment, primaryColorHex, pantColorHex, activeAccessories]);

  const outfitKey = [
    selectedGarment.id, primaryColorHex, selectedEventId, selectedStyleVibe,
    [...selectedAccessoryIds].sort().join('+'), selectedAdaptiveNeedCodes.join('+'),
  ].join('|');

  const requestOutfitExplanation = useCallback(async () => {
    const requestId = ++explainRequestRef.current;
    setIsLoadingExplain(true);
    try {
      const response = await explainOutfit({
        garment: selectedGarment,
        cultureCheck: cultureResult,
        eventId: selectedEventId,
        eventName: currentEventName,
        styleVibe: selectedStyleVibe,
        primaryColor: primaryColorHex,
        accessoryIds: selectedAccessoryIds,
        accessoryNames: activeAccessories.map((accessory) => accessory.name),
        adaptiveNeedCodes: selectedAdaptiveNeedCodes,
      });
      if (requestId === explainRequestRef.current) setAiExplanation(response);
    } finally {
      if (requestId === explainRequestRef.current) {
        setIsLoadingExplain(false);
      }
    }
  }, [outfitKey, selectedGarment, cultureResult, selectedEventId, currentEventName, selectedStyleVibe, primaryColorHex, selectedAccessoryIds, activeAccessories, selectedAdaptiveNeedCodes]);

  useEffect(() => {
    if (journeyStep !== 'RESULT' || homeExperience !== 'WORKSPACE') return;
    const timer = window.setTimeout(() => void requestOutfitExplanation(), 450);
    return () => window.clearTimeout(timer);
  }, [journeyStep, homeExperience, requestOutfitExplanation, explainNonce]);

  const requestCaptionFor = async (outfit: Outfit, key: string) => {
    const garment = garments.find((item) => item.id === outfit.garmentId);
    if (!garment) return;
    setIsLoadingCaption(true);
    try {
      const caption = await getOutfitCaptions({
        garmentId: outfit.garmentId,
        garmentName: garment.name,
        styleTitle: `${garment.name} · ${styleLabel(outfit.styleVibe)}`,
        eventId: outfit.eventId,
        eventTitle: getEventById(outfit.eventId)?.name ?? 'dịp đặc biệt',
        chuanScore: outfit.chuanScore,
        chatScore: outfit.chatScore,
        vibe: outfit.styleVibe,
        primaryColor: outfit.primaryColor,
        accessoryIds: outfit.accessoryIds.filter((id) => isAccessoryAllowed(id, garment, outfit.eventId)),
        adaptiveNeedCodes: outfit.adaptiveNeedCodes,
      });
      setAiCaption({ key, caption });
    } finally {
      setIsLoadingCaption(false);
    }
  };

  const handleNaturalLanguageSubmit = async (promptText: string) => {
    setIsAiParsing(true);
    try {
      const parsed = await parseNaturalLanguagePrompt(promptText);
      if (parsed.eventId) setSelectedEventId(parsed.eventId);
      if (parsed.weatherId) setSelectedWeatherId(parsed.weatherId);
      if (parsed.styleId && STYLE_CHOICES.some((style) => style.id === parsed.styleId)) setSelectedStyleVibe(parsed.styleId);
      if (parsed.needCodes.length) setSelectedAdaptiveNeedCodes(parsed.needCodes);
      const garment = garments.find((item) => item.id === parsed.garmentId);
      if (garment) {
        setSelectedGarment(garment);
        setPrimaryColorHex(garment.baseColors.find((color) => color.hex.toLowerCase() === parsed.color?.toLowerCase())?.hex ?? garment.baseColors[0].hex);
      } else if (parsed.color && selectedGarment.baseColors.some((color) => color.hex.toLowerCase() === parsed.color?.toLowerCase())) {
        setPrimaryColorHex(parsed.color);
      }
      showToast(parsed.usedFallback || parsed.confirmationRequired.length
        ? `${parsed.summary} Các mục chưa rõ vẫn để bạn tự chọn.`
        : `Gemini đã điền: ${parsed.summary}`);
    } finally {
      setIsAiParsing(false);
    }
  };

  const applyCandidate = (candidate: DeterministicRecommendation, styleOverride?: string) => {
    const garment = garments.find((item) => item.id === candidate.garmentId);
    if (!garment) return;
    if (garment.id !== selectedGarment.id) setPantColorHex(defaultPantColor(garment));
    setSelectedGarment(garment);
    setPrimaryColorHex(candidate.color);
    setSelectedAccessoryIds(candidate.accessoryIds);
    setSelectedStyleVibe(styleOverride ?? STYLE_VIBE_BY_TAG[candidate.style] ?? candidate.style);
    setSelectedRecommendationId(candidate.outfitId);
    setVisualTab('MOCKUP');
  };

  const runAiStylist = async (text: string) => {
    setIsAiParsing(true);
    try {
      const parsed = await parseNaturalLanguagePrompt(text);
      const eventId = parsed.eventId ?? selectedEventId;
      const weatherId = parsed.weatherId && weatherIds.has(parsed.weatherId) ? parsed.weatherId : selectedWeatherId;
      const styleId = parsed.styleId && STYLE_CHOICES.some((style) => style.id === parsed.styleId) ? parsed.styleId : selectedStyleVibe;
      const needCodes = parsed.needCodes.length ? parsed.needCodes : selectedAdaptiveNeedCodes;
      const photoColor = photoAnalysis?.colorMatches[0];
      const colorPreference = parsed.color ?? photoColor?.colorHex;
      const garmentPreference = parsed.garmentId ?? (photoAnalysis?.suggestedGarmentIds[0] || undefined);

      const baseContext: RecommendationContext = {
        eventId,
        weatherId,
        location: selectedLocation || undefined,
        style: styleTagFor(styleId),
        colorPreferences: colorPreference ? [colorPreference] : [],
        accessoryIds: parsed.accessoryIds,
        characterId: selectedCharacter.id,
        adaptiveNeedCodes: needCodes,
        garmentPreferences: garmentPreference ? { preferredGarmentIds: [garmentPreference] } : undefined,
        limit: 6,
      };
      let context = baseContext;
      let candidates = getDeterministicRecommendations(context);
      if (!candidates.length && needCodes.length) {
        context = { ...baseContext, adaptiveNeedCodes: [] };
        candidates = getDeterministicRecommendations(context);
        if (candidates.length) showToast('Chưa có đề xuất thích ứng riêng cho dịp này, Vstyle gợi ý bản phối tiêu chuẩn.');
      }
      if (!candidates.length) {
        showToast('Chưa có bản phối đã duyệt cho tổ hợp này. Thử đổi dịp hoặc phong cách.');
        return;
      }

      const ranking = await getGeminiRecommendation(context, candidates);
      const byId = new Map(candidates.map((candidate) => [candidate.outfitId, candidate]));
      const ordered = ranking.candidateIds.flatMap((id) => byId.get(id) ?? []);
      const finalCandidates = (ordered.length ? ordered : candidates).slice(0, 3);

      setSelectedEventId(eventId);
      setSelectedWeatherId(weatherId);
      setSelectedAdaptiveNeedCodes((context.adaptiveNeedCodes ?? []) as FunctionalNeedCode[]);
      setRecommendations(finalCandidates);
      setRecommendationUsedFallback(Boolean(ranking.usedFallback));
      setRecommendationState('READY');
      applyCandidate(finalCandidates[0], styleId);

      setHomeExperience('WORKSPACE');
      setJourneyStep('RESULT');
      setExplainNonce((value) => value + 1);
      scrollToId('workspace-root');
    } catch {
      showToast('Có lỗi khi phối đồ. Bạn thử lại hoặc chọn "Phối 9 bước".');
    } finally {
      setIsAiParsing(false);
    }
  };

  const handleRequestRecommendations = async () => {
    setJourneyStep('RECOMMENDATION');
    setRecommendationState('LOADING');
    setRecommendationError(null);
    setRecommendations([]);
    setSelectedRecommendationId(null);

    try {
      const context: RecommendationContext = {
        eventId: selectedEventId,
        location: selectedLocation || undefined,
        weatherId: selectedWeatherId,
        garmentPreferences: { preferredGarmentIds: [selectedGarment.id] },
        style: styleTagFor(selectedStyleVibe),
        colorPreferences: [primaryColorHex],
        accessoryIds: selectedAccessoryIds,
        characterId: selectedCharacter.id,
        adaptiveNeedCodes: selectedAdaptiveNeedCodes,
        limit: 6,
      };
      const candidates = getDeterministicRecommendations(context);
      const ranking = await getGeminiRecommendation(context, candidates);
      const candidatesById = new Map(candidates.map((candidate) => [candidate.outfitId, candidate]));
      const orderedCandidates = ranking.candidateIds.flatMap((id) => candidatesById.get(id) ?? []);
      const finalCandidates = (orderedCandidates.length ? orderedCandidates : candidates).slice(0, 3);
      setRecommendationUsedFallback(Boolean(ranking.usedFallback));
      setRecommendations(finalCandidates);
      setRecommendationState(finalCandidates.length ? 'READY' : selectedAdaptiveNeedCodes.length ? 'UNSUPPORTED' : 'EMPTY');
    } catch {
      setRecommendationError('Không thể tạo gợi ý lúc này. Các lựa chọn của bạn vẫn được giữ nguyên.');
      setRecommendationState('ERROR');
    }
  };

  const handlePickPhoto = async (file: File) => {
    setPhotoError(null);
    setPhotoAnalysis(null);
    try {
      const prepared = await prepareImageForGemini(file);
      setPhoto(prepared);
      setPhotoConsent(false);
      setUseReferenceForRender(false);
      void analyzePhoto(prepared);
    } catch (error) {
      setPhotoError(error instanceof Error ? error.message : 'Không đọc được ảnh.');
    }
  };

  const analyzePhoto = async (prepared: PreparedImage | null = photo) => {
    if (!prepared) return;
    setIsAnalyzingPhoto(true);
    setPhotoError(null);
    try {
      const analysis = await analyzeOutfitPhoto(prepared.image);
      setPhotoAnalysis(analysis);
      if (!analysis.usedFallback) showToast('Gemini đã đọc bảng màu từ ảnh của bạn.');
    } catch (error) {
      setPhotoError(error instanceof GeminiRequestError && error.status === 429
        ? error.message
        : 'Chưa phân tích được ảnh. Bạn vẫn có thể chọn màu thủ công.');
    } finally {
      setIsAnalyzingPhoto(false);
    }
  };

  const clearPhoto = () => {
    setPhoto(null);
    setPhotoAnalysis(null);
    setPhotoError(null);
    setPhotoConsent(false);
    setUseReferenceForRender(false);
  };

  const applyPhotoMatch = (garmentId: string, colorHex: string) => {
    const garment = garments.find((item) => item.id === garmentId);
    if (!garment) return;
    if (garment.id !== selectedGarment.id) {
      setSelectedGarment(garment);
      setPantColorHex(defaultPantColor(garment));
      setSelectedAccessoryIds((ids) => ids.filter((id) => isAccessoryAllowed(id, garment, selectedEventId)));
    }
    setPrimaryColorHex(colorHex);
    showToast(`Đã chọn ${garment.name} với màu gần ảnh của bạn.`);
  };

  const canUseReference = Boolean(photo && photoConsent);
  const renderKey = `${outfitKey}|${pantColorHex}|${displayCharacter.id}|${skinTone ?? ''}|${canUseReference && useReferenceForRender ? 'ref' : 'noref'}`;
  const renderState: RenderState = renderStates[renderKey] ?? { status: 'idle' };

  const generateRender = async () => {
    const key = renderKey;
    setRenderStates((states) => ({ ...states, [key]: { status: 'loading' } }));
    try {
      const result = await renderOutfitImage({
        garmentId: selectedGarment.id,
        eventId: selectedEventId,
        styleId: selectedStyleVibe,
        primaryColor: primaryColorHex,
        pantColor: pantColorHex,
        accessoryIds: selectedAccessoryIds,
        characterId: selectedCharacter.id,
        skinTone: skinTone ?? undefined,
        adaptiveNeedCodes: selectedAdaptiveNeedCodes,
        referenceImage: canUseReference && useReferenceForRender ? photo?.image : undefined,
        consentToUseReference: canUseReference && useReferenceForRender,
      });
      setRenderStates((states) => ({ ...states, [key]: { status: 'ready', result } }));
    } catch (error) {
      setRenderStates((states) => ({
        ...states,
        [key]: { status: 'error', error: error instanceof Error ? error.message : 'Chưa tạo được ảnh AI.' },
      }));
    }
  };

  const handleSelectGarment = (garment: Garment) => {
    setSelectedGarment(garment);
    setPrimaryColorHex(garment.baseColors[0].hex);
    setPantColorHex(defaultPantColor(garment));
    const compatible = accessories
      .filter((accessory) => isAccessoryAllowed(accessory.id, garment, selectedEventId))
      .slice(0, 2)
      .map((accessory) => accessory.id);
    setSelectedAccessoryIds(compatible);
    showToast(`Đã chọn ${garment.name}`);
  };

  const handleToggleAccessory = (accessoryId: string) => {
    if (!isAccessoryAllowed(accessoryId, selectedGarment, selectedEventId)) return;
    setSelectedAccessoryIds((previous) =>
      previous.includes(accessoryId) ? previous.filter((id) => id !== accessoryId) : [...previous, accessoryId]);
  };

  const buildCurrentOutfit = (id: string): Outfit => ({
    id,
    title: `${selectedGarment.name} · ${styleLabel(selectedStyleVibe)}`,
    garmentId: selectedGarment.id,
    primaryColor: primaryColorHex,
    pantColor: pantColorHex,
    accessoryIds: selectedAccessoryIds,
    characterId: selectedCharacter.id,
    hairStyle: 'TRUYEN_THONG',
    footwear: 'HAI_SEN',
    adaptiveNeedCode,
    adaptiveNeedCodes: selectedAdaptiveNeedCodes,
    eventId: selectedEventId,
    eventDate: selectedEventDate,
    location: selectedLocation,
    weatherId: selectedWeatherId,
    styleVibe: selectedStyleVibe,
    chuanScore: cultureResult.score,
    chatScore: styleResult.score,
    cultureStatus: cultureResult.status,
    retainedCharacteristics: cultureResult.retainedCharacteristics,
    sources: cultureResult.sourceIds,
    explanation: aiExplanation && !aiExplanation.usedFallback ? aiExplanation.editorialReview : undefined,
    caption: aiCaption?.key === outfitKey ? aiCaption.caption.instagramCaption : undefined,
    createdAt: new Date().toISOString(),
  });

  const handleSaveOutfit = (outfitToSave?: Outfit) => {
    const toSave = outfitToSave ?? buildCurrentOutfit(`outfit-${Date.now()}`);
    const saved = saveOutfitToLookbook(toSave);
    setLookbookCount(getSavedOutfits().length);
    showToast(saved ? 'Đã lưu bản phối vào Lookbook! ✨' : 'Chưa lưu được vào Lookbook.');
  };

  const handleLoadOutfit = (outfit: Outfit) => {
    const garment = garments.find((item) => item.id === outfit.garmentId);
    if (!garment) return;
    setSelectedGarment(garment);
    setPrimaryColorHex(garment.baseColors.some((color) => color.hex.toLowerCase() === outfit.primaryColor.toLowerCase()) ? outfit.primaryColor : garment.baseColors[0].hex);
    setPantColorHex(outfit.pantColor);
    const eventId = getEventById(outfit.eventId)?.id ?? 'EVENT_GRADUATION';
    setSelectedEventId(eventId);
    setSelectedAccessoryIds(outfit.accessoryIds.filter((id) => isAccessoryAllowed(id, garment, eventId)));
    const character = characters.find((item) => item.id === outfit.characterId);
    if (character) setSelectedCharacter(character);
    setSelectedEventDate(outfit.eventDate ?? new Date().toISOString().slice(0, 10));
    setSelectedLocation(outfit.location ?? '');
    if (weatherIds.has(outfit.weatherId)) setSelectedWeatherId(outfit.weatherId);
    setSelectedStyleVibe(STYLE_CHOICES.some((style) => style.id === outfit.styleVibe) ? outfit.styleVibe : 'TRUYEN_THONG_HOANG_GIA');
    setSelectedAdaptiveNeedCodes(outfit.adaptiveNeedCodes ?? (outfit.adaptiveNeedCode ? [outfit.adaptiveNeedCode as FunctionalNeedCode] : []));
    setMainNavTab('HOME');
    setHomeExperience('WORKSPACE');
    setJourneyStep('RESULT');
    setIsLookbookOpen(false);
    showToast(`Đã mở bản phối: ${outfit.title}`);
    scrollToId('workspace-root');
  };

  const compareLooks = useMemo<LookSnapshot[]>(() => {
    const current: LookSnapshot = {
      id: 'current',
      title: `Hiện tại · ${selectedGarment.name}`,
      garmentId: selectedGarment.id,
      primaryColor: primaryColorHex,
      pantColor: pantColorHex,
      accessoryIds: selectedAccessoryIds,
      eventId: selectedEventId,
      styleVibe: selectedStyleVibe,
      adaptiveNeedCodes: selectedAdaptiveNeedCodes,
    };
    const fromRecommendations = recommendations.map<LookSnapshot>((candidate, index) => ({
      id: candidate.outfitId,
      title: `Gợi ý ${index + 1} · ${garments.find((garment) => garment.id === candidate.garmentId)?.name ?? ''}`,
      garmentId: candidate.garmentId,
      primaryColor: candidate.color,
      pantColor: pantColorHex,
      accessoryIds: candidate.accessoryIds,
      eventId: candidate.eventId,
      styleVibe: STYLE_VIBE_BY_TAG[candidate.style] ?? candidate.style,
      adaptiveNeedCodes: selectedAdaptiveNeedCodes,
    }));
    const fromLookbook = isCompareOpen ? getSavedOutfits().map<LookSnapshot>((outfit) => ({
      id: `lookbook-${outfit.id}`,
      title: `Lookbook · ${outfit.title}`,
      garmentId: outfit.garmentId,
      primaryColor: outfit.primaryColor,
      pantColor: outfit.pantColor,
      accessoryIds: outfit.accessoryIds,
      eventId: getEventById(outfit.eventId)?.id ?? 'EVENT_GRADUATION',
      styleVibe: outfit.styleVibe,
      adaptiveNeedCodes: outfit.adaptiveNeedCodes,
    })) : [];
    const signature = (look: LookSnapshot) => [look.garmentId, look.primaryColor.toLowerCase(), look.pantColor.toLowerCase(), [...look.accessoryIds].sort().join('+'), look.eventId, look.styleVibe].join('|');
    const seen = new Set<string>();
    return [current, ...fromRecommendations, ...fromLookbook].filter((look) => {
      if (!garments.some((garment) => garment.id === look.garmentId)) return false;
      const key = signature(look);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [selectedGarment, primaryColorHex, pantColorHex, selectedAccessoryIds, selectedEventId, selectedStyleVibe, selectedAdaptiveNeedCodes, recommendations, isCompareOpen]);

  const handleUseComparedLook = (look: LookSnapshot) => {
    const garment = garments.find((item) => item.id === look.garmentId);
    if (!garment) return;
    setSelectedGarment(garment);
    setPrimaryColorHex(look.primaryColor);
    setPantColorHex(look.pantColor);
    setSelectedEventId(look.eventId);
    setSelectedAccessoryIds(look.accessoryIds.filter((id) => isAccessoryAllowed(id, garment, look.eventId)));
    setSelectedStyleVibe(look.styleVibe);
    setIsCompareOpen(false);
    setHomeExperience('WORKSPACE');
    setJourneyStep('RESULT');
    scrollToId('workspace-root');
  };

  const shareCaption = shareTarget && aiCaption?.key === (shareTarget.id === 'current' ? outfitKey : shareTarget.id) ? aiCaption.caption : null;

  return (
    <div className="min-h-dvh pb-24 bg-[#FBF8F3] text-[#1F1B18] font-sans selection:bg-[#E6DCCD] selection:text-[#1F1B18]">
      {/* Editorial Header */}
      <Navbar
        activeTab={mainNavTab}
        onSelectTab={(tab) => {
          if (tab === 'LOOKBOOK') {
            setIsLookbookOpen(true);
          } else {
            setMainNavTab(tab);
          }
        }}
        lookbookCount={lookbookCount}
        onOpenSearch={() => {
          setMainNavTab('DISCOVERY');
        }}
      />

      {/* Floating Toast Notification */}
      <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-5 bottom-6 z-[55] flex justify-center sm:inset-x-auto sm:right-12">
        {toastMessage && (
          <div className="pointer-events-auto max-w-md rounded-2xl border border-[#E6DCCD] bg-[#FFFFFF] px-5 py-3 text-xs sm:text-sm text-[#1F1B18] shadow-[0_8px_30px_rgb(0,0,0,0.08)] backdrop-blur animate-rise font-medium">
            {toastMessage}
          </div>
        )}
      </div>

      {/* Main Layout with 20px Mobile / 48px Desktop Padding */}
      <main id="main" className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12 pt-8">
        {/* ========================================================================= */}
        {/* VIEW 1: HOME */}
        {/* ========================================================================= */}
        {mainNavTab === 'HOME' && (
          <div className="space-y-10">
            {/* Experience Switcher Bar (Only shown when inside Workspace, Studio, or Adaptive) */}
            {homeExperience !== 'HERO_PROMPT' && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E6DCCD] pb-4">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setHomeExperience('HERO_PROMPT')}
                    className="press min-h-[44px] px-3.5 py-1.5 rounded-xl border border-[#E6DCCD] bg-[#FFFFFF] text-xs font-semibold text-[#736960] hover:text-[#1F1B18] hover:bg-[#F1EADF] transition flex items-center gap-1.5"
                  >
                    <span>← Trang chủ</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    {[
                      { id: 'WORKSPACE', label: 'Phối 9 bước', icon: '📐' },
                      { id: 'STUDIO', label: 'Studio thời trang', icon: '🎮' },
                      { id: 'ADAPTIVE', label: 'May đo thích ứng', icon: '♿' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setHomeExperience(tab.id as HomeExperience)}
                        className={`press min-h-[44px] px-4 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                          homeExperience === tab.id
                            ? 'bg-[#1F1B18] text-[#FFFFFF] shadow-xs'
                            : 'bg-[#FFFFFF] border border-[#E6DCCD] text-[#736960] hover:text-[#1F1B18]'
                        }`}
                      >
                        <span>{tab.icon}</span>
                        <span>{tab.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-3 text-xs text-[#736960] font-mono">
                  <span>Chuẩn: <strong className="text-[#1F1B18]">{cultureResult.score}/100</strong></span>
                  <span>Chất: <strong className="text-[#1F1B18]">{styleResult.score}/100</strong></span>
                  <span>Màu: <strong className="text-[#1F1B18]">{harmonyResult.score}/100</strong></span>
                </div>
              </div>
            )}

            {/* 1. HERO + 4 ACTION CARDS */}
            {homeExperience === 'HERO_PROMPT' && (
              <HomeHero
                onRunStylist={runAiStylist}
                onPickPhoto={(file) => {
                  void handlePickPhoto(file);
                  showToast('Đang phân tích ảnh cảm hứng…');
                }}
                photoPreviewUrl={photo?.previewUrl ?? null}
                isParsing={isAiParsing}
                onSelectStudio={() => setHomeExperience('STUDIO')}
                onSelect9Steps={() => {
                  setHomeExperience('WORKSPACE');
                  setJourneyStep('CONTEXT');
                  scrollToId('workspace-root');
                }}
                onSelectDiscovery={() => setMainNavTab('DISCOVERY')}
                onSelectAdaptive={() => setHomeExperience('ADAPTIVE')}
              />
            )}

            {/* 2. 9-STEP WORKSPACE */}
            {homeExperience === 'WORKSPACE' && (
              <StylingWorkspace
                journeyStep={journeyStep}
                onSetJourneyStep={setJourneyStep}
                selectedGarment={selectedGarment}
                primaryColorHex={primaryColorHex}
                pantColorHex={pantColorHex}
                selectedAccessoryIds={selectedAccessoryIds}
                activeAccessories={activeAccessories}
                selectedCharacter={displayCharacter}
                skinTone={skinTone}
                selectedEventId={selectedEventId}
                currentEventName={currentEventName}
                selectedWeatherId={selectedWeatherId}
                selectedLocation={selectedLocation}
                selectedEventDate={selectedEventDate}
                selectedStyleVibe={selectedStyleVibe}
                selectedAdaptiveNeedCodes={selectedAdaptiveNeedCodes}
                remixRatio={remixRatio}
                onSetRemixRatio={setRemixRatio}
                onSelectGarment={handleSelectGarment}
                onColorChange={setPrimaryColorHex}
                onPantColorChange={setPantColorHex}
                onToggleAccessory={handleToggleAccessory}
                onSelectCharacter={setSelectedCharacter}
                onSkinToneChange={setSkinTone}
                onEventChange={setSelectedEventId}
                onWeatherChange={setSelectedWeatherId}
                onLocationChange={setSelectedLocation}
                onDateChange={setSelectedEventDate}
                onStyleVibeChange={setSelectedStyleVibe}
                onAdaptiveCodesChange={setSelectedAdaptiveNeedCodes}
                onOpenTailoringSheet={(code) => {
                  setTailoringNeedCode(code);
                  setIsTailoringSheetOpen(true);
                }}
                onViewGarmentDetails={setInspectedGarment}
                cultureResult={cultureResult}
                styleResult={styleResult}
                harmonyResult={harmonyResult}
                harmonySwatches={harmonySwatches}
                recommendations={recommendations}
                recommendationState={recommendationState}
                recommendationError={recommendationError}
                recommendationUsedFallback={recommendationUsedFallback}
                onRequestRecommendations={handleRequestRecommendations}
                onUseRecommendation={applyCandidate}
                photoPreviewUrl={photo?.previewUrl ?? null}
                photoAnalysis={photoAnalysis}
                isAnalyzingPhoto={isAnalyzingPhoto}
                photoError={photoError}
                photoConsent={photoConsent}
                onPickPhoto={(file) => void handlePickPhoto(file)}
                onAnalyzePhoto={() => void analyzePhoto()}
                onClearPhoto={clearPhoto}
                onConsentChange={(val) => {
                  setPhotoConsent(val);
                  setUseReferenceForRender(val);
                }}
                onApplyPhotoMatch={applyPhotoMatch}
                isAiParsing={isAiParsing}
                onNaturalLanguageSubmit={handleNaturalLanguageSubmit}
                aiExplanation={aiExplanation}
                aiCaption={aiCaption}
                isLoadingExplain={isLoadingExplain}
                isLoadingCaption={isLoadingCaption}
                onRefreshExplain={() => void requestOutfitExplanation()}
                onRequestCaption={() => void requestCaptionFor(buildCurrentOutfit('current'), outfitKey)}
                visualTab={visualTab}
                onSetVisualTab={setVisualTab}
                renderState={renderState}
                canUseReference={canUseReference}
                useReferenceForRender={useReferenceForRender}
                onToggleReferenceRender={setUseReferenceForRender}
                onGenerateRender={() => void generateRender()}
                onSaveOutfit={() => handleSaveOutfit()}
                onShareOutfit={() => setShareTarget(buildCurrentOutfit('current'))}
                onOpenCompare={() => setIsCompareOpen(true)}
                onOpenStudio={() => setHomeExperience('STUDIO')}
              />
            )}

            {/* 3. STUDIO */}
            {homeExperience === 'STUDIO' && (
              <Studio
                onSaveOutfit={handleSaveOutfit}
                onOpenCompare={() => setIsCompareOpen(true)}
                onOpenTailoringSheet={(code) => {
                  setTailoringNeedCode(code);
                  setIsTailoringSheetOpen(true);
                }}
                showToast={showToast}
              />
            )}

            {/* 4. ADAPTIVE FASHION */}
            {homeExperience === 'ADAPTIVE' && (
              <AdaptiveStudio
                onApplyAdaptiveOutfit={(g, needs) => {
                  setSelectedGarment(g);
                  setSelectedAdaptiveNeedCodes(needs);
                  setHomeExperience('WORKSPACE');
                  setJourneyStep('RESULT');
                  showToast('Đã áp dụng y phục may đo thích ứng.');
                }}
                showToast={showToast}
              />
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: DISCOVERY */}
        {/* ========================================================================= */}
        {mainNavTab === 'DISCOVERY' && (
          <GarmentDiscovery
            selectedGarmentId={selectedGarment.id}
            onSelectGarment={(garment) => {
              handleSelectGarment(garment);
              setMainNavTab('HOME');
              setHomeExperience('WORKSPACE');
              setJourneyStep('COLOR');
              scrollToId('workspace-root');
            }}
            onViewDetails={setInspectedGarment}
          />
        )}

        {/* Editorial Footer */}
        <footer className="mt-24 border-t border-[#E6DCCD] pt-8 pb-12 text-xs text-[#736960] space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <p className="max-w-xl leading-relaxed">
              Thông tin văn hóa được nhóm tổng hợp từ nguồn tham khảo và đang chờ chuyên gia thẩm định; hình vẽ và ảnh AI chỉ mang tính minh họa.
            </p>
            <div className="flex flex-wrap gap-4 text-[#1F1B18] font-medium">
              <button type="button" onClick={() => setMainNavTab('DISCOVERY')} className="hover:underline">
                Bách khoa y phục
              </button>
              <button type="button" onClick={() => { setHomeExperience('ADAPTIVE'); setMainNavTab('HOME'); }} className="hover:underline">
                May đo thích ứng
              </button>
              <button type="button" onClick={() => setIsCompareOpen(true)} className="hover:underline">
                So sánh bản phối
              </button>
              <button type="button" onClick={() => setIsAdminOpen(true)} className="hover:underline">
                Nguồn tham khảo
              </button>
            </div>
          </div>
        </footer>
      </main>

      {/* Global Modals / Drawers */}
      <Suspense fallback={null}>
        {inspectedGarment && (
          <GarmentDetailModal
            garment={inspectedGarment}
            onClose={() => setInspectedGarment(null)}
            onSelectForStyling={(garment) => {
              handleSelectGarment(garment);
              setMainNavTab('HOME');
              setHomeExperience('WORKSPACE');
              setJourneyStep('COLOR');
              scrollToId('workspace-root');
            }}
          />
        )}

        {isCompareOpen && (
          <CompareView
            looks={compareLooks}
            character={displayCharacter}
            onClose={() => setIsCompareOpen(false)}
            onUseLook={handleUseComparedLook}
          />
        )}

        {isLookbookOpen && (
          <LookbookDrawer
            isOpen={isLookbookOpen}
            onClose={() => {
              setIsLookbookOpen(false);
              setLookbookCount(getSavedOutfits().length);
            }}
            onLoadOutfit={handleLoadOutfit}
            onShareOutfit={(outfit) => setShareTarget(outfit)}
          />
        )}

        {shareTarget && (
          <ShareModal
            outfit={shareTarget}
            caption={shareCaption}
            isLoadingCaption={isLoadingCaption}
            onRequestCaption={() => void requestCaptionFor(shareTarget, shareTarget.id === 'current' ? outfitKey : shareTarget.id)}
            onClose={() => setShareTarget(null)}
          />
        )}

        {isTailoringSheetOpen && (
          <Dialog bare title="Cẩm nang may đo thích ứng" size="2xl" onClose={() => setIsTailoringSheetOpen(false)}>
            <AdaptiveTailoringSheet
              needCode={tailoringNeedCode}
              garmentName={selectedGarment.name}
              onClose={() => setIsTailoringSheetOpen(false)}
            />
          </Dialog>
        )}

        {isAdminOpen && <AdminKnowledgeModal onClose={() => setIsAdminOpen(false)} />}
      </Suspense>
    </div>
  );
}
