// A GameContext over files in memory: the MCP server's (which writes them to the working folder
// on save) and the tests'. Each applied change is remembered by name until `saved()`.
import type { GameFiles } from '../../project/files';
import type { PlayerPatches } from '../../dosPlayer/patchRules';
import type { Change, GameContext } from './types';

export class MemoryContext implements GameContext {
  /** Files changed (or deleted) since the last save, and whether the player patches changed. */
  readonly dirty = new Set<string>();
  patchesDirty = false;
  readOnly = false;
  saveArtifact?: GameContext['saveArtifact'];

  constructor(
    readonly files: GameFiles,
    readonly gam: string,
    private patches: PlayerPatches = {},
  ) {}

  playerPatches(): PlayerPatches {
    return { ...this.patches };
  }

  async apply(change: Change): Promise<void> {
    for (const [n, b] of Object.entries(change.files ?? {})) {
      if (b) this.files.set(n, b);
      else this.files.delete(n);
      this.dirty.add(n);
    }
    if (change.player) {
      this.patches = { ...change.player };
      this.patchesDirty = true;
    }
  }

  saved(): void {
    this.dirty.clear();
    this.patchesDirty = false;
  }
}
