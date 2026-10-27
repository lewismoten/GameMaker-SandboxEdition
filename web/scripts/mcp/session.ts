// The game the MCP server has open: its files in memory (a MemoryContext the shared tools work
// on), and the working folder its changes are saved to. A folder inside a writable root is
// edited where it is; anything else (a zip, this repository's games, the CD's, a folder only
// readable) is copied, on its first save, to a working folder the user names or a new one in
// the scratch root. Nothing is written before save, and only inside the working folder.
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { GameFiles } from '../../src/project/files';
import { newGame, serializeGame } from '../../src/formats/game';
import { backupEntries, emptyCompanion, setSection } from '../../src/project/companion';
import { PLAYER_SECTION, playerRecord } from '../../src/dosPlayer/playerRecord';
import { MemoryContext } from '../../src/assistant/tools/memoryContext';
import { ToolError } from '../../src/assistant/tools/types';
import { loadGame } from './sources';
import type { Roots } from './roots';

/** Where an assistant's own files (walkthroughs) go inside the working folder: a subfolder, never among the game's files. */
const ARTIFACTS = 'assistant';

export class OpenGame {
  /** The working folder has been written (a copy made, or the folder edited in place). */
  private written: boolean;

  constructor(
    readonly ctx: MemoryContext,
    readonly source: string,
    readonly workdir: string,
    inPlace: boolean,
  ) {
    this.written = inPlace;
    ctx.saveArtifact = async (name, bytes) => {
      const dir = join(this.workdir, ARTIFACTS);
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, name), bytes);
      return join(dir, name);
    };
  }

  /** Changed since opening or the last save. */
  get changed(): boolean {
    return this.ctx.dirty.size > 0 || this.ctx.patchesDirty;
  }

  get unsaved(): string[] {
    return this.written ? [...this.ctx.dirty, ...(this.ctx.patchesDirty ? ['(DOS player patches)'] : [])] : this.ctx.files.names();
  }

  /** Writes the changes (the whole game the first time a copy is saved); dry: only lists them. */
  save(dry: boolean): { written: string[]; deleted: string[]; workdir: string } {
    const companion = `${this.ctx.gam.replace(/\.gam$/, '')}.gmx`;
    const names = this.written ? [...this.ctx.dirty] : this.ctx.files.names();
    const written = names.filter((n) => this.ctx.files.has(n));
    const deleted = names.filter((n) => !this.ctx.files.has(n));
    const patches = this.ctx.patchesDirty || (!this.written && Object.keys(this.ctx.playerPatches()).length);
    if (patches) written.push(companion);
    if (dry) return { written, deleted, workdir: this.workdir };
    mkdirSync(this.workdir, { recursive: true });
    // a file already there keeps its name's case; a new one is named as DOS would (upper case)
    const there = new Map(readdirSync(this.workdir).map((f) => [f.toLowerCase(), f]));
    const path = (n: string) => join(this.workdir, there.get(n) ?? n.toUpperCase());
    for (const n of written) if (n !== companion) writeFileSync(path(n), this.ctx.files.get(n)!);
    for (const n of deleted) if (there.has(n)) rmSync(path(n));
    if (patches) {
      const c = emptyCompanion();
      setSection(c, this.ctx.gam, PLAYER_SECTION, playerRecord(this.ctx.playerPatches()));
      const entry = backupEntries(new GameFiles(), this.ctx.gam, c)[0];
      if (entry) writeFileSync(path(companion), entry.data);
      else if (there.has(companion)) rmSync(path(companion));
    }
    this.written = true;
    this.ctx.saved();
    return { written, deleted, workdir: this.workdir };
  }
}

/** A new folder name in `root` from `stem` (stem, stem-2, …). */
function freeFolder(root: string, stem: string): string {
  const base = stem.replace(/[^\w.-]+/g, '-').slice(0, 40) || 'game';
  for (let i = 1; ; i++) {
    const p = join(root, i === 1 ? base : `${base}-${i}`);
    if (!existsSync(p)) return p;
  }
}

/** A working folder the user named: writable, and empty or new (never another game's folder). */
function namedWorkdir(roots: Roots, workdir: string): string {
  const p = roots.writable(workdir);
  if (existsSync(p) && readdirSync(p).length) throw new ToolError(`${workdir} is not empty; name a new or empty folder for the copy.`);
  return p;
}

export async function openGame(roots: Roots, source: string, opt: { gam?: string; workdir?: string; readOnly?: boolean } = {}): Promise<OpenGame> {
  const g = await loadGame(source, roots, opt.gam);
  const ctx = new MemoryContext(g.files, g.gam, g.patches);
  ctx.readOnly = !!opt.readOnly;
  if (g.folder && !opt.workdir) return new OpenGame(ctx, source, g.folder, true);
  const workdir = opt.workdir ? namedWorkdir(roots, opt.workdir) : freeFolder(roots.scratch, `${g.stem}-copy`);
  return new OpenGame(ctx, source, workdir, false);
}

/** A new game: just its .gam (title and game-over scenes), saved to a new working folder. */
export function createGame(roots: Roots, title: string, workdir?: string): OpenGame {
  const stem =
    title
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 8) || 'game';
  const gam = `${stem}.gam`;
  const files = new GameFiles([[gam, serializeGame(newGame(title))]]);
  const dir = workdir ? namedWorkdir(roots, workdir) : freeFolder(roots.scratch, stem);
  return new OpenGame(new MemoryContext(files, gam), `new:${title}`, dir, false);
}
