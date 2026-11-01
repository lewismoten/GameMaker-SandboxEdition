// Level 11, The Farm (the Percussion family). The cowbell is on the cow, the woodblock on
// the woodpile and the timpani on the hay wagon; and on the barn's stage the drum, the snare
// and the shaker hang from their hooks and play the band on the beat: each one lights up
// (its gold frame) on its own beat of the bar, the drum on one, the snare on two and four,
// the shaker on three (rings of blocks, the song's own beat of 8 ticks). Teddy boops one from
// under its hook while it is lit to take it, and an unlit one only sways. Six to find; the
// barn door opens when all six are found.
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { iconPic, pickupPic } from '../art/icons';
import type { Pal } from '../art/pal';
import { door, kit, pickups, SOLID, GRAV, type Kit } from '../blocks/common';
import { CTR } from '../ids';
import { MapBuilder, at, type Level } from './maps';

export const PERC_FINDS = ['cowbell', 'woodblock', 'timpani', 'melodic-kick', 'melodic-snare', 'melodic-hat'];
const W = 36;
/** The song's beat (ticks): a bar is four. */
export const FARM_BEAT = 8;
/** Ticks an instrument on a hook stays lit: a person's window. */
const LIT = 6;
/** The hooks on the barn stage: [id, column, the beats of the bar it plays (0..3)]. */
export const HOOKS: [string, number, number[]][] = [
  ['melodic-kick', 18, [0]],
  ['melodic-snare', 21, [1, 3]],
  ['melodic-hat', 24, [2]],
];
/** The row the hooked instruments hang in; Teddy stands on the stage in the row under it. */
export const HOOK_ROW = 6;
/** The barn stage: its first and last column (its boards are on the row under Teddy's). */
const STAGE: [number, number] = [16, 26];
/** Where the others lie: [id, x, y]. */
export const PERC_AT: [string, number, number][] = [
  ['cowbell', 5, 8],
  ['woodblock', 11, 6],
  ['timpani', 29, 7],
];

export function farmBlocks(pal: Pal): Kit {
  const k = kit(pal);
  const { book, c, P } = k;
  const air = { grav: GRAV.down };
  // the afternoon sky over the farmyard (a shade a row), the barn's red boards behind the stage
  const sky = (row: number) => P(c('sky', Math.min(7, row + 1)));
  for (let r = 0; r < 9; r++) book.add(`sky${r}`, sky(r), air);
  const barn = () => {
    const p = P(c('red', 1));
    for (let x = 0; x < 20; x += 5) p.rect(x, 0, 1, 20, c('red', 0));
    return p;
  };
  book.add('barn', barn(), air);
  // the barn's end wall over its door, up to the roof
  book.add('boards', barn().rect(0, 0, 2, 20, c('paint', 3)).rect(18, 0, 2, 20, c('paint', 3)), { solid: SOLID });
  book.add('roof', P(c('roof', 1)).rect(0, 14, 20, 6, c('roof', 0)).rect(0, 0, 20, 2, c('roof', 2)), { solid: SOLID });
  book.add('grass', P(c('dirt', 2)).rect(0, 0, 20, 4, c('grass', 3)).rect(0, 0, 20, 1, c('grass', 4)), { solid: SOLID });
  // the stage's boards (stand on them) and a fence rail (hop it)
  book.add('stage', P(c('wood', 2)).rect(0, 0, 20, 3, c('wood', 4)).rect(0, 3, 20, 1, c('wood', 0)).rect(9, 4, 1, 16, c('wood', 1)), { solid: SOLID });
  const fence = sky(7).rect(2, 4, 3, 16, c('paint', 3)).rect(15, 4, 3, 16, c('paint', 3)).rect(0, 7, 20, 3, c('paint', 2)).rect(0, 14, 20, 3, c('paint', 2));
  book.add('fence', fence, { solid: SOLID });
  // the woodpile: logs end on, steps up; the hay wagon
  const logs = P(c('wood', 1));
  for (const [x, y] of [
    [5, 5],
    [15, 5],
    [10, 14],
  ])
    logs.disc(x, y, 4.5, c('wood', 3)).ring(x, y, 2.5, c('wood', 2)).set(x, y, c('wood', 0));
  book.add('logs', logs, { solid: SOLID });
  book.add('wagon', sky(7).rect(0, 2, 20, 10, c('hay', 2)).rect(0, 2, 20, 2, c('hay', 3)).disc(10, 15, 4.5, c('wood', 0)).disc(10, 15, 2, c('wood', 3)), {
    solid: SOLID,
  });
  // the cow (two blocks: her body, and her head turned to the cowbell)
  const cow = (head: boolean) => {
    const p = sky(7);
    if (head)
      p.rect(0, 4, 8, 10, c('cloud', 2))
        .rect(6, 2, 10, 10, c('cloud', 2))
        .rect(8, 4, 3, 3, c('ink', 0))
        .rect(12, 9, 5, 4, c('pink', 2))
        .rect(6, 0, 2, 3, c('hay', 2));
    else
      p.rect(0, 4, 20, 10, c('cloud', 2))
        .rect(4, 5, 6, 5, c('ink', 0))
        .rect(13, 7, 4, 4, c('ink', 0))
        .rect(2, 14, 3, 6, c('cloud', 1))
        .rect(14, 14, 3, 6, c('cloud', 1));
    return p;
  };
  book.add('cow', cow(false), air);
  book.add('cow.head', cow(true), air);
  // the hooks: the beam they hang from, and each instrument on its ring of beats
  book.add('rafter', barn().rect(0, 0, 20, 4, c('wood', 1)).rect(9, 4, 2, 4, c('metal', 2)), air);
  const swaying = (id: string) => iconPic(id, barn().rect(9, 0, 2, 2, c('metal', 2)));
  for (const [id, , beats] of HOOKS) {
    // the ring: dark stretches and lit beats, LIT ticks each, through a bar
    const ring: { lit: boolean; ticks: number }[] = [];
    let t = 0;
    for (const b of beats) {
      if (b * FARM_BEAT > t) ring.push({ lit: false, ticks: b * FARM_BEAT - t });
      ring.push({ lit: true, ticks: LIT });
      t = b * FARM_BEAT + LIT;
    }
    if (t < 4 * FARM_BEAT) ring.push({ lit: false, ticks: 4 * FARM_BEAT - t });
    ring.forEach((r, j) => {
      const next = `hook-${id}.${(j + 1) % ring.length}`;
      const take = { effect: CTR.found, eamt: 1, score: 50, touch: 'hook' };
      book.add(`hook-${id}.${j}`, r.lit ? pickupPic(id, j % 4) : swaying(id), { ...air, ntime: r.ticks, next, ...(r.lit ? take : {}) });
    });
  }
  book.add('hook', barn().rect(9, 0, 2, 6, c('metal', 2)).rect(8, 6, 4, 2, c('metal', 3)), air);
  pickups(
    k,
    PERC_AT.map(([id]) => id),
    (id) => `sky${PERC_AT.find(([w]) => w === id)![2]}`,
  );
  door(k, barn(), PERC_FINDS.length, (p: Pixels) => {
    // a horseshoe over the barn door
    p.ring(10, 8, 3.5, c('metal', 3)).rect(6, 9, 9, 3, c('wood', 3));
  });
  return k;
}

export function farm(book: Kit['book']): Level {
  const m = new MapBuilder(book, { R: 'roof', g: 'grass', s: 'stage', f: 'fence', L: 'logs', b: 'barn' }, 'grass');
  for (let r = 0; r < 9; r++) m.fill(0, r, W, 1, `sky${r}`);
  m.fill(0, 9, W, 1, 'g');
  // the barn: its roof, its back wall behind the stage, the rafter the hooks hang from
  m.fill(STAGE[0] - 1, 3, STAGE[1] - STAGE[0] + 3, 1, 'R').fill(STAGE[0], 4, STAGE[1] - STAGE[0] + 1, 4, 'b');
  m.fill(STAGE[0], 4, STAGE[1] - STAGE[0] + 1, 1, 'rafter');
  m.fill(STAGE[0], 8, STAGE[1] - STAGE[0] + 1, 1, 's');
  for (const [id, x] of HOOKS) m.set(x, HOOK_ROW - 1, 'hook').set(x, HOOK_ROW, `hook-${id}.0`);
  // the pasture: the cow, a fence; the woodpile; the hay wagon
  m.set(3, 8, 'cow').set(4, 8, 'cow.head');
  m.set(8, 8, 'f');
  m.set(10, 8, 'L').fill(11, 7, 1, 2, 'L').set(12, 8, 'L');
  m.set(29, 8, 'wagon');
  for (const [id, x, y] of PERC_AT) m.set(x, y, `pick-${id}`);
  m.set(34, 8, 'door').set(34, 7, 'door.top').set(35, 8, 'door.open').set(34, 3, 'R').fill(34, 4, 1, 3, 'boards');
  m.link(35, 8);
  // row 5: the view (which never scrolls up or down) sits square on the level; Teddy drops to the grass
  return { m, start: at(1, 5), size: [W, 10] };
}
