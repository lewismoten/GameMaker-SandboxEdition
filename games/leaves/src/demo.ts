// DEMO.REC: what plays on the title screen when nobody touches the keyboard: the bot's own run through the game
// (tools/gendemo.ts writes RECORDED), as pairs of [ticks since the last key, PC scan code; +128 = released], ending with Esc.
import { recordedDemo } from '@lewismoten/gamemaker-sandbox-tools/kit/recordedDemo';

const RECORDED: number[] = [41, 77, 48, 205, 43, 77, 15, 205, 123, 77, 45, 205, 43, 77, 15, 205, 123, 77, 45, 205, 43, 77, 15, 205, 243, 77, 91, 77, 58, 205, 173, 77, 65, 205, 105, 77, 65, 205, 105, 77];

export function demoRecording(): Uint8Array {
  return recordedDemo(RECORDED, 330, 2);
}
