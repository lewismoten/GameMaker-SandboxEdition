// demo.rec: what the title screen plays when nobody touches the keyboard. The checker's bot
// solves the toaster (switch on, wait for the gate, roll to the outlet), takes a look at
// the blender, then presses Esc.
import { serializeRecording, type RecordedKey } from '../../../web/src/formats/recording';
import type { Character } from '../../../web/src/formats/character';
import type { Board } from './levels/board';
import type { BlockSet } from './blocks/sets';
import { playSolution } from '../tools/verify';

export async function demoRecording(b: Board, tiles: BlockSet, mb: BlockSet, cb: BlockSet, chr: Character): Promise<Uint8Array> {
  const run = await playSolution(b, tiles, mb, cb, chr);
  if (!run.ok) throw new Error(`The demo run failed: ${run.why}`);
  const keys: RecordedKey[] = [];
  let last = 0;
  for (const k of run.keys) {
    const at = k.tick + 2; // +1: the board's card scene plays one tick before handing over
    keys.push({ delta: at - last, key: k.key });
    last = at;
  }
  // into the next board, a look around, then Esc (and its release) back to the menu
  keys.push({ delta: 90, key: 0x01 }, { delta: 2, key: 0x81 });
  return serializeRecording(keys);
}
