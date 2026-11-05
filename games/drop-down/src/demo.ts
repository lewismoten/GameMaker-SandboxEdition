// DEMO.REC: what plays on the title screen when nobody touches the keyboard: the start of the
// bot's own run through the first level (tools/gendemo.ts writes RECORDED), as pairs of [ticks
// since the last key, PC scan code; +128 = released], ending with Esc.
import { recordedDemo } from '@lewismoten/gamemaker-sandbox-tools/kit/recordedDemo';

const RECORDED: number[] = [
  41, 77, 20, 205, 43, 77, 35, 205, 43, 77, 40, 205, 3, 57, 20, 185, 3, 77, 5, 205, 3, 77, 14, 205, 40, 28, 3, 156, 24, 28, 3, 156, 26, 77, 6, 57, 2, 185, 25,
  205, 3, 77, 10, 205,
];

export function demoRecording(): Uint8Array {
  return recordedDemo(RECORDED, 150, 2);
}
