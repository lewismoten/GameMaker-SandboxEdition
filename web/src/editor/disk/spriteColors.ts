// What the palette reservation steps read: per sprite role (monster, character), the block files its
// scenes show, which blocks, and the palette files they are shown with; and per palette, the color
// numbers other blocks (backgrounds, the other sprite role) draw with there.
import { BACKBL, CHARBL, MONBL, parseBlocks, type Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { ADVTYPE, parseGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { isSolidPalette } from '../core/readablePalette';
import type { GameFiles } from '../../project/files';
import { drawn } from './blockUse';
import { shownBlocks } from './reduceColors';
import { filesIn, sceneUses, SLOT, usersOf, type SceneUse } from './refs';

export type SpriteSlot = 'mbl' | 'cbl';
export const SPRITE_ROLE = { mbl: 'monster', cbl: 'character' } as const;
const SIZE = { bbl: BACKBL, mbl: MONBL, cbl: CHARBL } as const;

export interface SpriteFile {
  name: string;
  blocks: Block[];
  shown: Set<number>;
  /** Palette files (not all-one-color) its scenes show it with, first use first. */
  palettes: string[];
}

export interface Colors {
  uses: SceneUse[];
  /** Palette file names a slide or animation scene opens: never edited. */
  locked: Set<string>;
  sprites: Record<SpriteSlot, SpriteFile[]>;
  /** Per palette file, the color numbers each kind of block draws with there. */
  drawnWith: Map<string, { bbl: Set<number>; mbl: Set<number>; cbl: Set<number> }>;
}

export function colorsOf(files: GameFiles, gam: string): Colors {
  const game = parseGame(files.get(gam)!);
  const uses = sceneUses(files, game);
  const locked = new Set<string>();
  for (const s of game.scenes) {
    const at = s.gametype === ADVTYPE ? undefined : files.resolve(s.files[SLOT.pal]);
    if (at) locked.add(at);
  }
  const drawnWith: Colors['drawnWith'] = new Map();
  const sprites: Colors['sprites'] = { mbl: [], cbl: [] };
  for (const slot of ['bbl', 'mbl', 'cbl'] as const) {
    for (const name of filesIn(uses, slot)) {
      const bytes = files.get(name);
      if (!bytes) continue;
      const blocks = parseBlocks(bytes.subarray(0, SIZE[slot] * 420), SIZE[slot]);
      const users = usersOf(uses, slot, name);
      const shown = slot === 'bbl' ? drawn(files, uses, name, blocks) : shownBlocks(files, uses, slot, name, blocks);
      const pals: string[] = [];
      for (const u of users) {
        const pb = u.pal ? files.get(u.pal) : undefined;
        if (u.pal && pb && !isSolidPalette(pb) && !pals.includes(u.pal)) pals.push(u.pal);
      }
      const colors = new Set<number>();
      for (const n of shown) for (const v of blocks[n]?.pixels ?? []) colors.add(v);
      for (const p of pals) {
        const at = drawnWith.get(p) ?? { bbl: new Set(), mbl: new Set(), cbl: new Set() };
        colors.forEach((v) => at[slot].add(v));
        drawnWith.set(p, at);
      }
      if (slot !== 'bbl' && pals.length) sprites[slot].push({ name, blocks, shown, palettes: pals });
    }
  }
  return { uses, locked, sprites, drawnWith };
}

/** The color numbers other kinds of block draw with in a palette, or every number when a slide or animation opens it. */
export function blockedIn(c: Colors, pal: string, slot: SpriteSlot): Set<number> {
  if (c.locked.has(pal)) return new Set(Array.from({ length: 256 }, (_, i) => i));
  const at = c.drawnWith.get(pal);
  const out = new Set<number>(at?.bbl);
  const other = slot === 'mbl' ? 'cbl' : 'mbl';
  at?.[other].forEach((v) => out.add(v));
  return out;
}
