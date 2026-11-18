import * as THREE from "three";

const textureCache = new Map<string, THREE.CanvasTexture>();

function createCanvas(size: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  return [canvas, ctx];
}

function finalizeTexture(
  key: string,
  canvas: HTMLCanvasElement,
  repeatX: number,
  repeatY: number,
  anisotropy: number,
  isColor = true
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = anisotropy;
  if (isColor) {
    tex.colorSpace = THREE.SRGBColorSpace;
  }
  tex.needsUpdate = true;
  textureCache.set(key, tex);
  return tex;
}

export function getWoodTexture(
  baseHex: string,
  grainHex: string,
  fluted = false,
  anisotropy = 4
): THREE.CanvasTexture {
  const key = `wood-${baseHex}-${grainHex}-${fluted ? "f" : "s"}`;
  const existing = textureCache.get(key);
  if (existing) return existing;

  const size = 512;
  const [canvas, ctx] = createCanvas(size);

  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, size, size);

  // Organic wood grain streaks
  for (let i = 0; i < 160; i++) {
    const x = (i / 160) * size + (Math.sin(i * 1.7) * 4);
    const width = 1 + ((i * 7) % 3);
    ctx.strokeStyle = grainHex;
    ctx.globalAlpha = 0.08 + ((i * 13) % 10) * 0.012;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    for (let y = 0; y <= size; y += 32) {
      const wave = Math.sin(y * 0.015 + i * 0.5) * 3.5;
      ctx.lineTo(x + wave, y);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  if (fluted) {
    const ribs = 24;
    const ribW = size / ribs;
    for (let r = 0; r < ribs; r++) {
      const rx = r * ribW;
      const grad = ctx.createLinearGradient(rx, 0, rx + ribW, 0);
      grad.addColorStop(0, "rgba(0,0,0,0.34)");
      grad.addColorStop(0.25, "rgba(255,255,255,0.08)");
      grad.addColorStop(0.55, "rgba(0,0,0,0.02)");
      grad.addColorStop(0.85, "rgba(0,0,0,0.22)");
      grad.addColorStop(1, "rgba(0,0,0,0.42)");
      ctx.fillStyle = grad;
      ctx.fillRect(rx, 0, ribW, size);
    }
  }

  return finalizeTexture(key, canvas, 1, 1, anisotropy, true);
}

export function getMarbleTexture(
  baseHex: string,
  veinHex: string,
  anisotropy = 4
): THREE.CanvasTexture {
  const key = `marble-${baseHex}-${veinHex}`;
  const existing = textureCache.get(key);
  if (existing) return existing;

  const size = 512;
  const [canvas, ctx] = createCanvas(size);

  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, size, size);

  // Subtle mineral clouding
  for (let i = 0; i < 28; i++) {
    const cx = ((i * 97) % size);
    const cy = ((i * 149) % size);
    const rad = 55 + ((i * 23) % 70);
    const g = ctx.createRadialGradient(cx, cy, 4, cx, cy, rad);
    g.addColorStop(0, veinHex);
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.globalAlpha = 0.05;
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  }

  // Natural marble veins
  for (let v = 0; v < 14; v++) {
    ctx.beginPath();
    let vx = (v * 43) % size;
    let vy = 0;
    ctx.moveTo(vx, vy);
    ctx.strokeStyle = veinHex;
    ctx.globalAlpha = v % 3 === 0 ? 0.36 : 0.16;
    ctx.lineWidth = v % 4 === 0 ? 2.1 : 0.9;
    for (let step = 1; step <= 18; step++) {
      vy = (step / 18) * size;
      vx += Math.sin(step * 0.7 + v * 1.9) * 22 + ((v % 2 === 0 ? 1 : -1) * 6);
      ctx.lineTo(vx, vy);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  return finalizeTexture(key, canvas, 1, 1, anisotropy, true);
}

export function getTileTexture(
  baseHex: string,
  groutHex: string,
  anisotropy = 4
): THREE.CanvasTexture {
  const key = `tile-${baseHex}-${groutHex}`;
  const existing = textureCache.get(key);
  if (existing) return existing;

  const size = 512;
  const [canvas, ctx] = createCanvas(size);

  ctx.fillStyle = groutHex;
  ctx.fillRect(0, 0, size, size);

  const cols = 8;
  const rows = 8;
  const pad = 4;
  const cellW = size / cols;
  const cellH = size / rows;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const offset = r % 2 === 1 ? cellW * 0.5 : 0;
      const x = ((c * cellW + offset) % size);
      const y = r * cellH;
      ctx.fillStyle = baseHex;
      ctx.globalAlpha = 0.88 + (((r * 7 + c * 11) % 5) * 0.025);
      ctx.fillRect(x + pad / 2, y + pad / 2, cellW - pad, cellH - pad);
      if (x + cellW > size) {
        ctx.fillRect(x - size + pad / 2, y + pad / 2, cellW - pad, cellH - pad);
      }
    }
  }
  ctx.globalAlpha = 1;

  return finalizeTexture(key, canvas, 3, 1.5, anisotropy, true);
}

export function getFloorPlankTexture(anisotropy = 4): THREE.CanvasTexture {
  const key = "floor-oak-limestone";
  const existing = textureCache.get(key);
  if (existing) return existing;

  const size = 512;
  const [canvas, ctx] = createCanvas(size);

  ctx.fillStyle = "#DDD4C6";
  ctx.fillRect(0, 0, size, size);

  const planks = 6;
  const plankH = size / planks;
  for (let i = 0; i < planks; i++) {
    const shade = 0.94 + ((i * 19) % 7) * 0.012;
    ctx.fillStyle = `rgba(214, 201, 182, ${shade})`;
    ctx.fillRect(0, i * plankH + 1, size, plankH - 2);

    ctx.strokeStyle = "rgba(120, 105, 88, 0.16)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, i * plankH);
    ctx.lineTo(size, i * plankH);
    ctx.stroke();

    // Vertical end joint
    const jointX = ((i * 190 + 95) % size);
    ctx.beginPath();
    ctx.moveTo(jointX, i * plankH);
    ctx.lineTo(jointX, (i + 1) * plankH);
    ctx.stroke();
  }

  return finalizeTexture(key, canvas, 5, 5, anisotropy, true);
}

export function getVastuCompassTexture(anisotropy = 4): THREE.CanvasTexture {
  const key = "vastu-compass-floor";
  const existing = textureCache.get(key);
  if (existing) return existing;

  const size = 1024;
  const [canvas, ctx] = createCanvas(size);
  const cx = size / 2;
  const cy = size / 2;

  ctx.clearRect(0, 0, size, size);

  // Outer architectural ring
  ctx.strokeStyle = "rgba(180, 83, 9, 0.55)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(cx, cy, 460, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = "rgba(20, 21, 23, 0.25)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, 380, 0, Math.PI * 2);
  ctx.stroke();

  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.arc(cx, cy, 260, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  const dirs = [
    { label: "N · KUBERA", angle: -Math.PI / 2, highlight: false },
    { label: "NE · ISHANYA", angle: -Math.PI / 4, highlight: true },
    { label: "E · INDRA", angle: 0, highlight: false },
    { label: "SE · AGNEYA (KITCHEN)", angle: Math.PI / 4, highlight: true },
    { label: "S · YAMA", angle: Math.PI / 2, highlight: false },
    { label: "SW · NAIRUTYA", angle: (Math.PI * 3) / 4, highlight: false },
    { label: "W · VARUNA", angle: Math.PI, highlight: false },
    { label: "NW · VAYAVYA", angle: (-Math.PI * 3) / 4, highlight: false },
  ];

  dirs.forEach((d) => {
    const x1 = cx + Math.cos(d.angle) * 180;
    const y1 = cy + Math.sin(d.angle) * 180;
    const x2 = cx + Math.cos(d.angle) * 455;
    const y2 = cy + Math.sin(d.angle) * 455;

    ctx.strokeStyle = d.highlight
      ? "rgba(180, 83, 9, 0.6)"
      : "rgba(20, 21, 23, 0.2)";
    ctx.lineWidth = d.highlight ? 3 : 1.5;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    const lx = cx + Math.cos(d.angle) * 418;
    const ly = cy + Math.sin(d.angle) * 418;
    ctx.save();
    ctx.translate(lx, ly);
    ctx.font = "600 22px 'Plus Jakarta Sans', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = d.highlight ? "#92400E" : "#141517";
    ctx.fillText(d.label, 0, 0);
    ctx.restore();
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = anisotropy;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  textureCache.set(key, tex);
  return tex;
}

export function disposeCachedTextures() {
  textureCache.forEach((tex) => tex.dispose());
  textureCache.clear();
}
