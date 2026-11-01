// Level 8, The Marching Field (the Brass family). MEANWHILE... Doc Leo conducts the marching
// band on the football field. Notes glide right to left along a staff of five lines toward his
// baton (BATON.CHR), which glides up and down beside the staff (a tap of Up or Down, a line at a
// time) and flicks at a line's key with Space ("The Conductor", DESIGN.md: one key a line was the
// plan, but PLAYGAME moves a hero at most 11 px a tick, so no key can send it straight to a line).
// It works as the Player Piano's tubes do (rail.ts), turned on its side:
//
// - Each line's glide is a ring of STEPS blocks, one an eighth (STEP ticks); cell u from the far
//   end holds ring member (-u mod STEPS), so a note slides one cell left an eighth.
// - The column after the baton's is each line's key ring (solid, so the baton stays by the
//   staff), lit for the eighth its note arrives: early 1 tick (+5), on the beat 4 (+20), late 1
//   (+5), each a hit (counter 26). A flick at an unlit key takes a hit back (refused at none).
// - The low lines ring a horn (a counter up, slot 7), the high ones a trumpet (hit points first,
//   slot 0).
// - Four notes a phrase, 4 eighths (24 ticks) apart and never more than two lines from the last,
//   so there is time to glide over and flick. Across the top a note fills in each half phrase;
//   after four phrases the gate under the baton opens for HITS_NEEDED hits (a tap of Down), and
//   the baton walks out along the touchline, where the band has left its five brass instruments.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { blob } from '../../../snowbound/src/art/draw';
import { LEO, leoOn } from '../../../teddy3/src/sprites/leo';
import type { Pal } from '../art/pal';
import { kit, pickups, SOLID, GRAV, type Kit } from '../blocks/common';
import { CTR, HITS_NEEDED } from '../ids';
import { MapBuilder, at, type Level } from './maps';

export const BRASS_FINDS = ['synth-brass', 'trumpet', 'trombone', 'horn', 'tuba'];
/** Ticks an eighth lasts (a beat of 12 ticks: the field song's tempo). */
export const FIELD_STEP = 6;
const STEPS = 16;
/** The baton's column (the keys are the next one), and the far end of the glide. */
export const BATON_X = 2;
const KEY_X = BATON_X + 1;
const GLIDE_END = 14;
/** Line i's row (line 0 the bottom) and the eighth its note arrives on (-1: none; the top line rests). */
export const LINES = [
  { row: 6, at: 0, high: false },
  { row: 5, at: 12, high: false },
  { row: 4, at: 4, high: true },
  { row: 3, at: 8, high: true },
  { row: 2, at: -1, high: true },
] as const;
/** The baton's row (the touchline). */
export const BATON_ROW = 7;
/** Ticks the band plays before the gate opens (four phrases). */
export const FIELD_TICKS = FIELD_STEP * STEPS * 4;
const GRADES: [string, number, number][] = [
  ['early', 1, 5],
  ['beat', 4, 20],
  ['late', 1, 5],
];
/** Where the band left the brass along the touchline (level columns). */
export const BRASS_AT = [6, 8, 10, 12, 13];
const W = 16;

/** The glide blocks that show a note (by name), for the bot's eyes. */
const NOTE_SHOWN = new Set<string>();
export const fieldNoteShown = (_book: Kit['book'], name: string) => NOTE_SHOWN.has(name);

export function fieldBlocks(pal: Pal): Kit {
  const k = kit(pal);
  const { book, c, P } = k;
  const still = { grav: GRAV.down };
  // the field: striped turf, and a staff line through the middle of a line's row
  const turf = (row: number) => P(c('grass', row % 2 ? 2 : 3)).rect(0, 19, 20, 1, c('grass', 1));
  const line = (row: number) => turf(row).rect(0, 9, 20, 2, c('paint', 3));
  for (const l of LINES) book.add(`line${l.row}`, line(l.row), still);
  // the stands behind the field, the chalk touchline under the baton, the track below
  book.add('stands', P(c('metal', 1)).rect(0, 6, 20, 2, c('metal', 3)).rect(0, 14, 20, 2, c('metal', 3)), { solid: SOLID });
  book.add('chalk', turf(7).rect(0, 18, 20, 2, c('paint', 3)), still);
  book.add('track', P(c('brick', 2)).rect(0, 0, 20, 2, c('paint', 3)), { solid: SOLID });
  // the podium Doc Leo stands on, and the flags behind him (they wall the baton in on the left)
  book.add('podium', P(c('red', 1)).rect(0, 0, 20, 3, c('gold', 2)).rect(0, 17, 20, 3, c('red', 0)), { solid: SOLID });
  book.add('flag', turf(3).rect(3, 0, 1, 20, c('metal', 3)).rect(4, 2, 12, 8, c('red', 2)).rect(4, 5, 12, 2, c('paint', 3)), { solid: SOLID });
  const [lt, lb] = leoOn(LEO.wave, turf(5), turf(6));
  book.add('leo.top', lt, { solid: SOLID });
  book.add('leo', lb, { solid: SOLID });
  // beside the staff, where the baton glides: nothing pulls it, so it stays on its line
  for (const l of LINES) book.add(`air${l.row}`, line(l.row));

  const note = (p: Pixels, high: boolean) => {
    const ink = high ? c('red', 2) : c('blue', 2);
    blob(p, 9, 10, 6, 4.4, [c('ink', 0), ink, ink], 0, 2);
    p.rect(14, 1, 1, 9, c('ink', 0)).rect(6, 8, 2, 1, c('cloud', 2));
    return p;
  };
  for (const l of LINES) {
    const id = `l${l.row}`;
    const key = (glow: number) => {
      const p = line(l.row).rect(0, 0, 2, 20, c('gold', 1)).rect(18, 0, 2, 20, c('gold', 1));
      if (glow) note(p.rect(2, 2, 16, 16, c('yellow', glow)), l.high);
      return p;
    };
    const miss = { effect: CTR.beats, eamt: -1 };
    if (l.at < 0) {
      // a line that rests: its key never lights
      book.add(`${id}.k0`, key(0), { ...miss, solid: SOLID });
      continue;
    }
    // the glide: member j shows a note if the note arrives at the baton (GLIDE cells on) GLIDE eighths after j
    const glide = GLIDE_END - BATON_X - 1;
    for (let j = 0; j < STEPS; j++) {
      const shows = (j + glide) % STEPS === l.at;
      if (shows) NOTE_SHOWN.add(`${id}.g${j}`);
      const p = line(l.row);
      book.add(`${id}.g${j}`, shows ? note(p, l.high) : p, { ...still, ntime: FIELD_STEP, next: `${id}.g${(j + 1) % STEPS}` });
    }
    // the key beside the baton: a gold bar across the line, lit with the note on it
    const ring: { pic: Pixels; ticks: number; hit?: number }[] = [];
    if (l.at) ring.push({ pic: key(0), ticks: l.at * FIELD_STEP });
    for (const [grade, ticks, score] of GRADES) ring.push({ pic: key(grade === 'beat' ? 3 : 2), ticks, hit: score });
    const rest = (STEPS - l.at - 1) * FIELD_STEP;
    if (rest) ring.push({ pic: key(0), ticks: rest });
    if (ring.reduce((n, r) => n + r.ticks, 0) !== FIELD_STEP * STEPS) throw new Error(`field: line ${l.row} is out of step`);
    ring.forEach((r, i) => {
      const lit = { effect: CTR.beats, eamt: 1, score: r.hit, hp: l.high ? 1 : 0 };
      book.add(`${id}.k${i}`, r.pic, { solid: SOLID, ntime: r.ticks, next: `${id}.k${(i + 1) % ring.length}`, ...(r.hit ? lit : miss) });
    });
  }

  // the meter across the top: a note fills in every half phrase
  const slot = (full: boolean) => {
    const p = P(c('metal', 1)).rect(0, 18, 20, 2, c('metal', 0));
    if (full) blob(p, 9, 11, 5, 4, [c('ink', 0), c('yellow', 3), c('yellow', 3)], 0, 2);
    else p.ring(9, 11, 4, c('metal', 3));
    return p.rect(13, 2, 1, 9, full ? c('ink', 0) : c('metal', 3));
  };
  const per = FIELD_TICKS / 8;
  for (let i = 0; i < 8; i++) book.add(`meter${i}`, slot(false), { solid: SOLID, ntime: per * (i + 1), next: 'meter.full' });
  book.add('meter.full', slot(true), { solid: SOLID });
  // the gate under the baton: a goalpost's padding, shut while the band plays, then open for enough hits
  const gate = (open: boolean, ready: boolean) => {
    const p = turf(7).rect(0, 18, 20, 2, c('paint', 3));
    if (open) return p;
    p.rect(4, 0, 12, 20, c('yellow', 2)).frame(4, 0, 12, 20, c('gold', 0));
    if (ready) blob(p, 9, 13, 3.4, 2.6, [c('ink', 0), c('red', 2), c('red', 2)], 0, 2).rect(12, 4, 1, 9, c('ink', 0));
    return p;
  };
  book.add('lid', gate(false, false), { solid: SOLID, ntime: FIELD_TICKS, next: 'gate' });
  book.add('gate', gate(false, true), { solid: SOLID, effect: CTR.beats, eamt: -HITS_NEEDED, touch: 'gate.open' });
  book.add('gate.open', gate(true, true), still);
  pickups(k, BRASS_FINDS, 'chalk');
  return k;
}

export function field(book: Kit['book']): Level {
  const m = new MapBuilder(book, { S: 'stands', c: 'chalk', T: 'track', P: 'podium', F: 'flag' }, 'track');
  for (let x = 0; x < W; x++) m.set(x, 0, x < 8 ? `meter${x}` : 'S');
  m.fill(0, 1, W, 1, 'S');
  m.fill(0, 2, 2, 5, 'F');
  for (const l of LINES) {
    m.set(BATON_X, l.row, `air${l.row}`).set(KEY_X, l.row, `l${l.row}.k0`);
    const glide = GLIDE_END - KEY_X;
    if (l.at >= 0) for (let u = 0; u < glide; u++) m.set(GLIDE_END - u, l.row, `l${l.row}.g${(STEPS - u) % STEPS}`);
    else m.fill(KEY_X + 1, l.row, glide, 1, `line${l.row}`);
    m.fill(GLIDE_END + 1, l.row, W - GLIDE_END - 1, 1, `line${l.row}`);
  }
  m.set(1, 5, 'leo.top').set(1, 6, 'leo');
  m.fill(0, BATON_ROW, W, 1, 'c').fill(0, BATON_ROW + 1, W, 2, 'T');
  m.set(0, BATON_ROW, 'P').set(1, BATON_ROW, 'P');
  m.set(BATON_X, BATON_ROW, 'lid');
  BRASS_FINDS.forEach((id, i) => m.set(BRASS_AT[i], BATON_ROW, `pick-${id}`));
  m.link(W - 1, BATON_ROW);
  return { m, start: at(BATON_X, LINES[0].row), size: [W, 10] };
}
