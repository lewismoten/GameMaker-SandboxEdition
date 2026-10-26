// turret.bbl: up the Hive's turret, seen from the side, where gravity pulls down (except where
// the air moves). Castle stone, oak floors you can hop up through, the bakery ovens at the foot
// whose warm air rises in columns and carries a small robot up with it, the ceiling fans' drafts
// that blow straight across (no falling in them), Will's pages caught here and there, and the
// stairs: down to the Hive the way Joe came, and the back stair at the top, down to the stage.
import { SOLTOP } from '../../../../web/src/formats/blocks';
import { Pixels, rng } from '../../../kit/pixels';
import { bevel, shadeAt } from '../art/draw';
import { c, r } from '../art/pal';
import { CTR } from '../ids';
import { addKeepsakes } from './keepsakes';
import { BlockSet, GRAV, SOLID } from './sets';

const DOWN = GRAV.s;

/** The turret's inside: plastered stone, warm. */
function back(seed: number): Pixels {
  const p = new Pixels(20, 20, c('wood', 1));
  const R = rng(seed);
  p.map((x, y, v) => (R() < 0.3 ? shadeAt(r('brick'), 0, 1, R(), x, y) : v));
  return p;
}

function wall(seed: number): Pixels {
  const p = new Pixels(20, 20, c('stone', 1));
  const R = rng(seed);
  for (let y = 0; y < 20; y += 7) for (let x = (y / 7) % 2 ? -5 : 0; x < 20; x += 10) bevel(p, x + 1, y + 1, 9, 6, r('stone'), 2 + Math.floor(R() * 2));
  return p;
}

function floor(seed: number): Pixels {
  const p = back(seed);
  bevel(p, 0, 0, 20, 6, r('wood'), 4);
  p.rect(0, 6, 20, 1, c('ink', 1));
  for (const x of [3, 16]) p.rect(x, 7, 1, 2, c('wood', 2));
  return p;
}

/** Warm air rising from the ovens: wavy shimmer going up (two frames). */
function warm(seed: number, frame: number): Pixels {
  const p = back(seed);
  for (let k = 0; k < 3; k++) {
    const x0 = 4 + k * 6;
    for (let y = 0; y < 20; y++) {
      const x = x0 + Math.round(Math.sin((y + frame * 5 + k * 3) / 3) * 1.5);
      if ((y + frame * 4 + k * 2) % 7 < 4) p.set(x, y, c('window', 1));
    }
  }
  return p;
}

/** A fan's draft blowing across: streaks pointing the way it blows (two frames). */
function draft(dir: 'e' | 'w', frame: number): Pixels {
  const p = back(7);
  for (let k = 0; k < 4; k++) {
    const y = 3 + k * 4 + (k % 2);
    const x0 = (k * 7 + frame * 6) % 20;
    for (let i = 0; i < 6; i++) p.set((x0 + i) % 20, y, c('paper', i === (dir === 'e' ? 5 : 0) ? 4 : 2));
  }
  return p;
}

/** The fan in the wall that makes a draft: a cage, blades turning (two frames). */
function fan(frame: number): Pixels {
  const p = wall(9);
  p.disc(10, 10, 8, c('stone', 0)).ring(10, 10, 8, c('stone', 4));
  for (let k = 0; k < 3; k++) {
    const a = (k * 2 * Math.PI) / 3 + (frame ? Math.PI / 3 : 0);
    p.line(10, 10, Math.round(10 + Math.cos(a) * 6), Math.round(10 + Math.sin(a) * 6), c('stone', 4));
  }
  p.disc(10, 10, 1.5, c('brass', 3));
  return p;
}

/** A bakery oven at the turret's foot, its door glowing, warmth coming off it. */
function oven(): Pixels {
  const p = wall(4);
  p.rect(2, 4, 16, 16, c('brick', 2)).frame(2, 4, 16, 16, c('ink', 0));
  p.disc(10, 13, 5, c('window', 2)).disc(10, 13, 3, c('yellow', 3));
  p.rect(2, 4, 16, 2, c('brick', 3));
  return p;
}

/** One of Will's pages, caught on a nail: walk into it to take it. */
function page(seed: number): Pixels {
  const p = back(seed);
  p.rect(5, 3, 10, 14, c('paper', 4)).frame(5, 3, 10, 14, c('paper', 2));
  for (let y = 5; y < 15; y += 2) p.rect(6, y, 8 - (y % 3), 1, c('ink', 1));
  p.disc(10, 3, 1, c('stone', 4));
  return p;
}

/** A stair door: down to the Hive (an arrow down) or the back stair to the stage (a star over it). */
function stairDoor(kind: 'down' | 'stage'): Pixels {
  const p = back(11);
  p.rect(4, 2, 12, 18, c('wood', 2)).disc(10, 5, 6, c('wood', 2)).frame(4, 6, 12, 14, c('wood', 1));
  if (kind === 'down') p.rect(9, 9, 2, 6, c('paper', 3)).rect(7, 13, 6, 1, c('paper', 3)).rect(8, 14, 4, 1, c('paper', 3));
  else {
    p.disc(10, 4, 2, c('yellow', 3));
    p.rect(7, 10, 6, 1, c('paper', 3)).rect(7, 13, 6, 1, c('paper', 3));
  }
  p.disc(13, 12, 1, c('brass', 3));
  return p;
}

/** A hanging lamp, for something to look at. */
function lamp(): Pixels {
  const p = back(13);
  p.rect(9, 0, 2, 8, c('ink', 1));
  p.disc(10, 11, 4, c('brass', 2)).disc(10, 12, 2.5, c('window', 2));
  return p;
}

export function turretSet(): BlockSet {
  const s = new BlockSet(150, false);
  s.add('wall', wall(1), { solid: SOLID });
  s.add('wall2', wall(2), { solid: SOLID });
  s.add('air', back(1), { grav: DOWN });
  s.add('air2', back(3), { grav: DOWN });
  s.add('floor', floor(1), { solid: SOLTOP, grav: DOWN });
  // the warm air rising: it lifts (and every copy keeps one clock, shimmering)
  s.add('warm', warm(1, 0), { grav: GRAV.n, next: 'warm2', ntime: 4 });
  s.add('warm2', warm(1, 1), { grav: GRAV.n, next: 'warm', ntime: 4 });
  // the fans' drafts: straight across, nothing pulling down
  s.add('draftW', draft('w', 0), { grav: GRAV.w, next: 'draftW2', ntime: 3 });
  s.add('draftW2', draft('w', 1), { grav: GRAV.w, next: 'draftW', ntime: 3 });
  s.add('draftE', draft('e', 0), { grav: GRAV.e, next: 'draftE2', ntime: 3 });
  s.add('draftE2', draft('e', 1), { grav: GRAV.e, next: 'draftE', ntime: 3 });
  s.add('fan', fan(0), { solid: SOLID, next: 'fan2', ntime: 2 });
  s.add('fan2', fan(1), { solid: SOLID, next: 'fan', ntime: 2 });
  s.add('oven', oven(), { solid: SOLID });
  s.add('page', page(5), { grav: DOWN, effect: CTR.task, eamt: 1, score: 50, touch: 'air' });
  s.add('pageWarm', page(6), { grav: GRAV.n, effect: CTR.task, eamt: 1, score: 50, touch: 'warm' });
  s.add('stairDown', stairDoor('down'), { grav: DOWN });
  s.add('stairStage', stairDoor('stage'), { grav: DOWN });
  s.add('lamp', lamp(), { grav: DOWN });
  addKeepsakes(s, back(1), 'air');
  return s;
}
