// DEMO.REC: what plays on the title screen when nobody touches the keyboard: the start of the
// bot's own run through the first level (tools/gendemo.ts writes RECORDED), as pairs of [ticks
// since the last key, PC scan code; +128 = released], ending with Esc.
import { recordedDemo } from '@lewismoten/gamemaker-sandbox-tools/kit/recordedDemo';

const RECORDED: number[] = [
  1, 77, 15, 205, 43, 77, 20, 205, 3, 25, 3, 153, 30, 77, 10, 205, 3, 25, 3, 153, 30, 77, 10, 205, 3, 25, 3, 153, 30, 77, 15, 205, 43, 77, 25, 205, 43, 77, 55,
  205, 3, 57, 2, 185, 0, 77, 70, 205, 3, 32, 1, 28, 0, 156, 2, 160, 30, 57, 2, 185, 23, 57, 2, 185, 0, 77, 70, 205, 3, 32, 1, 28, 0, 156, 2, 160, 30, 57, 2,
  185, 23, 57, 2, 185, 0, 77, 70, 205, 3, 32, 1, 28, 0, 156, 2, 160, 30, 57, 2, 185, 23, 57, 2, 185, 0, 77, 10, 205, 8, 77, 5, 205, 3, 77, 8, 205, 17, 77, 20,
  205, 3, 77, 21, 77, 10, 205, 43, 28, 3, 156, 60, 77, 25, 205, 3, 25, 3, 153, 30, 77, 15, 205, 3, 25, 3, 153, 30, 77, 20, 205, 43, 77, 35, 205, 3, 28, 3, 156,
  60, 77, 35, 205, 43, 77, 25, 205, 3, 28, 3, 156, 60, 32, 1, 28, 0, 156, 2, 160, 30, 28, 3, 156, 60, 25, 3, 153, 30, 57, 2, 185, 0, 77, 20, 205,
];

export function demoRecording(): Uint8Array {
  return recordedDemo(RECORDED, 25, 2);
}
