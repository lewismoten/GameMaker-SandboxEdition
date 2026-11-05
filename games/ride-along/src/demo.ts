// DEMO.REC: what plays on the title screen when nobody touches the keyboard: the start of the
// bot's own run through the first level (tools/gendemo.ts writes RECORDED), as pairs of [ticks
// since the last key, PC scan code; +128 = released], ending with Esc.
import { recordedDemo } from '@lewismoten/gamemaker-sandbox-tools/kit/recordedDemo';

const RECORDED: number[] = [
  1, 77, 33, 205, 43, 77, 27, 205, 43, 77, 3, 205, 3, 57, 2, 185, 0, 77, 10, 205, 6, 77, 18, 205, 3, 77, 12, 205, 44, 77, 30, 205, 43, 77,
];

export function demoRecording(): Uint8Array {
  return recordedDemo(RECORDED, 70, 2);
}
