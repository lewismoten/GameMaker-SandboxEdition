// The hero's character file (.CHR): which keys do what. Game-Maker follows one key at a time,
// so every sequence is one key's, and each walking or climbing key has a twin on W, A, S and D.
//
//   Left / Right   walk (facing the way you go)
//   Space          jump: a push upward that gravity then takes back
//   Up / Down      climb a ladder (blocks with no pull hold you up)
//
// In the editor this is the Character tab: the sequence list, each one's key, and its frames.
import { CHARBL } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { INF_REPEAT, emptyFrame, newCharacter, type Character, type Frame } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import { set } from '@lewismoten/gamemaker-sandbox-tools/kit/actors';
import type { Book } from './book';
import { KEYS } from './blocks';
import { KEY, SEQ, SND } from './ids';

/** Pixels a frame while walking. */
export const WALK_STEP = 4;
/** The upward push of a jump (it rises about N*(N-1)/2 pixels: 12 is a little over three blocks). */
export const JUMP_PUSH = 12;
/** Pixels a frame while climbing. */
export const CLIMB_STEP = 4;

const JOY = { up: 1, right: 3, down: 5, left: 7, any: 9 };
const MIRROR = 0x40; // the bottom block flipped left to right
const MIRROR_BOTH = 0x44; // and the top block too

interface F {
  top: string;
  bottom: string;
  x?: number;
  y?: number;
  pause?: number;
  mirror?: boolean;
}

/** The hero's character file, using the pictures in `cb` (hero.ts buildHeroBlocks). */
export function buildHero(cb: Book): Character {
  const ch = newCharacter();
  const S = ch.sequences;
  const f = (o: F): Frame => ({
    ...emptyFrame(),
    x: o.x ?? 0,
    y: o.y ?? 0,
    pic1: o.top ? cb.n(o.top) : CHARBL,
    pic2: cb.n(o.bottom),
    pause: o.pause ?? 1,
    orient: o.mirror ? MIRROR_BOTH : 0,
  });

  set(S[SEQ.idle], [
    f({ top: 'stand.top', bottom: 'stand', pause: 36 }),
    f({ top: 'blink.top', bottom: 'stand', pause: 3 }),
    f({ top: 'stand.top', bottom: 'stand', pause: 20 }),
  ]);
  set(S[SEQ.die], [f({ top: 'hurt.top', bottom: 'hurt', pause: 10 }), f({ top: 'hurt.top', bottom: 'hurt', pause: 24 })], { sound: SND.die, jstkBut: 0 });
  set(
    S[SEQ.hurt],
    [f({ top: 'hurt.top', bottom: 'hurt', pause: 2 }), f({ top: 'stand.top', bottom: 'stand' }), f({ top: 'hurt.top', bottom: 'hurt', pause: 2 })],
    {
      sound: SND.hurt,
      jstkBut: 0,
    },
  );
  set(S[3], [f({ top: 'stand.top', bottom: 'stand' })], { key: 0 });
  set(S[4], [f({ top: 'stand.top', bottom: 'stand' })], { key: 0 });

  const walk = (dx: number, mirror: boolean) => [0, 1, 2, 3].map((i) => f({ top: 'stand.top', bottom: `walk${i}`, x: dx, mirror }));
  set(S[SEQ.right], walk(WALK_STEP, false), { key: KEY.right, jstkMov: JOY.right });
  set(S[SEQ.left], walk(-WALK_STEP, true), { key: KEY.left, jstkMov: JOY.left });
  set(S[SEQ.rightD], walk(WALK_STEP, false), { key: KEY.d });
  set(S[SEQ.leftA], walk(-WALK_STEP, true), { key: KEY.a });

  // Space: one push upward (momentum, so gravity can take it back), then a pose in the air
  set(S[SEQ.jump], [f({ top: 'cheer.top', bottom: 'jump', y: -JUMP_PUSH, pause: 6 })], {
    key: KEY.space,
    sound: SND.jump,
    norepeat: 1,
    momentum: 1,
    jstkMov: JOY.any,
    jstkBut: 1,
  });

  const climb = (dy: number) => [f({ top: 'front.top', bottom: 'climb0', y: dy, pause: 2 }), f({ top: 'look.top', bottom: 'climb1', y: dy, pause: 2 })];
  set(S[SEQ.up], climb(-CLIMB_STEP), { key: KEY.up, jstkMov: JOY.up });
  set(S[SEQ.upW], climb(-CLIMB_STEP), { key: KEY.w });
  set(S[SEQ.down], climb(CLIMB_STEP), { key: KEY.down, jstkMov: JOY.down });
  set(S[SEQ.downS], climb(CLIMB_STEP), { key: KEY.s });

  ch.meter.fill(INF_REPEAT);
  ch.meter[0] = 100; // hit points
  ch.meter[1] = 3; // lives
  ch.meter[KEYS] = 1; // keys carried (a counter shows one less than it holds)
  ch.cseq = 0;
  ch.cframe = 0;
  return ch;
}
