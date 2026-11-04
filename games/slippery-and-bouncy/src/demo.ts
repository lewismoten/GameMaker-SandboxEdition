// DEMO.REC: what plays on the title screen when nobody touches the keyboard (tools/gendemo.ts writes RECORDED).
import { recordedDemo } from '@lewismoten/gamemaker-sandbox-tools/kit/recordedDemo';

const RECORDED: number[] = [];

export function demoRecording(): Uint8Array {
  return recordedDemo(RECORDED, 25, 2);
}
