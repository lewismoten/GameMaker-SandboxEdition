// DEMO.REC: what plays on the title screen when nobody touches the keyboard: the start of the
// bot's own run through the first level (tools/gendemo.ts writes RECORDED), as pairs of [ticks
// since the last key, PC scan code; +128 = released], ending with Esc.
import { recordedDemo } from '@lewismoten/gamemaker-sandbox-tools/kit/recordedDemo';

const RECORDED: number[] = [
  41, 77, 10, 205, 43, 77, 60, 205, 43, 77, 65, 205, 43, 77, 56, 77, 10, 205, 43, 77, 60, 205, 43, 77, 65, 205, 43, 77, 56, 77, 40, 205, 83, 77, 40, 205, 83,
  77, 40, 205, 83, 57, 2, 185, 0, 77, 20, 205, 4, 77, 21, 77, 35, 205, 83, 77, 65, 205, 83, 77,
];

export function demoRecording(): Uint8Array {
  return recordedDemo(RECORDED, 330, 2);
}
