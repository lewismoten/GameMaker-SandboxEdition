// DEMO.REC: what plays on the title screen when nobody touches the keyboard: the start of the
// bot's own run through the first level (tools/gendemo.ts writes RECORDED), as pairs of [ticks
// since the last key, PC scan code; +128 = released], ending with Esc.
import { recordedDemo } from '@lewismoten/gamemaker-sandbox-tools/kit/recordedDemo';

const RECORDED: number[] = [1, 77, 15, 205, 43, 77, 20, 205, 43, 77, 20, 205, 43, 77, 15, 205, 18, 77, 9, 57, 2, 185, 38, 205, 3, 77, 127, 205, 3, 77, 20, 205, 3, 77, 1, 77, 20, 205, 43, 77, 20, 205, 43, 77, 10, 205, 3, 77, 8, 57, 2, 185, 3, 205, 59, 77, 146, 205, 3, 77, 5, 205, 3, 72, 49, 200, 3, 77, 1, 205];

export function demoRecording(): Uint8Array {
  return recordedDemo(RECORDED, 25, 2);
}
