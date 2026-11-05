// DEMO.REC: what plays on the title screen when nobody touches the keyboard: the start of the
// bot's own run through the first level (tools/gendemo.ts writes RECORDED), as pairs of [ticks
// since the last key, PC scan code; +128 = released], ending with Esc.
import { recordedDemo } from '@lewismoten/gamemaker-sandbox-tools/kit/recordedDemo';

const RECORDED: number[] = [1, 77, 70, 205, 3, 77, 3, 57, 2, 185, 18, 205, 47, 77, 65, 205, 43, 77, 15, 205, 3, 77, 35, 205, 3, 77, 21, 77, 70, 205, 3, 77, 15, 205, 43, 77, 1, 205];

export function demoRecording(): Uint8Array {
  return recordedDemo(RECORDED, 25, 2);
}
