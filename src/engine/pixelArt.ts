import type {
  LineageId,
  PixelCoverSpec,
  PixelPortraitSpec,
} from '../types/game';

export interface LoreCoverSpec {
  seed: string;
  isFilm: boolean;
  accentColor: string;
  secondaryColor: string;
}

const BAYER_4X4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

export function hashSeed(input: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function createRng(seedStr: string): () => number {
  let state = hashSeed(seedStr) || 123456789;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 4294967296;
  };
}

export function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean.padEnd(6, '0');
  const num = parseInt(full.slice(0, 6), 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return (
    '#' +
    [clamp(r), clamp(g), clamp(b)]
      .map((v) => v.toString(16).padStart(2, '0'))
      .join('')
  );
}

export function shadeHex(hex: string, factor: number): string {
  const [r, g, b] = hexToRgb(hex);
  if (factor >= 0) {
    return rgbToHex(
      r + (255 - r) * factor,
      g + (255 - g) * factor,
      b + (255 - b) * factor
    );
  }
  const k = 1 + factor;
  return rgbToHex(r * k, g * k, b * k);
}

export function mixHex(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  return rgbToHex(ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t);
}

class PixelSurface {
  width: number;
  height: number;
  ctx: CanvasRenderingContext2D;
  img: ImageData;

  constructor(ctx: CanvasRenderingContext2D, width: number, height: number) {
    this.width = width;
    this.height = height;
    this.ctx = ctx;
    this.img = ctx.createImageData(width, height);
  }

  px(x: number, y: number, hex: string): void {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    if (ix < 0 || iy < 0 || ix >= this.width || iy >= this.height) return;
    const [r, g, b] = hexToRgb(hex);
    const idx = (iy * this.width + ix) * 4;
    this.img.data[idx] = r;
    this.img.data[idx + 1] = g;
    this.img.data[idx + 2] = b;
    this.img.data[idx + 3] = 255;
  }

  rect(x: number, y: number, w: number, h: number, hex: string): void {
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        this.px(x + dx, y + dy, hex);
      }
    }
  }

  ditherRect(
    x: number,
    y: number,
    w: number,
    h: number,
    hexA: string,
    hexB: string,
    mode: 'vertical' | 'horizontal' | 'radial' | 'flat' = 'vertical',
    ratio = 0.5
  ): void {
    const cx = x + w / 2;
    const cy = y + h / 2;
    const maxR = Math.hypot(w / 2, h / 2) || 1;
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        const pxX = x + dx;
        const pxY = y + dy;
        let t = ratio;
        if (mode === 'vertical') t = h > 1 ? dy / (h - 1) : 0;
        else if (mode === 'horizontal') t = w > 1 ? dx / (w - 1) : 0;
        else if (mode === 'radial') t = Math.min(1, Math.hypot(pxX - cx, pxY - cy) / maxR);
        const threshold = (BAYER_4X4[pxY & 3][pxX & 3] + 0.5) / 16;
        this.px(pxX, pxY, t > threshold ? hexB : hexA);
      }
    }
  }

  circle(cx: number, cy: number, r: number, hex: string, fill = true): void {
    const r2 = r * r;
    const inner2 = (r - 1.1) * (r - 1.1);
    for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
      for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
        const d2 = (x - cx) * (x - cx) + (y - cy) * (y - cy);
        if (fill ? d2 <= r2 : d2 <= r2 && d2 >= inner2) {
          this.px(x, y, hex);
        }
      }
    }
  }

  line(x0: number, y0: number, x1: number, y1: number, hex: string): void {
    let ix0 = Math.round(x0);
    let iy0 = Math.round(y0);
    const ix1 = Math.round(x1);
    const iy1 = Math.round(y1);
    const dx = Math.abs(ix1 - ix0);
    const dy = Math.abs(iy1 - iy0);
    const sx = ix0 < ix1 ? 1 : -1;
    const sy = iy0 < iy1 ? 1 : -1;
    let err = dx - dy;
    while (true) {
      this.px(ix0, iy0, hex);
      if (ix0 === ix1 && iy0 === iy1) break;
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        ix0 += sx;
      }
      if (e2 < dx) {
        err += dx;
        iy0 += sy;
      }
    }
  }

  border(x: number, y: number, w: number, h: number, hex: string): void {
    this.rect(x, y, w, 1, hex);
    this.rect(x, y + h - 1, w, 1, hex);
    this.rect(x, y, 1, h, hex);
    this.rect(x + w - 1, y, 1, h, hex);
  }

  flush(): void {
    this.ctx.putImageData(this.img, 0, 0);
  }
}

const SKIN_PALETTES: Array<{ base: string; shadow: string; highlight: string; lip: string }> = [
  { base: '#e2c29d', shadow: '#b8916b', highlight: '#efd6b8', lip: '#9e6759' },
  { base: '#d6ab82', shadow: '#a87c56', highlight: '#e6c39e', lip: '#8f5a4c' },
  { base: '#c18e64', shadow: '#8f613e', highlight: '#d5a881', lip: '#7a483c' },
  { base: '#996643', shadow: '#6b4228', highlight: '#b3805b', lip: '#5d342b' },
  { base: '#6e4730', shadow: '#492c1c', highlight: '#8a5e44', lip: '#45241e' },
];

const HAIR_DEFAULTS = ['#1c1917', '#33241b', '#573b26', '#8a4b2a', '#b88b4a', '#4a2545', '#2a4d5e'];

export function drawMusicianPortrait(
  canvas: HTMLCanvasElement,
  spec: PixelPortraitSpec
): void {
  const W = 48;
  const H = 48;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const s = new PixelSurface(ctx, W, H);
  const rng = createRng(spec.seed);

  // 1. Papers, Please style dithered passport backdrop
  const bgStyle = spec.bgStyle ?? 'booth';
  let bgTop = '#354038';
  let bgBot = '#222924';
  if (bgStyle === 'smoky') {
    bgTop = '#3a3542';
    bgBot = '#1f1c26';
  } else if (bgStyle === 'neon') {
    bgTop = '#293c4a';
    bgBot = '#1a2030';
  } else if (bgStyle === 'warm-paper') {
    bgTop = '#9e8f73';
    bgBot = '#6e624c';
  } else if (bgStyle === 'crimson') {
    bgTop = '#4d2727';
    bgBot = '#281616';
  }
  s.ditherRect(0, 0, W, H, bgTop, bgBot, 'vertical');

  // Subtle horizontal booth shutter / photo booth lines
  for (let y = 4; y < H; y += 6) {
    s.rect(1, y, W - 2, 1, shadeHex(bgBot, -0.15));
  }
  // Soft radial halo behind subject
  const accent = spec.accentColor ?? '#c29b57';
  s.ditherRect(10, 8, 28, 26, mixHex(bgTop, accent, 0.22), bgTop, 'radial');

  // Skin & hair palette selection
  const skinIdx =
    spec.skinTone !== undefined
      ? Math.max(0, Math.min(4, spec.skinTone))
      : Math.floor(rng() * SKIN_PALETTES.length);
  const skin = SKIN_PALETTES[skinIdx];
  const hairHex = spec.hairColor ?? HAIR_DEFAULTS[Math.floor(rng() * HAIR_DEFAULTS.length)];
  const hairDark = shadeHex(hairHex, -0.35);
  const hairLight = shadeHex(hairHex, 0.22);

  const hairStyles = [
    'afro',
    'spiky-punk',
    'shoegaze-bangs',
    'city-bob',
    'jazz-beret',
    'hiphop-cap',
    'hoodie-producer',
    'long-psych',
    'new-wave-crop',
    'pompadour',
    'locs',
    'retro-mullet',
  ] as const;
  const hairStyle = spec.hairStyle ?? hairStyles[Math.floor(rng() * hairStyles.length)];

  const outfits = [
    'leather-jacket',
    'jazz-suit',
    'flannel-cardigan',
    'turtleneck',
    'tracksuit',
    'haori-shirt',
    'workwear-denim',
  ] as const;
  const outfit = spec.outfit ?? outfits[Math.floor(rng() * outfits.length)];

  // Back hair layer (for long styles)
  if (
    hairStyle === 'long-psych' ||
    hairStyle === 'city-bob' ||
    hairStyle === 'locs' ||
    hairStyle === 'retro-mullet' ||
    hairStyle === 'shoegaze-bangs'
  ) {
    const backLen = hairStyle === 'city-bob' ? 33 : 38;
    s.rect(13, 14, 22, backLen - 14, hairDark);
    s.rect(14, 15, 20, backLen - 16, hairHex);
  }
  if (hairStyle === 'afro') {
    s.circle(24, 18, 12, hairDark, true);
    s.circle(24, 17, 11, hairHex, true);
    s.ditherRect(16, 8, 16, 6, hairLight, hairHex, 'vertical');
  }
  if (hairStyle === 'hoodie-producer') {
    s.circle(24, 20, 12, shadeHex(accent, -0.45), true);
  }

  // 2. Shoulders & Outfit (y = 33..47)
  const drawShoulders = (mainCol: string, darkCol: string) => {
    s.rect(8, 36, 32, 12, darkCol);
    s.rect(10, 34, 28, 14, mainCol);
    s.rect(13, 33, 22, 2, mainCol);
  };

  if (outfit === 'leather-jacket') {
    drawShoulders('#232326', '#141416');
    // Tee underneath
    s.rect(20, 34, 8, 14, '#d8cfb8');
    // Lapels + silver studs
    s.line(17, 34, 21, 44, '#3a3a40');
    s.line(30, 34, 26, 44, '#3a3a40');
    s.px(16, 37, '#d6d6d6');
    s.px(31, 37, '#d6d6d6');
    s.px(18, 40, '#d6d6d6');
  } else if (outfit === 'jazz-suit') {
    drawShoulders('#3d352e', '#26201b');
    // Crisp shirt + tie
    s.rect(20, 33, 8, 15, '#e6dec8');
    s.rect(23, 35, 2, 12, accent);
    s.line(18, 33, 22, 46, '#26201b');
    s.line(29, 33, 25, 46, '#26201b');
  } else if (outfit === 'flannel-cardigan') {
    const base = shadeHex(accent, -0.25);
    drawShoulders(base, shadeHex(base, -0.35));
    s.ditherRect(10, 35, 28, 12, base, shadeHex(base, -0.25), 'horizontal');
    s.rect(20, 34, 8, 14, '#cfc5ad');
  } else if (outfit === 'turtleneck') {
    drawShoulders('#1d2228', '#111418');
    s.rect(19, 30, 10, 6, '#262c34');
    s.rect(19, 31, 10, 1, '#363f4a');
  } else if (outfit === 'tracksuit') {
    const base = shadeHex(accent, -0.2);
    drawShoulders(base, shadeHex(base, -0.4));
    // Twin shoulder stripes
    s.rect(10, 35, 5, 2, '#ebe3cf');
    s.rect(33, 35, 5, 2, '#ebe3cf');
    s.rect(23, 34, 2, 14, '#ebe3cf');
  } else if (outfit === 'haori-shirt') {
    drawShoulders('#2c3a42', '#1b2429');
    s.line(19, 33, 25, 45, '#dfd4bc');
    s.line(28, 33, 23, 45, '#dfd4bc');
    s.rect(21, 34, 6, 6, '#9e3b33');
  } else {
    drawShoulders('#354a5e', '#22303d');
    s.rect(15, 39, 5, 5, '#293a4a');
    s.rect(28, 39, 5, 5, '#293a4a');
    s.px(17, 39, '#d4a64a');
    s.px(30, 39, '#d4a64a');
  }

  // 3. Neck & Head (Papers, Please shaded blocky-organic portrait)
  if (outfit !== 'turtleneck') {
    s.rect(20, 29, 8, 6, skin.shadow);
    s.rect(21, 29, 6, 4, skin.base);
  }

  // Ears
  s.rect(14, 19, 2, 5, skin.shadow);
  s.rect(32, 19, 2, 5, skin.shadow);

  // Face contour
  s.rect(16, 12, 16, 16, skin.base);
  s.rect(17, 11, 14, 18, skin.base);
  s.rect(19, 29, 10, 2, skin.base);
  // Left/bottom dramatic Papers-Please shadow
  s.ditherRect(16, 13, 4, 15, skin.shadow, skin.base, 'horizontal');
  s.rect(19, 28, 10, 2, skin.shadow);
  s.rect(17, 26, 2, 2, skin.shadow);
  s.rect(29, 26, 2, 2, skin.shadow);
  // Forehead highlight
  s.rect(22, 13, 6, 2, skin.highlight);

  // 4. Facial features
  // Eyebrows
  s.rect(18, 17, 4, 1, hairDark);
  s.rect(26, 17, 4, 1, hairDark);
  // Eyes
  s.rect(18, 19, 4, 2, '#e8e2d3');
  s.rect(26, 19, 4, 2, '#e8e2d3');
  s.rect(19, 19, 2, 2, '#1c1b19');
  s.rect(27, 19, 2, 2, '#1c1b19');
  // Under-eye subtle shadow (authentic Papers, Please vibe)
  s.rect(18, 21, 4, 1, skin.shadow);
  s.rect(26, 21, 4, 1, skin.shadow);

  // Nose
  s.rect(23, 19, 2, 5, skin.shadow);
  s.rect(24, 19, 1, 4, skin.highlight);
  s.rect(22, 23, 4, 1, skin.shadow);

  // Facial hair
  const facial = spec.facialHair ?? (rng() > 0.72 ? 'stubble' : 'none');
  if (facial === 'stubble') {
    s.ditherRect(18, 25, 12, 4, skin.shadow, hairDark, 'flat', 0.35);
  } else if (facial === 'mustache') {
    s.rect(20, 25, 8, 2, hairDark);
  } else if (facial === 'goatee') {
    s.rect(20, 25, 8, 1, hairDark);
    s.rect(21, 28, 6, 3, hairDark);
  }

  // Mouth
  s.rect(21, 26, 6, 1, skin.lip);
  s.rect(22, 27, 4, 1, shadeHex(skin.shadow, -0.1));

  // 5. Front Hair / Hats
  if (hairStyle === 'spiky-punk') {
    s.rect(16, 9, 16, 4, hairHex);
    for (let x = 16; x <= 30; x += 3) {
      s.rect(x, 5 + ((x * 7) % 3), 2, 5, hairHex);
      s.px(x, 5 + ((x * 7) % 3), hairLight);
    }
  } else if (hairStyle === 'shoegaze-bangs') {
    s.rect(15, 9, 18, 6, hairHex);
    // Asymmetric long bangs covering left eye
    s.rect(15, 14, 9, 7, hairHex);
    s.rect(24, 14, 4, 3, hairDark);
    s.line(17, 10, 17, 19, hairLight);
  } else if (hairStyle === 'city-bob') {
    s.rect(14, 9, 20, 6, hairHex);
    s.rect(14, 14, 3, 14, hairHex);
    s.rect(31, 14, 3, 14, hairHex);
    s.rect(17, 13, 14, 2, hairDark);
    s.rect(18, 10, 10, 1, hairLight);
  } else if (hairStyle === 'jazz-beret') {
    s.rect(16, 11, 16, 3, hairDark);
    // Slanted beret / fedora
    s.rect(13, 8, 21, 4, '#2a2421');
    s.rect(15, 6, 16, 3, '#3d342f');
    s.rect(12, 11, 23, 1, '#1a1614');
    s.rect(16, 10, 16, 1, accent);
  } else if (hairStyle === 'hiphop-cap') {
    s.rect(15, 7, 18, 6, accent);
    s.rect(16, 6, 16, 2, shadeHex(accent, 0.2));
    // Flat brim
    s.rect(14, 12, 22, 2, shadeHex(accent, -0.35));
    s.rect(22, 8, 4, 3, '#ebe3cf');
  } else if (hairStyle === 'hoodie-producer') {
    const hoodCol = shadeHex(accent, -0.3);
    const hoodDark = shadeHex(accent, -0.55);
    s.rect(13, 7, 22, 6, hoodCol);
    s.rect(12, 11, 4, 22, hoodCol);
    s.rect(32, 11, 4, 22, hoodCol);
    s.rect(15, 12, 2, 18, hoodDark);
    s.rect(31, 12, 2, 18, hoodDark);
  } else if (hairStyle === 'long-psych') {
    s.rect(14, 8, 20, 5, hairHex);
    // Center part + headband
    s.rect(23, 8, 2, 5, hairDark);
    s.rect(15, 13, 18, 2, accent);
    s.rect(14, 14, 3, 20, hairHex);
    s.rect(31, 14, 3, 20, hairHex);
  } else if (hairStyle === 'pompadour') {
    s.rect(15, 7, 19, 6, hairHex);
    s.rect(17, 5, 15, 3, hairLight);
    s.rect(15, 12, 2, 6, hairDark);
    s.rect(31, 12, 2, 6, hairDark);
  } else if (hairStyle === 'locs') {
    s.rect(14, 8, 20, 6, hairDark);
    for (let x = 13; x <= 33; x += 3) {
      if (x <= 16 || x >= 31) {
        s.rect(x, 12, 2, 22, hairHex);
        s.px(x, 16, hairDark);
        s.px(x, 22, hairDark);
      }
    }
  } else if (hairStyle === 'retro-mullet') {
    s.rect(15, 8, 18, 5, hairHex);
    s.rect(17, 7, 14, 2, hairLight);
    s.rect(16, 13, 4, 2, hairHex);
    s.rect(28, 13, 4, 2, hairHex);
  } else if (hairStyle === 'afro') {
    s.rect(16, 10, 16, 3, hairHex);
  } else {
    // new-wave-crop
    s.rect(16, 9, 16, 4, hairHex);
    s.rect(16, 12, 7, 2, hairLight);
    s.rect(15, 11, 2, 6, hairDark);
    s.rect(31, 11, 2, 6, hairDark);
  }

  // 6. Eyewear
  const glasses = spec.glasses ?? 'none';
  if (glasses === 'thick-rim') {
    s.border(17, 18, 6, 4, '#1b1918');
    s.border(25, 18, 6, 4, '#1b1918');
    s.rect(23, 19, 2, 1, '#1b1918');
    s.px(18, 19, '#ffffff');
    s.px(26, 19, '#ffffff');
  } else if (glasses === 'shades') {
    s.rect(17, 18, 6, 4, '#141416');
    s.rect(25, 18, 6, 4, '#141416');
    s.rect(16, 18, 16, 1, '#2f2f35');
    s.line(18, 20, 20, 18, '#7c8a99');
    s.line(26, 20, 28, 18, '#7c8a99');
  } else if (glasses === 'round-specs') {
    s.border(17, 18, 5, 4, '#c7a158');
    s.border(26, 18, 5, 4, '#c7a158');
    s.rect(22, 19, 4, 1, '#c7a158');
  } else if (glasses === 'visor') {
    s.rect(16, 18, 16, 3, accent);
    s.rect(17, 19, 14, 1, '#ffffff');
  }

  // 7. Musician Props in Foreground / Neck
  const prop = spec.prop ?? 'none';
  if (prop === 'headphones') {
    s.rect(16, 31, 5, 4, '#29292e');
    s.rect(27, 31, 5, 4, '#29292e');
    s.rect(17, 32, 3, 2, accent);
    s.rect(28, 32, 3, 2, accent);
  } else if (prop === 'sax' || prop === 'trumpet') {
    // Golden brass horn silhouette in bottom-right corner
    s.line(34, 46, 39, 32, '#d4a446');
    s.line(35, 46, 40, 32, '#f0c975');
    s.circle(41, 41, 4, '#d4a446', true);
    s.circle(41, 41, 2, '#2a2015', true);
  } else if (prop === 'guitar') {
    // Angled guitar neck + tuning pegs on right side
    s.line(35, 47, 43, 27, '#5c3a24');
    s.line(36, 47, 44, 27, '#8c5b3a');
    s.rect(41, 23, 5, 6, accent);
    s.px(40, 24, '#e0e0e0');
    s.px(40, 27, '#e0e0e0');
  } else if (prop === 'mic') {
    // Classic studio broadcast mic in foreground
    s.rect(22, 39, 4, 9, '#2b2d30');
    s.rect(20, 34, 8, 6, '#8f969e');
    s.ditherRect(21, 35, 6, 4, '#bcc3cc', '#555b63', 'horizontal');
  } else if (prop === 'synth-patch') {
    s.line(8, 43, 18, 38, '#e05a47');
    s.line(32, 39, 42, 45, '#47b8e0');
  }

  // 8. Official passport frame & corner crop marks
  s.border(0, 0, W, H, '#181512');
  s.border(1, 1, W - 2, H - 2, '#aba087');
  // Registration ticks
  s.rect(3, 3, 3, 1, '#aba087');
  s.rect(3, 3, 1, 3, '#aba087');
  s.rect(W - 6, 3, 3, 1, '#aba087');
  s.rect(W - 4, 3, 1, 3, '#aba087');

  s.flush();
}

function drawMicroTextBar(
  s: PixelSurface,
  x: number,
  y: number,
  maxWidth: number,
  hex: string,
  rng: () => number
): void {
  let cx = x;
  while (cx < x + maxWidth - 2) {
    const seg = 2 + Math.floor(rng() * 5);
    if (cx + seg > x + maxWidth) break;
    s.rect(cx, y, seg, 2, hex);
    cx += seg + 2;
  }
}

export function drawAlbumCover(
  canvas: HTMLCanvasElement,
  spec: PixelCoverSpec
): void {
  const W = 64;
  const H = 64;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const s = new PixelSurface(ctx, W, H);
  const rng = createRng(spec.seed);
  const c1 = spec.primaryColor;
  const c2 = spec.secondaryColor;
  const acc = spec.accentColor;

  if (spec.archetype === 'blue-note') {
    // Classic Reid Miles Blue Note typography + duotone jazz block
    s.rect(0, 0, W, H, '#121820');
    s.ditherRect(4, 22, W - 8, 38, c1, shadeHex(c1, -0.45), 'vertical');
    // Bold typographic bars top-right
    s.rect(18, 6, 40, 4, '#ece4d0');
    s.rect(28, 12, 30, 3, acc);
    drawMicroTextBar(s, 18, 17, 40, '#9eb0c2', rng);
    // Duotone musician silhouette + brass horn
    s.circle(24, 38, 9, shadeHex(c1, -0.6), true);
    s.rect(14, 46, 20, 14, shadeHex(c1, -0.65));
    s.circle(42, 44, 7, acc, true);
    s.circle(42, 44, 3, '#121820', true);
    s.line(31, 40, 40, 44, acc);
  } else if (spec.archetype === 'joy-waveform') {
    // Unknown Pleasures / Coldwave stacked pulsar ridges
    s.rect(0, 0, W, H, c1);
    for (let row = 0; row < 13; row++) {
      const baseY = 13 + row * 3.4;
      let prevX = 10;
      let prevY = baseY;
      for (let x = 11; x <= 53; x += 2) {
        const distCenter = Math.abs(x - 32);
        const env = Math.max(0, 1 - distCenter / 15);
        const peak = env * env * (3 + rng() * 7);
        const ny = baseY - peak;
        // Mask behind ridge
        s.rect(x - 1, Math.floor(ny) + 1, 2, Math.max(1, Math.ceil(baseY - ny)), c1);
        s.line(prevX, prevY, x, ny, acc);
        prevX = x;
        prevY = ny;
      }
    }
    drawMicroTextBar(s, 16, 6, 32, c2, rng);
  } else if (spec.archetype === 'shoegaze-wash') {
    // Loveless / Dream Pop motion-blur horizontal pedal wash
    s.ditherRect(0, 0, W, H, c1, c2, 'vertical');
    for (let y = 4; y < H - 4; y += 2) {
      const wave = Math.sin(y * 0.22 + rng() * 1.4) * 12;
      const bandCol = y % 4 === 0 ? acc : mixHex(c1, acc, 0.45);
      s.ditherRect(
        Math.max(2, Math.floor(8 + wave)),
        y,
        Math.floor(38 + rng() * 14),
        2,
        bandCol,
        c2,
        'horizontal'
      );
    }
    // Ethereal diagonal guitar streak
    s.line(8, 54, 54, 14, shadeHex(acc, 0.35));
    s.line(9, 55, 55, 15, shadeHex(acc, 0.2));
    s.rect(6, 6, 26, 5, '#17131c');
    drawMicroTextBar(s, 8, 8, 22, '#f2e8eb', rng);
  } else if (spec.archetype === 'punk-ransom') {
    // Punk / Dakou high-contrast xerox slash + ransom blocks
    s.rect(0, 0, W, H, '#ebe3cf');
    // Bold diagonal slash banner
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (x + y * 0.7 > 26 && x + y * 0.7 < 58) {
          s.px(x, y, c1);
        } else if ((x + y) % 5 === 0 && rng() > 0.65) {
          s.px(x, y, '#bdb39d');
        }
      }
    }
    // Xerox halftone circle
    s.ditherRect(14, 18, 34, 30, '#181615', c2, 'radial');
    // Ransom-note cut-out letter blocks
    s.rect(6, 8, 24, 7, '#181615');
    drawMicroTextBar(s, 8, 10, 20, acc, rng);
    s.rect(28, 48, 28, 8, acc);
    drawMicroTextBar(s, 30, 51, 24, '#181615', rng);
  } else if (spec.archetype === 'city-neon') {
    // 80s Japanese City Pop sunset + ocean horizon + skyline
    s.ditherRect(0, 0, W, 36, c1, c2, 'vertical');
    // Retro striped sun
    s.circle(34, 23, 11, acc, true);
    for (let y = 24; y <= 34; y += 3) {
      s.rect(22, y, 25, 1, c2);
    }
    // City skyline silhouette
    const buildings = [8, 14, 10, 19, 12, 22, 15, 9, 16, 11];
    buildings.forEach((bh, idx) => {
      const bx = 4 + idx * 6;
      s.rect(bx, 36 - bh, 5, bh, '#181626');
      if (bh > 13) s.px(bx + 2, 38 - bh, '#f7d87c');
    });
    // Ocean reflection grid
    s.ditherRect(0, 36, W, 28, '#171c36', '#0e1121', 'vertical');
    for (let y = 38; y < 60; y += 3) {
      const rw = Math.max(4, 24 - (y - 36));
      s.rect(34 - Math.floor(rw / 2), y, rw, 1, acc);
    }
  } else if (spec.archetype === 'electronic-grid') {
    // Warp / Kraftwerk / IDM geometric grid + oscilloscope
    s.rect(0, 0, W, H, c1);
    for (let x = 8; x < W; x += 8) s.line(x, 0, x, H, shadeHex(c1, 0.14));
    for (let y = 8; y < H; y += 8) s.line(0, y, W, y, shadeHex(c1, 0.14));
    // Isometric / Bauhaus nodes
    s.border(12, 12, 40, 40, c2);
    s.circle(32, 32, 13, acc, false);
    s.circle(32, 32, 5, c2, true);
    s.line(12, 32, 52, 32, acc);
    s.line(32, 12, 32, 52, acc);
    drawMicroTextBar(s, 14, 6, 36, '#e6edf2', rng);
  } else if (spec.archetype === 'hiphop-crate') {
    // Boom-bap street brick dither + MPC 4x4 drum pads
    s.ditherRect(0, 0, W, H, c1, shadeHex(c1, -0.35), 'vertical');
    s.rect(10, 16, 44, 40, '#24211e');
    s.border(10, 16, 44, 40, '#8c8273');
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const lit = (r === 1 && c === 1) || rng() > 0.65;
        s.rect(15 + c * 12, 22 + r * 10, 9, 7, lit ? acc : c2);
      }
    }
    s.rect(8, 6, 48, 7, acc);
    drawMicroTextBar(s, 11, 8, 42, '#181512', rng);
  } else if (spec.archetype === 'psych-mandala') {
    // World Psych / Folk mandala sun & botanical symmetry
    s.ditherRect(0, 0, W, H, c1, c2, 'radial');
    s.circle(32, 32, 22, acc, false);
    s.circle(32, 32, 16, c2, true);
    s.circle(32, 32, 11, acc, true);
    s.circle(32, 32, 5, c1, true);
    for (let a = 0; a < 8; a++) {
      const ang = (a * Math.PI) / 4;
      s.line(
        32 + Math.cos(ang) * 12,
        32 + Math.sin(ang) * 12,
        32 + Math.cos(ang) * 24,
        32 + Math.sin(ang) * 24,
        acc
      );
    }
  } else if (spec.archetype === 'industrial-brutalist') {
    // Industrial / Noise Rock concrete monolith + hazard stripes
    s.ditherRect(0, 0, W, H, c1, '#141414', 'vertical');
    // Brutalist tower
    s.rect(20, 10, 24, 44, c2);
    s.ditherRect(20, 10, 8, 44, shadeHex(c2, -0.35), c2, 'horizontal');
    for (let y = 16; y < 48; y += 6) {
      s.rect(25, y, 4, 3, '#141414');
      s.rect(35, y, 4, 3, '#141414');
    }
    // Hazard bar at bottom
    for (let x = 4; x < 60; x += 6) {
      s.rect(x, 54, 3, 5, acc);
      s.rect(x + 3, 54, 3, 5, '#181615');
    }
  } else {
    // minimal-bauhaus
    s.rect(0, 0, W, H, '#e8dfc8');
    s.rect(8, 12, 24, 24, c1);
    s.circle(40, 38, 14, acc, true);
    s.rect(14, 42, 32, 6, '#1c1a17');
    drawMicroTextBar(s, 8, 6, 36, '#1c1a17', rng);
  }

  // Optional East-Asian Obi-strip (侧标) on left edge!
  if (spec.hasObiStrip) {
    s.rect(3, 1, 9, H - 2, '#efe8d5');
    s.rect(3, 1, 9, 12, acc);
    s.border(3, 1, 9, H - 2, '#24201b');
    for (let y = 16; y < H - 8; y += 4) {
      s.rect(6, y, 3, 2, '#24201b');
    }
  }

  // Subtle vinyl ring-wear & crisp outer sleeve frame
  s.circle(32, 32, 28, shadeHex(c1, 0.18), false);
  s.border(0, 0, W, H, '#171411');
  s.border(1, 1, W - 2, H - 2, shadeHex(c1, 0.25));

  s.flush();
}

export function drawSingle7Inch(
  canvas: HTMLCanvasElement,
  spec: PixelCoverSpec,
  spinningAngle = 0
): void {
  const W = 72;
  const H = 60;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const s = new PixelSurface(ctx, W, H);
  // Transparent/desk background outside sleeve & disc -> fill warm dark mat shadow first
  s.rect(0, 0, W, H, '#dfd3b8');

  // 1. 7" 45RPM black vinyl disc peeking out to the right (center at x=45, y=30)
  const vcx = 45;
  const vcy = 30;
  s.circle(vcx, vcy, 24, '#141416', true);
  s.circle(vcx, vcy, 22, '#232328', false);
  s.circle(vcx, vcy, 18, '#202026', false);
  s.circle(vcx, vcy, 15, '#26262e', false);
  // Specular vinyl groove sheen
  const gx = Math.cos(spinningAngle) * 20;
  const gy = Math.sin(spinningAngle) * 20;
  s.line(vcx - gx * 0.4, vcy - gy * 0.4, vcx + gx, vcy + gy, '#444854');
  // Center paper label + 45RPM brass spider insert
  s.circle(vcx, vcy, 9, spec.accentColor, true);
  s.circle(vcx, vcy, 4, '#dfd3b8', true);
  s.circle(vcx, vcy, 2, '#c79b42', false);

  // 2. Left 7" paper sleeve (48x52 at x=3, y=4)
  s.rect(3, 4, 46, 52, spec.primaryColor);
  s.ditherRect(4, 5, 44, 50, spec.primaryColor, spec.secondaryColor, 'vertical');
  // Decorative geometric strip on sleeve
  s.rect(6, 8, 40, 6, spec.accentColor);
  s.rect(8, 10, 22, 2, '#1a1715');
  // Die-cut center window revealing vinyl label edge
  s.circle(26, 33, 12, '#18181b', true);
  s.circle(26, 33, 8, spec.accentColor, true);
  s.circle(26, 33, 3, '#dfd3b8', true);
  s.border(3, 4, 46, 52, '#1a1613');

  s.flush();
}

export function drawLoreCover(
  canvas: HTMLCanvasElement,
  lore: LoreCoverSpec
): void {
  const W = 52;
  const H = 64;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const s = new PixelSurface(ctx, W, H);
  const rng = createRng(lore.seed);

  s.rect(0, 0, W, H, '#d8ccb2');

  if (lore.isFilm) {
    // VHS / Criterion Film Sleeve aesthetic
    s.rect(4, 3, 44, 58, '#1c1d22');
    s.ditherRect(6, 6, 40, 28, lore.secondaryColor, '#141519', 'vertical');
    // Film perforations along left & right
    for (let y = 6; y < 58; y += 5) {
      s.rect(6, y, 2, 3, '#dcd3be');
      s.rect(44, y, 2, 3, '#dcd3be');
    }
    //VHS twin spools window at bottom
    s.rect(11, 38, 30, 12, '#2d3038');
    s.circle(19, 44, 4, '#e6dec8', true);
    s.circle(33, 44, 4, '#e6dec8', true);
    s.circle(19, 44, 1.5, '#1c1d22', true);
    s.circle(33, 44, 1.5, '#1c1d22', true);
    // Accent title strip
    s.rect(10, 14, 32, 6, lore.accentColor);
    drawMicroTextBar(s, 12, 16, 28, '#171513', rng);
    drawMicroTextBar(s, 11, 53, 30, lore.accentColor, rng);
    s.border(4, 3, 44, 58, '#0f0f12');
  } else {
    // Iconic Music Book / Oral History Hardcover
    // 3D Spine on left
    s.rect(4, 4, 6, 56, shadeHex(lore.secondaryColor, -0.35));
    s.rect(10, 4, 37, 56, lore.secondaryColor);
    // Page edges at top/right
    s.rect(9, 2, 38, 2, '#efe7d1');
    s.rect(47, 4, 2, 55, '#d6cbb0');
    // Cover design block
    s.rect(14, 10, 29, 10, lore.accentColor);
    drawMicroTextBar(s, 16, 13, 25, '#1a1714', rng);
    drawMicroTextBar(s, 16, 17, 18, '#1a1714', rng);
    // Central emblem
    s.ditherRect(15, 24, 27, 24, shadeHex(lore.secondaryColor, -0.25), lore.accentColor, 'radial');
    s.circle(28, 36, 8, '#ebe2cc', false);
    s.circle(28, 36, 3, lore.accentColor, true);
    // Publisher colophon bottom
    drawMicroTextBar(s, 16, 53, 24, '#ebe2cc', rng);
    s.border(4, 4, 43, 56, '#171411');
  }

  s.flush();
}

export function drawBoothWindow(
  canvas: HTMLCanvasElement,
  lineage: LineageId,
  isPlaying: boolean,
  tick: number,
  collectedCount: number
): void {
  const W = 220;
  const H = 56;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const s = new PixelSurface(ctx, W, H);

  // Palette per lineage for window night sky
  const skyMap: Record<LineageId, [string, string, string]> = {
    jazz: ['#1c2233', '#2e2536', '#e0a44c'],
    'punk-postpunk': ['#1e2426', '#2e3538', '#cf4848'],
    'shoegaze-indie': ['#291d36', '#4a2849', '#e37aa8'],
    'electronic-idm': ['#12222b', '#1b3b44', '#4ce0c2'],
    hiphop: ['#261e18', '#3d2c20', '#e09b3d'],
    'artpop-citypop': ['#211c3d', '#472652', '#ff7a9e'],
    'folk-psych': ['#1f291e', '#364229', '#d6b85a'],
    'heavy-industrial': ['#1c1919', '#332422', '#d95b38'],
  };
  const [skyTop, skyBot, glow] = skyMap[lineage];

  // Outer booth olive concrete wall
  s.ditherRect(0, 0, W, H, '#2a332d', '#1d2420', 'vertical');

  // LEFT PANEL: Border Inspection Window (x=6..126, y=5..50)
  s.ditherRect(8, 6, 116, 42, skyTop, skyBot, 'vertical');

  // Distant city blocks in window
  const heights = [16, 24, 19, 28, 14, 22, 26, 18, 21];
  heights.forEach((bh, i) => {
    const bx = 12 + i * 12;
    s.rect(bx, 46 - bh, 10, bh, '#13171a');
    if ((i + Math.floor(tick / 6)) % 3 === 0) {
      s.rect(bx + 3, 50 - bh, 2, 2, glow);
    }
    if (bh > 20) {
      s.rect(bx + 6, 54 - bh, 2, 2, '#b8b094');
    }
  });

  // Silhouette of music courier / visitor standing at booth window
  const bob = Math.round(Math.sin(tick * 0.25) * 1);
  s.circle(64, 23 + bob, 6, '#0d1012', true);
  s.rect(54, 30 + bob, 20, 18 - bob, '#0d1012');
  // Record sleeve held by visitor at slot
  s.rect(72, 33 + bob, 12, 12, glow);
  s.border(72, 33 + bob, 12, 12, '#141414');

  // Papers, Please security window horizontal & vertical bars
  for (let x = 28; x < 120; x += 24) {
    s.rect(x, 6, 2, 42, '#3d4a41');
  }
  s.rect(8, 22, 116, 1, '#3d4a41');
  // Brass pass-through slot at bottom of window
  s.rect(42, 45, 48, 4, '#111412');
  s.border(6, 5, 120, 44, '#4b594f');
  s.rect(4, 49, 124, 3, '#6e6049');

  // RIGHT PANEL: Inspector's Analog Turntable & VU Meter (x=134..214, y=5..50)
  s.rect(134, 6, 80, 44, '#1b1917');
  s.border(134, 6, 80, 44, '#595042');

  // Pixel Turntable Platter
  const px = 158;
  const py = 28;
  s.circle(px, py, 16, '#363430', true);
  s.circle(px, py, 14, '#111113', true);
  const angle = isPlaying ? tick * 0.45 : 0.6;
  s.line(
    px - Math.cos(angle) * 12,
    py - Math.sin(angle) * 12,
    px + Math.cos(angle) * 12,
    py + Math.sin(angle) * 12,
    '#323540'
  );
  s.circle(px, py, 5, glow, true);
  s.circle(px, py, 1.5, '#e8dfc8', true);
  // Tonearm
  s.rect(175, 11, 4, 4, '#9e9788');
  if (isPlaying) {
    s.line(176, 14, 166, 32, '#cfc7b4');
  } else {
    s.line(176, 14, 176, 36, '#cfc7b4');
  }
  // Strobe LED
  s.rect(139, 42, 3, 3, isPlaying ? '#e0533c' : '#522922');

  // Live 5-column VU meter + crate counter LEDs
  for (let col = 0; col < 5; col++) {
    const level = isPlaying
      ? 2 + ((Math.abs(Math.sin(tick * 0.7 + col * 1.3)) * 7) | 0)
      : 1 + (col === 2 ? 1 : 0);
    for (let seg = 0; seg < 8; seg++) {
      const sy = 42 - seg * 4;
      const on = seg < level;
      let segCol = '#28302a';
      if (on) {
        segCol = seg >= 6 ? '#cf4848' : seg >= 4 ? '#d9a74a' : '#45b069';
      }
      s.rect(185 + col * 5, sy, 3, 3, segCol);
    }
  }

  // Mini crate count indicator dots along top-right
  for (let i = 0; i < Math.min(10, collectedCount); i++) {
    s.rect(138 + i * 4, 8, 2, 2, '#d9a74a');
  }

  s.border(0, 0, W, H, '#121614');
  s.flush();
}
