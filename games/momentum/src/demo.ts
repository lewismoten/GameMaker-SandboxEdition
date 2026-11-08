// DEMO.REC: what plays on the title screen when nobody touches the keyboard: the start of the
// bot's own run through the first level (tools/gendemo.ts writes RECORDED), as pairs of [ticks
// since the last key, PC scan code; +128 = released], ending with Esc.
import { recordedDemo } from '@lewismoten/gamemaker-sandbox-tools/kit/recordedDemo';

const RECORDED: number[] = [41, 77, 4, 205, 80, 77, 11, 205, 60, 77, 11, 205, 9, 77, 0, 205, 44, 77, 30, 205, 11, 77, 0, 205, 44, 77, 11, 205, 0, 75, 30, 203, 10, 77, 32, 205, 11, 77, 52, 57, 2, 185, 44, 77, 17, 205, 10, 77, 16, 57, 2, 185, 21, 205, 52, 77, 15, 57, 2, 185, 21, 205, 51, 77, 1, 205];

export function demoRecording(): Uint8Array {
  return recordedDemo(RECORDED, 25, 2);
}
