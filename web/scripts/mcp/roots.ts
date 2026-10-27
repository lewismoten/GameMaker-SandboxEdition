// The folders the MCP server may touch. Writable roots come from --root (or GM_MCP_ROOTS, split
// by the path separator); --read-root adds read-only ones. This repository's games/ (each game's
// built disk/) and cd/gameware/ are always readable and never writable, and neither is any of
// code/, cd/ or runtime/. With no writable root, copies go to a scratch folder in the system's
// temporary folder, which then is the one writable root. Paths are compared after resolving
// links, so a link can't lead out.
import { existsSync, mkdirSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ToolError } from '../../src/assistant/tools/types';

/** The repository's root (web/scripts/mcp is three folders down). */
export const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
export const GAMES_DIR = join(REPO, 'games');
export const CD_GAMES_DIR = join(REPO, 'cd', 'gameware');
/** Never written: the games' sources and built disks, and the original release. */
const PROTECTED = ['games', 'cd', 'code', 'runtime', '.git'].map((d) => join(REPO, d));

/** A path with its links resolved, as far as it exists (a file still to be made resolves its folder). */
function real(p: string): string {
  const abs = resolve(p);
  if (existsSync(abs)) return realpathSync(abs);
  const parent = dirname(abs);
  return parent === abs ? abs : join(real(parent), abs.slice(parent.length + 1));
}

const within = (p: string, root: string) => {
  const r = relative(root, p);
  return r === '' || (!!r && !r.startsWith('..') && !isAbsolute(r));
};

export class Roots {
  readonly write: string[];
  readonly read: string[];
  /** The writable root copies go to by default. */
  readonly scratch: string;

  constructor(write: string[], read: string[] = []) {
    if (!write.length) write = [join(tmpdir(), 'gamemaker-mcp')];
    this.write = write.map((w) => {
      const r = real(w);
      // a root may hold this repository (writable() still keeps out of its games), but not be inside them
      if (PROTECTED.some((p) => within(r, real(p))))
        throw new Error(`${w} can't be a writable root: it is in this repository's games, CD or original source, which are never written.`);
      mkdirSync(r, { recursive: true });
      return real(r);
    });
    this.scratch = this.write[0];
    this.read = [...this.write, ...read.map(real), real(GAMES_DIR), real(CD_GAMES_DIR)];
  }

  /** From the command line and environment: --root <dir> (repeatable), --read-root <dir>, GM_MCP_ROOTS. */
  static fromArgs(argv: string[], env: NodeJS.ProcessEnv): Roots {
    const write: string[] = [];
    const read: string[] = [];
    for (let i = 0; i < argv.length; i++) {
      if (argv[i] === '--root' && argv[i + 1]) write.push(argv[++i]);
      else if (argv[i] === '--read-root' && argv[i + 1]) read.push(argv[++i]);
    }
    for (const p of (env.GM_MCP_ROOTS ?? '').split(delimiter)) if (p.trim()) write.push(p.trim());
    return new Roots(write, read);
  }

  /** A path to read from: resolved, and refused unless it is inside a root. */
  readable(p: string): string {
    const r = real(p);
    if (!this.read.some((root) => within(r, root))) throw new ToolError(`${p} is outside the folders this server was given (${this.read.join(', ')}).`);
    return r;
  }

  /** A path to write to: resolved, and refused unless it is inside a writable root and outside the protected folders. */
  writable(p: string): string {
    const r = real(p);
    if (!this.write.some((root) => within(r, root))) throw new ToolError(`${p} is outside the writable folders (${this.write.join(', ')}).`);
    if (PROTECTED.some((d) => within(r, real(d)))) throw new ToolError(`${p} is in this repository’s games or original files, which are never written.`);
    return r;
  }

  isWritable(p: string): boolean {
    try {
      this.writable(p);
      return true;
    } catch {
      return false;
    }
  }
}
