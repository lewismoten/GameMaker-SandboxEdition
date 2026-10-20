// DEMO.REC: what plays on the title screen when nobody touches the keyboard. A script
// of key presses (in 18.2 Hz game ticks) on Pine Street, ending with Esc.
import { serializeRecording, type RecordedKey } from '../../web/src/formats/recording';

const SCAN = { up: 0x48, down: 0x50, left: 0x4b, right: 0x4d, space: 0x39, esc: 0x01 };
type Step = [keyof typeof SCAN | 'wait', number];

/** Hold each key for n ticks (or wait n ticks). */
const SCRIPT: Step[] = [
  ['wait', 20],
  ['down', 6],
  ['right', 52],
  ['up', 12],
  ['wait', 4],
  ['down', 12],
  ['right', 20],
  ['up', 14],
  ['wait', 3],
  ['left', 5],
  ['down', 14],
  ['wait', 6],
  ['space', 2],
  ['wait', 10],
  ['right', 20],
  ['up', 14],
  ['right', 5],
  ['down', 14],
  ['wait', 4],
  ['right', 28],
  ['wait', 30],
];

export function demoRecording(): Uint8Array {
  const keys: RecordedKey[] = [];
  let since = 0;
  for (const [key, ticks] of SCRIPT) {
    if (key === 'wait') {
      since += ticks;
      continue;
    }
    keys.push({ delta: since, key: SCAN[key] });
    keys.push({ delta: ticks, key: SCAN[key] | 0x80 });
    since = 0;
  }
  keys.push({ delta: since, key: SCAN.esc });
  keys.push({ delta: 2, key: SCAN.esc | 0x80 });
  return serializeRecording(keys);
}
