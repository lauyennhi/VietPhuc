/**
 * Procedural 3D mannequin wearing a Việt phục garment, built only from approved data
 * (garment template, colours, accessories). Units are metres, figure faces +Z,
 * so the wearer's RIGHT side is −X (used for the hữu nhậm overlap).
 */

import * as THREE from 'three';

export interface FigureOptions {
  template: string;
  primary: string;
  pant: string;
  skin: string;
  seated: boolean;
  feminine: boolean;
  brocade: boolean;
  accessoryIds: string[];
  accessoryColors: Record<string, string>;
}

type Sleeve = 'slim' | 'wide';
type Collar = 'standing' | 'nhatbinh' | 'cross' | 'parallel' | 'open';

interface TemplateSpec {
  hem: number;
  flare: number;
  sleeve: Sleeve;
  sleeveLength: number;
  collar: Collar;
  buttons: boolean;
  split?: boolean;
  skirt?: boolean;
  yem?: boolean;
  sash?: boolean;
  sleeveBands?: boolean;
  inner?: boolean;
}

const TEMPLATES: Record<string, TemplateSpec> = {
  NGU_THAN_TAY_CHEN: { hem: 0.42, flare: 0.27, sleeve: 'slim', sleeveLength: 0.6, collar: 'standing', buttons: true },
  AO_TAC: { hem: 0.24, flare: 0.33, sleeve: 'wide', sleeveLength: 0.68, collar: 'standing', buttons: true },
  AO_NHAT_BINH: { hem: 0.34, flare: 0.31, sleeve: 'wide', sleeveLength: 0.62, collar: 'nhatbinh', buttons: false, sleeveBands: true },
  AO_GIAO_LINH: { hem: 0.22, flare: 0.31, sleeve: 'wide', sleeveLength: 0.64, collar: 'cross', buttons: false, sash: true },
  AO_DOI_KHAM: { hem: 0.26, flare: 0.3, sleeve: 'wide', sleeveLength: 0.62, collar: 'parallel', buttons: false, inner: true },
  AO_TU_THAN: { hem: 0.46, flare: 0.25, sleeve: 'slim', sleeveLength: 0.58, collar: 'open', buttons: false, skirt: true, yem: true, sash: true },
  AO_DAI: { hem: 0.3, flare: 0.21, sleeve: 'slim', sleeveLength: 0.6, collar: 'standing', buttons: true, split: true },
  NGU_THAN_REMIX: { hem: 0.56, flare: 0.25, sleeve: 'slim', sleeveLength: 0.52, collar: 'standing', buttons: true },
};

export function templateSpec(template: string): TemplateSpec {
  return TEMPLATES[template] ?? TEMPLATES.NGU_THAN_TAY_CHEN;
}

/* ------------------------------------------------------------------ */
/* Materials & helpers                                                 */
/* ------------------------------------------------------------------ */

const shade = (hex: string, amount: number): THREE.Color => {
  const color = new THREE.Color(hex);
  const hsl = { h: 0, s: 0, l: 0 };
  color.getHSL(hsl);
  return new THREE.Color().setHSL(hsl.h, hsl.s, THREE.MathUtils.clamp(hsl.l + amount, 0, 1));
};

function brocadeTexture(hex: string): THREE.CanvasTexture | undefined {
  if (typeof document === 'undefined') return undefined;
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return undefined;
  ctx.fillStyle = `#${new THREE.Color(hex).getHexString()}`;
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = `#${shade(hex, 0.12).getHexString()}`;
  ctx.fillStyle = `#${shade(hex, 0.08).getHexString()}`;
  ctx.lineWidth = 3;
  // Cloud-and-circle ("vân mây, chữ thọ" inspired) repeat motif.
  for (const [cx, cy] of [[64, 64], [192, 192], [192, 64], [64, 192]] as const) {
    const big = (cx + cy) % 256 === 128;
    ctx.beginPath();
    ctx.arc(cx, cy, big ? 30 : 18, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, big ? 10 : 6, 0, Math.PI * 2);
    ctx.fill();
    if (big) {
      for (let i = 0; i < 4; i += 1) {
        const a = (Math.PI / 2) * i + Math.PI / 4;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(a) * 44, cy + Math.sin(a) * 44, 9, a + Math.PI * 0.6, a + Math.PI * 1.9);
        ctx.stroke();
      }
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(6, 5);
  texture.anisotropy = 4;
  return texture;
}

function fabric(hex: string, brocade = false): THREE.MeshPhysicalMaterial {
  const material = new THREE.MeshPhysicalMaterial({
    color: brocade ? 0xffffff : new THREE.Color(hex),
    roughness: 0.62,
    metalness: 0,
    sheen: 1,
    sheenRoughness: 0.45,
    sheenColor: shade(hex, 0.25),
    side: THREE.DoubleSide,
  });
  if (brocade) {
    const map = brocadeTexture(hex);
    if (map) material.map = map;
    else material.color = new THREE.Color(hex);
  }
  return material;
}

const plain = (hex: string | number, roughness = 0.7, metalness = 0) =>
  new THREE.MeshStandardMaterial({ color: new THREE.Color(hex as THREE.ColorRepresentation), roughness, metalness, side: THREE.DoubleSide });

const gold = () => plain('#C9A24A', 0.35, 0.75);

function mesh(geometry: THREE.BufferGeometry, material: THREE.Material, name?: string): THREE.Mesh {
  const m = new THREE.Mesh(geometry, material);
  m.castShadow = true;
  m.receiveShadow = true;
  if (name) m.name = name;
  return m;
}

type Profile = Array<[number, number]>; // [radius, y]

/** Radius of a lathe profile at height y (linear interpolation). */
function radiusAt(profile: Profile, y: number): number {
  for (let i = 0; i < profile.length - 1; i += 1) {
    const [r1, y1] = profile[i];
    const [r2, y2] = profile[i + 1];
    if ((y <= y1 && y >= y2) || (y >= y1 && y <= y2)) {
      const t = y1 === y2 ? 0 : (y - y1) / (y2 - y1);
      return r1 + (r2 - r1) * t;
    }
  }
  return profile[profile.length - 1][0];
}

function lathe(profile: Profile, material: THREE.Material, phiStart = 0, phiLength = Math.PI * 2): THREE.Mesh {
  const points = profile.map(([r, y]) => new THREE.Vector2(r, y));
  return mesh(new THREE.LatheGeometry(points, 64, phiStart, phiLength), material);
}

/** Point on the garment surface at angle `a` (0 = front, negative = wearer's right). */
function surface(profile: Profile, a: number, y: number, offset = 0.004): THREE.Vector3 {
  const r = radiusAt(profile, y) + offset;
  return new THREE.Vector3(Math.sin(a) * r, y, Math.cos(a) * r);
}

function tube(points: THREE.Vector3[], radius: number, material: THREE.Material): THREE.Mesh {
  const curve = new THREE.CatmullRomCurve3(points);
  return mesh(new THREE.TubeGeometry(curve, 48, radius, 8, false), material);
}

/* ------------------------------------------------------------------ */
/* Figure                                                              */
/* ------------------------------------------------------------------ */

export function buildFigure(options: FigureOptions): THREE.Group {
  const spec = templateSpec(options.template);
  const root = new THREE.Group();
  root.name = 'VstyleFigure';

  const upper = new THREE.Group();
  upper.name = 'upper';
  root.add(upper);

  const skin = plain(options.skin, 0.55);
  const robe = fabric(options.primary, options.brocade);
  const trim = plain(shade(options.primary, -0.14).getStyle(), 0.6);
  const lining = plain('#F4EFE6', 0.8);
  const pantMat = fabric(options.pant);
  const hairMat = plain('#1B1512', 0.45);
  const waistNarrow = options.feminine ? 0.128 : 0.142;
  const seatedDrop = options.seated ? 0.36 : 0;

  /* --- Head, hair, neck --- */
  const head = mesh(new THREE.SphereGeometry(0.095, 32, 24), skin, 'head');
  head.scale.set(0.92, 1.08, 0.98);
  head.position.set(0, 1.63, 0);
  upper.add(head);
  const neck = mesh(new THREE.CylinderGeometry(0.038, 0.045, 0.12, 20), skin);
  neck.position.set(0, 1.52, 0);
  upper.add(neck);
  const hair = mesh(new THREE.SphereGeometry(0.102, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.52), hairMat, 'hair');
  hair.scale.set(0.93, 1.08, 1.0);
  hair.position.set(0, 1.635, -0.006);
  upper.add(hair);
  if (options.feminine) {
    const bun = mesh(new THREE.SphereGeometry(0.052, 24, 16), hairMat);
    bun.position.set(0, 1.66, -0.1);
    upper.add(bun);
  } else {
    const topknot = mesh(new THREE.SphereGeometry(0.04, 20, 12), hairMat);
    topknot.position.set(0, 1.735, -0.03);
    upper.add(topknot);
  }

  /* --- Robe body (lathe profile) --- */
  const hem = options.seated ? 0.9 : spec.hem;
  const hipR = options.feminine ? 0.175 : 0.168;
  const bodyProfile: Profile = [
    [0.05, 1.49],
    [0.16, 1.44],
    [0.185, 1.38],
    [0.17, 1.27],
    [waistNarrow, 1.1],
    [hipR, 0.94],
  ];
  if (!options.seated) {
    const mid = (0.94 + hem) / 2;
    bodyProfile.push([(hipR + spec.flare) / 2 + 0.012, mid], [spec.flare, hem], [spec.flare - 0.006, hem - 0.004]);
  }

  if (spec.split && !options.seated) {
    // Áo dài: closed bodice down to the waist, then separate front & back tà with side slits.
    const top = bodyProfile.filter(([, y]) => y >= 0.94);
    upper.add(lathe(top, robe));
    const flapProfile: Profile = [[hipR + 0.002, 0.95], [(hipR + spec.flare) / 2 + 0.01, (0.95 + hem) / 2], [spec.flare, hem]];
    const span = THREE.MathUtils.degToRad(150);
    upper.add(lathe(flapProfile, robe, -span / 2, span));
    upper.add(lathe(flapProfile, robe, Math.PI - span / 2, span));
  } else {
    upper.add(lathe(bodyProfile, robe));
  }
  // Inner lining ring at hem so the open bottom reads as cloth thickness.
  if (!options.seated && !spec.split) {
    const ring = mesh(new THREE.TorusGeometry(spec.flare - 0.004, 0.006, 8, 64), trim);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = hem;
    upper.add(ring);
  }

  /* --- Collar --- */
  if (spec.collar === 'standing' || spec.collar === 'nhatbinh') {
    const collar = mesh(new THREE.CylinderGeometry(0.056, 0.062, 0.055, 32, 1, true), trim, 'collar-lap-linh');
    collar.position.set(0, 1.505, 0);
    upper.add(collar);
    const collarEdge = mesh(new THREE.TorusGeometry(0.057, 0.004, 8, 48), lining);
    collarEdge.rotation.x = Math.PI / 2;
    collarEdge.position.set(0, 1.532, 0);
    upper.add(collarEdge);
  }

  if (spec.buttons) {
    // Hữu nhậm: overlap edge runs from the collar to the wearer's RIGHT (−X) then down the side.
    const path: Array<[number, number]> = [[0, 1.48], [-0.55, 1.43], [-1.05, 1.36], [-1.38, 1.24], [-1.48, 1.08]];
    const edgePoints = path.map(([a, y]) => surface(bodyProfile, a, y, 0.003));
    upper.add(tube(edgePoints, 0.005, trim));
    const buttonMat = gold();
    for (const [a, y] of path) {
      const button = mesh(new THREE.SphereGeometry(0.011, 12, 10), buttonMat, 'button');
      button.position.copy(surface(bodyProfile, a, y, 0.01));
      upper.add(button);
    }
  }

  if (spec.collar === 'cross') {
    // Giao lĩnh: crossed collar, the outer flap (wearer's left) closes over to the wearer's right.
    const collarMat = plain('#F4EFE6', 0.75);
    const outer = [surface(bodyProfile, 0.55, 1.47, 0.006), surface(bodyProfile, 0.1, 1.36, 0.006), surface(bodyProfile, -0.6, 1.18, 0.006), surface(bodyProfile, -0.95, 1.1, 0.006)];
    upper.add(tube(outer, 0.018, collarMat));
    const inner = [surface(bodyProfile, -0.55, 1.47, 0.004), surface(bodyProfile, -0.2, 1.4, 0.004)];
    upper.add(tube(inner, 0.016, collarMat));
  }

  if (spec.collar === 'parallel') {
    // Đối khâm: two parallel front panels with a visible inner layer.
    const innerProfile = bodyProfile.map(([r, y]) => [r + 0.001, y] as [number, number]);
    upper.add(lathe(innerProfile, lining, -0.12, 0.24));
    const edgeMat = plain(shade(options.primary, -0.2).getStyle(), 0.6);
    for (const side of [-1, 1]) {
      const pts = [1.47, 1.3, 1.1, 0.94, (0.94 + hem) / 2, hem + 0.01].map((y) => surface(bodyProfile, side * 0.12, y, 0.006));
      upper.add(tube(pts, 0.012, edgeMat));
    }
  }

  if (spec.collar === 'open') {
    // Áo tứ thân: open V front revealing the yếm.
    const edgeMat = plain(shade(options.primary, -0.18).getStyle(), 0.6);
    for (const side of [-1, 1]) {
      const pts = [surface(bodyProfile, side * 0.5, 1.47, 0.005), surface(bodyProfile, side * 0.32, 1.32, 0.005), surface(bodyProfile, side * 0.18, 1.12, 0.005)];
      upper.add(tube(pts, 0.009, edgeMat));
    }
  }

  if (spec.collar === 'nhatbinh') {
    // Nhật Bình: wide square collar draped over the shoulders + hanging front bands.
    const shape = new THREE.Shape();
    shape.moveTo(-0.27, -0.27);
    shape.lineTo(0.27, -0.27);
    shape.lineTo(0.27, 0.27);
    shape.lineTo(-0.27, 0.27);
    shape.lineTo(-0.27, -0.27);
    const hole = new THREE.Path();
    hole.absarc(0, 0, 0.075, 0, Math.PI * 2, true);
    shape.holes.push(hole);
    const collarMat = plain('#C9A24A', 0.45, 0.35);
    const cape = mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.012, bevelEnabled: false }), collarMat, 'co-nhat-binh');
    cape.rotation.x = -Math.PI / 2;
    cape.position.set(0, 1.455, 0);
    cape.scale.set(1, 1, 1);
    upper.add(cape);
    for (const side of [-1, 1]) {
      const band = mesh(new THREE.BoxGeometry(0.06, 0.62, 0.008), collarMat);
      band.position.copy(surface(bodyProfile, side * 0.2, 1.12, 0.012));
      band.lookAt(band.position.clone().add(new THREE.Vector3(Math.sin(side * 0.2), 0, Math.cos(side * 0.2))));
      upper.add(band);
    }
  }

  if (spec.yem || options.accessoryIds.includes('acc-yem-co-truyen')) {
    const color = options.accessoryColors['acc-yem-co-truyen'] ?? '#E2546B';
    const yem = mesh(new THREE.CircleGeometry(0.11, 4), plain(color, 0.6), 'yem');
    yem.scale.set(0.95, 1.2, 1);
    yem.position.copy(surface(bodyProfile, 0, 1.3, 0.008));
    upper.add(yem);
  }

  if (spec.sash || options.accessoryIds.includes('acc-that-lung-lua')) {
    const color = options.accessoryColors['acc-that-lung-lua'] ?? shade(options.primary, 0.2).getStyle();
    const sashMat = fabric(color);
    const sash = mesh(new THREE.TorusGeometry(waistNarrow + 0.008, 0.016, 10, 64), sashMat, 'that-lung');
    sash.rotation.x = Math.PI / 2;
    sash.position.y = 1.1;
    upper.add(sash);
    for (const dx of [-0.03, 0.03]) {
      const end = mesh(new THREE.BoxGeometry(0.035, 0.32, 0.006), sashMat);
      end.position.set(dx, 0.93, waistNarrow + 0.03);
      end.rotation.z = dx * 2;
      upper.add(end);
    }
  }

  /* --- Sleeves & hands --- */
  const sleeveMat = robe;
  for (const side of [-1, 1]) {
    const arm = new THREE.Group();
    arm.position.set(side * 0.2, 1.4, 0);
    arm.rotation.z = side * 0.13;
    const len = spec.sleeveLength;
    const wide = spec.sleeve === 'wide';
    const sleeve = mesh(new THREE.CylinderGeometry(0.06, wide ? 0.19 : 0.046, len, 32, 1, true), sleeveMat, 'tay-ao');
    sleeve.position.y = -len / 2;
    if (wide) sleeve.scale.z = 0.62;
    arm.add(sleeve);
    if (spec.sleeveBands) {
      ['#8B1E2B', '#D4A338', '#2B5C8F', '#3D6B35', '#F4EFE6'].forEach((color, i) => {
        const band = mesh(new THREE.CylinderGeometry(0.184 - i * 0.003, 0.19 - i * 0.003, 0.018, 32, 1, true), plain(color, 0.6));
        band.scale.z = 0.62;
        band.position.y = -len + 0.03 + i * 0.022;
        arm.add(band);
      });
    }
    const cuff = mesh(new THREE.TorusGeometry(wide ? 0.188 : 0.046, 0.005, 8, 48), trim);
    cuff.rotation.x = Math.PI / 2;
    cuff.position.y = -len;
    if (wide) cuff.scale.y = 0.62;
    arm.add(cuff);
    const hand = mesh(new THREE.SphereGeometry(0.038, 20, 14), skin, 'hand');
    hand.scale.set(0.8, 1.2, 0.6);
    hand.position.y = wide ? -len + 0.06 : -len - 0.045;
    arm.add(hand);
    arm.name = side < 0 ? 'arm-right' : 'arm-left';
    if (options.seated) {
      arm.rotation.x = -0.55;
    }
    upper.add(arm);
  }

  /* --- Lower body --- */
  const lower = new THREE.Group();
  lower.name = 'lower';
  root.add(lower);

  const shoeColor = options.accessoryIds.includes('acc-sneaker-retro')
    ? '#F7F5F0'
    : options.accessoryIds.includes('acc-hai-sen')
      ? options.accessoryColors['acc-hai-sen'] ?? '#8B1E2B'
      : options.accessoryIds.includes('acc-guoc-moc')
        ? '#A87954'
        : '#2A211C';
  const shoeMat = plain(shoeColor, 0.6);

  const addShoe = (x: number, z: number, y = 0.035) => {
    const isSneaker = options.accessoryIds.includes('acc-sneaker-retro');
    const isClog = options.accessoryIds.includes('acc-guoc-moc');
    const shoe = mesh(new THREE.BoxGeometry(0.085, isClog ? 0.05 : 0.06, 0.2, 2, 2, 2), shoeMat, 'giay');
    shoe.position.set(x, y, z + 0.04);
    lower.add(shoe);
    if (isSneaker) {
      const sole = mesh(new THREE.BoxGeometry(0.09, 0.022, 0.21), plain('#D9D2C3', 0.8));
      sole.position.set(x, y - 0.035, z + 0.04);
      lower.add(sole);
    }
    if (options.accessoryIds.includes('acc-hai-sen')) {
      const toe = mesh(new THREE.ConeGeometry(0.02, 0.05, 12), shoeMat);
      toe.rotation.x = -Math.PI / 3;
      toe.position.set(x, y + 0.03, z + 0.14);
      lower.add(toe);
    }
  };

  if (!options.seated) {
    if (spec.skirt) {
      const skirt = lathe([[0.15, 1.0], [0.19, 0.6], [0.21, 0.1], [0.205, 0.095]], fabric('#2A211C'));
      skirt.name = 'vay';
      lower.add(skirt);
    } else {
      for (const side of [-1, 1]) {
        const leg = mesh(new THREE.CylinderGeometry(0.068, 0.062, 0.86, 24, 1, true), pantMat, 'quan');
        leg.position.set(side * 0.075, 0.5, 0);
        lower.add(leg);
      }
    }
    addShoe(-0.075, 0);
    addShoe(0.075, 0);
  } else {
    /* Seated (wheelchair) pose: the robe is tailored short so nothing touches the wheels. */
    const seatY = 0.52;
    const lap = mesh(new THREE.BoxGeometry(0.36, 0.08, 0.44, 4, 1, 4), robe, 'ta-ao-ngoi');
    lap.position.set(0, seatY + 0.08, 0.14);
    lower.add(lap);
    const drape = mesh(new THREE.PlaneGeometry(0.34, 0.2), robe);
    drape.position.set(0, seatY - 0.02, 0.365);
    lower.add(drape);
    for (const side of [-1, 1]) {
      const shin = mesh(new THREE.CylinderGeometry(0.058, 0.052, 0.46, 20, 1, true), pantMat, 'quan');
      shin.position.set(side * 0.085, seatY - 0.23, 0.38);
      lower.add(shin);
      addShoe(side * 0.085, 0.38, 0.1);
    }
    lower.add(buildWheelchair());
  }

  upper.position.y -= seatedDrop;

  /* --- Accessories --- */
  addAccessories(upper, lower, options, bodyProfile);

  root.traverse((object) => {
    if ((object as THREE.Mesh).isMesh) {
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });
  return root;
}

function buildWheelchair(): THREE.Group {
  const chair = new THREE.Group();
  chair.name = 'xe-lan';
  const frame = plain('#3B4048', 0.4, 0.7);
  const seat = plain('#2A2D33', 0.8);
  const seatBox = mesh(new THREE.BoxGeometry(0.44, 0.05, 0.44), seat);
  seatBox.position.set(0, 0.5, 0.1);
  chair.add(seatBox);
  const back = mesh(new THREE.BoxGeometry(0.44, 0.48, 0.04), seat);
  back.position.set(0, 0.76, -0.13);
  back.rotation.x = -0.08;
  chair.add(back);
  for (const side of [-1, 1]) {
    const wheel = mesh(new THREE.TorusGeometry(0.29, 0.018, 12, 64), plain('#1E1F22', 0.6));
    wheel.rotation.y = Math.PI / 2;
    wheel.position.set(side * 0.27, 0.31, 0.02);
    chair.add(wheel);
    const rim = mesh(new THREE.TorusGeometry(0.26, 0.008, 8, 64), frame);
    rim.rotation.y = Math.PI / 2;
    rim.position.set(side * 0.285, 0.31, 0.02);
    chair.add(rim);
    const caster = mesh(new THREE.TorusGeometry(0.05, 0.014, 8, 24), plain('#1E1F22', 0.6));
    caster.rotation.y = Math.PI / 2;
    caster.position.set(side * 0.2, 0.06, 0.4);
    chair.add(caster);
    const post = mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.42, 8), frame);
    post.position.set(side * 0.2, 0.28, 0.4);
    chair.add(post);
    const handle = mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.5, 8), frame);
    handle.position.set(side * 0.22, 0.76, -0.16);
    chair.add(handle);
  }
  const footrest = mesh(new THREE.BoxGeometry(0.36, 0.015, 0.14), frame);
  footrest.position.set(0, 0.07, 0.46);
  chair.add(footrest);
  return chair;
}

function addAccessories(upper: THREE.Group, lower: THREE.Group, options: FigureOptions, bodyProfile: Profile): void {
  const has = (id: string) => options.accessoryIds.includes(id);
  const colorOf = (id: string, fallback: string) => options.accessoryColors[id] ?? fallback;

  if (has('acc-khan-dong')) {
    const mat = fabric(colorOf('acc-khan-dong', '#1C1C1E'));
    for (let i = 0; i < 4; i += 1) {
      const wrap = mesh(new THREE.TorusGeometry(0.098, 0.017, 10, 48), mat, 'khan-dong');
      wrap.rotation.x = Math.PI / 2 + (i % 2 ? 0.12 : -0.12);
      wrap.position.set(0, 1.665 + i * 0.022, -0.005);
      upper.add(wrap);
    }
  }
  if (has('acc-man-nu')) {
    const mat = fabric(colorOf('acc-man-nu', '#9B111E'));
    const brim = mesh(new THREE.CylinderGeometry(0.16, 0.17, 0.03, 48), mat, 'man');
    brim.position.set(0, 1.715, 0);
    upper.add(brim);
    const crown = mesh(new THREE.CylinderGeometry(0.09, 0.1, 0.07, 32), mat);
    crown.position.set(0, 1.75, 0);
    upper.add(crown);
  }
  if (has('acc-khan-mo-qua')) {
    const mat = fabric(colorOf('acc-khan-mo-qua', '#1E1E20'));
    const wrap = mesh(new THREE.TorusGeometry(0.1, 0.02, 10, 48), mat, 'khan-mo-qua');
    wrap.rotation.x = Math.PI / 2;
    wrap.position.set(0, 1.68, 0);
    upper.add(wrap);
    const peak = mesh(new THREE.ConeGeometry(0.05, 0.08, 4), mat);
    peak.position.set(0, 1.74, 0.06);
    peak.rotation.x = 0.5;
    upper.add(peak);
  }
  if (has('acc-non-quai-thao')) {
    const mat = plain(colorOf('acc-non-quai-thao', '#E8DCC4'), 0.85);
    const hat = mesh(new THREE.CylinderGeometry(0.3, 0.32, 0.035, 64), mat, 'non-quai-thao');
    hat.position.set(0, 1.76, 0);
    upper.add(hat);
    const rim = mesh(new THREE.TorusGeometry(0.31, 0.012, 8, 64), plain('#B8860B', 0.5));
    rim.rotation.x = Math.PI / 2;
    rim.position.set(0, 1.74, 0);
    upper.add(rim);
    const strapMat = plain('#3E2723', 0.8);
    for (const side of [-1, 1]) {
      upper.add(tube([new THREE.Vector3(side * 0.12, 1.74, 0), new THREE.Vector3(side * 0.09, 1.6, 0.04), new THREE.Vector3(0, 1.53, 0.08)], 0.004, strapMat));
    }
  }
  if (has('acc-tram-cai-toc') && options.feminine) {
    const pin = mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.16, 8), gold(), 'tram');
    pin.rotation.z = Math.PI / 2.4;
    pin.position.set(0, 1.67, -0.1);
    upper.add(pin);
  }
  if (has('acc-kinh-ram')) {
    const mat = plain('#141414', 0.1, 0.4);
    for (const side of [-1, 1]) {
      const lens = mesh(new THREE.CircleGeometry(0.024, 24), mat, 'kinh');
      lens.position.set(side * 0.035, 1.645, 0.093);
      upper.add(lens);
    }
  }
  if (has('acc-kieng-bac')) {
    const ring = mesh(new THREE.TorusGeometry(0.08, 0.011, 12, 48), plain('#D9D9D9', 0.25, 0.9), 'kieng');
    ring.rotation.x = Math.PI / 2 - 0.35;
    ring.position.set(0, 1.47, 0.03);
    upper.add(ring);
  }
  if (has('acc-chuoi-ngoc')) {
    const pearl = plain('#F8F6F0', 0.2, 0.1);
    for (let i = 0; i < 26; i += 1) {
      const a = (i / 26) * Math.PI * 2;
      const bead = mesh(new THREE.SphereGeometry(0.009, 10, 8), pearl, 'ngoc');
      bead.position.set(Math.sin(a) * 0.09, 1.44 - (Math.cos(a) + 1) * 0.06, 0.05 + Math.cos(a) * 0.07);
      upper.add(bead);
    }
  }
  if (has('acc-the-bai')) {
    const tag = mesh(new THREE.BoxGeometry(0.04, 0.065, 0.008), plain(colorOf('acc-the-bai', '#8C2D19'), 0.5, 0.2), 'the-bai');
    tag.position.copy(surface(bodyProfile, 0.15, 1.22, 0.014));
    upper.add(tag);
    upper.add(tube([surface(bodyProfile, 0.45, 1.46, 0.006), surface(bodyProfile, 0.15, 1.26, 0.012)], 0.003, plain('#3E2723')));
  }
  if (has('acc-that-lung-da')) {
    const belt = mesh(new THREE.TorusGeometry(0.15, 0.012, 8, 64), plain('#1C1C1E', 0.5), 'that-lung-da');
    belt.rotation.x = Math.PI / 2;
    belt.position.y = 1.1;
    upper.add(belt);
    const buckle = mesh(new THREE.BoxGeometry(0.045, 0.035, 0.01), gold());
    buckle.position.set(0, 1.1, 0.152);
    upper.add(buckle);
  }

  const leftHand = upper.getObjectByName('arm-left');
  const rightHand = upper.getObjectByName('arm-right');
  const handY = -templateSpec(options.template).sleeveLength - 0.05;
  if ((has('acc-quat-tram-huong') || has('acc-quat-xep-giay-do')) && rightHand) {
    const color = has('acc-quat-tram-huong') ? colorOf('acc-quat-tram-huong', '#A67B56') : colorOf('acc-quat-xep-giay-do', '#EFE9D9');
    const fan = mesh(new THREE.CircleGeometry(0.17, 24, Math.PI * 0.1, Math.PI * 0.8), plain(color, 0.7), 'quat');
    fan.position.set(0, handY, 0.06);
    fan.rotation.set(-0.3, 0, Math.PI);
    rightHand.add(fan);
  }
  if ((has('acc-tui-coi') || has('acc-tui-da')) && leftHand) {
    const color = has('acc-tui-coi') ? colorOf('acc-tui-coi', '#D4B28C') : colorOf('acc-tui-da', '#78350F');
    const bag = mesh(new THREE.CylinderGeometry(0.1, 0.085, 0.16, 24), plain(color, 0.9), 'tui');
    bag.position.set(0.02, handY - 0.14, 0.02);
    leftHand.add(bag);
    const handle = mesh(new THREE.TorusGeometry(0.06, 0.007, 8, 24, Math.PI), plain(color, 0.9));
    handle.position.set(0.02, handY - 0.06, 0.02);
    leftHand.add(handle);
  }
  void lower;
}

/** Recursively frees GPU resources of an object tree. */
export function disposeObject(object: THREE.Object3D): void {
  object.traverse((child) => {
    const m = child as THREE.Mesh;
    if (m.geometry) m.geometry.dispose();
    const materials = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
    for (const material of materials) {
      for (const value of Object.values(material)) {
        if (value instanceof THREE.Texture) value.dispose();
      }
      material.dispose();
    }
  });
}
