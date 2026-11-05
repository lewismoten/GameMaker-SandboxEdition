// DEMO.REC: what plays on the title screen when nobody touches the keyboard: the start of the
// bot's own run through the first level (tools/gendemo.ts writes RECORDED), as pairs of [ticks
// since the last key, PC scan code; +128 = released], ending with Esc.
import { recordedDemo } from '@lewismoten/gamemaker-sandbox-tools/kit/recordedDemo';

const RECORDED: number[] = [1, 77, 25, 205, 43, 77, 45, 205, 43, 77, 13, 205, 3, 57, 2, 185, 0, 77, 17, 205, 7, 77, 5, 205, 3, 77, 65, 205];

export function demoRecording(): Uint8Array {
  return recordedDemo(RECORDED, 70, 2);
}
