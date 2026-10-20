// demo.rec: what the title screen plays when nobody touches the keyboard. Sir Grit picks
// up his shovel, digs into the ring of dunes around Anthill Keep, flings sand at the ants
// and scoops up some sand. Recorded from a real run (ticks of 1/18.2 s between key events;
// a ^ marks a key being let go).
import { serializeRecording, type RecordedKey } from '../../web/src/formats/recording';

const SCAN: Record<string, number> = { up: 0x48, down: 0x50, left: 0x4b, right: 0x4d, space: 0x39, p: 0x19, enter: 0x1c, esc: 0x01 };

const EVENTS: [number, string][] = [
  [20, 'up'],
  [4, 'up^'],
  [1, 'right'],
  [4, 'right^'],
  [5, 'p'],
  [0, 'p^'],
  [9, 'space'],
  [2, 'space^'],
  [9, 'up'],
  [24, 'up^'],
  [2, 'right'],
  [20, 'right^'],
  [1, 'up'],
  [9, 'up^'],
  [6, 'right'],
  [2, 'right^'],
  [4, 'space'],
  [1, 'space^'],
  [9, 'down'],
  [9, 'down^'],
  [1, 'left'],
  [2, 'left^'],
  [1, 'right'],
  [39, 'right^'],
  [1, 'up'],
  [19, 'up^'],
  [1, 'right'],
  [4, 'right^'],
  [1, 'up'],
  [1, 'up^'],
  [0, 'space'],
  [2, 'space^'],
  [9, 'space'],
  [1, 'space^'],
  [10, 'up'],
  [11, 'up^'],
  [1, 'right'],
  [16, 'right^'],
  [1, 'space'],
  [2, 'space^'],
  [11, 'down'],
  [31, 'down^'],
  [1, 'down'],
  [4, 'down^'],
  [1, 'up'],
  [4, 'up^'],
  [1, 'left'],
  [36, 'left^'],
  [1, 'left'],
  [1, 'left^'],
  [0, 'space'],
  [2, 'space^'],
  [40, 'esc'],
  [2, 'esc^'],
];

export function buildDemo(): Uint8Array {
  const keys: RecordedKey[] = EVENTS.map(([delta, name]) => ({ delta, key: SCAN[name.replace('^', '')] | (name.endsWith('^') ? 0x80 : 0) }));
  return serializeRecording(keys);
}
