// The left-handed key set: a second key for a move is a copy of its sequence in a free slot
// (a sequence has one key). Joystick moves stay with the first sequence.
import type { Character } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import { set } from '@lewismoten/gamemaker-sandbox-tools/kit/actors';
import { ALT_SEQ, KEY, SEQ } from './ids';

/** Sequence `from`'s frames and sounds again, under `key`, in the free sequence `to`. */
function alias(S: Character['sequences'], from: number, to: number, key: number): void {
  const src = S[from];
  const frames = src.frames.filter((fr) => fr.pic2 !== 51);
  set(S[to], frames, { key, sound: src.sound, ground: src.ground, norepeat: src.norepeat, jstkBut: 4, jstkMov: 0 });
}

/** W A S D for the arrows and Home / PgUp (keypad 7 and 9) for Q and E, on a hero who walks, hops and climbs down. */
export function addLeftHandKeys(S: Character['sequences']): void {
  const [w, a, s, d, home, pgup] = ALT_SEQ.leo;
  alias(S, SEQ.hop, w, KEY.w);
  alias(S, SEQ.left, a, KEY.a);
  alias(S, SEQ.down, s, KEY.s);
  alias(S, SEQ.right, d, KEY.d);
  alias(S, SEQ.hopLeft, home, KEY.home);
  alias(S, SEQ.hopRight, pgup, KEY.pgup);
}

/** The same for Teddy, who has no way down: the slots his tricks leave free. */
export function addTeddyLeftHandKeys(S: Character['sequences']): void {
  const [w, a, d, home, pgup] = ALT_SEQ.teddy;
  alias(S, SEQ.hop, w, KEY.w);
  alias(S, SEQ.left, a, KEY.a);
  alias(S, SEQ.right, d, KEY.d);
  alias(S, SEQ.hopLeft, home, KEY.home);
  alias(S, SEQ.hopRight, pgup, KEY.pgup);
}
