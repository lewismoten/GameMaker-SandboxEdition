// TAKE THE WHEEL's kart: a second character file (KART.CHR). Level 2's scene names it in the character
// slot, so the same Kit is now a driver. The pictures are Kit's head over a little blue go-kart; the file
// is made like Kit's, with these differences:
//   Left / Right   drive, 8 pixels a frame (Kit walks at 4), the wheels turning
//   Space          honk: a frame of the sequence gives birth to the HONK ripple (monster 3). A kart
//                  has no jump sequence, so Space does not push it upward.
//   no Up / Down   nothing to climb, so those keys do nothing
import { MONBL } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { INF_REPEAT, emptyFrame, newCharacter, type Character, type Frame } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import { outline } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { set } from '@lewismoten/gamemaker-sandbox-tools/kit/actors';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { blob } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { Book } from '../../kit/starter/book';
import { KEYS } from '../../kit/starter/blocks';
import { KEY, SEQ, SND } from '../../kit/starter/ids';
import type { Pal } from '../../kit/starter/palette';
import { HERO_HIT_POINTS, HONK } from './monsters';

/** Pixels a frame while driving (Kit on foot: 4). */
export const KART_STEP = 8;
/** The honk's own sound number (the kit uses 0 to 12). */
export const SND_HONK = 13;
/** Both blocks flipped left to right. */
const MIRROR_BOTH = 0x44;
const T = 255;

/** The kart under Kit: `turn` rotates the spokes of the wheels. Right-facing; the engine mirrors it for left. */
function kartBody(pal: Pal, hero: Book | undefined, turn: boolean, seatOnly = false): Pixels {
  const { c, r } = pal;
  const ink = c('ink', 0);
  const p = new Pixels(20, 20, T);
  if (hero && !seatOnly) {
    // Kit's shoulders and arms, from the hero's own body picture (down to the waist), then the kart over his lap
    p.blit(hero.pics.get('stand')!.crop(0, 0, 20, 20), 0, 0, T);
    for (let y = 9; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, T);
  }
  const body = new Pixels(20, 20, T);
  blob(body, 10, 12.5, 9.6, 3.4, r('blue'), 1, 4);
  body.rect(1, 11, 18, 2, c('white', 3)).rect(1, 12, 18, 1, c('gold', 4)); // a stripe along the side
  body.rect(16, 9, 3, 4, c('blue', 3)); // the nose
  body.rect(18, 11, 2, 2, c('gold', 5)); // the headlamp
  body.rect(0, 11, 2, 2, c('red', 2)); // the tail lamp
  body.line(13, 6, 13, 9, c('stone', 3)); // the steering post
  body.rect(12, 5, 3, 1, c('stone', 1));
  const kart = outline(body, ink, { transparent: T });
  p.blit(kart, 0, 0, T);
  // the wheels: ink tyres, a pale hub, and spokes that turn
  for (const x of [4.5, 15.5]) {
    p.disc(x, 15.5, 3.6, ink).disc(x, 15.5, 2.4, c('stone', 3)).disc(x, 15.5, 0.9, c('stone', 1));
    if (turn) p.line(x - 2, 14, x + 2, 17, c('stone', 1)).line(x + 2, 14, x - 2, 17, c('stone', 1));
    else p.line(x - 2, 15, x + 2, 16, c('stone', 1)).line(x, 13, x, 18, c('stone', 1));
  }
  return p;
}

/** The kart's character blocks (.CBL), reusing Kit's heads. */
export function buildKartBlocks(pal: Pal, hero: Book): Book {
  const book = new Book('cbl');
  for (const head of ['stand.top', 'blink.top', 'cheer.top', 'hurt.top']) book.add(head, hero.pics.get(head)!);
  book.add('kart0', kartBody(pal, hero, false));
  book.add('kart1', kartBody(pal, hero, true));
  return book;
}

/** The empty kart, parked, as two map blocks (a pennant over it, the seat empty): the exit of level 1. */
export function parkedKart(pal: Pal): { top: Pixels; bottom: Pixels } {
  const sky = pal.c('sky', 3);
  const top = new Pixels(20, 20, sky);
  const bottom = new Pixels(20, 20, sky);
  const empty = kartBody(pal, undefined, false, true);
  bottom.blit(empty, 0, 0, T);
  // a gold pennant on a pole over the seat, so the kart reads as the way on
  top.rect(9, 6, 1, 14, pal.c('ink', 0)).rect(10, 6, 7, 5, pal.c('gold', 4)).frame(10, 6, 7, 5, pal.c('ink', 0));
  top.rect(10, 7, 6, 1, pal.c('gold', 5));
  return { top, bottom };
}

/** KART.CHR, using the pictures in `cb` (buildKartBlocks). */
export function buildKart(cb: Book): Character {
  const ch = newCharacter();
  const S = ch.sequences;
  const f = (top: string, bottom: string, o: { x?: number; pause?: number; mirror?: boolean } = {}): Frame => ({
    ...emptyFrame(),
    x: o.x ?? 0,
    y: 0,
    pic1: cb.n(top),
    pic2: cb.n(bottom),
    pause: o.pause ?? 1,
    orient: o.mirror ? MIRROR_BOTH : 0,
  });
  set(S[SEQ.idle], [f('stand.top', 'kart0', { pause: 40 }), f('blink.top', 'kart0', { pause: 3 }), f('stand.top', 'kart0', { pause: 24 })]);
  set(S[SEQ.die], [f('hurt.top', 'kart0', { pause: 10 }), f('hurt.top', 'kart0', { pause: 24 })], { sound: SND.die, jstkBut: 0 });
  set(S[SEQ.hurt], [f('hurt.top', 'kart0', { pause: 2 }), f('stand.top', 'kart0'), f('hurt.top', 'kart0', { pause: 2 })], { sound: SND.hurt, jstkBut: 0 });
  set(S[3], [f('stand.top', 'kart0')], { key: 0 });
  set(S[4], [f('stand.top', 'kart0')], { key: 0 });
  const drive = (dx: number, mirror: boolean) => [0, 1, 0, 1].map((i) => f('stand.top', `kart${i}`, { x: dx, mirror }));
  set(S[SEQ.right], drive(KART_STEP, false), { key: KEY.right, jstkMov: 3 });
  set(S[SEQ.left], drive(-KART_STEP, true), { key: KEY.left, jstkMov: 7 });
  set(S[SEQ.rightD], drive(KART_STEP, false), { key: KEY.d });
  set(S[SEQ.leftA], drive(-KART_STEP, true), { key: KEY.a });
  // Space: Kit squeezes the horn; the middle frame gives birth to the ripple (a frame whose second
  // picture is MONBL births monster "first picture", the way every Game-Maker hero shoots)
  const birth = { ...emptyFrame(), x: 0, y: 20, pic1: HONK, pic2: MONBL, pause: 0 };
  set(S[SEQ.throw], [f('cheer.top', 'kart1', { pause: 3 }), birth, f('cheer.top', 'kart0', { pause: 8 })], {
    key: KEY.space,
    sound: SND_HONK,
    norepeat: 1,
    ground: 1,
    jstkMov: 9,
    jstkBut: 1,
  });
  ch.meter.fill(INF_REPEAT);
  ch.meter[0] = HERO_HIT_POINTS; // hit points (nothing here takes any)
  ch.meter[1] = 3; // lives
  ch.meter[KEYS] = 1;
  ch.cseq = 0;
  ch.cframe = 0;
  return ch;
}
