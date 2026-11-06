// DEMO.REC: what plays on the title screen when nobody touches the keyboard: the bot's own run through the first
// level and the start of the second (tools/gendemo.ts writes RECORDED), as pairs of [ticks since the last key, PC scan
// code; +128 = released], ending with Esc.
import { recordedDemo } from '@lewismoten/gamemaker-sandbox-tools/kit/recordedDemo';

const RECORDED: number[] = [
  21, 77, 20, 205, 110, 77, 40, 205, 80, 77, 50, 205, 70, 77, 21, 77, 20, 205, 33, 77, 25, 205, 33, 77, 18, 205, 7, 75, 3, 57, 2, 185, 10, 203, 69, 57, 2, 185,
  0, 77, 18, 205, 14, 57, 2, 185, 0, 77, 20, 205, 12, 57, 2, 185, 0, 77, 20, 205, 12, 57, 2, 185, 0, 77, 22, 205, 3, 77,
];

export function demoRecording(): Uint8Array {
  return recordedDemo(RECORDED, 25, 2);
}
