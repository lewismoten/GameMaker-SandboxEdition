// Syncing a reserved range: a role's reserved colors made identical in every palette its block files
// are shown with (editors/palette/paletteReservations.ts says which numbers; tools/palette-reserve
// moves the colors in). It is a step when no scene looks different (the palettes only differed in
// colors nothing draws), and a proposal with a delta E score when some would: then the blocks are
// shown before and after and the person applies it. One role at a time; every file of the role at once,
// because two sets shown with one palette share its range.
import { serializeBlocks } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { syncRange } from '@lewismoten/gamemaker-sandbox-tools/palette-reserve';
import type { ReduceScore } from '@lewismoten/gamemaker-sandbox-tools/color-reduce';
import type { GameFiles } from '../../project/files';
import type { PaletteReservation } from '../editors/palette/paletteReservations';
import { commit, readFor, type Writes } from './commit';
import { readGame } from './refs';
import { blockedIn, colorsOf, SPRITE_ROLE, type Colors, type SpriteSlot } from './spriteColors';
import type { Step } from './types';

export interface RangeSync {
  slot: SpriteSlot;
  role: 'monster' | 'character';
  first: number;
  last: number;
  title: string;
  score: ReduceScore;
  /** Colors the range now holds / colors that were more than it holds and were reduced. */
  used: number;
  reduced: number;
  lossless: boolean;
  changedBlocks: number;
  /** The most changed blocks with the palette to draw them in before and after. */
  shown: { n: number; file: string; before: Uint8Array; after: Uint8Array }[];
  palette: Uint8Array;
  paletteAfter: Uint8Array;
  touches: string[];
  apply(files: GameFiles, gam: string): void;
}

const BLOCK_SIZE = { mbl: 100, cbl: 50 } as const;

/** Sprite roles whose reserved range is not the same in every palette their files are shown with. */
function drifts(c: Colors, files: GameFiles, slot: SpriteSlot, r: PaletteReservation): boolean {
  const pals = [...new Set(c.sprites[slot].flatMap((f) => f.palettes))].map((p) => files.get(p)!);
  return pals.some((p) => p.subarray(r.first * 3, (r.last + 1) * 3).some((v, i) => v !== pals[0][r.first * 3 + i]));
}

export function rangeSyncs(
  files: GameFiles,
  gam: string,
  ranges: readonly PaletteReservation[],
): { syncs: RangeSync[]; stuck: { role: string; why: string }[] } {
  const syncs: RangeSync[] = [];
  const stuck: { role: string; why: string }[] = [];
  const c = colorsOf(files, gam);
  for (const slot of ['mbl', 'cbl'] as const) {
    const role = SPRITE_ROLE[slot];
    const mine = c.sprites[slot];
    for (const r of ranges.filter((x) => x.role === role)) {
      if (!mine.length || !drifts(c, files, slot, r)) continue;
      const pals = new Map<string, Uint8Array>();
      const blocked = new Map<string, Set<number>>();
      for (const p of new Set(mine.flatMap((f) => f.palettes))) {
        pals.set(p, files.get(p)!);
        blocked.set(p, blockedIn(c, p, slot));
      }
      const res = syncRange(
        mine.map((f) => ({ blocks: f.blocks, shown: f.shown, palettes: f.palettes })),
        pals,
        r.first,
        r.last,
        blocked,
      );
      if (!res.ok) {
        stuck.push({ role, why: res.why });
        continue;
      }
      const before: Writes['before'] = new Map();
      const out = new Map<string, Uint8Array | null>();
      res.pixels.forEach((per, fi) => {
        if (!per.size) return;
        const f = mine[fi];
        const bytes = readFor(files, before, f.name);
        const next = f.blocks.map((b, i) => (per.has(i) ? { ...b, pixels: per.get(i)! } : b));
        out.set(f.name, Uint8Array.from([...serializeBlocks(next), ...bytes.subarray(BLOCK_SIZE[slot] * 420)]));
      });
      res.palettes.forEach((bytes, name) => {
        readFor(files, before, name);
        out.set(name, bytes);
      });
      if (!out.size) continue;
      const writes: Writes = { files: out, before, game: readGame(files, gam) };
      const ref = mine[0].palettes[0];
      const what = res.reduced
        ? `${res.reduced} of its colors beyond the ${r.last - r.first + 1} the range holds become the nearest kept one`
        : `${res.used} color${res.used === 1 ? '' : 's'} move into colors ${r.first}-${r.last}`;
      syncs.push({
        slot,
        role,
        first: r.first,
        last: r.last,
        title: `Make the ${role} colors ${r.first}-${r.last} the same in ${pals.size} palette${pals.size === 1 ? '' : 's'}: ${what}`,
        score: res.score,
        used: res.used,
        reduced: res.reduced,
        lossless: res.score.worst === 0 && res.reduced === 0,
        changedBlocks: res.changed.length,
        shown: res.changed.slice(0, 6).map((x) => ({
          n: x.n,
          file: mine[x.file].name,
          before: mine[x.file].blocks[x.n].pixels,
          after: res.pixels.get(x.file)?.get(x.n) ?? mine[x.file].blocks[x.n].pixels,
        })),
        palette: pals.get(ref)!,
        paletteAfter: res.palettes.get(ref) ?? pals.get(ref)!,
        touches: [...out.keys(), gam],
        apply: (f, g) => commit(f, g, writes),
      });
    }
  }
  return { syncs, stuck };
}

/** The syncs that change nothing a scene draws: safe to plan with the other steps. */
export function planRangeSync(files: GameFiles, gam: string, ranges: readonly PaletteReservation[]): Step | undefined {
  const s = rangeSyncs(files, gam, ranges).syncs.find((x) => x.lossless);
  if (!s) return undefined;
  return {
    kind: 'sync',
    keep: s.role,
    drop: '',
    saves: 0,
    title: s.title,
    changes: [`no scene draws any differently (the ${s.role} colors already match wherever a ${s.role} is drawn)`],
    touches: s.touches,
    apply: (f, g) => s.apply(f, g),
  };
}
