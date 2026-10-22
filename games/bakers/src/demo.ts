// demo.rec: what the title screen plays when nobody touches the keyboard. (Recorded by the
// play-testing bot; see tools/.)
import { serializeRecording } from '../../../web/src/formats/recording';
import type { Compiled } from './compile';

export async function demoRecording(all: Compiled): Promise<Uint8Array> {
  void all;
  return serializeRecording([{ delta: 60, key: 0x01 }, { delta: 2, key: 0x81 }]);
}
