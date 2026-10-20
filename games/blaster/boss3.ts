// Boss 3: THE FEEDBACK HOWLER. A screaming face jammed into the line-out jack. In front of
// it a speaker grille of armored bars slides back and forth (every bar the same monster on
// the same path): shots only get through the gaps, and so does the ship.
import { Pixels } from '../kit/pixels';
import { CLEAR, bevel, blob } from './art';
import { armor, slicesOf, tint, weakPoint } from './boss';
import { mite, pics } from './enemies';
import { arena } from './mapkit';
import type { Bestiary } from './mons';
import type { Pal } from './pal';
import { keyOf, wasp } from './sprites';
import { kit, type Leg } from './stage';
import type { BlockSet } from './art';
import type { StageArt } from './tiles';
import { POWER } from './ids';

function face(p: Pal, loud: boolean): Pixels {
  const big = new Pixels(40, 40, CLEAR);
  blob(big, 20, 20, 19, 19, p.r('gold'), 0, 3);
  for (const s of [-1, 1]) {
    blob(big, 20 + s * 9, 10, 5, 4, p.r('grey'), 6, 7);
    blob(big, 20 + s * 9, 11, 2, 2, p.r('red'), 1, 3);
    big.rect(20 + s * 9 - 5, 4 - (s > 0 ? 0 : 0), 10, 2, p.c('ink', 0));
  }
  const r = loud ? 10 : 7;
  blob(big, 20, 28, r, r - 2, p.r('ink'), 0, 0);
  blob(big, 20, 30, r - 4, r - 5, p.r('red'), 0, 2);
  if (loud) for (let k = 0; k < 3; k++) big.rect(10 - k * 3, 27 + k * 2, 2, 1, p.c('cyan', 4)).rect(29 + k * 3, 27 + k * 2, 2, 1, p.c('cyan', 4));
  return big;
}

function bar(p: Pal): Pixels {
  const t = new Pixels(20, 20, CLEAR);
  bevel(t, 0, 6, 20, 8, p.r('steel'), 3, 1);
  for (let x = 2; x < 20; x += 4) t.rect(x, 9, 2, 2, p.c('ink', 0));
  return t;
}

function bossTiles(bs: BlockSet, a: StageArt): void {
  const p = a.pal;
  const plug = a.floor(0);
  bevel(plug, 1, 1, 18, 18, p.r('trim'), 3, 2);
  blob(plug, 10, 10, 5, 5, p.r('deep'), 0, 1);
  bs.add('plug', plug);
}

function bossVirus(b: Bestiary, p: Pal): void {
  pics(b, 'mite', ...wasp(keyOf(p, { main: 'gold', accent: 'cyan' })));
  mite(b, 'mite', [
    [3, 2, 5],
    [-5, 2, 5],
    [5, 3, 5],
    [-2, 10, 6],
  ]);
  const f0 = slicesOf(face(p, false), 2, 2);
  const f1 = slicesOf(face(p, true), 2, 2);
  const hurt = (q: Pixels) => tint(q, (c) => (p.r('gold').includes(c) ? p.c('red', 1 + (p.r('gold').indexOf(c) >> 1)) : c));
  for (let r = 0; r < 2; r++)
    for (let c = 0; c < 2; c++)
      weakPoint(b, `head${r}${c}`, r === 0 ? 6 : 9, (h) => (h <= 3 ? [hurt(f0[r][c]), hurt(f1[r][c])] : [f0[r][c], f1[r][c]]), { score: 1500, anim: 4 });
  armor(b, 'grilleArt', bar(p));
  // the grille bars: armor sliding two blocks each way
  b.add('grille', {
    power: POWER.armor,
    pics: [['grilleArt', 50]],
    path: [
      [2, 0, 2],
      [-4, 0, 2],
      [2, 0, 2],
    ],
  });
}

export function bossHowler(art: StageArt): Leg {
  const k = kit(
    art,
    (bs) => bossTiles(bs, art),
    (b) => bossVirus(b, art.pal),
    { mite: 'mite', turretEvery: 10, seekerEvery: 40, flakEvery: 28, hatchShut: 45, hatchOpen: 25, hatchEvery: 8 },
  );
  const g = arena(k.bs, k.beasts, art, 11);
  g.rect(1, 0, 14, 10, (c, d) => ((c * 5 + d) % 7 === 0 ? 'floor1' : (c + 2 * d) % 11 === 0 ? 'floor4' : 'floor0'));
  g.rect(1, 1, 14, 1, 'wall');
  g.rect(1, 0, 14, 1, 'plug');
  g.set(7, 1, 'floor0').set(8, 1, 'floor0').set(7, 0, 'gate0').set(8, 0, 'gate2');
  for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) g.mon(7 + c, 1 + r, `head${r}${c}`);
  g.link(7, 1).link(8, 1);
  for (const c of [2, 5, 8, 11]) g.mon(c, 4, 'grille');
  g.turret(3, 2, 'flak').turret(12, 2, 'flak');
  g.turret(1, 3, 'seeker').turret(14, 3, 'seeker');
  g.hatch(5, 2, false).hatch(10, 2, false);
  g.pickup(1, 8, 'repair').pickup(14, 8, 'nova').pickup(1, 7, 'nova');
  return {
    file: 's3c',
    kitFile: 'b3',
    title: 'The Feedback Howler',
    kind: 'boss',
    grid: g,
    kit: k,
    card: ['Its grille slides to the', 'beat. Fire through the gaps', 'and slip through after!'],
  };
}
