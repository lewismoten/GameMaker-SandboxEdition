// STICK MAN STARS' monsters. The kit's gumdrop 0, buzzer 1 and shelly 2 stay in the file (unused), then:
//   STAR      the gold star Stick Man throws: born from a frame of his Throw sequence (hero.ts), it flies
//             the way he last walked until it hits something or runs out of range. Power 200.
//   TWINKLE   the sparkle a star leaves
//   COTTAGE, TOWER, SHED   repo houses, dark and waiting for a star. The cottage sits still, the tower is
//             shy and paces up and down the street, the shed is solid (it can block a doorway)
//   BIG3, BIG2, BIG1       the Big Repo: a solid shed that takes three stars (three pips on its wall, then
//             two, then one)
//   CONF_*    the party: a burst of confetti for about a second after a pop, then the house lights up
//   LIT_*     the lit house, with a gold star on its flag and gold windows; power 250 so a star can't pop it
//             again, passable so a lit gate lets Stick Man walk on through
//   BOT       a spam bot: a rolling little fake-star farm that pops with one star and bumps (it hurts a little); it leaves a gray fake star that fades
// A pop is the engine's own collision rule (code/GM/PLAYGAME.C, DoCollision): the weaker monster dies and
// leaves its `newmon`, and the character is paid the dead monster's score; a star born from him is used up too.
import { SOLBOT, SOLLEF, SOLRIG, SOLTOP, type Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import type { Monster } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import { corner, mon, pace } from '@lewismoten/gamemaker-sandbox-tools/kit/actors';
import { outline } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { blob } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import type { Book } from '../../kit/starter/book';
import { buildMonsterBlocks, buildMonsters } from '../../kit/starter/monsters';
import type { Pal } from '../../kit/starter/palette';
import { sparkle } from '../../kit/starter/sparkle';
import { drawStar } from './starArt';

export const STAR = 3;
export const TWINKLE = 4;
export const COTTAGE = 5;
export const TOWER = 6;
export const SHED = 7;
export const BIG3 = 8;
export const BIG2 = 9;
export const BIG1 = 10;
export const CONF_COT = 11;
export const CONF_TOW = 12;
export const CONF_SHED = 13;
export const LIT_COT = 14;
export const LIT_TOW = 15;
export const LIT_SHED = 16;
export const BOT = 17;
export const TWINK = 18;
export const SHOOT = 19;
export const FAKE = 20;

export const HERO_HIT_POINTS = 50;
/** Pixels a star flies a tick, and how many ticks: the range is the product, about 6 blocks. */
export const STAR_SPEED = 4;
export const STAR_LIFE = 30;
/** Points: a house (each of a Big Repo's three stars too). A spam bot's star is fake and pays nothing. */
export const POP_SCORE = 50;
export const BOT_SCORE = 0;
/** How long the confetti flies before the house lights (ticks). */
const PARTY = 16;

const T = 255;
type Kind = 'cottage' | 'tower' | 'shed';
const px = (p: Pixels, x: number, y: number, w: number, h: number, c: number) => p.rect(x, y, w, h, c);

/** A five-point star, 5 by 5. */
function tinyStar(p: Pixels, x: number, y: number, c: number): void {
  const rows = ['..#..', '.###.', '#####', '.###.', '.#.#.'];
  rows.forEach((row, dy) => [...row].forEach((ch, dx) => ch === '#' && p.set(x + dx, y + dy, c)));
}

/** A tiny zero, 3 by 5 (the flag's star count before a star lands). */
function zero(p: Pixels, x: number, y: number, c: number): void {
  px(p, x, y, 3, 1, c);
  px(p, x, y + 4, 3, 1, c);
  px(p, x, y + 1, 1, 3, c);
  px(p, x + 2, y + 1, 1, 3, c);
}

/** A little repo house, `lit` or dark, in one of two frames, with `pips` star dots on the wall for the Big Repo. */
function house(pal: Pal, kind: Kind, lit: boolean, frame: 0 | 1, pips = 0): Pixels {
  const { c } = pal;
  const ink = c('ink', 0);
  const p = new Pixels(20, 20, T);
  const wall = kind === 'cottage' ? c('parch', 3) : kind === 'tower' ? c('stone', 3) : c('wood', 3);
  const wallShade = kind === 'cottage' ? c('parch', 2) : kind === 'tower' ? c('stone', 2) : c('wood', 2);
  const roof = kind === 'cottage' ? pal.r('red') : kind === 'tower' ? pal.r('blue') : pal.r('green');
  // the walls and the roof
  const [x0, x1, top] = kind === 'cottage' ? [3, 15, 9] : kind === 'tower' ? [5, 12, 6] : [2, 16, 10];
  px(p, x0, top, x1 - x0 + 1, 19 - top, wall);
  px(p, x1 - 1, top, 2, 19 - top, wallShade);
  const roofTop = kind === 'tower' ? 1 : kind === 'cottage' ? 3 : 6;
  for (let y = roofTop; y <= top; y++) {
    const t = (y - roofTop) / (top - roofTop + 1);
    const half = Math.round(((x1 - x0) / 2 + 2) * (kind === 'tower' ? t : 0.25 + 0.75 * t));
    const mid = (x0 + x1) / 2;
    px(p, Math.round(mid - half), y, half * 2 + 1, 1, roof[y % 2 ? 3 : 2]);
  }
  // the door
  const dx = Math.round((x0 + x1) / 2) - 1;
  px(p, dx, 14, 3, 5, c('wood', 1));
  p.set(dx + 2, 16, c('gold', 3));
  // the windows: eyes at a happy height; the shy houses blink on the second frame
  const wy = kind === 'tower' ? 8 : 11;
  const glass = lit ? c('gold', 4) : c('sky', 4);
  for (const wx of kind === 'tower' ? [7] : [x0 + 2, x1 - 3]) {
    if (!lit && frame === 1) px(p, wx, wy + 1, 2, 1, ink);
    else if (lit) px(p, wx - 1, wy - 1, 4, 4, glass).rect(wx, wy, 2, 2, c('white', 3));
    else px(p, wx, wy, 2, 2, glass);
  }
  if (lit)
    for (const [sx, sy] of [
      [x0 - 1, 6],
      [x1 + 2, 12],
    ] as const)
      p.set(sx, sy + frame * 2, c('white', 3));
  // the flag on a pole: gray with a 0 before a star, gold with a star after
  const poleX = kind === 'tower' ? 15 : 17;
  px(p, poleX, 1, 1, 9, ink);
  const flagX = poleX - 6;
  px(p, flagX, 1 + frame, 6, 7, lit ? c('gold', 3) : c('white', 2));
  if (lit) tinyStar(p, flagX, 2 + frame, c('ink', 0));
  else zero(p, flagX + 1, 2 + frame, c('ink', 1));
  // the Big Repo's pips: how many stars it still wants
  for (let i = 0; i < pips; i++) tinyStar(p, 4 + i * 5, 11, c('gold', 4));
  return outline(p, ink, { transparent: T });
}

/** A burst of confetti, two frames. */
function confetti(pal: Pal, frame: 0 | 1): Pixels {
  const { c } = pal;
  const p = new Pixels(20, 20, T);
  const colors = [c('red', 2), c('gold', 3), c('teal', 2), c('pink', 2), c('blue', 2), c('white', 3)];
  const dots: [number, number][] = [
    [3, 3],
    [9, 1],
    [15, 4],
    [6, 8],
    [13, 9],
    [2, 13],
    [10, 12],
    [17, 14],
    [5, 17],
    [14, 18],
    [8, 5],
    [18, 9],
  ];
  dots.forEach(([x, y], i) => px(p, x, (y + (frame ? 2 : 0)) % 20, 2, 1 + (i % 2), colors[i % colors.length]));
  return p;
}

/** A spam bot: a small gray rolling robot with an envelope on its front and a grin. */
function bot(pal: Pal, frame: 0 | 1): Pixels {
  const { c, r } = pal;
  const ink = c('ink', 0);
  const p = new Pixels(20, 20, T);
  blob(p, 10, 10, 8, 6.5, r('stone'), 0, 4);
  p.line(10, 3, 10, 0, ink);
  p.disc(10, frame ? 1 : 0, 1.5, c('red', 2));
  for (const x of [6, 12]) {
    p.disc(x + 1, 8, 2.2, c('white', 3));
    p.rect(x + 1, 7, 2, 3, ink);
  }
  px(p, 7, 15, 7, 4, c('white', 3));
  p.line(7, 15, 10, 17, c('ink', 1)).line(13, 15, 10, 17, c('ink', 1));
  for (const x of [4, 16]) p.disc(x, 17 - frame, 2.4, ink);
  return outline(p, ink, { transparent: T });
}

/** A fake star: the gold star turned dull gray, so it reads as not the real thing. */
function fakeStar(pal: Pal, turn: 0 | 1): Pixels {
  const gold = pal.r('gold');
  const gray = pal.r('stone');
  return drawStar(pal, turn).map((_x, _y, c) => {
    const k = gold.indexOf(c);
    return k < 0 ? c : gray[Math.min(gray.length - 1, Math.max(0, k - 1))];
  });
}

/** A twinkle in the night sky: a small bright plus (frame 0) that dims to a dot (frame 1). */
function twink(pal: Pal, frame: 0 | 1): Pixels {
  const p = new Pixels(20, 20, T);
  const w = pal.c('white', 3);
  if (frame === 0) {
    px(p, 9, 7, 2, 6, w);
    px(p, 7, 9, 6, 2, w);
    p.set(9, 9, pal.c('gold', 5)).set(10, 10, pal.c('gold', 5));
  } else px(p, 9, 9, 2, 2, pal.c('white', 1));
  return p;
}

/** A shooting star: a bright head with a long tail trailing up and to the left. */
function shooter(pal: Pal, frame: 0 | 1): Pixels {
  const p = new Pixels(20, 20, T);
  const w = pal.c('white', 3);
  for (let i = 0; i < 12; i++) {
    const c = i < 4 ? pal.c('white', 2) : i < 8 ? pal.c('white', 1) : pal.c('white', 0);
    px(p, 12 - i, 11 - Math.floor(i / 2) - (frame && i % 3 === 0 ? 1 : 0), 1, 1 + (i < 6 ? 1 : 0), c);
  }
  p.disc(14.5, 13, 2.4, pal.c('gold', 4));
  p.set(14, 12, w).set(15, 12, w);
  return p;
}

/** The monster pictures: the kit's, then the star's two turns, two sparkles, every house, the confetti and the bot. */
export function monsterPictures(pal: Pal): Book {
  const mb = buildMonsterBlocks(pal);
  mb.add('star0', drawStar(pal, 0), {});
  mb.add('star1', drawStar(pal, 1), {});
  mb.add('twinkle0', sparkle(pal, false), {});
  mb.add('twinkle1', sparkle(pal, true), {});
  const kinds: Kind[] = ['cottage', 'tower', 'shed'];
  for (const k of kinds) for (const f of [0, 1] as const) mb.add(`${k}${f}`, house(pal, k, false, f), {});
  for (const n of [3, 2, 1]) for (const f of [0, 1] as const) mb.add(`big${n}${f}`, house(pal, 'shed', false, f, n), {});
  for (const k of kinds) for (const f of [0, 1] as const) mb.add(`lit${k}${f}`, house(pal, k, true, f), {});
  for (const f of [0, 1] as const) mb.add(`confetti${f}`, confetti(pal, f), {});
  for (const f of [0, 1] as const) mb.add(`bot${f}`, bot(pal, f), {});
  for (const f of [0, 1] as const) mb.add(`fake${f}`, fakeStar(pal, f), {});
  for (const f of [0, 1] as const) mb.add(`twk${f}`, twink(pal, f), {});
  for (const f of [0, 1] as const) mb.add(`shoot${f}`, shooter(pal, f), {});
  return mb;
}

/** The finished .MBL: houses that can block a way are solid on every side, and the bot bumps like the kit's monsters (solid on three sides, hurts a little). */
export function finishMonsterPictures(mb: Book): Block[] {
  const blocks = mb.finish();
  for (const n of ['gumdrop0', 'gumdrop1', 'buzzer0', 'buzzer1', 'shelly0', 'shelly1']) {
    blocks[mb.n(n)].solid = 0;
    blocks[mb.n(n)].chHitPt = 0;
  }
  for (const n of ['shed', 'big3', 'big2', 'big1']) for (const f of [0, 1]) blocks[mb.n(`${n}${f}`)].solid = SOLBOT | SOLLEF | SOLRIG | SOLTOP;
  for (const f of [0, 1]) {
    blocks[mb.n(`bot${f}`)].solid = SOLBOT | SOLLEF | SOLRIG;
    blocks[mb.n(`bot${f}`)].chHitPt = -5;
  }
  return blocks;
}

/** The .MON: the kit's three, then everything above. */
export function monsterSet(mb: Book): Monster[] {
  const set = buildMonsters(mb);
  const anim = (name: string, t: number): [number, number][] => [
    [mb.n(`${name}0`), t],
    [mb.n(`${name}1`), t],
  ];
  set[STAR] = mon(anim('star', 2), { power: 200, thru: 1, towards: STAR_SPEED, end: STAR_LIFE, newmon: TWINKLE });
  set[TWINKLE] = mon(anim('twinkle', 3), { power: 150, thru: 1, end: 9 });
  const dark = { power: 150, thru: 1, upscore: POP_SCORE };
  set[COTTAGE] = mon(anim('cottage', 9), { ...dark, newmon: CONF_COT });
  // the shy tower slips back and forth along the street, slowly
  set[TOWER] = mon(anim('tower', 7), { ...dark, newmon: CONF_TOW }, [corner(0, 0, 1), corner(5, 0, 1), corner(0, 0, 1, 4)]);
  set[SHED] = mon(anim('shed', 9), { ...dark, newmon: CONF_SHED });
  set[BIG3] = mon(anim('big3', 9), { ...dark, newmon: BIG2 });
  set[BIG2] = mon(anim('big2', 9), { ...dark, newmon: BIG1 });
  set[BIG1] = mon(anim('big1', 9), { ...dark, newmon: CONF_SHED });
  const party = (newmon: number) => mon(anim('confetti', 4), { power: 250, thru: 1, end: PARTY, newmon });
  set[CONF_COT] = party(LIT_COT);
  set[CONF_TOW] = party(LIT_TOW);
  set[CONF_SHED] = party(LIT_SHED);
  const lit = (name: string) => mon(anim(name, 6), { power: 250, thru: 1 });
  set[LIT_COT] = lit('litcottage');
  set[LIT_TOW] = lit('littower');
  set[LIT_SHED] = lit('litshed');
  // a popped bot leaves a dull gray fake star that fades away (no points: fake stars are worth nothing)
  set[FAKE] = mon(anim('fake', 4), { power: 250, thru: 1, end: 18 });
  set[BOT] = mon(anim('bot', 4), { power: 150, thru: 1, newmon: FAKE, upscore: BOT_SCORE }, pace(5, 1));
  // the night sky's twinkles sit still and blink; a shooting star glides down the sky and back, for looks only
  set[TWINK] = mon(anim('twk', 9), { power: 250, thru: 1 });
  set[SHOOT] = mon(anim('shoot', 3), { power: 250, thru: 1 }, pace(14, 3, 4));
  return set;
}
