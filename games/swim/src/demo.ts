// DEMO.REC: what plays on the title screen when nobody touches the keyboard: the start of the
// bot's own run through the first level (tools/gendemo.ts writes RECORDED), as pairs of [ticks
// since the last key, PC scan code; +128 = released], ending with Esc.
import { recordedDemo } from '@lewismoten/gamemaker-sandbox-tools/kit/recordedDemo';

const RECORDED: number[] = [1, 77, 15, 205, 43, 77, 30, 205, 3, 77, 15, 205, 40, 57, 2, 185, 0, 75, 13, 203, 7, 77, 5, 205, 3, 57, 2, 185, 0, 77, 20, 205, 4, 57, 2, 185, 0, 77, 20, 205, 4, 57, 2, 185, 0, 77, 20, 205, 4, 57, 2, 185, 0, 77, 25, 205, 3, 77, 25, 205, 3, 77, 21, 77, 15, 205, 43, 77, 15, 205, 3, 77, 11, 205, 40, 77, 300, 205, 0, 57, 2, 185, 0, 77, 10, 205, 15, 77, 30, 205, 3, 77, 1, 75, 15, 203, 43, 75, 30, 203, 3, 75, 23, 203, 40, 75, 1, 205, 1, 203];

export function demoRecording(): Uint8Array {
  return recordedDemo(RECORDED, 25, 2);
}
