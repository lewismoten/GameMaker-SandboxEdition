// DEMO.REC: what plays on the title screen when nobody touches the keyboard: the start of the
// bot's own run through the first level (tools/gendemo.ts writes RECORDED), as pairs of [ticks
// since the last key, PC scan code; +128 = released], ending with Esc.
import { recordedDemo } from '@lewismoten/gamemaker-sandbox-tools/kit/recordedDemo';

const RECORDED: number[] = [21, 77, 33, 205, 43, 77, 10, 205, 163, 77, 35, 205, 43, 77, 35, 205, 303, 77, 20, 205, 43, 77, 30, 205, 3, 28, 3, 156];

export function demoRecording(): Uint8Array {
  return recordedDemo(RECORDED, 60, 2); // the wait lets the last rocket climb, burst and fade before Esc
}
