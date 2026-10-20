// demo.rec: what the title screen plays when nobody touches the keyboard (filled in once
// the levels are done).
import { serializeRecording, type RecordedKey } from '../../web/src/formats/recording';

export const DEMO: RecordedKey[] = [];

export function demoRecording(): Uint8Array {
  return serializeRecording(DEMO);
}
