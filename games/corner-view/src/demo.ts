// DEMO.REC: what plays on the title screen when nobody touches the keyboard: the start of the
// bot's own run through the first level (tools/gendemo.ts writes RECORDED), as pairs of [ticks
// since the last key, PC scan code; +128 = released], ending with Esc.
import { recordedDemo } from '@lewismoten/gamemaker-sandbox-tools/kit/recordedDemo';

const RECORDED: number[] = [
  41, 77, 16, 205, 40, 72, 5, 200, 11, 77, 5, 205, 11, 72, 5, 200, 11, 77, 5, 205, 11, 72, 5, 200, 11, 77, 5, 205, 11, 77, 5, 205, 3, 80, 25, 208, 43, 75, 41,
  75, 11, 203, 40, 77, 10, 205, 3, 80, 15, 208, 11, 75, 30, 203, 43, 72, 15, 200, 3, 75,
];

export function demoRecording(): Uint8Array {
  return recordedDemo(RECORDED, 25, 2);
}
