// The Starters' three friendly monsters, one block each, two frames apiece, facing right (a
// monster walking left is the same picture mirrored by its path):
//   gumdrop  a purple blob that waddles along the ground
//   buzzer   a bee that bobs up and down in the air
//   shelly   a snail that creeps along slowly
// They hurt a little when you touch them (their power), so a level can ask you to go around
// or over them. buildMonsterBlocks() is the .MBL (the pictures), buildMonsters() the .MON file
// (what each one does): in the editor, the Monsters tab.
import { newMonsterSet, type Monster } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import { SOLBOT, SOLLEF, SOLRIG } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { corner, mon, pace } from '@lewismoten/gamemaker-sandbox-tools/kit/actors';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { blob } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { outline } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { Book } from './book';
import { MON } from './ids';
import type { Pal } from './palette';

const T = 255;

function eye(p: Pixels, pal: Pal, x: number, y: number, size = 2): void {
  const { c } = pal;
  p.disc(x, y, size + 0.6, c('white', 3));
  p.rect(x, y - 1, 2, 3, c('ink', 0)).set(x + 1, y - 1, c('white', 3));
}

function gumdrop(pal: Pal, tall: boolean): Pixels {
  const { c, r } = pal;
  const p = new Pixels(20, 20, T);
  if (tall) blob(p, 10, 11, 6.8, 8, r('purple'), 0, 4);
  else blob(p, 10, 13, 8.6, 6.2, r('purple'), 0, 4);
  const y = tall ? 9 : 11;
  eye(p, pal, 7, y);
  eye(p, pal, 12, y);
  p.set(8, y + 4, c('ink', 0))
    .set(9, y + 5, c('ink', 0))
    .set(10, y + 5, c('ink', 0))
    .set(11, y + 4, c('ink', 0));
  p.set(5, y + 3, c('pink', 2)).set(14, y + 3, c('pink', 2));
  p.set(6, tall ? 5 : 8, c('purple', 4)).set(7, tall ? 4 : 7, c('purple', 4));
  return outline(p, c('ink', 0), { transparent: T });
}

function buzzer(pal: Pal, wingsUp: boolean): Pixels {
  const { c, r } = pal;
  const p = new Pixels(20, 20, T);
  const wy = wingsUp ? 3 : 7;
  blob(p, 7, wy + 2, 3.4, 4.2, r('white'), 1, 3);
  blob(p, 12, wy + 2, 3.4, 4.2, r('white'), 1, 3);
  blob(p, 10, 12, 7.6, 5.4, r('gold'), 0, 5);
  for (const x of [7, 11]) p.rect(x, 8, 2, 9, c('ink', 0));
  p.rect(16, 11, 3, 2, c('ink', 0)).set(19, 12, c('ink', 0));
  eye(p, pal, 14, 10, 1.4);
  p.set(15, 14, c('ink', 0)).set(16, 14, c('ink', 0));
  p.line(15, 7, 17, 4, c('ink', 1)).set(17, 3, c('ink', 1));
  return outline(p, c('ink', 0), { transparent: T });
}

function shelly(pal: Pal, wiggle: boolean): Pixels {
  const { c, r } = pal;
  const p = new Pixels(20, 20, T);
  blob(p, 10, 16.5, 9, 3.2, r('orange'), 1, 4);
  blob(p, 15.5, 11, 2.6, 5.2, r('orange'), 1, 4);
  const stalk = wiggle ? 1 : 0;
  p.line(15, 7, 15 - stalk, 3, c('orange', 2)).line(17, 7, 18 + stalk, 3, c('orange', 2));
  eye(p, pal, 15 - stalk, 3, 1.2);
  eye(p, pal, 18 + stalk, 3, 1.2);
  blob(p, 8, 10, 6.6, 6.6, r('wood'), 0, 4);
  p.ring(8, 10, 4, c('pink', 2)).ring(8, 10, 2, c('pink', 2)).set(8, 10, c('pink', 3));
  p.set(17, 12, c('ink', 0)).set(16, 13, c('ink', 0)).set(15, 13, c('ink', 0));
  return outline(p, c('ink', 0), { transparent: T });
}

/** The monsters' pictures (.MBL). */
export function buildMonsterBlocks(pal: Pal): Book {
  const book = new Book('mbl');
  // (a monster block's own rules are what it does to the hero: it is solid on three sides and hurts)
  const rules = { solid: SOLBOT | SOLLEF | SOLRIG, hp: -5 };
  book.add('gumdrop0', gumdrop(pal, false), rules);
  book.add('gumdrop1', gumdrop(pal, true), rules);
  book.add('buzzer0', buzzer(pal, true), rules);
  book.add('buzzer1', buzzer(pal, false), rules);
  book.add('shelly0', shelly(pal, false), rules);
  book.add('shelly1', shelly(pal, true), rules);
  return book;
}

/** What each monster does (.MON). `run` is how many blocks a walker goes before it turns. */
export function buildMonsters(mb: Book, o: { gumdrop?: number; buzzer?: number; shelly?: number } = {}): Monster[] {
  const set = newMonsterSet();
  const anim = (name: string, t: number): [number, number][] => [
    [mb.n(`${name}0`), t],
    [mb.n(`${name}1`), t],
  ];
  set[MON.gumdrop] = mon(anim('gumdrop', 4), { power: 150, thru: 1 }, pace(o.gumdrop ?? 4, 2));
  set[MON.buzzer] = mon(anim('buzzer', 2), { power: 150, thru: 0 }, [corner(0, 0, 2), corner(0, o.buzzer ?? 3, 2), corner(0, 0, 2)]);
  set[MON.shelly] = mon(anim('shelly', 6), { power: 150, thru: 1 }, pace(o.shelly ?? 3, 1));
  return set;
}
