// The landing films: one .FLI per kind of world (D<BIOME>.FLI), seen from the pod's
// cockpit. The planet swells in the canopy, the entry burns, and the pod drops out of that
// world's own sky onto its own ground: green hills, dunes, ice teeth, lava, mushroom
// forests, crystal spires; a splash and a dive for the seas; a docking bay for stations.
// Only the canopy changes from frame to frame, so each film stays small.
import { encodeFli } from '../../../../web/src/formats/fli';
import { rng } from '../../../kit/pixels';
import { Canvas } from '../art/canvas';
import { SCREEN, planetArt } from './screens';
import { WHITE, shared } from '../art/palette';
import type { Biome } from '../art/roles';

const C = (n: string) => SCREEN.ramps.get(n) ?? shared.get(n)!;

/** The canopy: what changes. */
const WX = 48;
const WY = 14;
const WW = 224;
const WH = 110;

interface Look {
  /** the dashboard label */
  label: string;
  /** sky ramp, top shade, bottom shade */
  sky: [string, number, number];
  /** cloud ramp and shade */
  cloud: [string, number];
  /** ground ramp: far shade, near shade */
  ground: [string, number, number];
  /** accent: ramp, shade (trees, cracks, crystals, caps...) */
  accent: [string, number];
  shape: 'hills' | 'dunes' | 'peaks' | 'canopy' | 'lava' | 'volcano' | 'pools' | 'mushrooms' | 'spires' | 'sea' | 'dock';
  /** particles in the air: snow, ash, spores... */
  motes?: [string, number];
  /** the entry glow (ramp) */
  burn: string;
}

const LOOKS: Partial<Record<Biome, Look>> = {
  verdant: { label: 'GREEN WORLD', sky: ['blue', 3, 6], cloud: ['ice', 7], ground: ['green', 3, 5], accent: ['green', 1], shape: 'hills', burn: 'orange' },
  autumn: { label: 'AUTUMN WORLD', sky: ['orange', 4, 6], cloud: ['sand', 7], ground: ['brown', 3, 5], accent: ['orange', 5], shape: 'hills', burn: 'red' },
  desert: { label: 'DESERT WORLD', sky: ['yellow', 5, 7], cloud: ['sand', 7], ground: ['sand', 4, 6], accent: ['orange', 4], shape: 'dunes', burn: 'orange' },
  ice: {
    label: 'ICE WORLD',
    sky: ['ice', 4, 6],
    cloud: ['ice', 7],
    ground: ['ice', 5, 7],
    accent: ['cyan', 4],
    shape: 'peaks',
    motes: ['ice', 7],
    burn: 'cyan',
  },
  jungle: { label: 'JUNGLE WORLD', sky: ['lime', 4, 6], cloud: ['green', 6], ground: ['green', 1, 3], accent: ['lime', 4], shape: 'canopy', burn: 'yellow' },
  lava: { label: 'LAVA WORLD', sky: ['red', 1, 3], cloud: ['gray', 2], ground: ['brown', 0, 1], accent: ['orange', 6], shape: 'lava', burn: 'yellow' },
  ash: {
    label: 'ASH WORLD',
    sky: ['gray', 1, 3],
    cloud: ['gray', 4],
    ground: ['gray', 1, 2],
    accent: ['red', 5],
    shape: 'volcano',
    motes: ['gray', 5],
    burn: 'red',
  },
  toxic: {
    label: 'TOXIC WORLD',
    sky: ['violet', 2, 4],
    cloud: ['lime', 5],
    ground: ['violet', 1, 2],
    accent: ['lime', 6],
    shape: 'pools',
    motes: ['lime', 6],
    burn: 'lime',
  },
  fungal: {
    label: 'SPORE WORLD',
    sky: ['magenta', 2, 4],
    cloud: ['magenta', 6],
    ground: ['brown', 1, 2],
    accent: ['magenta', 5],
    shape: 'mushrooms',
    motes: ['magenta', 6],
    burn: 'magenta',
  },
  crystal: {
    label: 'CRYSTAL WORLD',
    sky: ['violet', 0, 2],
    cloud: ['violet', 4],
    ground: ['violet', 1, 3],
    accent: ['cyan', 6],
    shape: 'spires',
    burn: 'cyan',
  },
  ocean: { label: 'OCEAN WORLD', sky: ['cyan', 4, 6], cloud: ['ice', 7], ground: ['blue', 3, 5], accent: ['cyan', 6], shape: 'sea', burn: 'orange' },
  abyss: { label: 'DEEP SEA WORLD', sky: ['violet', 1, 2], cloud: ['gray', 3], ground: ['blue', 0, 2], accent: ['cyan', 5], shape: 'sea', burn: 'violet' },
  station: { label: 'STATION', sky: ['space', 0, 1], cloud: ['gray', 5], ground: ['gray', 2, 4], accent: ['yellow', 6], shape: 'dock', burn: 'cyan' },
};

/** The biomes that get a film of their own (every world's biome). */
export const DESCENT_BIOMES = Object.keys(LOOKS) as Biome[];
export const descentFile = (b: Biome) => `d${b}.fli`;

/** The cockpit around the canopy, with the dashboard and its fixed lettering. */
function cockpit(c: Canvas, look: Look): void {
  const hull = C('gray');
  // the frame: everything outside the canopy
  for (let y = 0; y < 200; y++)
    for (let x = 0; x < 320; x++) {
      if (x >= WX && x < WX + WW && y >= WY && y < WY + WH) continue;
      const edge = Math.min(Math.abs(x - WX), Math.abs(x - (WX + WW - 1)), Math.abs(y - WY), Math.abs(y - (WY + WH - 1)));
      c.set(x, y, y > 150 ? hull[1] : edge < 3 ? hull[4] : hull[2]);
    }
  // canopy struts
  c.rect(WX - 4, WY - 4, WW + 8, 2, hull[5]).rect(WX - 4, WY + WH + 2, WW + 8, 2, hull[0]);
  c.rect(WX - 4, WY - 4, 2, WH + 8, hull[5]).rect(WX + WW + 2, WY - 4, 2, WH + 8, hull[0]);
  for (const [x, y] of [
    [WX - 12, WY + 6],
    [WX + WW + 8, WY + 6],
    [WX - 12, WY + WH - 10],
    [WX + WW + 8, WY + WH - 10],
  ])
    c.rect(x, y, 4, 4, hull[5]).set(x + 1, y + 1, WHITE);
  // dashboard
  c.panel(20, 140, 280, 54, C('space')[1], hull[4], hull[5]);
  c.text(30, 146, look.shape === 'dock' ? 'APPROACH' : 'DESCENT', C('cyan')[6]);
  c.text(30, 158, look.label, C('yellow')[6]);
  c.text(196, 146, look.shape === 'dock' ? 'RANGE' : 'ALTITUDE', C('cyan')[5]);
  // gauge lamps (static)
  for (let i = 0; i < 6; i++) c.rect(30 + i * 14, 174, 10, 6, [C('green')[5], C('green')[5], C('yellow')[6], C('green')[5], C('red')[5], C('green')[4]][i]);
  c.text(126, 174, 'MAXIMUS', C('gray')[4]);
}

/** A ridge line: heights across the canopy for one layer of ground. */
function ridge(seed: number, shape: Look['shape'], layer: number): number[] {
  const r = rng(seed * 31 + layer * 7);
  const ph = [r() * 6, r() * 6, r() * 6];
  const out: number[] = [];
  for (let x = 0; x < WW; x++) {
    const u = x / WW;
    let h: number;
    switch (shape) {
      case 'peaks':
      case 'spires': {
        const saw = Math.abs(((u * (5 + layer * 2) + ph[0]) % 1) - 0.5) * 2;
        h = (1 - saw) * (shape === 'spires' ? 26 : 18) + Math.sin(u * 13 + ph[1]) * 3;
        break;
      }
      case 'dunes':
        h = Math.max(0, Math.sin(u * 7 + ph[0]) * 8 + Math.sin(u * 3 + ph[1]) * 5) + 2;
        break;
      case 'canopy':
        h = 6 + Math.abs(Math.sin(u * 24 + ph[0])) * 6 + Math.sin(u * 5 + ph[1]) * 3;
        break;
      case 'volcano': {
        const d = Math.abs(u - 0.62);
        h = Math.max(4, 34 - d * 120) - (d < 0.05 ? 6 : 0) + Math.sin(u * 9 + ph[0]) * 2;
        break;
      }
      case 'sea':
      case 'dock':
        h = 0;
        break;
      default:
        h = 6 + Math.sin(u * 6 + ph[0]) * 6 + Math.sin(u * 15 + ph[1]) * 2;
    }
    out.push(h * (1 + layer * 0.4));
  }
  return out;
}

/** Below the clouds: sky, the world's ground rising as the pod comes down (t 0..1). */
function lowerSky(w: Canvas, look: Look, seed: number, t: number, f: number): void {
  const [sr, s0, s1] = look.sky;
  const sky = C(sr);
  const band = Math.max(1, Math.floor(WH / (s1 - s0 + 1)));
  for (let y = 0; y < WH; y++) w.rect(0, y, WW, 1, sky[Math.min(s1, s0 + Math.floor(y / band))]);
  const [gr, g0, g1] = look.ground;
  const G = C(gr);
  const A = C(look.accent[0])[look.accent[1]];
  const horizon = Math.round(92 - t * 46);
  if (look.shape === 'sea') {
    for (let y = horizon; y < WH; y++) {
      const k = (y - horizon) / Math.max(1, WH - horizon);
      w.rect(0, y, WW, 1, G[Math.round(g1 - k * (g1 - g0))]);
    }
    // swells, closer and bigger as we drop
    const r = rng(seed + f);
    for (let i = 0; i < 26; i++) {
      const y = horizon + 2 + Math.floor(((i * 7) % 40) * (1 + t) * 0.6);
      if (y >= WH) continue;
      const x = Math.floor(r() * WW);
      w.rect(x, y, 4 + Math.floor((y - horizon) / 4), 1, A);
    }
    return;
  }
  // two layers of ground: far (paler, lower) and near (rising faster)
  for (let layer = 0; layer < 2; layer++) {
    const prof = ridge(seed, look.shape, layer);
    const base = horizon + layer * Math.round(14 + t * 30);
    const col = G[layer === 0 ? g1 : g0];
    for (let x = 0; x < WW; x++) {
      const top = Math.round(base - prof[x] * (0.6 + t * 0.8));
      for (let y = Math.max(0, top); y < WH; y++) w.set(x, y, col);
      if (top >= 0 && top < WH) w.set(x, top, layer === 0 ? G[Math.min(7, g1 + 1)] : G[g1]);
    }
  }
  // details on the near layer
  const r = rng(seed * 3);
  const near = horizon + Math.round(14 + t * 30);
  const n = 18;
  for (let i = 0; i < n; i++) {
    const x = Math.floor(r() * WW);
    const y = near + 4 + Math.floor(r() * (WH - near));
    if (y >= WH) continue;
    const s = 1 + Math.round(t * 3);
    switch (look.shape) {
      case 'hills':
        w.rect(x, y - s * 2, s, s * 2, C('brown')[2]).rect(x - s, y - s * 3, s * 3, s * 2, A);
        break;
      case 'canopy':
        w.rect(x - s, y - s, s * 3, s * 2, A);
        break;
      case 'lava':
      case 'volcano':
        w.rect(x, y, s * 5, 1, A).rect(x + s, y + 1, s * 3, 1, C('yellow')[6]);
        break;
      case 'pools':
        w.rect(x - s * 2, y, s * 5, s, A);
        break;
      case 'mushrooms':
        w.rect(x, y - s * 3, s, s * 3, C('sand')[6]).rect(x - s * 2, y - s * 4, s * 5, s * 2, A);
        break;
      case 'spires':
        for (let k = 0; k < s * 4; k++) w.rect(x - Math.floor((s * 4 - k) / 4), y - k, Math.max(1, Math.floor((s * 4 - k) / 2)), 1, k % 3 ? A : WHITE);
        break;
      case 'peaks':
      case 'dunes':
        w.rect(x, y, s * 3, 1, A);
        break;
    }
  }
  // the volcano smokes
  if (look.shape === 'volcano') {
    const vx = Math.round(WW * 0.62);
    const vy = horizon - Math.round(30 * (0.6 + t * 0.8));
    for (let k = 0; k < 7; k++) w.sphere(vx + Math.sin(k + f) * 4 + k * 2, vy - k * 5, 3 + k * 0.6, [C('gray')[1], C('gray')[2], C('gray')[3]]);
    w.rect(vx - 2, vy, 5, 2, C('orange')[6]);
  }
}

/** Clouds streaming up past the canopy. */
function clouds(w: Canvas, look: Look, seed: number, f: number, n: number): void {
  const r = rng(seed + 5);
  const col = C(look.cloud[0]);
  for (let i = 0; i < n; i++) {
    const x = r() * WW;
    const y0 = r() * WH * 2;
    const s = 6 + r() * 14;
    const y = ((y0 - f * 22) % (WH * 2)) + (y0 - f * 22 < 0 ? WH * 2 : 0) - WH / 2;
    w.rect(Math.round(x - s), Math.round(y), Math.round(s * 2), Math.round(s * 0.5), col[look.cloud[1]]);
    w.rect(Math.round(x - s * 0.6), Math.round(y - s * 0.3), Math.round(s * 1.2), Math.round(s * 0.4), col[Math.max(0, look.cloud[1] - 1)]);
  }
}

/** Snow, ash or spores drifting by. */
function motes(w: Canvas, look: Look, seed: number, f: number): void {
  if (!look.motes) return;
  const r = rng(seed + 9);
  const col = C(look.motes[0])[look.motes[1]];
  for (let i = 0; i < 40; i++) {
    const x = (r() * WW + f * 3) % WW;
    const y = (r() * WH - f * 9 + WH * 4) % WH;
    w.set(Math.floor(x), Math.floor(y), col);
  }
}

/** The station seen from outside, then its bay. */
function station(w: Canvas, t: number, f: number): void {
  const G = C('gray');
  const cx = WW / 2;
  const cy = WH / 2;
  const s = 10 + t * t * 260;
  // the hull: a big wheel with a hub, lit windows
  w.sphere(cx, cy, s * 0.35, [G[1], G[2], G[3], G[4]]);
  for (let a = 0; a < Math.PI * 2; a += 0.02) {
    for (let k = 0; k < Math.max(1, s * 0.08); k++) w.set(cx + Math.cos(a) * (s - k), cy + Math.sin(a) * (s - k) * 0.5, G[3 + (k & 1)]);
  }
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + 0.1;
    w.rect(Math.round(cx + Math.cos(a) * s * 0.92), Math.round(cy + Math.sin(a) * s * 0.46), 2, 2, (i + f) % 3 ? C('yellow')[6] : C('cyan')[6]);
  }
  // the bay door in the hub
  const bw = Math.round(s * 0.25);
  const bh = Math.round(s * 0.14);
  w.rect(Math.round(cx - bw / 2), Math.round(cy - bh / 2), bw, bh, C('space')[0]);
  if (bw > 6) {
    w.frame(Math.round(cx - bw / 2), Math.round(cy - bh / 2), bw, bh, f % 2 ? C('yellow')[6] : C('orange')[5]);
  }
}

/** Inside the docking bay: guide lights rushing past, the pad ahead. */
function bay(w: Canvas, t: number, f: number): void {
  const G = C('gray');
  w.rect(0, 0, WW, WH, G[0]);
  const cx = WW / 2;
  const cy = WH / 2;
  // the tunnel: rings of lights expanding outward
  for (let k = 0; k < 6; k++) {
    const z = ((k + f * 0.6) % 6) / 6;
    const rw = 10 + z * z * WW;
    const rh = 6 + z * z * WH;
    w.frame(Math.round(cx - rw / 2), Math.round(cy - rh / 2), Math.round(rw), Math.round(rh), G[Math.min(5, 1 + Math.floor(z * 5))]);
    for (const [dx, dy] of [
      [-0.5, -0.5],
      [0.5, -0.5],
      [-0.5, 0.5],
      [0.5, 0.5],
    ])
      w.rect(Math.round(cx + dx * rw) - 1, Math.round(cy + dy * rh) - 1, 2, 2, (k + f) % 2 ? C('yellow')[6] : C('orange')[5]);
  }
  // the landing pad grows at the end of the tunnel
  const pw = 20 + t * 120;
  w.rect(Math.round(cx - pw / 2), Math.round(cy + 6 + t * 30), Math.round(pw), Math.max(2, Math.round(t * 14)), C('yellow')[5]);
  w.center(Math.round(cy - 4), t > 0.6 ? 'DOCKING' : '', C('cyan')[6]);
}

/** Water closing over the canopy: a splash, then the blue. */
function underwater(w: Canvas, look: Look, k: number, seed: number): void {
  const deep = look.ground[1] === 0;
  const B = C('blue');
  for (let y = 0; y < WH; y++) w.rect(0, y, WW, 1, B[Math.max(0, (deep ? 2 : 5) - Math.floor((y / WH) * 3))]);
  // light shafts in shallow water, glowing things in deep
  const r = rng(seed + 77);
  if (!deep) for (let i = 0; i < 5; i++) for (let y = 0; y < WH; y += 2) w.set(Math.floor(r() * 0 + 20 + i * 45 + y * 0.3), y, B[6]);
  else for (let i = 0; i < 8; i++) w.rect(Math.floor(r() * WW), Math.floor(r() * WH), 2, 2, C('cyan')[6]);
  // bubbles rising
  for (let i = 0; i < 24; i++) {
    const x = WW / 2 + (r() - 0.5) * 120;
    const y = (r() * WH - k * 16 + WH * 3) % WH;
    w.set(Math.floor(x), Math.floor(y), C('ice')[7]).set(Math.floor(x) + 1, Math.floor(y), C('ice')[6]);
  }
}

export function descentFli(biome: Biome, seed = 9): Uint8Array {
  const look = LOOKS[biome] ?? LOOKS.verdant!;
  const frames: Canvas[] = [];
  const shell = new Canvas();
  cockpit(shell, look);
  const N = 15;
  const sea = look.shape === 'sea';
  const dock = look.shape === 'dock';
  const sk = seed + biome.length * 13 + biome.charCodeAt(0);
  for (let f = 0; f < N; f++) {
    const w = new Canvas(WW, WH, C('space')[0]);
    if (f < 5) {
      // in orbit: the world swells in the canopy
      w.stars(77 + sk, 90, C('star'));
      const t = f / 4;
      if (dock) station(w, t * 0.7, f);
      else planetArt(w, WW / 2, WH / 2 + 10 + t * 50, 14 + t * t * 110, biome, sk, { rings: biome === 'crystal' });
    } else if (f < 8) {
      if (dock) station(w, 0.7 + ((f - 5) / 2) * 0.3, f);
      else {
        // entry: the canopy fills with the world's color and burns at the edges
        const [sr, s0, s1] = look.sky;
        const sky = C(sr);
        for (let y = 0; y < WH; y++) w.rect(0, y, WW, 1, sky[Math.max(0, Math.min(7, s0 - 1 + Math.floor((y / WH) * (s1 - s0 + 2))))]);
        const burn = C(look.burn);
        const r = rng(sk + f);
        for (let i = 0; i < 70; i++) {
          const side = r() < 0.5;
          const x = side ? Math.floor(r() * 30) : WW - 1 - Math.floor(r() * 30);
          const y = Math.floor(r() * WH);
          const len = 4 + Math.floor(r() * 14);
          for (let k = 0; k < len; k++) w.set(x + (side ? k * 0.4 : -k * 0.4), y - k, burn[Math.max(0, 7 - Math.floor(k / 2))]);
        }
        for (let y = WH - 10; y < WH; y++) w.rect(0, y, WW, 1, burn[Math.min(7, 3 + (y - (WH - 10)) / 2 + (f % 2))]);
        clouds(w, look, sk, f, 6);
      }
    } else if (dock) bay(w, (f - 8) / (N - 9), f);
    else if (sea && f >= N - 3) {
      // splashdown
      underwater(w, look, f - (N - 3), sk);
      if (f === N - 3)
        for (let i = 0; i < 160; i++) {
          const r = rng(sk + i);
          w.rect(Math.floor(r() * WW), Math.floor(r() * WH), 3, 2, i % 3 ? WHITE : C('ice')[6]);
        }
    } else {
      const t = (f - 8) / (N - 9);
      lowerSky(w, look, sk, t, f);
      clouds(w, look, sk, f, Math.max(0, 8 - (f - 8) * 2));
      motes(w, look, sk, f);
    }
    // the canopy shakes a little during entry
    const shake = f >= 5 && f < 8 ? (f % 2 ? 2 : -2) : 0;
    const c = new Canvas();
    c.px.set(shell.px);
    for (let y = 0; y < WH; y++) for (let x = 0; x < WW; x++) c.set(WX + x, WY + y, w.get(Math.max(0, Math.min(WW - 1, x + shake)), y));
    // the altimeter counts down
    const alt = Math.max(0, Math.round(9000 * (1 - f / (N - 1)) ** 2));
    c.rect(196, 158, 90, 8, C('space')[1]);
    c.text(196, 158, String(alt).padStart(5, '0') + ' M', f === N - 1 ? C('green')[6] : C('orange')[6]);
    if (f === N - 1) c.text(196, 174, sea ? 'SPLASHDOWN' : dock ? 'DOCKED' : 'TOUCHDOWN', C('green')[6]);
    frames.push(c);
  }
  return encodeFli(
    frames.map((f) => f.px),
    SCREEN.pal,
    { speed: 6 },
  );
}
