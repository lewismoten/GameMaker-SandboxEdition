// DEMO.REC: what plays on the title screen when nobody touches the keyboard: the bot's own run
// (tools/gendemo.ts writes RECORDED), as pairs of [ticks since the last key, PC scan code;
// +128 = released], ending with Esc.
import { recordedDemo } from '@lewismoten/gamemaker-sandbox-tools/kit/recordedDemo';

const RECORDED: number[] = [41, 77, 75, 205, 153, 77, 75, 205, 43, 77, 45, 205, 223, 77, 60, 205, 43, 77];

export function demoRecording(): Uint8Array {
  return recordedDemo(RECORDED, 25, 2);
}
