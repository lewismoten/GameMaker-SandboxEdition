// The level check's quick reach test, with no playing: from where the hero comes into a scene,
// every cell joined to it through blocks that aren't solid all round (or can stop being solid:
// a lock, a block that changes when touched or with time). A pickup outside that is sealed in
// for certain, whatever the hero can do, so it is reported even when the playtest ran short.
import { BACKBL, type Block } from '../../../formats/blocks';
import type { Game } from '../../../formats/game';
import { MLEN, MWID } from '../../../formats/map';
import { at, type Finding } from '../findings';
import { linksInto } from '../sceneLinks';
import type { SceneData } from '../sceneData';
import { blockCycle } from './blockChecks';
import { isPickup } from './playChecks';
import { prizeInView, seenFrom } from './inView';

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

/** Scenes linked with one of `mine` whose map matches `d`'s in nine cells of ten (the other plane of two). */
function twins(d: SceneData, game: Game, all: SceneData[], mine: SceneData[]): SceneData[] {
  const ids = new Set(mine.map((o) => o.scene));
  const linked = new Set<number>();
  for (const o of mine) {
    for (const l of game.scenes[o.scene]?.links ?? []) linked.add(l.toScene);
    for (const l of linksInto(game, o.scene)) linked.add(l.scene);
  }
  return all.filter((o) => {
    if (ids.has(o.scene) || !linked.has(o.scene) || o.names.map?.toLowerCase() === d.names.map?.toLowerCase()) return false;
    let same = 0;
    for (let i = 0; i < o.map.blocks.length; i++) if (o.map.blocks[i] === d.map.blocks[i]) same++;
    return same >= o.map.blocks.length * 0.9;
  });
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
  // two planes of one place (a focus key, a light switch): a linked scene whose map has the same
  // blocks almost everywhere. A prize walled in on one is open where the other plane reaches it.
  for (const o of twins(d, game, all, sharing.length ? sharing : [d])) {
    const open = openFrom(o.map.blocks, o.bbl, o.entries);
    d.map.blocks.forEach((n, i) => open[i] && o.map.blocks[i] === n && (seen[i] = 1));
  }
  const lost = new Map<number, number[]>();
  d.map.blocks.forEach((n, i) => {
    if (!seen[i] && isPickup(d, n)) lost.set(n, [...(lost.get(n) ?? []), i]);
  });
  const out: Finding[] = [];
  for (const [n, all] of lost) {
    const shown = new Set(seenFrom(all, (c) => !!seen[c]));
    if (shown.size) out.push(prizeInView(d, n, [...shown], 'sealed in'));
    const cells = all.filter((c) => !shown.has(c));
    if (!cells.length) continue;
    out.push({
      check: 'unreachable',
      severity: 'warning',
      title: `${cells.length} of block ${n} ${cells.length === 1 ? 'is' : 'are'} sealed in, first at ${at(cells[0])}`,
      detail: 'No open path leads there from where the hero comes in, whatever the hero does. Open a way in, or draw it as scenery.',
      where: { scene: d.scene, map: d.names.map, cell: cells[0], cells, block: { file: d.names.bbl ?? '', n } },
      fix: 'open-gap',
    });
  }
  return out;
}
