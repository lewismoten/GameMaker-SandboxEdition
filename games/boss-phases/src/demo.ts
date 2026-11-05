// DEMO.REC: what plays on the title screen when nobody touches the keyboard: the start of the
// bot's own run through the first level (tools/gendemo.ts writes RECORDED), as pairs of [ticks
// since the last key, PC scan code; +128 = released], ending with Esc.
import { recordedDemo } from '@lewismoten/gamemaker-sandbox-tools/kit/recordedDemo';

const RECORDED: number[] = [
  1, 77, 35, 205, 3, 77, 55, 205, 3, 77, 50, 205, 0, 75, 46, 203, 3, 77, 16, 205, 63, 28, 3, 156, 60, 28, 3, 156, 144, 28, 3, 156, 108, 28, 3, 156, 60, 77, 70,
  205, 3, 77, 25, 205, 3, 77,
];

export function demoRecording(): Uint8Array {
  return recordedDemo(RECORDED, 25, 2);
}
