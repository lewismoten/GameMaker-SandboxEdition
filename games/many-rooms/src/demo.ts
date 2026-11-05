// DEMO.REC: what plays on the title screen when nobody touches the keyboard (tools/gendemo.ts writes RECORDED).
import { recordedDemo } from '@lewismoten/gamemaker-sandbox-tools/kit/recordedDemo';

const RECORDED: number[] = [1, 75, 10, 203, 3, 77];

export function demoRecording(): Uint8Array {
  return recordedDemo(RECORDED, 45, 2);
}
