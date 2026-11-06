// DEMO.REC: what plays on the title screen when nobody touches the keyboard: the start of the
// bot's own run through the first level (tools/gendemo.ts writes RECORDED), as pairs of [ticks
// since the last key, PC scan code; +128 = released], ending with Esc.
import { recordedDemo } from '@lewismoten/gamemaker-sandbox-tools/kit/recordedDemo';

export const RECORDED: number[] = [1, 77, 10, 205, 63, 77, 65, 205, 53, 77, 30, 205];

export function demoRecording(): Uint8Array {
  return recordedDemo(RECORDED, 25, 2);
}
