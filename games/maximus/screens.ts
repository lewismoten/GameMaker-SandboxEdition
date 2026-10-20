// The pictures between the play: title, menu, the story slide show, instruction and
// credit pages, high scores, load/save, the planet cards (every card of a sector lives
// in one tall GIF; each planet's .BKD shows its own 320x200 window of it), and the end.
import { encodeGif } from '../../web/src/formats/gif';
import { serializeBackdrop, serializeSlideList } from '../../web/src/formats/graphicScripts';
import { Pixels, rng } from '../kit/pixels';
import { tileNoise } from './art';
import { Canvas } from './canvas';
import { drawCourier } from './courier';
import { drawModule, drawShard } from './items';
import { buildPalette, hsl, type RGB, type Role, type Theme, S, WHITE, shared } from './palette';
import { drawDiver, drawPod, drawRover } from './vehicles';
import { MODULES, SHARDS } from './common';
import { SECTORS, type World } from './universe';

// ------------------------------------------------------------------ the screen palette

const SCREEN_ROLES: Role[] = [
  { name: 'space', n: 12 },
  { name: 'neb', n: 8 },
  { name: 'neb2', n: 8 },
  { name: 'star', n: 4 },
  ...['blue', 'cyan', 'green', 'lime', 'yellow', 'orange', 'red', 'magenta', 'violet', 'brown', 'sand', 'grey', 'ice'].map((name) => ({ name, n: 8 })),
];
const hueRamp8 = (h: number, s: number, dark = 0.06, light = 0.88): [RGB, RGB, RGB] => [
  hsl(h - 10, s, dark),
  hsl(h + 15, s * 0.7, light),
  hsl(h, s, (dark + light) / 2),
];
const SCREEN_THEME: Theme = {
  space: [
    [0, 0, 8],
    [40, 30, 90],
    [10, 8, 40],
  ],
  neb: hueRamp8(280, 0.6, 0.04, 0.6),
  neb2: hueRamp8(195, 0.7, 0.04, 0.65),
  star: [
    [90, 90, 130],
    [255, 255, 255],
  ],
  blue: hueRamp8(220, 0.7),
  cyan: hueRamp8(188, 0.75),
  green: hueRamp8(125, 0.55),
  lime: hueRamp8(80, 0.7),
  yellow: hueRamp8(50, 0.85),
  orange: hueRamp8(28, 0.85),
  red: hueRamp8(2, 0.75),
  magenta: hueRamp8(320, 0.65),
  violet: hueRamp8(268, 0.55),
  brown: hueRamp8(25, 0.4, 0.05, 0.7),
  sand: hueRamp8(40, 0.5, 0.15, 0.9),
  grey: [
    [20, 22, 28],
    [235, 238, 245],
    [120, 125, 140],
  ],
  ice: hueRamp8(200, 0.35, 0.2, 0.97),
};
export const SCREEN = buildPalette(SCREEN_ROLES, SCREEN_THEME);
const C = (n: string) => SCREEN.ramps.get(n) ?? shared.get(n)!;
const BLUE = 11;
const RED = 12;
const YELLOW = 13;

const gif = (c: Canvas) => encodeGif({ width: c.w, height: c.h, pixels: c.px, palette: SCREEN.pal });

// ------------------------------------------------------------------ painting helpers

function spaceBg(c: Canvas, seed: number, nebula = true): void {
  c.gradient(0, 0, c.w, c.h, C('space').slice(0, 5));
  if (nebula) {
    const n = tileNoise(seed, 160, 5);
    const n2 = tileNoise(seed + 9, 80, 6);
    const neb = C('neb');
    const neb2 = C('neb2');
    for (let y = 0; y < c.h; y++)
      for (let x = 0; x < c.w; x++) {
        const v = n(x, y) * 0.75 + n2(x, y) * 0.25;
        const w = n2(x + 40, y) * 0.8 + n(x, y + 30) * 0.2;
        if (v > 0.6) {
          const f = (v - 0.6) * 14;
          const i = Math.floor(f);
          c.set(x, y, neb[Math.min(5, (x + y) % 2 && f - i > 0.5 ? i + 1 : i)]);
        } else if (w > 0.74) c.set(x, y, neb2[Math.min(3, Math.floor((w - 0.74) * 12))]);
      }
  }
  c.stars(seed, Math.floor((c.w * c.h) / 220), C('star'));
}

const BIOME_RAMPS: Record<string, [string, string]> = {
  verdant: ['blue', 'green'],
  desert: ['sand', 'orange'],
  ice: ['ice', 'blue'],
  lava: ['brown', 'orange'],
  toxic: ['lime', 'violet'],
  crystal: ['violet', 'cyan'],
  fungal: ['magenta', 'brown'],
  ash: ['grey', 'red'],
  autumn: ['orange', 'brown'],
  jungle: ['green', 'lime'],
  ocean: ['blue', 'cyan'],
  abyss: ['violet', 'blue'],
  station: ['grey', 'cyan'],
  space: ['violet', 'neb'],
  core: ['red', 'magenta'],
};

export function planetArt(c: Canvas, cx: number, cy: number, rad: number, biome: string, seed: number, o: { rings?: boolean } = {}): void {
  const [a, b] = BIOME_RAMPS[biome] ?? ['grey', 'blue'];
  const n = tileNoise(seed, 1, 5);
  const n2 = tileNoise(seed + 4, 1, 11);
  const banded = biome === 'toxic' || biome === 'fungal';
  c.sphere(cx, cy, rad, C(a), {
    second: C(b),
    pattern: (u, v) => (banded ? (Math.sin(v * 22 + n(u, v) * 4) + 1) / 2 : n(u * 2, v * 2) * 0.7 + n2(u * 2, v * 2) * 0.3) + (biome === 'ocean' ? -0.15 : 0),
    atmo: C(a)[6],
    rings: o.rings ? [C(b)[5], C(b)[3], C(a)[6]] : undefined,
    night: 0,
  });
}

const big = (p: Pixels, k: number) => {
  const c = new Canvas(p.w * k, p.h * k, 255);
  c.sprite(p, 0, 0, k);
  return c;
};

function logo(c: Canvas, y: number, scale = 5): void {
  const word = 'MAXIMUS';
  const w = Canvas.width(word, scale, 1);
  const x = Math.round((c.w - w) / 2);
  c.text(x + scale, y + scale, word, 0, { scale, spacing: 1 });
  c.text(x, y, word, [...C('yellow').slice(3), WHITE].reverse().concat(C('orange').slice(2, 6).reverse()), { scale, spacing: 1, outline: C('red')[1] });
  // a chrome glint line across the letters
  for (let xx = x; xx < x + w; xx++) {
    const yy = y + Math.round(scale * 2.5);
    if (c.get(xx, yy) !== C('red')[1] && c.get(xx, yy) !== c.get(0, 0)) c.set(xx, yy, WHITE);
  }
}

// ------------------------------------------------------------------ screens

export function titleScreen(): Uint8Array {
  const c = new Canvas();
  spaceBg(c, 11);
  planetArt(c, 250, 150, 70, 'verdant', 3, {});
  planetArt(c, 34, 120, 16, 'ice', 8, { rings: true });
  logo(c, 26, 5);
  c.center(72, 'THE HUNDRED WORLDS', C('cyan').slice(3).reverse(), { scale: 2, outline: 0 });
  // the pod streaking past, trailing its flame
  for (let i = 0; i < 70; i++) c.set(70 + i, 132 + i * 0.12, C('orange')[Math.min(7, Math.floor(i / 9))]);
  c.sprite(drawPod('r', { flicker: 2, glow: 1 }), 140, 128, 3);
  c.center(180, '(C) 1995 SANDBOX SOFTWARE', C('grey')[5], { shadow: 0 });
  c.center(190, 'SHAREWARE VERSION 1.0', C('grey')[3], { shadow: 0 });
  return gif(c);
}

export function menuScreen(): Uint8Array {
  const c = new Canvas();
  spaceBg(c, 12);
  planetArt(c, 30, 170, 60, 'lava', 21);
  planetArt(c, 292, 30, 34, 'ocean', 22, { rings: true });
  logo(c, 12, 4);
  c.center(48, 'THE HUNDRED WORLDS', C('cyan')[6], { shadow: 0 });
  // the menu panel (Game-Maker writes the menu here in blue)
  c.panel(62, 94, 196, 78, C('ice')[7], C('blue')[2], WHITE);
  c.rect(64, 96, 192, 1, C('ice')[6]);
  c.sprite(drawCourier({ arm: [150, 170], backArm: [5, 10] }), 270, 112, 2);
  c.center(184, 'ARROWS TO CHOOSE, ENTER TO GO', C('grey')[4], { shadow: 0 });
  return gif(c);
}

const STORY: { text: string[]; art: (c: Canvas) => void }[] = [
  {
    text: ['The Maximus Core, the forge-star', 'at the heart of the galaxy, has', 'gone dark.'],
    art: (c) => {
      // spiral galaxy with a dead black heart
      for (let i = 0; i < 2600; i++) {
        const arm = i % 2;
        const t = (i / 2600) * 9;
        const rr = 6 + t * 13;
        const a = t * 1.3 + arm * Math.PI + Math.sin(i) * 0.25;
        c.set(160 + Math.cos(a) * rr * 1.4, 80 + Math.sin(a) * rr * 0.6, C(i % 3 ? 'neb' : 'neb2')[Math.max(1, 7 - Math.floor(t * 0.7))]);
      }
      c.sphere(160, 80, 10, [0, 0, C('violet')[1]]);
      c.sphere(160, 80, 14, [0], {});
      c.sphere(160, 80, 9, [0]);
    },
  },
  {
    text: ['Its light was held in ten star-', 'shards. When the Core cracked,', 'they scattered across a hundred', 'worlds.'],
    art: (c) => {
      for (let k = 0; k < 10; k++) {
        const a = (k / 10) * Math.PI * 2;
        for (let i = 0; i < 40; i++) c.set(160 + Math.cos(a) * i * 2.2, 80 + Math.sin(a) * i * 1.1, C('yellow')[Math.max(0, 7 - Math.floor(i / 5))]);
        c.sprite(drawShard(k), 150 + Math.round(Math.cos(a) * 110), 70 + Math.round(Math.sin(a) * 55), 1);
      }
      c.sphere(160, 80, 8, [C('red')[1], C('orange')[3], WHITE]);
    },
  },
  {
    text: ['Without the Core the warp lanes', 'are failing. Sector by sector,', 'the galaxy is going quiet.'],
    art: (c) => {
      for (let k = 0; k < 5; k++) {
        const x = 40 + k * 60;
        planetArt(c, x, 80, 18, ['verdant', 'lava', 'ocean', 'crystal', 'abyss'][k], 30 + k);
        for (let i = 0; i < 14; i++) if (k < 4) c.set(x + 20 + i * 3, 80, C('grey')[i % 2 ? 2 : 4 - Math.floor(k / 2)]);
      }
    },
  },
  {
    text: ['Max is a courier. Couriers', 'deliver. This time the package', 'is the light of the galaxy.'],
    art: (c) => {
      c.rect(0, 120, 320, 40, C('grey')[2]);
      c.rect(0, 120, 320, 2, C('grey')[5]);
      for (let x = 0; x < 320; x += 40) c.rect(x, 122, 2, 38, C('grey')[1]);
      c.sprite(drawPod('idle', { glow: 1 }), 170, 60, 3);
      c.sprite(drawCourier({ arm: [150, 170], backArm: [5, 10] }), 110, 40, 2);
    },
  },
  {
    text: ['Find the ten shards. Each pair', 're-tunes the warp drive for the', 'next sector. All ten open the', 'way to the Core.'],
    art: (c) => {
      for (let k = 0; k < 10; k++) c.sprite(drawShard(k), 20 + k * 29, 64, 1);
      for (let k = 0; k < 5; k++) c.text(30 + k * 58, 92, `${k * 2 + 1}+${k * 2 + 2}`, C('cyan')[6]);
      c.text(102, 110, 'SECTOR GATES', C('yellow')[6], { shadow: 0 });
    },
  },
  {
    text: ['Fly the pod. Walk the worlds.', 'Dive the seas. Drive the flats.', 'And bring the light home.'],
    art: (c) => {
      planetArt(c, 160, 170, 110, 'verdant', 40);
      c.sprite(drawPod('u', { flicker: 2 }), 145, 30, 3);
      c.sprite(drawDiver({ prop: 1, lamp: true }), 40, 60, 2);
      c.sprite(drawRover({ wheel: 1 }), 240, 60, 2);
    },
  },
];

export function storySlides(): Map<string, Uint8Array> {
  const out = new Map<string, Uint8Array>();
  STORY.forEach((s, i) => {
    const c = new Canvas();
    spaceBg(c, 40 + i, i !== 3);
    s.art(c);
    c.panel(16, 150, 288, 46, C('blue')[0], C('blue')[3]);
    s.text.forEach((line, k) => c.text(24, 156 + k * 9, line, k === 0 ? C('ice')[7] : C('ice')[6]));
    out.set(`story${i + 1}.gif`, gif(c));
  });
  out.set('story.lst', serializeSlideList(STORY.map((_, i) => ({ name: `story${i + 1}.gif`, pause: 12 }))));
  return out;
}

/** A page backdrop for instructions and credits (text goes in the middle). */
export function pageScreen(title: string, seed: number, art: (c: Canvas) => void): Uint8Array {
  const c = new Canvas();
  spaceBg(c, seed);
  art(c);
  c.panel(30, 34, 262, 148, C('space')[1], C('violet')[3], C('violet')[1]);
  c.center(12, title, C('yellow').slice(2).reverse(), { scale: 2, outline: 0 });
  return gif(c);
}

export function hiscoreScreen(): Uint8Array {
  const c = new Canvas();
  spaceBg(c, 61);
  c.rect(0, 0, 320, 10, 0);
  c.panel(10, 20, 300, 170, C('ice')[7], C('blue')[2], WHITE);
  for (let k = 0; k < 10; k++) c.sprite(drawShard(k).crop(5, 0, 10, 20), 292, 24 + k * 16, 1);
  return gif(c);
}

export function slotScreen(title: string, seed: number): Uint8Array {
  const c = new Canvas();
  spaceBg(c, seed);
  c.center(8, title, C('yellow').slice(2).reverse(), { scale: 2, outline: 0 });
  c.panel(50, 30, 250, 150, C('space')[1], C('blue')[3]);
  for (let i = 0; i < 10; i++) c.rect(76, 38 + i * 14, 200, 11, C('space')[2]);
  return gif(c);
}

export function wonScreens(): Map<string, Uint8Array> {
  const out = new Map<string, Uint8Array>();
  {
    const c = new Canvas();
    spaceBg(c, 70);
    // the Core relit
    for (let rr = 70; rr > 0; rr--) c.sphere(160, 90, rr, [rr > 50 ? C('orange')[2] : rr > 30 ? C('yellow')[5] : WHITE]);
    for (let a = 0; a < 64; a++)
      for (let i = 70; i < 150; i += 3)
        c.set(160 + Math.cos(a * 0.1) * i, 90 + Math.sin(a * 0.1) * i * 0.8, C('yellow')[Math.max(0, 7 - Math.floor((i - 70) / 12))]);
    for (let k = 0; k < 10; k++) c.sprite(drawShard(k), 150 + Math.round(Math.cos((k / 10) * 6.28) * 120), 80 + Math.round(Math.sin((k / 10) * 6.28) * 70), 1);
    c.center(178, 'THE CORE IS LIT', C('yellow').slice(3).reverse(), { scale: 2, outline: 0 });
    out.set('won1.gif', gif(c));
  }
  {
    const c = new Canvas();
    spaceBg(c, 71);
    planetArt(c, 160, 230, 140, 'verdant', 72);
    c.sprite(drawCourier({ arm: [150, 170], backArm: [150, 170] }), 140, 40, 2);
    c.sprite(drawPod('idle', { glow: 1 }), 200, 70, 2);
    c.panel(20, 140, 280, 52, C('blue')[0], C('blue')[3]);
    ['The warp lanes hum again. Ships', 'move in every sector, and every', 'pilot knows the name of the', 'courier who brought the light.'].forEach((l, k) =>
      c.text(28, 146 + k * 11, l, C('ice')[7]),
    );
    out.set('won2.gif', gif(c));
  }
  {
    const c = new Canvas();
    spaceBg(c, 73);
    logo(c, 50, 4);
    c.center(100, 'DELIVERED.', C('yellow')[6], { scale: 2, outline: 0 });
    c.center(140, 'THANK YOU FOR PLAYING', C('cyan')[6], { shadow: 0 });
    c.center(156, 'SANDBOX SOFTWARE 1995', C('grey')[4]);
    out.set('won3.gif', gif(c));
  }
  out.set(
    'won.lst',
    serializeSlideList([{ name: 'won.fli', pause: 0 }, { name: 'won1.gif', pause: 10 }, { name: 'won2.gif', pause: 15 }, { name: 'won3.gif' }]),
  );
  {
    const c = new Canvas();
    spaceBg(c, 74);
    planetArt(c, 160, 120, 60, 'ash', 75);
    for (let i = 0; i < 40; i++) c.set(220 + i * 1.5, 40 + i, C('grey')[Math.max(0, 6 - Math.floor(i / 6))]);
    c.sprite(drawPod('dl', { hurt: false }), 268, 92, 2);
    c.center(16, 'SIGNAL LOST', C('red').slice(3).reverse(), { scale: 3, outline: 0 });
    c.center(176, 'The light waits. Try again, courier.', C('grey')[5]);
    out.set('lost.gif', gif(c));
  }
  return out;
}

// ------------------------------------------------------------------ planet cards

const KIND_TEXT: Record<string, string> = { surface: 'ON FOOT', rover: 'BY ROVER', ocean: 'DIVING BELL', station: 'STATION DECKS' };

/** All cards of a sector in one tall GIF, and a .BKD per world pointing into it. */
/** A world's long-range scan: one class per map cell. */
export interface Scan {
  /** 0 open, 1 rock, 2 deep rock, 3 hazard, 4 current/lift, 5 water, 6 treasure */
  cls: Uint8Array;
  arrive: { x: number; y: number };
  uplink: { x: number; y: number };
  vault?: { x: number; y: number };
}

/** Draws a world's scan, each map cell 1.5 pixels square (150x150), with its markers. */
function drawScan(c: Canvas, scan: Scan, kind: string, ox: number, oy: number): void {
  const col = [C('space')[1], C('brown')[3], C('brown')[1], C('red')[5], C('cyan')[4], C('blue')[2], C('yellow')[6]];
  if (kind === 'ocean') col[0] = C('blue')[3];
  if (kind === 'station') {
    col[1] = C('grey')[3];
    col[2] = C('grey')[2];
  }
  const at = (v: number) => Math.floor(v * 1.5);
  for (let y = 0; y < 100; y++) for (let x = 0; x < 100; x++) c.rect(ox + at(x), oy + at(y), at(x + 1) - at(x), at(y + 1) - at(y), col[scan.cls[y * 100 + x]]);
  c.frame(ox - 1, oy - 1, 152, 152, C('cyan')[2]);
  const mark = (p: { x: number; y: number }, color: number, r: number) => {
    const cx = ox + at(p.x) + 1;
    const cy = oy + at(p.y);
    for (let a = 0; a < 24; a++) c.set(cx + Math.cos((a / 24) * Math.PI * 2) * r, cy + Math.sin((a / 24) * Math.PI * 2) * r, color);
    c.rect(cx - 1, cy - 1, 3, 3, color);
  };
  mark(scan.arrive, C('green')[6], 4);
  if (scan.vault) mark(scan.vault, C('yellow')[7], 5);
}

export function sectorCards(k: number, worlds: { world: World; scene: number; scan?: Scan }[]): Map<string, Uint8Array> {
  const out = new Map<string, Uint8Array>();
  const sec = SECTORS[k];
  const c = new Canvas(320, 200 * worlds.length);
  worlds.forEach(({ world, scene, scan }, i) => {
    const card = new Canvas();
    spaceBg(card, 500 + scene);
    // left: the planet and what the courier knows about it
    planetArt(card, 26, 30, 20, world.biome, scene, { rings: scene % 5 === 0 });
    card.text(54, 12, `SECTOR ${k + 1}`, C('grey')[4]);
    card.text(54, 22, sec.name.toUpperCase(), C('cyan')[6]);
    const name = world.name.toUpperCase();
    const scale = Canvas.width(name, 2) <= 150 ? 2 : 1;
    card.text(6, 58, name, C('yellow').slice(3).reverse(), { scale, outline: 0 });
    card.text(6, 80, KIND_TEXT[world.kind], C('orange')[6]);
    card.text(6, 90, `DANGER ${'*'.repeat(sec.level)}${'.'.repeat(5 - sec.level)}`, C('red')[6]);
    let y = card.para(6, 106, 150, world.blurb, C('ice')[6], 10);
    if (world.shard !== undefined) {
      card.sprite(drawShard(world.shard), 4, y + 2, 1);
      card.para(26, y + 6, 130, `SHARD: ${SHARDS[world.shard].toUpperCase()}`, C('yellow')[6], 10);
      y += 24;
    }
    if (world.module !== undefined) {
      card.sprite(drawModule(world.module), 4, y + 2, 1);
      card.para(26, y + 6, 130, MODULES[world.module].name.toUpperCase(), C('green')[6], 10);
    }
    card.text(6, 188, 'ANY KEY TO LAND', C('grey')[3]);
    // right: the long-range scan of the whole world
    if (scan) {
      card.rect(160, 0, 160, 200, C('space')[0]);
      card.text(164, 8, 'LONG-RANGE SCAN', C('cyan')[6]);
      drawScan(card, scan, world.kind, 165, 22);
      card.rect(165, 180, 5, 5, C('green')[6]);
      card.text(173, 178, 'YOU', C('grey')[5]);
      card.rect(203, 180, 5, 5, C('yellow')[7]);
      card.text(211, 178, 'VAULT', C('grey')[5]);
      card.rect(257, 180, 5, 5, C('red')[5]);
      card.text(265, 178, 'HOT', C('grey')[5]);
      card.text(164, 190, 'east leads home', C('grey')[3]);
    }
    c.blit(card, 0, i * 200);
    out.set(`w${scene}.bkd`, serializeBackdrop({ x: 0, y: i * 200, gif: `cards${k + 1}.gif` }));
  });
  out.set(`cards${k + 1}.gif`, gif(c));
  return out;
}

/** Cards for the special places (one atlas too). */
export function placeCards(places: { file: string; title: string; sub: string; text: string; biome: string }[]): Map<string, Uint8Array> {
  const out = new Map<string, Uint8Array>();
  const c = new Canvas(320, 200 * places.length);
  places.forEach((p, i) => {
    const card = new Canvas();
    spaceBg(card, 900 + i);
    planetArt(card, 92, 104, 64, p.biome, 900 + i);
    card.text(172, 30, p.sub, C('cyan')[6]);
    card.text(172, 48, p.title, C('yellow').slice(3).reverse(), { scale: Canvas.width(p.title, 2) <= 140 ? 2 : 1, outline: 0 });
    card.para(172, 80, 140, p.text, C('ice')[6], 10);
    card.text(172, 184, 'ANY KEY TO GO ON', C('grey')[3]);
    c.blit(card, 0, i * 200);
    out.set(`${p.file}.bkd`, serializeBackdrop({ x: 0, y: i * 200, gif: 'places.gif' }));
  });
  out.set('places.gif', gif(c));
  return out;
}

export { rng, BLUE, RED, YELLOW, S, big };
