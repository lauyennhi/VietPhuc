import React from 'react';
import { Garment, CharacterItem, Accessory, Outfit, CultureCheckResult, StyleScoreResult } from '../types/fashion';
import { FunctionalNeedCode } from '../types/domain';
import { DeterministicRecommendation } from '../lib/recommendation/engine';
import { HarmonyResult } from '../lib/color/harmony';
import { GeminiCaptionResponse, GeminiExplainResponse } from '../types/gemini';
import { OutfitMockupCanvas } from './OutfitMockupCanvas';
import { TraditionalRemixToggle } from './TraditionalRemixToggle';
import { ContextSelector } from './ContextSelector';
import { AdaptiveSelector } from './AdaptiveSelector';
import { CharacterSelector } from './CharacterSelector';
import { GarmentDiscovery } from './GarmentDiscovery';
import { StyleCustomizer } from './StyleCustomizer';
import { RecommendationGallery } from './RecommendationGallery';
import { CultureCheckCard } from './CultureCheckCard';
import { AIRecommendationPanel } from './AIRecommendationPanel';
import { ColorHarmonyCard } from './ColorHarmonyCard';
import { PhotoInspirationCard } from './PhotoInspirationCard';
import { AiRenderPanel, type RenderState } from './AiRenderPanel';
import { SealStamp } from './ui/SealStamp';
import { STYLE_CHOICES, styleLabel } from '../lib/styles';

export type JourneyStep =
  | 'CONTEXT'
  | 'ADAPTIVE'
  | 'CHARACTER'
  | 'GARMENT'
  | 'STYLE'
  | 'COLOR'
  | 'ACCESSORIES'
  | 'RECOMMENDATION'
  | 'RESULT';

interface StylingWorkspaceProps {
  // Step state
  journeyStep: JourneyStep;
  onSetJourneyStep: (step: JourneyStep) => void;

  // Selections
  selectedGarment: Garment;
  primaryColorHex: string;
  pantColorHex: string;
  selectedAccessoryIds: string[];
  activeAccessories: Accessory[];
  selectedCharacter: CharacterItem;
  skinTone: string | null;
  selectedEventId: string;
  currentEventName: string;
  selectedWeatherId: string;
  selectedLocation: string;
  selectedEventDate: string;
  selectedStyleVibe: string;
  selectedAdaptiveNeedCodes: FunctionalNeedCode[];
  remixRatio: number;
  onSetRemixRatio: (ratio: number) => void;

  // Setters
  onSelectGarment: (garment: Garment) => void;
  onColorChange: (colorHex: string) => void;
  onPantColorChange: (pantColorHex: string) => void;
  onToggleAccessory: (accId: string) => void;
  onSelectCharacter: (char: CharacterItem) => void;
  onSkinToneChange: (tone: string | null) => void;
  onEventChange: (eventId: string) => void;
  onWeatherChange: (weatherId: string) => void;
  onLocationChange: (loc: string) => void;
  onDateChange: (date: string) => void;
  onStyleVibeChange: (vibeId: string) => void;
  onAdaptiveCodesChange: (codes: FunctionalNeedCode[]) => void;
  onOpenTailoringSheet: (needCode: string) => void;
  onViewGarmentDetails: (garment: Garment) => void;

  // Evaluation results
  cultureResult: CultureCheckResult;
  styleResult: StyleScoreResult;
  harmonyResult: HarmonyResult;
  harmonySwatches: Array<{ label: string; hex: string }>;

  // Recommendations
  recommendations: DeterministicRecommendation[];
  recommendationState: 'IDLE' | 'LOADING' | 'READY' | 'EMPTY' | 'UNSUPPORTED' | 'ERROR';
  recommendationError: string | null;
  recommendationUsedFallback: boolean;
  onRequestRecommendations: () => void;
  onUseRecommendation: (rec: DeterministicRecommendation) => void;

  // AI & Vision
  photoPreviewUrl: string | null;
  photoAnalysis: any;
  isAnalyzingPhoto: boolean;
  photoError: string | null;
  photoConsent: boolean;
  onPickPhoto: (file: File) => void;
  onAnalyzePhoto: () => void;
  onClearPhoto: () => void;
  onConsentChange: (value: boolean) => void;
  onApplyPhotoMatch: (garmentId: string, colorHex: string) => void;
  isAiParsing: boolean;
  onNaturalLanguageSubmit: (prompt: string) => void;

  // Gemini explanation & render
  aiExplanation: GeminiExplainResponse | null;
  aiCaption: { key: string; caption: GeminiCaptionResponse } | null;
  isLoadingExplain: boolean;
  isLoadingCaption: boolean;
  onRefreshExplain: () => void;
  onRequestCaption: () => void;
  visualTab: 'MOCKUP' | 'AI';
  onSetVisualTab: (tab: 'MOCKUP' | 'AI') => void;
  renderState: RenderState;
  canUseReference: boolean;
  useReferenceForRender: boolean;
  onToggleReferenceRender: (val: boolean) => void;
  onGenerateRender: () => void;

  // Actions
  onSaveOutfit: () => void;
  onShareOutfit: () => void;
  onOpenCompare: () => void;
  onOpenStudio?: () => void;
}

export const StylingWorkspace: React.FC<StylingWorkspaceProps> = ({
  journeyStep,
  onSetJourneyStep,
  selectedGarment,
  primaryColorHex,
  pantColorHex,
  selectedAccessoryIds,
  activeAccessories,
  selectedCharacter,
  skinTone,
  selectedEventId,
  currentEventName,
  selectedWeatherId,
  selectedLocation,
  selectedEventDate,
  selectedStyleVibe,
  selectedAdaptiveNeedCodes,
  remixRatio,
  onSetRemixRatio,
  onSelectGarment,
  onColorChange,
  onPantColorChange,
  onToggleAccessory,
  onSelectCharacter,
  onSkinToneChange,
  onEventChange,
  onWeatherChange,
  onLocationChange,
  onDateChange,
  onStyleVibeChange,
  onAdaptiveCodesChange,
  onOpenTailoringSheet,
  onViewGarmentDetails,
  cultureResult,
  styleResult,
  harmonyResult,
  harmonySwatches,
  recommendations,
  recommendationState,
  recommendationError,
  recommendationUsedFallback,
  onRequestRecommendations,
  onUseRecommendation,
  photoPreviewUrl,
  photoAnalysis,
  isAnalyzingPhoto,
  photoError,
  photoConsent,
  onPickPhoto,
  onAnalyzePhoto,
  onClearPhoto,
  onConsentChange,
  onApplyPhotoMatch,
  isAiParsing,
  onNaturalLanguageSubmit,
  aiExplanation,
  aiCaption,
  isLoadingExplain,
  isLoadingCaption,
  onRefreshExplain,
  onRequestCaption,
  visualTab,
  onSetVisualTab,
  renderState,
  canUseReference,
  useReferenceForRender,
  onToggleReferenceRender,
  onGenerateRender,
  onSaveOutfit,
  onShareOutfit,
  onOpenCompare,
  onOpenStudio,
}) => {
  // 3 Visual Groups of 9 steps
  const STEP_GROUPS = [
    {
      groupName: 'CONTEXT',
      label: 'Bối cảnh',
      steps: [
        { id: 'CONTEXT' as JourneyStep, stepNum: '01', title: 'Bối cảnh' },
        { id: 'ADAPTIVE' as JourneyStep, stepNum: '02', title: 'Thích ứng' },
      ],
    },
    {
      groupName: 'PERSONAL STYLE',
      label: 'Phong cách cá nhân',
      steps: [
        { id: 'CHARACTER' as JourneyStep, stepNum: '03', title: 'Nhân vật' },
        { id: 'GARMENT' as JourneyStep, stepNum: '04', title: 'Y phục' },
        { id: 'STYLE' as JourneyStep, stepNum: '05', title: 'Phong cách' },
        { id: 'COLOR' as JourneyStep, stepNum: '06', title: 'Màu sắc' },
        { id: 'ACCESSORIES' as JourneyStep, stepNum: '07', title: 'Phụ kiện' },
      ],
    },
    {
      groupName: 'AI STYLING',
      label: 'AI đồng hành',
      steps: [
        { id: 'RECOMMENDATION' as JourneyStep, stepNum: '08', title: 'Gợi ý' },
        { id: 'RESULT' as JourneyStep, stepNum: '09', title: 'Kết quả' },
      ],
    },
  ];

  const allSteps: JourneyStep[] = [
    'CONTEXT',
    'ADAPTIVE',
    'CHARACTER',
    'GARMENT',
    'STYLE',
    'COLOR',
    'ACCESSORIES',
    'RECOMMENDATION',
    'RESULT',
  ];

  const currentStepIdx = allSteps.indexOf(journeyStep);

  const handleNext = () => {
    if (currentStepIdx < allSteps.length - 1) {
      onSetJourneyStep(allSteps[currentStepIdx + 1]);
    }
  };

  const handleBack = () => {
    if (currentStepIdx > 0) {
      onSetJourneyStep(allSteps[currentStepIdx - 1]);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Header & Sticky Progress */}
      <div className="rounded-[30px] border border-[#E6DCCD] bg-[#FFFFFF] p-6 lg:p-8 shadow-[0_4px_24px_-4px_rgba(31,27,24,0.04)] space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E6DCCD] pb-4">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-[#736960] font-semibold">
              Quy Trình Phối Khoa Học
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1F1B18] tracking-tight">
              Phối Việt phục theo 9 bước
            </h2>
          </div>

          {/* Selected Summary Chips */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="px-3 py-1 bg-[#F1EADF] text-[#1F1B18] rounded-xl border border-[#E6DCCD] font-medium">
              📍 {currentEventName}
            </span>
            <span className="px-3 py-1 bg-[#F1EADF] text-[#1F1B18] rounded-xl border border-[#E6DCCD] font-medium">
              👘 {selectedGarment.name}
            </span>
            <span className="px-3 py-1 bg-[#F1EADF] text-[#1F1B18] rounded-xl border border-[#E6DCCD] font-medium flex items-center gap-1.5">
              <span className="size-3 rounded-full border border-[#D8CCBA]" style={{ backgroundColor: primaryColorHex }} />
              <span>Tà áo</span>
            </span>
            <span className="px-3 py-1 bg-[#F1EADF] text-[#1F1B18] rounded-xl border border-[#E6DCCD] font-medium">
              ✨ {styleLabel(selectedStyleVibe)}
            </span>
            {selectedAdaptiveNeedCodes.length > 0 && (
              <span className="px-3 py-1 bg-[#E5EDE2] text-[#4F7350] rounded-xl border border-[#CDE0C9] font-medium">
                ♿ {selectedAdaptiveNeedCodes.length} thích ứng
              </span>
            )}
          </div>
        </div>

        {/* 9-Step Visual Stepper Grouped in 3 Blocks */}
        <div className="overflow-x-auto pb-1">
          <div className="flex items-center gap-4 min-w-[760px]">
            {STEP_GROUPS.map((group, gIdx) => (
              <div key={group.groupName} className="flex items-center gap-2">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase font-bold text-[#736960] tracking-wider px-1">
                    {group.groupName}
                  </span>
                  <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#FBF8F3] border border-[#E6DCCD]">
                    {group.steps.map((st) => {
                      const isCurrent = journeyStep === st.id;
                      const isPassed = allSteps.indexOf(st.id) < currentStepIdx;

                      return (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => onSetJourneyStep(st.id)}
                          className={`press min-h-[44px] flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                            isCurrent
                              ? 'bg-[#1F1B18] text-[#FFFFFF] shadow-sm'
                              : isPassed
                                ? 'bg-[#FFFFFF] text-[#1F1B18] border border-[#E6DCCD]'
                                : 'text-[#736960] hover:text-[#1F1B18]'
                          }`}
                        >
                          <span className={`font-mono text-[11px] ${isCurrent ? 'text-amber-300' : 'text-[#736960]'}`}>
                            {isPassed ? '✓' : st.stepNum}
                          </span>
                          <span>{st.title}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {gIdx < STEP_GROUPS.length - 1 && (
                  <span className="text-[#D8CCBA] font-mono text-sm self-end mb-4">→</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2-Column Desktop Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Sticky Vector Mockup Preview */}
        <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-24">
          <div className="rounded-[30px] border border-[#E6DCCD] bg-[#FFFFFF] p-5 shadow-[0_4px_24px_-4px_rgba(31,27,24,0.04)]">
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-[#E6DCCD] text-xs">
              <span className="font-semibold text-[#1F1B18] flex items-center gap-2">
                <span className="size-2 rounded-full bg-[#4F7350] animate-pulse" />
                Người mẫu ảo trực tiếp
              </span>
              <span className="text-[#736960]">
                {selectedGarment.name}
              </span>
            </div>

            <div className="aspect-[4/5] w-full max-w-[340px] mx-auto rounded-2xl overflow-hidden bg-[#FBF8F3] border border-[#E6DCCD] shadow-inner">
              <OutfitMockupCanvas
                garment={selectedGarment}
                primaryColor={primaryColorHex}
                pantColor={pantColorHex}
                accessories={activeAccessories}
                character={selectedCharacter}
                adaptiveNeedCodes={selectedAdaptiveNeedCodes}
                styleId={selectedStyleVibe}
                eventId={selectedEventId}
                weatherId={selectedWeatherId}
                skinTone={skinTone}
                remixLevel={remixRatio}
                onColorChange={onColorChange}
                showHotspots={journeyStep === 'RESULT'}
              />
            </div>

            {/* Cultural authenticity & harmony badges */}
            <div className="mt-4 pt-4 border-t border-[#E6DCCD] grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-2xl bg-[#FBF8F3] border border-[#E6DCCD]">
                <span className="text-[10px] text-[#736960] block font-mono">ĐIỂN LỄ</span>
                <span className="font-bold text-[#1F1B18] text-sm">{cultureResult.score}/100</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-[#FBF8F3] border border-[#E6DCCD]">
                <span className="text-[10px] text-[#736960] block font-mono">GU PHỐI</span>
                <span className="font-bold text-[#1F1B18] text-sm">{styleResult.score}/100</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-[#FBF8F3] border border-[#E6DCCD]">
                <span className="text-[10px] text-[#736960] block font-mono">MÀU SẮC</span>
                <span className="font-bold text-[#1F1B18] text-sm">{harmonyResult.score}/100</span>
              </div>
            </div>
          </div>

          {/* Traditional ↔ Remix Slider */}
          <TraditionalRemixToggle
            value={remixRatio}
            onChange={(val) => {
              onSetRemixRatio(val);
              if (val >= 60 && selectedStyleVibe !== 'REMIX_GEN_Z') {
                onStyleVibeChange('REMIX_GEN_Z');
              } else if (val < 40 && selectedStyleVibe === 'REMIX_GEN_Z') {
                onStyleVibeChange('TOI_GIAN');
              }
            }}
          />

          {/* Quick Shortcuts */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRequestRecommendations}
              className="press flex-1 min-h-[44px] rounded-2xl bg-[#FFFFFF] border border-[#E6DCCD] text-[#1F1B18] text-xs font-semibold hover:bg-[#F1EADF] transition flex items-center justify-center gap-1.5"
            >
              <span>💡 Gợi ý AI</span>
            </button>
            <button
              type="button"
              onClick={() => onSetJourneyStep('RESULT')}
              className="press flex-1 min-h-[44px] rounded-2xl bg-[#1F1B18] text-[#FFFFFF] text-xs font-bold hover:bg-[#38322D] transition flex items-center justify-center gap-1.5 shadow-xs"
            >
              <span>🏆 Xem kết quả</span>
            </button>
          </div>
        </div>

        {/* Right Column: Active Focused Step Content */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-[30px] border border-[#E6DCCD] bg-[#FFFFFF] p-6 lg:p-8 shadow-[0_4px_24px_-4px_rgba(31,27,24,0.04)] space-y-6">
            {/* Step Heading */}
            <div className="border-b border-[#E6DCCD] pb-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-[#736960]">
                  Bước {currentStepIdx + 1} / {allSteps.length}
                </span>
                <h3 className="font-serif text-2xl font-bold text-[#1F1B18]">
                  {currentStepIdx === 0 && '01. Chọn Bối Cảnh Sự Kiện'}
                  {currentStepIdx === 1 && '02. Nhu Cầu Thích Ứng (Tùy chọn)'}
                  {currentStepIdx === 2 && '03. Chọn Người Mẫu & Tông Da'}
                  {currentStepIdx === 3 && '04. Lựa Chọn Y Phục Truyền Thống'}
                  {currentStepIdx === 4 && '05. Định Hình Phong Cách (Vibe)'}
                  {currentStepIdx === 5 && '06. Phối Màu Tà Áo & Quần'}
                  {currentStepIdx === 6 && '07. Chọn Phụ Kiện Tương Thích'}
                  {currentStepIdx === 7 && '08. Gợi Ý Bản Phối Tối Ưu'}
                  {currentStepIdx === 8 && '09. Kết Quả & Thẩm Định Điển Lễ'}
                </h3>
              </div>

              {currentStepIdx === 1 && (
                <button
                  type="button"
                  onClick={() => {
                    onAdaptiveCodesChange([]);
                    handleNext();
                  }}
                  className="press text-xs text-[#736960] hover:text-[#1F1B18] underline font-medium"
                >
                  Bỏ qua bước này →
                </button>
              )}
            </div>

            {/* STEP 1: CONTEXT */}
            {journeyStep === 'CONTEXT' && (
              <div className="space-y-5">
                <ContextSelector
                  selectedEventId={selectedEventId}
                  selectedWeatherId={selectedWeatherId}
                  selectedLocation={selectedLocation}
                  selectedDate={selectedEventDate}
                  onEventChange={onEventChange}
                  onWeatherChange={onWeatherChange}
                  onLocationChange={onLocationChange}
                  onDateChange={onDateChange}
                  onNaturalLanguageSubmit={onNaturalLanguageSubmit}
                  isAiParsing={isAiParsing}
                />
                <PhotoInspirationCard
                  previewUrl={photoPreviewUrl}
                  analysis={photoAnalysis}
                  isAnalyzing={isAnalyzingPhoto}
                  error={photoError}
                  consentForRender={photoConsent}
                  onPickPhoto={onPickPhoto}
                  onAnalyze={onAnalyzePhoto}
                  onClear={onClearPhoto}
                  onConsentChange={onConsentChange}
                  onApplyMatch={onApplyPhotoMatch}
                  onApplyContext={(styleId, eventId) => {
                    if (styleId) onStyleVibeChange(styleId);
                    if (eventId) onEventChange(eventId);
                  }}
                />
              </div>
            )}

            {/* STEP 2: ADAPTIVE */}
            {journeyStep === 'ADAPTIVE' && (
              <div className="space-y-5">
                <AdaptiveSelector
                  selectedNeedCodes={selectedAdaptiveNeedCodes}
                  onChange={(codes) => onAdaptiveCodesChange(codes as FunctionalNeedCode[])}
                  onOpenTailoringSheet={onOpenTailoringSheet}
                />
              </div>
            )}

            {/* STEP 3: CHARACTER */}
            {journeyStep === 'CHARACTER' && (
              <div className="space-y-5">
                <CharacterSelector
                  selectedCharacterId={selectedCharacter.id}
                  onSelect={onSelectCharacter}
                  skinTone={skinTone}
                  onSkinToneChange={onSkinToneChange}
                />
              </div>
            )}

            {/* STEP 4: GARMENT */}
            {journeyStep === 'GARMENT' && (
              <div className="space-y-5">
                <GarmentDiscovery
                  selectedGarmentId={selectedGarment.id}
                  onSelectGarment={onSelectGarment}
                  onViewDetails={onViewGarmentDetails}
                  approvedOnly
                />
              </div>
            )}

            {/* STEP 5: STYLE */}
            {journeyStep === 'STYLE' && (
              <div className="space-y-5">
                <div role="radiogroup" aria-label="Chọn phong cách" className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {STYLE_CHOICES.map((style) => {
                    const isSelected = selectedStyleVibe === style.id;
                    return (
                      <button
                        key={style.id}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => onStyleVibeChange(style.id)}
                        className={`press min-h-[96px] rounded-[24px] border p-5 text-left transition ${
                          isSelected
                            ? 'border-[#1F1B18] bg-[#F1EADF] shadow-xs'
                            : 'border-[#E6DCCD] bg-[#FFFFFF] hover:border-[#D8CCBA]'
                        }`}
                      >
                        <span className="block font-serif text-lg font-bold text-[#1F1B18]">{style.label}</span>
                        <span className="mt-1 block text-xs leading-relaxed text-[#736960]">{style.description}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 6: COLOR */}
            {journeyStep === 'COLOR' && (
              <div className="space-y-5">
                <StyleCustomizer
                  garment={selectedGarment}
                  selectedColorHex={primaryColorHex}
                  selectedPantColorHex={pantColorHex}
                  selectedAccessoryIds={selectedAccessoryIds}
                  eventId={selectedEventId}
                  showAccessories={false}
                  onColorChange={onColorChange}
                  onPantColorChange={onPantColorChange}
                  onToggleAccessory={onToggleAccessory}
                />
                <ColorHarmonyCard result={harmonyResult} swatches={harmonySwatches} />
              </div>
            )}

            {/* STEP 7: ACCESSORIES */}
            {journeyStep === 'ACCESSORIES' && (
              <div className="space-y-5">
                {cultureResult.status === 'WARNING' && (
                  <div role="alert" className="rounded-2xl border border-[#F0CDCB] bg-[#F9EBEA] p-4 text-xs text-[#8B1E2B] leading-relaxed">
                    Cách phối này đang làm sai lệch một đặc trưng văn hóa. Xem lý do ở thẻ Chuẩn văn hóa; phần Gợi ý sẽ tự loại các phối bị cảnh báo.
                  </div>
                )}
                <StyleCustomizer
                  garment={selectedGarment}
                  selectedColorHex={primaryColorHex}
                  selectedPantColorHex={pantColorHex}
                  selectedAccessoryIds={selectedAccessoryIds}
                  eventId={selectedEventId}
                  showColors={false}
                  showPantColors={false}
                  onColorChange={onColorChange}
                  onPantColorChange={onPantColorChange}
                  onToggleAccessory={onToggleAccessory}
                />
                <CultureCheckCard result={cultureResult} />
              </div>
            )}

            {/* STEP 8: RECOMMENDATION */}
            {journeyStep === 'RECOMMENDATION' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between border-b border-[#E6DCCD] pb-3">
                  <p className="text-xs text-[#736960]">
                    Các bản phối được sắp xếp bởi Gemini và đối chiếu qua bộ quy tắc văn hóa.
                  </p>
                  {recommendationState !== 'LOADING' && (
                    <button
                      type="button"
                      onClick={onRequestRecommendations}
                      className="press px-3.5 py-1.5 rounded-xl border border-[#E6DCCD] bg-[#FFFFFF] text-[#1F1B18] text-xs font-semibold hover:bg-[#F1EADF]"
                    >
                      Tạo lại gợi ý
                    </button>
                  )}
                </div>

                {recommendationState === 'IDLE' && (
                  <div className="rounded-[28px] border border-[#E6DCCD] bg-[#FBF8F3] p-8 text-center space-y-4">
                    <p className="text-sm text-[#736960]">Bối cảnh và thông số đã sẵn sàng.</p>
                    <button type="button" onClick={onRequestRecommendations} className="btn-primary text-xs">
                      Khám phá gợi ý AI →
                    </button>
                  </div>
                )}

                {recommendationState === 'LOADING' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[0, 1].map((idx) => (
                      <div key={idx} className="rounded-[24px] border border-[#E6DCCD] bg-[#FBF8F3] p-4 space-y-3">
                        <div className="aspect-[4/5] rounded-2xl bg-[#E6DCCD]/40 animate-pulse" />
                        <div className="h-4 w-3/4 rounded bg-[#E6DCCD]/60 animate-pulse" />
                      </div>
                    ))}
                  </div>
                )}

                {recommendationState === 'READY' && (
                  <RecommendationGallery
                    candidates={recommendations}
                    character={selectedCharacter}
                    pantColor={pantColorHex}
                    adaptiveNeedCodes={selectedAdaptiveNeedCodes}
                    rankedByGemini={!recommendationUsedFallback}
                    onSelect={(rec) => {
                      onUseRecommendation(rec);
                      onSetJourneyStep('RESULT');
                    }}
                  />
                )}
              </div>
            )}

            {/* STEP 9: RESULT */}
            {journeyStep === 'RESULT' && (
              <div className="space-y-6">
                {/* Visual Tab Switcher: Mockup vs AI Imagen */}
                <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#FBF8F3] border border-[#E6DCCD] max-w-xs">
                  <button
                    type="button"
                    onClick={() => onSetVisualTab('MOCKUP')}
                    className={`press flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold transition ${
                      visualTab === 'MOCKUP'
                        ? 'bg-[#1F1B18] text-[#FFFFFF]'
                        : 'text-[#736960] hover:text-[#1F1B18]'
                    }`}
                  >
                    Bản Vẽ Vector
                  </button>
                  <button
                    type="button"
                    onClick={() => onSetVisualTab('AI')}
                    className={`press flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold transition ${
                      visualTab === 'AI'
                        ? 'bg-[#1F1B18] text-[#FFFFFF]'
                        : 'text-[#736960] hover:text-[#1F1B18]'
                    }`}
                  >
                    Vẽ Ảnh AI (Gemini)
                  </button>
                </div>

                {visualTab === 'AI' && (
                  <AiRenderPanel
                    state={renderState}
                    garmentName={selectedGarment.name}
                    canUseReference={canUseReference}
                    useReference={useReferenceForRender}
                    imageRenderAvailable={true}
                    onToggleReference={onToggleReferenceRender}
                    onGenerate={onGenerateRender}
                  />
                )}

                {/* Score & Cultural Seal */}
                <div className="flex items-center gap-4 rounded-[28px] border border-[#E6DCCD] bg-[#FFFFFF] p-5 shadow-xs">
                  <SealStamp score={cultureResult.score} status={cultureResult.status} size="lg" animate />
                  <dl className="grid flex-1 grid-cols-2 gap-3">
                    <div>
                      <dt className="text-xs text-[#736960]">Chất theo gu</dt>
                      <dd className="font-serif text-2xl font-bold text-[#1F1B18] tabular">{styleResult.score}/100</dd>
                      <dd className="text-xs text-[#736960]">{styleResult.label}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-[#736960]">Hài hòa màu</dt>
                      <dd className="font-serif text-2xl font-bold text-[#4F7350] tabular">{harmonyResult.score}/100</dd>
                      <dd className="text-xs text-[#736960]">{harmonyResult.label}</dd>
                    </div>
                  </dl>
                </div>

                <AIRecommendationPanel
                  explanation={aiExplanation}
                  caption={aiCaption?.caption ?? null}
                  isLoadingExplain={isLoadingExplain}
                  isLoadingCaption={isLoadingCaption}
                  onRefreshExplain={onRefreshExplain}
                  onRequestCaption={onRequestCaption}
                />

                <CultureCheckCard result={cultureResult} />

                {/* Action Buttons: Tự tay phối | Chỉnh may đo | Lưu Lookbook | So sánh | Chia sẻ */}
                <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[#E6DCCD]">
                  {onOpenStudio && (
                    <button
                      type="button"
                      onClick={onOpenStudio}
                      className="press min-h-[44px] px-4 rounded-2xl bg-[#F1EADF] text-[#1F1B18] text-xs font-bold hover:bg-[#E6DCCD] transition flex items-center gap-1.5 border border-[#E6DCCD]"
                    >
                      <span>🎮 Tự tay phối</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedAdaptiveNeedCodes.length > 0) {
                        onOpenTailoringSheet(selectedAdaptiveNeedCodes[0]);
                      } else {
                        onOpenTailoringSheet('WHEELCHAIR_SEATED');
                      }
                    }}
                    className="press min-h-[44px] px-4 rounded-2xl bg-[#FFFFFF] text-[#1F1B18] text-xs font-bold hover:bg-[#F1EADF] transition flex items-center gap-1.5 border border-[#E6DCCD]"
                  >
                    <span>✂️ Chỉnh may đo</span>
                  </button>
                  <button
                    type="button"
                    onClick={onSaveOutfit}
                    className="press min-h-[44px] px-5 rounded-2xl bg-[#1F1B18] text-[#FFFFFF] text-xs font-bold hover:bg-[#38322D] transition flex items-center gap-1.5 shadow-xs"
                  >
                    <span>⭐ Lưu Lookbook</span>
                  </button>
                  <button
                    type="button"
                    onClick={onOpenCompare}
                    className="press min-h-[44px] px-4 rounded-2xl bg-[#FFFFFF] text-[#1F1B18] text-xs font-bold hover:bg-[#F1EADF] transition flex items-center gap-1.5 border border-[#E6DCCD]"
                  >
                    <span>⚖️ So sánh</span>
                  </button>
                  <button
                    type="button"
                    onClick={onShareOutfit}
                    className="press min-h-[44px] px-4 rounded-2xl bg-[#FFFFFF] text-[#1F1B18] text-xs font-bold hover:bg-[#F1EADF] transition flex items-center gap-1.5 border border-[#E6DCCD]"
                  >
                    <span>🔗 Chia sẻ</span>
                  </button>
                </div>
              </div>
            )}

            {/* Workspace Step Navigation Controls */}
            {journeyStep !== 'RESULT' && (
              <div className="flex items-center justify-between pt-4 border-t border-[#E6DCCD]">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={currentStepIdx === 0}
                  className="press min-h-[44px] px-4 rounded-xl border border-[#E6DCCD] bg-[#FFFFFF] text-xs font-semibold text-[#1F1B18] hover:bg-[#F1EADF] disabled:opacity-30 disabled:cursor-not-allowed transition"
                >
                  ← Bước trước
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleNext}
                    className="btn-primary text-xs min-h-[44px] px-6"
                  >
                    Tiếp theo: {allSteps[currentStepIdx + 1] ? allSteps[currentStepIdx + 1] : 'Kết quả'} →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
