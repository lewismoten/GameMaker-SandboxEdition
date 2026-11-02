// Level 15, The Parade Route (the parade set, side on; three scenes: morning, sunset, and dusk
// with fireworks). THE CHEZ leads the Clown Club parade down a closed street, the crowd behind
// the barriers on the far sidewalk. At each side street a section of the band waits under a
// cue lamp hung from the bunting; Space toots the horn and bounces the car on its springs, and
// the bounce reaches up into the lamp (PLAYGAME touches a move's destination before a solid
// stops it), so the section joins with its phrase. Each scene's song is the band so far. A
// ribbon across the street at the end parts when every section of the scene has joined (a
// counter it spends); a section driven past can be backed up to (Down). No signals: the road is
// closed for the parade.
import { Pixels, rng } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { gradient } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { AIR, kit, SOLID, type Kit } from '../blocks/common';
import { baseSet } from '../blocks/sets';
import type { Pal } from '../art/palette';
import { CTR } from '../ids';
import { MapBuilder, at, type Level } from './maps';
import { DRIVE } from './drive';
import { SHOP_SIGNS, shopSign } from '../art/shopSigns';

/** Solid underneath only: the bounce reaches up into it. */
const UNDER = 4;
/** The two kinds of cue (each its own sound slot), and both count toward the ribbon. */
const CUE_KINDS = [{ hp: 1 }, {}] as const;
/** Points for a section joining. */
export const JOIN = 100;
export const SECTIONS = 4;

export interface ParadeScene {
  file: string;
  w: number;
  /** The side streets' columns (a section waits in each, its cue overhead). */
  cues: number[];
  /** The ribbon's column, near the end. */
  ribbon: number;
  fireworks: boolean;
}

export const PARADES: ParadeScene[] = [
  { file: 'band1', w: 70, cues: [54, 42, 30, 18], ribbon: 8, fireworks: false },
  { file: 'band2', w: 70, cues: [56, 45, 32, 20], ribbon: 8, fireworks: false },
  { file: 'band3', w: 70, cues: [53, 41, 29, 17], ribbon: 8, fireworks: true },
];
/** The row the cue lamps hang in, just over the car's roof: the car is one block tall (its
 * top block is clear, so only its bottom block touches), and the bounce reaches up into it. */
export const CUE_ROW = DRIVE.top;
export const startX = (s: ParadeScene) => s.w - 9;
export const EXIT_X = 1;
export const cueName = (kind: number) => `cue.${kind}`;

export function paradeBlocks(scene: ParadeScene) {
  return (pal: Pal): Kit => {
    const k = kit(pal);
    baseSet(k, 'parade');
    const { book, c, R } = k;
    const sky = gradient(new Pixels(20, 200, 0), 0, 0, 20, 200, R('wall'), 0, 4);
    const skyRow = (y: number) => sky.crop(0, y * 20, 20, 20);
    for (let y = 0; y < DRIVE.street; y++) book.add(`air${y}`, skyRow(y), AIR);
    // the bunting: a string of pennants in the Clown Club's colors, sagging between poles
    const flags = ['red', 'yellow', 'blue', 'green'] as const;
    // the far buildings: brick, a window in every other block, a stone cap along the roofs
    const wall = (window: boolean) => {
      const p = k.P(c('brick', 2));
      for (let y = 0; y < 20; y += 5) p.rect(0, y, 20, 1, c('brick', 1));
      if (window) p.rect(5, 3, 10, 13, c('paint', 3)).rect(6, 4, 8, 11, c('siding', 2)).rect(6, 4, 3, 4, c('siding', 3));
      return p;
    };
    book.add('wall', wall(false), AIR);
    book.add('wallwin', wall(true), AIR);
    const cap = skyRow(CUE_ROW - 3);
    cap
      .blit(wall(false).crop(0, 0, 20, 12), 0, 8)
      .rect(0, 6, 20, 3, c('stone', 3))
      .rect(0, 9, 20, 1, c('stone', 1));
    book.add('cap', cap, AIR);
    const bunting = (base: Pixels) => {
      base.line(0, 6, 10, 9, c('ink', 1)).line(10, 9, 20, 6, c('ink', 1));
      for (let i = 0; i < 3; i++) {
        const x = 2 + i * 6;
        const y = 7 + (i === 1 ? 2 : 1);
        for (let r = 0; r < 6; r++) base.rect(x + Math.floor(r / 2), y + r, 5 - r, 1, c(flags[i], 2));
      }
      return base;
    };
    book.add('flags', bunting(skyRow(CUE_ROW - 1)), AIR);
    book.add('flagswall', bunting(wall(true)), AIR);
    // a street light at the corner: a pole, its arm, the cue lamp hung from it, dark until the section joins
    const pole = (p: Pixels, y0: number) => p.rect(16, y0, 2, 20 - y0, c('metal', 2)).rect(16, y0, 1, 20 - y0, c('metal', 4));
    const lamp = (lit: boolean) => {
      const p = skyRow(CUE_ROW);
      p.rect(0, 16, 20, 4, c('stone', 2));
      pole(p, 2).rect(9, 2, 9, 2, c('metal', 2)).disc(17, 2, 1.5, c('metal', 3)).rect(10, 4, 1, 3, c('ink', 1)).rect(8, 6, 5, 2, c('metal', 2));
      p.disc(10.5, 12, 4.5, lit ? c('yellow', 3) : c('ink', 1)).disc(10.5, 12, 3, lit ? c('glow', 3) : c('metal', 1));
      if (lit)
        for (const [dx, dy] of [
          [-7, 2],
          [7, 3],
          [-6, 9],
          [7, 9],
        ])
          p.set(10 + dx, 12 + dy - 5, c('paint', 3));
      return p;
    };
    CUE_KINDS.forEach((kind, i) => book.add(cueName(i), lamp(false), { solid: UNDER, ...kind, effect: CTR.stations, eamt: 1, score: JOIN, touch: 'cue.lit' }));
    book.add('cue.lit', lamp(true), { solid: UNDER });
    // the crowd behind the barrier on the far sidewalk: heads and hats, a friendly clown or two waving
    let r = rng(scene.file.length * 31 + scene.cues[0]);
    const crowd = (clown: boolean, n: number, onWall: boolean) => {
      const p = onWall ? storefront() : skyRow(DRIVE.row);
      for (let i = 0; i < 3; i++) {
        const x = 3 + i * 6 + Math.floor(r() * 2);
        const skin = c('skin', 1 + ((n + i) % 3));
        p.disc(x, 6, 2.6, skin).rect(x - 3, 9, 7, 11, c((['blue', 'green', 'purple', 'orange'] as const)[(n + i) % 4], 2));
        if (clown && i === 1) {
          p.disc(x, 6, 2.6, c('paint', 3))
            .set(x, 6, c('nose', 1))
            .set(x + 1, 6, c('nose', 1));
          for (const [dx, col] of [
            [-3, 'red'],
            [-1, 'yellow'],
            [1, 'green'],
            [3, 'blue'],
          ] as const)
            p.disc(x + dx, 3, 1.6, c(col, 2));
          p.rect(x + 4, 1, 1, 7, c('skin', 2));
        } else if ((n + i) % 3 === 0) p.rect(x - 3, 3, 7, 2, c((['red', 'blue', 'yellow'] as const)[n % 3], 1));
      }
      p.rect(0, 12, 20, 3, c('accent', 2)).rect(0, 12, 20, 1, c('paint', 3));
      for (const x of [2, 17]) p.rect(x, 12, 2, 8, c('metal', 2));
      return p;
    };
    // the shops' ground floor behind the crowd: the shop windows end on a stone sill, brick below
    const storefront = () =>
      wall(false).rect(3, 0, 6, 2, c('siding', 2)).rect(11, 0, 6, 2, c('siding', 2)).rect(0, 2, 20, 2, c('stone', 2)).rect(0, 4, 20, 1, c('stone', 1));
    for (let n = 0; n < 4; n++) {
      const seed = Math.floor(r() * 1e9); // the same faces in front of the sky and the shops
      r = rng(seed);
      book.add(`crowd${n}`, crowd(n === 2, n, false), AIR);
      r = rng(seed);
      book.add(`crowdwall${n}`, crowd(n === 2, n, true), AIR);
    }
    // the far buildings behind the crowd, and the windows' faces
    const front = wall(false);
    front.rect(3, 4, 6, 16, c('siding', 2)).rect(11, 4, 6, 16, c('siding', 2)).rect(0, 2, 20, 2, c('accent', 2));
    book.add('front', front, AIR);
    for (const sign of SHOP_SIGNS) book.add(`sign.${sign}`, shopSign(k, sign), AIR);
    // the street patched in places
    book.add('road.patch', k.pic('road').rect(3, 8, 12, 6, c('shade', 0)).rect(4, 9, 10, 4, c('shade', 1)), { solid: SOLID });
    // a band section in a side street: plumed hats over the instruments (by section)
    const band = (sec: number) => {
      const p = skyRow(DRIVE.row);
      p.rect(0, 14, 20, 6, c('shade', 1));
      pole(p, 0).rect(15, 18, 4, 2, c('metal', 1));
      for (let i = 0; i < 2; i++) {
        const x = 4 + i * 9;
        p.rect(x - 3, 8, 7, 10, c('red', 2)).rect(x - 3, 8, 7, 2, c('paint', 3));
        p.disc(x, 5, 2.5, c('skin', 2))
          .rect(x - 2, 0, 5, 3, c('ink', 1))
          .rect(x, -1, 1, 2, c('yellow', 3));
        if (sec === 0) p.disc(x, 15, 3.5, c('paint', 3)).ring(x, 15, 3.5, c('red', 1));
        else if (sec === 1) p.ring(x + 2, 9, 3.5, c('gold', 2)).rect(x + 1, 10, 2, 7, c('gold', 1));
        else if (sec === 2) p.rect(x, 11, 6, 2, c('gold', 2)).rect(x + 5, 9, 2, 6, c('gold', 3));
        else p.rect(x, 11, 5, 2, c('yellow', 3)).set(x + 5, 11, c('ink', 0));
      }
      return p;
    };
    for (let s = 0; s < 4; s++) book.add(`band${s}`, band(s), AIR);
    const top = skyRow(DRIVE.top);
    top.rect(0, 16, 20, 4, c('stone', 2));
    book.add('corner', top, AIR);
    // the ribbon across the street: it parts when every section has joined
    const ribbon = (cut: boolean) => {
      const p = skyRow(DRIVE.row);
      for (const x of [1, 18]) p.rect(x, 2, 2, 18, c('metal', 3));
      if (!cut) p.rect(0, 9, 20, 3, c('red', 2)).rect(0, 9, 20, 1, c('red', 3)).disc(10, 10, 3, c('red', 3));
      else p.rect(3, 9, 3, 6, c('red', 2)).rect(15, 9, 3, 6, c('red', 2));
      return p;
    };
    book.add('ribbon', ribbon(false), { solid: SOLID, effect: CTR.stations, eamt: -SECTIONS, touch: 'ribbon.cut' });
    book.add('ribbon.cut', ribbon(true), AIR);
    // confetti drifting down the sky (three frames), and at dusk fireworks bursting (a ring)
    for (let f = 0; f < 3; f++) {
      const p = skyRow(2);
      for (let i = 0; i < 6; i++) p.rect((i * 7 + f * 3) % 20, (i * 5 + f * 7) % 20, 2, 1, c(flags[i % 4], 3));
      book.add(`confetti${f}`, p, { ...AIR, ntime: 4, next: `confetti${(f + 1) % 3}` });
    }
    if (scene.fireworks)
      for (let f = 0; f < 5; f++) {
        const p = skyRow(1);
        const rr = [0, 2, 5, 8, 0][f];
        const col = c(flags[f % 4], 3);
        if (f === 0) p.rect(10, 14, 1, 6, c('glow', 3));
        else if (f < 4) for (let a = 0; a < 8; a++) p.set(10 + Math.round(Math.cos(a * 0.785) * rr), 10 + Math.round(Math.sin(a * 0.785) * rr), col);
        book.add(`fw${f}`, p, { ...AIR, ntime: [6, 3, 3, 4, 20][f], next: `fw${(f + 1) % 5}` });
      }
    return k;
  };
}

/** One stretch of the parade route. */
export const parade = (scene: ParadeScene) =>
  function parade(book: Kit['book']): Level {
    const { w } = scene;
    const { top, row, street } = DRIVE;
    const m = new MapBuilder(book, {}, 'road');
    for (let y = 0; y < street; y++) m.fill(0, y, w, 1, `air${y}`);
    m.fill(0, street, w, 1, 'road');
    // the buildings, with a side street (open sky) at every cue
    const street3 = new Set(scene.cues.flatMap((x) => [x - 1, x, x + 1]));
    const signAt = new Map<number, string>();
    let run: number[] = [];
    let shops = PARADES.indexOf(scene) * 2;
    for (let x = 0; x <= w; x++) {
      if (x < w && !street3.has(x)) run.push(x);
      else if (run.length) {
        signAt.set(run[Math.floor(run.length / 2)] | 1, `sign.${SHOP_SIGNS[shops++ % SHOP_SIGNS.length]}`);
        run = [];
      }
    }
    for (let x = 0; x < w; x++) {
      m.set(x, row, `crowd${street3.has(x) ? '' : 'wall'}${(x * 3) % 4}`);
      if (street3.has(x)) {
        m.set(x, CUE_ROW - 1, 'flags');
        if (!scene.cues.includes(x)) m.set(x, top, 'corner');
        continue;
      }
      m.set(x, CUE_ROW - 3, 'cap')
        .set(x, CUE_ROW - 2, signAt.get(x) ?? (x % 2 ? 'wallwin' : 'wall'))
        .set(x, CUE_ROW - 1, 'flagswall')
        .set(x, top, 'front');
    }
    scene.cues.forEach((x, i) => {
      m.set(x, row, `band${i}`);
      m.set(x, CUE_ROW, cueName(i % CUE_KINDS.length));
    });
    for (let x = 3; x < w; x += 9) m.set(x, 2, 'confetti0');
    if (scene.fireworks) for (let x = 6; x < w; x += 11) m.set(x, 1, `fw${x % 5}`);
    m.set(scene.ribbon, row, 'ribbon');
    m.link(EXIT_X, row);
    // variants here and there so the street doesn't repeat
    m.vary('road', ['road.patch'], 13);
    return { m, start: at(startX(scene), 5), size: [w, 10] };
  };
