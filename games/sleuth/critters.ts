// Who (and what) moves about the Paragon (PARAGON.MON / PARAGON.MBL): Sergeant Dobbs in
// the lobby, Macbeth the theatre cat, sandbags on the fly lines, and at 2 AM the night
// watchman on his rounds, wisps from the ghost light and rats under the stage, which in the
// dark are nothing but two red eyes.
import { emptyMonster, type Monster } from '../../web/src/formats/monster';
import { Pixels } from '../kit/pixels';
import { BlockSet, SOLID } from './blockset';
import { CLEAR, art, blob } from './draw';
import { c, ramp as r } from './pal';

const K: Record<string, number> = {
  o: c('black', 0),
  n: c('navy', 1),
  N: c('navy', 3),
  b: c('gold', 4),
  k: c('skin', 4),
  K: c('skin', 2),
  e: c('black', 0),
  m: c('grey', 5),
  g: c('grey', 3),
  G: c('grey', 1),
  t: c('tan', 2),
  w: c('ghost', 3),
  W: c('ghost', 1),
  y: c('glow', 4),
  Y: c('glow', 2),
  E: c('eyes', 0),
  F: c('eyes', 1),
  s: c('tan', 3),
  S: c('tan', 1),
  c: c('black', 1),
  C: c('black', 2),
  q: c('teal', 3),
  p: c('velvet', 5),
};
const pic = (rows: string[]) => art(new Pixels(20, 20, CLEAR), 0, 0, rows, K);

const DOBBS_HEAD = [
  '......oooooooo......',
  '.....onnnnnnnno.....',
  '....onnnnbnnnnno....',
  '...ooooooooooooo....',
  '....okkkkkkkkko.....',
  '....okkekkkekko.....',
  '....oKkkkkkkkKo.....',
  '....okmmmmmmmko.....',
  '.....okkkkkkko......',
];
const DOBBS_BODY = [
  '....onnnnnnnnnno....',
  '...onnnbnnnnbnnno...',
  '...onNnnnnnnnnNno...',
  '...onNnnbnnnnnNno...',
  '...onnnnnnnnnnnno...',
  '....onnnnbnnnnno....',
  '....onnnnnnnnnno....',
  '.....onno..onno.....',
  '.....onno..onno.....',
  '.....oooo..oooo.....',
  '....................',
];

const CAT = (step: number) =>
  pic([
    '....................',
    '....................',
    '....................',
    '....................',
    '..o.o...............',
    '.oCoCo..............',
    '.ocqcqo.............',
    '.occpcco......oo....',
    '..occcco.....oco....',
    '...occcooooooocCo...',
    '...occcccccccccco...',
    '...occcCcccccCcco...',
    '....occccccccccco...',
    step ? '....oco.oco.oco.oco.' : '....ocooco..ocooco..',
    step ? '....oo..oo..oo..oo..' : '....oooooo..oooooo..',
    '....................',
    '....................',
    '....................',
    '....................',
    '....................',
  ]);

const WATCH = (step: number) =>
  pic([
    '......oooooooo......',
    '.....oGGGGGGGGo.....',
    '....oGGGGGGGGGGo....',
    '...ooooooooooooo....',
    '....okkkkkkkkko.....',
    '....okkekkkekko.....',
    '....oKmmkkkmmKo.....',
    '.....ommmmmmmo......',
    '....ogggggggggo.....',
    '...oggGgggggGggoYo..',
    '...ogGgggggggGgoyyo.',
    '...ogGgggggggGgoyyo.',
    '...ogggggggggggoYYo.',
    '...ogGgggggggGgoo...',
    '....ogggggggggo.....',
    '....ogggggggggo.....',
    step ? '....onno...onno.....' : '.....onno.onno......',
    step ? '...onno.....onno....' : '.....onno.onno......',
    step ? '...oooo.....oooo....' : '.....oooo.oooo......',
    '....................',
  ]);

function wisp(phase: number): Pixels {
  const p = new Pixels(20, 20, CLEAR);
  blob(p, 10, 8 + phase, 6, 6, r('ghost'), 0, 3, 0.8);
  for (let y = 13 + phase; y < 19; y++)
    for (let x = 4; x < 16; x++) if ((x + y + phase) % 3 === 0 && y - 13 - phase < 4 + Math.sin(x) * 2) p.set(x, y, c('ghost', 1));
  p.rect(7, 7 + phase, 2, 3, c('navy', 0)).rect(11, 7 + phase, 2, 3, c('navy', 0));
  p.rect(9, 11 + phase, 2, 2, c('navy', 1));
  return p;
}

function sandbag(): Pixels {
  const p = new Pixels(20, 20, CLEAR);
  p.rect(9, 0, 2, 6, c('tan', 3));
  blob(p, 10, 12, 7, 7, r('tan'), 0, 3);
  p.rect(7, 6, 6, 2, c('tan', 0));
  return p;
}

function rat(step: number, lit: boolean): Pixels {
  const p = new Pixels(20, 20, CLEAR);
  if (lit) {
    blob(p, 10, 12, 6, 4, r('grey'), 0, 2);
    p.rect(3, 13, 2, 1, c('grey', 1)).rect(1, 12 + step, 2, 1, c('grey', 1));
    p.set(15, 10, c('skin', 3)).set(16, 13, c('skin', 4));
  }
  p.set(13, 10, c('eyes', 1)).set(14, 10, c('eyes', 0)).set(15, 11, c('eyes', 1)).set(16, 11, c('eyes', 0));
  if (step) p.set(14, 11, c('eyes', 0));
  return p;
}

export const MON = { dobbs: 0, cat: 1, sandbag: 2, wisp: 3, watchman: 4, rat: 5, wispWander: 6 } as const;
export const MON_NAMES = ['dobbs', 'cat', 'sandbag', 'wisp', 'watchman', 'rat', 'wispWander'];

export function buildCritters(): { mb: BlockSet; mon: Monster[] } {
  const mb = new BlockSet(100, true);
  mb.add('dobbs0', pic([...DOBBS_HEAD, ...DOBBS_BODY]), { solid: SOLID });
  mb.add('dobbs1', pic([...DOBBS_HEAD.slice(0, 5), '....okkokkkokko.....', ...DOBBS_HEAD.slice(6), ...DOBBS_BODY]), { solid: SOLID });
  mb.add('cat0', CAT(0));
  mb.add('cat1', CAT(1));
  mb.add('sandbag', sandbag(), { score: -5 });
  for (let i = 0; i < 3; i++) mb.add(`wisp${i}`, wisp(i), { score: -25 });
  mb.add('watch0', WATCH(0), { solid: SOLID, score: -2 });
  mb.add('watch1', WATCH(1), { solid: SOLID, score: -2 });
  mb.add('rat0', rat(0, false), { score: -10 });
  mb.add('rat1', rat(1, false), { score: -10 });

  const mons: Monster[] = [];
  const id = (n: string) => mb.id(n);
  const make = (o: Partial<Monster>, pics: [string, number][]): Monster => {
    const m = emptyMonster();
    m.used = 1;
    Object.assign(m, o);
    pics.forEach(([n, t], i) => (m.pic[i] = [id(n), t]));
    return m;
  };
  mons[MON.dobbs] = make({ power: 100, end: -2 }, [
    ['dobbs0', 50],
    ['dobbs1', 4],
    ['dobbs0', 30],
    ['dobbs1', 3],
  ]);
  // Macbeth the cat wanders at random (towards >= 64: random, speed 1)
  mons[MON.cat] = make({ power: 100, end: -2, towards: 64, thru: 1 }, [
    ['cat0', 4],
    ['cat1', 4],
  ]);
  const bag = make({ power: 100, end: -2, thru: 0 }, [['sandbag', 100]]);
  bag.march[0][0] = { x: 0, y: 3, pic: 2, orient: 0 };
  bag.march[0][1] = { x: 0, y: 0, pic: 3, orient: 0 };
  mons[MON.sandbag] = bag;
  // Wisps from the ghost light: drift at random, fade after a while, vanish when touched.
  mons[MON.wisp] = make({ power: 50, end: 360, towards: 64, thru: 0 }, [
    ['wisp0', 3],
    ['wisp1', 3],
    ['wisp2', 3],
    ['wisp1', 3],
  ]);
  mons[MON.wispWander] = make({ power: 50, end: 0, towards: 64, thru: 0 }, [
    ['wisp0', 4],
    ['wisp1', 4],
    ['wisp2', 4],
    ['wisp1', 4],
  ]);
  // The night watchman walks the corridor and back with his lantern.
  const watch = make({ power: 100, end: -2, thru: 0 }, [
    ['watch0', 5],
    ['watch1', 5],
  ]);
  watch.march[0][0] = { x: 41, y: 0, pic: 2, orient: 0 };
  watch.march[0][1] = { x: 0, y: 0, pic: 2, orient: 4 };
  mons[MON.watchman] = watch;
  // Rats creep toward Ada, slowly, and give up after a while.
  mons[MON.rat] = make({ power: 10, end: 500, towards: 1, thru: 1 }, [
    ['rat0', 6],
    ['rat1', 2],
  ]);
  for (let i = 0; i < 64; i++) if (!mons[i]) mons[i] = emptyMonster();
  return { mb, mon: mons };
}
