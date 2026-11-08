// DEMO.REC: what plays on the title screen when nobody touches the keyboard: the start of the bot's own walk
// through the first scene (tools/gendemo.ts writes RECORDED), as pairs of [ticks since the last key, PC scan
// code; +128 = released], ending with Esc.
import { recordedDemo } from '@lewismoten/gamemaker-sandbox-tools/kit/recordedDemo';

const RECORDED: number[] = [1, 77, 15, 205, 103, 77, 35, 205, 208, 77, 45, 205, 155, 77, 20, 205, 103, 77, 15, 205, 192, 77, 20, 205, 103, 77, 20, 205, 103, 77];

export function demoRecording(): Uint8Array {
  return recordedDemo(RECORDED, 25, 2);
}
