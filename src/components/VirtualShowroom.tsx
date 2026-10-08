/**
 * Phòng 3D & Tham quan ảo: a three.js showroom that renders the current outfit as a 3D model,
 * places it in virtual heritage scenes with info hotspots, supports WebXR (VR headsets and
 * phone AR), and exports the model as .glb (3D object) or .usdz (iPhone AR Quick Look).
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { USDZExporter } from 'three/examples/jsm/exporters/USDZExporter.js';
import type { Accessory, Garment } from '../types/domain';
import { buildFigure, disposeObject } from '../lib/three/figure';
import { TOUR_STOPS, type TourHotspot } from '../lib/three/tours';

export interface VirtualShowroomProps {
  garments: Garment[];
  garment: Garment;
  primaryColor: string;
  pantColor: string;
  skinTone: string;
  feminine: boolean;
  seated: boolean;
  accessories: Accessory[];
  selectedAccessoryIds: string[];
  isAccessoryAllowed: (accessoryId: string) => boolean;
  onSelectGarment: (garment: Garment) => void;
  onColorChange: (hex: string) => void;
  onPantColorChange: (hex: string) => void;
  onToggleAccessory: (accessoryId: string) => void;
  onSeatedChange: (seated: boolean) => void;
  showToast: (message: string) => void;
}

type XRMode = 'none' | 'vr' | 'ar';

const PANT_COLORS = ['#F4F0E8', '#1C1C1E', '#2B5C8F', '#8B1E2B', '#3D5A45', '#D4A338'];
const TOUR_INTERVAL_MS = 14000;

interface Runtime {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  world: THREE.Group;
  environment: THREE.Group;
  figureSlot: THREE.Group;
  hotspotLayer: THREE.Group;
  panel?: THREE.Mesh;
  cameraTween?: { from: THREE.Vector3; to: THREE.Vector3; fromTarget: THREE.Vector3; toTarget: THREE.Vector3; start: number; duration: number };
  autoRotate: boolean;
}

function hotspotTexture(symbol: string, color: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.arc(64, 64, 60, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(64, 64, 44, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 56px "Fraunces Variable", Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(symbol, 64, 68);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** In-world info panel used inside VR/AR, where DOM overlays are not visible. */
function makeInfoPanel(hotspot: TourHotspot): THREE.Mesh {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 560;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = 'rgba(251,248,243,0.96)';
  ctx.beginPath();
  ctx.roundRect(8, 8, 1008, 544, 36);
  ctx.fill();
  ctx.strokeStyle = '#C9A24A';
  ctx.lineWidth = 6;
  ctx.stroke();
  ctx.fillStyle = '#1F1B18';
  ctx.font = 'bold 54px "Fraunces Variable", Georgia, serif';
  ctx.fillText(hotspot.title, 56, 104);
  ctx.font = '36px "Be Vietnam Pro", Arial, sans-serif';
  ctx.fillStyle = '#4A423B';
  wrapLines(ctx, hotspot.body, 912).slice(0, 9).forEach((line, i) => ctx.fillText(line, 56, 176 + i * 46));
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.6), new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide }));
  panel.name = 'info-panel';
  return panel;
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

const slug = (name: string) =>
  name.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '');

export const VirtualShowroom: React.FC<VirtualShowroomProps> = ({
  garments,
  garment,
  primaryColor,
  pantColor,
  skinTone,
  feminine,
  seated,
  accessories,
  selectedAccessoryIds,
  isAccessoryAllowed,
  onSelectGarment,
  onColorChange,
  onPantColorChange,
  onToggleAccessory,
  onSeatedChange,
  showToast,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const runtimeRef = useRef<Runtime | null>(null);
  const [stopIndex, setStopIndex] = useState(0);
  const [activeHotspot, setActiveHotspot] = useState<TourHotspot | null>(null);
  const [autoRotate, setAutoRotate] = useState(() => !(
    document.documentElement.hasAttribute('data-reduce-motion') ||
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  ));
  const [touring, setTouring] = useState(false);
  const [brocade, setBrocade] = useState(true);
  const [xrSupport, setXrSupport] = useState<{ vr: boolean; ar: boolean }>({ vr: false, ar: false });
  const [xrMode, setXrMode] = useState<XRMode>('none');
  const [webglError, setWebglError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const stop = TOUR_STOPS[stopIndex];
  const selectStop = useCallback((index: number) => {
    setStopIndex(((index % TOUR_STOPS.length) + TOUR_STOPS.length) % TOUR_STOPS.length);
    setActiveHotspot(null);
  }, []);

  const accessoryColors = useMemo(
    () => Object.fromEntries(accessories.map((accessory) => [accessory.id, accessory.colors[0]])),
    [accessories],
  );

  const garmentHotspot = useMemo<TourHotspot>(() => ({
    id: 'garment',
    title: garment.name,
    body: [
      garment.description,
      garment.nonNegotiables.length ? `Giữ đúng: ${garment.nonNegotiables.slice(0, 2).join('; ')}.` : '',
    ].filter(Boolean).join(' '),
    position: [0.42, seated ? 1.25 : 1.6, 0.1],
  }), [garment, seated]);

  /* ---------------- Scene setup (once) ---------------- */
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    } catch {
      setWebglError('Trình duyệt hoặc thiết bị này không hỗ trợ WebGL nên không hiển thị được 3D.');
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.xr.enabled = true;
    renderer.domElement.style.touchAction = 'none';
    renderer.domElement.setAttribute('aria-label', 'Mô hình 3D bản phối Việt phục — kéo để xoay');
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, mount.clientWidth / mount.clientHeight, 0.05, 200);
    camera.position.set(0, 1.35, 3.1);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1, 0);
    controls.enableDamping = true;
    controls.minDistance = 1.2;
    controls.maxDistance = 9;
    controls.maxPolarAngle = Math.PI * 0.53;
    controls.autoRotateSpeed = 1.2;

    scene.add(new THREE.HemisphereLight('#FFF6E8', '#6B5A48', 1.1));
    const sun = new THREE.DirectionalLight('#FFF1DC', 2.4);
    sun.position.set(3.5, 6, 4);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -4;
    sun.shadow.camera.right = 4;
    sun.shadow.camera.top = 4;
    sun.shadow.camera.bottom = -2;
    sun.shadow.bias = -0.0004;
    scene.add(sun);
    const rim = new THREE.DirectionalLight('#D6E4FF', 0.7);
    rim.position.set(-3, 3, -4);
    scene.add(rim);

    const world = new THREE.Group();
    const environment = new THREE.Group();
    const figureSlot = new THREE.Group();
    const hotspotLayer = new THREE.Group();
    world.add(environment, figureSlot, hotspotLayer);
    scene.add(world);

    const runtime: Runtime = { renderer, scene, camera, controls, world, environment, figureSlot, hotspotLayer, autoRotate: false };
    runtimeRef.current = runtime;

    /* Pointer picking of hotspots (ignores drags used for orbiting). */
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let downAt: { x: number; y: number } | null = null;
    const onPointerDown = (event: PointerEvent) => { downAt = { x: event.clientX, y: event.clientY }; };
    const onPointerUp = (event: PointerEvent) => {
      if (!downAt || Math.hypot(event.clientX - downAt.x, event.clientY - downAt.y) > 6) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(hotspotLayer.children, false)[0];
      const data = hit?.object.userData.hotspot as TourHotspot | undefined;
      setActiveHotspot(data ?? null);
    };
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);

    /* XR controllers: trigger selects a hotspot, squeeze jumps to the next tour stop. */
    const tempMatrix = new THREE.Matrix4();
    const controllers = [0, 1].map((index) => {
      const controller = renderer.xr.getController(index);
      const ray = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -1)]),
        new THREE.LineBasicMaterial({ color: '#C9A24A' }),
      );
      ray.scale.z = 6;
      controller.add(ray);
      controller.addEventListener('select', () => {
        tempMatrix.identity().extractRotation(controller.matrixWorld);
        raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
        raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
        const hit = raycaster.intersectObjects(hotspotLayer.children, false)[0];
        const data = hit?.object.userData.hotspot as TourHotspot | undefined;
        setActiveHotspot(data ?? null);
      });
      controller.addEventListener('squeezestart', () => setStopIndex((i) => (i + 1) % TOUR_STOPS.length));
      scene.add(controller);
      return controller;
    });

    const clock = new THREE.Clock();
    renderer.setAnimationLoop(() => {
      const t = clock.getElapsedTime();
      const tween = runtime.cameraTween;
      if (tween && !renderer.xr.isPresenting) {
        const k = Math.min(1, (performance.now() - tween.start) / tween.duration);
        const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
        camera.position.lerpVectors(tween.from, tween.to, e);
        controls.target.lerpVectors(tween.fromTarget, tween.toTarget, e);
        if (k >= 1) runtime.cameraTween = undefined;
      }
      controls.autoRotate = runtime.autoRotate && !runtime.cameraTween;
      for (const sprite of hotspotLayer.children) {
        const s = 0.24 + Math.sin(t * 2.4 + sprite.id) * 0.02;
        sprite.scale.set(s, s, s);
      }
      if (runtime.panel && renderer.xr.isPresenting) {
        const xrCamera = renderer.xr.getCamera();
        runtime.panel.lookAt(xrCamera.getWorldPosition(new THREE.Vector3()));
      }
      controls.update();
      renderer.render(scene, camera);
    });

    const resize = () => {
      if (renderer.xr.isPresenting) return;
      const width = mount.clientWidth;
      const height = mount.clientHeight;
      camera.aspect = width / Math.max(1, height);
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(mount);

    const xr = (navigator as Navigator & { xr?: XRSystem }).xr;
    if (xr && window.isSecureContext) {
      void Promise.all([
        xr.isSessionSupported('immersive-vr').catch(() => false),
        xr.isSessionSupported('immersive-ar').catch(() => false),
      ]).then(([vr, ar]) => setXrSupport({ vr, ar }));
    }

    return () => {
      observer.disconnect();
      renderer.setAnimationLoop(null);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      void renderer.xr.getSession()?.end();
      controllers.forEach((controller) => scene.remove(controller));
      controls.dispose();
      disposeObject(scene);
      renderer.dispose();
      renderer.domElement.remove();
      runtimeRef.current = null;
    };
  }, []);

  /* ---------------- Environment / tour stop ---------------- */
  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    const { environment, scene, camera, controls } = runtime;
    for (const child of [...environment.children]) {
      environment.remove(child);
      disposeObject(child);
    }
    environment.add(stop.build());
    if (xrMode !== 'ar') {
      scene.background = new THREE.Color(stop.background);
      scene.fog = new THREE.Fog(stop.fog[0], stop.fog[1], stop.fog[2]);
    }
    runtime.cameraTween = {
      from: camera.position.clone(),
      to: new THREE.Vector3(...stop.camera.position),
      fromTarget: controls.target.clone(),
      toTarget: new THREE.Vector3(...stop.camera.target),
      start: performance.now(),
      duration: 1400,
    };
  }, [stop, xrMode]);

  /* ---------------- Hotspots ---------------- */
  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    const { hotspotLayer } = runtime;
    for (const child of [...hotspotLayer.children]) {
      hotspotLayer.remove(child);
      disposeObject(child);
    }
    const items: Array<[TourHotspot, string, string]> = [
      [garmentHotspot, '✦', '#8A5E17'],
      ...stop.hotspots.map((h) => [h, 'i', '#1F1B18'] as [TourHotspot, string, string]),
    ];
    for (const [hotspot, symbol, color] of items) {
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: hotspotTexture(symbol, color), depthTest: false, transparent: true }));
      sprite.position.set(...hotspot.position);
      sprite.renderOrder = 10;
      sprite.userData.hotspot = hotspot;
      hotspotLayer.add(sprite);
    }
  }, [stop, garmentHotspot]);

  /* In-world info panel while in XR. */
  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    if (runtime.panel) {
      runtime.world.remove(runtime.panel);
      disposeObject(runtime.panel);
      runtime.panel = undefined;
    }
    if (activeHotspot && xrMode !== 'none') {
      const panel = makeInfoPanel(activeHotspot);
      const [x, y, z] = activeHotspot.position;
      panel.position.set(x * 0.6, Math.min(y, 2.2) + 0.15, z * 0.6 + 0.6);
      runtime.world.add(panel);
      runtime.panel = panel;
    }
  }, [activeHotspot, xrMode]);

  /* ---------------- Figure ---------------- */
  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    const { figureSlot } = runtime;
    for (const child of [...figureSlot.children]) {
      figureSlot.remove(child);
      disposeObject(child);
    }
    figureSlot.add(buildFigure({
      template: garment.svgTemplate,
      primary: primaryColor,
      pant: pantColor,
      skin: skinTone,
      seated,
      feminine,
      brocade,
      accessoryIds: selectedAccessoryIds,
      accessoryColors,
    }));
  }, [garment, primaryColor, pantColor, skinTone, seated, feminine, brocade, selectedAccessoryIds, accessoryColors]);

  useEffect(() => {
    if (runtimeRef.current) runtimeRef.current.autoRotate = autoRotate;
  }, [autoRotate]);

  /* Auto tour: cycle through the stops. */
  useEffect(() => {
    if (!touring) return;
    const timer = window.setInterval(() => setStopIndex((i) => (i + 1) % TOUR_STOPS.length), TOUR_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [touring]);

  /* ---------------- XR sessions ---------------- */
  const enterXR = async (mode: 'vr' | 'ar') => {
    const runtime = runtimeRef.current;
    const xr = (navigator as Navigator & { xr?: XRSystem }).xr;
    if (!runtime || !xr) return;
    try {
      const session = await xr.requestSession(mode === 'vr' ? 'immersive-vr' : 'immersive-ar', {
        optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking'],
      });
      runtime.renderer.xr.setReferenceSpaceType('local-floor');
      await runtime.renderer.xr.setSession(session);
      setXrMode(mode);
      if (mode === 'vr') {
        runtime.world.position.set(0, 0, -2.2);
      } else {
        runtime.environment.visible = false;
        runtime.hotspotLayer.visible = true;
        runtime.scene.background = null;
        runtime.scene.fog = null;
        runtime.world.position.set(0, 0, -1.8);
      }
      session.addEventListener('end', () => {
        const current = runtimeRef.current;
        if (current) {
          current.world.position.set(0, 0, 0);
          current.environment.visible = true;
        }
        setXrMode('none');
      });
    } catch (error) {
      showToast(error instanceof Error ? `Không mở được ${mode.toUpperCase()}: ${error.message}` : 'Không mở được phiên XR.');
    }
  };

  /* ---------------- Exports ---------------- */
  const figureObject = () => runtimeRef.current?.figureSlot.children[0];

  const exportGlb = async () => {
    const figure = figureObject();
    if (!figure) return;
    setBusy('glb');
    try {
      const result = await new GLTFExporter().parseAsync(figure, { binary: true, onlyVisible: true });
      downloadBlob(new Blob([result as ArrayBuffer], { type: 'model/gltf-binary' }), `Vstyle_${slug(garment.name)}.glb`);
      showToast('Đã xuất mô hình 3D (.glb) — mở bằng Blender, Windows 3D Viewer hoặc gltf-viewer.');
    } catch (error) {
      showToast(`Chưa xuất được GLB: ${(error as Error).message}`);
    } finally {
      setBusy(null);
    }
  };

  const exportUsdz = async () => {
    const figure = figureObject();
    if (!figure) return;
    setBusy('usdz');
    try {
      const data = await new USDZExporter().parseAsync(figure);
      const blob = new Blob([data as Uint8Array<ArrayBuffer>], { type: 'model/vnd.usdz+zip' });
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      if (isIOS) {
        // AR Quick Look: an <a rel="ar"> wrapping an <img> opens the model in AR on iPhone/iPad.
        const link = document.createElement('a');
        link.rel = 'ar';
        link.href = URL.createObjectURL(blob);
        link.appendChild(document.createElement('img'));
        link.click();
      } else {
        downloadBlob(blob, `Vstyle_${slug(garment.name)}.usdz`);
        showToast('Đã xuất .usdz — mở trên iPhone/iPad để xem AR Quick Look.');
      }
    } catch (error) {
      showToast(`Chưa xuất được USDZ: ${(error as Error).message}`);
    } finally {
      setBusy(null);
    }
  };

  const snapshot = () => {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    runtime.renderer.render(runtime.scene, runtime.camera);
    runtime.renderer.domElement.toBlob((blob) => {
      if (blob) downloadBlob(blob, `Vstyle_3D_${slug(garment.name)}_${stop.id}.png`);
    }, 'image/png');
  };

  const toggleFullscreen = () => {
    const el = mountRef.current?.parentElement;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void el.requestFullscreen?.().catch(() => showToast('Trình duyệt không cho phép toàn màn hình.'));
  };

  const garmentAllowedAccessories = accessories.filter((accessory) => isAccessoryAllowed(accessory.id));
  const suggested = stop.suggestedGarmentIds.includes(garment.id);

  const chip = (active: boolean) =>
    `press whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
      active ? 'border-[#1F1B18] bg-[#1F1B18] text-[#FFFFFF]' : 'border-[#E6DCCD] bg-[#FFFFFF] text-[#5C5248] hover:bg-[#F1EADF]'
    }`;
  const toolButton =
    'press inline-flex min-h-10 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border border-[#E6DCCD] bg-[#FFFFFF]/95 px-3 text-xs font-semibold text-[#1F1B18] shadow-xs backdrop-blur hover:bg-[#F1EADF] transition disabled:opacity-40';

  return (
    <section className="space-y-6 animate-rise" aria-labelledby="virtual-title">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#8A5E17]">Virtual Tour · 3D · VR/AR</p>
          <h2 id="virtual-title" className="font-serif text-3xl font-bold text-[#1F1B18] sm:text-4xl">Phòng 3D & Tham quan ảo</h2>
          <p className="mt-1 max-w-2xl text-sm text-[#736960]">
            Xem bản phối dưới dạng mô hình 3D, dạo quanh các không gian di sản, mở bằng kính VR hoặc đặt mô hình vào phòng bạn với AR.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setTouring((v) => !v)} className={chip(touring)}>
            {touring ? '⏸ Dừng tham quan' : '▶ Tham quan tự động'}
          </button>
        </div>
      </header>

      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Điểm tham quan">
        {TOUR_STOPS.map((item, index) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={index === stopIndex}
            onClick={() => { setTouring(false); selectStop(index); }}
            className={`press shrink-0 rounded-2xl border px-4 py-2.5 text-left transition ${
              index === stopIndex ? 'border-[#1F1B18] bg-[#1F1B18] text-[#FFFFFF]' : 'border-[#E6DCCD] bg-[#FFFFFF] text-[#1F1B18] hover:bg-[#F1EADF]'
            }`}
          >
            <span className="block text-xs font-bold">{index + 1}. {item.name}</span>
            <span className={`block text-[11px] ${index === stopIndex ? 'text-[#E6DCCD]' : 'text-[#736960]'}`}>{item.subtitle}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Viewer */}
        <div className="lg:col-span-8">
          <div className="relative overflow-hidden rounded-[28px] border border-[#E6DCCD] bg-[#F3ECE1] shadow-xs">
            <div ref={mountRef} className="h-[62vh] min-h-[420px] w-full sm:h-[68vh]" />

            {webglError && (
              <div role="alert" className="absolute inset-0 flex items-center justify-center p-8 text-center text-sm text-[#8B1E2B]">{webglError}</div>
            )}

            {/* Stop caption */}
            <div className="pointer-events-none absolute left-3 top-3 max-w-[70%] rounded-2xl border border-[#E6DCCD] bg-[#FFFFFF]/90 px-3.5 py-2 shadow-xs backdrop-blur">
              <p className="font-serif text-sm font-bold text-[#1F1B18]">{stop.name}</p>
              <p className="text-[11px] text-[#736960]">Chạm vào biểu tượng ⓘ / ✦ để đọc thông tin</p>
            </div>

            {/* Prev / next */}
            <div className="absolute right-3 top-3 flex gap-1.5">
              <button type="button" aria-label="Điểm trước" onClick={() => selectStop(stopIndex - 1)} className={toolButton}>‹</button>
              <button type="button" aria-label="Điểm tiếp theo" onClick={() => selectStop(stopIndex + 1)} className={toolButton}>›</button>
            </div>

            {/* Hotspot card */}
            {activeHotspot && xrMode === 'none' && (
              <div className="absolute inset-x-3 bottom-[4.5rem] max-w-md rounded-2xl border border-[#E6DCCD] bg-[#FFFFFF]/95 p-4 shadow-lg backdrop-blur animate-rise sm:left-3 sm:right-auto">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-serif text-base font-bold text-[#1F1B18]">{activeHotspot.title}</p>
                  <button type="button" aria-label="Đóng" onClick={() => setActiveHotspot(null)} className="press -mr-1 -mt-1 rounded-lg px-2 text-lg leading-none text-[#736960] hover:bg-[#F1EADF]">×</button>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-[#5C5248]">{activeHotspot.body}</p>
              </div>
            )}

            {/* Toolbar */}
            <div className="absolute inset-x-3 bottom-3 flex flex-wrap items-center gap-1.5">
              <button type="button" onClick={() => setAutoRotate((v) => !v)} className={toolButton} aria-pressed={autoRotate}>
                {autoRotate ? '⟳ Đang xoay' : '⟳ Xoay'}
              </button>
              <button type="button" onClick={snapshot} className={toolButton}>📷 Chụp</button>
              <button type="button" onClick={toggleFullscreen} className={toolButton}>⛶ Toàn màn hình</button>
              <span className="grow" />
              <button
                type="button"
                onClick={() => void enterXR('vr')}
                disabled={!xrSupport.vr}
                title={xrSupport.vr ? 'Mở bằng kính VR (Meta Quest, Pico…)' : 'Cần kính VR hỗ trợ WebXR và kết nối HTTPS'}
                className={`${xrSupport.vr ? 'inline-flex' : 'hidden sm:inline-flex'} press min-h-10 items-center gap-1.5 rounded-xl bg-[#1F1B18] px-3.5 text-xs font-bold text-[#FFFFFF] shadow-xs transition hover:bg-[#38322D] disabled:opacity-40`}
              >
                🥽 Vào VR
              </button>
              <button
                type="button"
                onClick={() => void enterXR('ar')}
                disabled={!xrSupport.ar}
                title={xrSupport.ar ? 'Đặt mô hình vào không gian thật (Android Chrome)' : 'AR cần Android Chrome có ARCore; iPhone dùng nút USDZ'}
                className={`${xrSupport.ar ? 'inline-flex' : 'hidden sm:inline-flex'} press min-h-10 items-center gap-1.5 rounded-xl bg-[#8A5E17] px-3.5 text-xs font-bold text-[#FFFFFF] shadow-xs transition hover:bg-[#6F4B12] disabled:opacity-40`}
              >
                📱 Xem AR
              </button>
            </div>
          </div>

          <p className="mt-2 text-[11px] leading-relaxed text-[#736960]">
            Mô hình 3D và khung cảnh là minh họa cách điệu, dựng tự động từ dữ liệu y phục đã thẩm định (kết cấu, vạt hữu nhậm, màu, phụ kiện) — không phải bản dựng kiến trúc hay thử đồ thật.
            {!xrSupport.vr && !xrSupport.ar && ' VR/AR cần thiết bị hỗ trợ WebXR (kính Meta Quest, điện thoại Android có ARCore) và trang chạy qua HTTPS.'}
            {' '}Trong VR: bóp nút cầm (grip) để sang điểm tiếp theo, bấm cò (trigger) vào biểu tượng để đọc thông tin.
          </p>
        </div>

        {/* Controls */}
        <aside className="space-y-4 lg:col-span-4">
          <div className="space-y-3 rounded-[28px] border border-[#E6DCCD] bg-[#FFFFFF] p-5 shadow-xs">
            <p className="text-xs font-bold uppercase tracking-wider text-[#736960] font-mono">Y phục</p>
            <div className="flex flex-wrap gap-1.5">
              {garments.map((item) => (
                <button key={item.id} type="button" onClick={() => onSelectGarment(item)} className={chip(item.id === garment.id)}>
                  {item.name.replace(/\s*\(.*\)$/, '')}
                </button>
              ))}
            </div>
            {stop.suggestedGarmentIds.length > 0 && (
              <p className={`rounded-xl border p-2.5 text-[11px] ${suggested ? 'border-[#CDE0C9] bg-[#E5EDE2] text-[#3D6B35]' : 'border-[#E4D1B5] bg-[#F6ECDA] text-[#8A5E17]'}`}>
                {suggested ? '✓ Y phục hợp với không gian này.' : `Gợi ý cho ${stop.name}: ${stop.suggestedGarmentIds.map((id) => garments.find((g) => g.id === id)?.name).filter(Boolean).join(', ')}.`}
              </p>
            )}

            <p className="pt-1 text-xs font-bold uppercase tracking-wider text-[#736960] font-mono">Màu áo</p>
            <div className="flex flex-wrap gap-2">
              {garment.baseColors.map((color) => (
                <button
                  key={color.hex}
                  type="button"
                  title={color.name}
                  aria-label={color.name}
                  aria-pressed={color.hex === primaryColor}
                  onClick={() => onColorChange(color.hex)}
                  className={`press size-8 rounded-full border-2 transition ${color.hex === primaryColor ? 'border-[#1F1B18] ring-2 ring-[#C9A24A] ring-offset-2' : 'border-[#FFFFFF] shadow-[0_0_0_1px_#E6DCCD]'}`}
                  style={{ backgroundColor: color.hex }}
                />
              ))}
            </div>

            {garment.svgTemplate !== 'AO_TU_THAN' && (
              <>
                <p className="pt-1 text-xs font-bold uppercase tracking-wider text-[#736960] font-mono">Màu quần</p>
                <div className="flex flex-wrap gap-2">
                  {PANT_COLORS.map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      aria-label={`Quần màu ${hex}`}
                      aria-pressed={hex === pantColor}
                      onClick={() => onPantColorChange(hex)}
                      className={`press size-7 rounded-full border-2 transition ${hex === pantColor ? 'border-[#1F1B18] ring-2 ring-[#C9A24A] ring-offset-2' : 'border-[#FFFFFF] shadow-[0_0_0_1px_#E6DCCD]'}`}
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                </div>
              </>
            )}

            <div className="flex flex-wrap gap-2 pt-1">
              <button type="button" onClick={() => setBrocade((v) => !v)} className={chip(brocade)} aria-pressed={brocade}>
                ✦ Vải gấm hoa văn
              </button>
              <button type="button" onClick={() => onSeatedChange(!seated)} className={chip(seated)} aria-pressed={seated}>
                ♿ Dáng ngồi xe lăn
              </button>
            </div>
          </div>

          <div className="space-y-3 rounded-[28px] border border-[#E6DCCD] bg-[#FFFFFF] p-5 shadow-xs">
            <p className="text-xs font-bold uppercase tracking-wider text-[#736960] font-mono">Phụ kiện tương thích</p>
            {garmentAllowedAccessories.length ? (
              <div className="flex flex-wrap gap-1.5">
                {garmentAllowedAccessories.map((accessory) => (
                  <button
                    key={accessory.id}
                    type="button"
                    onClick={() => onToggleAccessory(accessory.id)}
                    className={chip(selectedAccessoryIds.includes(accessory.id))}
                    aria-pressed={selectedAccessoryIds.includes(accessory.id)}
                  >
                    {accessory.name.replace(/\s*\(.*\)$/, '')}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#736960]">Chưa có phụ kiện phù hợp với y phục và dịp hiện tại.</p>
            )}
          </div>

          <div className="space-y-3 rounded-[28px] border border-[#E6DCCD] bg-[#FBF8F3] p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-[#736960] font-mono">Mô hình 3D (3D Object)</p>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => void exportGlb()} disabled={busy !== null} className="btn-primary text-xs">
                {busy === 'glb' ? 'Đang xuất…' : '⬇ Tải .GLB'}
              </button>
              <button type="button" onClick={() => void exportUsdz()} disabled={busy !== null} className={`${toolButton} min-h-[2.75rem] rounded-2xl`}>
                {busy === 'usdz' ? 'Đang xuất…' : 'AR iPhone (.USDZ)'}
              </button>
            </div>
            <p className="text-[11px] leading-relaxed text-[#736960]">
              File .glb mở được trong Blender, Windows 3D Viewer, Unity/Unreal hoặc đăng lên Sketchfab; .usdz mở trực tiếp AR Quick Look trên iPhone/iPad.
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
};

export default VirtualShowroom;
