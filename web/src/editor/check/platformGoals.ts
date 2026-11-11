// Static footing routes guide platform searches without treating empty air as a walkable shortcut.
import { BLEN, CHARBL, MONBL } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { MLEN, MWID } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { terrainStates } from './terrainStates';
import { INF_REPEAT, type World } from '@lewismoten/gamemaker-sandbox-engine/engine/world';

interface Guidance {
  normal: Uint16Array;
  boosted?: Uint16Array;
  abilities: number[];
}

/** Infer the movement mode from survivable, open terrain; opposite pulls cancel in PLAYGAME. */
export function directionalGravity(w: World): boolean {
  return [...new Set(w.map)].some((n) => {
    const b = w.bg[w.blkmap[n]];
    if (b.solid === 15 || (b.chHitPt < 0 && -b.chHitPt >= w.ci.hitpts)) return false;
    const g = b.grav;
    return !!(g & 1) !== !!(g & 4) || !!(g & 2) !== !!(g & 8);
  });
}

/** A held unlimited sequence can climb continuously rather than ending in a jump arc. */
export function continuousFlight(w: World): boolean {
  return w.chr.sequences.some(
    (s, q) =>
      q >= 5 &&
      !!s.key &&
      w.ci.seqon[q] &&
      w.ci.meter[q] === INF_REPEAT &&
      !s.norepeat &&
      !s.ground &&
      !s.frames.some((f) => f.pic2 === CHARBL + 1) &&
      s.frames.reduce((dy, f) => dy + (f.pic2 === MONBL ? 0 : f.y), 0) < 0,
  );
}

/** Relaxed jump/fall routes, optionally spending one finite jump; the engine verifies actual moves. */
export function platformGoals(w: World, goals: readonly number[]): Guidance | undefined {
  if (
    ![...new Set(w.map)].some((n) => {
      const g = w.bg[w.blkmap[n]].grav;
      return g & 4 && !(g & 1);
    })
  )
    return;
  if (continuousFlight(w)) return;
  const abilities: number[] = [];
  const bounds = (finite: boolean) => {
    let speed = 0,
      across = 0,
      rise = 0;
    for (let q = 5; q < w.chr.sequences.length; q++) {
      const s = w.chr.sequences[q];
      if (!s.key || !w.ci.seqon[q] || w.ci.meter[q] <= 0 || (!finite && w.ci.meter[q] !== INF_REPEAT)) continue;
      let total = 0,
        up = 0;
      for (const f of s.frames) {
        if (f.pic2 === CHARBL + 1) break;
        if (f.pic2 === MONBL) continue;
        across = Math.max(across, Math.abs(f.x));
        up = Math.max(up, -f.y);
        total += Math.max(0, -f.y);
      }
      speed = Math.max(speed, up);
      rise = Math.max(rise, Math.ceil(total / BLEN));
      if (finite && up && w.ci.meter[q] !== INF_REPEAT) abilities.push(q);
    }
    return {
      speed,
      rise: Math.min(32, Math.max(rise, Math.floor((speed * speed) / (2 * BLEN)))),
      reach: Math.min(20, Math.max(1, Math.ceil((2 * speed * across) / BLEN))),
    };
  };
  const normal = bounds(false),
    boosted = bounds(true);
  if (!boosted.speed) return;
  const count = MLEN * MWID;
  const cell = (x: number, y: number) => ((y + MWID) % MWID) * MLEN + ((x + MLEN) % MLEN);
  const terrain = terrainStates(w.bg);
  const blocked = (c: number) => !terrain.passable[w.blkmap[w.map[c]]];
  const support = (c: number) => terrain.support[w.blkmap[w.map[c]]];
  const nodes: number[] = [];
  const index = new Int32Array(count).fill(-1);
  for (let c = 0; c < count; c++)
    if (!blocked(c) && support((c + MLEN) % count)) {
      index[c] = nodes.length;
      nodes.push(c);
    }
  const target = new Set(goals);
  const build = ({ rise, reach }: { rise: number; reach: number }) => {
    const incoming: number[][] = nodes.map(() => []);
    const contacts = new Uint16Array(count).fill(0xffff);
    for (const from of nodes) {
      const x = from % MLEN,
        y = Math.floor(from / MLEN);
      if (target.has(from)) contacts[from] = 0;
      const ends = new Set<number>();
      let upGoal = false;
      let upClear = true;
      for (let lift = 0; lift <= rise; lift++) {
        const top = cell(x, y - lift);
        upClear &&= !blocked(top);
        upGoal ||= target.has(top);
        for (let dx = -reach; dx <= reach; dx++) {
          let clear = upClear,
            hit = upGoal;
          for (let step = 0; step <= Math.abs(dx); step++) {
            const at = cell(x + Math.sign(dx) * step, y - lift);
            if (blocked(at)) {
              clear = false;
              break;
            }
            hit ||= target.has(at);
          }
          // Ascending sideways can clear an overhang that blocks a vertical
          // launch. Check that arc too, rather than requiring up-then-across.
          if (!clear) {
            clear = true;
            hit = target.has(from);
            const steps = Math.max(Math.abs(dx), lift);
            for (let step = 1; step <= steps; step++) {
              const at = cell(x + Math.round((dx * step) / steps), y - Math.round((lift * step) / steps));
              if (blocked(at)) {
                clear = false;
                break;
              }
              hit ||= target.has(at);
            }
          }
          if (!clear) continue;
          if (hit) contacts[from] = Math.min(contacts[from], 1);
          for (let down = 1; down <= MWID; down++) {
            const at = cell(x + dx, y - lift + down);
            if (support(at)) {
              const landing = cell(x + dx, y - lift + down - 1);
              if (index[landing] >= 0 && landing !== from) ends.add(index[landing]);
              break;
            }
            if (blocked(at)) break;
            if (target.has(at)) contacts[from] = Math.min(contacts[from], 1);
          }
        }
      }
      for (const end of ends) incoming[end].push(from);
    }
    return { incoming, contacts };
  };
  const ordinary = build(normal);
  const propagate = (distance: Uint16Array, queue: number[]) => {
    queue.sort((a, b) => distance[a] - distance[b]);
    for (let head = 0; head < queue.length; head++) {
      const at = queue[head];
      for (const from of ordinary.incoming[index[at]])
        if (distance[from] > distance[at] + 1) {
          distance[from] = distance[at] + 1;
          queue.push(from);
        }
    }
    return distance;
  };
  const distance = propagate(
    ordinary.contacts,
    nodes.filter((c) => ordinary.contacts[c] !== 0xffff),
  );
  if (!abilities.length) return { normal: distance, abilities };
  const extra = build(boosted);
  const charged = distance.slice(),
    queue: number[] = [];
  const seed = (from: number, d: number) => {
    if (charged[from] > d) {
      charged[from] = d;
      queue.push(from);
    }
  };
  for (const c of nodes) {
    seed(c, extra.contacts[c]);
    if (distance[c] !== 0xffff) for (const from of extra.incoming[index[c]]) seed(from, distance[c] + 1);
  }
  // Before the finite jump, follow ordinary edges; after it, only ordinary routes remain.
  return { normal: distance, boosted: propagate(charged, queue), abilities };
}
