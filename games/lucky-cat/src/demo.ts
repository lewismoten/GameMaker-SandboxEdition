// DEMO.REC: what plays on the title screen when nobody touches the keyboard: the start of the bot's own run
// through the first level (tools/gendemo.ts writes RECORDED), as pairs of [ticks since the last key, PC scan
// code; +128 = released], ending with Esc.
import { recordedDemo } from '@lewismoten/gamemaker-sandbox-tools/kit/recordedDemo';

const RECORDED: number[] = [1, 77, 10, 205, 103, 77, 40, 205, 3, 75, 5, 203, 3, 72, 39, 200, 3, 77, 20, 205, 3, 77, 28, 205, 11, 77, 20, 205, 3, 57, 8, 185, 0, 77, 13, 205, 4, 77, 30, 205, 3, 75, 5, 203, 3, 72, 39, 200, 3, 77, 20, 205, 3, 77, 18, 205, 11, 77, 15, 205, 3, 77, 3, 57, 8, 185, 18, 205, 7, 77, 5, 205, 103, 77, 55, 205, 3, 57, 8, 185, 0, 77, 13, 205, 54, 77];

export function demoRecording(): Uint8Array {
  return recordedDemo(RECORDED, 25, 2);
}
