// DEMO.REC: what plays on the title screen when nobody touches the keyboard: the start of the
// bot's own run through the first level (tools/gendemo.ts writes RECORDED), as pairs of [ticks
// since the last key, PC scan code; +128 = released], ending with Esc.
import { recordedDemo } from '@lewismoten/gamemaker-sandbox-tools/kit/recordedDemo';

const RECORDED: number[] = [1, 77, 25, 205, 43, 77, 45, 205, 43, 77, 30, 205, 53, 77, 65, 205, 3, 77];

export function demoRecording(): Uint8Array {
  return recordedDemo(RECORDED, 25, 2);
}
