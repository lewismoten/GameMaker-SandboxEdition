// Stage the DOSBox drive and preserve personal files before retiring the previous drive.
import { createHash } from 'node:crypto';
import {
  closeSync,
  copyFileSync,
  createReadStream,
  existsSync,
  fsyncSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  openSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
} from 'node:fs';
import { basename, dirname, join } from 'node:path';

/** Setups, saves and high scores written by PLAYGAME and PLAYBACK. */
export const PLAYED = /^(config\.dat|savnames\.dat|.*\.sav|.*\.his)$/i;

async function digest(path: string): Promise<string> {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(path)) hash.update(chunk as Buffer);
  return hash.digest('hex');
}

function syncPath(path: string): void {
  const fd = openSync(path, 'r');
  try {
    fsyncSync(fd);
  } finally {
    closeSync(fd);
  }
}

function syncTree(path: string): void {
  if (statSync(path).isDirectory()) for (const name of readdirSync(path)) syncTree(join(path, name));
  syncPath(path);
}

export async function rebuildMount(target: string, build: (stage: string) => Promise<void> | void) {
  const parent = dirname(target);
  mkdirSync(parent, { recursive: true });
  const work = mkdtempSync(join(parent, '.' + basename(target) + '-'));
  const stage = join(work, 'new');
  const previous = join(work, 'old');
  const backups: { saves?: string; edits?: string } = {};
  const stamp = new Date().toLocaleString('sv-SE', { timeZone: 'America/New_York' }).replace(/[ :]/g, '-');
  const listings = new Map<string, Set<string>>();
  let restored = 0;
  async function preserve(rel: string): Promise<void> {
    const old = join(target, rel);
    const fresh = join(stage, rel);
    const entry = lstatSync(old);
    if (entry.isDirectory()) {
      const names = new Set(readdirSync(old));
      listings.set(rel, names);
      for (const name of names) await preserve(join(rel, name));
      return;
    }
    const source = entry.isSymbolicLink() ? statSync(old) : entry;
    if (!source.isFile()) throw new Error(`Cannot back up special file ${old}`);
    const generated = existsSync(fresh) ? statSync(fresh) : undefined;
    if (generated?.isFile() && generated.size === source.size && (await digest(old)) === (await digest(fresh))) return;
    const kind = PLAYED.test(basename(rel)) ? 'saves' : 'edits';
    if (!backups[kind]) {
      const root = target + '-' + kind;
      mkdirSync(root, { recursive: true });
      backups[kind] = mkdtempSync(join(root, stamp + '-'));
    }
    const dest = join(backups[kind], rel);
    mkdirSync(dirname(dest), { recursive: true });
    copyFileSync(old, dest);
    if (kind === 'saves' && !generated?.isDirectory() && existsSync(dirname(fresh)) && statSync(dirname(fresh)).isDirectory()) {
      copyFileSync(old, fresh);
      restored++;
    }
  }
  try {
    mkdirSync(stage);
    await build(stage);
    const hadMount = existsSync(target);
    if (hadMount) await preserve('');
    for (const backup of Object.values(backups)) {
      syncTree(backup);
      syncPath(dirname(backup));
    }
    syncTree(stage);
    syncPath(work);
    syncPath(parent);
    if (hadMount) renameSync(target, previous);
    else if (existsSync(target)) throw new Error(`Drive changed during rebuild: ${target}. Close DOSBox and try again.`);
    try {
      // Check the detached tree so a save created through the mount path during hashing is accounted for.
      for (const [rel, names] of listings) {
        const current = readdirSync(join(previous, rel));
        if (current.length !== names.size || current.some((name) => !names.has(name))) {
          throw new Error(`Drive changed during rebuild: ${join(target, rel)}. Close DOSBox and try again.`);
        }
      }
      renameSync(stage, target);
    } catch (error) {
      if (existsSync(previous)) renameSync(previous, target);
      throw error;
    }
    syncPath(parent);
    rmSync(previous, { recursive: true, force: true });
    return { ...backups, restored };
  } finally {
    // Keep the original available for recovery even if rollback itself failed.
    if (!existsSync(previous)) rmSync(work, { recursive: true, force: true });
  }
}
