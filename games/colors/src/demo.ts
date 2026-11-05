// DEMO.REC: what plays on the title screen when nobody touches the keyboard: the start of the
// bot's own run through the first level (tools/gendemo.ts writes RECORDED), as pairs of [ticks
// since the last key, PC scan code; +128 = released], ending with Esc.
import { recordedDemo } from '@lewismoten/gamemaker-sandbox-tools/kit/recordedDemo';

const RECORDED: number[] = [1, 77, 65, 205, 3, 77, 9, 57, 2, 185, 23, 57, 2, 185, 14, 205, 50, 77, 30, 205, 3, 77, 26, 77, 65, 205, 3, 77, 5, 205, 3, 57, 2, 185, 0, 77, 10, 205, 14, 75, 0, 203, 3, 77, 5, 205, 3, 57, 2, 185, 0, 77, 10, 205, 14, 75, 0, 203, 3, 77, 10, 205, 43, 77, 30, 205, 3, 77];

export function demoRecording(): Uint8Array {
  return recordedDemo(RECORDED, 25, 2);
}
