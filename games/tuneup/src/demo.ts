// DEMO.REC: what plays on the title screen when nobody touches the keyboard: the start of the
// bot's own run in the Piano Shop (tools/gendemo.ts writes RECORDED), as pairs of [ticks since
// the last key, PC scan code; +128 = released], ending with Esc.
import { recordedDemo } from '@lewismoten/gamemaker-sandbox-tools/kit/recordedDemo';

const RECORDED: number[] = [
  4, 77, 16, 205, 6, 75, 27, 203, 17, 77, 8, 205, 6, 77, 31, 72, 10, 200, 8, 205, 6, 18, 12, 146, 0, 77, 15, 205, 3, 77, 4, 205, 6, 77, 3, 72, 10, 200, 7, 72,
  10, 200, 7, 72, 10, 200, 7, 72, 10, 200, 7, 72, 10, 200, 7, 72, 10, 200, 4, 205, 6, 77, 12, 205, 6, 77, 11, 205, 18, 18, 12, 146, 0, 77, 3, 205, 3, 77, 4,
  205, 6, 77, 6, 205, 17, 77, 3, 72, 10, 200, 8, 205, 6, 77,
];

export function demoRecording(): Uint8Array {
  return recordedDemo(RECORDED, 30, 4);
}
