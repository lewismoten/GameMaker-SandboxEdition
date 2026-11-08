// DEMO.REC: what plays on the title screen when nobody touches the keyboard: the start of the
// bot's own run through the first level (tools/gendemo.ts writes RECORDED), as pairs of [ticks
// since the last key, PC scan code; +128 = released], ending with Esc.
import { recordedDemo } from '@lewismoten/gamemaker-sandbox-tools/kit/recordedDemo';

const RECORDED: number[] = [1, 77, 60, 205, 27, 77, 5, 205, 3, 57, 2, 185, 0, 77, 10, 205, 14, 77, 15, 205, 3, 77, 25, 205, 27, 75, 0, 203, 3, 77, 10, 205, 40, 57, 2, 185, 0, 75, 25, 203, 3, 77, 27, 205, 3, 77, 15, 205, 27, 77, 10, 205];

export function demoRecording(): Uint8Array {
  return recordedDemo(RECORDED, 25, 2);
}
