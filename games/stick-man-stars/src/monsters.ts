// STICK MAN STARS' monsters. The kit's gumdrop 0, buzzer 1 and shelly 2 stay in the file (unused), then:
//   STAR      the gold star Stick Man throws: born from a frame of his Throw sequence (hero.ts), it flies
//             the way he last walked until it hits something or runs out of range. Power 200.
//   TWINKLE   the sparkle a star leaves
//   COTTAGE, TOWER, SHED   repo houses, dark and waiting for a star, their windows for eyes. The cottage (red gable, chimney) sits still, the tower (stone, blue cap) is
//             shy and paces up and down the street, the shed is solid (it can block a doorway)
//   BIG3, BIG2, BIG1       the Big Repo: a solid shed that takes three stars (three dark lanterns under its eaves, lit
//             one by one)
//   CONF_*    the party: the house lights on impact, under a burst of confetti for about a second
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

/** The windows are the house's eyes: dark and blinking on the second frame, or gold and glowing when lit. */
function eyes(p: Pixels, pal: Pal, at: readonly (readonly [number, number])[], lit: boolean, frame: 0 | 1): void {
  const { c } = pal;
  for (const [wx, wy] of at) {
    if (lit)
      px(p, wx - 1, wy - 1, 4, 4, c('gold', 3))
        .rect(wx, wy, 2, 2, c('gold', 5))
        .set(wx, wy, c('white', 3));
    else if (frame === 1) px(p, wx, wy, 2, 2, c('ink', 1)).rect(wx, wy + 1, 2, 1, c('ink', 0));
    else px(p, wx, wy, 2, 2, c('sky', 1)).set(wx, wy, c('sky', 4));
  }
}

/** A door with a gold knob (the door is the house's mouth, so it sits under the eyes). */
function door(p: Pixels, pal: Pal, x: number, y: number, w: number, lit: boolean): void {
  const { c } = pal;
  px(p, x, y, w, 19 - y, c('wood', 1));
  px(p, x, y, w, 1, c('wood', 0));
  if (lit) px(p, x + 1, y + 1, w - 2, 1, c('gold', 2));
  p.set(x + w - 1, y + 3, c('gold', 4));
}

/** The flag on a pole: gray with a 0 before a star, gold with a star after. */
function flag(p: Pixels, pal: Pal, poleX: number, lit: boolean, frame: 0 | 1): void {
  const { c } = pal;
  px(p, poleX, 1, 1, 9, c('ink', 0));
  const flagX = poleX - 6;
  px(p, flagX, 1 + frame, 6, 7, lit ? c('gold', 3) : c('white', 2));
  px(p, flagX, 7 + frame, 6, 1, lit ? c('gold', 1) : c('stone', 2));
  if (lit) tinyStar(p, flagX, 2 + frame, c('ink', 0));
  else zero(p, flagX + 1, 2 + frame, c('ink', 1));
}

/** A shingled gable roof from an apex down to the eaves, lit from the left. */
function gable(p: Pixels, ramp: number[], apexX: number, top: number, eave: number, left: number, right: number): void {
  for (let y = top; y <= eave; y++) {
    const t = (y - top) / Math.max(1, eave - top);
    const l = Math.round(apexX - (apexX - left) * t);
    const r = Math.round(apexX + (right - apexX) * t);
    const shade = y === eave ? 1 : (y - top) % 2 ? 3 : 2;
    px(p, l, y, r - l + 1, 1, ramp[shade]);
    p.set(l, y, ramp[Math.min(ramp.length - 1, shade + 1)]);
    p.set(r, y, ramp[0]);
  }
}

/** The cottage: a plaster box with a red shingled gable, a brick chimney, window boxes and a front door. */
function cottage(p: Pixels, pal: Pal, lit: boolean, frame: 0 | 1): void {
  const { c, r } = pal;
  px(p, 3, 3, 2, 5, c('brick', 2)).rect(3, 3, 2, 1, c('brick', 4));
  px(p, 2, 10, 11, 9, c('parch', 3));
  px(p, 11, 10, 2, 9, c('parch', 2));
  px(p, 2, 10, 11, 1, c('parch', 1));
  gable(p, r('red'), 7, 3, 9, 0, 14);
  eyes(
    p,
    pal,
    [
      [3, 12],
      [10, 12],
    ],
    lit,
    frame,
  );
  for (const x of [2, 9]) px(p, x, 14, 4, 1, c('green', 2));
  door(p, pal, 6, 14, 3, lit);
}

/** The shy tower: tall and narrow, stone courses, a pointed blue cap and one round window peeking out. */
function tower(p: Pixels, pal: Pal, lit: boolean, frame: 0 | 1): void {
  const { c, r } = pal;
  px(p, 4, 8, 7, 11, c('stone', 3));
  px(p, 9, 8, 2, 11, c('stone', 2));
  for (let y = 10; y < 19; y += 3) {
    px(p, 4, y, 7, 1, c('stone', 2));
    p.set(y % 2 ? 6 : 8, y + 1, c('stone', 2));
  }
  const blue = r('blue');
  for (let y = 1; y <= 7; y++) {
    const half = Math.round(((y - 1) / 6) * 4);
    for (let x = 7 - half; x <= 7 + half; x++) p.set(x, y, blue[x < 7 ? 4 - Math.min(2, (7 - x) >> 1) : x === 7 ? 3 : x > 9 ? 1 : 2]);
  }
  px(p, 2, 7, 11, 1, blue[0]);
  // the round window, glancing aside on the second frame (shy)
  if (lit) px(p, 5, 9, 4, 4, c('gold', 3)).rect(6, 10, 2, 2, c('gold', 5)).set(6, 10, c('white', 3));
  else px(p, 6, 10, 2, 2, c('sky', 1)).set(6 + frame, 10, c('sky', 4));
  door(p, pal, 6, 15, 3, lit);
  p.set(6, 15, c('stone', 3)).set(8, 15, c('stone', 2));
}

/** The shed: a low plank box under a sloping green roof. The Big Repo is the same shed with three lanterns under its eaves. */
function shed(p: Pixels, pal: Pal, lit: boolean, frame: 0 | 1, lanterns: number, litLanterns: number): void {
  const { c, r } = pal;
  px(p, 2, 8, 16, 11, c('wood', 3));
  px(p, 16, 8, 2, 11, c('wood', 2));
  for (const x of [5, 13]) px(p, x, 10, 1, 9, c('wood', 2));
  const green = r('green');
  for (let x = 1; x <= 18; x++) {
    const y = 6 + Math.floor(((x - 1) * 3) / 17);
    p.set(x, y, green[4])
      .set(x, y + 1, green[2])
      .set(x, y + 2, green[1]);
    if (x % 3 === 0) p.set(x, y + 1, green[3]);
  }
  const low = lanterns > 0 ? 1 : 0;
  eyes(
    p,
    pal,
    [
      [3, 14 + low],
      [14, 14 + low],
    ],
    lit,
    frame,
  );
  door(p, pal, 8, 13 + low * 2, 4, lit);
  px(p, 8, 16 + low, 4, 1, c('wood', 0));
  for (let i = 0; i < lanterns; i++) {
    const x = [2, 8, 15][i];
    const on = lit || i < litLanterns;
    const top = 6 + Math.floor(((x - 1) * 3) / 17) + 3;
    px(p, x + 1, top, 1, 10 - top + 1, c('ink', 0));
    px(p, x, 11, 3, 1, c('ink', 0));
    px(p, x, 12, 3, 2, on ? c('gold', 4) : c('stone', 1));
    p.set(x + 1, 12, on ? (frame ? c('gold', 5) : c('white', 3)) : c('stone', 2));
    p.set(x + 1, 14, c('ink', 0));
  }
}

/** A little repo house, `lit` or dark, in one of two frames. The Big Repo (`lanterns` 3) shows how many of its lanterns are lit. */
function house(pal: Pal, kind: Kind, lit: boolean, frame: 0 | 1, lanterns = 0, litLanterns = 0): Pixels {
  const ink = pal.c('ink', 0);
  const p = new Pixels(20, 20, T);
  if (kind === 'cottage') cottage(p, pal, lit, frame);
  else if (kind === 'tower') tower(p, pal, lit, frame);
  else shed(p, pal, lit, frame, lit ? 3 : lanterns, litLanterns);
  flag(p, pal, 18, lit, frame);
  if (lit)
    for (const [sx, sy] of [
      [0, 5],
      [19, 13],
    ] as const)
      p.set(sx, sy + frame * 2, pal.c('white', 3));
  return outline(p, ink, { transparent: T });
}

/** A burst of confetti, two frames. */
function confetti(pal: Pal, kind: Kind, frame: 0 | 1): Pixels {
  const { c } = pal;
  const p = house(pal, kind, true, frame);
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

/** A twinkle in the night sky: a small bright diamond with a gold heart (frame 0) that dims to a dot (frame 1). */
function twink(pal: Pal, frame: 0 | 1): Pixels {
  const p = new Pixels(20, 20, T);
  if (frame === 0) {
    for (let dy = -2; dy <= 2; dy++) px(p, 10 - (2 - Math.abs(dy)), 10 + dy, 1 + 2 * (2 - Math.abs(dy)), 1, pal.c('white', 2));
    p.set(10, 10, pal.c('gold', 5)).set(10, 9, pal.c('white', 3));
  } else px(p, 10, 10, 1, 1, pal.c('white', 1));
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
  for (const n of [3, 2, 1]) for (const f of [0, 1] as const) mb.add(`big${n}${f}`, house(pal, 'shed', false, f, 3, 3 - n), {});
  for (const k of kinds) for (const f of [0, 1] as const) mb.add(`lit${k}${f}`, house(pal, k, true, f), {});
  for (const k of kinds) for (const f of [0, 1] as const) mb.add(`confetti${k}${f}`, confetti(pal, k, f), {});
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
  set[TOWER] = mon(anim('tower', 7), { ...dark, newmon: CONF_TOW }, [corner(0, 0, 2), corner(5, 0, 2), corner(0, 0, 2, 4)]);
  set[SHED] = mon(anim('shed', 9), { ...dark, newmon: CONF_SHED });
  set[BIG3] = mon(anim('big3', 9), { ...dark, newmon: BIG2 });
  set[BIG2] = mon(anim('big2', 9), { ...dark, newmon: BIG1 });
  set[BIG1] = mon(anim('big1', 9), { ...dark, newmon: CONF_SHED });
  const party = (kind: Kind, newmon: number) => mon(anim(`confetti${kind}`, 4), { power: 250, thru: 1, end: PARTY, newmon });
  set[CONF_COT] = party('cottage', LIT_COT);
  set[CONF_TOW] = party('tower', LIT_TOW);
  set[CONF_SHED] = party('shed', LIT_SHED);
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
