// DEMO.REC: what plays on the title screen when nobody touches the keyboard: the start of the
// bot's own run through the first level (tools/gendemo.ts writes RECORDED), as pairs of [ticks
// since the last key, PC scan code; +128 = released], ending with Esc.
import { recordedDemo } from '@lewismoten/gamemaker-sandbox-tools/kit/recordedDemo';

const RECORDED: number[] = [
  41, 57, 2, 185, 44, 57, 2, 185, 7, 57, 2, 185, 56, 77, 79, 205, 4, 77, 0, 57, 2, 185, 4, 57, 2, 185, 4, 57, 2, 185, 4, 57, 2, 185, 4, 57, 2, 185, 4, 57, 2,
  185, 62, 205, 44, 77, 9, 205, 4, 77, 0, 57, 2, 185, 17, 57, 2, 185, 7, 57, 2, 185, 13, 57, 2, 185, 7, 57, 2, 185, 13, 57, 2, 185, 16, 205, 4, 77, 34, 205, 4,
  77, 46, 77, 25, 205, 4, 57, 2, 185, 12, 57, 2, 185, 14, 57, 2, 185, 40, 57, 2, 185, 60, 77, 53, 205, 4, 77, 46, 205, 44, 77, 0, 57, 2, 185, 12, 57, 2, 185,
  16, 205, 4, 77, 23, 205, 44, 77, 40, 205, 4, 77, 3, 205, 4, 77, 0, 57, 2, 185, 12, 57, 2, 185, 26, 205, 4, 77, 14, 205, 4, 77, 1, 205, 4, 77, 0, 57, 2, 185,
  12, 57, 2, 185, 16, 205, 4, 77, 1, 205,
];

export function demoRecording(): Uint8Array {
  return recordedDemo(RECORDED, 25, 2);
}
