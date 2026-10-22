// CHEZ.CHR: driving THE CHEZ across the Dawdle Flats. The arrows (or W/A/S/D) drive at a
// brisk five pixels a tick; Space squeezes the horn, and its "ah-OOO-gah" flies ahead like a
// kazoo note and clears crabs and gulls out of the road. Hit points are the charge.
import { DIESEQ, HURTSEQ, newCharacter, type Character } from '../../../../web/src/formats/character';
import { MON, SND } from '../ids';
import type { SpriteSheet } from '../sprites/sheet';
import { KEY, frames } from './pip';

const MIRROR = 0x40;
const MONBL = 100;
const CHARBL = 50;
export const DRIVE = 5;

export function buildChez(cb: SpriteSheet): Character {
  const ch = newCharacter();
  const n = (s: string) => cb.n(s);
  const s = ch.sequences;
  const set = (i: number, list: Parameters<typeof frames>[0], o: Partial<(typeof s)[0]> = {}) => {
    s[i].frames = frames(list);
    Object.assign(s[i], o);
  };
  set(0, [
    { pic: n('carSide0'), pause: 6 },
    { pic: n('carSide1'), pause: 6 },
  ]);
  set(
    DIESEQ,
    [
      { pic: n('carHurt'), pause: 3 },
      { pic: n('carFlat'), pause: 30 },
    ],
    { sound: SND.die },
  );
  set(
    HURTSEQ,
    [
      { pic: n('carHurt'), pause: 1 },
      { pic: CHARBL, pause: 1 },
      { pic: n('carHurt'), pause: 1 },
    ],
    { sound: SND.hurt },
  );
  const drive = (i: number, key: number, joy: number, dx: number, dy: number, pics: string[], orient = 0) =>
    set(
      i,
      pics.map((p) => ({ pic: n(p), x: dx, y: dy, orient })),
      { key, jstkMov: joy },
    );
  const SIDE = ['carSide0', 'carSide1'];
  drive(5, KEY.up, 1, 0, -DRIVE, ['carRear0', 'carRear1']);
  drive(6, KEY.down, 5, 0, DRIVE, ['carFront0', 'carFront1']);
  drive(7, KEY.left, 7, -DRIVE, 0, SIDE, MIRROR);
  drive(8, KEY.right, 3, DRIVE, 0, SIDE);
  drive(9, KEY.w, 0, 0, -DRIVE, ['carRear0', 'carRear1']);
  drive(10, KEY.a, 0, -DRIVE, 0, SIDE, MIRROR);
  drive(11, KEY.s, 0, 0, DRIVE, ['carFront0', 'carFront1']);
  drive(12, KEY.d, 0, DRIVE, 0, SIDE);
  // the horn lives at sequence 17, a counter Pip never uses (his own 13 is the steel sword)
  set(
    17,
    [
      { pic: n('carSide1'), pause: 1 },
      { pic: 0, pic1: MON.note, pic2: MONBL, y: 20, pause: 0 },
      { pic: n('carSide0'), pause: 6 },
    ],
    { key: KEY.space, sound: SND.honk, norepeat: 1, ground: 1, jstkMov: 9, jstkBut: 1 },
  );
  ch.meter[0] = 100;
  ch.meter[1] = 3;
  ch.meter[3] = 1;
  return ch;
}
