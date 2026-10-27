// The level check's links, from the .gam and the maps alone, as PLAYGAME's chklnk reads them: it
// tries a scene's links in order and takes the first whose cell the hero touches, so a second link
// on that cell never fires, and a hero who comes in standing on a link leaves on the first tick.
// Also links left at the map's corner (0, 0) where the hero can walk, links and arrivals inside
// blocks solid on every side, links off the 100 × 100 map, and whether any chain of links leads
// from the title's first link (where play starts) to the game won scene (scene 1).
import { CHARBL } from '../../../formats/blocks';
import { IDLESEQ } from '../../../formats/character';
import { NOSCENE, type Game, type Link } from '../../../formats/game';
import { MLEN, MWID } from '../../../formats/map';
import { at, type Finding } from '../findings';
import type { SceneData } from '../sceneData';
import { openFrom, passable } from './sealed';

const onMap = (p: { x: number; y: number }) => p.x >= 0 && p.x < MLEN && p.y >= 0 && p.y < MWID;
const cellOf = (p: { x: number; y: number }) => p.y * MLEN + p.x;
const used = (l: Link) => l.toScene !== NOSCENE;

/** A scene's name as the findings say it. */
function sceneName(game: Game, n: number): string {
  if (n === 1) return 'the game won scene';
  if (n === 0) return 'the title';
  if (n >= game.scenes.length) return `scene ${n}, which isn’t in the game`;
  return game.scenes[n].desc.trim() || `scene ${n}`;
}

/** Each link's earlier link on the same cell, if one is there (it fires instead). */
function shadowedBy(links: Link[]): (number | undefined)[] {
  return links
    .map((l, i) => (used(l) ? links.findIndex((k, j) => j < i && used(k) && k.from.x === l.from.x && k.from.y === l.from.y) : -1))
    .map((k) => (k >= 0 ? k : undefined));
}

const open = new WeakMap<SceneData['bbl'], boolean[]>();

/** A block solid on all four sides that never opens (sealed.ts passable). */
function walled(d: SceneData, cell: number): boolean {
  let ok = open.get(d.bbl);
  if (!ok) open.set(d.bbl, (ok = passable(d.bbl)));
  return !ok[d.map.blocks[cell]];
}

/** The cells the hero touches as he arrives at `to`: his feet, and his head above if the standing picture has one. */
function arrivalCells(d: SceneData, to: { x: number; y: number }): number[] {
  const feet = cellOf(to);
  const tall = (d.chr.sequences[IDLESEQ]?.frames[0]?.pic1 ?? CHARBL) < CHARBL;
  return tall ? [feet, ((to.y + MWID - 1) % MWID) * MLEN + to.x] : [feet];
}

/** The link a hero arriving at `to` stands on, which takes him on at once (chklnk's first match). */
function linkAtArrival(game: Game, d: SceneData, to: { x: number; y: number }): number | undefined {
  if (!onMap(to)) return undefined;
  const cells = arrivalCells(d, to);
  const k = game.scenes[d.scene].links.findIndex((l) => used(l) && onMap(l.from) && cells.includes(cellOf(l.from)));
  return k >= 0 ? k : undefined;
}

/** Two links on one cell to different places: the later one never fires. */
export function shadowedLinks(game: Game, d: SceneData): Finding[] {
  const links = game.scenes[d.scene].links;
  const out: Finding[] = [];
  shadowedBy(links).forEach((k, i) => {
    if (k === undefined) return;
    const a = links[k];
    const b = links[i];
    if (a.toScene === b.toScene && a.to.x === b.to.x && a.to.y === b.to.y) return;
    out.push({
      check: 'link-shadow',
      severity: 'error',
      title: `Link ${i + 1} never fires: link ${k + 1} is on the same cell, ${at(cellOf(b.from))}, and goes first`,
      detail: `Link ${k + 1} goes to ${sceneName(game, a.toScene)} and link ${i + 1} to ${sceneName(game, b.toScene)}. PLAYGAME tries the links in order and takes the first one on a cell the hero touches. Move one of them, or delete the one you don’t need.`,
      where: { scene: d.scene, map: d.names.map, cell: cellOf(b.from), link: i },
      fix: 'drop-link',
    });
  });
  return out;
}

/** Links into this scene that land the hero on one of its links, so the scene is gone on its first tick. */
export function startsOnLink(game: Game, d: SceneData, all: SceneData[]): Finding[] {
  const out: Finding[] = [];
  const byScene = new Map(all.map((s) => [s.scene, s]));
  const seen = new Set<number>();
  game.scenes.forEach((s, from) =>
    s.links.forEach((l, j) => {
      // the title starts play by its first link only
      if (l.toScene !== d.scene || (from === 0 && j > 0)) return;
      const k = linkAtArrival(game, d, l.to);
      const arrive = cellOf(l.to);
      if (k === undefined || seen.has(arrive)) return;
      seen.add(arrive);
      // follow the hero on through each scene he lands on a link in
      const chain: string[] = [];
      let cur = { scene: d.scene, link: k };
      const visited = new Set<number>([d.scene]);
      let loops = false;
      for (let step = 0; step < 20; step++) {
        const next = game.scenes[cur.scene].links[cur.link];
        chain.push(sceneName(game, next.toScene));
        const nd = byScene.get(next.toScene);
        const nk = nd ? linkAtArrival(game, nd, next.to) : undefined;
        if (!nd || nk === undefined) break;
        if (visited.has(nd.scene)) {
          loops = true;
          break;
        }
        visited.add(nd.scene);
        cur = { scene: nd.scene, link: nk };
      }
      // a scene with an intro or exit picture shown on the way through is a card, often meant
      const pics = game.scenes[d.scene].files;
      const card = !loops && !!(pics[9] || pics[10]);
      const onward = `${chain.join(', then ')}${loops ? ', and round again for ever' : ''}`;
      out.push({
        check: 'start-on-link',
        severity: loops ? 'error' : card ? 'info' : 'warning',
        title: `${d.name} is left on its first tick: the hero comes in at ${at(arrive)}, on its link ${k + 1}`,
        detail: card
          ? `Coming in from ${sceneName(game, from)} (its link ${j + 1}), the hero stands on link ${k + 1}, so its picture shows and he goes straight on to ${onward}; the scene’s map is never played. That is a fine way to show a card between levels. If it should be a level, move the arrival point or the link.`
          : `Coming in from ${sceneName(game, from)} (its link ${j + 1}), the hero stands on link ${k + 1}, which takes him straight on to ${onward}. The scene never plays, and with no intro picture nothing of it is seen. Move the arrival point, or move the link off it.`,
        where: { scene: d.scene, map: d.names.map, cell: arrive },
      });
    }),
  );
  return out;
}

/** Links left at (0, 0), where an unplaced link sits: on open floor the hero can walk into, a warp hole. */
export function cornerLinks(game: Game, d: SceneData): Finding[] {
  const links = game.scenes[d.scene].links;
  const corner = links.flatMap((l, i) => (used(l) && l.from.x === 0 && l.from.y === 0 ? [i] : []));
  if (!corner.length || !d.entries.length) return [];
  const open = openFrom(d.map.blocks, d.bbl, d.entries)[0] === 1;
  const i = corner[0];
  return [
    {
      check: 'link-corner',
      severity: open ? 'warning' : 'info',
      title: `Link ${i + 1} is at (0, 0), the map’s top-left corner${open ? ', where the hero can walk' : ''}`,
      detail: open
        ? `That is where a link nobody placed sits. The corner is open floor joined to where the hero comes in, so a player who wanders there, or wraps across the map’s edge into it, is taken to ${sceneName(game, links[i].toScene)}. Put the link where you meant it, or delete it.`
        : `That is where a link nobody placed sits. The hero can’t get there, so it does no harm, but was it meant to go somewhere? Put it where you meant it, or delete it.`,
      where: { scene: d.scene, map: d.names.map, cell: 0, link: i },
    },
  ];
}

/** Links inside blocks solid on every side (never touched), and arrivals inside them (the hero comes in walled up). */
export function solidLinks(game: Game, d: SceneData): Finding[] {
  const out: Finding[] = [];
  const entries = new Set(d.entries);
  game.scenes[d.scene].links.forEach((l, i) => {
    if (!used(l) || !onMap(l.from) || (l.from.x === 0 && l.from.y === 0)) return;
    const c = cellOf(l.from);
    if (!walled(d, c) || entries.has(c)) return;
    out.push({
      check: 'link-solid',
      severity: 'warning',
      title: `Link ${i + 1} at ${at(c)} is inside block ${d.map.blocks[c]}, which is solid on every side`,
      detail: `The hero can’t walk into it, so the link to ${sceneName(game, l.toScene)} never fires. Move the link to the open cell beside it, or make the block open (a door that opens when touched, or one that turns into a doorway).`,
      where: { scene: d.scene, map: d.names.map, cell: c, block: { file: d.names.bbl ?? '', n: d.map.blocks[c] } },
    });
  });
  const seen = new Set<number>();
  game.scenes.forEach((s, from) =>
    s.links.forEach((l, j) => {
      if (l.toScene !== d.scene || (from === 0 && j > 0) || !onMap(l.to)) return;
      const cells = arrivalCells(d, l.to);
      const shut = cells.filter((c) => walled(d, c));
      if (!shut.length || seen.has(cells[0])) return;
      seen.add(cells[0]);
      const feet = shut.includes(cells[0]);
      out.push({
        check: 'link-solid',
        severity: 'warning',
        title: `The hero comes in at ${at(cells[0])} with his ${feet ? 'feet' : 'head'} inside block ${d.map.blocks[shut[0]]}, which is solid on every side`,
        detail: `Link ${j + 1} of ${sceneName(game, from)} lands him there. His feet go on the landing spot and his head in the cell above it. Inside a wall he can stick, or be squeezed out somewhere odd. Move the landing spot to open floor.`,
        where: { scene: d.scene, map: d.names.map, cell: cells[0] },
      });
    }),
  );
  return out;
}

/** Links and landing spots off the 100 × 100 map. */
export function offMap(game: Game, d: SceneData): Finding[] {
  const out: Finding[] = [];
  game.scenes[d.scene].links.forEach((l, i) => {
    if (!used(l) || onMap(l.from)) return;
    out.push({
      check: 'off-map',
      severity: 'error',
      title: `Link ${i + 1} is at (${l.from.x}, ${l.from.y}), off the map: it can never fire`,
      detail: `The map’s cells run from (0, 0) to (99, 99), and the hero is always on one of them. Put the link to ${sceneName(game, l.toScene)} on the map.`,
      where: { scene: d.scene, map: d.names.map, link: i },
    });
  });
  game.scenes.forEach((s, from) =>
    s.links.forEach((l, j) => {
      if (l.toScene !== d.scene || (from === 0 && j > 0) || onMap(l.to)) return;
      out.push({
        check: 'off-map',
        severity: 'warning',
        title: `Link ${j + 1} of ${sceneName(game, from)} lands the hero at (${l.to.x}, ${l.to.y}), off the map`,
        detail: `The map’s cells run from (0, 0) to (99, 99). PLAYGAME wraps a hero who goes off one edge round to the other, so he may turn up at (${((l.to.x % MLEN) + MLEN) % MLEN}, ${((l.to.y % MWID) + MWID) % MWID}), but the first tick reads past the map. Put the landing spot on the map where you meant it.`,
        where: { scene: d.scene, map: d.names.map },
      });
    }),
  );
  return out;
}

/** Whether a chain of links leads from where play starts to the game won scene (scene 1). */
export function wonRoute(game: Game, all: SceneData[]): Finding[] {
  const first = game.scenes[0]?.links[0];
  if (!first || !used(first)) return [];
  const byScene = new Map(all.map((s) => [s.scene, s]));
  // the links a hero in each scene could take: on the map, not under an earlier link, not walled up
  const ways = (n: number): Link[] => {
    const links = game.scenes[n]?.links ?? [];
    const d = byScene.get(n);
    const shadow = shadowedBy(links);
    return links.filter(
      (l, i) => used(l) && onMap(l.from) && shadow[i] === undefined && !(d && walled(d, cellOf(l.from)) && !d.entries.includes(cellOf(l.from))),
    );
  };
  const seen = new Set<number>([first.toScene]);
  const queue = [first.toScene];
  while (queue.length) {
    const n = queue.shift()!;
    if (n === 1) return [];
    if (n < 2 || n >= game.scenes.length) continue;
    for (const l of ways(n)) if (!seen.has(l.toScene)) (seen.add(l.toScene), queue.push(l.toScene));
  }
  const reached = [...seen].filter((n) => n >= 2 && n < game.scenes.length);
  return [
    {
      check: 'won-route',
      severity: 'error',
      title: 'No chain of links leads from the start to the game won scene',
      detail: `Play starts in ${sceneName(game, first.toScene)}, and its links reach ${reached.length > 1 ? `${reached.length} scenes` : 'only that one'}${reached.length > 1 && reached.length <= 6 ? ` (${reached.map((n) => sceneName(game, n)).join(', ')})` : ''}. None of them has a link a hero can take to scene 1, so nobody can win. Give the last level a link to the game won scene.`,
      where: { scene: reached[reached.length - 1] ?? first.toScene },
    },
  ];
}
