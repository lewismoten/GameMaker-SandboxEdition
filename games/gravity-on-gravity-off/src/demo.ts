// DEMO.REC: what plays on the title screen when nobody touches the keyboard: the start of the
// bot's own run through the first level (tools/gendemo.ts writes RECORDED), as pairs of [ticks
// since the last key, PC scan code; +128 = released], ending with Esc.
import { recordedDemo } from '@lewismoten/gamemaker-sandbox-tools/kit/recordedDemo';

const RECORDED: number[] = [
  1, 77, 15, 205, 3, 57, 2, 185, 71, 77, 30, 205, 3, 77, 11, 205, 40, 57, 2, 185, 0, 77, 18, 205, 7, 77, 10, 205, 3, 57, 2, 185, 0, 77, 15, 205, 5, 77, 15, 205,
  11, 77, 13, 205, 43, 77, 41, 77, 10, 205, 3, 80, 10, 208, 11, 72, 10, 200, 43, 77, 20, 205, 3, 57, 2, 185, 40, 77, 20, 205, 3, 77, 6, 205, 40, 80, 15, 208,
  11, 77, 10, 205, 11, 72, 20, 200, 3, 77, 20, 205, 3, 77, 30, 205, 3, 77, 15, 205, 43, 80, 5, 208, 3, 77,
];

export function demoRecording(): Uint8Array {
  return recordedDemo(RECORDED, 25, 2);
}
