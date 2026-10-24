// The prop shop: everything the books are acted out with. Floors, walls and furniture as
// 20x20 blocks; little people (and dogs, and clowns) as transparent sprites to lay over a
// floor; and signs lettered in a 3x5 font for the puns.
import { Pixels, rng } from '../../../kit/pixels';
import { CLEAR, bevel, blob, micro, shadeAt } from './draw';
import { c, r } from './pal';

export const blank = () => new Pixels(20, 20, CLEAR);

/** A sprite laid over a background block. */
export function on(base: Pixels, ...sprites: Pixels[]): Pixels {
  const p = new Pixels(20, 20);
  p.px.set(base.px);
  for (const s of sprites) p.blit(s, 0, 0, CLEAR);
  return p;
}

// ------------------------------------------------------------------ floors and walls

export type FloorKind =
  | 'boards'
  | 'parquet'
  | 'tile'
  | 'marble'
  | 'grass'
  | 'sand'
  | 'water'
  | 'stone'
  | 'carpet'
  | 'sawdust'
  | 'lino'
  | 'night'
  | 'space'
  | 'mist'
  | 'road'
  | 'dirt'
  | 'deck'
  | 'snow'
  | 'dark';

/** A floor block; `tint` names the ramp for carpets and tiles. */
export function floor(kind: FloorKind, seed = 1, tint = 'red'): Pixels {
  const p = new Pixels(20, 20);
  const R = rng(seed * 7919 + kind.length * 31);
  const k = r(tint);
  switch (kind) {
    case 'boards':
    case 'deck':
      for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, shadeAt(r('wood'), 2, 3, 0.4 + 0.3 * Math.sin(x * 0.9 + y * 0.15 + seed), x, y));
      for (const y of [4, 9, 14, 19]) p.rect(0, y, 20, 1, c('wood', kind === 'deck' ? 0 : 1));
      p.rect(Math.floor(R() * 18), 0, 1, 4, c('wood', 1)).rect(Math.floor(R() * 18), 10, 1, 4, c('wood', 1));
      break;
    case 'parquet':
      for (let y = 0; y < 20; y++)
        for (let x = 0; x < 20; x++) {
          const cell = (Math.floor(x / 10) + Math.floor(y / 10)) % 2;
          const stripe = cell ? x % 5 : y % 5;
          p.set(x, y, stripe === 0 ? c('wood', 1) : c('wood', cell ? 3 : 2));
        }
      break;
    case 'tile':
      for (let y = 0; y < 20; y++)
        for (let x = 0; x < 20; x++)
          // two close tones, so the white word slips stand out on them
          p.set(
            x,
            y,
            x % 10 === 0 || y % 10 === 0 ? k[Math.max(0, k.length - 4)] : (Math.floor(x / 10) + Math.floor(y / 10)) % 2 ? k[k.length - 3] : k[k.length - 2],
          );
      break;
    case 'marble':
      for (let y = 0; y < 20; y++)
        for (let x = 0; x < 20; x++) p.set(x, y, Math.sin(x * 0.5 + y * 0.8 + Math.sin(y * 0.6) * 2 + seed) > 0.85 ? c('grey', 3) : c('grey', 5));
      p.rect(0, 0, 20, 1, c('grey', 4)).rect(0, 0, 1, 20, c('grey', 4));
      break;
    case 'grass':
      for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, R() < 0.15 ? c('green', 3) : R() < 0.1 ? c('green', 1) : c('green', 2));
      break;
    case 'sand':
      for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, R() < 0.12 ? c('sand', 1) : R() < 0.1 ? c('sand', 3) : c('sand', 2));
      break;
    case 'water':
      for (let y = 0; y < 20; y++)
        for (let x = 0; x < 20; x++) p.set(x, y, Math.sin(x * 0.6 + y * 1.3 + seed) > 0.7 ? c('blue', 4) : shadeAt(r('blue'), 1, 2, y / 20, x, y));
      break;
    case 'stone':
      for (let y = 0; y < 20; y++)
        for (let x = 0; x < 20; x++) {
          const row = Math.floor(y / 5);
          const edge = y % 5 === 4 || (x + (row % 2) * 5) % 10 === 0;
          p.set(x, y, edge ? c('grey', 1) : R() < 0.2 ? c('grey', 2) : c('grey', 3));
        }
      break;
    case 'carpet':
      for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, (x + y) % 6 === 0 ? k[3] : (x - y + 40) % 6 === 0 ? k[1] : k[2]);
      break;
    case 'sawdust':
      for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, R() < 0.25 ? c('sand', 3) : R() < 0.15 ? c('wood', 4) : c('sand', 2));
      break;
    case 'lino':
      for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, (Math.floor(x / 5) + Math.floor(y / 5)) % 2 ? c('paper', 4) : c(tint, 3));
      break;
    case 'night':
      for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, R() < 0.12 ? c('night', 2) : c('night', 1));
      break;
    case 'space':
      p.rect(0, 0, 20, 20, c('night', 0));
      for (let i = 0; i < 5; i++) p.set(Math.floor(R() * 20), Math.floor(R() * 20), R() < 0.5 ? c('paper', 4) : c(tint, 4));
      break;
    case 'mist':
      for (let y = 0; y < 20; y++)
        for (let x = 0; x < 20; x++) p.set(x, y, shadeAt(r('grey'), 3, 5, 0.5 + 0.5 * Math.sin(x * 0.4 + seed) * Math.cos(y * 0.3 + seed), x, y));
      break;
    case 'road':
      for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, R() < 0.1 ? c('grey', 2) : c('grey', 1));
      break;
    case 'dirt':
      for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, R() < 0.2 ? c('brown', 3) : c('brown', 2));
      break;
    case 'snow':
      for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, R() < 0.1 ? c('sky', 3) : c('grey', 5));
      break;
    case 'dark':
      for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, R() < 0.08 ? c('ink', 2) : c('ink', 1));
      break;
  }
  return p;
}

/** A solid wall: brick, panel or hedge. */
export function wall(kind: 'brick' | 'panel' | 'hedge' | 'stone' | 'fence' | 'wallpaper' | 'rail', tint = 'red', seed = 1): Pixels {
  const p = new Pixels(20, 20);
  const R = rng(seed);
  if (kind === 'brick')
    for (let y = 0; y < 20; y++)
      for (let x = 0; x < 20; x++) {
        const row = Math.floor(y / 5);
        p.set(x, y, y % 5 === 4 || (x + (row % 2) * 5) % 10 === 9 ? c('grey', 3) : c(tint, R() < 0.2 ? 1 : 2));
      }
  else if (kind === 'panel') {
    bevel(p, 0, 0, 20, 20, r('wood'), 2, 2);
    p.frame(4, 4, 12, 12, c('wood', 1));
  } else if (kind === 'hedge') {
    p.rect(0, 0, 20, 20, c('green', 1));
    for (let i = 0; i < 14; i++) blob(p, R() * 20, R() * 20, 4, 4, r('green'), 1, 4);
  } else if (kind === 'stone') {
    p.px.set(floor('stone', seed).px);
    p.rect(0, 0, 20, 2, c('grey', 4));
  } else if (kind === 'fence') {
    p.px.set(floor('grass', seed).px);
    for (let x = 1; x < 20; x += 5) p.rect(x, 2, 3, 18, c('wood', 4)).rect(x + 2, 2, 1, 18, c('wood', 2));
    p.rect(0, 6, 20, 2, c('wood', 3)).rect(0, 14, 20, 2, c('wood', 3));
  } else if (kind === 'wallpaper') {
    for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, x % 5 === 2 ? c(tint, 3) : c(tint, 4));
    p.rect(0, 16, 20, 4, c('wood', 2)).rect(0, 16, 20, 1, c('wood', 4));
  } else {
    p.px.set(floor('water', seed).px);
    p.rect(0, 4, 20, 2, c('paper', 4)).rect(0, 12, 20, 2, c('paper', 4));
    for (let x = 1; x < 20; x += 4) p.rect(x, 4, 1, 10, c('paper', 3));
  }
  return p;
}

// ------------------------------------------------------------------ signs

/**
 * A sign `blocks` wide lettered with up to three lines of the 3x5 font (5 characters a
 * block, centered), cut into 20x20 blocks. `base` is what shows around a hanging sign.
 */
export function sign(lines: string[], blocks: number, o: { board?: string; ink?: string; base?: Pixels; edge?: string } = {}): Pixels[] {
  const W = blocks * 20;
  const p = new Pixels(W, 20, CLEAR);
  if (o.base) for (let i = 0; i < blocks; i++) p.blit(o.base, i * 20, 0);
  const board = o.board ?? 'paper';
  bevel(p, 0, 1, W, 18, r(board), board === 'paper' ? 3 : 2, 1);
  p.frame(0, 1, W, 18, c(o.edge ?? 'wood', 1));
  const ink = o.ink ? c(o.ink, o.ink === 'paper' ? 4 : 0) : c('ink', 0);
  const top = lines.length === 1 ? 8 : lines.length === 2 ? 4 : 2;
  lines.forEach((t, i) => {
    if (t.length * 4 - 1 > W - 2) throw new Error(`Sign line too long: ${t}`);
    micro(p, Math.round((W - (t.length * 4 - 1)) / 2), top + i * 6, t, ink);
  });
  return Array.from({ length: blocks }, (_, i) => p.crop(i * 20, 0, 20, 20));
}

// ------------------------------------------------------------------ people

export interface FigureLook {
  skin?: string;
  hair?: [string, number];
  hairStyle?: 'short' | 'long' | 'bun' | 'bald' | 'pigtails' | 'wild';
  hat?: { kind: 'fedora' | 'crown' | 'cap' | 'santa' | 'top' | 'tricorn' | 'beret' | 'bandana' | 'helmet'; color: [string, number] };
  shirt: [string, number];
  pants?: [string, number];
  /** Clown faces: whiteface, auguste (pink and red), hobo (Doc Leo: painted stubble, white mouth, his own sunburned nose). */
  face?: 'plain' | 'whiteface' | 'auguste' | 'hobo' | 'shades' | 'sad' | 'happy' | 'eyepatch';
  beard?: [string, number];
  tie?: [string, number];
  glasses?: boolean;
  /** A child: drawn smaller. */
  small?: boolean;
  /** A dress or long coat instead of trousers. */
  dress?: boolean;
  /** Arms up (cheering, shouting) or out. */
  arms?: 'down' | 'up' | 'out';
  big?: boolean;
}

/** A little person, 20x20, standing and facing you. */
export function figure(f: FigureLook, step = 0): Pixels {
  const p = blank();
  const O = c('ink', 0);
  const s = f.small ? 2 : 0; // a child starts lower
  const skin = f.face === 'whiteface' ? c('paper', 4) : c(f.skin ?? 'skin', 2);
  const hx = 7;
  const hy = 2 + s * 2;
  // head
  p.rect(hx - 1, hy, 8, 7, O);
  p.rect(hx, hy + 1, 6, 5, skin);
  // hair
  if (f.hair && f.hairStyle !== 'bald') {
    const hc = c(f.hair[0], f.hair[1]);
    p.rect(hx, hy, 6, 2, hc);
    if (f.hairStyle === 'long') p.rect(hx - 1, hy + 1, 1, 7, hc).rect(hx + 6, hy + 1, 1, 7, hc);
    if (f.hairStyle === 'bun') p.rect(hx + 1, hy - 2, 4, 2, hc);
    if (f.hairStyle === 'pigtails') p.rect(hx - 2, hy + 2, 2, 3, hc).rect(hx + 6, hy + 2, 2, 3, hc);
    if (f.hairStyle === 'wild')
      p.rect(hx - 2, hy, 2, 4, hc)
        .rect(hx + 6, hy, 2, 4, hc)
        .rect(hx, hy - 1, 6, 1, hc);
  }
  // face
  const eye = O;
  if (f.face === 'shades') p.rect(hx, hy + 2, 6, 2, O);
  else if (f.face === 'eyepatch')
    p.rect(hx, hy + 2, 3, 2, O)
      .set(hx + 4, hy + 3, eye)
      .line(hx, hy + 1, hx + 6, hy + 3, O);
  else p.set(hx + 1, hy + 3, eye).set(hx + 4, hy + 3, eye);
  if (f.glasses) p.frame(hx, hy + 2, 3, 3, c('brass', 2)).frame(hx + 3, hy + 2, 3, 3, c('brass', 2));
  if (f.face === 'whiteface' || f.face === 'auguste') p.rect(hx + 2, hy + 3, 2, 2, c('red', 3)); // the red nose
  if (f.face === 'hobo') p.rect(hx + 2, hy + 3, 2, 2, c('pink', 2)); // his own nose, sunburned
  if (f.face === 'auguste')
    p.set(hx, hy + 4, c('pink', 2))
      .set(hx + 5, hy + 4, c('pink', 2))
      .rect(hx + 1, hy + 5, 4, 1, c('red', 2));
  if (f.face === 'hobo') {
    p.rect(hx, hy + 5, 6, 1, c('night', 2)).rect(hx + 2, hy + 5, 2, 1, c('paper', 4));
    p.set(hx, hy + 3, c('pink', 2)).set(hx + 5, hy + 3, c('pink', 2));
  } else if (f.face === 'sad')
    p.rect(hx + 2, hy + 5, 2, 1, O)
      .set(hx + 1, hy + 6, O)
      .set(hx + 4, hy + 6, O);
  else if (f.face === 'happy' || f.face === 'auguste' || f.face === 'whiteface')
    p.set(hx + 1, hy + 5, O)
      .rect(hx + 2, hy + 6, 2, 1, O)
      .set(hx + 4, hy + 5, O);
  else if (f.face !== 'shades') p.rect(hx + 2, hy + 5, 2, 1, c('red', 1));
  else p.rect(hx + 2, hy + 5, 2, 1, O);
  if (f.beard) p.rect(hx, hy + 4, 6, 3, c(f.beard[0], f.beard[1])).rect(hx + 2, hy + 5, 2, 1, c('red', 1));
  // hats
  if (f.hat) {
    const hc = c(f.hat.color[0], f.hat.color[1]);
    const hd = c(f.hat.color[0], Math.max(0, f.hat.color[1] - 2));
    switch (f.hat.kind) {
      case 'fedora':
        p.rect(hx - 2, hy, 10, 1, hd)
          .rect(hx, hy - 3, 6, 3, hc)
          .rect(hx, hy - 1, 6, 1, c('red', 1));
        break;
      case 'crown':
        p.rect(hx, hy - 2, 6, 2, c('brass', 3))
          .set(hx, hy - 3, c('brass', 4))
          .set(hx + 2, hy - 3, c('brass', 4))
          .set(hx + 5, hy - 3, c('brass', 4))
          .set(hx + 3, hy - 1, c('red', 3));
        break;
      case 'cap':
        p.rect(hx, hy - 1, 6, 2, hc).rect(hx + 5, hy, 3, 1, hd);
        break;
      case 'santa':
        p.rect(hx - 1, hy, 8, 1, c('paper', 4))
          .rect(hx, hy - 2, 6, 2, c('red', 3))
          .rect(hx + 5, hy - 3, 2, 2, c('red', 3))
          .set(hx + 7, hy - 2, c('paper', 4));
        break;
      case 'top':
        p.rect(hx - 1, hy, 8, 1, hd)
          .rect(hx, hy - 5, 6, 5, hc)
          .rect(hx, hy - 2, 6, 1, c('red', 2));
        break;
      case 'tricorn':
        p.rect(hx - 2, hy - 1, 10, 2, hc)
          .set(hx - 2, hy - 2, hc)
          .set(hx + 7, hy - 2, hc)
          .rect(hx + 1, hy - 3, 4, 2, hc);
        break;
      case 'beret':
        p.rect(hx - 1, hy - 1, 7, 2, hc).set(hx + 3, hy - 2, hc);
        break;
      case 'bandana':
        p.rect(hx, hy - 1, 6, 2, hc)
          .set(hx + 6, hy + 1, hc)
          .set(hx + 7, hy + 2, hc);
        break;
      case 'helmet':
        p.rect(hx - 1, hy - 2, 8, 3, hc).rect(hx - 1, hy, 8, 1, hd);
        break;
    }
  }
  // body
  const by = hy + 7;
  const bh = f.small ? 5 : 6;
  const shirt = c(f.shirt[0], f.shirt[1]);
  p.rect(hx - 2, by, 10, bh, O);
  p.rect(hx - 1, by, 8, bh - 1, shirt);
  p.rect(hx - 1, by, 1, bh - 1, c(f.shirt[0], Math.min(5, f.shirt[1] + 1)));
  if (f.tie) p.rect(hx + 2, by, 2, 4, c(f.tie[0], f.tie[1]));
  // arms
  const arm = c(f.shirt[0], Math.max(0, f.shirt[1] - 1));
  if (f.arms === 'up')
    p.rect(hx - 3, by - 4, 2, 5, arm)
      .rect(hx + 7, by - 4, 2, 5, arm)
      .rect(hx - 3, by - 5, 2, 1, skin)
      .rect(hx + 7, by - 5, 2, 1, skin);
  else if (f.arms === 'out')
    p.rect(hx - 5, by + 1, 4, 2, arm)
      .rect(hx + 7, by + 1, 4, 2, arm)
      .rect(hx - 6, by + 1, 1, 2, skin)
      .rect(hx + 11, by + 1, 1, 2, skin);
  else
    p.rect(hx - 3, by + 1, 2, 4, arm)
      .rect(hx + 7, by + 1, 2, 4, arm)
      .rect(hx - 3, by + 5, 2, 1, skin)
      .rect(hx + 7, by + 5, 2, 1, skin);
  // legs
  const ly = by + bh;
  const lh = 20 - ly - 1;
  if (f.dress) {
    p.rect(hx - 2, ly - 1, 10, lh, c(f.shirt[0], Math.max(0, f.shirt[1] - 1)));
    p.rect(hx, 19, 2, 1, O).rect(hx + 4, 19, 2, 1, O);
  } else {
    const pc = c(...(f.pants ?? ['blue', 1]));
    const a = step ? 1 : 0;
    p.rect(hx, ly, 2, lh - a, pc).rect(hx + 4, ly, 2, lh - (1 - a), pc);
    p.rect(hx - 1, 19 - a, 3, 1, O).rect(hx + 4, 19 - (1 - a), 3, 1, O);
  }
  return p;
}

// ------------------------------------------------------------------ the household dogs

/** Teddy the corgi from the side: red-gold, white blaze and chest, ears up, a matched pair. */
export function corgi(step = 0, flip = false): Pixels {
  const p = blank();
  const O = c('ink', 0);
  const fur = c('corgi', 2);
  const lite = c('corgi', 3);
  const white = c('paper', 4);
  // body: long and low
  p.rect(3, 10, 13, 6, O).rect(4, 11, 11, 4, fur).rect(4, 11, 11, 1, lite).rect(9, 13, 5, 2, white);
  // head
  p.rect(13, 6, 6, 7, O).rect(14, 7, 4, 5, fur).rect(16, 9, 3, 3, white).set(18, 10, O).set(15, 8, O);
  p.rect(13, 3, 2, 4, O).rect(16, 3, 2, 4, O).set(13, 4, c('pink', 2)).set(16, 4, c('pink', 2));
  // legs (short!) and a fluffy rump
  const a = step ? 1 : 0;
  p.rect(5 + a, 16, 2, 3, fur)
    .rect(12 - a, 16, 2, 3, fur)
    .rect(5 + a, 19, 2, 1, white)
    .rect(12 - a, 19, 2, 1, white);
  p.rect(2, 11, 2, 3, lite);
  return flip ? p.flipX() : p;
}

/** Gwinn: lean, chocolate-brown pit-lab, amber eyes, floppy ears, pink collar. */
export function gwinn(step = 0, flip = false): Pixels {
  const p = blank();
  const O = c('ink', 0);
  const fur = c('brown', 2);
  p.rect(2, 8, 13, 7, O).rect(3, 9, 11, 5, fur).rect(3, 9, 11, 1, c('brown', 3)).rect(10, 12, 3, 2, c('paper', 3));
  p.rect(13, 3, 7, 8, O).rect(14, 4, 5, 6, fur).set(16, 5, c('orange', 3)).rect(18, 7, 2, 2, c('brown', 0));
  p.rect(13, 4, 2, 5, c('brown', 1)); // floppy ear
  p.rect(13, 10, 5, 1, c('pink', 2)); // pink collar
  const a = step ? 1 : 0;
  p.rect(4 + a, 15, 2, 5, fur).rect(11 - a, 15, 2, 5, fur);
  p.line(2, 9, 0, 6 + a, fur);
  return flip ? p.flipX() : p;
}

const DOC_LEO: FigureLook = {
  hat: { kind: 'fedora', color: ['grey', 2] },
  face: 'hobo',
  glasses: true,
  shirt: ['purple', 2],
  tie: ['green', 3],
  pants: ['blue', 1],
  hair: ['brown', 1],
};

/** Doc Leo, hobo clown: chewed fedora, ash beard, purple shirt, green tie, red sneakers. */
export function docLeo(step = 0): Pixels {
  const p = figure(DOC_LEO, step);
  // red sneakers with the suit
  p.rect(6, 19, 3, 1, c('red', 3)).rect(11, 19, 3, 1, c('red', 3));
  // the rubber chicken on its leash
  p.line(16, 15, 18, 18, c('red', 2)).rect(17, 17, 3, 2, c('yellow', 3)).set(19, 16, c('orange', 2));
  return p;
}

/** The same little person from behind, walking away up the map: the back of the head, no face. */
export function figureBack(f: FigureLook, step = 0): Pixels {
  const p = figure({ ...f, face: 'plain', tie: undefined, glasses: false, beard: undefined }, step);
  const hx = 7;
  const hy = 2 + (f.small ? 4 : 0);
  const skin = f.face === 'whiteface' ? c('paper', 4) : c(f.skin ?? 'skin', 2);
  const hair = f.hair && f.hairStyle !== 'bald' ? c(f.hair[0], f.hair[1]) : skin;
  p.rect(hx, hy + 1, 6, 5, hair);
  // the ears, and the neck under short hair
  p.set(hx - 1, hy + 3, skin).set(hx + 6, hy + 3, skin);
  if (hair !== skin && f.hairStyle !== 'long') p.rect(hx + 1, hy + 5, 4, 1, skin);
  return p;
}

/** Two pixels wide, from (x0, y0) down to (x1, y1): a limb drawn at a slant. */
function limb(p: Pixels, x0: number, y0: number, x1: number, y1: number, col: number): void {
  for (let y = y0; y <= y1; y++) {
    const x = Math.round(x0 + ((x1 - x0) * (y - y0)) / Math.max(1, y1 - y0));
    p.rect(x, y, 2, 1, col);
  }
}

/**
 * The same little person from the side, walking right (mirror it to walk left): one eye, the
 * nose in front, hair at the back, one arm swinging and the legs striding (`step` 0) or passing
 * (`step` 1). Same size, colors and outfits as `figure`.
 */
export function figureSide(f: FigureLook, step = 0): Pixels {
  const p = blank();
  const O = c('ink', 0);
  const s = f.small ? 2 : 0;
  const skin = f.face === 'whiteface' ? c('paper', 4) : c(f.skin ?? 'skin', 2);
  const hx = 7;
  const hy = 2 + s * 2;
  // head, the nose poking out in front
  p.rect(hx - 1, hy, 8, 7, O);
  p.rect(hx, hy + 1, 6, 5, skin);
  p.set(hx + 6, hy + 3, skin);
  // hair, over the top and down the back
  if (f.hair && f.hairStyle !== 'bald') {
    const hc = c(f.hair[0], f.hair[1]);
    p.rect(hx, hy, 6, 2, hc).rect(hx, hy + 1, 2, 3, hc);
    if (f.hairStyle === 'long') p.rect(hx - 1, hy + 1, 2, 7, hc);
    if (f.hairStyle === 'bun') p.rect(hx - 2, hy - 1, 3, 3, hc);
    if (f.hairStyle === 'pigtails') p.rect(hx - 3, hy + 2, 3, 3, hc);
    if (f.hairStyle === 'wild') p.rect(hx - 3, hy, 3, 4, hc).rect(hx, hy - 1, 6, 1, hc);
  }
  // face: one eye, looking ahead
  if (f.face === 'shades') p.rect(hx + 3, hy + 2, 4, 2, O);
  else if (f.face === 'eyepatch') p.rect(hx + 3, hy + 2, 3, 2, O).line(hx, hy + 1, hx + 3, hy + 2, O);
  else p.set(hx + 4, hy + 3, O);
  if (f.glasses) p.frame(hx + 3, hy + 2, 3, 3, c('brass', 2)).rect(hx + 1, hy + 3, 2, 1, c('brass', 2));
  if (f.face === 'whiteface' || f.face === 'auguste') p.rect(hx + 6, hy + 3, 2, 2, c('red', 3)); // the red nose
  if (f.face === 'hobo') p.rect(hx + 6, hy + 3, 2, 2, c('pink', 2)); // his own nose, sunburned
  if (f.face === 'auguste') p.set(hx + 3, hy + 4, c('pink', 2)).rect(hx + 3, hy + 5, 3, 1, c('red', 2));
  if (f.face === 'hobo')
    p.rect(hx + 2, hy + 5, 4, 1, c('night', 2))
      .rect(hx + 4, hy + 5, 2, 1, c('paper', 4))
      .set(hx + 3, hy + 4, c('pink', 2));
  else if (f.face === 'sad') p.rect(hx + 4, hy + 5, 2, 1, O).set(hx + 3, hy + 6, O);
  else if (f.face === 'happy' || f.face === 'auguste' || f.face === 'whiteface') p.set(hx + 3, hy + 5, O).rect(hx + 4, hy + 6, 2, 1, O);
  else p.rect(hx + 4, hy + 5, 2, 1, f.face === 'shades' ? O : c('red', 1));
  if (f.beard) p.rect(hx + 2, hy + 4, 5, 3, c(f.beard[0], f.beard[1])).set(hx + 5, hy + 5, c('red', 1));
  // hats
  if (f.hat) {
    const hc = c(f.hat.color[0], f.hat.color[1]);
    const hd = c(f.hat.color[0], Math.max(0, f.hat.color[1] - 2));
    switch (f.hat.kind) {
      case 'fedora':
        p.rect(hx - 2, hy, 11, 1, hd)
          .rect(hx, hy - 3, 6, 3, hc)
          .rect(hx, hy - 1, 6, 1, c('red', 1));
        break;
      case 'crown':
        p.rect(hx, hy - 2, 6, 2, c('brass', 3))
          .set(hx, hy - 3, c('brass', 4))
          .set(hx + 2, hy - 3, c('brass', 4))
          .set(hx + 5, hy - 3, c('brass', 4))
          .set(hx + 4, hy - 1, c('red', 3));
        break;
      case 'cap':
        p.rect(hx, hy - 1, 6, 2, hc).rect(hx + 6, hy, 3, 1, hd);
        break;
      case 'santa':
        p.rect(hx - 1, hy, 8, 1, c('paper', 4))
          .rect(hx, hy - 2, 6, 2, c('red', 3))
          .rect(hx - 2, hy - 3, 2, 2, c('red', 3))
          .set(hx - 3, hy - 2, c('paper', 4));
        break;
      case 'top':
        p.rect(hx - 1, hy, 8, 1, hd)
          .rect(hx, hy - 5, 6, 5, hc)
          .rect(hx, hy - 2, 6, 1, c('red', 2));
        break;
      case 'tricorn':
        p.rect(hx - 2, hy - 1, 10, 2, hc)
          .set(hx - 2, hy - 2, hc)
          .set(hx + 7, hy - 2, hc)
          .rect(hx + 1, hy - 3, 4, 2, hc);
        break;
      case 'beret':
        p.rect(hx - 1, hy - 1, 7, 2, hc).set(hx + 2, hy - 2, hc);
        break;
      case 'bandana':
        p.rect(hx, hy - 1, 6, 2, hc)
          .set(hx - 1, hy + 1, hc)
          .set(hx - 2, hy + 2, hc);
        break;
      case 'helmet':
        p.rect(hx - 1, hy - 2, 8, 3, hc).rect(hx - 1, hy, 8, 1, hd);
        break;
    }
  }
  // body, side on: narrower than face on
  const by = hy + 7;
  const bh = f.small ? 5 : 6;
  const shirt = c(f.shirt[0], f.shirt[1]);
  p.rect(hx, by, 7, bh, O);
  p.rect(hx + 1, by, 5, bh - 1, shirt);
  if (f.tie) p.rect(hx + 5, by, 1, 4, c(f.tie[0], f.tie[1]));
  // legs, striding or passing
  const ly = by + bh;
  if (f.dress) {
    const dc = c(f.shirt[0], Math.max(0, f.shirt[1] - 1));
    for (let y = ly - 1; y < 19; y++) {
      const w = Math.min(2, Math.floor((y - ly + 1) / 2));
      p.rect(hx + 1 - w, y, 5 + w * 2, 1, dc);
    }
    if (step) p.rect(hx + 2, 19, 3, 1, O);
    else p.rect(hx, 19, 2, 1, O).rect(hx + 5, 19, 2, 1, O);
  } else {
    const pc = c(...(f.pants ?? ['blue', 1]));
    if (step) p.rect(hx + 2, ly, 3, 19 - ly, pc).rect(hx + 2, 19, 4, 1, O);
    else {
      limb(p, hx + 1, ly, hx - 1, 18, pc);
      limb(p, hx + 4, ly, hx + 6, 18, pc);
      p.rect(hx - 1, 19, 3, 1, O).rect(hx + 6, 19, 3, 1, O);
    }
  }
  // the near arm: swinging, held out in front, or raised
  const arm = c(f.shirt[0], Math.max(0, f.shirt[1] - 1));
  if (f.arms === 'up')
    p.rect(hx + 5, by, 2, 2, arm)
      .rect(hx + 7, by - 4, 2, 5, arm)
      .rect(hx + 7, by - 5, 2, 1, skin);
  else if (f.arms === 'out') p.rect(hx + 3, by + 1, 6, 2, arm).rect(hx + 9, by + 1, 2, 2, skin);
  else {
    const x1 = step ? hx + 2 : hx + 4;
    limb(p, hx + 2, by + 1, x1, by + 4, arm);
    p.rect(x1, by + 5, 2, 1, skin);
  }
  return p;
}

/** Doc Leo side on, walking right: red sneakers, and the rubber chicken trotting behind. */
export function docLeoSide(step = 0): Pixels {
  const p = figureSide(DOC_LEO, step);
  p.map((_x, y, k) => (y === 19 && k === c('ink', 0) ? c('red', 3) : k));
  // the chicken on its leash, behind him
  const bob = step ? 1 : 0;
  p.line(8, 15, 4, 16 + bob, c('red', 2));
  p.rect(0, 17 - bob, 3, 2, c('yellow', 3))
    .set(3, 16 - bob, c('yellow', 3))
    .set(4, 16 - bob, c('orange', 2));
  return p;
}

/** A floating word pickup: a slip of paper torn from a book, its value in red. */
export function wordSlip(value: number, frame: number): Pixels {
  const p = blank();
  const dy = frame ? 1 : 0;
  const w = value >= 20 ? 16 : value >= 10 ? 14 : value >= 5 ? 12 : 9;
  const h = value >= 20 ? 12 : value >= 10 ? 10 : 8;
  const x = Math.round((20 - w) / 2);
  const y = Math.round((20 - h) / 2) - 1 + dy;
  p.rect(x + 1, y + 1, w, h, c('ink', 1)); // shadow
  p.rect(x, y, w, h, c('paper', 4)).frame(x, y, w, h, c('paper', 1));
  // a few lines of tiny "print"
  for (let ly = y + 2; ly < y + h - 1; ly += 2) p.rect(x + 2, ly, w - 4 - ((ly * 3) % 4), 1, c('grey', 2));
  const label = String(value);
  const lx = x + w - label.length * 4 - 1;
  p.rect(lx - 1, y + h - 7, label.length * 4 + 1, 7, c('paper', 4));
  micro(p, lx, y + h - 6, label, c('red', 2));
  // dog-eared corner
  p.set(x + w - 1, y, CLEAR).set(x + w - 2, y + 1, c('paper', 2));
  return p;
}

/** A shusher: a grey ghost of a librarian with a bun, a finger to her lips, and SHH. */
export function shusher(frame: number): Pixels {
  const p = blank();
  const O = c('ink', 0);
  const body = c('grey', 4);
  const dy = frame ? 1 : 0;
  blob(p, 10, 8 + dy, 6, 6, r('grey'), 2, 5);
  p.rect(7, 1 + dy, 6, 3, c('grey', 2)).disc(10, 1 + dy, 2, c('grey', 2)); // the bun
  p.rect(4, 10 + dy, 12, 7, body);
  for (let x = 4; x < 16; x += 3) p.rect(x, 17 + dy, 2, 1 - dy + 1, body); // wavy hem
  p.set(8, 7 + dy, O).set(12, 7 + dy, O);
  p.frame(7, 6 + dy, 3, 3, c('brass', 3)).frame(11, 6 + dy, 3, 3, c('brass', 3)); // half-moon glasses
  p.rect(10, 9 + dy, 1, 4, c('skin', 2)); // the finger
  p.rect(9, 11 + dy, 3, 1, O);
  if (frame) micro(p, 0, 0, 'SH', c('red', 3));
  return p;
}

/** A sprite turned a quarter clockwise (somebody lying down). */
export function rot90(src: Pixels): Pixels {
  const p = blank();
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.set(19 - y, x, src.get(x, y));
  return p;
}

/** A sprite mirrored left to right, keeping it a sprite. */
export function mirror(src: Pixels): Pixels {
  const p = blank();
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.set(19 - x, y, src.get(x, y));
  return p;
}

/** A soap bubble (or a balloon, given a ramp), radius `rad`, at the middle of a block. */
export function bubble(rad: number, ramp = 'sky', dy = 0): Pixels {
  const p = blank();
  if (ramp === 'sky') {
    p.ring(10, 10 + dy, rad, c('sky', 4));
    p.ring(10, 10 + dy, rad - 0.7, c('purple', 4));
    p.set(10 - rad / 2, 10 + dy - rad / 2, c('paper', 4));
  } else {
    blob(p, 10, 9 + dy, rad, rad * 1.15, r(ramp), 1, r(ramp).length - 1);
    p.line(10, 9 + dy + rad * 1.15, 10, 19, c('grey', 4));
  }
  return p;
}

/** A plinth for an exhibit, over a floor. */
export function plinth(under: Pixels, exhibit: Pixels): Pixels {
  const p = on(under);
  p.rect(4, 12, 12, 8, c('paper', 3)).rect(4, 12, 12, 1, c('paper', 4)).rect(15, 12, 1, 8, c('paper', 1));
  p.blit(exhibit, 0, -6, CLEAR);
  return p;
}

// ------------------------------------------------------------------ the felt egg

/**
 * The Bookworm Egg (a sprite): cream felt with a gold blanket-stitched seam, a green felt
 * bookworm in red reading glasses curled around its middle, and a red ribbon bookmark.
 */
export function bookwormEgg(): Pixels {
  const p = blank();
  blob(p, 10, 10, 6, 8, r('paper'), 1, 4);
  // ruled like a notebook page
  for (const y of [5, 8, 16]) for (let x = 5; x < 16; x++) if (p.get(x, y) !== CLEAR) p.set(x, y, c('sky', 4));
  // the gold blanket stitch down the seam
  for (let y = 4; y < 17; y += 2) p.set(10, y, c('brass', 4));
  // the ribbon bookmark from the top
  p.rect(12, 2, 2, 9, c('red', 3)).set(12, 11, c('red', 2)).set(13, 12, c('red', 2));
  // the bookworm, curled around the middle, in his reading glasses
  p.rect(4, 12, 12, 2, c('green', 3)).rect(4, 13, 12, 1, c('green', 1));
  for (const x of [6, 9, 12]) p.set(x, 12, c('green', 5));
  p.rect(14, 9, 4, 4, c('green', 3)).set(17, 10, c('ink', 0));
  p.frame(15, 9, 3, 2, c('red', 3));
  return p;
}
