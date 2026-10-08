/**
 * Virtual tour stops: stylised low-poly heritage scenes built procedurally (no external assets),
 * each with information hotspots. Content is limited to well-established facts; the scenes are
 * illustrations, not architectural reconstructions.
 */

import * as THREE from 'three';

export interface TourHotspot {
  id: string;
  title: string;
  body: string;
  position: [number, number, number];
}

export interface TourStop {
  id: string;
  name: string;
  subtitle: string;
  background: string;
  fog: [string, number, number];
  camera: { position: [number, number, number]; target: [number, number, number] };
  hotspots: TourHotspot[];
  suggestedGarmentIds: string[];
  build: () => THREE.Group;
}

const std = (hex: string, roughness = 0.85, metalness = 0) =>
  new THREE.MeshStandardMaterial({ color: new THREE.Color(hex), roughness, metalness });

function m(geometry: THREE.BufferGeometry, material: THREE.Material, x = 0, y = 0, z = 0): THREE.Mesh {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function tileTexture(base: string, line: string, cells: number, repeat: number): THREE.Texture | undefined {
  if (typeof document === 'undefined') return undefined;
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return undefined;
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = line;
  ctx.lineWidth = 3;
  const step = 256 / cells;
  for (let i = 0; i <= cells; i += 1) {
    ctx.beginPath();
    ctx.moveTo(0, i * step);
    ctx.lineTo(256, i * step);
    ctx.stroke();
    for (let j = 0; j <= cells; j += 1) {
      const offset = i % 2 ? step / 2 : 0;
      ctx.beginPath();
      ctx.moveTo(j * step + offset, i * step);
      ctx.lineTo(j * step + offset, (i + 1) * step);
      ctx.stroke();
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeat, repeat);
  return texture;
}

function ground(color: string, size = 60, texture?: THREE.Texture): THREE.Mesh {
  const material = std(texture ? '#ffffff' : color, 0.95);
  if (texture) material.map = texture;
  const plane = m(new THREE.PlaneGeometry(size, size), material);
  plane.rotation.x = -Math.PI / 2;
  plane.castShadow = false;
  return plane;
}

/** Curved East-Asian roof: a flattened 4-sided pyramid with slightly up-turned corners. */
function roof(width: number, depth: number, height: number, color: string, y: number): THREE.Group {
  const group = new THREE.Group();
  const geometry = new THREE.ConeGeometry(Math.SQRT1_2, 1, 4, 1);
  geometry.rotateY(Math.PI / 4);
  const body = m(geometry, std(color, 0.7));
  body.scale.set(width, height, depth);
  body.position.y = y + height / 2;
  group.add(body);
  const ridge = m(new THREE.BoxGeometry(width * 0.35, 0.08, 0.1), std('#3A2A20', 0.8), 0, y + height - 0.02, 0);
  group.add(ridge);
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const tip = m(new THREE.ConeGeometry(0.06, 0.35, 6), std(color, 0.7));
      tip.position.set((sx * width) / 2, y + 0.1, (sz * depth) / 2);
      tip.rotation.set(sz * 0.6, 0, -sx * 0.6);
      group.add(tip);
    }
  }
  return group;
}

function tree(x: number, z: number, scale = 1, canopy = '#4F7350', trunk = '#5B4636'): THREE.Group {
  const group = new THREE.Group();
  group.add(m(new THREE.CylinderGeometry(0.12 * scale, 0.18 * scale, 1.8 * scale, 10), std(trunk), 0, 0.9 * scale, 0));
  const leaves = std(canopy, 0.9);
  for (const [dx, dy, dz, r] of [[0, 2.2, 0, 1], [0.6, 1.9, 0.2, 0.75], [-0.55, 2, -0.15, 0.8], [0.1, 2.7, -0.2, 0.7]] as const) {
    const ball = m(new THREE.IcosahedronGeometry(r * scale, 1), leaves, dx * scale, dy * scale, dz * scale);
    group.add(ball);
  }
  group.position.set(x, 0, z);
  return group;
}

function lantern(x: number, y: number, z: number): THREE.Group {
  const group = new THREE.Group();
  const body = m(new THREE.SphereGeometry(0.16, 16, 12), new THREE.MeshStandardMaterial({ color: '#C0392B', emissive: '#7A1A10', emissiveIntensity: 0.6, roughness: 0.6 }));
  body.scale.y = 1.25;
  group.add(body);
  group.add(m(new THREE.CylinderGeometry(0.07, 0.07, 0.05, 12), std('#C9A24A', 0.4, 0.6), 0, 0.21, 0));
  group.position.set(x, y, z);
  return group;
}

/* ------------------------------------------------------------------ */
/* Stops                                                               */
/* ------------------------------------------------------------------ */

function buildStudio(): THREE.Group {
  const group = new THREE.Group();
  group.add(ground('#EFE7DA', 40));
  const plinth = m(new THREE.CylinderGeometry(0.85, 0.9, 0.08, 64), std('#FBF8F3', 0.6), 0, 0.04, 0);
  group.add(plinth);
  const ring = m(new THREE.TorusGeometry(0.88, 0.012, 8, 96), std('#C9A24A', 0.35, 0.7), 0, 0.085, 0);
  ring.rotation.x = Math.PI / 2;
  group.add(ring);
  // Curved backdrop (cyclorama).
  const backdrop = m(new THREE.CylinderGeometry(6, 6, 6, 64, 1, true, Math.PI * 0.75, Math.PI * 0.5), new THREE.MeshStandardMaterial({ color: '#F4EDE2', roughness: 1, side: THREE.BackSide }), 0, 3, 0);
  backdrop.receiveShadow = true;
  group.add(backdrop);
  // Folding screen (bình phong) panels.
  const screenMat = std('#7A2E1F', 0.6);
  const paper = std('#F1E4C8', 0.95);
  for (let i = 0; i < 4; i += 1) {
    const panel = new THREE.Group();
    panel.add(m(new THREE.BoxGeometry(0.62, 1.9, 0.04), screenMat, 0, 0.95, 0));
    panel.add(m(new THREE.BoxGeometry(0.5, 1.5, 0.045), paper, 0, 1.0, 0));
    panel.position.set(-1.0 + i * 0.6, 0, -2.4 + (i % 2) * 0.12);
    panel.rotation.y = (i % 2 ? -0.18 : 0.18);
    group.add(panel);
  }
  group.add(lantern(-1.9, 2.1, -1.4), lantern(1.9, 2.1, -1.4));
  return group;
}

function buildVanMieu(): THREE.Group {
  const group = new THREE.Group();
  group.add(ground('#B9826B', 70, tileTexture('#B9826B', '#9C6A55', 8, 18)));
  const brick = std('#9E5B45', 0.9);
  const wood = std('#7A2E1F', 0.7);
  const tile = '#4A3B30';

  // Khuê Văn Các: four brick pillars carrying a wooden pavilion with round windows.
  const kvc = new THREE.Group();
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) kvc.add(m(new THREE.BoxGeometry(0.8, 2.2, 0.8), brick, sx * 1.2, 1.1, sz * 1.2));
  kvc.add(m(new THREE.BoxGeometry(3.4, 0.2, 3.4), std('#6B3A28', 0.8), 0, 2.3, 0));
  kvc.add(m(new THREE.BoxGeometry(2.8, 1.5, 2.8), wood, 0, 3.15, 0));
  for (const [rx, rz, ry] of [[0, 1.41, 0], [0, -1.41, 0], [1.41, 0, Math.PI / 2], [-1.41, 0, Math.PI / 2]] as const) {
    const win = m(new THREE.TorusGeometry(0.45, 0.06, 10, 48), std('#E9D7B0', 0.6), rx, 3.15, rz);
    win.rotation.y = ry;
    kvc.add(win);
    for (let i = 0; i < 8; i += 1) {
      const spoke = m(new THREE.BoxGeometry(0.9, 0.035, 0.03), std('#E9D7B0', 0.6), rx, 3.15, rz);
      spoke.rotation.set(0, ry, (Math.PI / 8) * i);
      kvc.add(spoke);
    }
  }
  kvc.add(roof(4.2, 4.2, 0.9, tile, 3.9));
  kvc.add(roof(3.0, 3.0, 0.75, tile, 4.75));
  kvc.position.set(0, 0, -8);
  group.add(kvc);

  // Thiên Quang Tỉnh (square pond) beside the path.
  const pond = m(new THREE.BoxGeometry(5, 0.05, 3.2), new THREE.MeshStandardMaterial({ color: '#3F6E78', roughness: 0.15, metalness: 0.2 }), 5.2, 0.03, -5);
  group.add(pond);
  group.add(m(new THREE.BoxGeometry(5.4, 0.12, 3.6), std('#8C8072', 0.9), 5.2, 0.0, -5));

  // Rows of stelae on turtles.
  const stone = std('#8C8C84', 0.95);
  for (const sx of [-1, 1]) {
    for (let i = 0; i < 5; i += 1) {
      const stele = new THREE.Group();
      const turtle = m(new THREE.SphereGeometry(0.42, 16, 10), stone);
      turtle.scale.set(1, 0.42, 1.35);
      turtle.position.y = 0.16;
      stele.add(turtle);
      stele.add(m(new THREE.BoxGeometry(0.55, 1.0, 0.1), stone, 0, 0.78, 0));
      const top = m(new THREE.CylinderGeometry(0.275, 0.275, 0.1, 20, 1, false, 0, Math.PI), stone, 0, 1.28, 0);
      top.rotation.set(Math.PI / 2, 0, Math.PI / 2);
      stele.add(top);
      stele.position.set(sx * (sx < 0 ? 4.2 : 9), 0, -1.5 - i * 1.5);
      stele.rotation.y = sx * Math.PI / 2;
      group.add(stele);
    }
  }
  group.add(tree(-7, -9, 1.3), tree(8, -10, 1.2), tree(-6.5, 1.5, 1.1), tree(9, -1, 1.4));
  // Low wall behind.
  group.add(m(new THREE.BoxGeometry(30, 1.4, 0.4), std('#C9A28A', 0.95), 0, 0.7, -13));
  return group;
}

function buildNgoMon(): THREE.Group {
  const group = new THREE.Group();
  group.add(ground('#D9CDB4', 80, tileTexture('#D9CDB4', '#C2B497', 6, 22)));
  const stone = std('#8A6F5C', 0.95);
  const gate = new THREE.Group();
  gate.add(m(new THREE.BoxGeometry(16, 3.6, 3.2), stone, 0, 1.8, 0));
  // Three arched openings (dark recesses).
  const dark = std('#2A1E18', 1);
  for (const x of [-3, 0, 3]) {
    gate.add(m(new THREE.BoxGeometry(x === 0 ? 1.8 : 1.3, x === 0 ? 2.4 : 2, 0.2), dark, x, x === 0 ? 1.2 : 1, 1.55));
    const arch = m(new THREE.CylinderGeometry(x === 0 ? 0.9 : 0.65, x === 0 ? 0.9 : 0.65, 0.2, 24, 1, false, 0, Math.PI), dark, x, x === 0 ? 2.4 : 2, 1.55);
    arch.rotation.set(Math.PI / 2, 0, -Math.PI / 2);
    gate.add(arch);
  }
  // Lầu Ngũ Phụng: wooden pavilion on top.
  gate.add(m(new THREE.BoxGeometry(12, 0.25, 2.8), std('#6B3A28', 0.8), 0, 3.72, 0));
  const pillar = std('#9B2C1F', 0.6);
  for (let i = 0; i < 11; i += 1) {
    gate.add(m(new THREE.CylinderGeometry(0.08, 0.08, 1.5, 10), pillar, -5 + i, 4.6, 1.2));
    gate.add(m(new THREE.CylinderGeometry(0.08, 0.08, 1.5, 10), pillar, -5 + i, 4.6, -1.2));
  }
  gate.add(m(new THREE.BoxGeometry(11.6, 0.12, 2.4), std('#E8D9B5', 0.8), 0, 4.6, 0));
  gate.add(roof(5, 3.4, 1.1, '#D4A017', 5.35)); // central roof — yellow glazed tiles
  gate.add(roof(4.2, 3.2, 0.9, '#3F7A6A', 5.3).translateX(-4.4));
  gate.add(roof(4.2, 3.2, 0.9, '#3F7A6A', 5.3).translateX(4.4));
  gate.position.set(0, 0, -10);
  group.add(gate);

  // Lotus moat in front of the gate.
  group.add(m(new THREE.BoxGeometry(22, 0.04, 2.2), new THREE.MeshStandardMaterial({ color: '#4C7A6A', roughness: 0.2 }), 0, 0.02, -6.6));
  const pad = std('#3D6B35', 0.8);
  const bloom = std('#E79AB0', 0.6);
  for (let i = 0; i < 18; i += 1) {
    const x = -10 + i * 1.18;
    const leaf = m(new THREE.CircleGeometry(0.22, 16), pad, x, 0.05, -6.6 + Math.sin(i * 1.7) * 0.6);
    leaf.rotation.x = -Math.PI / 2;
    group.add(leaf);
    if (i % 3 === 0) group.add(m(new THREE.SphereGeometry(0.09, 10, 8), bloom, x + 0.1, 0.14, -6.5 + Math.sin(i) * 0.5));
  }
  group.add(tree(-9, -3, 1.3, '#557A4A'), tree(9, -3.5, 1.2, '#557A4A'), tree(-11, 2, 1.1), tree(11, 1, 1.3));
  group.add(lantern(-2.4, 2.3, -3), lantern(2.4, 2.3, -3));
  for (const x of [-2.4, 2.4]) group.add(m(new THREE.CylinderGeometry(0.04, 0.04, 2.3, 8), std('#3A2A20'), x, 1.15, -3));
  return group;
}

function buildLangQue(): THREE.Group {
  const group = new THREE.Group();
  group.add(ground('#8DAE6B', 90));
  // Rice paddies.
  const paddyA = std('#A8C97A', 0.9);
  const paddyB = std('#9CC06E', 0.9);
  for (let i = 0; i < 6; i += 1) {
    for (let j = 0; j < 3; j += 1) {
      const field = m(new THREE.BoxGeometry(3.6, 0.06, 2.6), (i + j) % 2 ? paddyA : paddyB, -11 + i * 3.8, 0.03, -9 - j * 2.8);
      field.castShadow = false;
      group.add(field);
    }
  }
  // Banyan tree (cây đa).
  const banyan = new THREE.Group();
  const bark = std('#6E5A48', 0.95);
  banyan.add(m(new THREE.CylinderGeometry(0.55, 0.9, 3.2, 14), bark, 0, 1.6, 0));
  for (let i = 0; i < 7; i += 1) {
    const a = (i / 7) * Math.PI * 2;
    const root = m(new THREE.CylinderGeometry(0.06, 0.1, 3, 6), bark, Math.cos(a) * 1.6, 1.5, Math.sin(a) * 1.6);
    group.add(root.translateX(-5).translateZ(-4.5));
  }
  const canopy = std('#3F6B3A', 0.9);
  for (const [x, y, z, r] of [[0, 4.2, 0, 2.3], [1.8, 3.8, 0.6, 1.7], [-1.9, 3.9, -0.4, 1.8], [0.4, 5.2, -0.6, 1.6], [-0.6, 3.6, 1.6, 1.5]] as const) {
    banyan.add(m(new THREE.IcosahedronGeometry(r, 1), canopy, x, y, z));
  }
  banyan.position.set(-5, 0, -4.5);
  group.add(banyan);
  // Village well (giếng nước).
  const well = new THREE.Group();
  well.add(m(new THREE.CylinderGeometry(0.75, 0.8, 0.7, 24, 1, true), std('#8C8072', 0.95), 0, 0.35, 0));
  well.add(m(new THREE.TorusGeometry(0.77, 0.08, 8, 32), std('#7A6E62', 0.95), 0, 0.7, 0).rotateX(Math.PI / 2));
  const water = m(new THREE.CircleGeometry(0.72, 24), new THREE.MeshStandardMaterial({ color: '#2F5B66', roughness: 0.1 }), 0, 0.45, 0);
  water.rotation.x = -Math.PI / 2;
  well.add(water);
  well.position.set(4, 0, -3.2);
  group.add(well);
  // Village gate (cổng làng).
  const gate = new THREE.Group();
  const wall = std('#CDBFA4', 0.95);
  gate.add(m(new THREE.BoxGeometry(0.7, 2.6, 0.7), wall, -1.3, 1.3, 0), m(new THREE.BoxGeometry(0.7, 2.6, 0.7), wall, 1.3, 1.3, 0));
  gate.add(m(new THREE.BoxGeometry(3.4, 0.5, 0.8), wall, 0, 2.85, 0));
  gate.add(roof(3.8, 1.4, 0.7, '#6B4A3A', 3.1));
  gate.position.set(2.5, 0, -11);
  group.add(gate);
  // Bamboo clumps (lũy tre).
  const bamboo = std('#7FA35B', 0.7);
  for (let k = 0; k < 4; k += 1) {
    for (let i = 0; i < 9; i += 1) {
      const stalk = m(new THREE.CylinderGeometry(0.04, 0.05, 4 + (i % 3), 6), bamboo, -12 + k * 7 + Math.sin(i) * 0.5, 2.2, -16 + Math.cos(i) * 0.5);
      stalk.rotation.z = Math.sin(i * 2.1) * 0.12;
      group.add(stalk);
    }
  }
  // Lotus pond.
  const pond = m(new THREE.CircleGeometry(2.4, 32), new THREE.MeshStandardMaterial({ color: '#4C7A6A', roughness: 0.15 }), 5.5, 0.02, 1.5);
  pond.rotation.x = -Math.PI / 2;
  group.add(pond);
  for (let i = 0; i < 12; i += 1) {
    const a = i * 2.4;
    const leaf = m(new THREE.CircleGeometry(0.22, 12), std('#3D6B35'), 5.5 + Math.cos(a) * (0.6 + (i % 4) * 0.4), 0.04, 1.5 + Math.sin(a) * (0.6 + (i % 4) * 0.4));
    leaf.rotation.x = -Math.PI / 2;
    group.add(leaf);
    if (i % 2) group.add(m(new THREE.SphereGeometry(0.08, 10, 8), std('#EFA3B8', 0.6), leaf.position.x, 0.14, leaf.position.z));
  }
  return group;
}

export const TOUR_STOPS: TourStop[] = [
  {
    id: 'studio',
    name: 'Phòng trưng bày',
    subtitle: 'Xoay 360° để xem kết cấu áo',
    background: '#F3ECE1',
    fog: ['#F3ECE1', 8, 22],
    camera: { position: [0, 1.35, 3.1], target: [0, 1.0, 0] },
    suggestedGarmentIds: [],
    hotspots: [
      {
        id: 'studio-screen',
        title: 'Bình phong & đèn lồng',
        body: 'Không gian trưng bày tối giản giúp bạn tập trung vào phom dáng, màu và phụ kiện. Kéo để xoay, cuộn/chụm để phóng to.',
        position: [-1.0, 1.9, -2.2],
      },
    ],
    build: buildStudio,
  },
  {
    id: 'van-mieu',
    name: 'Văn Miếu – Quốc Tử Giám',
    subtitle: 'Hà Nội · bối cảnh kỷ yếu, tốt nghiệp',
    background: '#CFE3EE',
    fog: ['#DDE8EC', 14, 42],
    camera: { position: [1.6, 1.5, 3.6], target: [0, 1.4, -2] },
    suggestedGarmentIds: ['garment-ao-tac', 'garment-ngu-than-tay-chen', 'garment-ao-giao-linh'],
    hotspots: [
      {
        id: 'khue-van-cac',
        title: 'Khuê Văn Các',
        body: 'Gác Khuê Văn dựng năm 1805, là biểu tượng của Thủ đô Hà Nội. Văn Miếu được xây năm 1070 thời vua Lý Thánh Tông để thờ Khổng Tử; năm 1076 lập Quốc Tử Giám — được xem là trường đại học đầu tiên của Việt Nam.',
        position: [0, 4.0, -8],
      },
      {
        id: 'bia-tien-si',
        title: 'Bia Tiến sĩ',
        body: '82 tấm bia đặt trên lưng rùa đá ghi danh các tiến sĩ khoa thi từ năm 1442 đến 1779, được UNESCO ghi danh là Di sản tư liệu thế giới. Khi chụp ảnh: không trèo lên bia, không xoa đầu rùa.',
        position: [-4.2, 1.7, -3],
      },
      {
        id: 'van-mieu-tip',
        title: 'Gợi ý phối',
        body: 'Không gian trang nghiêm hợp Áo Tấc, Ngũ Thân tay chẽn hoặc Giao Lĩnh tông trầm; cài đủ cúc, giữ vạt hữu nhậm; phụ kiện khăn đóng/khăn vấn nhã nhặn.',
        position: [1.3, 1.9, -0.6],
      },
    ],
    build: buildVanMieu,
  },
  {
    id: 'ngo-mon',
    name: 'Ngọ Môn – Hoàng thành Huế',
    subtitle: 'Cố đô · lễ phục cung đình',
    background: '#E7DCC6',
    fog: ['#E9DFCB', 16, 48],
    camera: { position: [-1.8, 1.6, 3.8], target: [0, 1.8, -3] },
    suggestedGarmentIds: ['garment-ao-nhat-binh', 'garment-ao-tac', 'garment-ao-doi-kham'],
    hotspots: [
      {
        id: 'ngo-mon',
        title: 'Ngọ Môn & lầu Ngũ Phụng',
        body: 'Cổng chính phía nam của Hoàng thành Huế, xây năm 1833 thời vua Minh Mạng; phía trên là lầu Ngũ Phụng. Quần thể di tích Cố đô Huế được UNESCO công nhận Di sản văn hóa thế giới năm 1993.',
        position: [0, 6.2, -10],
      },
      {
        id: 'nhat-binh',
        title: 'Áo Nhật Bình',
        body: 'Lễ phục cung đình triều Nguyễn dành cho hoàng hậu, phi tần, công chúa; cổ áo lớn hình vuông như chữ "Nhật", tay áo rộng có dải ngũ sắc. Hãy chọn Áo Nhật Bình để thử trong khung cảnh này.',
        position: [-1.4, 1.9, -0.6],
      },
    ],
    build: buildNgoMon,
  },
  {
    id: 'lang-que',
    name: 'Làng quê Bắc Bộ',
    subtitle: 'Cây đa · giếng nước · ruộng lúa',
    background: '#D6E6F0',
    fog: ['#E2ECEF', 16, 50],
    camera: { position: [1.4, 1.45, 3.4], target: [0, 1.2, -1] },
    suggestedGarmentIds: ['garment-ao-tu-than', 'garment-ao-dai-ngu-than-remix'],
    hotspots: [
      {
        id: 'cay-da',
        title: 'Cây đa – giếng nước – sân đình',
        body: 'Bộ ba hình ảnh quen thuộc của làng quê Bắc Bộ, nơi diễn ra hội làng, hát quan họ, chơi đu dịp xuân.',
        position: [-5, 3.2, -4.5],
      },
      {
        id: 'tu-than',
        title: 'Áo tứ thân & quan họ',
        body: 'Áo tứ thân gồm bốn vạt, mặc ngoài yếm, thắt lưng bao; liền chị quan họ thường đội nón quai thao, chít khăn mỏ quạ. Dân ca quan họ Bắc Ninh được UNESCO ghi danh Di sản văn hóa phi vật thể đại diện của nhân loại năm 2009.',
        position: [1.3, 1.9, -0.6],
      },
    ],
    build: buildLangQue,
  },
];
