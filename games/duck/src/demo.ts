// DEMO.REC: what plays on the title screen when nobody touches the keyboard: the start of the
// bot's own run through the first level (tools/gendemo.ts writes RECORDED), as pairs of [ticks
// since the last key, PC scan code; +128 = released], ending with Esc.
import { recordedDemo } from '@lewismoten/gamemaker-sandbox-tools/kit/recordedDemo';

const RECORDED: number[] = [
  1, 77, 15, 205, 43, 77, 20, 205, 43, 77, 23, 205, 42, 77, 28, 205, 0, 80, 13, 208, 0, 77, 31, 205, 1, 77, 2, 205, 3, 75, 1, 203, 44, 77, 20, 205, 0, 80, 31,
  208, 0, 77, 41, 205, 3, 75, 1, 203, 15, 77, 18, 205, 0, 80, 22, 208, 0, 77, 43, 205, 3, 77, 17, 205, 43, 77, 16, 77, 20, 205, 43, 77, 38, 205, 40, 77, 17,
  205, 0, 80, 23, 208, 0, 77, 43, 205, 3, 77, 17, 205, 43, 77, 13, 205, 9, 77, 28, 205, 0, 80, 13, 208, 0, 77, 33, 205, 3, 75, 3, 203, 43, 77, 23, 205, 100, 77,
  20, 205, 0, 80, 30, 208, 0, 77, 40, 205, 3, 77, 10, 205, 20, 77, 1, 205,
];

export function demoRecording(): Uint8Array {
  return recordedDemo(RECORDED, 25, 2);
}
