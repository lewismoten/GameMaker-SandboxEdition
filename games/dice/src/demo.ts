// DEMO.REC: what plays on the title screen when nobody touches the keyboard: the start of the
// bot's own run through the first level (tools/gendemo.ts writes RECORDED), as pairs of [ticks
// since the last key, PC scan code; +128 = released], ending with Esc.
import { recordedDemo } from '@lewismoten/gamemaker-sandbox-tools/kit/recordedDemo';

const RECORDED: number[] = [1, 77, 15, 205, 48, 77, 25, 205, 48, 77, 15, 205, 41, 77, 10, 205, 31, 77, 80, 205, 3, 77, 30, 205, 0, 75, 40, 203, 3, 77, 5, 205, 3, 72, 49, 200, 3, 77, 35, 205, 3, 77, 13, 205, 13, 77, 20, 205, 3, 77];

export function demoRecording(): Uint8Array {
  return recordedDemo(RECORDED, 25, 2);
}
