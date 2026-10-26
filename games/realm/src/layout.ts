// Keeping the scene graph drawable: the Game Integrator's Auto-arrange lays a game out from its
// links (which scene each one leads to first decides the tree it draws), and an RPG with forty
// scenes can come out with arrows crossing. This tries orders of a hub scene's links until the
// arrangement has no crossings, and stores the scene boxes where Auto-arrange puts them.
import { NOSCENE, type Game } from '../../../web/src/formats/game';
import { arrangements, layoutCost } from '../../../web/src/editor/editors/integrator/integratorLayout';

function crossings(g: Game): number {
  const pos = arrangements(g, 1)[0].positions;
  const pairs: [number, number][] = [];
  g.scenes.forEach((s, i) => {
    if (s.gametype === NOSCENE) return;
    for (const l of s.links) if (l.toScene !== NOSCENE && l.toScene !== i && g.scenes[l.toScene]) pairs.push([i, l.toScene]);
  });
  const centres = new Map([...pos].map(([s, p]) => [s, { x: p.x + 2, y: p.y + 2 }]));
  return layoutCost(pairs, centres, { w: 22, h: 18 }).cross;
}

/** Reorders `scene`'s links (grouped by where they lead) until nothing crosses; returns the crossings left. */
export function untangle(g: Game, scene: number, tries = 400): number {
  const links = g.scenes[scene].links;
  const used = links.filter((l) => l.toScene !== NOSCENE);
  const free = links.filter((l) => l.toScene === NOSCENE);
  let order = [...new Set(used.map((l) => l.toScene))];
  const apply = (o: number[]) => (g.scenes[scene].links = [...o.flatMap((t) => used.filter((l) => l.toScene === t)), ...free]);
  apply(order);
  let best = crossings(g);
  // deterministic: try moving each target to every other place, keep any improvement
  for (let round = 0; round < tries && best > 0; round++) {
    let improved = false;
    for (let i = 0; i < order.length && best > 0; i++)
      for (let j = 0; j < order.length && best > 0; j++) {
        if (i === j) continue;
        const o = [...order];
        const [x] = o.splice(i, 1);
        o.splice(j, 0, x);
        apply(o);
        const c = crossings(g);
        if (c < best) {
          best = c;
          order = o;
          improved = true;
        }
      }
    apply(order);
    if (!improved) break;
  }
  return best;
}
