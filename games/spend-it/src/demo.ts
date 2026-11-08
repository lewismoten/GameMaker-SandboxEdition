// DEMO.REC: what plays on the title screen when nobody touches the keyboard: the start of the
// bot's own run through the first level (tools/gendemo.ts writes RECORDED), as pairs of [ticks
// since the last key, PC scan code; +128 = released], ending with Esc.
import { recordedDemo } from '@lewismoten/gamemaker-sandbox-tools/kit/recordedDemo';

const RECORDED: number[] = [
  1, 77, 45, 205, 3, 77, 15, 205, 3, 77, 30, 205, 0, 77, 3, 57, 2, 185, 20, 205, 4, 77, 5, 205, 3, 72, 39, 200, 3, 77, 20, 205, 3, 75, 15, 203, 3, 75, 3, 203,
  3, 80, 29, 208, 3, 75, 25, 203, 3, 77, 15, 205, 3, 77, 75, 205, 3, 77, 10, 205, 3, 77,
];

export function demoRecording(): Uint8Array {
  return recordedDemo(RECORDED, 25, 2);
}
