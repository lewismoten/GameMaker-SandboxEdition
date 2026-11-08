// The Royal Code Wheel's puzzles in printables.json name the scenes where the 1994 desk lays the
// wheel beside the monitor (the engine's scene numbers). This checks them against the built
// game: each puzzle (known by its key) on its dungeon and the talks it shows there.
import { readFileSync } from 'node:fs';
import { CARVINGS, MINE_DOORS, type Key } from '../wheel/wheel';

const PLACES: [Key, string[]][] = [
  [CARVINGS.barrows.key, ['barrows', 'runes1']],
  [MINE_DOORS.key, ['mines', 'falsedr', 'minekey']],
  [CARVINGS.keep.key, ['keep', 'runes2']],
];

interface Puzzle {
  scenes: number[];
  turn: { inner: string; outer: string };
}

/** Throws when a puzzle's scenes in `printables` (a path) aren't where it is in the game. */
export function checkWheelScenes(ids: Map<string, number>, printables: string): void {
  const items = (JSON.parse(readFileSync(printables, 'utf8')) as { items: { kind: string; puzzles?: Puzzle[] }[] }).items;
  const puzzles = items.find((i) => i.kind === 'codewheel')?.puzzles ?? [];
  for (const [key, places] of PLACES) {
    const want = places.map((p) => ids.get(p)!).sort((a, b) => a - b);
    const p = puzzles.find((q) => q.turn.inner === key.rune && q.turn.outer === key.letter);
    const got = [...(p?.scenes ?? [])].sort((a, b) => a - b);
    if (want.join() !== got.join())
      throw new Error(
        `printables.json: the code wheel puzzle keyed ${key.rune} against ${key.letter} should list scenes [${want.join(', ')}], not [${got.join(', ')}]`,
      );
  }
}
