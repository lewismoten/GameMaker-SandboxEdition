// DEMO.REC: what plays on the title screen when nobody touches the keyboard: the start of the
// bot's own run through the first level (tools/gendemo.ts writes RECORDED), as pairs of [ticks
// since the last key, PC scan code; +128 = released], ending with Esc.
import { recordedDemo } from '@lewismoten/gamemaker-sandbox-tools/kit/recordedDemo';

const RECORDED: number[] = [
  41, 77, 45, 205, 83, 77, 55, 205, 83, 77, 55, 205, 83, 77, 86, 77, 95, 205, 83, 77, 40, 205, 123, 77, 60, 205, 123, 77, 41, 77, 35, 205, 83, 77, 55, 205, 83,
  77, 55, 205, 83, 77,
];

export function demoRecording(): Uint8Array {
  return recordedDemo(RECORDED, 330, 2);
}
