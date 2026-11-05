// DEMO.REC: what plays on the title screen when nobody touches the keyboard: the start of the
// bot's own run through the first level (tools/gendemo.ts writes RECORDED), as pairs of [ticks
// since the last key, PC scan code; +128 = released], ending with Esc.
import { recordedDemo } from '@lewismoten/gamemaker-sandbox-tools/kit/recordedDemo';

const RECORDED: number[] = [
  1, 77, 10, 205, 43, 77, 30, 205, 43, 77, 25, 205, 3, 57, 2, 185, 0, 77, 18, 205, 3, 77, 5, 205, 14, 77, 30, 205, 43, 77, 35, 205, 3, 77, 30, 205, 20, 75, 0,
  203, 3, 28, 2, 156, 50, 77, 35, 205, 3, 28, 2, 156, 50, 77, 55, 205, 3, 77, 16, 77, 10, 205, 43, 77, 43, 205, 12, 57, 2, 185, 0, 77, 21, 205, 3, 77, 40, 205,
  3, 77, 18, 205, 43, 77, 28, 205, 12, 57, 2, 185, 0, 77, 20, 205, 3, 77, 30, 205, 3, 77, 41, 77, 10, 205, 43, 77, 30, 205, 3, 77, 40, 205, 3, 18, 2, 146, 25,
  77, 22, 205, 19, 77, 15, 205, 43, 77, 20, 205, 3, 77, 65, 205, 3, 16, 2, 144, 25, 75, 22, 203, 19, 77, 1, 205,
];

export function demoRecording(): Uint8Array {
  return recordedDemo(RECORDED, 25, 2);
}
