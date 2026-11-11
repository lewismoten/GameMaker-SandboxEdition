// MCP file access: check the root policy at use time and never follow a child symlink.
import { closeSync, constants, fstatSync, ftruncateSync, lstatSync, mkdirSync, openSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import { ToolError } from '../../src/assistant/tools/types';
import type { Roots } from './roots';

function checked(roots: Roots, path: string, write: boolean): string {
  const p = resolve(path);
  const allowed = write ? roots.writable(p) : roots.readable(p);
  if (p !== allowed) throw new ToolError(`${path}: symbolic links are not allowed.`);
  return p;
}

/** Direct children only, including artifact names supplied by tools. */
export function childPath(dir: string, name: string): string {
  if (!name || basename(name) !== name || name === '.' || name === '..' || name.includes('\\')) throw new ToolError('Expected a file name.');
  return resolve(dir, name);
}

export function makeDirectory(roots: Roots, path: string): void {
  const p = checked(roots, path, true);
  mkdirSync(p, { recursive: true });
  checked(roots, p, true);
}

/** Open without truncating; verify the opened inode against the authorized entry before I/O. */
function file<T>(roots: Roots, path: string, write: boolean, use: (fd: number) => T): T {
  const p = checked(roots, path, write);
  if (write) checked(roots, dirname(p), true);
  const fd = openSync(p, constants.O_NOFOLLOW | constants.O_NONBLOCK | (write ? constants.O_WRONLY | constants.O_CREAT : constants.O_RDONLY), 0o600);
  try {
    const opened = fstatSync(fd);
    checked(roots, p, write);
    const entry = lstatSync(p);
    if (!opened.isFile() || !entry.isFile() || opened.dev !== entry.dev || opened.ino !== entry.ino)
      throw new ToolError(`${path}: file changed while opening.`);
    return use(fd);
  } finally {
    closeSync(fd);
  }
}

export const readFile = (roots: Roots, path: string): Uint8Array => file(roots, path, false, (fd) => new Uint8Array(readFileSync(fd)));
export function writeFile(roots: Roots, path: string, bytes: Uint8Array): void {
  file(roots, path, true, (fd) => {
    ftruncateSync(fd, 0);
    writeFileSync(fd, bytes);
  });
}

/** Unlink only an authorized direct entry; symlink destinations are never deleted. */
export function removeFile(roots: Roots, path: string): void {
  unlinkSync(checked(roots, path, true));
}
