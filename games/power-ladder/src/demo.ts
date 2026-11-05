// DEMO.REC: what plays on the title screen when nobody touches the keyboard: the start of the
// bot's own run through the first level (tools/gendemo.ts writes RECORDED), as pairs of [ticks
// since the last key, PC scan code; +128 = released], ending with Esc.
import { recordedDemo } from '@lewismoten/gamemaker-sandbox-tools/kit/recordedDemo';

const RECORDED: number[] = [1, 77, 30, 205, 3, 77, 85, 205, 3, 77, 30, 205, 0, 75, 55, 203, 3, 75, 5, 203, 3, 72, 69, 200, 3, 77, 35, 205, 3, 75, 30, 203, 3, 75, 3, 203, 3, 80, 59, 208, 3, 77, 60, 205, 3, 77, 10, 205, 3, 77, 15, 205, 3, 77];

export function demoRecording(): Uint8Array {
  return recordedDemo(RECORDED, 25, 2);
}
