// DEMO.REC: what plays on the title screen when nobody touches the keyboard: the start of the
// bot's own run through the first level (tools/gendemo.ts writes RECORDED), as pairs of [ticks
// since the last key, PC scan code; +128 = released], ending with Esc.
import { recordedDemo } from '@lewismoten/gamemaker-sandbox-tools/kit/recordedDemo';

const RECORDED: number[] = [1, 77, 20, 205, 39, 77, 45, 205, 3, 57, 2, 185, 0, 77, 20, 205, 4, 77, 15, 205, 31, 75, 35, 203, 31, 77, 41, 77, 25, 205, 57, 77, 60, 205, 3, 75, 25, 203, 33, 77, 86, 77, 40, 205, 11, 72, 25, 200, 11, 75, 15, 203, 11, 80, 45, 208, 41, 77, 85, 205, 11, 72, 20, 200, 135, 77];

export function demoRecording(): Uint8Array {
  return recordedDemo(RECORDED, 25, 2);
}
