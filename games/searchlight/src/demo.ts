// DEMO.REC: what plays on the title screen when nobody touches the keyboard: the start of the
// bot's own run through the first level (tools/gendemo.ts writes RECORDED), as pairs of [ticks
// since the last key, PC scan code; +128 = released], ending with Esc.
import { recordedDemo } from '@lewismoten/gamemaker-sandbox-tools/kit/recordedDemo';

const RECORDED: number[] = [1, 77, 35, 205, 3, 77, 30, 205, 305, 77, 14, 205, 0, 75, 4, 57, 2, 185, 8, 57, 2, 185, 14, 203, 56, 77, 31, 205];

export function demoRecording(): Uint8Array {
  return recordedDemo(RECORDED, 250, 2);
}
