// DEMO.REC: what plays on the title screen when nobody touches the keyboard: the start of the
// bot's own run through the first level (tools/gendemo.ts writes RECORDED), as pairs of [ticks
// since the last key, PC scan code; +128 = released], ending with Esc.
import { recordedDemo } from '@lewismoten/gamemaker-sandbox-tools/kit/recordedDemo';

const RECORDED: number[] = [21, 77, 15, 205, 43, 77, 28, 205, 43, 57, 2, 185, 63, 77, 25, 205, 53, 57, 2, 185];

export function demoRecording(): Uint8Array {
  return recordedDemo(RECORDED, 330, 2);
}
