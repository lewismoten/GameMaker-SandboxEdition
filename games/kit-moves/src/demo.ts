// DEMO.REC: what plays on the title screen when nobody touches the keyboard: the start of the
// bot's own run through the first level (tools/gendemo.ts writes RECORDED), as pairs of [ticks
// since the last key, PC scan code; +128 = released], ending with Esc.
import { recordedDemo } from '@lewismoten/gamemaker-sandbox-tools/kit/recordedDemo';

const RECORDED: number[] = [1, 77, 25, 205, 43, 57, 36, 185, 9, 77, 15, 205, 3, 57, 2, 185, 0, 77, 18, 205, 3, 77, 5, 205, 14, 77, 10, 205, 43, 77, 30, 205, 43, 77, 25, 205, 3, 72, 8, 200, 42, 72, 23, 200, 0, 77, 20, 205, 30, 77, 10, 205, 43, 77, 35, 205, 3, 77, 16, 77, 10, 205, 43, 28, 30, 156, 10, 77, 9, 205, 3, 57, 2, 185, 3, 28, 2, 156, 19, 77, 38, 205, 43, 77, 10, 205, 3, 57, 2, 185, 3, 28, 2, 156, 3, 28, 2, 156, 14, 77, 37, 205, 43, 77, 15, 205, 3, 57, 2, 185, 3, 28, 2, 156, 3, 28, 1, 156];

export function demoRecording(): Uint8Array {
  return recordedDemo(RECORDED, 25, 2);
}
