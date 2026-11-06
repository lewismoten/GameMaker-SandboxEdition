// DEMO.REC: what plays on the title screen when nobody touches the keyboard: the start of the
// bot's own run through the first level (tools/gendemo.ts writes RECORDED), as pairs of [ticks
// since the last key, PC scan code; +128 = released], ending with Esc.
import { recordedDemo } from '@lewismoten/gamemaker-sandbox-tools/kit/recordedDemo';

const RECORDED: number[] = [1, 77, 10, 205, 43, 28, 3, 156, 60, 77, 40, 205, 3, 77, 15, 205, 43, 28, 3, 156, 60, 77, 35, 205, 3, 28, 3, 156, 60, 77, 30, 205, 43, 28, 3, 156, 60, 75, 65, 203, 3, 75, 20, 203, 3, 77, 85, 205, 3, 28, 3, 156, 60, 77, 45, 205, 3, 77, 16, 77, 10, 205, 43, 77, 30, 205, 3, 77, 50, 205, 3, 28, 3, 156, 60, 75, 40, 203, 43, 77, 10, 205, 3, 57, 2, 185, 0, 77, 10, 205, 10, 77, 18, 205, 43, 28, 3, 156, 60, 77, 10, 205, 3, 28, 3, 156, 60, 77, 55, 205, 3, 28, 3, 156];

export function demoRecording(): Uint8Array {
  return recordedDemo(RECORDED, 25, 2);
}
