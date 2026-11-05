// DEMO.REC: what plays on the title screen when nobody touches the keyboard: the start of the
// bot's own run through the first level (tools/gendemo.ts writes RECORDED), as pairs of [ticks
// since the last key, PC scan code; +128 = released], ending with Esc.
import { recordedDemo } from '@lewismoten/gamemaker-sandbox-tools/kit/recordedDemo';

const RECORDED: number[] = [
  21, 80, 5, 208, 0, 75, 16, 203, 40, 80, 0, 77, 10, 205, 195, 208, 40, 80, 65, 208, 40, 80, 150, 208, 0, 80, 86, 80, 5, 208, 40, 80, 0, 77, 5, 205, 15, 77, 5,
  205, 15, 77, 5, 205, 15, 77, 5, 205, 15, 77, 5, 205, 15, 77, 5, 205, 15, 77, 5, 205, 15, 77, 5, 205, 15, 77, 5, 205, 15, 77, 5, 205, 15, 77, 5, 205, 15, 77,
  5, 205, 10, 208, 40, 80, 5, 77, 5, 205, 15, 77, 5, 205, 15, 77, 5, 205, 15, 77, 5, 205, 15, 77, 5, 205, 15, 77, 5, 205, 15, 77, 5, 205, 15, 77, 5, 205, 15,
  77, 5, 205, 15, 77, 5, 205, 15, 77, 5, 205, 15, 77, 5, 205, 15, 77, 5, 205, 15, 77, 5, 205, 15, 77, 5, 205, 15, 77, 5, 205, 15, 77, 5, 205, 15, 77, 5, 205,
  15, 77, 5, 205, 15, 77, 5, 205, 15, 77, 5, 205, 15, 77, 5, 205, 15, 77, 5, 205, 15, 77, 5, 205, 15, 77, 5, 205, 15, 77, 5, 205,
];

export function demoRecording(): Uint8Array {
  return recordedDemo(RECORDED, 25, 2);
}
