// DEMO.REC: what plays on the title screen when nobody touches the keyboard: the start of the
// bot's own run through the first level (tools/gendemo.ts writes RECORDED), as pairs of [ticks
// since the last key, PC scan code; +128 = released], ending with Esc.
import { recordedDemo } from '@lewismoten/gamemaker-sandbox-tools/kit/recordedDemo';

const RECORDED: number[] = [
  41, 77, 20, 205, 3, 72, 51, 72, 45, 200, 3, 77, 20, 205, 3, 72, 15, 200, 3, 72, 6, 200, 40, 80, 15, 208, 3, 75, 20, 203, 3, 80, 91, 77, 45, 205, 3, 80, 15,
  208, 11, 72, 15, 200, 3, 75, 45, 203, 3, 72, 1, 72, 45, 200, 3, 77, 20, 205, 3, 72, 15, 200, 3, 72, 20, 200, 3, 72, 41, 80, 46, 72, 1, 75, 30, 203, 3, 72, 15,
  200, 3, 80, 15, 208, 3, 77, 55, 205, 3, 72, 35, 200, 3, 80, 15, 208, 3, 77,
];

export function demoRecording(): Uint8Array {
  return recordedDemo(RECORDED, 25, 2);
}
