// DEMO.REC: what plays on the title screen when nobody touches the keyboard: the start of the
// bot's own run through the first level (tools/gendemo.ts writes RECORDED), as pairs of [ticks
// since the last key, PC scan code; +128 = released], ending with Esc.
import { recordedDemo } from '@lewismoten/gamemaker-sandbox-tools/kit/recordedDemo';

const RECORDED: number[] = [
  1, 77, 70, 205, 3, 57, 2, 185, 64, 77, 85, 205, 3, 77, 10, 205, 43, 75, 95, 203, 3, 57, 2, 185, 0, 77, 10, 205, 14, 77, 6, 77, 60, 205, 3, 57, 2, 185, 0, 77,
  70, 205, 43, 75, 30, 203, 3, 72, 39, 200, 3, 75, 10, 203, 3, 75, 135, 203, 43, 77, 70, 205, 3, 57, 2, 185, 0, 77, 25, 205, 9, 77,
];

export function demoRecording(): Uint8Array {
  return recordedDemo(RECORDED, 25, 2);
}
