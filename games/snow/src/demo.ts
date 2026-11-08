// DEMO.REC: what plays on the title screen when nobody touches the keyboard: the start of the
// bot's own run through the first level (tools/gendemo.ts writes RECORDED), as pairs of [ticks
// since the last key, PC scan code; +128 = released], ending with Esc.
import { recordedDemo } from '@lewismoten/gamemaker-sandbox-tools/kit/recordedDemo';

const RECORDED: number[] = [1, 77, 20, 205, 39, 77, 45, 205, 3, 57, 2, 185, 0, 77, 20, 205, 4, 77, 15, 205, 31, 75, 35, 203, 31, 77, 41, 77, 25, 205, 57, 77, 60, 205, 3, 75, 25, 203, 33, 77, 86, 77, 50, 205, 16, 72, 15, 200, 6, 77, 10, 205, 6, 80, 15, 208, 6, 75, 10, 203, 18, 80, 20, 208, 6, 77, 60, 205, 6, 72, 20, 200, 130, 77];

export function demoRecording(): Uint8Array {
  return recordedDemo(RECORDED, 25, 2);
}
