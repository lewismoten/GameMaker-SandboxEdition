// DEMO.REC: what plays on the title screen when nobody touches the keyboard: the start of the
// bot's own run through the first level (tools/gendemo.ts writes RECORDED), as pairs of [ticks
// since the last key, PC scan code; +128 = released], ending with Esc.
import { recordedDemo } from '@lewismoten/gamemaker-sandbox-tools/kit/recordedDemo';

const RECORDED: number[] = [
  1, 77, 55, 205, 23, 75, 81, 77, 55, 205, 23, 77, 25, 205, 23, 77, 25, 205, 23, 77, 25, 205, 23, 77, 40, 205, 3, 57, 2, 185, 47, 77, 31, 77, 70, 205, 23, 77,
  30, 205, 23, 77, 35, 205, 23, 77, 5, 205, 3, 57, 2, 185, 0, 77, 15, 205, 5, 77, 10, 205, 23, 77, 13, 205, 3, 77, 19, 57, 2, 185, 14, 205, 30, 77, 15, 205, 3,
  77, 8, 57, 2, 185, 15, 205, 29, 77,
];

export function demoRecording(): Uint8Array {
  return recordedDemo(RECORDED, 25, 2);
}
