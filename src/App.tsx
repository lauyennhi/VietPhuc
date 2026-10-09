/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Vstyle app shell: hash routing between Home, Studio (AI tạo / Tự tạo), Adaptive Fashion,
 * Phòng 3D, Kiến thức and Lookbook. Each page owns its own state; the shell only carries
 * hand-offs between pages (a prompt, a look to edit, a look to post).
 */

import React, { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navbar, type Page } from './components/Navbar';
import { HomeHero } from './components/HomeHero';
import { StudioPage, type StudioTab } from './components/studio/StudioPage';
import { AdaptiveStudio } from './components/AdaptiveStudio';
import { KnowledgePage } from './components/knowledge/KnowledgePage';
import { LookbookPage, type LookbookTab } from './components/lookbook/LookbookPage';
import type { LookSnapshot } from './components/CompareView';
import type { FunctionalNeedCode, Garment, Outfit } from './types/domain';
import type { GeminiCaptionResponse } from './types/gemini';
import { getAdaptiveNeeds, getApprovedAccessories, getApprovedGarments, getCharacters, getEventById, getGarmentById } from './lib/dal';
import { getOutfitCaptions, getServerHealth, type ServerHealth } from './lib/gemini/client';
import { getSavedOutfits } from './lib/storage/lookbook';
import { isAccessoryAllowedFor } from './lib/design/designEngine';
import { outfitToLook, type Look } from './lib/look';
import { STYLE_CHOICES } from './lib/styles';

const GarmentDetailModal = lazy(() => import('./components/GarmentDetailModal').then((m) => ({ default: m.GarmentDetailModal })));
const CompareView = lazy(() => import('./components/CompareView').then((m) => ({ default: m.CompareView })));
const ShareModal = lazy(() => import('./components/ShareModal').then((m) => ({ default: m.ShareModal })));
const VirtualShowroom = lazy(() => import('./components/VirtualShowroom').then((m) => ({ default: m.VirtualShowroom })));

const garments = getApprovedGarments();
const accessories = getApprovedAccessories();
const characters = getCharacters();

/* ------------------------------------------------------------------ */
/* Hash routing                                                        */
/* ------------------------------------------------------------------ */

interface Route {
  page: Page;
  sub?: string;
}

const SLUG: Record<Page, string> = {
  home: '',
  studio: 'studio',
  adaptive: 'adaptive',
  virtual: '3d',
  knowledge: 'kien-thuc',
  lookbook: 'lookbook',
};

function parseHash(hash: string): Route {
  const [slug = '', sub] = hash.replace(/^#\/?/, '').split('/');
  const page = (Object.keys(SLUG) as Page[]).find((p) => SLUG[p] === slug) ?? 'home';
  return { page, sub };
}

const toHash = (route: Route) => `#/${SLUG[route.page]}${route.sub ? `/${route.sub}` : ''}`;

const DEFAULT_LOOK: Look = {
  garmentId: garments[0].id,
  primaryColor: garments[0].baseColors[0].hex,
  pantColor: '#F4F0E8',
  accessoryIds: ['acc-khan-dong'],
  eventId: 'EVENT_YEARBOOK',
  weatherId: 'WEATHER_PLEASANT',
  styleId: 'TOI_GIAN',
  characterId: characters[0].id,
  needCodes: [],
  origin: 'STUDIO',
};

export default function App() {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));
  const [health, setHealth] = useState<ServerHealth | null>(null);
  const [lookbookCount, setLookbookCount] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);

  // Hand-offs between pages.
  const [studioPrompt, setStudioPrompt] = useState<{ text: string; nonce: number; photo?: File } | undefined>();
  const [editLook, setEditLook] = useState<{ look: Look; nonce: number } | undefined>();
  const [adaptiveEntry, setAdaptiveEntry] = useState<{ needs?: FunctionalNeedCode[]; garmentId?: string; nonce: number }>({ nonce: 0 });
  const [composeWith, setComposeWith] = useState<{ outfit: Outfit; nonce: number } | undefined>();
  const [virtualLook, setVirtualLook] = useState<Look>(DEFAULT_LOOK);

  // Modals.
  const [shareTarget, setShareTarget] = useState<Outfit | null>(null);
  const [shareCaption, setShareCaption] = useState<GeminiCaptionResponse | null>(null);
  const [captionLoading, setCaptionLoading] = useState(false);
  const [inspected, setInspected] = useState<Garment | null>(null);
  const [compareOpen, setCompareOpen] = useState(false);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 4000);
  }, []);
  const refreshLookbook = useCallback(() => setLookbookCount(getSavedOutfits().length), []);

  const navigate = useCallback((page: Page, sub?: string) => {
    const hash = toHash({ page, sub });
    if (window.location.hash !== hash) window.location.hash = hash;
    else setRoute({ page, sub });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const onHash = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    refreshLookbook();
    void getServerHealth().then(setHealth);

    // Shared link (?garment=…&color=…) opens the look in Studio › Tự tạo.
    const params = new URLSearchParams(window.location.search);
    const garment = garments.find((g) => g.id === params.get('garment'));
    if (!garment) return;
    const eventId = getEventById(params.get('event') ?? '')?.id ?? 'EVENT_YEARBOOK';
    const color = `#${params.get('color') ?? ''}`;
    const pant = params.get('pant');
    const vibe = params.get('vibe');
    const needs = (params.get('adaptive') ?? '').split(',').filter((c) => getAdaptiveNeeds().some((n) => n.code === c)) as FunctionalNeedCode[];
    setEditLook({
      nonce: Date.now(),
      look: {
        ...DEFAULT_LOOK,
        garmentId: garment.id,
        primaryColor: /^#[0-9a-f]{6}$/i.test(color) ? color : garment.baseColors[0].hex,
        pantColor: pant && /^[0-9a-f]{6}$/i.test(pant) ? `#${pant}` : DEFAULT_LOOK.pantColor,
        eventId,
        styleId: vibe && STYLE_CHOICES.some((s) => s.id === vibe) ? vibe : DEFAULT_LOOK.styleId,
        accessoryIds: (params.get('acc') ?? '').split(',').filter((id) => {
          const acc = accessories.find((a) => a.id === id);
          return acc ? isAccessoryAllowedFor(acc, garment, eventId) : false;
        }),
        needCodes: needs,
      },
    });
    window.history.replaceState(null, '', `${window.location.pathname}#/studio/tu-tao`);
    setRoute({ page: 'studio', sub: 'tu-tao' });
    showToast(`Đã mở bản phối được chia sẻ: ${garment.name}`);
  }, [refreshLookbook, showToast]);

  /* ---------------- Hand-off helpers ---------------- */
  const runAi = (text: string, photo?: File) => {
    if (!text.trim() && !photo) {
      navigate('studio', 'ai');
      return;
    }
    setStudioPrompt({ text, nonce: Date.now(), photo });
    navigate('studio', 'ai');
  };
  const openEditor = (look: Look) => {
    setEditLook({ look, nonce: Date.now() });
    navigate('studio', 'tu-tao');
  };
  const open3D = (look: Look) => {
    setVirtualLook(look);
    navigate('virtual');
  };
  const openAdaptive = (needs?: FunctionalNeedCode[], garmentId?: string) => {
    setAdaptiveEntry((e) => ({ needs, garmentId, nonce: e.nonce + 1 }));
    navigate('adaptive');
  };
  const postOutfit = (outfit: Outfit) => {
    setComposeWith({ outfit, nonce: Date.now() });
    refreshLookbook();
    navigate('lookbook', 'bang-tin');
  };
  const shareOutfit = (outfit: Outfit) => {
    setShareCaption(null);
    setShareTarget(outfit);
  };
  const requestShareCaption = async () => {
    if (!shareTarget) return;
    const garment = getGarmentById(shareTarget.garmentId);
    setCaptionLoading(true);
    try {
      setShareCaption(await getOutfitCaptions({
        garmentId: shareTarget.garmentId,
        garmentName: garment?.name ?? 'Việt phục',
        styleTitle: shareTarget.title,
        eventId: shareTarget.eventId,
        eventTitle: getEventById(shareTarget.eventId)?.name,
        chuanScore: shareTarget.chuanScore,
        chatScore: shareTarget.chatScore,
        vibe: shareTarget.styleVibe,
        primaryColor: shareTarget.primaryColor,
        accessoryIds: shareTarget.accessoryIds,
        adaptiveNeedCodes: shareTarget.adaptiveNeedCodes,
      }));
    } finally {
      setCaptionLoading(false);
    }
  };

  /* ---------------- 3D room (controlled by virtualLook) ---------------- */
  const vGarment = getGarmentById(virtualLook.garmentId) ?? garments[0];
  const vCharacter = characters.find((c) => c.id === virtualLook.characterId) ?? characters[0];
  const updateVirtual = (patch: Partial<Look>) => setVirtualLook((l) => ({ ...l, ...patch }));

  const compareLooks = useMemo<LookSnapshot[]>(() => (compareOpen ? getSavedOutfits() : []).slice(0, 8).map((o) => ({
    id: o.id,
    title: o.title,
    garmentId: o.garmentId,
    primaryColor: o.primaryColor,
    pantColor: o.pantColor,
    accessoryIds: o.accessoryIds,
    eventId: getEventById(o.eventId)?.id ?? 'EVENT_YEARBOOK',
    styleVibe: o.styleVibe,
    adaptiveNeedCodes: o.adaptiveNeedCodes,
  })), [compareOpen]);

  const studioTab: StudioTab = route.sub === 'tu-tao' ? 'MANUAL' : 'AI';
  const knowledgeTab = route.sub === 'quiz' ? 'QUIZ' : 'GARMENTS';
  const lookbookTab: LookbookTab = route.sub === 'nhap' ? 'DRAFT' : route.sub === 'bang-tin' ? 'FEED' : 'SAVED';
  const fallback = <div role="status" className="py-24 text-center text-sm text-[#7A6F66]">Đang tải…</div>;

  return (
    <div className="min-h-dvh bg-[#F6F1EB] font-sans text-[#1E3443] selection:bg-[#E8DFD3]">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-xl focus:bg-[#FFFFFF] focus:px-4 focus:py-2">Bỏ qua tới nội dung</a>
      <Navbar page={route.page} onNavigate={(p) => navigate(p)} lookbookCount={lookbookCount} onOpenSearch={() => navigate('knowledge')} />

      <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-4 bottom-6 z-[55] flex justify-center sm:inset-x-auto sm:right-10">
        {toast && <div className="pointer-events-auto max-w-md rounded-2xl border border-[#E8DFD3] bg-[#FFFFFF] px-5 py-3 text-sm font-medium text-[#1E3443] shadow-[0_10px_30px_rgba(0,0,0,0.1)] animate-rise">{toast}</div>}
      </div>

      <main id="main">
        {route.page === 'home' ? (
          <HomeHero
            onRunStylist={runAi}
            onOpenAi={() => navigate('studio', 'ai')}
            onOpenStudio={() => navigate('studio', 'tu-tao')}
            onOpenAdaptive={() => openAdaptive()}
            onOpenKnowledge={() => navigate('knowledge')}
          />
        ) : (
          <div className="mx-auto max-w-7xl px-4 pb-20 pt-8 sm:px-8 sm:pt-10">
            {route.page === 'studio' && (
              <StudioPage
                tab={studioTab}
                onTabChange={(t) => navigate('studio', t === 'AI' ? 'ai' : 'tu-tao')}
                prompt={studioPrompt}
                editLook={editLook}
                imageRenderAvailable={health ? health.features.imageRender : null}
                showToast={showToast}
                onEditLook={openEditor}
                onOpen3D={open3D}
                onSaved={refreshLookbook}
                onPost={postOutfit}
                onShare={shareOutfit}
              />
            )}

            {route.page === 'adaptive' && (
              <AdaptiveStudio
                key={adaptiveEntry.nonce}
                initialNeedCodes={adaptiveEntry.needs}
                initialGarmentId={adaptiveEntry.garmentId}
                showToast={showToast}
                onOpen3D={open3D}
                onSaved={refreshLookbook}
                onPost={postOutfit}
                onShare={shareOutfit}
              />
            )}

            {route.page === 'virtual' && (
              <Suspense fallback={fallback}>
                <VirtualShowroom
                  garments={garments}
                  garment={vGarment}
                  primaryColor={virtualLook.primaryColor}
                  pantColor={virtualLook.pantColor}
                  skinTone={virtualLook.skinTone ?? vCharacter.skinTone}
                  feminine={vCharacter.gender === 'FEMALE'}
                  seated={vCharacter.heightCategory === 'SEATED' || virtualLook.needCodes.includes('WHEELCHAIR_SEATED')}
                  accessories={accessories}
                  selectedAccessoryIds={virtualLook.accessoryIds}
                  isAccessoryAllowed={(id) => {
                    const acc = accessories.find((a) => a.id === id);
                    return acc ? isAccessoryAllowedFor(acc, vGarment, virtualLook.eventId) : false;
                  }}
                  onSelectGarment={(g) => updateVirtual({
                    garmentId: g.id,
                    primaryColor: g.baseColors[0].hex,
                    accessoryIds: virtualLook.accessoryIds.filter((id) => {
                      const acc = accessories.find((a) => a.id === id);
                      return acc ? isAccessoryAllowedFor(acc, g, virtualLook.eventId) : false;
                    }),
                  })}
                  onColorChange={(hex) => updateVirtual({ primaryColor: hex })}
                  onPantColorChange={(hex) => updateVirtual({ pantColor: hex })}
                  onToggleAccessory={(id) => updateVirtual({
                    accessoryIds: virtualLook.accessoryIds.includes(id) ? virtualLook.accessoryIds.filter((x) => x !== id) : [...virtualLook.accessoryIds, id],
                  })}
                  onSeatedChange={(seated) => updateVirtual({
                    needCodes: seated ? [...new Set([...virtualLook.needCodes, 'WHEELCHAIR_SEATED' as FunctionalNeedCode])] : virtualLook.needCodes.filter((c) => c !== 'WHEELCHAIR_SEATED'),
                    characterId: !seated && vCharacter.heightCategory === 'SEATED' ? characters[0].id : virtualLook.characterId,
                  })}
                  showToast={showToast}
                />
              </Suspense>
            )}

            {route.page === 'knowledge' && (
              <KnowledgePage
                tab={knowledgeTab}
                onTabChange={(t) => navigate('knowledge', t === 'QUIZ' ? 'quiz' : undefined)}
                onStyleGarment={(g) => openEditor({ ...DEFAULT_LOOK, garmentId: g.id, primaryColor: g.baseColors[0].hex, accessoryIds: [] })}
                onViewDetails={setInspected}
              />
            )}

            {route.page === 'lookbook' && (
              <LookbookPage
                tab={lookbookTab}
                onTabChange={(t) => navigate('lookbook', t === 'DRAFT' ? 'nhap' : t === 'FEED' ? 'bang-tin' : undefined)}
                composeWith={composeWith}
                onOpenOutfit={(o) => openEditor(outfitToLook(o))}
                onShareOutfit={shareOutfit}
                onCompare={() => setCompareOpen(true)}
                onChanged={refreshLookbook}
                showToast={showToast}
              />
            )}
          </div>
        )}
      </main>

      <footer className="border-t border-[#E8DFD3] bg-[#FBF7F3]">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-sm text-[#7A6F66] sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>Thông tin văn hóa tổng hợp từ nguồn tham khảo; hình vẽ và ảnh AI mang tính minh họa.</p>
          <nav className="flex flex-wrap gap-4" aria-label="Liên kết chân trang">
            <button type="button" onClick={() => navigate('knowledge')} className="hover:text-[#1E3443]">Kiến thức</button>
            <button type="button" onClick={() => openAdaptive()} className="hover:text-[#1E3443]">Adaptive Fashion</button>
            <button type="button" onClick={() => navigate('knowledge', 'quiz')} className="hover:text-[#1E3443]">Quiz</button>
          </nav>
        </div>
      </footer>

      <Suspense fallback={null}>
        {inspected && (
          <GarmentDetailModal
            garment={inspected}
            onClose={() => setInspected(null)}
            onSelectForStyling={(g) => {
              setInspected(null);
              openEditor({ ...DEFAULT_LOOK, garmentId: g.id, primaryColor: g.baseColors[0].hex, accessoryIds: [] });
            }}
          />
        )}
        {compareOpen && (
          <CompareView
            looks={compareLooks}
            character={characters[0]}
            onClose={() => setCompareOpen(false)}
            onUseLook={(look) => {
              setCompareOpen(false);
              openEditor({ ...DEFAULT_LOOK, garmentId: look.garmentId, primaryColor: look.primaryColor, pantColor: look.pantColor, accessoryIds: look.accessoryIds, eventId: look.eventId, styleId: look.styleVibe, needCodes: look.adaptiveNeedCodes ?? [] });
            }}
          />
        )}
        {shareTarget && (
          <ShareModal
            outfit={shareTarget}
            caption={shareCaption}
            isLoadingCaption={captionLoading}
            onRequestCaption={() => void requestShareCaption()}
            onClose={() => setShareTarget(null)}
          />
        )}
      </Suspense>
    </div>
  );
}
