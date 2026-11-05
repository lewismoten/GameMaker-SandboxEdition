// The hall's own blocks, added to the Starter set: a red aisle carpet and a wooden stage, a balcony rail
// and its front, purple drapes and a valance with gold fringe, bunting, the lectern with the certificate
// rolled on it, and the people: the helpers of The Basics leaning on the rail (each in a loop of their own
// times, so the cheering is not in step) and Doc Leo beside the lectern. The wall is the Starters' sky
// color, so the sign boards (which are drawn on it) sit flush.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { Book, PULL, SOLID } from './book';
import { skyOf, type Pal } from './palette';
import { helperHead, leoPoses } from './graduationCast';
import { cameoFrames, type CameoName } from './graduationCameo';
import type { HallTheme } from './graduationTheme';

/** A block that turns into another after some ticks (the engine's only clock). */
export interface Timed {
  name: string;
  next: string;
  ticks: number;
}

const air = { grav: PULL.down };

const wallBlock = (pal: Pal): Pixels => new Pixels(20, 20, skyOf(pal));

export function carpet(pal: Pal): Pixels {
  const { c } = pal;
  const p = new Pixels(20, 20, c('wood', 1));
  p.rect(0, 15, 20, 1, c('wood', 0)).rect(9, 11, 1, 4, c('wood', 0));
  p.rect(0, 0, 20, 10, c('red', 2)).rect(0, 0, 20, 1, c('red', 4)).rect(0, 9, 20, 1, c('red', 0));
  p.rect(0, 1, 20, 1, c('gold', 3)).rect(0, 7, 20, 1, c('gold', 3));
  for (const x of [3, 9, 15]) p.rect(x, 3, 2, 3, c('red', 3));
  return p;
}

export function stageFloor(pal: Pal): Pixels {
  const { c } = pal;
  const p = new Pixels(20, 20, c('wood', 2));
  p.rect(0, 0, 20, 4, c('wood', 4)).rect(0, 3, 20, 1, c('wood', 3));
  p.rect(0, 4, 20, 1, c('gold', 2)).rect(0, 5, 20, 1, c('gold', 4));
  p.rect(0, 11, 20, 1, c('wood', 1)).rect(0, 17, 20, 1, c('wood', 1));
  p.rect(9, 6, 1, 5, c('wood', 1)).rect(4, 12, 1, 5, c('wood', 1)).rect(14, 12, 1, 5, c('wood', 1));
  return p;
}

export const subfloor = (pal: Pal): Pixels => {
  const { c } = pal;
  const p = new Pixels(20, 20, c('wood', 1));
  p.rect(0, 6, 20, 1, c('wood', 0))
    .rect(0, 13, 20, 1, c('wood', 0))
    .rect(10, 0, 1, 6, c('wood', 0))
    .rect(4, 7, 1, 6, c('wood', 0))
    .rect(15, 14, 1, 6, c('wood', 0));
  return p;
};

/** Pleated purple drape; `dark` is the heavy one at the hall's ends. */
function drape(pal: Pal, dark = false, ramp = 'purple'): Pixels {
  const { c } = pal;
  const p = new Pixels(20, 20, c(ramp, 2));
  const shade = dark ? [0, 1, 1, 0] : [2, 3, 2, 1];
  for (let x = 0; x < 20; x++) p.rect(x, 0, 1, 20, c(ramp, shade[Math.floor(x / 2.5) % 4]));
  if (dark) p.rect(0, 0, 20, 1, c(ramp, 1));
  return p;
}

export function valance(pal: Pal, ramp = 'purple'): Pixels {
  const { c } = pal;
  const p = wallBlock(pal);
  p.rect(0, 0, 20, 13, c(ramp, 2)).rect(0, 0, 20, 2, c(ramp, 3));
  for (let x = 0; x < 20; x += 5) p.rect(x, 2, 1, 11, c(ramp, 1));
  p.rect(0, 13, 20, 2, c('gold', 3)).rect(0, 13, 20, 1, c('gold', 4));
  for (let x = 1; x < 20; x += 4) p.rect(x, 15, 2, 3, c('gold', 3)).set(x, 17, c('gold', 4));
  return p;
}

/** Two pennants and a sagging string, in the colors listed. */
export function bunting(pal: Pal, cols: number[]): Pixels {
  const { c } = pal;
  const p = wallBlock(pal);
  p.line(0, 2, 10, 6, c('ink', 1)).line(10, 6, 19, 2, c('ink', 1));
  [
    [3, 3],
    [14, 3],
  ].forEach(([x, y], i) => {
    for (let k = 0; k < 7; k++) p.rect(x - 3 + Math.floor(k / 2), y + k + 1, 7 - Math.floor(k / 2) * 2, 1, cols[i]);
    p.rect(x - 3, y + 1, 7, 1, c('white', 3));
  });
  return p;
}

/** The balcony rail the helpers lean on, and the wooden front below it. */
function rail(pal: Pal, w = 'wood'): Pixels {
  const { c } = pal;
  const p = new Pixels(20, 20, c(w, 2));
  p.rect(0, 0, 20, 4, c(w, 4)).rect(0, 4, 20, 1, c(w, 1));
  p.frame(2, 7, 16, 11, c(w, 1)).rect(3, 8, 14, 1, c(w, 3));
  return p;
}
function riser(pal: Pal, w = 'wood'): Pixels {
  const { c } = pal;
  const p = new Pixels(20, 20, c(w, 1));
  p.rect(0, 0, 20, 2, c(w, 0)).rect(0, 2, 20, 1, c('gold', 2));
  p.frame(2, 6, 16, 11, c(w, 0)).rect(3, 7, 14, 1, c(w, 2));
  return p;
}

/** The lectern's top with the certificate on it (or bare), and its base. */
function lecternTop(pal: Pal, scroll: boolean): Pixels {
  const { c } = pal;
  const p = wallBlock(pal);
  // a slanted desk top
  for (let y = 0; y < 8; y++) p.rect(2 + Math.floor(y / 3), 12 + y, 16 - Math.floor(y / 3) * 2, 1, c('wood', y < 2 ? 4 : 2));
  p.rect(2, 12, 16, 1, c('wood', 4));
  if (scroll) {
    // a rolled certificate: cream tube, rolled ends, a red ribbon
    p.rect(3, 5, 14, 6, c('parch', 3)).rect(3, 5, 14, 1, c('parch', 4)).rect(3, 10, 14, 1, c('parch', 1));
    p.rect(1, 6, 2, 4, c('parch', 2)).rect(17, 6, 2, 4, c('parch', 2)).set(1, 7, c('parch', 1)).set(18, 7, c('parch', 1));
    p.rect(5, 5, 3, 6, c('gold', 3)).rect(5, 5, 1, 6, c('gold', 4));
    p.rect(4, 11, 2, 3, c('gold', 3)).rect(7, 11, 2, 3, c('gold', 2));
    p.frame(2, 4, 16, 8, c('ink', 1));
  }
  return p;
}
function lecternBase(pal: Pal): Pixels {
  const { c } = pal;
  const p = wallBlock(pal);
  p.rect(5, 0, 10, 20, c('wood', 2)).rect(5, 0, 1, 20, c('wood', 4)).rect(14, 0, 1, 20, c('wood', 1));
  p.rect(7, 4, 6, 8, c('wood', 1)).rect(8, 5, 4, 6, c('wood', 3));
  p.rect(2, 18, 16, 2, c('wood', 1));
  return p;
}

/** The balcony's people: where each stands, by the name. */
export interface Hall {
  /** Block names for the helpers' head ring `hall.<name>.0` ... */
  helpers: string[];
  leoTop: string;
  leoBottom: string;
  /** The Cast's guests: each one's block names, top first (the first frame; the rest follow by timers). */
  cameos: string[][];
}

/** Adds the hall's blocks to `book`; `timed` gets every loop. `kitHead` is the hero's 'stand.top' and `cheerHead` its 'cheer2.top' (head with both hands up). */
export function addHallBlocks(
  book: Book,
  pal: Pal,
  timed: Timed[],
  names: string[],
  stand: Pixels,
  cheer: Pixels,
  blink: Pixels,
  theme: HallTheme = {},
  cameos: CameoName[] = [],
): Hall {
  const drapeRamp = theme.drape ?? 'purple';
  const woodRamp = theme.rail ?? 'wood';
  book.add('carpet', (theme.floor ?? carpet)(pal), { solid: SOLID });
  book.add('stage', (theme.stage ?? stageFloor)(pal), { solid: SOLID });
  book.add('subfloor', (theme.subfloor ?? subfloor)(pal), { solid: SOLID });
  book.add('drape', drape(pal, false, drapeRamp), air);
  book.add('curtainEdge', drape(pal, true, drapeRamp), { solid: SOLID });
  book.add('valance', (theme.valance ?? ((q) => valance(q, drapeRamp)))(pal), air);
  const flags = theme.bunting?.(pal) ?? [pal.c('red', 2), pal.c('gold', 4), pal.c('blue', 3), pal.c('pink', 2)];
  book.add('bunting0', bunting(pal, [flags[0], flags[1]]), air);
  book.add('bunting1', bunting(pal, [flags[2], flags[3]]), air);
  book.add('rail', rail(pal, woodRamp), air);
  book.add('riser', riser(pal, woodRamp), air);
  book.add('lecternTop', lecternTop(pal, false), air);
  book.add('scroll', lecternTop(pal, true), { ...air, score: 100, touch: 'lecternTop' });
  book.add('lectern', lecternBase(pal), air);
  // wall pieces of the stage's own (a hoop, a window, a painting): plain blocks the map hangs above the balcony
  for (const [name, draw] of Object.entries(theme.decor ?? {})) book.add(`decor.${name}`, draw(pal), air);

  // the helpers: head, hands up, and a blink, each ring with its own times
  const wall = skyOf(pal);
  const helpers = names.map((n, i) => {
    const base = `hall.${n.toLowerCase()}`;
    const a = 26 + ((i * 7) % 17);
    const b = 5 + ((i * 3) % 5);
    book.add(`${base}.0`, helperHead(pal, stand, n, wall), air);
    book.add(`${base}.1`, helperHead(pal, cheer, n, wall), air);
    book.add(`${base}.2`, helperHead(pal, blink, n, wall), air);
    timed.push(
      { name: `${base}.0`, next: `${base}.1`, ticks: a },
      { name: `${base}.1`, next: `${base}.2`, ticks: b },
      { name: `${base}.2`, next: `${base}.0`, ticks: 3 },
    );
    return `${base}.0`;
  });

  // Doc Leo beside the lectern: standing, grinning, blinking
  const poses = leoPoses(pal);
  const onWall = (pic: Pixels, y: number): Pixels => new Pixels(20, 20, wall).blit(pic.crop(0, y, 20, 20), 0, 0, 255);
  const front = poses.get('pose.front')!;
  const grin = poses.get('pose.grin')!;
  const blinkLeo = poses.get('pose.blink')!;
  book.add('leo.0', onWall(front, 0), air);
  book.add('leo.1', onWall(grin, 0), air);
  book.add('leo.2', onWall(blinkLeo, 0), air);
  timed.push({ name: 'leo.0', next: 'leo.1', ticks: 31 }, { name: 'leo.1', next: 'leo.2', ticks: 17 }, { name: 'leo.2', next: 'leo.0', ticks: 3 });
  book.add('leoLegs', onWall(front, 20), air);

  // the Cast's guests: still ones are plain blocks; a dog moves between two frames
  const guests = cameos.map((n, i) => {
    const frames = cameoFrames(pal, n);
    frames.forEach((parts, f) => parts.forEach((px, k) => book.add(`cameo.${n}.${f}.${k}`, px, air)));
    if (frames.length > 1) {
      const a = 30 + ((i * 11) % 19);
      timed.push({ name: `cameo.${n}.0.0`, next: `cameo.${n}.1.0`, ticks: a }, { name: `cameo.${n}.1.0`, next: `cameo.${n}.0.0`, ticks: 6 + (i % 3) * 2 });
    }
    return frames[0].map((_p, k) => `cameo.${n}.0.${k}`);
  });
  return { helpers, leoTop: 'leo.0', leoBottom: 'leoLegs', cameos: guests };
}

/** A level's finished blocks: the book's, with each timed block given its next block and its ticks. */
export function finishBlocks(l: { book: Book; timed: Timed[] }) {
  const blocks = l.book.finish();
  for (const t of l.timed) {
    const b = blocks[l.book.n(t.name)];
    b.nextBl = l.book.n(t.next);
    b.ntime = t.ticks;
  }
  return blocks;
}
