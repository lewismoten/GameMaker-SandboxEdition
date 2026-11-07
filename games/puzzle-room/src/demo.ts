// DEMO.REC: what plays on the title screen when nobody touches the keyboard: the start of the
// bot's own run through the first level (tools/gendemo.ts writes RECORDED), as pairs of [ticks
// since the last key, PC scan code; +128 = released], ending with Esc.
import { recordedDemo } from '@lewismoten/gamemaker-sandbox-tools/kit/recordedDemo';

const RECORDED: number[] = [1, 75, 70, 203, 43, 77, 75, 205, 3, 77, 67, 75, 70, 203, 3, 75, 0, 203, 3, 72, 39, 200, 3, 75, 25, 203, 43, 75, 5, 203, 3, 77, 28, 205, 3, 80, 39, 208, 3, 77, 75, 205, 3, 77, 40, 205, 3, 77, 20, 205, 3, 77, 21, 75, 100, 203, 3, 75, 30, 203, 3, 72, 39, 200, 3, 75, 15, 203, 3, 75, 40, 203, 3, 75, 10, 203, 3, 77, 63, 205, 3, 80, 39, 208, 3, 77, 80, 205, 3, 77, 16, 57, 2, 185, 47, 75, 100, 203, 3, 75, 30, 203, 3, 72, 39, 200, 3, 75, 15, 203, 3, 75, 5, 203, 3, 77, 18, 205, 3, 80, 39, 208, 3, 77, 1, 205];

export function demoRecording(): Uint8Array {
  return recordedDemo(RECORDED, 25, 2);
}
