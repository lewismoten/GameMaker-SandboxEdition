// DEMO.REC: what plays on the title screen when nobody touches the keyboard (tools/gendemo.ts writes RECORDED).
import { recordedDemo } from '@lewismoten/gamemaker-sandbox-tools/kit/recordedDemo';

const RECORDED: number[] = [1, 77, 35, 205, 43, 77, 15, 205, 3, 77, 14, 205, 130, 77, 15, 205, 43, 77, 25, 205, 3, 57, 2, 185, 36, 77, 23, 205, 14, 77, 35, 205, 3, 77, 11, 77, 25, 205, 43, 77, 15, 205, 3, 77, 6, 205, 120, 77, 44, 205, 3, 77, 45, 77, 20, 205, 43, 77, 5, 205, 3, 77, 29, 205, 23, 77, 22, 205, 13, 77, 12, 205, 43, 77, 12, 205, 3, 77, 9, 205, 61, 77, 13, 57, 2, 185, 9, 205, 55, 77, 33, 205, 3, 77];

export function demoRecording(): Uint8Array {
  return recordedDemo(RECORDED, 25, 2);
}
