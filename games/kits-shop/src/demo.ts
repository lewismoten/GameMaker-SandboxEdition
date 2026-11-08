// DEMO.REC: what plays on the title screen when nobody touches the keyboard: the start of the
// bot's own run through the first level (tools/gendemo.ts writes RECORDED), as pairs of [ticks
// since the last key, PC scan code; +128 = released], ending with Esc.
import { recordedDemo } from '@lewismoten/gamemaker-sandbox-tools/kit/recordedDemo';

const RECORDED: number[] = [
  1, 77, 70, 205, 3, 77, 60, 205, 3, 75, 0, 203, 3, 77, 15, 205, 3, 77, 5, 205, 3, 77, 15, 205, 3, 77, 5, 205, 3, 77, 30, 205, 0, 75, 90, 203, 3, 75, 5, 203, 3,
  72, 39, 200, 3, 77, 20, 205, 3, 75, 15, 203, 3, 75, 3, 203, 3, 80, 29, 208, 3, 77, 3, 57, 2, 185, 19, 57, 2, 185, 28, 57, 2, 185, 73, 205, 3, 77, 15, 205, 3,
  77, 35, 205, 3, 77, 10, 205, 3, 77, 10, 205, 3, 77,
];

export function demoRecording(): Uint8Array {
  return recordedDemo(RECORDED, 25, 2);
}
