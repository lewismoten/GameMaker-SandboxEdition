// A diagonal leg, built from its track (diagTrack.ts) and its look: the whole wrapping map
// drawn cell by cell, the pickups, the start and end pieces over the kink (the end one is the
// way out), parts scattered on the ground between the lanes, the leg's own marks, then the
// pickups and the virus along the lanes. The ribbon cable (cable.ts) and the diagonal leg of
// every other stage are built with it, and fly with shipdiag.chr.
import { MLEN, MWID } from '../../../../web/src/formats/map';
import type { Pixels } from '../../../kit/pixels';
import type { Pal } from '../art/pal';
import { BlockSet } from '../art/draw';
import type { DiagBlocks } from '../blocks/diagBlocks';
import { EGG_BLOCK, eggPic } from '../blocks/egg';
import { addPickupTiles, pad, type StageArt } from '../blocks/tiles';
import { HURT, addCommon } from '../characters/sharedMonsters';
import { mite, swooper } from '../characters/enemies';
import { POWER } from '../ids';
import { zapPic } from './cable';
import { Bestiary } from '../characters/mons';
import type { DiagTrack } from './diagTrack';
import { Grid } from './mapkit';
import type { Leg } from './stage';

/** How many columns at the end of a shortcut shove the ship down into the lane. */
const SLIDE = 3;

/** A picture `rows` blocks tall and as wide as its columns, over the kink. */
type EndPic = (rows: number) => Pixels;

/** A part on the ground: [name, w, h, picture], and whether it runs corner to corner (a trace). */
export type Part = [string, number, number, Pixels, boolean?];

/** What a leg's own marks are put down with. */
export interface DiagApi<M extends string> {
  g: Grid;
  track: DiagTrack;
  /** The cell at column x of lap `lap`, `o` across its lane. */
  at: (lap: number, x: number, o: number) => { x: number; y: number };
  mark: (lap: number, x: number, o: number, m: M) => void;
  put: (lap: number, x: number, o: number, name: string) => void;
}

export interface DiagSpec<M extends string> {
  file: string;
  title: string;
  card: string[];
  seed: number;
  pal: Pal;
  /** The look the pickups are drawn over. */
  art: StageArt;
  track: DiagTrack;
  blocks: (bs: BlockSet) => DiagBlocks<M>;
  virus: (b: Bestiary) => void;
  /** The pieces the course starts from (the lane comes out of its right side) and ends in. */
  ends: { prefix: string; start: EndPic; end: EndPic };
  parts: Part[];
  partCount: number;
  /** A cell of plain ground, that parts may cover. */
  plain: { x: number; y: number };
  /** The leg's own marks: numbers, arrows, shortcuts, hazards. */
  decorate: (d: DiagApi<M>) => void;
  /** Where Right hops to the next lane a lap early: [lap, first column, columns], and its mark. */
  shortcuts: [number, number, number][];
  shortcutMark: M;
  /** [lap, column, kind], on line `o` across the lane (which their pads are drawn on). */
  pickups: [number, number, string][];
  pickupO: number;
  /** [lap, column, o, monster]. */
  foes: [number, number, number, string][];
  start: [number, number, number];
  /** The card's 16x5 look at the leg: its left column, and its top row above the start. */
  cardView: { x: number; dy: number };
}

export function diagLeg<M extends string>(s: DiagSpec<M>): Leg {
  const { pal, track } = s;
  const bs = new BlockSet(150, 'bbl');
  const cb = s.blocks(bs);
  const plain = (x: number, y: number) => cb.name(x, y);
  // the bare lanes and ground first, so the block numbers follow the map
  for (let y = 0; y < MWID; y++) for (let x = 0; x < MLEN; x++) plain(x, y);
  addPickupTiles(bs, s.art);
  const beasts = new Bestiary();
  addCommon(beasts, pal, 'diag');
  s.virus(beasts);

  const g = new Grid(bs, beasts, s.art, 0, 1, s.seed, plain);
  const at = (lap: number, x: number, o: number) => track.cellOf(lap, x, o);
  const mark = (lap: number, x: number, o: number, m: M) => {
    const c = at(lap, x, o);
    g.put(c.x, c.y, cb.name(c.x, c.y, m));
  };
  const put = (lap: number, x: number, o: number, name: string) => {
    const c = at(lap, x, o);
    g.put(c.x, c.y, name);
  };
  const mon = (lap: number, x: number, o: number, name: string) => {
    const c = at(lap, x, o);
    if (o < track.board + 1) throw new Error(`${name} off the lane at lap ${lap}, x ${x}`);
    g.monAt(c.x, c.y, name);
  };

  // the pieces at the course's two ends, over the kink: the lane comes out of the first to
  // the right and goes into the last from the left; the last one is the way out
  const end = (lane: number, cols: number[], pic: EndPic, exit: boolean) => {
    const o0 = track.board - 2;
    const rows = track.pitch - o0 + 2;
    const big = pic(rows);
    const names = new Map<string, string>();
    for (let r = 0; r < rows; r++)
      cols.forEach((x, k) => {
        const o = o0 + r;
        const y = (((lane * track.pitch + o - track.kink) % 100) + 100) % 100;
        const onLane = o >= track.board && o < track.pitch;
        const piece = big.crop(k * 20, r * 20, 20, 20);
        const key = `${exit && onLane ? 'x' : 's'}${piece.px.join(',')}`;
        let name = names.get(key);
        if (!name) {
          name = `${s.ends.prefix}${lane}_${names.size}`;
          bs.add(name, piece, exit && onLane ? {} : { solid: 15 });
          names.set(key, name);
        }
        g.put(x, y, name);
        if (exit && onLane) g.linkAt(x, y);
      });
  };
  end(track.laneOfLap(0), track.startCols, s.ends.start, false);
  end(track.last, track.endCols, s.ends.end, true);

  // the parts, on whole blocks of plain ground (between the lanes and where a lane isn't),
  // before the marks so nothing later lands on them
  const plainGround = cb.name(s.plain.x, s.plain.y);
  for (const [name, w, h, pic] of s.parts)
    for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) bs.add(`${name}${r}${c}`, pic.crop(c * 20, r * 20, 20, 20), { solid: 15 });
  const rnd = g.rnd;
  for (let placed = 0, tries = 0; placed < s.partCount && tries < 20000; tries++) {
    const [name, w, h, , run] = s.parts[Math.floor(rnd() * s.parts.length)];
    const x = Math.floor(rnd() * MLEN);
    const y = Math.floor(rnd() * MWID);
    let ok = true;
    for (let r = 0; r < h && ok; r++) for (let c = 0; c < w && ok; c++) if (g.at((x + c) % MLEN, (y + r) % MWID) !== plainGround) ok = false;
    if (!ok) continue;
    if (run) {
      // it runs on corner to corner as far as the ground goes
      for (let k = 0; k < 12; k++) {
        const xx = (x + k) % MLEN;
        const yy = (y - k + MWID) % MWID;
        if (xx >= track.kink || g.at(xx, yy) !== plainGround) break;
        g.put(xx, yy, `${name}00`);
      }
    } else for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) g.put((x + c) % MLEN, (y + r) % MWID, `${name}${r}${c}`);
    placed++;
  }

  s.decorate({ g, track, at, mark, put });
  // the shortcuts across the ground into the next lane down (the blocks either side too, which
  // show its edges); over the last few columns a slide shoves the ship on down into the lane, so
  // one that rides the shortcut to its end is never caught in the corner where it stops
  for (const [lap, x0, n] of s.shortcuts)
    for (let x = x0; x < x0 + n; x++)
      for (let o = -1; o < track.board + 2; o++) {
        const c = at(lap + 1, x, o);
        g.put(c.x, c.y, cb.name(c.x, c.y, s.shortcutMark, x >= x0 + n - SLIDE ? { grav: 2 | 4 } : undefined));
      }
  const start = at(...s.start);
  for (const [lap, x, kind] of s.pickups) put(lap, x, s.pickupO, kind);
  // (never near where a lane crosses the top or side of the map: a monster there wouldn't
  // see the ship coming until it was right on top of it)
  for (const [lap, x, o, name] of s.foes) mon(lap, x, o, name);

  // last, at the number it has in every set (the inventory keeps only block numbers)
  bs.addAt(EGG_BLOCK, 'egg', eggPic(pal, pad(s.art)), { obj: 1, touch: 'pad' });
  return {
    file: s.file,
    kitFile: s.file,
    title: s.title,
    kind: 'diag',
    grid: g,
    kit: { bs, beasts },
    pal,
    start,
    cardView: { x: s.cardView.x, y: start.y - s.cardView.dy },
    card: s.card,
    diag: { track, shortcuts: s.shortcuts },
  };
}

/**
 * The virus every diagonal leg after the cable shares, dressed in its stage's pictures (each
 * name0/name1 already in the monster blocks): a diver that swoops to a spot just ahead on the
 * ship's line and dives down the lane through it, a swooper that waits by the lane's upper
 * edge and crosses it down and to the right, sparks off a pitted spot (`zap`) and mites that
 * crawl out of a crack (`crawl`).
 */
export function diagFoes(b: Bestiary, p: Pal, o: { diver: string; swooper: string; mite: string; score?: number; speed?: number; crossPic?: string }): void {
  const s = o.speed ?? 3;
  b.mb.add('zap0', zapPic(p, 0), { chHitPt: HURT.hazard });
  b.mb.add('zap1', zapPic(p, 1), { chHitPt: HURT.hazard });
  b.add(o.diver, {
    power: POWER.enemy,
    pics: [
      [`${o.diver}0`, 4],
      [`${o.diver}1`, 4],
    ],
    becomes: 'boom',
    score: o.score ?? 100,
    attack: {
      mode: 'player',
      legs: [
        [3, -3, s],
        [-14, 14, s + 2],
      ],
    },
  });
  swooper(b, o.swooper, [[7, 7, s]], { score: o.score ?? 100, pic: o.crossPic });
  b.add('zap', {
    power: POWER.bullet,
    end: -1,
    path: [[-2, -2, 4]],
    pics: [
      ['zap0', 2],
      ['zap1', 2],
    ],
  });
  mite(b, 'crawl', [[-6, -6, 2]], { pic: o.mite, score: 50 });
}
