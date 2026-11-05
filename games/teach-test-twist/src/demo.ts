// DEMO.REC: what plays on the title screen when nobody touches the keyboard: the start of the
// bot's own run through the first level (tools/gendemo.ts writes RECORDED), as pairs of [ticks
// since the last key, PC scan code; +128 = released], ending with Esc.
import { recordedDemo } from '@lewismoten/gamemaker-sandbox-tools/kit/recordedDemo';

const RECORDED: number[] = [1, 77, 25, 205, 39, 77, 20, 205, 39, 75, 0, 203, 3, 77, 18, 57, 2, 185, 20, 205, 4, 75, 21, 57, 2, 185, 8, 203, 12, 77, 8, 205, 7, 77, 5, 205, 3, 77, 3, 57, 2, 185, 13, 205, 7, 77, 55, 205, 3, 77];

export function demoRecording(): Uint8Array {
  return recordedDemo(RECORDED, 25, 2);
}
