// The level check's hidden exit: a link that leaves the scene, on a cell where nothing within one
// cell looks like a way out. The player has to see where they are going, and a link on plain
// wallpaper or floor ends the level when they wander onto it. Anything that stands out counts as
// a sign: a block used only near links (a door, sign, arrow, ladder, vehicle), open air, or the
// map's edge. The tool can't see a secret exit the author wants hidden.
import { LASTMM, MLEN, MWID } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { NOSCENE, type Game } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { at, type Finding } from '../findings';
import { blockUse, type SceneData } from '../sceneData';

/** A block used this many times per link (as levelExits.ts GROUND), and at least ALWAYS times, is the level's ground, not a mark. */
const GROUND = 3;
const ALWAYS = 150;
/** A block with no solid side that covers this many of the map's 10,000 cells is its sky. */
const SKY = 3000;

/** Links that leave a scene, but whose spot looks like the ordinary background around it. */
export function hiddenExits(game: Game, d: SceneData): Finding[] {
  const all = game.scenes[d.scene].links;
  const links = all.filter((l) => l.toScene !== NOSCENE && l.toScene !== d.scene && l.from.x >= 0 && l.from.x < MLEN && l.from.y >= 0 && l.from.y < MWID);
  if (!links.length) return [];
  const use = blockUse(d.map);
  const limit = Math.max(all.length * GROUND + 2, ALWAYS);
  const stands = (n: number) => {
    const b = d.bbl[n];
    return !!b && b.pixels.some((p) => p !== 255) && use[n] <= limit;
  };
  const out: Finding[] = [];
  const seen = new Set<number>();
  for (const l of links) {
    const { x, y } = l.from;
    const cell = y * MLEN + x;
    if (seen.has(cell)) continue;
    seen.add(cell);
    // the map's edge, or open sky, reads as a way out
    if (x <= 0 || y <= 0 || x >= MLEN - 1 || y >= MWID - 1) continue;
    let marked = false;
    for (let dy = -1; dy <= 1 && !marked; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        const c = cell + dy * MLEN + dx;
        const n = d.map.blocks[c];
        const b = d.bbl[n];
        // open sky: a block with no solid side and one flat color (or nothing drawn)
        const blank = !b || (!b.solid && (new Set(b.pixels).size <= 1 || use[n] > SKY));
        // a placed monster (a vehicle, a signpost) is something to see
        if (blank || stands(n) || d.map.mons[c] !== LASTMM) {
          marked = true;
          break;
        }
      }
    if (marked) continue;
    out.push({
      check: 'hidden-exit',
      severity: 'info',
      title: `The way out at ${at(cell)} is on plain background`,
      detail:
        'Nothing within a block of this link looks like a door, sign or arrow, so a player won’t know to walk there and may leave the level by accident, or not find the way out. Try a door, sign or arrow on or next to the link. The check can’t see a secret exit you want hidden; if it is one, dismiss this.',
      where: { scene: d.scene, map: d.names.map, cell },
    });
  }
  return out;
}
