// demo.rec: what the title screen plays when nobody touches the keyboard.
import { serializeRecording } from '../../web/src/formats/recording';
import type { Stage } from './stage';

export async function demoRecording(_s: Stage): Promise<Uint8Array> {
  return serializeRecording([
    { delta: 400, key: 1 },
    { delta: 2, key: 0x81 },
  ]);
}
