// DEMO.REC: what plays on the title screen when nobody touches the keyboard: the start of the
// bot's own run through the first level (tools/gendemo.ts writes RECORDED), as pairs of [ticks
// since the last key, PC scan code; +128 = released], ending with Esc.
import { recordedDemo } from '@lewismoten/gamemaker-sandbox-tools/kit/recordedDemo';

const RECORDED: number[] = [1, 77, 55, 205, 3, 77, 14, 57, 2, 185, 14, 205, 50, 77, 55, 205, 3, 77, 26, 77, 40, 205, 3, 77, 9, 57, 2, 185, 14, 205, 50, 77, 15, 205, 43, 77, 15, 205, 43, 77, 50, 205, 3, 77, 21, 77, 45, 205, 3, 77, 44, 57, 2, 185, 23, 57, 2, 185, 28, 57, 2, 185, 19, 57, 2, 185, 48, 77, 45, 205, 3, 57, 2, 185, 0, 77, 15, 205, 5, 77, 20, 205, 43, 77, 8, 205, 6, 77, 10, 205, 3, 77, 4, 57, 2, 185, 14, 205, 10, 77, 4, 57, 2, 185, 14, 205, 10, 77, 4, 57, 2, 185, 14, 205, 50, 77, 15, 205, 3, 57, 2, 185, 0, 77, 15, 205, 5, 77, 10, 205, 43, 77, 13, 205, 7, 77];

export function demoRecording(): Uint8Array {
  return recordedDemo(RECORDED, 25, 2);
}
