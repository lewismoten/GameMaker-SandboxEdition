// Patching and reading XFERPLAY.EXE: the DOS export writes a project's choices into its copy of
// the player, and an imported game's hand-edited player is read back into choices (as Builder's
// blanked menu and Rōdïp's renamed status words were made with a hex editor in the 1990s).
import { md5Hex } from './md5';
import { PATCHES } from './patchTable';
import { isStock, patchEntry, patchProblem, readPatch, writePatch, writeStock, type PlayerPatches } from './patchRules';
import { extKind, extValueProblem, extensionClashes, readExtensions, writeExtensions, writeStockExtensions } from './fileExtensions';

/** Game-Maker 3.00's XFERPLAY.EXE as it came on the CD (cd/gm/xferplay.exe). */
export const STOCK_PLAYER_MD5 = 'fcaf47d50ececa0b59cd22b3fae3cda3';
const STOCK_PLAYER_SIZE = 160_598;

/**
 * A patched copy of the CD's player. Throws when `exe` is any other file, or when a patch is
 * unknown or breaks its rules (nothing is written then).
 */
export function applyPlayerPatches(exe: Uint8Array, patches: PlayerPatches): Uint8Array {
  if (exe.length !== STOCK_PLAYER_SIZE || md5Hex(exe) !== STOCK_PLAYER_MD5)
    throw new Error('This is not the Game-Maker 3.00 CD’s XFERPLAY.EXE, so it can’t be customized safely.');
  const out = exe.slice();
  for (const [id, value] of Object.entries(patches)) {
    const kind = extKind(id);
    if (kind) {
      const problem = extValueProblem(kind.ext, value) ?? extensionClashes(patches).get(kind.ext);
      if (problem) throw new Error(`${kind.label} (.${kind.ext}): ${problem}`);
      continue;
    }
    const entry = patchEntry(id);
    if (!entry) throw new Error(`Unknown player patch ${id}`);
    const problem = patchProblem(entry, value);
    if (problem) throw new Error(`${entry.label} (${id}): ${problem}`);
    writePatch(out, entry, value);
  }
  writeExtensions(out, patches);
  return out;
}

interface ReadPlayer {
  /** The changes that could be read as patches. */
  patches: PlayerPatches;
  /** True when those explain every byte that differs from the CD's player. */
  explained: boolean;
  /** Entries that differ but break their rules (left out of `patches`). */
  unreadable: string[];
}

/**
 * What a player of XFERPLAY 3.00's size differs from the CD's in, as patches, its renamed file
 * extensions included (`explained` false when other bytes changed too, such as an About page of
 * its own). Undefined for any other size.
 */
export function readPlayerPatches(exe: Uint8Array): ReadPlayer | undefined {
  if (exe.length !== STOCK_PLAYER_SIZE) return undefined;
  const patches: PlayerPatches = {};
  const unreadable: string[] = [];
  const reverted = exe.slice();
  for (const entry of PATCHES) {
    const v = readPatch(exe, entry);
    if (v === undefined || patchProblem(entry, v)) {
      // a value that breaks the rules, or a text whose characters changed past its first 0
      if (!(v !== undefined && isStock(entry, v))) unreadable.push(entry.id);
    } else if (!isStock(entry, v)) patches[entry.id] = v;
    writeStock(reverted, entry);
  }
  const ext = readExtensions(exe);
  Object.assign(patches, ext.patches);
  writeStockExtensions(reverted, ext.read);
  const explained = md5Hex(reverted) === STOCK_PLAYER_MD5;
  return { patches, explained: explained && !unreadable.length, unreadable };
}
