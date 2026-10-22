// DEMO.REC: what plays on the title screen when nobody touches the keyboard, recorded from
// the bot rolling the first scene (pairs of [ticks since the last key, PC scan code; +128 =
// released]), ending with Esc. Re-record with tools/gendemo.ts.
import { serializeRecording, type RecordedKey } from '../../../web/src/formats/recording';

const RECORDED: number[] = [];

export function demoRecording(): Uint8Array {
  const keys: RecordedKey[] = [];
  for (let i = 0; i < RECORDED.length; i += 2) keys.push({ delta: RECORDED[i], key: RECORDED[i + 1] });
  keys.push({ delta: 25, key: 0x01 }, { delta: 2, key: 0x81 });
  return serializeRecording(keys);
}
