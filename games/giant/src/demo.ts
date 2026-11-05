// DEMO.REC: what plays on the title screen when nobody touches the keyboard: the start of the
// bot's own run through the first level (tools/gendemo.ts writes RECORDED), as pairs of [ticks
// since the last key, PC scan code; +128 = released], ending with Esc.
import { recordedDemo } from '@lewismoten/gamemaker-sandbox-tools/kit/recordedDemo';

const RECORDED: number[] = [
  1, 77, 35, 205, 3, 77, 30, 205, 3, 77, 3, 57, 2, 185, 10, 205, 13, 77, 13, 205, 4, 28, 3, 156, 60, 28, 3, 156, 60, 28, 3, 156, 60, 75, 8, 57, 2, 185, 15, 203,
  8, 77,
];

export function demoRecording(): Uint8Array {
  return recordedDemo(RECORDED, 25, 2);
}
