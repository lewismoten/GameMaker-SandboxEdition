// DEMO.REC: what plays on the title screen when nobody touches the keyboard: the start of the
// bot's own run through the first level (tools/gendemo.ts writes RECORDED), as pairs of [ticks
// since the last key, PC scan code; +128 = released], ending with Esc.
import { recordedDemo } from '@lewismoten/gamemaker-sandbox-tools/kit/recordedDemo';

const RECORDED: number[] = [41, 77, 35, 205, 11, 80, 15, 208, 3, 77, 30, 205, 11, 80, 20, 208, 3, 75, 25, 203, 11, 80, 56, 77, 20, 205, 11, 77, 5, 205, 3, 72, 5, 200, 3, 77, 5, 205, 3, 72, 5, 200, 3, 77, 5, 205, 3, 72, 5, 200, 3, 77, 5, 205, 3, 72, 5, 200, 43, 77, 25, 205, 3, 77, 5, 205, 3, 80, 5, 208, 3, 77, 5, 205, 3, 80, 5, 208, 3, 77, 5, 205, 3, 80, 5, 208, 3, 77, 5, 205, 3, 80, 5, 208, 11, 77, 56, 77, 10, 205, 3, 72, 20, 200, 3, 80, 20, 208, 3, 77, 20, 205, 11, 77, 20, 205, 3, 80, 20, 208, 3, 72, 20, 200, 3, 77, 15, 205, 3, 80, 6, 208, 40, 77];

export function demoRecording(): Uint8Array {
  return recordedDemo(RECORDED, 25, 2);
}
