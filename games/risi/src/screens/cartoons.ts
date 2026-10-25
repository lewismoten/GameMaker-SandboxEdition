// The cartoons (FLIs drawn here, frame by frame): the title (the art drawn for the game,
// art/cover.ts: the sunbeam sweeps, laurel leaves fall, the marble bust cracks up, and the name
// is cut into the entablature), the story (Marcus writes; omnes spectant, nemo ridet; the
// banquet, and under the table, Rufus; the Senate's decree), the six level cards (the song's
// Latin title and its English, a sung line and its English, over a strip of the level with its
// actors moving), how to play, the lost ending (counting the sand of the Circus Maximus by
// moonlight), and the endings (Emperor Gravis cracks up: RISIT!; Marcus crowned with laurel:
// VENI. VIDI. RISI.; the curtain call, FABULA ACTA EST). Each reel opens on black and fades by
// palette (kit/reel.ts); only what moves is stored.
import { Pixels, rng } from '../../../kit/pixels';
import { medianCutPalette, Quantizer } from '../../../kit/quantize';
import { Reel } from '../../../kit/reel';
import { fadeOutLength } from '../../../kit/fadeOut';
import { blob } from '../../../snowbound/src/art/draw';
import { centered, micro, outlined, textWidth } from '../../../snowbound/src/art/font';
import { scaleBlit } from '../../../snowbound/src/screens/scenery';
import { coverRgb } from '../art/cover';
import { buildScreenPalette, type Pal } from '../art/pal';
import { column, portico } from './screens';
import { AUTHOR, CARDS } from './text';

const W = 320;
const H = 200;
/** 1/70 s per frame: about 12 frames a second. */
export const SPEED = 6;

export interface Cast {
  /** Marcus's sprites (MARCUS.CBL's pictures). */
  man: Map<string, Pixels>;
  /** Felix's. */
  cat: Map<string, Pixels>;
  /** Everybody else's (RISI.MBL's pictures). */
  mons: Map<string, Pixels>;
}

/** The palette (6-bit VGA) flashed white by `t`. */
function flashed(pal: Uint8Array, t: number): Uint8Array {
  return pal.map((v) => Math.round(v + (63 - v) * t * 0.7));
}

/** The palette washed toward a sickly green by `t` (the event). */
function greened(pal: Uint8Array, t: number): Uint8Array {
  const out = Uint8Array.from(pal);
  for (let i = 0; i < 256; i++) {
    out[i * 3] = Math.round(pal[i * 3] * (1 - 0.35 * t));
    out[i * 3 + 1] = Math.round(Math.min(63, pal[i * 3 + 1] * (1 + 0.15 * t) + 4 * t));
    out[i * 3 + 2] = Math.round(pal[i * 3 + 2] * (1 - 0.45 * t));
  }
  return out;
}

/** The bar along the bottom with one or two lines (Latin, then English). */
function caption(p: Pixels, pal: Pal, lines: string[]): void {
  p.rect(0, 172, W, H - 172, pal.c('ink', 0));
  lines.forEach((l, i) => centered(p, 176 + i * 12, l, pal.c(i ? 'ochre' : 'marble', 3)));
}

/** Words said over (x, y), outlined. */
function say(p: Pixels, pal: Pal, x: number, y: number, words: string, ramp = 'gold', k = 3, scale = 1): void {
  outlined(p, Math.round(x - textWidth(words, scale) / 2), y, words, pal.c(ramp, k), pal.c('ink', 0), scale);
}

const sprite = (set: Map<string, Pixels>, name: string) => {
  const s = set.get(name);
  if (!s) throw new Error(`No sprite ${name}`);
  return s;
};

/** A dining couch with a senator on it, at (x, y: the couch's top), scaled 2. */
function couch(p: Pixels, pal: Pal, x: number, y: number, cough: boolean): void {
  const c = pal.c;
  p.rect(x, y + 10, 70, 12, c('purple', 1))
    .rect(x, y + 10, 70, 2, c('purple', 2))
    .rect(x + 4, y + 22, 4, 10, c('wood', 2))
    .rect(x + 62, y + 22, 4, 10, c('wood', 2));
  blob(p, x + 30, y + 4, 22, 8, pal.r('toga'), 1, 3);
  blob(p, x + 12, y - 8 + (cough ? -2 : 0), 8, 8, pal.r('skin'), 2, 4);
  p.line(x + 4, y - 14, x + 18, y - 16, c('laurel', 2))
    .set(x + 9, y - 9, c('ink', 0))
    .set(x + 15, y - 9, c('ink', 0));
  if (cough) {
    p.rect(x + 10, y - 4, 5, 4, c('ink', 0));
    for (const [dx, dy] of [
      [20, -10],
      [24, -14],
      [22, -6],
    ])
      p.disc(x + dx, y + dy, 1.5, c('steam', 2));
  } else p.rect(x + 10, y - 3, 5, 1, c('ink', 0));
}

/** The triclinium: red walls, a frieze, the mosaic floor. */
function triclinium(pal: Pal): Pixels {
  const c = pal.c;
  const p = new Pixels(W, H);
  p.rect(0, 0, W, 150, c('pompeii', 1));
  for (let x = 0; x < W; x += 64) p.rect(x + 6, 30, 52, 100, c('pompeii', 2)).frame(x + 6, 30, 52, 100, c('ochre', 2));
  p.rect(0, 0, W, 24, c('pompeii', 0)).rect(0, 24, W, 3, c('ochre', 2));
  for (let y = 150; y < H; y++) for (let x = 0; x < W; x++) p.set(x, y, (x + y * 3) % 7 === 0 ? c('marble', 1) : c('marble', 3));
  p.rect(0, 150, W, 3, c('ink', 0));
  return p;
}

// ---- the title: the art drawn for the game ----------------------------------------------------

/** How many pictures of the cover the title animates through. */
const COVER_FRAMES = 12;

/** The title cartoon (cover.fli: the cover comes to life, an iris closes, a fade to black) and the cover with the name on it (title.gif's pixels and palette). */
export function coverFli(): { fli: Uint8Array; title: Pixels; pal: Uint8Array } {
  const frames = Array.from({ length: COVER_FRAMES }, (_, k) => coverRgb(k / (COVER_FRAMES - 1)));
  // inks for the lettering first (black, Pompeian red, gold, a deep shadow, white), then the cover's colors
  const INKS: [number, number, number][] = [
    [0, 0, 0],
    [190, 40, 30],
    [255, 210, 90],
    [40, 20, 16],
    [255, 255, 255],
  ];
  const pal = medianCutPalette(frames, INKS);
  const q = new Quantizer(pal, 10);
  const pics = frames.map((f) => {
    const p = new Pixels(W, H);
    p.px.set(q.apply(f, W, H));
    return p;
  });
  const name = (p: Pixels, drop: number, sub: boolean) => {
    outlined(p, 160 - textWidth('VENI, VIDI, RISI!', 2) / 2, drop, 'VENI, VIDI, RISI!', 1, 3, 2, 3);
    if (sub) {
      outlined(p, 160 - textWidth('I CAME, I SAW, I LAUGHED') / 2, drop + 22, 'I CAME, I SAW, I LAUGHED', 2, 3);
      p.rect(0, 186, W, 14, 3);
      centered(p, 189, `${AUTHOR} (c) 1995 Shareware`, 4);
    }
  };
  const r = new Reel(pal);
  r.fadeIn(pics[0], 6);
  pics.forEach((p, i) => r.add(p, i === 0 ? 4 : 2));
  const last = pics[pics.length - 1];
  // the name is the title picture's: the cartoon closes on an iris and fades to black instead
  r.irisOut(176, 78, 8).fadeOut(fadeOutLength(SPEED));
  const title = new Pixels(W, H);
  title.px.set(last.px);
  name(title, 7, true);
  return { fli: r.fli(SPEED), title, pal };
}

// ---- the story ---------------------------------------------------------------------------------

export function storyFli(cast: Cast): Uint8Array {
  const pal = buildScreenPalette();
  const c = pal.c;
  const r = new Reel(pal.pal);
  const M = (n: string) => sprite(cast.man, n);
  const N = (n: string) => sprite(cast.mons, n);
  // 1. Marcus declaims to a row of stone faces. Nobody laughs.
  const hall = portico(pal, 7);
  const recital = (p: Pixels, k: number) => {
    scaleBlit(p, M(k % 8 < 4 ? 'sing0' : 'sing1'), 50, 108, 3);
    for (let i = 0; i < 4; i++) scaleBlit(p, N(`stony${(k >> 3) % 2}`), 150 + i * 36, 116, 2);
    if (k < 14) say(p, pal, 80, 84, 'COGITO... SCRIBO...', 'marble', 3);
    if (k >= 20 && k % 6 < 3) say(p, pal, 220, 96, '...', 'marble', 3);
    caption(
      p,
      pal,
      k < 16 ? ['Cogito, scribo, quaero iocum.', 'I think, I write, I seek the joke.'] : ['Omnes spectant, nemo ridet.', 'Everyone watches. No one laughs.'],
    );
  };
  const first = new Pixels(W, H);
  first.px.set(hall.px);
  recital(first, 0);
  r.fadeIn(first, 4);
  for (let k = 0; k < 32; k++) r.frame(hall, (p) => recital(p, k));
  // 2. The banquet. Under the table, in shadow, Rufus. Then the event.
  const room = triclinium(pal);
  const banquet = (p: Pixels, k: number) => {
    couch(p, pal, 20, 110, k >= 20 && k % 4 < 2);
    couch(p, pal, 230, 110, k >= 22 && k % 4 >= 2);
    // the table and Rufus asleep beneath it
    p.rect(110, 120, 100, 6, c('marble', 3)).rect(156, 126, 8, 24, c('bronze', 2));
    for (const [fx, fy] of [
      [126, 116],
      [140, 114],
      [176, 116],
      [190, 115],
    ])
      blob(p, fx, fy, 4, 4, pal.r('grape'), 0, 2);
    p.rect(110, 126, 100, 24, c('ink', 1));
    blob(p, 160, 142, 30, 8, pal.r('rufus'), 0, 2);
    blob(p, 136, 138, 9, 7, pal.r('rufus'), 1, 3);
    p.set(132, 137, c('ink', 0)).line(128, 132, 125, 141, c('rufus', 0));
    if (k < 12) say(p, pal, 190, 130, 'z z', 'marble', 3);
    if (k >= 12) {
      const g = Math.min(1, (k - 12) / 8);
      for (let i = 0; i < 6; i++) blob(p, 160 + Math.cos(i) * 40 * g, 130 - g * 40 - i * 6, 14 * g + 4, 10 * g + 3, pal.r('gas'), 1, 3);
    }
    if (k >= 14 && k < 22) say(p, pal, 160, 50, 'PFFFRRRT!', 'gas', 3, 2);
    if (k >= 22) scaleBlit(p, N(k % 4 < 2 ? 'flavia0' : 'flavia1'), 140, 60, 2);
    caption(p, pal, k < 12 ? ['Sub mensa... in tenebris...', 'Beneath the table, in shadow...'] : ['Canis meus flatum dedit!', 'My dog has released a fart!']);
  };
  for (let k = 0; k < 36; k++)
    r.frame(room, (p) => banquet(p, k), 1, 1, k >= 13 && k < 30 ? greened(pal.pal, Math.min(1, (k - 13) / 6) * (k < 24 ? 1 : (30 - k) / 6)) : pal.pal);
  // 3. The Senate's decree, and Emperor Gravis, stern
  const curia = portico(pal, 9);
  const decree = (p: Pixels, k: number) => {
    const open = Math.min(1, k / 10);
    const w = Math.round(180 * open);
    p.rect(160 - w / 2, 46, w, 84, c('parch', 4)).frame(160 - w / 2, 46, w, 84, c('parch', 1));
    p.disc(160 - w / 2, 88, 6, c('parch', 2)).disc(160 + w / 2, 88, 6, c('parch', 2));
    if (open >= 1) {
      centered(p, 54, 'S.P.Q.R.', c('pompeii', 1));
      centered(p, 70, 'MAKE THE EMPEROR', c('ink', 0));
      centered(p, 82, 'LAUGH, OR COUNT', c('ink', 0));
      centered(p, 94, 'THE SAND OF THE', c('ink', 0));
      centered(p, 106, 'CIRCUS MAXIMUS.', c('ink', 0));
    }
    if (k >= 16) {
      scaleBlit(p, N('gravisA0a'), 250, 110, 2);
      scaleBlit(p, N('gravisB0a'), 250, 150, 2);
    }
    if (k >= 22) scaleBlit(p, M('worry'), 40, 130, 2);
    caption(p, pal, k < 16 ? ['Senatus locutus est.', 'The Senate has spoken.'] : ['Veni, vidi... risi?', 'I came, I saw... I laughed?']);
  };
  for (let k = 0; k < 36; k++) r.frame(curia, (p) => decree(p, k));
  r.fadeOut(4);
  return r.fli(SPEED);
}

// ---- the level cards --------------------------------------------------------------------------

export interface CardView {
  /** The level's view (16 x 6 blocks), in the level's palette. */
  map: Pixels;
  pal: Pal;
}

/** The strip of the level on a card: y 54 to 174. */
const STRIP = 54;

export function cardFli(i: number, card: CardView, cast: Cast): Uint8Array {
  const pal = card.pal;
  const c = pal.c;
  const ink = c('ink', 0);
  const info = CARDS[i];
  const bg = new Pixels(W, H, ink);
  bg.blit(card.map, 0, STRIP);
  const big = textWidth(info.title, 2) <= 300;
  const frame = (p: Pixels, k: number) => {
    p.rect(0, 0, W, STRIP, ink).rect(0, 174, W, 26, ink);
    p.rect(0, STRIP - 1, W, 1, c('gold', 1)).rect(0, 174, W, 1, c('gold', 1));
    const drop = [-24, -14, -2, 6, 3, 4][Math.min(5, k)];
    micro(p, 4, 3, info.numeral, c('gold', 2), 2);
    outlined(p, 160 - textWidth(info.title, big ? 2 : 1) / 2, drop + (big ? 0 : 6), info.title, c('marble', 3), c('pompeii', 0), big ? 2 : 1);
    if (k >= 5) centered(p, 34, info.english, c('ochre', 3));
    // what to do here, and the key for it
    if (k >= 18) centered(p, 44, info.goal, c('marble', 3));
    if (k >= 9) centered(p, 178, info.lines[0], c('marble', 3));
    if (k >= 15) centered(p, 189, info.lines[1], c('ochre', 3));
  };
  const M = (name: string) => sprite(cast.man, name);
  const F = (name: string) => sprite(cast.cat, name);
  const N = (name: string) => sprite(cast.mons, name);
  const words = (p: Pixels, x: number, y: number, w: string, ramp = 'gold') => outlined(p, Math.round(x - textWidth(w) / 2), y, w, c(ramp, 3), ink);
  const r = new Reel(pal.pal);
  const K = 30;
  const scene: ((p: Pixels, k: number) => void)[] = [
    // I. green clouds drift up from the table; Marcus holds his nose and hops them
    (p, k) => {
      for (let d = 0; d < 3; d++) scaleBlit(p, N(`gas${k % 2}`), 70 + d * 80 + Math.round(Math.sin(k / 3 + d) * 6), STRIP + 90 - ((k * 3 + d * 30) % 90), 2);
      const hopping = k >= 12 && k < 20;
      scaleBlit(p, M(hopping ? 'hopSide' : `walk${k % 4}`), 10 + k * 6, STRIP + 80 - (hopping ? Math.round(Math.sin(((k - 12) / 8) * Math.PI) * 30) : 0), 2);
      if (k >= 20) words(p, 10 + k * 6 + 20, STRIP + 56, 'O DII!', 'gas');
    },
    // II. Marcus runs; the horde behind him; dust
    (p, k) => {
      const x = 60 + k * 6;
      for (let d = 0; d < 5; d++) p.disc(x - 8 - d * 9, STRIP + 112 - (d % 2) * 4, 3 + d, c('dirt', 3));
      scaleBlit(p, M(`walk${k % 4}`), x, STRIP + 80, 2);
      scaleBlit(p, N(`gaul${(k >> 1) % 2}`), x - 90 + Math.min(20, k), STRIP + 80, 2);
      scaleBlit(p, N(`gaulB${(k >> 1) % 2}`), x - 130 + Math.min(20, k), STRIP + 80, 2);
      if (k >= 10) words(p, x + 20, STRIP + 58, 'CUCURRI-CURRI-CURRIMUS!');
    },
    // III. a titulus twists its letters, a spell flies past
    (p, k) => {
      const tw = k >= 12;
      p.rect(120, STRIP + 30, 80, 26, tw ? c('ochre', 3) : c('marble', 3))
        .frame(120, STRIP + 30, 80, 26, c('pompeii', 1))
        .rect(158, STRIP + 56, 4, 30, c('wood', 1));
      say(p, pal, 160, STRIP + 39, tw ? 'TVTIS TVT!' : 'TITVS TOT', tw ? 'pompeii' : 'ink', tw ? 2 : 0);
      scaleBlit(p, N(`spell${k % 2}`), 300 - k * 10, STRIP + 20, 2);
      scaleBlit(p, M(k < 12 ? `walk${k % 4}` : 'sing1'), Math.min(80, 10 + k * 6), STRIP + 80, 2);
    },
    // IV. Felix stalks a mouse with its cheese; MIAU!
    (p, k) => {
      scaleBlit(p, F(k < 16 ? `sneak${k % 2}` : 'joke1'), 30 + Math.min(16, k) * 6, STRIP + 80, 2);
      if (k < 18) scaleBlit(p, N(`mouse${k % 2}`), 220, STRIP + 80, 2);
      else scaleBlit(p, N(`crumb${k % 2}`), 220, STRIP + 80, 2);
      if (k >= 16 && k < 24) words(p, 170, STRIP + 60, 'MIAU!', 'laurel');
    },
    // V. golden notes rise from the diva's basin
    (p, k) => {
      for (let n = 0; n < 5; n++) scaleBlit(p, N(`note${(k + n) % 2}`), 150 + Math.round(Math.sin(k / 3 + n) * 30), STRIP + 100 - ((k * 4 + n * 22) % 110), 2);
      scaleBlit(p, M(k % 10 < 5 ? 'sing0' : 'bliss'), 40, STRIP + 80, 2);
      if (k >= 14) words(p, 160, STRIP + 4, 'O PISCIS AUREUS!', 'fish');
    },
    // VI. a row of stone faces; a joke flies; one by one they crack up
    (p, k) => {
      for (let s = 0; s < 4; s++) {
        const laughing = k > 8 + s * 5;
        scaleBlit(p, N(laughing ? `laugher${k % 2}` : 'stony0'), 120 + s * 44, STRIP + 80, 2);
      }
      scaleBlit(p, M(k % 6 < 3 ? 'joke0' : 'joke1'), 30, STRIP + 80, 2);
      if (k > 2 && k < 26) scaleBlit(p, N(`joke${k % 2}`), 70 + ((k * 14) % 150), STRIP + 84, 2);
    },
  ];
  const first = new Pixels(W, H);
  first.px.set(bg.px);
  scene[i](first, 0);
  frame(first, 0);
  r.fadeIn(first, 3);
  for (let k = 0; k < K; k++) r.frame(bg, (p) => (scene[i](p, k), frame(p, k)), 1, i === 3 ? 0.85 : 1);
  return r.fli(SPEED);
}

// ---- how to play ------------------------------------------------------------------------------

export function howtoFli(cast: Cast): Uint8Array {
  const pal = buildScreenPalette();
  const r = new Reel(pal.pal);
  const bg = portico(pal, 11);
  const M = (n: string) => sprite(cast.man, n);
  const N = (n: string) => sprite(cast.mons, n);
  const scene = (p: Pixels, k: number) => {
    // a cloud of Rufus's on the floor; Marcus walks and hops over it
    if (k < 30) scaleBlit(p, N(`gas${(k >> 1) % 2}`), 104, 128, 2);
    let x = 40 + k * 5;
    let y = 120;
    let pose = `walk${k % 4}`;
    if (k >= 8 && k < 18) {
      y = 120 - Math.round(Math.sin(((k - 8) / 10) * Math.PI) * 40);
      pose = 'hopSide';
    }
    if (k >= 30) {
      x = 70;
      pose = k % 6 < 3 ? 'joke0' : 'joke1';
      const t = k - 30;
      scaleBlit(p, N(t < 16 ? 'stony0' : `laugher${t % 2}`), 230, 120, 2);
      if (t >= 2 && t < 16) scaleBlit(p, N(`joke${t % 2}`), 110 + (t - 2) * 9, 118, 2);
      if (t >= 16) say(p, pal, 250, 96, 'HA HA HA!', 'gold', 3);
    }
    scaleBlit(p, M(pose), x, y, 2);
    if (k >= 9 && k < 16) say(p, pal, x + 20, y - 14, 'HOP!');
    caption(
      p,
      pal,
      k < 30 ? ['UP hops, Q and E hop sideways.', 'Hop the clouds (or tell a joke).'] : ['SPACE: a joke to the right, Z: left.', 'Stone faces laugh at last.'],
    );
  };
  const first = new Pixels(W, H);
  first.px.set(bg.px);
  scene(first, 0);
  r.fadeIn(first, 3);
  for (let k = 0; k < 54; k++) r.frame(bg, (p) => scene(p, k));
  r.fadeOut(3);
  return r.fli(SPEED);
}

// ---- the lost ending: counting the sand of the Circus Maximus ---------------------------------

export function lostFli(cast: Cast): Uint8Array {
  const pal = buildScreenPalette();
  const c = pal.c;
  const r = new Reel(pal.pal);
  const bg = new Pixels(W, H);
  for (let y = 0; y < 120; y++) for (let x = 0; x < W; x++) bg.set(x, y, c('dusk', y < 60 ? 0 : 1));
  bg.disc(260, 36, 14, c('marble', 3));
  const rs = rng(5);
  for (let i = 0; i < 40; i++) bg.set(Math.floor(rs() * W), Math.floor(rs() * 100), c('marble', 3));
  // the stands of the Circus far off, and the sand
  for (let x = 0; x < W; x++) bg.rect(x, 96 - (x % 12 < 6 ? 4 : 0), 1, 24, c('stone', 1));
  for (let y = 120; y < H; y++) for (let x = 0; x < W; x++) bg.set(x, y, (x * 7 + y * 13) % 11 === 0 ? c('ochre', 3) : c('ochre', 1));
  const nums = ['UNUM', 'DUO', 'TRES', 'QUATTUOR', 'QUINQUE', '...'];
  const scene = (p: Pixels, k: number) => {
    scaleBlit(p, sprite(cast.man, k % 16 < 12 ? 'sneak0' : 'worry'), 120, 118, 3);
    say(p, pal, 150, 90, nums[Math.min(nums.length - 1, Math.floor(k / 8))], 'marble', 3);
    if (k >= 36) scaleBlit(p, sprite(cast.mons, 'teddy0'), 210, 136, 2);
    caption(
      p,
      pal,
      k < 30 ? ['Rident in corde... sed tacent.', 'They laugh in their hearts.'] : ['Risus erit... forsitan cras?', 'Laughter... maybe tomorrow? Try again!'],
    );
  };
  const first = new Pixels(W, H);
  first.px.set(bg.px);
  scene(first, 0);
  r.fadeIn(first, 3);
  for (let k = 0; k < 60; k++) r.frame(bg, (p) => scene(p, k));
  r.fadeOut(4);
  return r.fli(SPEED);
}

// ---- the endings ----------------------------------------------------------------------------

/** won1.fli (Gravis cracks up: RISIT!), won2.fli (the laurel crown: VENI. VIDI. RISI.), won3.fli (the curtain call). */
export function wonFlis(cast: Cast): Record<string, Uint8Array> {
  const pal = buildScreenPalette();
  const c = pal.c;
  const files: Record<string, Uint8Array> = {};
  const M = (n: string) => sprite(cast.man, n);
  const N = (n: string) => sprite(cast.mons, n);
  const stage = () => {
    const p = portico(pal, 21);
    p.rect(0, 150, W, 50, c('wood', 2));
    for (let y = 154; y < H; y += 6) p.rect(0, y, W, 1, c('wood', 1));
    return p;
  };
  {
    // Emperor Gravis cracks up, stage by stage, and the theater laughs with him
    const r = new Reel(pal.pal);
    const bg = stage();
    const scene = (p: Pixels, k: number) => {
      const s = Math.min(3, Math.floor(k / 8));
      const f = k % 2 ? 'b' : 'a';
      scaleBlit(p, N(`gravisA${s}${f}`), 200, 70 + (s >= 3 ? k % 2 : 0), 3);
      scaleBlit(p, N(`gravisB${s >= 3 ? 3 : 0}${f}`), 200, 130, 3);
      scaleBlit(p, M(k < 24 ? 'joke0' : 'bliss'), 70, 118, 3);
      if (k >= 24) {
        say(p, pal, 230, 40, 'RISIT!', 'gold', 3, 3);
        for (let i = 0; i < 5; i++) scaleBlit(p, N(`laugher${(k + i) % 2}`), 6 + i * 30, 146, 1);
      }
      caption(p, pal, k < 24 ? ['Gravis... subridet?', 'Gravis... smiles?'] : ['RISIT! Imperator risit!', 'He laughed! The Emperor laughed!']);
    };
    const first = new Pixels(W, H);
    first.px.set(bg.px);
    scene(first, 0);
    r.fadeIn(first, 3);
    for (let k = 0; k < 48; k++) r.frame(bg, (p) => scene(p, k), 1, 1, k >= 24 && k < 27 ? flashed(pal.pal, (27 - k) / 3) : pal.pal);
    files['won1.fli'] = r.fli(SPEED);
  }
  {
    // the laurel crown comes down onto Marcus: VENI. VIDI. RISI.
    const r = new Reel(pal.pal);
    const bg = stage();
    column(bg, pal, 160, 40, 150, 10);
    const scene = (p: Pixels, k: number) => {
      scaleBlit(p, M(k < 20 ? 'front' : 'bliss'), 130, 90, 3);
      const y = Math.min(78, 10 + k * 4);
      scaleBlit(p, N(`crown${k % 2}`), 130, y, 3);
      const words = ['VENI.', 'VIDI.', 'RISI.'];
      words.forEach((w, i) => k >= 18 + i * 8 && say(p, pal, 60 + i * 100, 24, w, 'gold', 3, 2));
      caption(p, pal, k < 18 ? ['Corona laurea.', 'A crown of laurel.'] : ['Veni, vidi, risi.', 'I came, I saw, I laughed.']);
    };
    const first = new Pixels(W, H);
    first.px.set(bg.px);
    scene(first, 0);
    r.fadeIn(first, 3);
    for (let k = 0; k < 52; k++) r.frame(bg, (p) => scene(p, k));
    files['won2.fli'] = r.fli(SPEED);
  }
  {
    // the curtain call: everyone bows; FABULA ACTA EST
    const r = new Reel(pal.pal);
    const bg = stage();
    const scene = (p: Pixels, k: number) => {
      outlined(p, 160 - textWidth('FABULA ACTA EST', 2) / 2, 40, 'FABULA ACTA EST', c('gold', 3), c('ink', 0), 2, c('pompeii', 0));
      centered(p, 62, 'The play is over.', c('marble', 3));
      const bow = k % 12 < 6;
      const line: [Map<string, Pixels>, string][] = [
        [cast.mons, `teddy${bow ? 1 : 0}`],
        [cast.mons, `gwinn${bow ? 1 : 0}`],
        [cast.man, bow ? 'bliss' : 'front'],
        [cast.cat, bow ? 'bliss' : 'front'],
        [cast.mons, `note${k % 2}`],
        [cast.mons, `jester${k % 2}`],
        [cast.mons, `gravisA3${k % 2 ? 'b' : 'a'}`],
      ];
      line.forEach(([set, name], i) => scaleBlit(p, sprite(set, name), 22 + i * 40, 112 + (bow && i % 2 ? 2 : 0), 2));
      // and Rufus, front and center, very pleased with himself
      blob(p, 160, 166, 18, 7, pal.r('rufus'), 1, 3);
      blob(p, 146, 160, 7, 6, pal.r('rufus'), 1, 3);
      p.set(143, 158, c('ink', 0)).set(149, 158, c('ink', 0)).rect(144, 163, 4, 1, c('ink', 0));
      say(p, pal, 120, 140, 'RUFUS', 'rufus', 3);
      caption(p, pal, [`${AUTHOR} (c) 1995`, 'Thank you for laughing!']);
    };
    const first = new Pixels(W, H);
    first.px.set(bg.px);
    scene(first, 0);
    r.fadeIn(first, 3);
    for (let k = 0; k < 40; k++) r.frame(bg, (p) => scene(p, k));
    files['won3.fli'] = r.fli(SPEED);
  }
  return files;
}
