// DEMO.REC: what plays on the title screen when nobody touches the keyboard: the start of the
// bot's own run through the first level (tools/gendemo.ts writes RECORDED), as pairs of [ticks
// since the last key, PC scan code; +128 = released], ending with Esc.
import { recordedDemo } from '@lewismoten/gamemaker-sandbox-tools/kit/recordedDemo';

const RECORDED: number[] = [1, 77, 60, 205, 27, 77, 5, 205, 3, 72, 39, 200, 3, 77, 18, 205, 3, 80, 39, 208, 3, 77, 10, 205, 3, 77, 20, 205, 27, 77, 10, 205, 121, 77, 13, 205, 3, 77, 10, 205];

export function demoRecording(): Uint8Array {
  return recordedDemo(RECORDED, 25, 2);
}
