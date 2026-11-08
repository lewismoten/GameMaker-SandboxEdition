// Every prop a level may use, by group, added to its block set under the names the levels paint with. A level
// asks only for the groups it needs (a set holds 150 blocks). Blocks on a clock (rain, water, stones, stars,
// the mountain's eyes) come back as Timed entries: the block, the one it turns into, and after how many ticks.
//   mountain   rock, rock2, slopeL/R (steep), gentleL1/L2/R1/R2 (two blocks a row), peakL/R, ledge (stand on
//              it), step (a solid rocky stair), gate.<color> (take it). The face is monsters (monsters.ts), so it can blink and wake.
//   sleepy     the mountain's big foot across the sidewalk (foot0 .. foot19, 5 x 4): gone when the mountain wakes
//   town       wall, wallB, window, windowLit, windowB, roofL/M/R, fence, plug.<color> (a wheelbarrow in a
//              gateway; a gate puts it back as home.<color>), yardGate (opens when the mountain yawns)
//   trail      post (paint it: postBlazed), trunk (trunkBlazed), bark (a trunk to leave be), logL/R (hop it), crown0..8 (a round crown, 3x3), printL/M/R, acorn, pie
//   stream     waterTop, water, stoneUp/stoneHalf/stoneUnder/stoneRise (a loop), bed, footbridge
//   rain       rain0..rain3 (a four-picture loop; start on different frames to scatter it), puddle
//   wind       gustR0..2 (blows right), gustL0..2 (left) and gustU0..2 (an updraft)
//   signs      arrowL/arrowR (a squirrel turns them: they swap on a clock), arrowU
//   stars      starA/B/C (dark sky that lights a star at three times), faint, bright (twinkle), moonTL/TR/BL/BR
//   tunnel     tStone (solid), tAir (dark; touched, it stays lit: tAirLit), tAirFaint (a lamp's far edge, lit the same), tFloor, lantern (light it), glow2
//   picnic     blanketL/M/R, matL/M/R
//   library    shelf0..5 (books, passable), gap (an overdue book goes back: becomes shelved), book (take it), floor/floor2
//              (solid), win0..5 (a tall window, 2 x 3), deskL/M/R
//   tower      leg, brace0..3 (an X over 2 x 2), deck/deck2 (a landing: stand on it), rail, lamp (light it: lampLit),
//              boardUp/boardHalf/boardGone/boardBack (a loose board, on the stones' clock)
//   high       screeUp/screeHalf/screeUnder/screeRise (wobbly rocks in a path, on the stones' clock), dent0..2 (the summit's damp dent: a ledge)
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { KEYS } from '../../kit/starter/blocks';
import { LEDGE, PULL, SOLID, type Book } from '../../kit/starter/book';
import type { Pal } from '../../kit/starter/palette';
import {
  FOOT,
  GATES,
  acorn,
  arbor,
  log,
  foot,
  gate,
  gentle,
  crown,
  fence,
  gateHome,
  gateOnRock,
  ledge,
  peak,
  pie,
  plug,
  post,
  print,
  rock,
  roof,
  slope,
  trunk,
  wall,
  windowOn,
} from './art/land';
import { blanket, doormat, lantern, moon, puddle, signpost, star, tunnelAir, tunnelFloor, tunnelStone } from './art/night';
import { bed, footbridge, gust, rain, stone, updraft, water } from './art/weather';
import { dent, scree } from './art/high';
import { brace, calm, lamp, landing, leg, railing, shingles } from './art/tower';
import { desk, floorboard, libWindow, lostBook, shelf, shelfGap } from './art/library';

/** Points: a painted blaze, an acorn, a gate taken off the mountain, a gate put back home. */
export const POINTS = { blaze: 10, acorn: 5, gate: 25, home: 25, lantern: 10, book: 10, shelved: 20 } as const;
/** Hit points a slice of pie gives back. */
export const PIE_HP = 10;
/** The counter a gate adds to while Tess carries it (the kit's key counter). */
export const GATE_COUNTER = KEYS;

/** A block that turns into another after some ticks. */
export interface Timed {
  name: string;
  next: string;
  ticks: number;
}

/** Ticks a stepping stone stays up, half, under and rising (one loop is their sum). */
export const STONE_TICKS = { up: 80, half: 10, under: 30, rise: 10 } as const;
/** Ticks each arrow points one way before the squirrel turns it. */
export const ARROW_TICKS = 70;

const air = { grav: PULL.down };
/** Ticks after the mountain wakes that it lifts its toe off the sidewalk. */
export const TOE_AFTER = 110;

export interface PropOptions {
  /** The prologue's clock: when the mountain wakes (ticks), and when the yawn knocks Tess's gate open. */
  wake?: number;
  /** Ticks after the start each group of stars lights (the empty spot at sunset). */
  stars?: [number, number, number];
}

export function addProps(book: Book, pal: Pal, groups: readonly string[], o: PropOptions = {}): Timed[] {
  const has = (g: string) => groups.includes(g);
  const timed: Timed[] = [];
  const loop = (names: string[], ticks: number | number[]) =>
    names.forEach((n, i) => timed.push({ name: n, next: names[(i + 1) % names.length], ticks: Array.isArray(ticks) ? ticks[i] : ticks }));
  if (has('mountain')) {
    book.add('rock', rock(pal, 1), air);
    book.add('rock2', rock(pal, 2), air);
    book.add('slopeL', slope(pal, true, 3), air);
    book.add('slopeR', slope(pal, false, 5), air);
    book.add('peakL', peak(pal, true), air);
    book.add('peakR', peak(pal, false), air);
    book.add('ledge', ledge(pal, 6), { solid: LEDGE, grav: PULL.down });
    book.add('step', ledge(pal, 7), { solid: SOLID });
    book.add('gentleL1', gentle(pal, true, 1), air);
    book.add('gentleL2', gentle(pal, true, 2), air);
    book.add('gentleR1', gentle(pal, false, 1), air);
    book.add('gentleR2', gentle(pal, false, 2), air);
    for (const c of GATES) book.add(`gate.${c}`, gateOnRock(pal, c, 9), { ...air, score: POINTS.gate, effect: GATE_COUNTER, eamt: 1, touch: 'rock' });
  }
  if (has('sleepy')) {
    const wake = o.wake ?? 600;
    for (let k = 0; k < FOOT.w * FOOT.h; k++) {
      const pic = foot(pal, k);
      // a part with no rock in it is only sky: not solid, so there is no invisible wall
      book.add(`foot${k}`, pic, pic.px.every((c) => c === pic.px[0]) ? air : { solid: SOLID });
      timed.push({ name: `foot${k}`, next: 'sky', ticks: wake + TOE_AFTER });
    }
  }
  if (has('town')) {
    book.add('wall', wall(pal, 'parch'), air);
    book.add('wallB', wall(pal, 'teal'), air);
    book.add('window', windowOn(pal, 'parch', false), air);
    book.add('windowLit', windowOn(pal, 'parch', true), air);
    book.add('windowB', windowOn(pal, 'teal', true), air);
    book.add('roofL', roof(pal, 'L'), air);
    book.add('roofM', roof(pal, 'M'), air);
    book.add('roofR', roof(pal, 'R'), air);
    book.add('fence', fence(pal), air);
    book.add('arborTop', arbor(pal, 'top'), { solid: SOLID });
    book.add('arborBeam', arbor(pal, 'beam'), { solid: SOLID });
    book.add('arch', arbor(pal, 'posts'), air);
    for (const c of GATES) {
      book.add(`plug.${c}`, plug(pal), { solid: SOLID, effect: GATE_COUNTER, eamt: -1, score: POINTS.home, touch: `home.${c}` });
      book.add(`home.${c}`, gateHome(pal, c), air);
    }
  }
  if (has('yard')) {
    const wake = o.wake ?? 600;
    book.add('yardGate', plugless(pal, false), { solid: SOLID });
    book.add('yardGateOpen', plugless(pal, true), air);
    timed.push({ name: 'yardGate', next: 'yardGateOpen', ticks: wake + 70 });
  }
  if (has('trail')) {
    book.add('post', post(pal, false), { ...air, score: POINTS.blaze, touch: 'postBlazed' });
    book.add('postBlazed', post(pal, true), air);
    book.add('trunk', trunk(pal, false, true), { ...air, score: POINTS.blaze, touch: 'trunkBlazed' });
    book.add('trunkBlazed', trunk(pal, true), air);
    book.add('bark', trunk(pal, false), air);
    book.add('logL', log(pal, 'L'), { solid: SOLID });
    book.add('logR', log(pal, 'R'), { solid: SOLID });
    for (let k = 0; k < 9; k++) book.add(`crown${k}`, crown(pal, k), air);
    book.add('printL', print(pal, 'L'), { solid: SOLID });
    book.add('printM', print(pal, 'M'), { solid: SOLID });
    book.add('printR', print(pal, 'R'), { solid: SOLID });
    book.add('acorn', acorn(pal), { ...air, score: POINTS.acorn, touch: 'sky' });
    book.add('pie', pie(pal), { ...air, hp: PIE_HP, touch: 'sky' });
  }
  if (has('stream')) {
    book.add('waterTop', water(pal, true, 0), air);
    book.add('waterTop2', water(pal, true, 1), air);
    book.add('water', water(pal, false, 0), air);
    book.add('water2', water(pal, false, 1), air);
    loop(['waterTop', 'waterTop2'], 9);
    loop(['water', 'water2'], 11);
    book.add('stoneUp', stone(pal, 'up'), { solid: LEDGE, grav: PULL.down });
    book.add('stoneHalf', stone(pal, 'half'), air);
    book.add('stoneUnder', stone(pal, 'under'), air);
    book.add('stoneRise', stone(pal, 'half'), air);
    loop(['stoneUp', 'stoneHalf', 'stoneUnder', 'stoneRise'], [STONE_TICKS.up, STONE_TICKS.half, STONE_TICKS.under, STONE_TICKS.rise]);
    book.add('bed', bed(pal), { solid: SOLID });
    book.add('footbridge', footbridge(pal), { solid: LEDGE, grav: PULL.down });
  }
  if (has('rain')) {
    for (let f = 0; f < 4; f++) book.add(`rain${f}`, rain(pal, f), air);
    loop(['rain0', 'rain1', 'rain2', 'rain3'], 2);
    book.add('puddle', puddle(pal), air);
  }
  if (has('wind')) {
    for (const [d, dir] of [
      ['R', 1],
      ['L', -1],
    ] as const) {
      const names = [0, 1, 2].map((f) => `gust${d}${f}`);
      names.forEach((n, f) => book.add(n, gust(pal, dir, f), { grav: dir > 0 ? PULL.right : PULL.left }));
      loop(names, 3);
    }
    const ups = [0, 1, 2].map((f) => `gustU${f}`);
    ups.forEach((n, f) => book.add(n, updraft(pal, f), { grav: PULL.up }));
    loop(ups, 3);
  }
  if (has('signs')) {
    book.add('arrowL', signpost(pal, 'L'), air);
    book.add('arrowR', signpost(pal, 'R'), air);
    book.add('arrowU', signpost(pal, 'U'), air);
    loop(['arrowL', 'arrowR'], ARROW_TICKS);
  }
  if (has('stars')) {
    const [a, b, c] = o.stars ?? [300, 500, 700];
    book.add('starA', star(pal, 'off', 1), air);
    book.add('starB', star(pal, 'off', 2), air);
    book.add('starC', star(pal, 'off', 3), air);
    book.add('faint', star(pal, 'faint', 4), air);
    book.add('bright', star(pal, 'bright', 4), air);
    book.add('faint2', star(pal, 'faint', 6), air);
    book.add('bright2', star(pal, 'bright', 6), air);
    timed.push({ name: 'starA', next: 'faint', ticks: a }, { name: 'starB', next: 'faint2', ticks: b }, { name: 'starC', next: 'faint', ticks: c });
    loop(['faint', 'bright'], [40, 25]);
    loop(['faint2', 'bright2'], [33, 30]);
    (['TL', 'TR', 'BL', 'BR'] as const).forEach((n, i) => book.add(`moon${n}`, moon(pal, i as 0 | 1 | 2 | 3), air));
  }
  if (has('tunnel')) {
    book.add('tStone', tunnelStone(pal, 0), { solid: SOLID });
    book.add('tStone1', tunnelStone(pal, 1), { solid: SOLID });
    book.add('tStone2', tunnelStone(pal, 2), { solid: SOLID });
    book.add('tAir', tunnelAir(pal, 0), { ...air, touch: 'tAirLit' });
    book.add('tAirLit', tunnelAir(pal, 2), air);
    book.add('glow2', tunnelAir(pal, 3), air);
    book.add('tAirFaint', tunnelAir(pal, 1), { ...air, touch: 'tAirLit' });
    book.add('tFloor', tunnelFloor(pal, false), { solid: SOLID });
    book.add('tFloorLit', tunnelFloor(pal, true), { solid: SOLID });
    book.add('lantern', lantern(pal, false), { ...air, score: POINTS.lantern, touch: 'lanternLit' });
    book.add('lanternLit', lantern(pal, true), air);
  }
  if (has('high')) {
    book.add('screeUp', scree(pal, 'up'), { solid: LEDGE, grav: PULL.down });
    book.add('screeHalf', scree(pal, 'half'), air);
    book.add('screeUnder', scree(pal, 'under'), air);
    book.add('screeRise', scree(pal, 'half'), air);
    loop(['screeUp', 'screeHalf', 'screeUnder', 'screeRise'], [STONE_TICKS.up, STONE_TICKS.half, STONE_TICKS.under, STONE_TICKS.rise]);
    for (const k of [0, 1, 2] as const) book.add(`dent${k}`, dent(pal, k), { solid: LEDGE, grav: PULL.down });
  }
  if (has('library')) {
    for (let v = 0; v < 6; v++) book.add(`shelf${v}`, shelf(pal, v), air);
    book.add('shelved', shelfGap(pal, true), air);
    book.add('gap', shelfGap(pal, false), { ...air, effect: GATE_COUNTER, eamt: -1, score: POINTS.shelved, touch: 'shelved' });
    book.add('book', lostBook(pal), { ...air, effect: GATE_COUNTER, eamt: 1, score: POINTS.book, touch: 'sky' });
    book.add('floor', floorboard(pal, 1), { solid: SOLID });
    book.add('floor2', floorboard(pal, 2), { solid: SOLID });
    for (let k = 0; k < 6; k++) book.add(`win${k}`, libWindow(pal, k), air);
    for (const part of ['L', 'M', 'R'] as const) book.add(`desk${part}`, desk(pal, part), air);
  }
  if (has('tower')) {
    book.add('leg', leg(pal), { solid: SOLID });
    for (let k = 0; k < 4; k++) book.add(`brace${k}`, brace(pal, k), air);
    book.add('deck', landing(pal, 1), { solid: LEDGE, grav: PULL.down });
    book.add('deck2', landing(pal, 2), { solid: LEDGE, grav: PULL.down });
    book.add('rail', railing(pal), air);
    for (const part of ['L', 'M', 'R'] as const) book.add(`roof${part}`, shingles(pal, part), air);
    book.add('lamp', lamp(pal, false), { ...air, score: POINTS.lantern, touch: 'lampLit' });
    book.add('lampLit', lamp(pal, true), air);
    book.add('boardUp', landing(pal, 3), { solid: LEDGE, grav: PULL.down });
    book.add(
      'boardHalf',
      landing(pal, 4).map((x, y, c) => (y < 3 ? pal.c('sky', 3) : c)),
      air,
    );
    book.add('boardGone', calm(pal), air);
    book.add(
      'boardBack',
      landing(pal, 4).map((x, y, c) => (y < 3 ? pal.c('sky', 3) : c)),
      air,
    );
    loop(['boardUp', 'boardHalf', 'boardGone', 'boardBack'], [STONE_TICKS.up, STONE_TICKS.half, STONE_TICKS.under, STONE_TICKS.rise]);
  }
  if (has('picnic')) {
    for (const part of ['L', 'M', 'R'] as const) book.add(`blanket${part}`, blanket(pal, part), air);
    for (const part of ['L', 'M', 'R'] as const) book.add(`mat${part}`, doormat(pal, part), air);
  }
  return timed;
}

/** Tess's own garden gate in her fence: shut, or swung open (the mountain's yawn rattles the latch loose). */
function plugless(pal: Pal, open: boolean): Pixels {
  return open ? gateHome(pal, 'green') : fenceGate(pal);
}

function fenceGate(pal: Pal): Pixels {
  const p = new Pixels(20, 20, clearSky(pal));
  p.blit(gate(pal, 'green', 0), 0, 0, 255);
  return p;
}

const clearSky = (pal: Pal) => pal.c('sky', 3);
