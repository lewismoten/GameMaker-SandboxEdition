// The level check's block checks, from a scene's map and background blocks alone: hazard art
// that doesn't fill its cell, opposite blocks touching, touches that score or heal every tick,
// counters that can run out before the gate that reads them, timed blocks that make the hero
// wait, and birth blocks that never rest.
import { BACKBL, BLEN, type Block } from '../../../formats/blocks';
import { MLEN, MWID } from '../../../formats/map';
import { at, type Finding } from '../findings';
import { blockUse, topColors, type SceneData } from '../sceneData';

/** A tick of the game clock, and the three seconds a timed wait may last. */
export const TICK_S = 1 / 18.2;
export const WAIT_TICKS = 55;

const hurts = (b: Block) => b.chHitPt < 0;
/** A block the hero can be inside of (not walled on every side). */
const open = (b: Block) => b.solid !== 15;

/**
 * How much of a hazard block's cell its art covers: the share of its pixels that aren't the
 * colors of the open blocks the map uses most (the sky behind it), and the empty rows on top.
 */
export function hazardCoverage(b: Block, sky: Set<number>): { share: number; emptyTop: number } {
  let art = 0;
  let emptyTop = 0;
  let seen = false;
  for (let y = 0; y < BLEN; y++) {
    let row = 0;
    for (let x = 0; x < BLEN; x++) if (!sky.has(b.pixels[y * BLEN + x])) row++;
    art += row;
    if (row) seen = true;
    else if (!seen) emptyTop++;
  }
  return { share: art / (BLEN * BLEN), emptyTop };
}

/** The sky colors: the top colors of the three open, harmless blocks the map uses most. */
export function skyColors(d: SceneData): Set<number> {
  const use = blockUse(d.map);
  const plain = [...Array(BACKBL).keys()]
    .filter((n) => use[n] && open(d.bbl[n]) && !d.bbl[n].solid && !d.bbl[n].chHitPt && !d.bbl[n].scorePts)
    .sort((a, b) => use[b] - use[a])
    .slice(0, 3);
  return new Set(plain.flatMap((n) => topColors(d.bbl[n].pixels, 2)));
}

export function hazardArt(d: SceneData): Finding[] {
  const use = blockUse(d.map);
  const sky = skyColors(d);
  if (!sky.size) return [];
  const out: Finding[] = [];
  for (let n = 0; n < BACKBL; n++) {
    const b = d.bbl[n];
    if (!use[n] || !hurts(b) || b.solid === 15) continue;
    const { share, emptyTop } = hazardCoverage(b, sky);
    if (share >= 0.45 && emptyTop < 6) continue;
    out.push({
      check: 'hazard-art',
      severity: share < 0.25 || emptyTop >= 10 ? 'warning' : 'info',
      title: `Block ${n} hurts through its whole cell, but its art fills ${Math.round(share * 100)}% of it`,
      detail: emptyTop ? `The top ${emptyTop} of its 20 rows show only sky: the hero is hurt that far above it.` : undefined,
      where: { scene: d.scene, map: d.names.map, block: { file: d.names.bbl ?? '', n }, cells: cellsOf(d, n) },
      fix: 'fill-hazard',
    });
  }
  return out;
}

const cellsOf = (d: SceneData, n: number) => {
  const out: number[] = [];
  d.map.blocks.forEach((b, i) => b === n && out.push(i));
  return out;
};

/** Gravity bits that pull opposite ways: up (1) and down (4), right (2) and left (8). */
const opposite = (a: number, b: number) => (a & 1 && b & 4) || (a & 4 && b & 1) || (a & 2 && b & 8) || (a & 8 && b & 2);

export function opposites(d: SceneData): Finding[] {
  // the scene's ordinary pull (what its most used open block does) is the background, not a
  // special block: an updraft beside ordinary air is a design, a lift up beside a lift down is not
  const use = blockUse(d.map);
  let common = -1;
  for (let n = 0; n < BACKBL; n++) if (d.bbl[n].solid !== 15 && (common < 0 || use[n] > use[common])) common = n;
  const ordinary = common >= 0 ? d.bbl[common].grav : 0;
  const pairs = new Map<string, number[]>();
  for (let y = 0; y < MWID; y++)
    for (let x = 0; x < MLEN; x++) {
      const i = y * MLEN + x;
      const a = d.bbl[d.map.blocks[i]];
      for (const j of [x + 1 < MLEN ? i + 1 : -1, y + 1 < MWID ? i + MLEN : -1]) {
        if (j < 0) continue;
        const b = d.bbl[d.map.blocks[j]];
        // gravity only pulls where the hero can be: both blocks open
        if (a.solid === 15 || b.solid === 15 || a.grav === ordinary || b.grav === ordinary || !opposite(a.grav, b.grav)) continue;
        const k = [d.map.blocks[i], d.map.blocks[j]].sort((p, q) => p - q).join('+');
        pairs.set(k, [...(pairs.get(k) ?? []), i]);
      }
    }
  return [...pairs].map(([k, cells]) => ({
    check: 'opposites' as const,
    severity: 'warning' as const,
    title: `Blocks ${k.replace('+', ' and ')} pull opposite ways and touch in ${cells.length} place${cells.length === 1 ? '' : 's'}`,
    detail: `First at ${at(cells[0])}. Put a block of plain ground between them, or give them different colors.`,
    where: { scene: d.scene, map: d.names.map, cell: cells[0], cells },
  }));
}

export function everyTickBlocks(d: SceneData): Finding[] {
  const use = blockUse(d.map);
  const out: Finding[] = [];
  for (let n = 0; n < BACKBL; n++) {
    const b = d.bbl[n];
    if (!use[n] || b.obj || b.touchBl !== n || b.solid === 15) continue;
    const gives =
      b.scorePts > 0
        ? `${b.scorePts} points`
        : b.chHitPt > 0
          ? `${b.chHitPt} hit points`
          : b.effect > 2 && b.eamt > 0
            ? `${b.eamt} on counter ${b.effect}`
            : '';
    if (!gives) continue;
    out.push({
      check: 'every-tick',
      severity: 'warning',
      title: `Block ${n} gives ${gives} on every tick the hero touches it`,
      detail: 'It never turns into another block when touched, so standing on it farms it. Set “becomes when touched” to a plain block.',
      where: { scene: d.scene, map: d.names.map, block: { file: d.names.bbl ?? '', n }, cells: cellsOf(d, n) },
    });
  }
  return out;
}

/**
 * Counters (effects 3 and 20 up) the scene's blocks drain, refill and test at gates. Counters
 * carry on from scene to scene, so a gate is only called hopeless when nothing anywhere in the
 * game (`gives`: counters any block or monster of any scene adds to) fills its counter.
 */
export function counters(d: SceneData, gives: Set<number> = new Set()): Finding[] {
  const use = blockUse(d.map);
  const out: Finding[] = [];
  const effects = new Set(d.bbl.filter((b, n) => use[n] && (b.effect === 3 || b.effect >= 20)).map((b) => b.effect));
  for (const e of effects) {
    const blocks = d.bbl.map((b, n) => ({ b, n })).filter(({ b, n }) => use[n] && b.effect === e);
    const gates = blocks.filter(({ b }) => b.eamt < 0 && b.solid);
    const drains = blocks.filter(({ b, n }) => b.eamt < 0 && !b.solid && b.touchBl === n);
    // a refill that isn't used up when touched gives as much as the hero likes
    const gain = blocks.filter(({ b }) => b.eamt > 0).reduce((s, { b, n }) => s + (b.touchBl === n ? Infinity : b.eamt * use[n]), 0);
    // money and the ten special counters are kept one over what they show
    const start = d.chr.meter[e] - (e >= 20 || e === 3 ? 1 : 0);
    const need = gates.reduce((s, { b, n }) => s + -b.eamt * use[n], 0);
    if (gates.length && !gives.has(e) && start + gain < Math.min(...gates.map(({ b }) => -b.eamt))) {
      out.push({
        check: 'counters',
        severity: 'error',
        title: `Counter ${e} can never open its gate${gates.length > 1 ? 's' : ''} (block ${gates.map((g) => g.n).join(', ')})`,
        detail: `It starts at ${start} and the map gives ${gain} more; the cheapest gate takes ${Math.min(...gates.map(({ b }) => -b.eamt))}.`,
        where: { scene: d.scene, map: d.names.map, block: { file: d.names.bbl ?? '', n: gates[0].n }, cells: cellsOf(d, gates[0].n) },
      });
    } else if (gates.length && !gives.has(e) && start + gain < need)
      out.push({
        check: 'counters',
        severity: 'warning',
        title: `Counter ${e} can’t open every gate: they take ${need} in all and the scene gives ${start + gain}`,
        detail: 'Fine if the player chooses a way; a trap if every gate is on the way on.',
        where: { scene: d.scene, map: d.names.map, block: { file: d.names.bbl ?? '', n: gates[0].n }, cells: cellsOf(d, gates[0].n) },
      });
    for (const { b, n } of drains) {
      const ticks = start > 0 ? Math.ceil(start / -b.eamt) : 0;
      out.push({
        check: 'counters',
        severity: gain > 0 ? 'info' : 'warning',
        title: `Block ${n} drains counter ${e} on every tick: it runs out after ${(ticks * TICK_S).toFixed(1)} s in it`,
        detail: gain > 0 ? 'Blocks on the map fill it again; check one is in reach of the longest stretch.' : 'Nothing on the map fills it again.',
        where: { scene: d.scene, map: d.names.map, block: { file: d.names.bbl ?? '', n }, cells: cellsOf(d, n) },
      });
    }
  }
  return out;
}

/** A timed block's cycle: each block it shows in turn, and for how many ticks. */
export function blockCycle(bg: Block[], n: number): { n: number; ticks: number }[] {
  const out: { n: number; ticks: number }[] = [];
  let k = n;
  for (let i = 0; i < 40 && k < BACKBL; i++) {
    const b = bg[k];
    out.push({ n: k, ticks: Math.max(1, b.ntime) });
    if (b.ntime <= 0 || b.nextBl === k) return out.length > 1 ? out : [];
    k = b.nextBl;
    if (k === n) return out;
  }
  return [];
}

/** Timed blocks whose shut (solid or hurting) part lasts longer than three seconds. */
export function waits(d: SceneData): Finding[] {
  const use = blockUse(d.map);
  const out: Finding[] = [];
  const done = new Set<number>();
  for (let n = 0; n < BACKBL; n++) {
    if (!use[n] || done.has(n)) continue;
    const cycle = blockCycle(d.bbl, n);
    if (!cycle.length || cycle[cycle.length - 1].n === cycle[0].n) continue;
    cycle.forEach((c) => done.add(c.n));
    const shut = (c: { n: number }) => d.bbl[c.n].solid !== 0 || d.bbl[c.n].chHitPt < 0;
    if (!cycle.some(shut) || cycle.every(shut)) continue;
    // the longest run of shut steps, round the loop
    let best = 0;
    for (let s = 0; s < cycle.length; s++) {
      let t = 0;
      for (let i = 0; i < cycle.length && shut(cycle[(s + i) % cycle.length]); i++) t += cycle[(s + i) % cycle.length].ticks;
      best = Math.max(best, t);
    }
    if (best <= WAIT_TICKS) continue;
    out.push({
      check: 'waits',
      severity: best > WAIT_TICKS * 2 ? 'warning' : 'info',
      title: `Timed block ${n} stays shut for ${(best * TICK_S).toFixed(1)} s at a time`,
      detail: `Its cycle is blocks ${cycle.map((c) => `${c.n} (${c.ticks} ticks)`).join(' → ')}.`,
      where: { scene: d.scene, map: d.names.map, block: { file: d.names.bbl ?? '', n }, cells: cellsOf(d, n) },
      fix: 'shorten-cycle',
    });
  }
  return out;
}

export function births(d: SceneData): Finding[] {
  const use = blockUse(d.map);
  const out: Finding[] = [];
  for (let n = 0; n < BACKBL; n++) {
    const b = d.bbl[n];
    if (!use[n] || b.birthTime <= 0 || b.birthTime >= 36) continue;
    const m = d.mbl[d.mon[b.birthMon]?.pic[0]?.[0] ?? 255];
    if (m && m.chHitPt >= 0) continue;
    out.push({
      check: 'births',
      severity: b.birthTime < 18 ? 'warning' : 'info',
      title: `Block ${n} gives birth to monster ${b.birthMon} every ${(b.birthTime * TICK_S).toFixed(1)} s`,
      detail: 'It keeps on while the hero is near. Give it a longer time, or let the block animate to a quiet one.',
      where: { scene: d.scene, map: d.names.map, block: { file: d.names.bbl ?? '', n }, cells: cellsOf(d, n) },
    });
  }
  return out;
}

/** Counters that something in the game adds to: blocks of every scene, and the monsters' blocks. */
export function counterSources(scenes: SceneData[]): Set<number> {
  const out = new Set<number>();
  for (const d of scenes) for (const b of [...d.bbl, ...d.mbl]) if ((b.effect === 3 || b.effect >= 20) && b.eamt > 0) out.add(b.effect);
  return out;
}

export const blockChecks = [hazardArt, opposites, everyTickBlocks, waits, births];
