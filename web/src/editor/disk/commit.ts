// Writes a merge's results: the changed files, the dropped file gone, the .gam saved. Refuses
// when a file changed since the merge was planned, so a stale preview never overwrites newer work.
import { serializeGame, type Game } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import type { GameFiles } from '../../project/files';

export interface Writes {
  /** New bytes per file; null deletes it. */
  files: Map<string, Uint8Array | null>;
  /** What each file was when planned. */
  before: Map<string, Uint8Array | undefined>;
  game: Game;
}

export const readFor = (files: GameFiles, before: Writes['before'], name: string): Uint8Array => {
  const b = files.get(name)!;
  before.set(name, b);
  return b;
};

export function commit(files: GameFiles, gam: string, w: Writes): void {
  for (const [n, b] of w.before) if (files.get(n) !== b) throw new Error(`${n} changed since the preview; open the disk tool again`);
  for (const [n, b] of w.files) {
    if (b) files.set(n, b);
    else files.delete(n);
  }
  files.set(gam, serializeGame(w.game));
}
