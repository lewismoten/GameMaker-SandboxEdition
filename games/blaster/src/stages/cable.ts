// Stage 5's first leg, "The Ribbon Cable": out of the hard disk's plug and along its ribbon
// cable to the CPU. The track (cableTrack.ts) is one gray cable coiled corner to corner across
// a map that wraps on every side, with motherboard showing between the coils. Each lap ends at
// the kink, where the cable bends flat and carries on round the wrap as the next coil down, so
// riding along goes through every coil: the printed numbers count them down, 4, 3, 2, 1, to the
// plug at the far end. Two tape splices across the board let Right hop to the next coil a lap
// early; missing one only costs that lap.
//
// The cable is worn: splits where the colored wires inside show (one in each spits sparks) and
// nicks (some let Crosstalk crawl out).
import { MLEN, MWID } from '../../../../web/src/formats/map';
import { Pixels } from '../../../kit/pixels';
import { buildPalette, type Pal } from '../art/pal';
import { BlockSet, CLEAR, blob } from '../art/draw';
import { CableBlocks, boardParts, cableArt, plugPic, type Mark } from '../blocks/cable';
import { EGG_BLOCK, eggPic } from '../blocks/egg';
import { addPickupTiles, pad } from '../blocks/tiles';
import { mine, mite as miteMon, pics, stalker, swooper } from '../characters/enemies';
import { HURT, addCommon } from '../characters/sharedMonsters';
import { Bestiary } from '../characters/mons';
import { POWER } from '../ids';
import { cluster, keyOf, mite, slug, spike } from '../sprites/sprites';
import { BOARD, END_PLUG, KINK, LAST, PITCH, START_PLUG, cellOf, coilOfLap } from './cableTrack';
import { Grid } from './mapkit';
import type { Leg } from './stage';

/** The tape splices: [lap, first column], each SPLICE_LENGTH columns, into the next coil down. */
export const SPLICES: [number, number][] = [
  [1, 52],
  [3, 26],
];
export const SPLICE_LENGTH = 14;

/** A spark off a bare wire. */
function zapPic(p: Pal, k: number): Pixels {
  const s = new Pixels(20, 20, CLEAR);
  blob(s, 10, 10, 3, 3, p.r('gold'), 2, 4);
  for (let i = 0; i < 6; i++) {
    const a = i + k * 0.5;
    for (let r = 4; r < 8; r++) s.set(10 + Math.cos(a) * r + (r & 1), 10 + Math.sin(a) * r, p.c(r < 6 ? 'gold' : 'steel', r < 6 ? 4 : 6));
  }
  return s;
}

/** The cable's virus. */
function virus(b: Bestiary, p: Pal): void {
  pics(b, 'packet', ...spike(keyOf(p, { main: 'gold', accent: 'glow' })));
  pics(b, 'noise', ...mite(keyOf(p, { main: 'virus', accent: 'slime' })));
  pics(b, 'slug', ...slug(keyOf(p, { main: 'red', accent: 'gold' })));
  pics(b, 'cluster', ...cluster(p, { main: 'virus', accent: 'red' }));
  b.mb.add('zap0', zapPic(p, 0), { chHitPt: HURT.hazard });
  b.mb.add('zap1', zapPic(p, 1), { chHitPt: HURT.hazard });
  // a Packet swoops to a spot just ahead on your line, then dives down the cable through it
  b.add('packet', {
    power: POWER.enemy,
    pics: [
      ['packet0', 4],
      ['packet1', 4],
    ],
    becomes: 'boom',
    score: 150,
    attack: {
      mode: 'player',
      legs: [
        [3, -3, 4],
        [-14, 14, 6],
      ],
    },
  });
  // Crosstalk waits by the cable's upper edge, then jumps across it, down and to the right
  swooper(b, 'noise', [[8, 8, 4]], { score: 120 });
  stalker(b, 'slug', { hp: 3, speed: 1, score: 250 });
  mine(b, 'cluster');
  // what the worn spots let out: sparks that jump up off a split, Crosstalk crawling out of a nick
  b.add('zap', {
    power: POWER.bullet,
    end: -1,
    path: [[-2, -2, 4]],
    pics: [
      ['zap0', 2],
      ['zap1', 2],
    ],
  });
  miteMon(b, 'crawl', [[-6, -6, 2]], { pic: 'noise', score: 60 });
}

/** The cable's map and blocks. */
export function cableLeg(): Leg {
  const pal = buildPalette('cable');
  const art = cableArt(pal);
  const bs = new BlockSet(150, 'bbl');
  const cb = new CableBlocks(bs, pal);
  const plain = (x: number, y: number) => cb.name(x, y);
  // the bare cable and board first, so the block numbers follow the map
  for (let y = 0; y < MWID; y++) for (let x = 0; x < MLEN; x++) plain(x, y);
  addPickupTiles(bs, art);
  const beasts = new Bestiary();
  addCommon(beasts, pal, 'diag');
  virus(beasts, pal);

  const g = new Grid(bs, beasts, art, 0, 1, 501, plain);
  const at = (lap: number, x: number, o: number) => cellOf(lap, x, o);
  const mark = (lap: number, x: number, o: number, m: Mark) => {
    const c = at(lap, x, o);
    g.put(c.x, c.y, cb.name(c.x, c.y, m));
  };
  const put = (lap: number, x: number, o: number, name: string) => {
    const c = at(lap, x, o);
    g.put(c.x, c.y, name);
  };
  const mon = (lap: number, x: number, o: number, name: string) => {
    const c = at(lap, x, o);
    if (o < BOARD + 1) throw new Error(`${name} off the cable at lap ${lap}, x ${x}`);
    g.monAt(c.x, c.y, name);
  };

  // the plugs at the cable's two ends, over the kink: the cable comes out of the first to the
  // right and goes into the last from the left; the last one is the way out
  const plug = (coil: number, cols: number[], side: 'L' | 'R', exit: boolean) => {
    const o0 = BOARD - 2;
    const rows = PITCH - o0 + 2;
    const pic = plugPic(pal, rows, side);
    const names = new Map<string, string>();
    for (let r = 0; r < rows; r++)
      cols.forEach((x, k) => {
        const o = o0 + r;
        const y = (((coil * PITCH + o - KINK) % 100) + 100) % 100;
        const onCable = o >= BOARD && o < PITCH;
        const piece = pic.crop(k * 20, r * 20, 20, 20);
        const key = `${exit && onCable ? 'x' : 's'}${piece.px.join(',')}`;
        let name = names.get(key);
        if (!name) {
          name = `plug${coil}_${names.size}`;
          bs.add(name, piece, exit && onCable ? {} : { solid: 15 });
          names.set(key, name);
        }
        g.put(x, y, name);
        if (exit && onCable) g.linkAt(x, y);
      });
  };
  plug(coilOfLap(0), START_PLUG, 'R', false);
  plug(LAST, END_PLUG, 'L', true);

  // the board's parts, on whole blocks of plain board (between the coils and where the
  // cable isn't), before the marks so nothing later lands on them
  // a block of plain board: coil 0's slant has no cable
  const plainBoard = cb.name(30, 80);
  const parts = boardParts(pal);
  for (const [name, w, h, pic] of parts)
    for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) bs.add(`${name}${r}${c}`, pic.crop(c * 20, r * 20, 20, 20), { solid: 15 });
  const rnd = g.rnd;
  for (let placed = 0, tries = 0; placed < 170 && tries < 20000; tries++) {
    const [name, w, h] = parts[Math.floor(rnd() * parts.length)];
    const x = Math.floor(rnd() * MLEN);
    const y = Math.floor(rnd() * MWID);
    let ok = true;
    for (let r = 0; r < h && ok; r++) for (let c = 0; c < w && ok; c++) if (g.at((x + c) % MLEN, (y + r) % MWID) !== plainBoard) ok = false;
    if (!ok) continue;
    if (name === 'trace') {
      // a trace runs on corner to corner as far as the board goes
      for (let k = 0; k < 12; k++) {
        const xx = (x + k) % MLEN;
        const yy = (y - k + MWID) % MWID;
        if (xx >= KINK || g.at(xx, yy) !== plainBoard) break;
        g.put(xx, yy, 'trace00');
      }
    } else for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) g.put((x + c) % MLEN, (y + r) % MWID, `${name}${r}${c}`);
    placed++;
  }

  // printed on the insulation: how many coils are left, and arrows along it
  for (let lap = 1; lap <= 4; lap++) {
    for (const x of [8, 44]) mark(lap, x, 13, `digit${5 - lap}`);
    for (const x of [20, 32, 56, 68]) mark(lap, x, 13, 'chevron');
    for (const x of lap === 4 ? [84] : [86, 94]) mark(lap, x, 13, 'chevron');
  }
  for (const x of [92, 96]) mark(0, x, 13, 'chevron');

  // the tape splices across the board, under coils 1 and 3, into the next coil down
  for (const [lap, x0] of SPLICES)
    // (the blocks either side too, which show the tape's edges)
    for (let x = x0; x < x0 + SPLICE_LENGTH; x++) for (let o = -1; o < BOARD + 2; o++) mark(lap + 1, x, o, 'splice');

  // splits in the insulation (the middle of each sparks) and nicks (some let Crosstalk out)
  const split = (lap: number, x0: number, n: number) => {
    for (let x = x0; x < x0 + n; x++) for (let o = 11; o <= 15; o++) mark(lap, x, o, x === x0 + (n >> 1) && o === 13 ? 'spark' : 'tear');
  };
  split(1, 24, 5);
  split(2, 16, 6);
  split(2, 64, 4);
  split(3, 48, 6);
  split(4, 24, 5);
  split(4, 58, 6);
  for (const [lap, x, o, kind] of [
    [1, 14, 17, 'nick'],
    [1, 46, 9, 'crawl'],
    [1, 70, 17, 'nick'],
    [2, 28, 9, 'nick'],
    [2, 40, 17, 'crawl'],
    [3, 12, 9, 'crawl'],
    [3, 64, 17, 'nick'],
    [4, 12, 17, 'nick'],
    [4, 40, 9, 'crawl'],
    [4, 70, 17, 'nick'],
  ] as [number, number, number, Mark][])
    mark(lap, x, o, kind);

  const start = at(0, 86, 13);

  // pickups (on the cable's middle line, which their pads are drawn on)
  for (const [lap, x, kind] of [
    [0, 92, 'bit'],
    [0, 95, 'bit'],
    [1, 38, 'nova'],
    [1, 60, 'bit'],
    [1, 62, 'bit'],
    [2, 50, 'repair'],
    [2, 74, 'bit'],
    [3, 20, 'nova'],
    [3, 56, 'repair'],
    [4, 34, 'life'],
    [4, 66, 'bit'],
    [4, 68, 'bit'],
  ] as [number, number, string][])
    put(lap, x, 13, kind);

  // the virus, never near where the cable crosses the top or side of the map (a monster
  // there wouldn't see the ship coming until it was right on top of it)
  const foes: [number, number, number, string][] = [
    // lap 1: coil 4 to go
    [1, 10, 10, 'packet'],
    [1, 16, 15, 'packet'],
    [1, 20, 9, 'noise'],
    [1, 44, 12, 'cluster'],
    [1, 48, 16, 'packet'],
    [1, 52, 8, 'noise'],
    [1, 58, 11, 'packet'],
    [1, 64, 9, 'noise'],
    [1, 66, 16, 'cluster'],
    [1, 72, 12, 'packet'],
    // lap 2
    [2, 10, 12, 'slug'],
    [2, 14, 9, 'noise'],
    [2, 22, 17, 'packet'],
    [2, 26, 10, 'packet'],
    [2, 32, 14, 'cluster'],
    [2, 36, 9, 'noise'],
    [2, 38, 17, 'cluster'],
    [2, 42, 11, 'packet'],
    [2, 66, 9, 'noise'],
    [2, 70, 16, 'packet'],
    [2, 74, 10, 'packet'],
    // lap 3
    [3, 10, 15, 'packet'],
    [3, 14, 10, 'packet'],
    [3, 22, 8, 'noise'],
    [3, 30, 16, 'cluster'],
    [3, 34, 11, 'cluster'],
    [3, 38, 14, 'slug'],
    [3, 44, 9, 'noise'],
    [3, 52, 16, 'packet'],
    [3, 58, 10, 'packet'],
    [3, 62, 8, 'noise'],
    // lap 4: the last coil
    [4, 10, 10, 'packet'],
    [4, 16, 16, 'packet'],
    [4, 20, 8, 'noise'],
    [4, 30, 12, 'cluster'],
    [4, 38, 16, 'packet'],
    [4, 44, 10, 'slug'],
    [4, 50, 8, 'noise'],
    [4, 54, 15, 'cluster'],
    [4, 62, 11, 'packet'],
    [4, 66, 16, 'packet'],
    [4, 72, 8, 'noise'],
  ];
  for (const [lap, x, o, name] of foes) mon(lap, x, o, name);

  // last, at the number it has in every set (the inventory keeps only block numbers)
  bs.addAt(EGG_BLOCK, 'egg', eggPic(pal, pad(art)), { obj: 1, touch: 'pad' });
  return {
    file: 's5r',
    kitFile: 's5r',
    title: 'The Ribbon Cable',
    kind: 'diag',
    grid: g,
    kit: { bs, beasts },
    pal,
    start,
    cardView: { x: 76, y: start.y - 2 },
    card: ['Ride the cable to its plug:', 'coils 4, 3, 2, 1. UP: faster.', 'RIGHT on the tape: hop to', 'the next coil. Mind sparks!'],
  };
}
