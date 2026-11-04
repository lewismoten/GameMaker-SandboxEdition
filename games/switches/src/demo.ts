// DEMO.REC: what plays on the title screen when nobody touches the keyboard: the start of the
// bot's own run through the first level (tools/gendemo.ts writes RECORDED), as pairs of [ticks
// since the last key, PC scan code; +128 = released], ending with Esc.
import { recordedDemo } from '@lewismoten/gamemaker-sandbox-tools/kit/recordedDemo';

const RECORDED: number[] = [
  1, 77, 45, 205, 3, 77, 9, 57, 2, 185, 14, 205, 50, 77, 40, 205, 3, 57, 2, 185, 0, 77, 25, 205, 3, 77, 31, 77, 40, 205, 3, 77, 9, 57, 2, 185, 19, 57, 2, 185,
  48, 77, 45, 205, 3, 57, 2, 185, 0, 77, 25, 205, 3, 77,
];

export function demoRecording(): Uint8Array {
  return recordedDemo(RECORDED, 25, 2);
}
