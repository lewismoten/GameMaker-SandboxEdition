// DEMO.REC: what plays on the title screen when nobody touches the keyboard: the start of the
// bot's own run through the first level (tools/gendemo.ts writes RECORDED), as pairs of [ticks
// since the last key, PC scan code; +128 = released], ending with Esc.
import { recordedDemo } from '@lewismoten/gamemaker-sandbox-tools/kit/recordedDemo';

const RECORDED: number[] = [1, 77, 20, 205, 39, 77, 30, 205, 3, 57, 2, 185, 0, 77, 20, 205, 4, 77, 20, 205, 31, 75, 40, 203, 31, 77, 56, 77, 25, 205, 57, 77, 60, 205, 3, 75, 25, 203, 33, 77];

export function demoRecording(): Uint8Array {
  return recordedDemo(RECORDED, 25, 2);
}
