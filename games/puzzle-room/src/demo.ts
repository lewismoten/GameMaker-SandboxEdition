// DEMO.REC: what plays on the title screen when nobody touches the keyboard: the start of the
// bot's own run through the first level (tools/gendemo.ts writes RECORDED), as pairs of [ticks
// since the last key, PC scan code; +128 = released], ending with Esc.
import { recordedDemo } from '@lewismoten/gamemaker-sandbox-tools/kit/recordedDemo';

const RECORDED: number[] = [
  1, 77, 40, 205, 43, 77, 95, 205, 3, 77, 67, 77, 40, 205, 3, 77, 5, 205, 3, 77, 5, 205, 3, 72, 39, 200, 3, 77, 25, 205, 43, 77, 8, 205, 16, 77, 50, 205, 3, 77,
  40, 205, 3, 77, 15, 205, 3, 77, 31, 77, 35, 205, 3, 77, 20, 205, 3, 77, 5, 205, 3, 72, 39, 200, 3, 77, 20, 205, 3, 77, 40, 205, 3, 77, 8, 205, 16, 77, 25,
  205, 3, 77, 16, 57, 2, 185, 47, 77, 35, 205, 3, 77, 20, 205, 3, 77, 5, 205, 3, 72, 39, 200, 3, 77, 20, 205, 3, 75, 18, 203, 3, 80, 39, 208, 3, 77, 100, 205,
  3, 77, 20, 205, 3, 77, 20, 205, 3, 77, 1, 205,
];

export function demoRecording(): Uint8Array {
  return recordedDemo(RECORDED, 25, 2);
}
