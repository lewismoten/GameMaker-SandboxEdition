// Level 6, The Arcade (the Synth family). Neon tiles under a marquee of chasing lights; the
// cabinets are steps, and the synth pads float as platforms that wobble (their glow swells and
// shrinks, a ring of frames) without ever moving out from under Teddy. Every note is a chord
// broken upward, and every synth found chirps one too (sounds.ts ARCADE_CHORDS: the sound
// slots as speaker arpeggios). Seven synths to find; a toy drummer marches the floor.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import type { Pal } from '../art/pal';
import { door, kit, LEDGE, notes, pickups, SOLID, GRAV, type Kit } from '../blocks/common';
import { MON } from '../ids';
import { MapBuilder, at, type Level } from './maps';

export const SYNTH_FINDS = ['lead-bright', 'lead-square', 'lead-saw', 'pad-80s', 'pad-warm', 'pad-sweep', 'pad-wobble'];
/** Level width; one screen tall. */
const W = 32;
/** The cabinets: [left column, height in blocks]. */
const CABINETS: [number, number][] = [
  [6, 1],
  [7, 2],
  [15, 1],
  [16, 2],
  [24, 1],
  [25, 2],
];
/** The wobbling pads: [left column, row, width]. */
export const PADS: [number, number, number][] = [
  [10, 5, 3],
  [19, 5, 3],
  [27, 5, 2],
];
/** Ticks each frame of a pad's wobble shows. */
const WOBBLE = 4;

export function arcadeBlocks(pal: Pal): Kit {
  const k = kit(pal);
  const { book, c, P } = k;
  const air = { grav: GRAV.down };
  // the back wall: deep violet with a faint neon grid
  const wall = () => {
    const p = P(c('lilac', 1));
    p.rect(0, 19, 20, 1, c('lilac', 2)).rect(19, 0, 1, 20, c('lilac', 2));
    return p;
  };
  book.add('wall', wall(), air);
  // the marquee: bulbs that chase along it, two frames
  const marquee = (on: number) => {
    const p = P(c('ink', 0)).rect(0, 16, 20, 4, c('neon', 0));
    for (let i = 0; i < 4; i++) p.disc(2 + i * 5, 8, 1.6, (i + on) % 2 ? c('glow', 3) : c('glow', 0));
    return p;
  };
  book.add('marquee', marquee(0), { solid: SOLID, ntime: 6, next: 'marquee.1' });
  book.add('marquee.1', marquee(1), { solid: SOLID, ntime: 6, next: 'marquee' });
  // the floor: checkered neon tiles
  const tile = P(c('ink', 1));
  for (let y = 0; y < 20; y += 10) for (let x = 0; x < 20; x += 10) if ((x + y) % 20 === 0) tile.rect(x, y, 10, 10, c('fam-synth', 0));
  tile.rect(0, 0, 20, 1, c('neon', 2));
  book.add('floor', tile, { solid: SOLID });
  // a cabinet: the screen on top (aglow), the control panel below
  const cab = (top: boolean) => {
    const p = P(c('ink', 0)).rect(1, 0, 18, 20, c('purple', 1)).rect(1, 0, 2, 20, c('purple', 2));
    if (top) p.rect(4, 3, 12, 9, c('ink', 0)).rect(5, 4, 10, 7, c('neon', 3)).rect(7, 6, 3, 2, c('glow', 3)).rect(3, 0, 14, 2, c('neon', 1));
    else p.rect(3, 2, 14, 4, c('ink', 1)).disc(7, 4, 1.4, c('red', 2)).disc(12, 4, 1.4, c('yellow', 2)).rect(9, 10, 2, 8, c('ink', 0));
    return p;
  };
  book.add('cab.top', cab(true), { solid: SOLID });
  book.add('cab', cab(false), { solid: SOLID });
  // a synth pad to stand on: a glowing bar that swells and shrinks (stand on top, hop up through)
  const pad = (k2: number) => {
    const p = wall();
    const h = [3, 4, 5, 4][k2];
    p.rect(0, 2, 20, h, c('fam-synth', 1))
      .rect(0, 2, 20, 1, c('neon', 3))
      .rect(0, 2 + h, 20, 1, c('fam-synth', 0));
    for (let x = 2; x < 20; x += 6) p.set(x + k2, 3, c('glow', 3));
    return p;
  };
  for (let i = 0; i < 4; i++) book.add(`pad${i}`, pad(i), { solid: LEDGE, grav: GRAV.down, ntime: WOBBLE, next: `pad${(i + 1) % 4}` });
  book.add('pillar', P(c('ink', 0)).rect(8, 0, 4, 20, c('neon', 1)).rect(9, 0, 1, 20, c('neon', 3)), { solid: SOLID });
  notes(k, wall(), [c('neon', 1), c('neon', 2), c('neon', 3), c('glow', 3), c('green', 2), c('pink', 2)]);
  pickups(k, SYNTH_FINDS, 'wall');
  door(k, wall(), SYNTH_FINDS.length, (p: Pixels) => {
    // a joystick over the door
    p.rect(9, 6, 2, 6, c('ink', 0)).disc(10, 6, 2, c('red', 2));
  });
  return k;
}

export function arcade(book: Kit['book']): Level {
  const m = new MapBuilder(book, { '.': 'wall', _: 'floor', M: 'marquee' }, 'floor');
  m.fill(0, 0, W, 1, 'M').fill(0, 1, W, 8, '.').fill(0, 9, W, 1, '_');
  for (const [x, h] of CABINETS) {
    m.set(x, 9 - h, 'cab.top');
    for (let y = 10 - h; y < 9; y++) m.set(x, y, 'cab');
  }
  PADS.forEach(([x, y, w], i) => {
    for (let dx = 0; dx < w; dx++) m.set(x + dx, y, `pad${(i + dx) % 4}`);
  });
  // a scale of notes over the first cabinets and pad, and the high pad's chords
  // a scale of notes up the first cabinets and across the first pad
  [
    [5, 8],
    [6, 7],
    [8, 5],
    [10, 4],
    [12, 4],
    [18, 4],
  ].forEach(([x, y], i) => m.set(x, y, `note${i}`));
  m.set(3, 8, 'pick-lead-bright')
    .set(7, 6, 'pick-lead-square')
    .set(11, 4, 'pick-pad-warm')
    .set(13, 8, 'pick-lead-saw')
    .set(20, 4, 'pick-pad-sweep')
    .set(22, 8, 'pick-pad-80s')
    .set(28, 4, 'pick-pad-wobble');
  // the door, with a neon pillar over it up to the marquee: the only way on is through it
  m.set(30, 8, 'door').set(30, 7, 'door.top').set(31, 8, 'door.open').fill(30, 1, 1, 6, 'pillar');
  m.link(31, 8);
  m.mon(MON.drummer, 20, 8);
  // row 5: the view (which never scrolls up or down) sits square on the level; Teddy drops to the floor
  return { m, start: at(1, 5), size: [W, 10] };
}
