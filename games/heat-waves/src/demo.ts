// DEMO.REC: what plays on the title screen when nobody touches the keyboard: the bot's own run through the game
// (tools/gendemo.ts writes RECORDED), as pairs of [ticks since the last key, PC scan code; +128 = released], ending with Esc.
import { recordedDemo } from '@lewismoten/gamemaker-sandbox-tools/kit/recordedDemo';

const RECORDED: number[] = [127, 77, 15, 205, 43, 77, 65, 77, 5, 205, 3, 77, 5, 205, 3, 77, 5, 205, 3, 77, 5, 205, 3, 77, 5, 205, 3, 77, 5, 205, 3, 77, 5, 205, 3, 77, 5, 205, 3, 77, 5, 205, 3, 77, 5, 205, 3, 77, 5, 205, 3, 77, 5, 205, 3, 77, 5, 205, 3, 77, 5, 205, 3, 77, 5, 205, 3, 77, 5, 205, 3, 77, 5, 205, 3, 77, 5, 205, 3, 77, 5, 205, 3, 77, 5, 205, 3, 77, 5, 205, 43, 77, 5, 205, 3, 77, 5, 205, 3, 77, 5, 205, 3, 77, 5, 205, 3, 77, 5, 205, 3, 77, 5, 205, 3, 77, 5, 205, 3, 77, 5, 205, 3, 77, 5, 205, 3, 77, 5, 205, 3, 77, 5, 205, 3, 77, 5, 205, 3, 77, 5, 205, 3, 77, 5, 205, 3, 77, 5, 205, 3, 77, 60, 77, 10, 205, 43, 77];

export function demoRecording(): Uint8Array {
  return recordedDemo(RECORDED, 330, 2);
}
