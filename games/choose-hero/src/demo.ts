// DEMO.REC: what plays on the title screen when nobody touches the keyboard: the start of the
// bot's own run through the first level (tools/gendemo.ts writes RECORDED), as pairs of [ticks
// since the last key, PC scan code; +128 = released], ending with Esc.
import { recordedDemo } from '@lewismoten/gamemaker-sandbox-tools/kit/recordedDemo';

const RECORDED: number[] = [
  1, 75, 20, 203, 43, 75, 20, 203, 43, 77, 60, 205, 43, 77, 17, 205, 3, 77, 4, 77, 14, 205, 43, 77, 26, 205, 43, 77, 27, 205, 3, 75, 0, 203, 3, 57, 2, 185, 0,
  77, 36, 205, 3, 77, 9, 57, 2, 185, 14, 205, 19, 77, 6, 205, 43, 77, 7, 205, 3, 57, 2, 185, 34, 77, 13, 205, 3, 57, 2, 185, 34, 77, 14, 205, 3, 57, 2, 185, 34,
  77, 31, 205, 3, 77, 66, 205, 3, 77, 54, 77, 27, 205, 43, 77, 40, 205, 3, 77, 3, 57, 2, 185, 42, 205, 3, 77, 20, 205, 3, 77, 1, 205,
];

export function demoRecording(): Uint8Array {
  return recordedDemo(RECORDED, 25, 2);
}
