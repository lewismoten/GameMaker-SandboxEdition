// DEMO.REC: what plays on the title screen when nobody touches the keyboard: the start of the
// bot's own run through the first level (tools/gendemo.ts writes RECORDED), as pairs of [ticks
// since the last key, PC scan code; +128 = released], ending with Esc.
import { recordedDemo } from '@lewismoten/gamemaker-sandbox-tools/kit/recordedDemo';

const RECORDED: number[] = [41, 80, 12, 208, 11, 77, 12, 205, 11, 72, 12, 200, 11, 75, 12, 203, 11, 80, 5, 208, 3, 72, 5, 200, 3, 75, 0, 203, 3, 57, 2, 185, 40, 77, 46, 205, 40, 72, 10, 200, 3, 75, 5, 203, 3, 80, 15, 208, 3, 77, 25, 205, 3, 72, 15, 200, 11, 80, 10, 208, 3, 77, 45, 205, 3, 77, 41, 72, 56, 80, 10, 208, 3, 75, 30, 203, 3, 77, 30, 205, 3, 80, 46, 77, 31, 80, 15, 208, 3, 77, 25, 205, 11, 75, 25, 203, 3, 72, 71, 75, 5, 203, 3, 72, 16, 200, 40, 77, 5, 205, 3, 72, 1, 80, 5, 208, 3, 75, 25, 203, 3, 80, 5, 208, 3, 77, 50, 205, 3, 72, 25, 200, 3, 80, 25, 208, 3, 75, 25, 203, 3, 80, 46, 72, 11, 77];

export function demoRecording(): Uint8Array {
  return recordedDemo(RECORDED, 25, 2);
}
