// Mara's jump for this game. Her shadow is painted into her standing and walking pictures, so it goes wherever those
// pictures go. The Starters' jump is two or three frames long and the engine then gives her stand or walk pictures back
// while she is still in the air (a key lifted, or an arrow held, ends it), so her shadow rose with her.
// Here the jump is one uninterruptible sequence (ground = 1) as long as the flight: a crouch with a small shadow, the
// air poses with none, and a landing frame with a small shadow. The price: no steering in the air.
import { emptyFrame, type Character, type Frame } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import { set } from '@lewismoten/gamemaker-sandbox-tools/kit/actors';
import type { Book } from '../../kit/starter/book';
import { JUMP_PUSH } from '../../kit/starter/heroChar';
import { KEY, SEQ, SND } from '../../kit/starter/ids';

/** [top, bottom, push, ticks] for each frame of the flight. The ticks add up to the time she is in the air. */
const FLIGHT: ReadonlyArray<readonly [string, string, number, number]> = [
  ['stand.top', 'crouch', 0, 1],
  ['up.top', 'jumpup', -JUMP_PUSH, 5],
  ['cheer.top', 'jump', 0, 7],
  ['oh.top', 'fall', 0, 10],
  ['stand.top', 'crouch', 0, 2],
];

/** Replaces the jump sequence of `ch` (built from `cb`, which has a 'crouch' block). */
export function shadowJump(ch: Character, cb: Book): void {
  const f = ([top, bottom, y, pause]: readonly [string, string, number, number]): Frame => ({
    ...emptyFrame(),
    pic1: cb.n(top),
    pic2: cb.n(bottom),
    y,
    pause,
  });
  set(ch.sequences[SEQ.jump], FLIGHT.map(f), { key: KEY.space, sound: SND.jump, norepeat: 1, momentum: 1, jstkMov: 9, jstkBut: 1, ground: 1 });
}
