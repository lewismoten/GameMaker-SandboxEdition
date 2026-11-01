// DEMO.REC: what plays on the title screen when nobody touches the keyboard: the start of the
// bot's own run in Jump Start (tools/gendemo.ts writes RECORDED), as pairs of [ticks since
// the last key, PC scan code; +128 = released], ending with Esc.
import { recordedDemo } from '@lewismoten/gamemaker-sandbox-tools/kit/recordedDemo';

const RECORDED: number[] = [
  13, 77, 8, 72, 10, 200, 8, 72, 10, 200, 8, 72, 10, 200, 10, 205, 6, 77, 20, 205, 6, 77, 5, 205, 6, 18, 12, 146, 0, 77, 3, 205, 3, 77, 10, 205, 6, 77, 8, 205,
  16, 75, 45, 203, 6, 77, 80, 205, 6, 57, 29, 185, 6, 77, 8, 72, 10, 200,
];

export function demoRecording(): Uint8Array {
  return recordedDemo(RECORDED, 30, 4);
}
