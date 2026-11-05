// DEMO.REC: what plays on the title screen when nobody touches the keyboard: the start of the
// bot's own run through the first level (tools/gendemo.ts writes RECORDED), as pairs of [ticks
// since the last key, PC scan code; +128 = released], ending with Esc.
import { recordedDemo } from '@lewismoten/gamemaker-sandbox-tools/kit/recordedDemo';

const RECORDED: number[] = [
  21, 77, 40, 205, 0, 80, 8, 208, 47, 77, 85, 205, 40, 77, 80, 205, 40, 77, 106, 77, 45, 205, 0, 72, 38, 200, 80, 80, 30, 208, 0, 77, 30, 205, 40, 77, 120, 205,
  40, 72,
];

export function demoRecording(): Uint8Array {
  return recordedDemo(RECORDED, 25, 2);
}
