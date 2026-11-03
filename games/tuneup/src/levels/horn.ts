// Level 11, The Horn Section (the curb in late-afternoon gold). THE CHEZ's horn honks like a
// kazoo now, so the Clown Club's horn section teaches it a call. A board of four horns (C, E, G
// and high C) lights the round's phrase over and over, a horn a beat, while the clowns honk it
// (a ring of blocks per horn, each lit on its own beats). Then the response: a stage for each note,
// four horn pads hung over Doc Leo's hat. Reached from below (Space), the right pad honks its note
// and opens (he hops up through it and onto it, then up onto the walkway over the stage); a wrong
// pad stays shut and blows a raspberry (a few points, never energy). Three rounds, a scene each:
// three notes, then four, then five. A copy of the board hangs before every stage.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { gradient } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { blob } from '../../../snowbound/src/art/draw';
import { AIR, kit, LEDGE, SOLID, type Kit } from '../blocks/common';
import { baseSet } from '../blocks/sets';
import { addCameo, placeCameo } from '../blocks/cameo';
import { willCameo } from '../../../kit/cameos';
import type { Pal } from '../art/palette';
import { CTR, MONEY, MON } from '../ids';
import { MapBuilder, at, type Level } from './maps';
import { clownFace, FACES } from '../sprites/clowns';

/** A beat of the horn section's song in ticks (hornSong's tempo): the board lights a horn a beat. */
export const HORN_BEAT = 12;
/** Beats of rest after the phrase before the board starts it again. */
export const HORN_REST = 2;
/** The rows: the walkway over a stage, its pads, the floor. */
export const HORN_ROW = { board: 2, walk: 3, pads: 6, floor: 9 } as const;
/** Points for a red foam nose. */
export const NOSE = 25;
/** The start's clown faces' left columns. */
const FACE_X = [1, 4, 9];
/** The four horns' colors (fixed ramps), low C to high C. */
const HORN_COLORS = ['red', 'yellow', 'green', 'blue'] as const;
/** What each pad's note does when it opens: its kind of change picks its pitch (C, E, G, high C). */
const PAD_KINDS = [{ hp: 1 }, { effect: MONEY, eamt: 1 }, { effect: CTR.honks, eamt: 1 }, {}] as const;

export interface HornRound {
  file: string;
  /** The phrase: a horn (0-3) a note. */
  phrase: number[];
  /** Played from memory: the board shows the call this many times, then goes dark. */
  showings?: number;
}
export const HORN_ROUNDS: HornRound[] = [
  { file: 'horn1', phrase: [0, 1, 2] },
  { file: 'horn2', phrase: [2, 1, 0, 3] },
  { file: 'horn3', phrase: [0, 2, 1, 3, 2], showings: 2 },
];
/** The stages' left walls (level x): the first at 12, then every 15. */
export const stageX = (k: number) => 12 + k * 15;
/** The level x of pad `p`'s left block on the stage at `sx`. */
export const padX = (sx: number, p: number) => sx + 1 + p * 2;
/** A round's width and exit. */
export const hornSize = (r: HornRound) => ({ w: stageX(r.phrase.length) + 2, exit: stageX(r.phrase.length - 1) + 12 });

/** The beats horn `h` is lit on in a round's call, as a ring: [lit, ticks] runs (from memory: the showings, then dark for good, its last run 0). */
function boardRing(r: HornRound, h: number): [boolean, number][] {
  const call = [...r.phrase.map((p) => p === h), ...new Array<boolean>(HORN_REST).fill(false)];
  const beats = r.showings ? Array.from({ length: r.showings }, () => call).flat() : call;
  const ring: [boolean, number][] = [];
  for (const lit of beats) {
    const last = ring[ring.length - 1];
    if (last && last[0] === lit) last[1] += HORN_BEAT;
    else ring.push([lit, HORN_BEAT]);
  }
  if (r.showings) ring.push([false, 0]);
  return ring;
}

export function hornBlocks(r: HornRound) {
  return (pal: Pal): Kit => {
    const k = kit(pal);
    baseSet(k, 'curb');
    const { book, c, R } = k;
    // the late-afternoon sky as one gradient down the screen, a row of blocks each
    const sheet = gradient(new Pixels(20, HORN_ROW.floor * 20, 0), 0, 0, 20, HORN_ROW.floor * 20, R('wall'), 4, 1);
    for (let y = 0; y < HORN_ROW.floor; y++) book.add(`sky${y}`, sheet.crop(0, y * 20, 20, 20), AIR);
    const sky = (row: number = HORN_ROW.pads) => k.pic(`sky${row}`);
    // Will (Shakespeare in Sweatpants), on the curb bowing to the Clown Club
    addCameo(k, 'will', `sky${HORN_ROW.floor - 1}`, (host, use) => willCameo(host, { face: 'front' }, { use }));
    // a bulb horn: the rubber bulb in its color, the brass bell; lit, it glows and honks
    const horn = (h: number, lit: boolean, p = sky()) => {
      const col = HORN_COLORS[h];
      if (lit) p.disc(10, 10, 9, c('lamp', 4)).disc(10, 10, 8, c('lamp', 3));
      blob(p, 5, 10, 4, 4, R(col), 0, 3);
      p.rect(8, 9, 4, 3, c('gold', 1));
      for (let x = 12; x < 19; x++) {
        const half = 1 + (x - 12) * 0.8;
        p.rect(x, Math.round(10 - half), 1, Math.round(half * 2) + 1, c('gold', lit ? 3 : 2));
      }
      if (lit) p.set(19, 3, c('paint', 3)).set(18, 1, c('paint', 3)).set(19, 17, c('paint', 3));
      return p;
    };
    // the board: a horn a cell, each lit on its own beats of the call
    for (let h = 0; h < 4; h++) {
      const ring = boardRing(r, h);
      ring.forEach(([lit, t], f) => {
        const p = sky(HORN_ROW.board);
        p.rect(0, 0, 20, 20, c('mach', 1)).rect(1, 1, 18, 18, c('shade', 0));
        horn(h, lit, p);
        const more = ring.length > 1 && t > 0 ? { ntime: t, next: `board${h}.${(f + 1) % ring.length}` } : {};
        book.add(`board${h}.${f}`, p, { ...AIR, ...more });
      });
    }
    // the pads: a horn hung in the stage's ceiling, a cell wide, with its colored name plate
    // beside it; the right horn honks and fades away (two dithered steps) to leave a ledge to
    // hop up through, a wrong one blows a raspberry and stays shut. The plate never changes.
    const shell = () => sky().rect(0, 0, 20, 20, c('mach', 2)).rect(0, 0, 20, 2, c('mach', 4)).rect(0, 18, 20, 2, c('mach', 0));
    const ledge = () => sky().rect(0, 0, 20, 3, c('mach', 3)).rect(0, 0, 20, 1, c('mach', 5));
    const pad = (h: number) => {
      const big = new Pixels(40, 20, 255);
      horn(h, false, big);
      return shell().blit(big.crop(0, 0, 20, 20), 1, 1, 255);
    };
    /** The pad mid-fade: every other pixel (then every fourth) of the horn left over the sky. */
    const fading = (h: number, keep: number) => {
      const full = pad(h);
      const p = ledge();
      for (let y = 3; y < 20; y++) for (let x = 0; x < 20; x++) if ((x + y * keep) % (keep * 2) === 0) p.set(x, y, full.get(x, y));
      return p;
    };
    for (let h = 0; h < 4; h++) {
      book.add(`pad${h}`, pad(h), { solid: SOLID, ...PAD_KINDS[h], score: 50, touch: `pad${h}.fade0` });
      book.add(`pad${h}.fade0`, fading(h, 1), { solid: LEDGE, ntime: 3, next: `pad${h}.fade1` });
      book.add(`pad${h}.fade1`, fading(h, 2), { solid: LEDGE, ntime: 3, next: 'pad.open' });
      book.add(`pad${h}.no`, pad(h), { solid: SOLID, score: -5, touch: `pad${h}.no` });
      const plate = shell().rect(4, 5, 12, 10, c('mach', 1)).disc(10, 10, 3.5, R(HORN_COLORS[h])[2]).disc(9, 9, 1, c('paint', 3));
      for (const [x, y] of [
        [5, 6],
        [14, 6],
        [5, 13],
        [14, 13],
      ])
        plate.set(x, y, c('mach', 5));
      book.add(`plate${h}`, plate, { solid: SOLID });
    }
    book.add('pad.open', ledge(), { solid: LEDGE });
    // red foam noses to collect (they honk): over the walkway's far end and on the curb
    for (const row of [HORN_ROW.walk - 1, HORN_ROW.floor - 1])
      book.add(`nose${row}`, sky(row).disc(10, 13, 4.5, c('red', 2)).disc(9, 12, 3, c('red', 3)).disc(8, 11, 1, c('paint', 3)), {
        ...AIR,
        score: NOSE,
        touch: `sky${row}`,
      });
    // the stage's sides: stacked speaker cabinets; the walkway over it
    const cab = k.P(c('shade', 1));
    cab.rect(1, 1, 18, 18, c('shade', 0)).disc(10, 10, 6, c('mach', 1)).disc(10, 10, 3, c('mach', 3)).frame(0, 0, 20, 20, c('mach', 2));
    book.add('cabinet', cab, { solid: SOLID });
    const walk = sky(HORN_ROW.walk);
    walk.rect(0, 0, 20, 4, c('pipe', 2)).rect(0, 0, 20, 1, c('pipe', 4));
    for (let x = 2; x < 20; x += 6) walk.rect(x, 4, 2, 3, c('pipe', 1));
    book.add('walkway', walk, { solid: LEDGE, ...AIR });
    // the Clown Club's horn section, as the real clown types: a whiteface, an auguste and a hobo
    FACES.forEach((face, i) => {
      const p = new Pixels(40, 40, 0);
      for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) p.blit(sky(7 + y), x * 20, y * 20);
      clownFace(p, face, c);
      for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) book.add(`clown${i}.${x}.${y}`, p.crop(x * 20, y * 20, 20, 20), AIR);
    });
    return k;
  };
}

export function horn(r: HornRound) {
  return (book: Kit['book']): Level => {
    const { w, exit } = hornSize(r);
    const R = HORN_ROW;
    const m = new MapBuilder(book, { '=': 'walk', '#': 'cabinet', '-': 'walkway' }, 'walk');
    for (let y = 0; y < R.floor; y++) m.fill(0, y, w, 1, `sky${y}`);
    m.fill(0, R.floor, w, 1, '=');
    const board = (x: number) => {
      for (let h = 0; h < 4; h++) m.set(x + h, R.board, `board${h}.0`);
    };
    // the horn section at the start, under the first board
    FACES.forEach((_, i) => {
      for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) m.set(FACE_X[i] + x, 7 + y, `clown${i}.${x}.${y}`);
    });
    r.phrase.forEach((note, k) => {
      const sx = stageX(k);
      board(sx - 4);
      m.fill(sx, 1, 1, R.pads, '#');
      m.fill(sx + 9, R.walk, 1, R.floor - R.walk, '#');
      m.fill(sx + 1, R.walk, 8, 1, '-');
      for (let p = 0; p < 4; p++) m.set(padX(sx, p), R.pads, `pad${p}${p === note ? '' : '.no'}`).set(padX(sx, p) + 1, R.pads, `plate${p}`);
      m.set(sx + 8, R.walk - 1, `nose${R.walk - 1}`);
      // between this stage and the next (or the exit): a nose on the curb, a character clown strolling
      m.set(sx + 12, R.floor - 1, `nose${R.floor - 1}`);
      m.mon(MON.clown0 + ((k + HORN_ROUNDS.indexOf(r)) % 4), sx + 11, R.floor - 1);
    });
    m.fill(w - 1, 0, 1, R.floor, '#');
    placeCameo(m, 'will', `sky${R.floor - 1}`, [[stageX(0) + 14, R.floor - 1]]);
    m.link(exit, R.floor - 1);
    m.mon(MON.regina, 7, R.floor - 1);
    // variants here and there so the walls and floors don't repeat
    m.vary('walk', ['walk.crack', 'walk.pebble'], 9);
    return { m, start: at(8, 5), size: [w, 10] };
  };
}
