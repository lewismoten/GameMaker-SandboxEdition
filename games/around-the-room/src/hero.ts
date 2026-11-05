// The hero of the four rooms: Kit's slim pose (one 20x20 block, kit/starter/kitSlim.ts), turned with the room so his
// feet are always on the surface. One character file a room, and what it changes is only which key walks him
// forward and which way Space pushes: arrows always mean the way they point on the screen.
//
//   room 0 floor:      Left walks forward, Right back, Space pushes up
//   room 1 left wall:  Up walks forward,   Down back,  Space pushes right (away from the wall)
//   room 2 ceiling:    Right walks forward, Left back, Space pushes down
//   room 3 right wall: Down walks forward, Up back,    Space pushes left
//
// Space is a push (momentum) and the block's Gravity takes it back: the same jump as the side view, turned.
import { CHARBL } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { INF_REPEAT, emptyFrame, newCharacter, type Character, type Frame as CharFrame } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import { set } from '@lewismoten/gamemaker-sandbox-tools/kit/actors';
import { Book } from '../../kit/starter/book';
import { KEY, SEQ, SND } from '../../kit/starter/ids';
import { slimPose } from '../../kit/starter/kitSlim';
import type { Pal } from '../../kit/starter/palette';
import type { Frame } from './frame';
import { turn } from './turn';

/** Pixels a step while walking. */
const STEP = 4;
/** The push of a jump: about three blocks and a bit before the block's pull takes it back. */
const PUSH = 12;
/** What each screen direction's key is, as (arrow, letter) keys and joystick directions. */
const DIRS = {
  up: { key: KEY.up, twin: KEY.w, joy: 1, seq: SEQ.up, twinSeq: SEQ.upW, v: [0, -1] },
  right: { key: KEY.right, twin: KEY.d, joy: 3, seq: SEQ.right, twinSeq: SEQ.rightD, v: [1, 0] },
  down: { key: KEY.down, twin: KEY.s, joy: 5, seq: SEQ.down, twinSeq: SEQ.downS, v: [0, 1] },
  left: { key: KEY.left, twin: KEY.a, joy: 7, seq: SEQ.left, twinSeq: SEQ.leftA, v: [-1, 0] },
} as const;
type Dir = keyof typeof DIRS;
const dirOf = (v: readonly [number, number]): Dir => (Object.keys(DIRS) as Dir[]).find((d) => DIRS[d].v[0] === v[0] && DIRS[d].v[1] === v[1])!;

/** The key that walks the hero forward in this room, and the one that walks him back. */
export const forwardKey = (f: Frame): Dir => dirOf(f.forward);
export const backKey = (f: Frame): Dir => dirOf([-f.forward[0], -f.forward[1]]);

/** The room's hero pictures: `f0 f1 fs` facing forward (two strides and standing), `b0 b1 bs` facing back. */
export function buildRoomHeroBlocks(pal: Pal, f: Frame): Book {
  const book = new Book('cbl');
  for (const [name, facing] of [
    ['f', 'left'],
    ['b', 'right'],
  ] as const)
    for (const [i, step] of [
      ['0', 0],
      ['1', 1],
      ['s', 2],
    ] as const)
      book.add(`${name}${i}`, turn(slimPose(pal, facing, step), f.k));
  return book;
}

/** The room's character file. */
export function buildRoomHero(cb: Book, f: Frame): Character {
  const ch = newCharacter();
  const S = ch.sequences;
  const frame = (pic: string, o: { x?: number; y?: number; pause?: number } = {}): CharFrame => ({
    ...emptyFrame(),
    x: o.x ?? 0,
    y: o.y ?? 0,
    pic1: CHARBL,
    pic2: cb.n(pic),
    pause: o.pause ?? 1,
    orient: 0,
  });
  set(S[SEQ.idle], [frame('fs', { pause: 40 }), frame('fs', { pause: 20 })]);
  set(S[SEQ.die], [frame('fs', { pause: 10 }), frame('fs', { pause: 24 })], { sound: SND.die, jstkBut: 0 });
  set(S[SEQ.hurt], [frame('fs', { pause: 2 }), frame('fs')], { sound: SND.hurt, jstkBut: 0 });
  set(S[3], [frame('fs')], { key: 0 });
  set(S[4], [frame('fs')], { key: 0 });
  const walk = (face: 'f' | 'b', v: readonly [number, number]) =>
    [`${face}0`, `${face}s`, `${face}1`, `${face}s`].map((pic) => frame(pic, { x: v[0] * STEP, y: v[1] * STEP }));
  // the four arrows (and their letters): forward and back walk; the other two have nothing to do in this room
  const fwd = forwardKey(f);
  const back = backKey(f);
  for (const d of Object.keys(DIRS) as Dir[]) {
    const D = DIRS[d];
    if (d === fwd || d === back) {
      const face = d === fwd ? 'f' : 'b';
      const v = D.v;
      set(S[D.seq], walk(face, v), { key: D.key, jstkMov: D.joy });
      set(S[D.twinSeq], walk(face, v), { key: D.twin });
    } else {
      set(S[D.seq], [frame('fs')], { key: 0 });
      set(S[D.twinSeq], [frame('fs')], { key: 0 });
    }
  }
  // Space: one push away from the surface, then poses while the block's pull takes it back
  set(S[SEQ.jump], [frame('f0', { x: f.away[0] * PUSH, y: f.away[1] * PUSH, pause: 2 }), frame('f1', { pause: 2 }), frame('fs', { pause: 2 })], {
    key: KEY.space,
    sound: SND.jump,
    norepeat: 1,
    momentum: 1,
    jstkMov: 9,
    jstkBut: 1,
  });
  for (const n of [SEQ.dig, SEQ.throw, SEQ.cheer]) set(S[n], [frame('fs')], { key: 0 });
  ch.meter.fill(INF_REPEAT);
  ch.meter[0] = 100;
  ch.meter[1] = 3;
  ch.cseq = 0;
  ch.cframe = 0;
  return ch;
}
