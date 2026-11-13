// DEMO.REC: what plays on the title screen when nobody touches the keyboard: the start of the
// bot's own run through the first level (tools/gendemo.ts writes RECORDED), as pairs of [ticks
// since the last key, PC scan code; +128 = released], ending with Esc.
import { recordedDemo } from '@lewismoten/gamemaker-sandbox-tools/kit/recordedDemo';

const RECORDED: number[] = [1, 77, 25, 205, 43, 57, 36, 185, 9, 77, 15, 205, 3, 57, 2, 185, 0, 77, 18, 205, 3, 77, 5, 205, 14, 77, 10, 205, 43, 77, 30, 205, 43, 77, 25, 205, 3, 72, 8, 200, 42, 72, 23, 200, 0, 77, 20, 205, 3, 77, 10, 205, 43, 77, 35, 205, 3, 77, 16, 77, 10, 205, 43, 28, 30, 156, 10, 77, 9, 205, 3, 77, 2, 205, 10, 28, 2, 156, 27, 77, 37, 205, 43, 77, 10, 205, 3, 77, 2, 205, 10, 77, 0, 57, 2, 185, 4, 28, 2, 156, 24, 205, 3, 77, 25, 205, 43, 77, 15, 205, 3, 77, 2, 205, 10, 77, 0, 57, 2, 185, 4, 28, 2, 156, 4, 28, 2, 156, 1, 205];

export function demoRecording(): Uint8Array {
  return recordedDemo(RECORDED, 25, 2);
}
