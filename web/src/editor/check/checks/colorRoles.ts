// The level check's color roles check: a block that draws with a color the project reserved for a
// different kind of art (a character block using a monster color, and so on). Reservations are the
// project's palette ranges (editors/palette/paletteReservations.ts). They are a convention, not a
// rule of the engine, so the finding is a suggestion; global colors (in no range), color 0 and
// color 255 are always fine, and a project with no reservations gets no findings. Only blocks a
// level shows are looked at: those on its map (and what they change into), its monsters' frames
// and its hero's.
import { BLOCK_COUNTS, MONBL, type Block, type BlockKind } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { frameCount } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import { reservationAt, type PaletteReservation, type PaletteRole } from '../../editors/palette/paletteReservations';
import type { Finding } from '../findings';
import type { SceneData } from '../sceneData';

const KINDS: { kind: BlockKind; role: PaletteRole; noun: string }[] = [
  { kind: 'cbl', role: 'character', noun: 'Character' },
  { kind: 'mbl', role: 'monster', noun: 'Monster' },
  { kind: 'bbl', role: 'background', noun: 'Background' },
];
/** Blocks listed one by one for a file before the rest are gathered into one finding. */
const SHOWN = 5;
const PLURAL: Record<PaletteRole, string> = { character: 'characters', monster: 'monsters', background: 'backgrounds' };

/** Colors as "40–42, 50", for a sorted list. */
function spans(colors: number[]): string {
  const out: string[] = [];
  for (let i = 0; i < colors.length;) {
    let j = i;
    while (j + 1 < colors.length && colors[j + 1] === colors[j] + 1) j++;
    out.push(j > i ? `${colors[i]}–${colors[j]}` : `${colors[i]}`);
    i = j + 1;
  }
  return out.join(', ');
}

/** The colors a block draws with that the project reserves for another role, by that role. */
export function foreignColors(block: Block, own: PaletteRole, ranges: readonly PaletteReservation[]): Map<PaletteRole, number[]> {
  const seen = new Set(block.pixels);
  const out = new Map<PaletteRole, number[]>();
  for (const color of [...seen].sort((a, b) => a - b)) {
    const role = reservationAt(ranges, color);
    if (role && role !== 'menu' && role !== 'transparent' && role !== own) out.set(role, [...(out.get(role) ?? []), color]);
  }
  return out;
}

/** The blocks of `kind` scene `d` can show: background blocks on its map, in the starting inventory or changed into from those; its monsters' frames; its hero's frames. */
function shownBlocks(d: SceneData, kind: BlockKind): number[] {
  if (kind === 'mbl')
    return d.mon.flatMap((m) => {
      if (!m?.used) return [];
      const end = m.pic.findIndex(([b]) => b >= MONBL);
      return (end < 0 ? m.pic : m.pic.slice(0, end)).map(([b]) => b);
    });
  if (kind === 'cbl') return d.chr.sequences.flatMap((s) => s.frames.slice(0, frameCount(s)).flatMap((f) => (f.pic2 === MONBL ? [] : [f.pic1, f.pic2])));
  const seen = new Set<number>();
  const todo = [...d.map.blocks, ...d.chr.inv];
  while (todo.length) {
    const n = todo.pop()!;
    if (seen.has(n) || !d.bbl[n]) continue;
    seen.add(n);
    todo.push(d.bbl[n].nextBl, d.bbl[n].touchBl);
  }
  return [...seen];
}

export function colorRoles(scenes: SceneData[], ranges: readonly PaletteReservation[] | undefined): Finding[] {
  if (!ranges?.length) return [];
  const out: Finding[] = [];
  const done = new Set<string>();
  // a file several scenes share: a block any of them shows
  const shown = new Map<string, Set<number>>();
  for (const d of scenes)
    for (const { kind } of KINDS) {
      const file = d.names[kind]?.toLowerCase();
      if (!file) continue;
      const set = shown.get(file) ?? new Set<number>();
      for (const n of shownBlocks(d, kind)) set.add(n);
      shown.set(file, set);
    }
  for (const d of scenes) {
    for (const { kind, role, noun } of KINDS) {
      const file = d.names[kind];
      if (!file || done.has(file.toLowerCase())) continue;
      done.add(file.toLowerCase());
      const found: Finding[] = [];
      const more: number[] = [];
      const used = shown.get(file.toLowerCase())!;
      d[kind].slice(0, BLOCK_COUNTS[kind]).forEach((block, n) => {
        if (!used.has(n)) return;
        for (const [other, colors] of foreignColors(block, role, ranges)) {
          if (found.length >= SHOWN) {
            if (!more.includes(n)) more.push(n);
            continue;
          }
          found.push({
            check: 'color-roles',
            severity: 'warning',
            title: `${noun} block ${n} in ${file} draws with ${colors.length > 1 ? 'colors' : 'color'} ${spans(colors)}, which this project reserves for ${PLURAL[other]}`,
            detail: `If that’s on purpose, dismiss this. The check can’t see whether the art is meant to share a color, or whether a palette change would look worse; it only compares the colors in the block with the ranges set in the palette editor.`,
            where: { scene: d.scene, file, block: { file, n } },
          });
        }
      });
      out.push(...found);
      // a whole set drawn in another kind's colors would flood the list: the rest in one line
      if (more.length)
        out.push({
          check: 'color-roles',
          severity: 'warning',
          title: `${more.length} more ${noun.toLowerCase()} blocks in ${file} draw with colors this project reserves for another kind`,
          detail: `Blocks ${spans(more)}. If that’s on purpose, dismiss this. The palette editor’s reserved ranges may simply not match how this set uses color; the check can’t tell which is intended.`,
          where: { scene: d.scene, file },
        });
    }
  }
  return out;
}
