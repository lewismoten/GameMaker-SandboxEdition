// DEMO.REC: what plays on the title screen when nobody touches the keyboard: the bot's run
// through the last gap in the second level (tools/gendemo.ts writes RECORDED), as pairs of [ticks
// since the last key, PC scan code; +128 = released], ending with Esc.
import { recordedDemo } from '@lewismoten/gamemaker-sandbox-tools/kit/recordedDemo';

const RECORDED: number[] = [41, 77, 4, 205, 80, 77, 10, 205, 60, 77, 12, 205, 9, 77, 0, 205, 44, 77, 29, 205, 11, 77, 0, 205, 44, 77, 12, 205, 0, 75, 30, 203, 10, 77, 31, 205, 11, 77, 52, 57, 2, 185, 44, 77, 16, 205, 9, 77, 17, 57, 2, 185, 21, 205, 52, 77, 15, 57, 2, 185, 21, 205, 51, 77, 19, 57, 2, 185, 21, 205, 12, 77, 2, 205];

export function demoRecording(): Uint8Array {
  return recordedDemo(RECORDED, 25, 2);
}
