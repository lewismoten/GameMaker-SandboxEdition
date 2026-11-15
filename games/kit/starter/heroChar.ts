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
/** Both blocks flipped left to right (0x40 flips the bottom block, 0x04 the top). */
const MIRROR_BOTH = 0x44;

interface F {
  top: string;
  bottom: string;
  x?: number;
  y?: number;
  pause?: number;
  mirror?: boolean;
}

/** Options for the hero's character file. */
export interface HeroOptions {
  /**
   * A held-rise jump (like Loaf's and Mustard's rise): while Space is held the hero moves straight up
   * `push` pixels a tick, not as momentum, so gravity keeps growing meanwhile and soon outweighs it. Once
   * he is falling, a new press cannot lift him: one jump per flight. Letting go hands the keys back, so
   * the arrows steer in the air. The default (off) is the momentum push, which stacks when tapped in the air.
   */
  heldRise?: { push: number };
}

/** The hero's character file, using the pictures in `cb` (hero.ts buildHeroBlocks). */
export function buildHero(cb: Book, opts: HeroOptions = {}): Character {
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
    f({ top: 'look.top', bottom: 'stand', pause: 14 }),
    f({ top: 'stand.top', bottom: 'stand', pause: 10 }),
    f({ top: 'blink.top', bottom: 'stand', pause: 3 }),
    f({ top: 'stand.top', bottom: 'stand', pause: 12 }),
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

  // Space: one push upward (momentum, so gravity can take it back), then poses in the air: arms up
  // on the way up, arms out as he comes down. The three pauses add up to the old single pose's 6.
  // With `heldRise`, a single frame that moves him straight up each tick Space is held instead.
  if (opts.heldRise) {
    set(S[SEQ.jump], [f({ top: 'up.top', bottom: 'jumpup', y: -opts.heldRise.push })], {
      key: KEY.space,
      sound: SND.jump,
      jstkMov: JOY.any,
      jstkBut: 1,
    });
  } else
    set(
      S[SEQ.jump],
      [
        f({ top: 'up.top', bottom: 'jumpup', y: -JUMP_PUSH, pause: 2 }),
        f({ top: 'cheer.top', bottom: 'jump', pause: 2 }),
        f({ top: 'oh.top', bottom: 'fall', pause: 2 }),
      ],
      {
        key: KEY.space,
        sound: SND.jump,
        norepeat: 1,
        momentum: 1,
        jstkMov: JOY.any,
        jstkBut: 1,
      },
    );

  const climb = (dy: number) => [f({ top: 'back.top', bottom: 'climb0', y: dy, pause: 2 }), f({ top: 'back.top', bottom: 'climb1', y: dy, pause: 2 })];
  set(S[SEQ.up], climb(-CLIMB_STEP), { key: KEY.up, jstkMov: JOY.up });
  set(S[SEQ.upW], climb(-CLIMB_STEP), { key: KEY.w });
  set(S[SEQ.down], climb(CLIMB_STEP), { key: KEY.down, jstkMov: JOY.down });
  set(S[SEQ.downS], climb(CLIMB_STEP), { key: KEY.s });

  // Animations for a game to play (the editor's Character tab lists them); no key starts them
  set(
    S[SEQ.dig],
    [
      f({ top: 'stand.top', bottom: 'dig0', pause: 3 }),
      f({ top: 'stand.top', bottom: 'dig1', pause: 3 }),
      f({ top: 'stand.top', bottom: 'dig0', pause: 3 }),
      f({ top: 'stand.top', bottom: 'dig1', pause: 3 }),
    ],
    { key: 0 },
  );
  set(
    S[SEQ.throw],
    [
      f({ top: 'stand.top', bottom: 'throw0', pause: 3 }),
      f({ top: 'cheer.top', bottom: 'throw1', pause: 2 }),
      f({ top: 'stand.top', bottom: 'throw2', pause: 3 }),
    ],
    { key: 0 },
  );
  set(S[SEQ.cheer], [f({ top: 'cheer2.top', bottom: 'cheer', pause: 4 }), f({ top: 'up.top', bottom: 'jumpup', pause: 4 })], { key: 0 });

  ch.meter.fill(INF_REPEAT);
  ch.meter[0] = 100; // hit points
  ch.meter[1] = 3; // lives
  ch.meter[KEYS] = 1; // keys carried (a counter shows one less than it holds)
  ch.cseq = 0;
  ch.cframe = 0;
  return ch;
}
