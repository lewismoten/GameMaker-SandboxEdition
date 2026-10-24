// The level check's quick reach test, with no playing: from where the hero comes into a scene,
// every cell joined to it through blocks that aren't solid all round (or can stop being solid:
// a lock, a block that changes when touched or with time). A pickup outside that is sealed in
// for certain, whatever the hero can do, so it is reported even when the playtest ran short.
import { BACKBL, type Block } from '../../../formats/blocks';
import type { Game } from '../../../formats/game';
import { MLEN, MWID } from '../../../formats/map';
import { at, type Finding } from '../findings';
import { linksInto } from '../playtest';
import type { SceneData } from '../sceneData';
import { blockCycle } from './blockChecks';
import { isPickup } from './playChecks';

/** Blocks the hero might get through: not solid all round, or a wall that can open. */
export function passable(bg: Block[]): boolean[] {
  return bg.map(
    (b, n) => n >= BACKBL || b.solid !== 15 || b.touchBl !== n || (b.effect > 0 && b.eamt < 0) || blockCycle(bg, n).some((c) => bg[c.n].solid !== 15),
  );
}

/** Cells joined to `from` through passable blocks (the map wraps, as PLAYGAME's does), never through `closed`. */
export function openFrom(blocks: Uint8Array, bg: Block[], from: number[], closed?: Set<number>): Uint8Array {
  const ok = passable(bg);
  const seen = new Uint8Array(blocks.length);
  const stack = from.filter((c) => c >= 0 && c < blocks.length);
  for (const c of stack) seen[c] = 1;
  while (stack.length) {
    const c = stack.pop()!;
    const x = c % MLEN;
    const y = Math.floor(c / MLEN);
    for (const n of [y * MLEN + ((x + 1) % MLEN), y * MLEN + ((x + MLEN - 1) % MLEN), ((y + 1) % MWID) * MLEN + x, ((y + MWID - 1) % MWID) * MLEN + x])
      if (!seen[n] && ok[blocks[n]] && !closed?.has(n)) ((seen[n] = 1), stack.push(n));
  }
  return seen;
}

/**
 * Pickups no scene playing this map can get to (a map shared by scenes, such as a hidden den
 * entered by its own link, counts as open wherever any of them can go). `all`: every scene.
 */
export function sealed(d: SceneData, game: Game, all: SceneData[] = [d]): Finding[] {
  const sharing = all.filter((o) => o.names.map && o.names.map.toLowerCase() === d.names.map?.toLowerCase());
  // reported once, by the first scene that plays the map
  if (sharing.length && sharing[0].scene !== d.scene) return [];
  const seen = new Uint8Array(MLEN * MWID);
  let any = false;
  for (const o of sharing.length ? sharing : [d]) {
    const entries = linksInto(game, o.scene).map((l) => l.to.y * MLEN + l.to.x);
    if (!entries.length) continue;
    any = true;
    openFrom(o.map.blocks, o.bbl, entries).forEach((v, i) => v && (seen[i] = 1));
  }
  if (!any) return [];
  const lost = new Map<number, number[]>();
  d.map.blocks.forEach((n, i) => {
    if (!seen[i] && isPickup(d, n)) lost.set(n, [...(lost.get(n) ?? []), i]);
  });
  return [...lost].map(([n, cells]) => ({
    check: 'unreachable' as const,
    severity: 'warning' as const,
    title: `${cells.length} of block ${n} ${cells.length === 1 ? 'is' : 'are'} sealed in, first at ${at(cells[0])}`,
    detail: 'No open path leads there from where the hero comes in, whatever the hero does. Open a way in, or draw it as scenery.',
    where: { scene: d.scene, map: d.names.map, cell: cells[0], cells, block: { file: d.names.bbl ?? '', n } },
    fix: 'open-gap' as const,
  }));
}
