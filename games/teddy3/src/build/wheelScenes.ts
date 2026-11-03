// The Face Dial's puzzle in printables.json names the scene where the 1994 desk lays the dial
// beside the monitor (the engine's scene number). This checks it against the built game: the
// puzzle (known by its face) must list Firefly Meadow's scene (a level's scene is its place in
// the list, after the title and the ending).
import { readFileSync } from 'node:fs';
import type { Level } from '../levels/level';

interface Puzzle {
  scenes: number[];
  turn: { inner: string; outer: string };
}

/** Throws when the Gwinn puzzle's scenes in `printables` (a path) aren't Firefly Meadow's. */
export function checkWheelScenes(levels: Level[], printables: string): void {
  const items = (JSON.parse(readFileSync(printables, 'utf8')) as { items: { kind: string; puzzles?: Puzzle[] }[] }).items;
  const puzzles = items.find((i) => i.kind === 'codewheel')?.puzzles ?? [];
  const want = [levels.findIndex((l) => l.file === 'meadow') + 2];
  const got = puzzles.find((q) => q.turn.inner === 'Gwinn' && q.turn.outer === 'Gwinn')?.scenes ?? [];
  if (want.join() !== got.join())
    throw new Error(`printables.json: the Face Dial puzzle for Gwinn's face should list scenes [${want.join(', ')}], not [${got.join(', ')}]`);
}
