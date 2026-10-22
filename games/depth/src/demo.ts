// DEMO.REC: what plays on the title screen when nobody touches the keyboard, recorded from
// the bot rolling the first scene (pairs of [ticks since the last key, PC scan code; +128 =
// released]), ending with Esc. Re-record with tools/gendemo.ts.
import { serializeRecording, type RecordedKey } from '../../../web/src/formats/recording';

const RECORDED: number[] = [2, 77, 35, 205, 1, 80, 5, 208, 1, 77, 5, 205, 1, 80, 8, 57, 1, 185, 6, 208, 1, 57, 0, 77, 1, 185, 31, 205, 10, 77, 20, 205, 1, 80, 5, 208, 1, 77, 6, 72, 10, 200, 1, 77, 35, 205, 1, 80, 1, 57, 1, 185, 7, 57, 1, 185, 10, 208, 1, 75, 5, 203, 1, 80, 20, 208, 1, 77, 5, 205];

export function demoRecording(): Uint8Array {
  const keys: RecordedKey[] = [];
  for (let i = 0; i < RECORDED.length; i += 2) keys.push({ delta: RECORDED[i], key: RECORDED[i + 1] });
  keys.push({ delta: 25, key: 0x01 }, { delta: 2, key: 0x81 });
  return serializeRecording(keys);
}
