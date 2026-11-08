// What an author changed in a player .EXE of a known build, kept small: the changes that are DOS
// player settings become patches (XFERPLAY 3.00's patch ids, read at each older build's own
// offsets), and every other changed 128-byte block is kept as raw bytes (offset + base64), so the
// DOS export can write a 3.00 player back byte for byte. A build's owner field (a 1990s buyer's
// name or registration) is zeroed first and never kept.
import { isStock, patchEntry, patchProblem, writePatch, writeStock, type PlayerPatches } from '@lewismoten/gamemaker-sandbox-engine/player/patchRules';
import { extId, extKind, extValueProblem } from '@lewismoten/gamemaker-sandbox-engine/player/fileExtensions';
import { readPlayerPatches } from './applyPatches';
import { patchSpans } from './patchSpans';
import { BLOCK, type BuildData } from './playerBuildData';
import { changedBlocks, withoutOwner } from './playerBuild';

import { toBase64, type PreservedRegion } from './preservedRegions';

/** The settings an older build's copy changed, by 3.00 patch id, and the copy with those read back to stock. */
function readOldPatches(exe: Uint8Array, b: BuildData): { patches: PlayerPatches; reverted: Uint8Array } {
  const patches: PlayerPatches = {};
  const reverted = exe.slice();
  for (const [id, [offset, length, own]] of Object.entries(b.text ?? {})) {
    const entry = patchEntry(id);
    if (!entry || (entry.kind !== 'text' && entry.kind !== 'format')) continue;
    const stock = own ?? entry.stock.padEnd(length, ' ');
    let same = true;
    for (let i = 0; i < length; i++) same &&= exe[offset + i] === stock.charCodeAt(i);
    if (same) continue;
    let raw = '';
    for (let i = 0; i < length && exe[offset + i]; i++) raw += String.fromCharCode(exe[offset + i]);
    // padded words (the older high-score lines) read trimmed; a value 3.00 can't hold stays raw
    const value = own ? raw.trim() : raw.trimEnd();
    if (patchProblem(entry, value)) continue;
    if (!isStock(entry, value)) patches[id] = value;
    for (let i = 0; i < length; i++) reverted[offset + i] = stock.charCodeAt(i);
  }
  for (const [ext, offsets] of Object.entries(b.ext ?? {})) {
    const vs = offsets.map((o) => (exe[o] === 0x2e ? String.fromCharCode(exe[o + 1], exe[o + 2], exe[o + 3]).toLowerCase() : ''));
    if (!vs[0] || vs.some((v) => v !== vs[0]) || vs[0] === ext || extValueProblem(ext, vs[0])) continue;
    patches[extId(ext)] = vs[0];
    for (const o of offsets) for (let i = 0; i < 3; i++) reverted[o + 1 + i] = ext.charCodeAt(i);
  }
  return { patches, reverted };
}

/**
 * `exe` with each patch's bytes put back to the CD's, where writing the patch gives exactly the
 * author's bytes; a text the author ended early with a 0 (its old letters after it) is left, so
 * its block is kept raw and the export matches byte for byte.
 */
function revertExact(exe: Uint8Array, patches: PlayerPatches): Uint8Array {
  const out = exe.slice();
  const probe = exe.slice();
  for (const [id, value] of Object.entries(patches)) {
    const entry = patchEntry(id);
    if (!entry) continue; // a renamed extension: its bytes are the three letters read
    writePatch(probe, entry, value);
    const spans = patchSpans(id);
    if (spans.every((o) => probe[o] === exe[o])) writeStock(out, entry);
    for (const o of spans) probe[o] = exe[o];
  }
  for (const id of Object.keys(patches)) {
    const k = extKind(id);
    if (k) for (const o of k.offsets) for (let i = 0; i < 3; i++) out[o + 1 + i] = k.ext.charCodeAt(i);
  }
  return out;
}

interface PreservedPlayer {
  patches: PlayerPatches;
  regions: PreservedRegion[];
}

/** A known build's copy as patches plus the raw blocks they don't explain. */
export function preservePlayer(exe: Uint8Array, b: BuildData): PreservedPlayer {
  let patches: PlayerPatches = {};
  let reverted = exe;
  if (b.id === '3.00') {
    patches = readPlayerPatches(exe)?.patches ?? {};
    reverted = revertExact(exe, patches);
  } else if (b.text) ({ patches, reverted } = readOldPatches(exe, b));
  // which blocks: those the settings don't explain; their bytes: the author's own
  const clean = withoutOwner(exe, b);
  const regions: PreservedRegion[] = [];
  let run: number[] = [];
  const flush = () => {
    if (!run.length) return;
    const start = run[0] * BLOCK;
    regions.push({ offset: start, data: toBase64(clean.subarray(start, Math.min(clean.length, (run[run.length - 1] + 1) * BLOCK))) });
    run = [];
  };
  for (const i of changedBlocks(reverted, b)) {
    if (run.length && i !== run[run.length - 1] + 1) flush();
    run.push(i);
  }
  flush();
  return { patches, regions };
}
