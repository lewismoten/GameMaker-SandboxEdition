// demo.rec: what the title screen plays when nobody touches the keyboard. Sir Grit
// picks up his shovel, digs into the dunes around Anthill Keep and flings sand at ants.
import { serializeRecording, type RecordedKey } from '../../web/src/formats/recording';

const KEY = { up: 0x48, down: 0x50, left: 0x4b, right: 0x4d, space: 0x39, p: 0x19 };

/** Steps of [key, ticks held, ticks to wait after release]. A tick is 1/18.2 s. */
type Step = [keyof typeof KEY, number, number];

export const DEMO_STEPS: Step[] = [
  ['up', 4, 6],
  ['right', 4, 8],
  ['p', 2, 12],
  ['up', 8, 4],
  ['right', 28, 4],
  ['up', 16, 4],
  ['space', 2, 6],
  ['space', 2, 6],
  ['left', 8, 4],
  ['up', 12, 6],
  ['up', 10, 4],
  ['left', 12, 4],
  ['up', 6, 4],
  ['space', 2, 8],
  ['right', 20, 4],
  ['down', 10, 4],
  ['space', 2, 8],
  ['right', 16, 20],
];

export function buildDemo(steps: Step[] = DEMO_STEPS): Uint8Array {
  const keys: RecordedKey[] = [];
  let wait = 20; // let the scene settle
  for (const [k, hold, after] of steps) {
    keys.push({ delta: wait, key: KEY[k] });
    keys.push({ delta: hold, key: KEY[k] | 0x80 });
    wait = after;
  }
  // Escape ends the demo.
  keys.push({ delta: wait + 20, key: 0x01 });
  keys.push({ delta: 2, key: 0x81 });
  return serializeRecording(keys);
}
